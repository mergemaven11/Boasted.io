"""Document this first-party Python module."""
from __future__ import annotations

import os
import re
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Callable

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

from app.auth import get_current_user
from app.database import (
    analytics_events_collection,
    client as mongo_client,
    entries_collection,
    impact_receipts_collection,
    ops_audit_collection,
    ops_events_collection,
    packet_export_audit_collection,
    resume_documents_collection,
    users_collection,
)
from app.ops_debug import recent_requests
from app.plans import PLAN_PRICING, get_entitlements_for_user, get_plan_for_user

router = APIRouter(prefix="/ops", tags=["ops"])

INTERNAL_ROLES = {"support", "ops", "security", "admin"}
COMPANY_DOMAIN = os.getenv("OPS_COMPANY_DOMAIN", "usebragstack.com").strip().lower()
BOOTSTRAP_ADMINS = {
    email.strip().lower()
    for email in os.getenv("OPS_ADMIN_EMAILS", "").split(",")
    if email.strip()
}


class InternalRoleUpdate(BaseModel):
    """Represent InternalRoleUpdate."""
    roles: list[str] = Field(default_factory=list, max_length=4)


def _email_is_company(email: str) -> bool:
    """Handle email is company."""
    normalized = (email or "").strip().lower()
    return bool(normalized) and normalized.endswith(f"@{COMPANY_DOMAIN}")


def _roles_for_user(user: dict) -> set[str]:
    """Handle roles for user."""
    email = (user.get("email") or "").strip().lower()
    roles = {str(role).strip().lower() for role in user.get("internal_roles", [])}
    roles &= INTERNAL_ROLES
    if email in BOOTSTRAP_ADMINS:
        roles.add("admin")
    return roles


def require_internal_role(*allowed_roles: str) -> Callable:
    """Handle require internal role."""
    allowed = {role.lower() for role in allowed_roles}

    async def dependency(current_user: dict = Depends(get_current_user)) -> dict:
        """Handle dependency."""
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
    """Handle safe user."""
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
    """Handle safe team member."""
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
    """Handle normalize roles."""
    normalized = {str(role).strip().lower() for role in roles}
    invalid = sorted(normalized - INTERNAL_ROLES)
    if invalid:
        raise HTTPException(status_code=422, detail=f"Unsupported internal role: {invalid[0]}")
    return sorted(normalized)


def _would_remove_last_admin(target: dict, next_roles: list[str]) -> bool:
    """Handle would remove last admin."""
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
    """Handle audit role change."""
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
    """Handle serialize event."""
    result = {key: value for key, value in event.items() if key != "_id"}
    if isinstance(result.get("created_at"), datetime):
        result["created_at"] = result["created_at"].isoformat()
    return result


def _percentage(numerator: int | float, denominator: int | float) -> float:
    """Return a stable percentage for founder analytics."""
    if not denominator:
        return 0.0
    return round((float(numerator) / float(denominator)) * 100, 1)


def _distinct_user_ids(collection, query: dict | None = None) -> set[str]:
    """Return non-empty user IDs from an activity collection."""
    return {str(value) for value in collection.distinct("user_id", query or {}) if value}


def _percentile(values: list[float], percentile: float) -> float:
    """Calculate a simple nearest-rank percentile without external dependencies."""
    if not values:
        return 0.0
    ordered = sorted(float(value) for value in values)
    index = max(0, min(len(ordered) - 1, round((len(ordered) - 1) * percentile)))
    return round(ordered[index], 1)


def _founder_analytics() -> dict:
    """Build product, growth, profile, packet, content, business, and API analytics from safe metadata."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)

    total_users = users_collection.count_documents({})
    new_users_today = users_collection.count_documents({"created_at": {"$gte": today_start.isoformat()}})
    new_users_7d = users_collection.count_documents({"created_at": {"$gte": week_ago.isoformat()}})

    entry_users = _distinct_user_ids(entries_collection)
    receipt_users = _distinct_user_ids(impact_receipts_collection)
    packet_users = _distinct_user_ids(packet_export_audit_collection)

    active_1d = (
        _distinct_user_ids(entries_collection, {"created_at": {"$gte": day_ago}})
        | _distinct_user_ids(impact_receipts_collection, {"created_at": {"$gte": day_ago}})
        | _distinct_user_ids(packet_export_audit_collection, {"generated_at": {"$gte": day_ago}})
    )
    active_7d = (
        _distinct_user_ids(entries_collection, {"created_at": {"$gte": week_ago}})
        | _distinct_user_ids(impact_receipts_collection, {"created_at": {"$gte": week_ago}})
        | _distinct_user_ids(packet_export_audit_collection, {"generated_at": {"$gte": week_ago}})
    )
    active_30d = (
        _distinct_user_ids(entries_collection, {"created_at": {"$gte": month_ago}})
        | _distinct_user_ids(impact_receipts_collection, {"created_at": {"$gte": month_ago}})
        | _distinct_user_ids(packet_export_audit_collection, {"generated_at": {"$gte": month_ago}})
    )

    published_profiles = users_collection.count_documents({"public_slug": {"$exists": True, "$nin": [None, ""]}})
    total_entries = entries_collection.count_documents({})
    total_receipts = impact_receipts_collection.count_documents({})
    total_packet_exports = packet_export_audit_collection.count_documents({})
    packet_exports_30d = packet_export_audit_collection.count_documents({"generated_at": {"$gte": month_ago}})

    evidence_receipts = impact_receipts_collection.count_documents({"evidence.0": {"$exists": True}})
    confirmed_receipts = impact_receipts_collection.count_documents({"confirmations": {"$elemMatch": {"status": "confirmed"}}})

    profile_view_query = {"event_type": "profile_view", "created_at": {"$gte": month_ago}}
    profile_views_30d = analytics_events_collection.count_documents(profile_view_query)
    unique_profile_visitors_30d = len({value for value in analytics_events_collection.distinct("visitor_id", profile_view_query) if value})
    booking_clicks_30d = analytics_events_collection.count_documents({"event_type": "open_to_talk_click", "created_at": {"$gte": month_ago}})
    outbound_clicks_30d = analytics_events_collection.count_documents(
        {
            "event_type": {"$in": ["open_to_talk_click", "github_click", "portfolio_click", "resume_click"]},
            "created_at": {"$gte": month_ago},
        }
    )

    cohort_users = {
        str(user["_id"])
        for user in users_collection.find(
            {"created_at": {"$gte": sixty_days_ago.isoformat(), "$lt": month_ago.isoformat()}},
            {"_id": 1},
        )
    }
    retained_cohort = cohort_users & active_30d

    packet_types = Counter()
    for item in packet_export_audit_collection.find({"generated_at": {"$gte": month_ago}}, {"packet_kind": 1}).limit(5000):
        packet_types[str(item.get("packet_kind") or "unknown")] += 1

    category_counts = Counter()
    skill_counts = Counter()
    for entry in entries_collection.find({}, {"category": 1, "tags": 1}).limit(5000):
        category = str(entry.get("category") or "").strip()
        if category:
            category_counts[category] += 1
        tags = entry.get("tags") or []
        if isinstance(tags, str):
            tags = [part.strip() for part in tags.split(",")]
        for tag in tags:
            normalized = str(tag).strip()
            if normalized:
                skill_counts[normalized] += 1
    for receipt in impact_receipts_collection.find({}, {"skills": 1}).limit(5000):
        for skill in receipt.get("skills", []) or []:
            normalized = str(skill).strip()
            if normalized:
                skill_counts[normalized] += 1

    pro_subscribers = users_collection.count_documents({"plan": "pro"})
    pro_monthly_price = float(PLAN_PRICING.get("pro", {}).get("monthly") or 0)
    cancellation_pending = users_collection.count_documents({"plan": "pro", "billing_cancel_at_period_end": True})
    former_subscribers = users_collection.count_documents(
        {"stripe_subscription_id": {"$exists": True, "$ne": ""}, "plan": {"$ne": "pro"}}
    )

    request_events = list(
        ops_events_collection.find({}, {"_id": 0, "method": 1, "path": 1, "status_code": 1, "duration_ms": 1})
        .sort("created_at", -1)
        .limit(5000)
    )
    request_durations = [float(event.get("duration_ms") or 0) for event in request_events]
    failed_requests = sum(1 for event in request_events if int(event.get("status_code") or 0) >= 400)
    server_errors = sum(1 for event in request_events if int(event.get("status_code") or 0) >= 500)
    endpoint_counts = Counter(f"{event.get('method') or 'REQUEST'} {event.get('path') or 'unknown'}" for event in request_events)
    endpoint_durations: dict[str, list[float]] = {}
    for event in request_events:
        key = f"{event.get('method') or 'REQUEST'} {event.get('path') or 'unknown'}"
        endpoint_durations.setdefault(key, []).append(float(event.get("duration_ms") or 0))
    slowest_endpoints = sorted(
        (
            {
                "endpoint": endpoint,
                "requests": len(durations),
                "p95_ms": _percentile(durations, 0.95),
                "average_ms": round(sum(durations) / len(durations), 1),
            }
            for endpoint, durations in endpoint_durations.items()
            if durations
        ),
        key=lambda item: item["p95_ms"],
        reverse=True,
    )[:8]

    return {
        "users": {
            "total": total_users,
            "new_today": new_users_today,
            "new_7d": new_users_7d,
            "active_creators_1d": len(active_1d),
            "active_creators_7d": len(active_7d),
            "active_creators_30d": len(active_30d),
            "stickiness_dau_mau": _percentage(len(active_1d), len(active_30d)),
            "activation_rate": _percentage(len(entry_users), total_users),
            "receipt_adoption_rate": _percentage(len(receipt_users), len(entry_users)),
            "packet_adoption_rate": _percentage(len(packet_users), len(entry_users)),
            "public_profile_rate": _percentage(published_profiles, total_users),
            "retention_30d_cohort_rate": _percentage(len(retained_cohort), len(cohort_users)) if cohort_users else None,
            "retention_30d_cohort_size": len(cohort_users),
        },
        "funnel": {
            "signed_up": total_users,
            "first_accomplishment": len(entry_users),
            "first_impact_receipt": len(receipt_users),
            "packet_generated": len(packet_users),
            "public_profile_published": published_profiles,
        },
        "engagement": {
            "average_accomplishments_per_user": round(total_entries / total_users, 2) if total_users else 0.0,
            "average_receipts_per_activated_user": round(total_receipts / len(entry_users), 2) if entry_users else 0.0,
            "evidence_attachment_rate": _percentage(evidence_receipts, total_receipts),
            "confirmation_rate": _percentage(confirmed_receipts, total_receipts),
        },
        "profiles": {
            "views_30d": profile_views_30d,
            "unique_visitors_30d": unique_profile_visitors_30d,
            "open_to_talk_clicks_30d": booking_clicks_30d,
            "outbound_cta_clicks_30d": outbound_clicks_30d,
            "open_to_talk_conversion_rate": _percentage(booking_clicks_30d, profile_views_30d),
        },
        "packets": {
            "generated_all_time": total_packet_exports,
            "generated_30d": packet_exports_30d,
            "popular_types_30d": [{"packet_kind": kind, "count": count} for kind, count in packet_types.most_common(6)],
        },
        "content": {
            "top_skills": [{"name": name, "count": count} for name, count in skill_counts.most_common(10)],
            "top_categories": [{"name": name, "count": count} for name, count in category_counts.most_common(10)],
        },
        "business": {
            "pro_subscribers": pro_subscribers,
            "pro_monthly_price": pro_monthly_price,
            "mrr": round(pro_subscribers * pro_monthly_price, 2),
            "cancellation_pending": cancellation_pending,
            "cancellation_pending_rate": _percentage(cancellation_pending, pro_subscribers),
            "former_subscribers": former_subscribers,
        },
        "api": {
            "sample_size": len(request_events),
            "error_rate": _percentage(failed_requests, len(request_events)),
            "server_error_rate": _percentage(server_errors, len(request_events)),
            "p50_ms": _percentile(request_durations, 0.50),
            "p95_ms": _percentile(request_durations, 0.95),
            "p99_ms": _percentile(request_durations, 0.99),
            "top_endpoints": [{"endpoint": endpoint, "requests": count} for endpoint, count in endpoint_counts.most_common(8)],
            "slowest_endpoints": slowest_endpoints,
        },
        "generated_at": now.isoformat(),
    }


@router.get("/access")
def access(current_user: dict = Depends(require_internal_role(*INTERNAL_ROLES))):
    """Handle access."""
    return {
        "authorized": True,
        "roles": current_user.get("_effective_internal_roles", []),
        "environment": os.getenv("RENDER_SERVICE_NAME") or os.getenv("APP_ENV") or "local",
    }


@router.get("/overview")
def overview(current_user: dict = Depends(require_internal_role("ops", "security", "admin"))):
    """Handle overview."""
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
        "analytics": _founder_analytics(),
    }


@router.get("/observability")
def persistent_observability(current_user: dict = Depends(require_internal_role("ops", "security", "admin"))):
    """Handle persistent observability."""
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
    """Handle user diagnostics."""
    del current_user
    normalized = email.strip().lower()
    user = users_collection.find_one({"email": normalized})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _safe_user(user)


@router.get("/team")
def list_internal_team(current_user: dict = Depends(require_internal_role("admin"))):
    """Handle list internal team."""
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
    """Handle update internal roles."""
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
    """Handle list ops audit."""
    del current_user
    events = []
    for event in ops_audit_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(50):
        if isinstance(event.get("created_at"), datetime):
            event["created_at"] = event["created_at"].isoformat()
        events.append(event)
    return {"events": events}
