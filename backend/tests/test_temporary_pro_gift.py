"""Temporary complimentary Pro access regression coverage."""
import asyncio

import pytest
from fastapi import HTTPException

import app.billing_routes as billing_routes
import app.plans as plans


def _free_user() -> dict:
    return {
        "_id": "507f1f77bcf86cd799439011",
        "email": "early-user@example.com",
        "plan": "free",
        "billing_status": "free",
    }


def test_free_accounts_receive_pro_without_mutating_persisted_plan(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    user = _free_user()

    assert plans.get_plan_for_user(user) == "pro"
    assert plans.get_entitlements_for_user(user)["max_entries"] is None
    assert plans.get_entitlements_for_user(user)["interview_practice"] is True
    assert plans.has_temporary_pro_gift(user) is True
    assert user["plan"] == "free"


def test_complimentary_pricing_is_zero_and_requires_separate_future_consent(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    pricing = plans.get_pricing_for_user(_free_user())

    assert pricing["monthly"] == 0
    assert pricing["label"] == "Complimentary Pro"
    assert pricing["promotional"] is True
    assert pricing["standard_monthly"] == 9
    assert "does not create a paid subscription" in pricing["notice"]
    assert "separate" in pricing["notice"]
    assert "billing consent" in pricing["notice"]


def test_paid_pro_subscription_is_not_relabelled_as_promotional(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    user = {
        **_free_user(),
        "plan": "pro",
        "billing_status": "active",
        "stripe_subscription_id": "sub_existing",
    }

    assert plans.get_plan_for_user(user) == "pro"
    assert plans.has_temporary_pro_gift(user) is False
    assert plans.get_pricing_for_user(user)["monthly"] == 9


def test_team_and_internal_access_are_not_downgraded(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    team_user = {**_free_user(), "plan": "team"}
    internal_user = {
        **_free_user(),
        "email": "staff@boasted.io",
        "email_verification_required": False,
    }

    assert plans.get_plan_for_user(team_user) == "team"
    assert plans.get_entitlements_for_user(team_user)["team_review_packets"] is True
    assert plans.has_temporary_pro_gift(team_user) is False
    assert plans.get_entitlements_for_user(internal_user)["sso"] is True


def test_checkout_is_blocked_for_complimentary_pro_before_stripe(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    # billing_routes imports the function, which reads the plans module flag.
    user = _free_user()

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(billing_routes.create_checkout_session(current_user=user))

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail["code"] == "complimentary_pro_active"
    assert "not required" in exc_info.value.detail["message"]


def test_billing_status_separates_gift_from_subscription(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    payload = billing_routes._subscription_status_payload(_free_user())

    assert payload["plan"] == "pro"
    assert payload["persisted_plan"] == "free"
    assert payload["billing_status"] == "free"
    assert payload["has_subscription"] is False
    assert payload["temporary_pro_gift"] is True
    assert payload["access_source"] == "complimentary_pro"
    assert payload["promotional_notice"]
