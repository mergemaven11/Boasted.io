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

# Temporary early-access gift. This intentionally changes effective access only;
# it does not rewrite a user's persisted plan, create a Stripe subscription, or
# authorize a future charge. Set BRAGSTACK_TEMPORARY_PRO_GIFT_ENABLED=false to
# return entitlement resolution to persisted plans.
TEMPORARY_PRO_GIFT_ENABLED = os.getenv(
    "BRAGSTACK_TEMPORARY_PRO_GIFT_ENABLED", "true"
).strip().lower() in {"1", "true", "yes", "on"}
TEMPORARY_PRO_GIFT_CAMPAIGN = "early-access-pro-gift-v1"
TEMPORARY_PRO_GIFT_NOTICE = (
    "BragStack Pro is temporarily complimentary as an early-access gift. "
    "This promotional access does not create a paid subscription, does not "
    "authorize recurring charges, and may be changed or ended in the future. "
    "If paid Pro access is offered later, BragStack will require a separate "
    "purchase flow and billing consent before charging you."
)

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


def has_active_paid_subscription(user: dict) -> bool:
    """Return whether the account currently carries an active Stripe subscription."""
    return bool(user.get("stripe_subscription_id")) and str(
        user.get("billing_status") or ""
    ).strip().lower() in {"active", "trialing", "past_due"}


def has_temporary_pro_gift(user: dict) -> bool:
    """Return whether this user is receiving the temporary complimentary Pro grant.

    Paid subscribers keep their ordinary subscription state. Team/Enterprise and
    internal accounts also retain their existing higher-order access rather than
    being relabeled as promotional Pro.
    """
    if not TEMPORARY_PRO_GIFT_ENABLED or is_internal_user(user):
        return False
    if has_active_paid_subscription(user):
        return False
    return normalize_plan(user.get("plan")) in {"free", "pro"}


def get_plan_for_user(user: dict) -> str:
    """Resolve the effective UI-facing plan for a user.

    During the temporary early-access gift, ordinary Free accounts receive Pro
    access without changing their stored plan or creating a billing relationship.
    Existing Team/Enterprise plans and internal access are preserved.
    """
    if is_internal_user(user):
        return "pro"

    persisted_plan = normalize_plan(user.get("plan"))
    if TEMPORARY_PRO_GIFT_ENABLED and persisted_plan not in {"team", "enterprise"}:
        return "pro"
    return persisted_plan


def get_entitlements_for_user(user: dict) -> dict[str, Any]:
    """Return a copy of the feature entitlements available to a user."""
    if is_internal_user(user):
        return dict(PLAN_FEATURES["enterprise"])

    persisted_plan = normalize_plan(user.get("plan"))
    if TEMPORARY_PRO_GIFT_ENABLED and persisted_plan not in {"team", "enterprise"}:
        return dict(PLAN_FEATURES["pro"])
    return dict(PLAN_FEATURES[persisted_plan])


def get_pricing_for_user(user: dict) -> dict[str, Any]:
    """Return display pricing for a user's effective access state."""
    if is_internal_user(user):
        return {"monthly": 0, "label": "Internal"}
    if has_temporary_pro_gift(user):
        return {
            "monthly": 0,
            "label": "Complimentary Pro",
            "promotional": True,
            "standard_monthly": PLAN_PRICING["pro"]["monthly"],
            "campaign": TEMPORARY_PRO_GIFT_CAMPAIGN,
            "notice": TEMPORARY_PRO_GIFT_NOTICE,
        }
    return dict(PLAN_PRICING[get_plan_for_user(user)])


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
            "message": f"Your {get_plan_for_user(user).title()} plan includes {limit} {resource_name}. Upgrade for unlimited access.",
            "resource": resource_name,
            "limit": limit,
            "current": current_count,
            "plan": get_plan_for_user(user),
        },
    )
