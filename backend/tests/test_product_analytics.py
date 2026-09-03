"""Verify BragStack product analytics remain bounded and non-blocking."""

import asyncio

from bson import ObjectId
import mongomock

import app.auth_routes as auth_routes
import app.product_analytics as product_analytics
import app.routes as entry_routes
from app.models import BragEntryCreate


def test_safe_properties_drop_unapproved_and_complex_values():
    """Keep user-authored or structurally complex values out of analytics."""
    safe = product_analytics._safe_properties(
        {
            "source": "web",
            "current_plan": "free",
            "is_public": False,
            "email": "person@example.com",
            "title": "Private accomplishment",
            "brag_id": {"nested": "not allowed"},
        }
    )

    assert safe == {
        "source": "web",
        "current_plan": "free",
        "is_public": False,
    }


def test_capture_is_disabled_without_project_key(monkeypatch):
    """Do not create delivery work when analytics configuration is absent."""
    monkeypatch.delenv("POSTHOG_PROJECT_API_KEY", raising=False)

    class UnexpectedThread:
        """Fail if analytics attempts background delivery while disabled."""

        def __init__(self, *args, **kwargs):
            """Reject unexpected thread construction."""
            raise AssertionError("analytics thread should not start")

    monkeypatch.setattr(product_analytics, "Thread", UnexpectedThread)
    product_analytics.capture_product_event("user-1", product_analytics.EVENT_USER_SIGNED_UP, source="web")


def test_capture_starts_daemon_delivery_with_allowlisted_properties(monkeypatch):
    """Queue configured events with only reviewed properties."""
    monkeypatch.setenv("POSTHOG_PROJECT_API_KEY", "test-key")
    monkeypatch.setenv("POSTHOG_HOST", "https://example.test/")
    captured = {}

    class FakeThread:
        """Record thread construction without making a network request."""

        def __init__(self, *, target, args, daemon, name):
            """Store the requested delivery contract."""
            captured.update(target=target, args=args, daemon=daemon, name=name)

        def start(self):
            """Record that delivery was queued."""
            captured["started"] = True

    monkeypatch.setattr(product_analytics, "Thread", FakeThread)
    product_analytics.capture_product_event(
        "user-1",
        product_analytics.EVENT_BRAG_CREATED,
        source="web",
        current_plan="free",
        brag_id="brag-1",
        title="must-not-leak",
    )

    assert captured["started"] is True
    assert captured["daemon"] is True
    assert captured["args"][0:4] == (
        "test-key",
        "https://example.test",
        "user-1",
        product_analytics.EVENT_BRAG_CREATED,
    )
    assert captured["args"][4] == {
        "source": "web",
        "current_plan": "free",
        "brag_id": "brag-1",
    }


def test_signup_capture_uses_internal_id_and_privacy_safe_properties(monkeypatch):
    """Capture signup only after account creation without sending email or name."""
    users = mongomock.MongoClient().db.users
    captured = []
    monkeypatch.setattr(auth_routes, "users_collection", users)
    monkeypatch.setattr(auth_routes, "capture_product_event", lambda *args, **kwargs: captured.append((args, kwargs)))
    monkeypatch.setattr(auth_routes, "hash_password", lambda value: "hash")

    payload = auth_routes.RegisterRequest(name="Tee", email="tee@example.com", password="password1")

    async def ignore_email(email, url):
        """Avoid external email delivery during the unit test."""
        return None

    monkeypatch.setattr(auth_routes, "_send_verification_email", ignore_email)
    asyncio.run(auth_routes.register_user(payload))

    created = users.find_one({"email": "tee@example.com"})
    args, properties = captured[0]
    assert args == (str(created["_id"]), auth_routes.EVENT_USER_SIGNED_UP)
    assert properties == {"source": "password", "current_plan": "free"}
    assert "email" not in properties
    assert "name" not in properties


def test_entry_capture_happens_after_insert(monkeypatch):
    """Capture an entry lifecycle event using only IDs and bounded metadata."""
    entries = mongomock.MongoClient().db.entries
    captured = []
    monkeypatch.setattr(entry_routes, "entries_collection", entries)
    monkeypatch.setattr(entry_routes, "capture_product_event", lambda *args, **kwargs: captured.append((args, kwargs)))
    user = {"_id": ObjectId(), "plan": "free"}
    payload = BragEntryCreate(
        title="Fixed deploy",
        category="Reliability",
        entry_date="2026-08-28",
        entry_type="Current Job",
        situation="Failure",
        action="Diagnosed it",
        impact="Restored service",
        lesson="Add alert",
        tags=["Docker"],
        is_public=False,
    )

    created = entry_routes.create_entry(payload, user)

    args, properties = captured[0]
    assert args == (str(user["_id"]), entry_routes.EVENT_BRAG_CREATED)
    assert properties["brag_id"] == created["id"]
    assert properties["current_plan"] == "free"
    assert properties["is_public"] is False
    assert "title" not in properties
    assert "impact" not in properties
