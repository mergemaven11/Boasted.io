import asyncio

from bson import ObjectId
import mongomock

import app.auth_routes as auth_routes
import app.impact_receipt_routes as receipt_routes
import app.routes as entry_routes
from app.models import BragEntryCreate


def test_signup_capture_uses_internal_id_and_privacy_safe_properties(monkeypatch):
    users = mongomock.MongoClient().db.users
    captured = []
    monkeypatch.setattr(auth_routes, "users_collection", users)
    monkeypatch.setattr(auth_routes, "capture_product_event", lambda *args, **kwargs: captured.append((args, kwargs)))
    monkeypatch.setattr(auth_routes, "hash_password", lambda value: "hash")

    payload = auth_routes.RegisterRequest(name="Tee", email="tee@example.com", password="password1")
    async def ignore_email(email, url):
        return None
    monkeypatch.setattr(auth_routes, "_send_verification_email", ignore_email)

    asyncio.run(auth_routes.register_user(payload))

    args, properties = captured[0]
    created = users.find_one({"email": "tee@example.com"})
    assert args == (str(created["_id"]), auth_routes.EVENT_USER_SIGNED_UP)
    assert "email" not in properties
    assert properties == {"source": "web", "current_plan": "free"}


def test_entry_capture_happens_after_insert(monkeypatch):
    entries = mongomock.MongoClient().db.entries
    captured = []
    monkeypatch.setattr(entry_routes, "entries_collection", entries)
    monkeypatch.setattr(entry_routes, "capture_product_event", lambda *args, **kwargs: captured.append((args, kwargs)))
    user = {"_id": ObjectId(), "plan": "free"}
    payload = BragEntryCreate(title="Fixed deploy", category="Reliability", entry_date="2026-08-28", entry_type="Current Job", situation="Failure", action="Diagnosed it", impact="Restored service", lesson="Add alert", tags=["Docker"], is_public=False)

    created = entry_routes.create_entry(payload, user)

    assert captured[0][0][1] == entry_routes.EVENT_BRAG_CREATED
    assert captured[0][1]["brag_id"] == created["id"]
    assert "title" not in captured[0][1]
