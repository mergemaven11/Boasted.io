"""Authentication and registration compliance tests."""
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


def test_registration_requires_terms_and_privacy_acceptance(monkeypatch):
    users = _mock_users(monkeypatch)

    response = client.post(
        "/auth/register",
        json={
            "name": "New User",
            "email": "new-user@example.com",
            "password": "secure-pass-123",
            "accepted_terms": False,
            "accepted_privacy": True,
        },
    )

    assert response.status_code == 422
    assert "Terms" in response.json()["detail"]
    assert users.count_documents({}) == 0


def test_registration_does_not_require_age_confirmation(monkeypatch):
    users = _mock_users(monkeypatch)

    async def successful_send(email, url):
        return None

    monkeypatch.setattr(auth_routes, "_send_verification_email", successful_send)

    response = client.post(
        "/auth/register",
        json={
            "name": "New User",
            "email": "new-user@example.com",
            "password": "secure-pass-123",
            "accepted_terms": True,
            "accepted_privacy": True,
        },
    )

    assert response.status_code == 200
    assert users.count_documents({}) == 1
    saved = users.find_one({"email": "new-user@example.com"})
    assert "age_18_or_older_confirmed_at" not in saved
    assert "minimum_account_age_at_acceptance" not in saved


def test_registration_records_legal_acceptance_versions(monkeypatch):
    users = _mock_users(monkeypatch)

    async def successful_send(email, url):
        return None

    monkeypatch.setattr(auth_routes, "_send_verification_email", successful_send)

    response = client.post(
        "/auth/register",
        json={
            "name": "New User",
            "email": "new-user@example.com",
            "password": "secure-pass-123",
            "accepted_terms": True,
            "accepted_privacy": True,
        },
    )

    assert response.status_code == 200
    saved = users.find_one({"email": "new-user@example.com"})
    assert saved["terms_accepted_at"]
    assert saved["terms_version"] == auth_routes.TERMS_VERSION
    assert saved["privacy_accepted_at"]
    assert saved["privacy_version"] == auth_routes.PRIVACY_VERSION
    assert saved["legal_acceptance_source"] == "email-registration"
    assert saved["consents"]["terms"] == {
        "accepted": True,
        "version": auth_routes.TERMS_VERSION,
        "accepted_at": saved["terms_accepted_at"],
    }
    assert saved["consents"]["privacy_policy"] == {
        "accepted": True,
        "version": auth_routes.PRIVACY_VERSION,
        "accepted_at": saved["privacy_accepted_at"],
    }


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