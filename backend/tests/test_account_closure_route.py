"""Self-service account-closure endpoint tests."""

import mongomock
from bson import ObjectId
from fastapi.testclient import TestClient

import app.account_closure_routes as account_closure_routes
from app.main import app


client = TestClient(app)


def _override_current_user(user):
    app.dependency_overrides[account_closure_routes.get_current_user] = lambda: user


def _clear_override():
    app.dependency_overrides.pop(account_closure_routes.get_current_user, None)


def test_close_account_requires_explicit_server_confirmation(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_test"]
    user = {"_id": ObjectId(), "billing_status": "free"}
    mock_db["users"].insert_one(dict(user))
    monkeypatch.setattr(account_closure_routes, "db", mock_db)
    _override_current_user(user)
    try:
        response = client.request(
            "DELETE",
            "/auth/me/account",
            json={"confirmation": "NO"},
        )
    finally:
        _clear_override()

    assert response.status_code == 422
    assert mock_db["users"].find_one({"_id": user["_id"]}) is not None


def test_close_account_blocks_active_paid_subscription_until_renewal_is_canceled(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_test"]
    user = {
        "_id": ObjectId(),
        "billing_status": "active",
        "stripe_subscription_id": "sub_active",
        "billing_cancel_at_period_end": False,
    }
    mock_db["users"].insert_one(dict(user))
    monkeypatch.setattr(account_closure_routes, "db", mock_db)
    _override_current_user(user)
    try:
        response = client.request(
            "DELETE",
            "/auth/me/account",
            json={"confirmation": "CLOSE"},
        )
    finally:
        _clear_override()

    assert response.status_code == 409
    assert "Cancel" in response.json()["detail"]
    assert mock_db["users"].find_one({"_id": user["_id"]}) is not None


def test_close_account_allows_paid_account_after_future_renewal_is_canceled(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_test"]
    user = {
        "_id": ObjectId(),
        "billing_status": "active",
        "stripe_subscription_id": "sub_canceling",
        "billing_cancel_at_period_end": True,
    }
    user_id = str(user["_id"])
    mock_db["users"].insert_one(dict(user))
    mock_db["entries"].insert_one({"user_id": user_id, "title": "career proof"})
    monkeypatch.setattr(account_closure_routes, "db", mock_db)
    _override_current_user(user)
    try:
        response = client.request(
            "DELETE",
            "/auth/me/account",
            json={"confirmation": "CLOSE"},
        )
    finally:
        _clear_override()

    assert response.status_code == 200
    assert mock_db["users"].find_one({"_id": user["_id"]}) is None
    assert mock_db["entries"].count_documents({"user_id": user_id}) == 0


def test_close_account_endpoint_deletes_account_and_workspace(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_test"]
    user = {"_id": ObjectId(), "billing_status": "free"}
    user_id = str(user["_id"])
    mock_db["users"].insert_one(dict(user))
    mock_db["entries"].insert_one({"user_id": user_id, "title": "career proof"})
    monkeypatch.setattr(account_closure_routes, "db", mock_db)
    _override_current_user(user)
    try:
        response = client.request(
            "DELETE",
            "/auth/me/account",
            json={"confirmation": "CLOSE"},
        )
    finally:
        _clear_override()

    assert response.status_code == 200
    assert response.json()["message"] == "Your Boasted account has been closed."
    assert mock_db["users"].find_one({"_id": user["_id"]}) is None
    assert mock_db["entries"].count_documents({"user_id": user_id}) == 0
