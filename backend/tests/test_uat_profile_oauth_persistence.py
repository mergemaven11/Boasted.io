"""UAT regressions for OAuth, profile persistence, photos, and Open to Talk."""

import mongomock
from bson import ObjectId

import app.auth_routes as auth_routes
import app.oauth_routes as oauth_routes
import app.profile_connection_routes as connection_routes
import app.profile_media_routes as media_routes


def _mock_users(monkeypatch):
    client = mongomock.MongoClient()
    users = client["bragstack_uat"]["users"]
    monkeypatch.setattr(auth_routes, "users_collection", users)
    monkeypatch.setattr(oauth_routes, "users_collection", users)
    monkeypatch.setattr(connection_routes, "users_collection", users)
    monkeypatch.setattr(media_routes, "users_collection", users)
    return users


def test_google_scope_uses_percent_encoded_spaces():
    query = oauth_routes._authorization_query(
        {"scope": "openid email profile", "client_id": "example.apps.googleusercontent.com"}
    )
    assert "scope=openid%20email%20profile" in query
    assert "scope=openid+email+profile" not in query


def test_oauth_link_preserves_user_authored_profile(monkeypatch):
    users = _mock_users(monkeypatch)
    user_id = ObjectId()
    original = {
        "_id": user_id,
        "email": "tee@example.com",
        "name": "Tee",
        "bio": "My saved founder bio",
        "headline": "Founder",
        "location": "Atlanta, GA",
        "avatar_url": "data:image/jpeg;base64,QUJDRA==",
        "resume_url": "https://example.com/resume.pdf",
        "profile_theme": "engineer",
        "profile_primary_color": "#123456",
    }
    users.insert_one(original)

    linked = oauth_routes._find_or_create_oauth_user(
        "google", "google-user-123", "tee@example.com", "Different Google Name"
    )

    assert linked["bio"] == original["bio"]
    assert linked["headline"] == original["headline"]
    assert linked["location"] == original["location"]
    assert linked["avatar_url"] == original["avatar_url"]
    assert linked["resume_url"] == original["resume_url"]
    assert linked["profile_theme"] == original["profile_theme"]
    assert linked["profile_primary_color"] == original["profile_primary_color"]
    assert linked["name"] == "Tee"
    assert linked["oauth"]["google_id"] == "google-user-123"


def test_partial_profile_patch_does_not_clear_omitted_fields(monkeypatch):
    users = _mock_users(monkeypatch)
    user_id = ObjectId()
    users.insert_one(
        {
            "_id": user_id,
            "name": "Tee",
            "email": "tee@example.com",
            "bio": "Keep this bio",
            "headline": "Founder",
            "location": "Atlanta, GA",
            "resume_url": "https://example.com/resume.pdf",
            "profile_theme": "default",
        }
    )
    current = users.find_one({"_id": user_id})

    auth_routes.update_profile(
        auth_routes.ProfileUpdateRequest(profile_theme="engineer"),
        current_user=current,
    )
    saved = users.find_one({"_id": user_id})

    assert saved["profile_theme"] == "engineer"
    assert saved["bio"] == "Keep this bio"
    assert saved["headline"] == "Founder"
    assert saved["location"] == "Atlanta, GA"
    assert saved["resume_url"] == "https://example.com/resume.pdf"


def test_open_to_talk_can_be_enabled_without_booking_url(monkeypatch):
    users = _mock_users(monkeypatch)
    user_id = ObjectId()
    users.insert_one({"_id": user_id, "email": "tee@example.com", "name": "Tee"})
    current = users.find_one({"_id": user_id})

    result = connection_routes.update_profile_connection(
        connection_routes.ProfileConnectionUpdate(
            open_to_talk=True,
            open_to_talk_note="Virtual coffee is welcome.",
            open_to_talk_types=["general-chat", "virtual-coffee"],
        ),
        current_user=current,
    )

    assert result["open_to_talk"] is True
    assert result["open_to_talk_url"] == ""
    assert result["open_to_talk_types"] == ["general-chat", "virtual-coffee"]


def test_compressed_profile_photo_data_url_persists(monkeypatch):
    users = _mock_users(monkeypatch)
    user_id = ObjectId()
    users.insert_one({"_id": user_id, "email": "tee@example.com", "name": "Tee"})
    current = users.find_one({"_id": user_id})
    avatar = "data:image/jpeg;base64,QUJDRA=="

    media_routes.update_avatar(
        media_routes.AvatarUpdateRequest(avatar_url=avatar),
        current_user=current,
    )

    assert users.find_one({"_id": user_id})["avatar_url"] == avatar
