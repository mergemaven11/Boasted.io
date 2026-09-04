"""Regression tests for OAuth account-creation legal acceptance."""

import mongomock
import pytest
from fastapi import HTTPException

import app.oauth_routes as oauth_routes


def _mock_users(monkeypatch):
    mock_client = mongomock.MongoClient()
    collection = mock_client["bragstack_test"]["users"]
    monkeypatch.setattr(oauth_routes, "users_collection", collection)
    return collection


def test_new_oauth_account_cannot_bypass_legal_acceptance(monkeypatch):
    users = _mock_users(monkeypatch)

    with pytest.raises(HTTPException) as exc_info:
        oauth_routes._find_or_create_oauth_user(
            "google",
            "provider-user-1",
            "new@example.com",
            "New User",
            legal_acceptance=None,
        )

    assert exc_info.value.status_code == 403
    assert users.count_documents({}) == 0


def test_new_oauth_account_records_current_acceptance(monkeypatch):
    users = _mock_users(monkeypatch)
    acceptance = oauth_routes._legal_acceptance_record("google_oauth_registration")

    user = oauth_routes._find_or_create_oauth_user(
        "google",
        "provider-user-2",
        "accepted-oauth@example.com",
        "Accepted OAuth",
        legal_acceptance=acceptance,
    )

    stored = users.find_one({"_id": user["_id"]})
    assert stored["legal_acceptance"]["terms_version"] == oauth_routes.CURRENT_TERMS_VERSION
    assert stored["legal_acceptance"]["privacy_version"] == oauth_routes.CURRENT_PRIVACY_VERSION
    assert stored["legal_acceptance"]["age_18_or_older_attested"] is True
    assert stored["legal_acceptance"]["method"] == "google_oauth_registration"


def test_existing_oauth_account_can_sign_in_without_creating_new_acceptance(monkeypatch):
    users = _mock_users(monkeypatch)
    users.insert_one(
        {
            "email": "existing@example.com",
            "name": "Existing",
            "oauth": {"github_id": "existing-provider-id"},
            "email_verified_at": "2026-01-01T00:00:00+00:00",
            "email_verification_required": False,
        }
    )

    user = oauth_routes._find_or_create_oauth_user(
        "github",
        "existing-provider-id",
        "existing@example.com",
        "Existing",
        legal_acceptance=None,
    )

    assert user["email"] == "existing@example.com"
    assert "legal_acceptance" not in user


def test_oauth_launch_rejects_stale_or_partial_acceptance():
    with pytest.raises(HTTPException) as partial:
        oauth_routes._validated_legal_query(
            terms_accepted=True,
            privacy_acknowledged=False,
            age_18_or_older=True,
            terms_version=oauth_routes.CURRENT_TERMS_VERSION,
            privacy_version=oauth_routes.CURRENT_PRIVACY_VERSION,
        )
    assert partial.value.status_code == 400

    with pytest.raises(HTTPException) as stale:
        oauth_routes._validated_legal_query(
            terms_accepted=True,
            privacy_acknowledged=True,
            age_18_or_older=True,
            terms_version="2026-08-01",
            privacy_version="2026-08-01",
        )
    assert stale.value.status_code == 409


def test_oauth_login_without_signup_acceptance_remains_valid_for_existing_users():
    assert oauth_routes._validated_legal_query(
        terms_accepted=False,
        privacy_acknowledged=False,
        age_18_or_older=False,
        terms_version="",
        privacy_version="",
    ) is False
