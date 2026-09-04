"""Regression coverage for temporary open Pro access and support intake."""
from __future__ import annotations

from bson import ObjectId
from fastapi import HTTPException
import mongomock
import pytest

import app.beta_metrics_routes as beta_routes
import app.billing_routes as billing_routes
import app.plans as plans


def test_open_pro_access_grants_pro_but_not_enterprise(monkeypatch):
    monkeypatch.setattr(plans, "OPEN_PRO_ACCESS", True)
    user = {"email": "customer@example.com", "plan": "free"}

    assert plans.get_plan_for_user(user) == "pro"
    entitlements = plans.get_entitlements_for_user(user)
    assert entitlements["resume_builder"] is True
    assert entitlements["advanced_reports"] is True
    assert entitlements["max_entries"] is None
    assert entitlements["executive_command_center"] is False
    assert entitlements["audit_logs"] is False
    assert entitlements["sso"] is False


@pytest.mark.asyncio
async def test_checkout_is_hard_blocked_while_open_access_is_enabled(monkeypatch):
    monkeypatch.setattr(plans, "OPEN_PRO_ACCESS", True)
    monkeypatch.setattr(billing_routes, "open_pro_access_enabled", lambda: True)

    with pytest.raises(HTTPException) as exc_info:
        await billing_routes.create_checkout_session(
            current_user={"_id": ObjectId(), "email": "customer@example.com", "plan": "free"}
        )

    assert exc_info.value.status_code == 503
    assert "Paid upgrades are temporarily paused" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_support_ticket_is_saved_even_without_github_sync(monkeypatch):
    collection = mongomock.MongoClient()["bragstack_test"]["support_tickets"]
    monkeypatch.setattr(beta_routes, "support_tickets_collection", collection)

    async def no_sync(ticket):
        return None

    monkeypatch.setattr(beta_routes, "_sync_support_ticket_to_github", no_sync)
    user_id = ObjectId()
    payload = beta_routes.SupportTicketCreate(
        category="bug",
        title="Export button is stuck",
        description="I clicked export after creating a packet and nothing happened.",
        page_url="https://usebragstack.com/app/reports",
        browser="test browser",
    )

    result = await beta_routes.submit_support_ticket(
        payload=payload,
        current_user={"_id": user_id, "email": "customer@example.com"},
    )

    assert result["saved"] is True
    assert result["github_synced"] is False
    saved = collection.find_one({"user_id": str(user_id)})
    assert saved is not None
    assert saved["category"] == "bug"
    assert saved["title"] == "Export button is stuck"


def test_founder_beta_metrics_are_not_available_to_public_users():
    with pytest.raises(HTTPException) as exc_info:
        beta_routes.aggregate_beta_metrics(
            current_user={"_id": ObjectId(), "email": "customer@example.com", "plan": "pro"}
        )

    assert exc_info.value.status_code == 403
