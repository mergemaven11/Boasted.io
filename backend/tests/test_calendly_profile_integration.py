"""Tests for the opt-in Calendly Proof Profile integration."""
from datetime import datetime, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

import app.profile_connection_routes as profile_connection_routes
import app.public_slug_routes as public_slug_routes
from app.main import app


client = TestClient(app)


@pytest.fixture
def connection_context(monkeypatch):
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["bragstack_calendly_test"]
    users = mock_db["users"]

    user = {
        "_id": ObjectId(),
        "name": "Calendar User",
        "email": "calendar@example.com",
        "public_slug": "calendar-user-123",
        "hashed_password": "unused",
        "created_at": datetime.now(timezone.utc),
    }
    users.insert_one(user.copy())

    monkeypatch.setattr(profile_connection_routes, "users_collection", users)
    monkeypatch.setattr(public_slug_routes, "users_collection", users)
    app.dependency_overrides[profile_connection_routes.get_current_user] = lambda: users.find_one(
        {"_id": user["_id"]}
    )

    yield user, users

    app.dependency_overrides.clear()


def test_calendly_link_can_be_enabled_and_exposed_publicly(connection_context):
    user, users = connection_context
    calendly_url = "https://calendly.com/calendar-user/30min"

    response = client.patch(
        "/profile/connection",
        json={"calendly_url": calendly_url, "calendly_enabled": True},
    )

    assert response.status_code == 200
    assert response.json()["calendly_enabled"] is True
    assert response.json()["calendly_url"] == calendly_url
    assert users.find_one({"_id": user["_id"]})["calendly_url"] == calendly_url

    public_response = client.get(f"/public/brag/{user['public_slug']}/connection")
    assert public_response.status_code == 200
    assert public_response.json()["calendly_enabled"] is True
    assert public_response.json()["calendly_url"] == calendly_url


def test_disabled_calendly_link_is_hidden_from_public_api(connection_context):
    user, users = connection_context
    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"calendly_url": "https://calendly.com/calendar-user/30min", "calendly_enabled": False}},
    )

    public_response = client.get(f"/public/brag/{user['public_slug']}/connection")

    assert public_response.status_code == 200
    assert public_response.json()["calendly_enabled"] is False
    assert public_response.json()["calendly_url"] == ""


def test_calendly_rejects_non_calendly_hosts(connection_context):
    response = client.patch(
        "/profile/connection",
        json={"calendly_url": "https://example.com/fake-calendar", "calendly_enabled": True},
    )

    assert response.status_code == 422


def test_partial_connection_update_does_not_clear_calendly(connection_context):
    user, users = connection_context
    calendly_url = "https://calendly.com/calendar-user/30min"
    users.update_one(
        {"_id": user["_id"]},
        {"$set": {"calendly_url": calendly_url, "calendly_enabled": True}},
    )

    response = client.patch(
        "/profile/connection",
        json={"open_to_talk": False},
    )

    assert response.status_code == 200
    stored = users.find_one({"_id": user["_id"]})
    assert stored["calendly_enabled"] is True
    assert stored["calendly_url"] == calendly_url


def test_legacy_open_to_talk_calendly_url_drives_inline_scheduler(connection_context):
    """Existing public Calendly links continue to power the new portfolio embed."""
    user, users = connection_context
    legacy_url = "https://calendly.com/calendar-user/30min"
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "open_to_talk": True,
                "open_to_talk_url": legacy_url,
                "open_to_talk_note": "Book a conversation.",
            }
        },
    )

    public_response = client.get(f"/public/brag/{user['public_slug']}/connection")

    assert public_response.status_code == 200
    payload = public_response.json()
    assert payload["open_to_talk"] is True
    assert payload["open_to_talk_url"] == legacy_url
    assert payload["calendly_enabled"] is True
    assert payload["calendly_url"] == legacy_url


def test_explicit_calendly_disable_overrides_legacy_open_to_talk_url(connection_context):
    """A user who explicitly disables Calendly must not be re-enabled by fallback."""
    user, users = connection_context
    legacy_url = "https://calendly.com/calendar-user/30min"
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "open_to_talk": True,
                "open_to_talk_url": legacy_url,
                "calendly_enabled": False,
            }
        },
    )

    public_response = client.get(f"/public/brag/{user['public_slug']}/connection")

    assert public_response.status_code == 200
    payload = public_response.json()
    assert payload["open_to_talk"] is True
    assert payload["open_to_talk_url"] == legacy_url
    assert payload["calendly_enabled"] is False
    assert payload["calendly_url"] == ""
