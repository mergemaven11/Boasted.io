from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

FREE_ENTRY_LIMIT = 5
FREE_IMPACT_RECEIPT_LIMIT = 1
INTERNAL_EMAIL_DOMAIN = "usebragstack.com"

PLAN_PRICING: dict[str, dict[str, Any]] = {
    "free": {"monthly": 0, "label": "Free"},
    "pro": {"monthly": 9, "label": "Pro"},
    "team": {"monthly_per_user": 15, "minimum_seats": 3, "label": "Team"},
    "enterprise": {"monthly": None, "label": "Enterprise"},
}

PLAN_FEATURES: dict[str, dict[str, Any]] = {
    "free": {
        "max_entries": FREE_ENTRY_LIMIT,
        "max_impact_receipts": FREE_IMPACT_RECEIPT_LIMIT,
        "advanced_reports": False,
        "performance_review_builder": False,
        "promotion_packet": False,
        "interview_packet": False,
        "interview_practice": False,
        "resume_builder": False,
        "certification_packet": False,
        "integrations": False,
        "advanced_public_analytics": False,
        "export_pdf": False,
        "team_review_packets": False,
        "shared_templates": False,
        "manager_verification": False,
        "org_analytics": False,
        "sso": False,
        "audit_logs": False,
        "retention_controls": False,
    },
    "pro": {
        "max_entries": None,
        "max_impact_receipts": None,
        "advanced_reports": True,
        "performance_review_builder": True,
        "promotion_packet": True,
        "interview_packet": True,
        "interview_practice": True,
        "resume_builder": True,
        "certification_packet": True,
        "integrations": True,
        "advanced_public_analytics": True,
        "export_pdf": True,
        "team_review_packets": False,
        "shared_templates": False,
        "manager_verification": False,
        "org_analytics": False,
        "sso": False,
        "audit_logs": False,
        "retention_controls": False,
    },
    "team": {
        "max_entries": None,
        "max_impact_receipts": None,
        "advanced_reports": True,
        "performance_review_builder": True,
        "promotion_packet": True,
        "interview_packet": True,
        "interview_practice": True,
        "resume_builder": True,
        "certification_packet": True,
        "integrations": True,
        "advanced_public_analytics": True,
        "export_pdf": True,
        "team_review_packets": True,
        "shared_templates": True,
        "manager_verification": True,
        "org_analytics": True,
        "sso": False,
        "audit_logs": False,
        "retention_controls": False,
    },
    "enterprise": {
        "max_entries": None,
        "max_impact_receipts": None,
        "advanced_reports": True,
        "performance_review_builder": True,
        "promotion_packet": True,
        "interview_packet": True,
        "interview_practice": True,
        "resume_builder": True,
        "certification_packet": True,
        "integrations": True,
        "advanced_public_analytics": True,
        "export_pdf": True,
        "team_review_packets": True,
        "shared_templates": True,
        "manager_verification": True,
        "org_analytics": True,
        "sso": True,
        "audit_logs": True,
        "retention_controls": True,
    },
}


def normalize_plan(plan: str | None) -> str:
    normalized = (plan or "free").strip().lower()
    return normalized if normalized in PLAN_FEATURES else "free"


def is_internal_user(user: dict) -> bool:
    """Verified BragStack company identities get full internal feature access."""
    email = (user.get("email") or "").strip().lower()
    if not email.endswith(f"@{INTERNAL_EMAIL_DOMAIN}"):
        return False
    return bool(user.get("email_verified_at")) or not user.get("email_verification_required", False)


def get_plan_for_user(user: dict) -> str:
    """Internal users present as Pro so existing UI plan checks behave correctly."""
    if is_internal_user(user):
        return "pro"
    return normalize_plan(user.get("plan"))


def get_entitlements_for_user(user: dict) -> dict[str, Any]:
    """Internal users receive the complete feature set, including future staff testing gates."""
    if is_internal_user(user):
        return dict(PLAN_FEATURES["enterprise"])
    return dict(PLAN_FEATURES[get_plan_for_user(user)])


def get_pricing_for_user(user: dict) -> dict[str, Any]:
    if is_internal_user(user):
        return {"monthly": 0, "label": "Internal"}
    return dict(PLAN_PRICING[get_plan_for_user(user)])


def require_feature(user: dict, feature_name: str) -> None:
    entitlements = get_entitlements_for_user(user)
    if entitlements.get(feature_name):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "paid_feature_required",
            "message": "This feature is not included in your BragStack plan.",
            "feature": feature_name,
            "plan": get_plan_for_user(user),
        },
    )


def enforce_usage_limit(*, user: dict, entitlement_name: str, current_count: int, resource_name: str) -> None:
    entitlements = get_entitlements_for_user(user)
    limit = entitlements.get(entitlement_name)
    if limit is None or current_count < limit:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "plan_limit_reached",
            "message": f"Your {get_plan_for_user(user).title()} plan includes {limit} {resource_name}. Upgrade for unlimited access.",
            "resource": resource_name,
            "limit": limit,
            "current": current_count,
            "plan": get_plan_for_user(user),
        },
    )
