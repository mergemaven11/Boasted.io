from __future__ import annotations

import re
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth_routes import FRONTEND_URL, _issue_verification_token, _send_verification_email
from app.database import (
    entries_collection,
    impact_receipts_collection,
    ops_audit_collection,
    resume_documents_collection,
    users_collection,
)
from app.ops_routes import require_internal_role
from app.plans import get_plan_for_user

router = APIRouter(prefix="/ops/user-directory", tags=["ops"])


def _safe_summary(user: dict) -> dict:
    user_id = str(user.get("_id", ""))
    return {
        "id": user_id,
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "email_verified": bool(user.get("email_verified_at")) or not user.get("email_verification_required", False),
        "plan": get_plan_for_user(user),
        "created_at": user.get("created_at"),
        "public_slug": user.get("public_slug"),
        "counts": {
            "entries": entries_collection.count_documents({"user_id": user_id}),
            "impact_receipts": impact_receipts_collection.count_documents({"user_id": user_id}),
            "resume_documents": resume_documents_collection.count_documents({"user_id": user_id}),
        },
    }


@router.get("")
def list_users(
    q: str = Query(default="", max_length=120),
    plan: str = Query(default="all", pattern="^(all|free|pro)$"),
    verified: str = Query(default="all", pattern="^(all|yes|no)$"),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: dict = Depends(require_internal_role("support", "ops", "security", "admin")),
):
    del current_user
    filters: dict = {}
    query = q.strip()
    if query:
        safe = re.escape(query)
        filters["$or"] = [
            {"email": {"$regex": safe, "$options": "i"}},
            {"name": {"$regex": safe, "$options": "i"}},
            {"public_slug": {"$regex": safe, "$options": "i"}},
        ]

    users = list(users_collection.find(filters).sort("created_at", -1).limit(limit))
    summaries = [_safe_summary(user) for user in users]
    if plan != "all":
        summaries = [user for user in summaries if user["plan"] == plan]
    if verified != "all":
        expected = verified == "yes"
        summaries = [user for user in summaries if user["email_verified"] is expected]

    return {"users": summaries, "count": len(summaries), "limit": limit}


@router.post("/{user_id}/resend-verification")
async def resend_verification_email(
    user_id: str,
    current_user: dict = Depends(require_internal_role("support", "ops", "security", "admin")),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    target = users_collection.find_one({"_id": ObjectId(user_id)})
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if target.get("email_verified_at") or not target.get("email_verification_required", False):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This account is already verified.")

    email = (target.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="This account does not have a valid email address.")

    raw_token, _ = _issue_verification_token(target)
    await _send_verification_email(email, f"{FRONTEND_URL}/login#verify_token={raw_token}")

    sent_at = datetime.now(timezone.utc)
    ops_audit_collection.insert_one(
        {
            "event": "verification_email_resent",
            "actor_user_id": str(current_user.get("_id", "")),
            "actor_email": (current_user.get("email") or "").strip().lower(),
            "target_user_id": str(target.get("_id", "")),
            "target_email": email,
            "created_at": sent_at,
        }
    )
    return {
        "message": "Verification email sent.",
        "user_id": str(target.get("_id", "")),
        "email": email,
        "sent_at": sent_at.isoformat(),
    }
