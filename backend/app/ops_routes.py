from __future__ import annotations

import os
from collections import Counter
from typing import Callable

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import PyMongoError

from app.auth import get_current_user
from app.database import (
    client as mongo_client,
    entries_collection,
    impact_receipts_collection,
    resume_documents_collection,
    users_collection,
)
from app.ops_debug import recent_requests
from app.plans import get_entitlements_for_user, get_plan_for_user

router = APIRouter(prefix="/ops", tags=["ops"])

INTERNAL_ROLES = {"support", "ops", "security", "admin"}
COMPANY_DOMAIN = os.getenv("OPS_COMPANY_DOMAIN", "usebragstack.com").strip().lower()
BOOTSTRAP_ADMINS = {
    email.strip().lower()
    for email in os.getenv("OPS_ADMIN_EMAILS", "").split(",")
    if email.strip()
}


def _email_is_company(email: str) -> bool:
    normalized = (email or "").strip().lower()
    return bool(normalized) and normalized.endswith(f"@{COMPANY_DOMAIN}")


def _roles_for_user(user: dict) -> set[str]:
    email = (user.get("email") or "").strip().lower()
    roles = {str(role).strip().lower() for role in user.get("internal_roles", [])}
    roles &= INTERNAL_ROLES
    if email in BOOTSTRAP_ADMINS:
        roles.add("admin")
    return roles


def require_internal_role(*allowed_roles: str) -> Callable:
    allowed = {role.lower() for role in allowed_roles}

    async def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        email = (current_user.get("email") or "").strip().lower()
        roles = _roles_for_user(current_user)
        if not _email_is_company(email) or not roles.intersection(allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Internal operations access is not authorized for this account.",
            )
        user = dict(current_user)
        user["_effective_internal_roles"] = sorted(roles)
        return user

    return dependency


def _safe_user(user: dict) -> dict:
    user_id = str(user.get("_id", ""))
    return {
        "id": user_id,
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "email_verified": bool(user.get("email_verified_at"))
        or not user.get("email_verification_required", False),
        "plan": get_plan_for_user(user),
        "entitlements": get_entitlements_for_user(user),
        "created_at": user.get("created_at"),
        "counts": {
            "entries": entries_collection.count_documents({"user_id": user_id}),
            "impact_receipts": impact_receipts_collection.count_documents({"user_id": user_id}),
            "resume_documents": resume_documents_collection.count_documents({"user_id": user_id}),
        },
    }


@router.get("/access")
def access(current_user: dict = Depends(require_internal_role(*INTERNAL_ROLES))):
    return {
        "authorized": True,
        "roles": current_user.get("_effective_internal_roles", []),
        "environment": os.getenv("RENDER_SERVICE_NAME") or os.getenv("APP_ENV") or "local",
    }


@router.get("/overview")
def overview(current_user: dict = Depends(require_internal_role("ops", "security", "admin"))):
    del current_user
    mongo_status = "ok"
    try:
        mongo_client.admin.command("ping")
    except PyMongoError:
        mongo_status = "degraded"

    requests = recent_requests(200)
    statuses = Counter(str(item["status_code"])[0] + "xx" for item in requests)
    slow = [item for item in requests if item["duration_ms"] >= 500][:25]
    failures = [item for item in requests if item["status_code"] >= 400][:50]

    return {
        "service": {
            "name": os.getenv("RENDER_SERVICE_NAME", "bragstack-api"),
            "environment": os.getenv("APP_ENV") or ("production" if os.getenv("RENDER") else "local"),
            "version": os.getenv("RENDER_GIT_COMMIT", "local")[:12],
            "mongo": mongo_status,
        },
        "database": {
            "users": users_collection.count_documents({}),
            "entries": entries_collection.count_documents({}),
            "impact_receipts": impact_receipts_collection.count_documents({}),
            "resume_documents": resume_documents_collection.count_documents({}),
        },
        "requests": {
            "sample_size": len(requests),
            "status_classes": dict(statuses),
            "slow": slow,
            "failures": failures,
            "recent": requests[:50],
        },
    }


@router.get("/users")
def user_diagnostics(
    email: str = Query(min_length=3, max_length=254),
    current_user: dict = Depends(require_internal_role("support", "ops", "security", "admin")),
):
    del current_user
    normalized = email.strip().lower()
    user = users_collection.find_one({"email": normalized})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _safe_user(user)
