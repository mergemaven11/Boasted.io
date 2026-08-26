from __future__ import annotations

import re
from fastapi import APIRouter, Depends, Query

from app.database import entries_collection, impact_receipts_collection, resume_documents_collection, users_collection
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
