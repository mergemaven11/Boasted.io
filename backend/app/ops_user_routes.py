"""Document this first-party Python module."""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth_routes import FRONTEND_URL, _issue_verification_token, _send_verification_email
from app.database import (
    analytics_events_collection,
    entries_collection,
    impact_receipts_collection,
    ops_audit_collection,
    packet_export_audit_collection,
    resume_documents_collection,
    users_collection,
)
from app.ops_routes import require_internal_role
from app.plans import get_plan_for_user

router = APIRouter(prefix="/ops/user-directory", tags=["ops"])


def _safe_summary(user: dict) -> dict:
    """Handle safe summary."""
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


def _as_datetime(value) -> datetime | None:
    """Normalize MongoDB datetime or ISO string values to UTC."""
    if isinstance(value, datetime):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
    if isinstance(value, str) and value.strip():
        try:
            parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
            return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)
        except ValueError:
            return None
    return None


def _iso(value) -> str | None:
    """Serialize a datetime-like value when possible."""
    parsed = _as_datetime(value)
    return parsed.isoformat() if parsed else None


def _elapsed_hours(start, end) -> float | None:
    """Return elapsed hours between two datetime-like values."""
    start_dt = _as_datetime(start)
    end_dt = _as_datetime(end)
    if start_dt is None or end_dt is None or end_dt < start_dt:
        return None
    return round((end_dt - start_dt).total_seconds() / 3600, 1)


def _percentage(numerator: int | float, denominator: int | float) -> float:
    """Return a stable percentage."""
    if not denominator:
        return 0.0
    return round((float(numerator) / float(denominator)) * 100, 1)


def _first(collection, query: dict, field: str) -> dict | None:
    """Return the oldest matching activity document."""
    return collection.find_one(query, {field: 1}, sort=[(field, 1)])


def _latest(collection, query: dict, field: str) -> dict | None:
    """Return the newest matching activity document."""
    return collection.find_one(query, {field: 1}, sort=[(field, -1)])


def _user_analytics(user: dict) -> dict:
    """Build an internal, non-judgmental career-evidence analytics summary for one user."""
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    entry_query = {"user_id": user_id}
    receipt_query = {"user_id": user_id}
    packet_query = {"user_id": user_id}

    entry_count = entries_collection.count_documents(entry_query)
    receipt_count = impact_receipts_collection.count_documents(receipt_query)
    packet_count = packet_export_audit_collection.count_documents(packet_query)
    resume_count = resume_documents_collection.count_documents({"user_id": user_id})
    public_entry_count = entries_collection.count_documents({"user_id": user_id, "is_public": True})
    public_receipt_count = impact_receipts_collection.count_documents({"user_id": user_id, "is_public": True})
    evidence_receipts = impact_receipts_collection.count_documents({"user_id": user_id, "evidence.0": {"$exists": True}})
    confirmed_receipts = impact_receipts_collection.count_documents(
        {"user_id": user_id, "confirmations": {"$elemMatch": {"status": "confirmed"}}}
    )

    first_entry = _first(entries_collection, entry_query, "created_at")
    first_receipt = _first(impact_receipts_collection, receipt_query, "created_at")
    first_packet = _first(packet_export_audit_collection, packet_query, "generated_at")
    latest_entry = _latest(entries_collection, entry_query, "updated_at") or _latest(entries_collection, entry_query, "created_at")
    latest_receipt = _latest(impact_receipts_collection, receipt_query, "updated_at") or _latest(impact_receipts_collection, receipt_query, "created_at")
    latest_packet = _latest(packet_export_audit_collection, packet_query, "generated_at")

    activity_dates = [
        _as_datetime((latest_entry or {}).get("updated_at") or (latest_entry or {}).get("created_at")),
        _as_datetime((latest_receipt or {}).get("updated_at") or (latest_receipt or {}).get("created_at")),
        _as_datetime((latest_packet or {}).get("generated_at")),
    ]
    last_active = max((value for value in activity_dates if value is not None), default=None)

    if last_active is None:
        dormancy = "never_activated"
    else:
        age_days = (now - last_active).days
        if age_days < 14:
            dormancy = "active"
        elif age_days < 45:
            dormancy = "cooling"
        elif age_days < 90:
            dormancy = "dormant"
        else:
            dormancy = "inactive"

    if not entry_count:
        activation_status = "not_activated"
    elif not receipt_count:
        activation_status = "capturing"
    elif not packet_count:
        activation_status = "proof_building"
    elif not user.get("public_slug"):
        activation_status = "packaging"
    else:
        activation_status = "published"

    profile_fields = [
        "name",
        "headline",
        "bio",
        "location",
        "avatar_url",
        "github_url",
        "portfolio_url",
        "resume_url",
        "public_slug",
    ]
    completed_profile_fields = sum(1 for field in profile_fields if str(user.get(field) or "").strip())
    profile_completeness = _percentage(completed_profile_fields, len(profile_fields))

    score = 0.0
    score += (completed_profile_fields / len(profile_fields)) * 15
    score += 20 if entry_count else 0
    score += 20 if receipt_count else 0
    score += 15 if evidence_receipts else 0
    score += 10 if confirmed_receipts else 0
    score += 10 if packet_count else 0
    score += 10 if user.get("public_slug") else 0
    evidence_score = round(min(100.0, score), 0)

    profile_view_query = {
        "user_id": user_id,
        "event_type": "profile_view",
        "created_at": {"$gte": month_ago},
    }
    profile_views = analytics_events_collection.count_documents(profile_view_query)
    unique_visitors = len(
        {
            value
            for value in analytics_events_collection.distinct("visitor_id", profile_view_query)
            if value
        }
    )
    open_to_talk_clicks = analytics_events_collection.count_documents(
        {"user_id": user_id, "event_type": "open_to_talk_click", "created_at": {"$gte": month_ago}}
    )
    outbound_clicks = analytics_events_collection.count_documents(
        {
            "user_id": user_id,
            "event_type": {"$in": ["open_to_talk_click", "github_click", "portfolio_click", "resume_click"]},
            "created_at": {"$gte": month_ago},
        }
    )

    skill_values: set[str] = set()
    for entry in entries_collection.find(entry_query, {"tags": 1}).limit(1000):
        tags = entry.get("tags") or []
        if isinstance(tags, str):
            tags = [part.strip() for part in tags.split(",")]
        skill_values.update(str(tag).strip().lower() for tag in tags if str(tag).strip())
    for receipt in impact_receipts_collection.find(receipt_query, {"skills": 1}).limit(1000):
        skill_values.update(str(skill).strip().lower() for skill in receipt.get("skills", []) if str(skill).strip())

    joined_at = user.get("created_at")
    first_entry_at = (first_entry or {}).get("created_at")
    first_receipt_at = (first_receipt or {}).get("created_at")
    first_packet_at = (first_packet or {}).get("generated_at")

    journey = [
        {"event": "joined", "at": _iso(joined_at)},
        {"event": "first_accomplishment", "at": _iso(first_entry_at)},
        {"event": "first_impact_receipt", "at": _iso(first_receipt_at)},
        {"event": "first_packet", "at": _iso(first_packet_at)},
    ]
    if user.get("public_slug"):
        journey.append({"event": "public_profile_published", "at": None})

    return {
        "user_id": user_id,
        "activation_status": activation_status,
        "dormancy_status": dormancy,
        "last_active_at": last_active.isoformat() if last_active else None,
        "account_age_days": max(0, (now - _as_datetime(joined_at)).days) if _as_datetime(joined_at) else None,
        "time_to_first_value": {
            "first_accomplishment_hours": _elapsed_hours(joined_at, first_entry_at),
            "first_impact_receipt_hours": _elapsed_hours(joined_at, first_receipt_at),
            "first_packet_hours": _elapsed_hours(joined_at, first_packet_at),
        },
        "career_evidence_score": evidence_score,
        "profile_completeness": profile_completeness,
        "evidence": {
            "accomplishments": entry_count,
            "impact_receipts": receipt_count,
            "packets": packet_count,
            "resume_documents": resume_count,
            "public_accomplishments": public_entry_count,
            "public_receipts": public_receipt_count,
            "skills_documented": len(skill_values),
            "evidence_attachment_rate": _percentage(evidence_receipts, receipt_count),
            "confirmation_rate": _percentage(confirmed_receipts, receipt_count),
        },
        "profile_engagement_30d": {
            "views": profile_views,
            "unique_visitors": unique_visitors,
            "outbound_cta_clicks": outbound_clicks,
            "open_to_talk_clicks": open_to_talk_clicks,
            "open_to_talk_conversion_rate": _percentage(open_to_talk_clicks, profile_views),
        },
        "feature_adoption": {
            "accomplishments": bool(entry_count),
            "impact_receipts": bool(receipt_count),
            "evidence": bool(evidence_receipts),
            "confirmed_proof": bool(confirmed_receipts),
            "packets": bool(packet_count),
            "resume_builder": bool(resume_count),
            "public_profile": bool(user.get("public_slug")),
            "open_to_talk": bool(user.get("open_to_talk")),
        },
        "journey": journey,
    }


@router.get("")
def list_users(
    q: str = Query(default="", max_length=120),
    plan: str = Query(default="all", pattern="^(all|free|pro)$"),
    verified: str = Query(default="all", pattern="^(all|yes|no)$"),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: dict = Depends(require_internal_role("support", "ops", "security", "admin")),
):
    """Handle list users."""
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


@router.get("/{user_id}/analytics")
def get_user_analytics(
    user_id: str,
    current_user: dict = Depends(require_internal_role("support", "ops", "security", "admin")),
):
    """Return deeper career-evidence analytics for one account without exposing private content."""
    del current_user
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    target = users_collection.find_one({"_id": ObjectId(user_id)})
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_analytics(target)


@router.post("/{user_id}/resend-verification")
async def resend_verification_email(
    user_id: str,
    current_user: dict = Depends(require_internal_role("support", "ops", "security", "admin")),
):
    """Handle resend verification email."""
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
