"""Regression coverage for founder/support user invitations."""
import asyncio

import mongomock
import pytest
from bson import ObjectId
from fastapi import HTTPException

import app.ops_invite_routes as ops_invite_routes


def test_ops_invite_sends_registration_email_without_creating_account(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_ops_invites"]
    sent = {}

    async def fake_send_email(to_email, subject, html, from_email):
        sent.update({"to": to_email, "subject": subject, "html": html, "from": from_email})

    monkeypatch.setattr(ops_invite_routes, "users_collection", mock_db["users"])
    monkeypatch.setattr(ops_invite_routes, "ops_audit_collection", mock_db["ops_audit"])
    monkeypatch.setattr(ops_invite_routes, "_send_email", fake_send_email)
    monkeypatch.setattr(ops_invite_routes, "FRONTEND_URL", "https://boasted.io")

    actor = {
        "_id": ObjectId(),
        "email": "founder@boasted.io",
        "internal_roles": ["admin"],
    }
    payload = ops_invite_routes.UserInviteRequest(email=" New.User@Example.com ", name="New User")

    result = asyncio.run(ops_invite_routes.send_user_invite(payload, current_user=actor))

    assert result["email"] == "new.user@example.com"
    assert sent["to"] == "new.user@example.com"
    assert sent["subject"] == "You’re invited to Boasted"
    assert "https://boasted.io/register?email=new.user%40example.com" in sent["html"]
    assert "does not create an account or password" in sent["html"]
    assert mock_db["users"].count_documents({}) == 0
    audit = mock_db["ops_audit"].find_one({"event": "user_invite_sent"})
    assert audit["actor_email"] == "founder@boasted.io"
    assert audit["target_email"] == "new.user@example.com"


def test_ops_invite_rejects_existing_account(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_ops_invites_existing"]
    mock_db["users"].insert_one({"email": "existing@example.com"})
    send_called = False

    async def fake_send_email(*args, **kwargs):
        nonlocal send_called
        send_called = True

    monkeypatch.setattr(ops_invite_routes, "users_collection", mock_db["users"])
    monkeypatch.setattr(ops_invite_routes, "ops_audit_collection", mock_db["ops_audit"])
    monkeypatch.setattr(ops_invite_routes, "_send_email", fake_send_email)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            ops_invite_routes.send_user_invite(
                ops_invite_routes.UserInviteRequest(email="existing@example.com"),
                current_user={"_id": ObjectId(), "email": "ops@boasted.io"},
            )
        )

    assert exc_info.value.status_code == 409
    assert "already exists" in str(exc_info.value.detail)
    assert send_called is False
    assert mock_db["ops_audit"].count_documents({}) == 0
