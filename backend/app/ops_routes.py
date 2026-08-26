from __future__ import annotations

import os
import re
from collections import Counter
from datetime import datetime, timezone
from typing import Callable

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

from app.auth import get_current_user
from app.database import (
    client as mongo_client,
    entries_collection,
    impact_receipts_collection,
    ops_audit_collection,
    ops_events_collection,
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


class InternalRoleUpdate(BaseModel):
    roles: list[str] = Field(default_factory=list, max_length=4)


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


def _safe_team_member(user: dict) -> dict:
    email = (user.get("email") or "").strip().lower()
    stored_roles = sorted({str(role).strip().lower() for role in user.get("internal_roles", [])} & INTERNAL_ROLES)
    effective_roles = sorted(_roles_for_user(user))
    return {
        "id": str(user.get("_id", "")),
        "email": email,
        "name": user.get("name", ""),
        "roles": stored_roles,
        "effective_roles": effective_roles,
        "bootstrap_admin": email in BOOTSTRAP_ADMINS,
    }


def _normalize_roles(roles: list[str]) -> list[str]:
    normalized = {str(role).strip().lower() for role in roles}
    invalid = sorted(normalized - INTERNAL_ROLES)
    if invalid:
        raise HTTPException(status_code=422, detail=f"Unsupported internal role: {invalid[0]}")
    return sorted(normalized)


def _would_remove_last_admin(target: dict, next_roles: list[str]) -> bool:
    email = (target.get("email") or "").strip().lower()
    if email in BOOTSTRAP_ADMINS or "admin" in next_roles:
        return False
    current_roles = {str(role).strip().lower() for role in target.get("internal_roles", [])}
    if "admin" not in current_roles:
        return False
    if BOOTSTRAP_ADMINS:
        return False
    return users_collection.count_documents({"internal_roles": "admin"}) <= 1


def _audit_role_change(*, actor: dict, target: dict, previous_roles: list[str], next_roles: list[str]) -> None:
    ops_audit_collection.insert_one(
        {
            "event": "internal_roles_updated",
            "actor_user_id": str(actor.get("_id", "")),
            "actor_email": (actor.get("email") or "").strip().lower(),
            "target_user_id": str(target.get("_id", "")),
            "target_email": (target.get("email") or "").strip().lower(),
            "previous_roles": previous_roles,
            "next_roles": next_roles,
            "created_at": datetime.now(timezone.utc),
        }
    )


def _serialize_event(event: dict) -> dict:
    result = {key: value for key, value in event.items() if key != "_id"}
    if isinstance(result.get("created_at"), datetime):
        result["created_at"] = result["created_at"].isoformat()
    return result


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


@router.get("/observability")
def persistent_observability(
    current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    del current_user
    raw_events = list(ops_events_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(500))
    events = [_serialize_event(event) for event in raw_events]
    statuses = Counter(str(event.get("status_code", 0))[0] + "xx" for event in events if event.get("status_code"))
    failures = [event for event in events if int(event.get("status_code", 0)) >= 400][:100]
    slow = [event for event in events if float(event.get("duration_ms", 0)) >= 500][:50]
    grouped_errors: dict[str, dict] = {}
    for event in events:
        fingerprint = event.get("error_fingerprint")
        if not fingerprint:
            continue
        group = grouped_errors.setdefault(
            fingerprint,
            {
                "fingerprint": fingerprint,
                "error_type": event.get("error_type") or "UnknownError",
                "path": event.get("path"),
                "method": event.get("method"),
                "count": 0,
                "last_seen": event.get("created_at"),
                "version": event.get("version"),
            },
        )
        group["count"] += 1
    errors = sorted(grouped_errors.values(), key=lambda item: item["count"], reverse=True)[:50]
    return {
        "retention_days": 14,
        "sample_size": len(events),
        "status_classes": dict(statuses),
        "failures": failures,
        "slow": slow,
        "errors": errors,
        "recent": events[:100],
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


@router.get("/team")
def list_internal_team(current_user: dict = Depends(require_internal_role("admin"))):
    del current_user
    domain_pattern = re.compile(rf"@{re.escape(COMPANY_DOMAIN)}$", re.IGNORECASE)
    members = users_collection.find(
        {"email": domain_pattern},
        {"email": 1, "name": 1, "internal_roles": 1},
    ).sort("email", 1).limit(100)
    return {"members": [_safe_team_member(member) for member in members], "allowed_roles": sorted(INTERNAL_ROLES)}


@router.patch("/team/{user_id}/roles")
def update_internal_roles(
    user_id: str,
    payload: InternalRoleUpdate,
    current_user: dict = Depends(require_internal_role("admin")),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=404, detail="Internal team member not found")

    target = users_collection.find_one({"_id": ObjectId(user_id)})
    if target is None or not _email_is_company(target.get("email", "")):
        raise HTTPException(status_code=404, detail="Internal team member not found")

    next_roles = _normalize_roles(payload.roles)
    previous_roles = sorted({str(role).strip().lower() for role in target.get("internal_roles", [])} & INTERNAL_ROLES)

    if _would_remove_last_admin(target, next_roles):
        raise HTTPException(status_code=409, detail="At least one BragStack admin must remain assigned.")

    users_collection.update_one({"_id": target["_id"]}, {"$set": {"internal_roles": next_roles}})
    _audit_role_change(actor=current_user, target=target, previous_roles=previous_roles, next_roles=next_roles)

    updated = dict(target)
    updated["internal_roles"] = next_roles
    return _safe_team_member(updated)


@router.get("/audit")
def list_ops_audit(current_user: dict = Depends(require_internal_role("admin"))):
    del current_user
    events = []
    for event in ops_audit_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(50):
        if isinstance(event.get("created_at"), datetime):
            event["created_at"] = event["created_at"].isoformat()
        events.append(event)
    return {"events": events}
