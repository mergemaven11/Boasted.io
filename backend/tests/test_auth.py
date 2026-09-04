"""Authentication and account-creation regression coverage."""
import mongomock
from fastapi import HTTPException
from fastapi.testclient import TestClient

import app.auth_routes as auth_routes
from app.main import app


client = TestClient(app)


def _mock_users(monkeypatch):
    """Replace the auth user collection with an isolated in-memory database."""
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


def test_registration_rejects_missing_legal_acceptance(monkeypatch):
    users = _mock_users(monkeypatch)

    response = client.post(
        "/auth/register",
        json={
            "name": "Legal Test",
            "email": "legal-missing@example.com",
            "password": "safe-password-123",
        },
    )

    assert response.status_code == 400
    assert "Terms" in response.json()["detail"] or "18" in response.json()["detail"]
    assert users.count_documents({}) == 0


def test_registration_rejects_stale_policy_versions(monkeypatch):
    users = _mock_users(monkeypatch)

    response = client.post(
        "/auth/register",
        json={
            "name": "Stale Policy",
            "email": "stale-policy@example.com",
            "password": "safe-password-123",
            "terms_accepted": True,
            "privacy_acknowledged": True,
            "age_18_or_older": True,
            "terms_version": "2026-08-01",
            "privacy_version": "2026-08-01",
        },
    )

    assert response.status_code == 409
    assert users.count_documents({}) == 0


def test_registration_records_versioned_legal_acceptance(monkeypatch):
    users = _mock_users(monkeypatch)

    async def successful_send(email, url):
        return None

    monkeypatch.setattr(auth_routes, "_send_verification_email", successful_send)

    response = client.post(
        "/auth/register",
        json={
            "name": "Accepted User",
            "email": "accepted@example.com",
            "password": "safe-password-123",
            "terms_accepted": True,
            "privacy_acknowledged": True,
            "age_18_or_older": True,
            "terms_version": auth_routes.CURRENT_TERMS_VERSION,
            "privacy_version": auth_routes.CURRENT_PRIVACY_VERSION,
        },
    )

    assert response.status_code == 200
    stored = users.find_one({"email": "accepted@example.com"})
    assert stored is not None
    acceptance = stored["legal_acceptance"]
    assert acceptance["terms_version"] == auth_routes.CURRENT_TERMS_VERSION
    assert acceptance["privacy_version"] == auth_routes.CURRENT_PRIVACY_VERSION
    assert acceptance["age_18_or_older_attested"] is True
    assert acceptance["method"] == "email_password_registration"
    assert acceptance["terms_accepted_at"]
    assert acceptance["privacy_acknowledged_at"]
