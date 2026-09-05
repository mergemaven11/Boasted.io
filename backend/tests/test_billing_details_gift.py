"""Billing-detail behavior for temporary complimentary Pro access."""

import app.plans as plans
from app.billing_details_routes import _fallback_payload


def test_complimentary_pro_billing_details_are_card_free(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    user = {
        "email": "gift@example.com",
        "plan": "free",
        "billing_status": "free",
    }

    payload = _fallback_payload(user)

    assert payload["plan"] == "pro"
    assert payload["persisted_plan"] == "free"
    assert payload["temporary_pro_gift"] is True
    assert payload["has_subscription"] is False
    assert payload["access_source"] == "complimentary_pro"
    assert payload["amount"] == 0
    assert payload["standard_monthly"] == 9
    assert payload["interval"] is None
    assert payload["payment_method"] is None
    assert payload["stripe_live"] is False


def test_existing_paid_subscription_stays_separate_from_gift(monkeypatch):
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", True)
    user = {
        "email": "paid@example.com",
        "plan": "pro",
        "billing_status": "active",
        "stripe_subscription_id": "sub_existing",
    }

    payload = _fallback_payload(user)

    assert payload["plan"] == "pro"
    assert payload["temporary_pro_gift"] is False
    assert payload["has_subscription"] is True
    assert payload["access_source"] == "subscription"
    assert payload["amount"] == 9
    assert payload["interval"] == "month"
    assert payload["standard_monthly"] is None
