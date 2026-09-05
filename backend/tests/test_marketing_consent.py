"""Marketing-email consent and preference tests."""
from datetime import datetime, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

import app.auth_routes as auth_routes
from app.main import app


client = TestClient(app)


def _mock_users(monkeypatch):
    mock_client = mongomock.MongoClient()
    collection = mock_client["bragstack_marketing_consent_test"]["users"]
    monkeypatch.setattr(auth_routes, "users_collection", collection)
    return collection


async def _successful_verification_send(email, url):
    return None


def _registration_payload(**overrides):
    payload = {
        "name": "Consent User",
        "email": "consent@example.com",
        "password": "secure-pass-123",
        "accepted_terms": True,
        "accepted_privacy": True,
    }
    payload.update(overrides)
    return payload


def test_registration_defaults_marketing_email_to_opted_out(monkeypatch):
    users = _mock_users(monkeypatch)
    monkeypatch.setattr(auth_routes, "_send_verification_email", _successful_verification_send)

    response = client.post("/auth/register", json=_registration_payload())

    assert response.status_code == 200
    saved = users.find_one({"email": "consent@example.com"})
    assert saved["marketing_email_opt_in"] is False
    assert saved["marketing_email_opt_in_at"] is None
    assert saved["consents"]["marketing_email"]["opted_in"] is False
    assert saved["marketing_consent_events"][0]["source"] == "email-registration"


def test_registration_records_affirmative_marketing_opt_in(monkeypatch):
    users = _mock_users(monkeypatch)
    monkeypatch.setattr(auth_routes, "_send_verification_email", _successful_verification_send)

    response = client.post(
        "/auth/register",
        json=_registration_payload(marketing_email_opt_in=True),
    )

    assert response.status_code == 200
    saved = users.find_one({"email": "consent@example.com"})
    assert saved["marketing_email_opt_in"] is True
    assert saved["marketing_email_opt_in_at"]
    assert saved["marketing_consent_version"] == auth_routes.MARKETING_CONSENT_VERSION
    assert saved["consents"]["marketing_email"]["source"] == "email-registration"


@pytest.fixture
def preference_context(monkeypatch):
    users = _mock_users(monkeypatch)
    user = {
        "_id": ObjectId(),
        "name": "Preference User",
        "email": "preference@example.com",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "marketing_email_opt_in": False,
        "marketing_consent_events": [],
    }
    users.insert_one(user)
    app.dependency_overrides[auth_routes.get_current_user] = lambda: users.find_one(
        {"_id": user["_id"]}
    )
    yield user, users
    app.dependency_overrides.clear()


def test_account_preference_can_opt_in_and_opt_out(preference_context):
    user, users = preference_context

    opted_in = client.patch(
        "/auth/me/marketing-preferences",
        json={"marketing_email_opt_in": True},
    )
    assert opted_in.status_code == 200
    assert opted_in.json()["marketing_email_opt_in"] is True

    opted_out = client.patch(
        "/auth/me/marketing-preferences",
        json={"marketing_email_opt_in": False},
    )
    assert opted_out.status_code == 200
    assert opted_out.json()["marketing_email_opt_in"] is False

    saved = users.find_one({"_id": user["_id"]})
    assert saved["marketing_email_opt_out_at"]
    assert [event["opted_in"] for event in saved["marketing_consent_events"]] == [True, False]
    assert saved["consents"]["marketing_email"]["source"] == "account-settings"


def test_repeated_preference_save_is_idempotent(preference_context):
    user, users = preference_context

    response = client.patch(
        "/auth/me/marketing-preferences",
        json={"marketing_email_opt_in": False},
    )

    assert response.status_code == 200
    saved = users.find_one({"_id": user["_id"]})
    assert saved["marketing_consent_events"] == []
