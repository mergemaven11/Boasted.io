import mongomock
from fastapi import HTTPException
from fastapi.testclient import TestClient

import app.auth_routes as auth_routes
from app.main import app


client = TestClient(app)


def _mock_users(monkeypatch):
    mock_client = mongomock.MongoClient()
    collection = mock_client["bragstack_test"]["users"]
    monkeypatch.setattr(auth_routes, "users_collection", collection)
    return collection


def test_password_reset_request_hides_existing_account_when_email_delivery_fails(monkeypatch):
    users = _mock_users(monkeypatch)
    users.insert_one({"email": "person@example.com"})

    async def fail_send(email, url):
        raise HTTPException(status_code=502, detail="Email could not be sent.")

    monkeypatch.setattr(auth_routes, "_send_password_reset_email", fail_send)

    existing = client.post("/auth/password-reset/request", json={"email": "person@example.com"})
    missing = client.post("/auth/password-reset/request", json={"email": "missing@example.com"})

    assert existing.status_code == 200
    assert missing.status_code == 200
    assert existing.json() == missing.json()


def test_verification_resend_hides_existing_account_when_email_delivery_fails(monkeypatch):
    users = _mock_users(monkeypatch)
    users.insert_one(
        {
            "email": "person@example.com",
            "email_verification_required": True,
        }
    )

    async def fail_send(email, url):
        raise HTTPException(status_code=502, detail="Email could not be sent.")

    monkeypatch.setattr(auth_routes, "_send_verification_email", fail_send)

    existing = client.post("/auth/email-verification/resend", json={"email": "person@example.com"})
    missing = client.post("/auth/email-verification/resend", json={"email": "missing@example.com"})

    assert existing.status_code == 200
    assert missing.status_code == 200
    assert existing.json() == missing.json()
