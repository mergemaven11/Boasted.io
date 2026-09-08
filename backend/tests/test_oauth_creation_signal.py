"""Regression coverage for the OAuth-created analytics handshake."""

import mongomock
from bson import ObjectId

import app.oauth_routes as oauth_routes


def _mock_users(monkeypatch):
    users = mongomock.MongoClient()["oauth_creation_signal"]["users"]
    monkeypatch.setattr(oauth_routes, "users_collection", users)
    return users


def test_existing_oauth_identity_is_not_reported_as_new_signup(monkeypatch):
    users = _mock_users(monkeypatch)
    user_id = ObjectId()
    users.insert_one({
        "_id": user_id,
        "email": "existing@example.com",
        "name": "Existing User",
        "oauth": {"google_id": "google-existing"},
    })

    result = oauth_routes._find_or_create_oauth_user(
        "google",
        "google-existing",
        "existing@example.com",
        "Existing User",
        accepted_terms=True,
        accepted_privacy=True,
    )

    assert result["_oauth_account_created"] is False
    assert "_oauth_account_created" not in users.find_one({"_id": user_id})


def test_existing_email_link_is_not_reported_as_new_signup(monkeypatch):
    users = _mock_users(monkeypatch)
    user_id = ObjectId()
    users.insert_one({
        "_id": user_id,
        "email": "linked@example.com",
        "name": "Linked User",
    })

    result = oauth_routes._find_or_create_oauth_user(
        "github",
        "github-link",
        "linked@example.com",
        "Linked User",
        accepted_terms=True,
        accepted_privacy=True,
    )

    assert result["_oauth_account_created"] is False
    assert users.find_one({"_id": user_id})["oauth"]["github_id"] == "github-link"
    assert "_oauth_account_created" not in users.find_one({"_id": user_id})


def test_new_oauth_account_is_reported_once_without_persisting_flag(monkeypatch):
    users = _mock_users(monkeypatch)

    result = oauth_routes._find_or_create_oauth_user(
        "github",
        "github-brand-new",
        "new@example.com",
        "Brand New User",
        accepted_terms=True,
        accepted_privacy=True,
    )

    assert result["_oauth_account_created"] is True
    saved = users.find_one({"_id": result["_id"]})
    assert saved is not None
    assert "_oauth_account_created" not in saved
