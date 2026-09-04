"""Plan pricing, entitlement resolution, and usage enforcement for BragStack.

This module is the central policy layer for mapping a user's plan to product
features and usage limits. Route handlers should use these helpers instead of
reimplementing plan checks so pricing and entitlement behavior stays consistent.
"""

from __future__ import annotations

import os
from typing import Any

from fastapi import HTTPException, status

FREE_ENTRY_LIMIT = 5
FREE_IMPACT_RECEIPT_LIMIT = 1
INTERNAL_EMAIL_DOMAIN = "usebragstack.com"

# Temporary launch-safety mode. While BragStack is not accepting new paid
# subscriptions, ordinary Free/Pro customer accounts receive the Pro feature set
# at no cost. Team and Enterprise plans keep their own entitlements and are not
# part of this temporary promotion. Set BRAGSTACK_OPEN_PRO_ACCESS=false later to
# restore persisted Free/Pro behavior.
OPEN_PRO_ACCESS = os.getenv("BRAGSTACK_OPEN_PRO_ACCESS", "true").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

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
        "executive_command_center": False,
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
        "executive_command_center": False,
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
        "executive_command_center": False,
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
        "executive_command_center": True,
    },
}


def open_pro_access_enabled() -> bool:
    """Return whether the temporary no-charge Pro access window is enabled."""
    return OPEN_PRO_ACCESS


def normalize_plan(plan: str | None) -> str:
    """Normalize an arbitrary plan value to a supported plan key."""
    normalized = (plan or "free").strip().lower()
    return normalized if normalized in PLAN_FEATURES else "free"


def is_internal_user(user: dict) -> bool:
    """Determine whether a user is a verified BragStack internal identity."""
    email = (user.get("email") or "").strip().lower()
    if not email.endswith(f"@{INTERNAL_EMAIL_DOMAIN}"):
        return False
    return bool(user.get("email_verified_at")) or not user.get("email_verification_required", False)


def get_plan_for_user(user: dict) -> str:
    """Resolve the effective UI-facing plan for a user.

    Internal staff continue to present as Pro while receiving their separately
    gated internal entitlements. Team and Enterprise customers retain their
    persisted plans. During the temporary open-access window, ordinary Free/Pro
    customer accounts present as Pro without changing stored billing data.
    """
    if is_internal_user(user):
        return "pro"
    persisted_plan = normalize_plan(user.get("plan"))
    if persisted_plan in {"team", "enterprise"}:
        return persisted_plan
    if OPEN_PRO_ACCESS:
        return "pro"
    return persisted_plan


def get_entitlements_for_user(user: dict) -> dict[str, Any]:
    """Return a copy of the feature entitlements available to a user.

    Open access grants only the ordinary Pro feature set. It never grants Team,
    Enterprise, founder, ops, SSO, audit-log, retention, or executive features.
    Internal users retain the Enterprise feature set for staff operations, while
    real Team/Enterprise customers retain their purchased plan entitlements.
    """
    if is_internal_user(user):
        return dict(PLAN_FEATURES["enterprise"])
    persisted_plan = normalize_plan(user.get("plan"))
    if persisted_plan in {"team", "enterprise"}:
        return dict(PLAN_FEATURES[persisted_plan])
    if OPEN_PRO_ACCESS:
        return dict(PLAN_FEATURES["pro"])
    return dict(PLAN_FEATURES[persisted_plan])


def get_pricing_for_user(user: dict) -> dict[str, Any]:
    """Return display pricing for a user's effective access state."""
    if is_internal_user(user):
        return {"monthly": 0, "label": "Internal"}
    persisted_plan = normalize_plan(user.get("plan"))
    if persisted_plan in {"team", "enterprise"}:
        return dict(PLAN_PRICING[persisted_plan])
    if OPEN_PRO_ACCESS:
        return {"monthly": 0, "label": "Pro · Temporary open access"}
    return dict(PLAN_PRICING[persisted_plan])


def require_feature(user: dict, feature_name: str) -> None:
    """Require a boolean feature entitlement for the current user."""
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
    """Enforce a numeric plan limit before creating another resource."""
    entitlements = get_entitlements_for_user(user)
    limit = entitlements.get(entitlement_name)
    if limit is None or current_count < limit:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={
            "code": "plan_limit_reached",
            "message": f"Your {get_plan_for_user(user).title()} plan includes {limit} {resource_name}.",
            "resource": resource_name,
            "limit": limit,
            "current": current_count,
            "plan": get_plan_for_user(user),
        },
    )
