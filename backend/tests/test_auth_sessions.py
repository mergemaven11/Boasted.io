"""Server-managed authentication session tests."""

from datetime import datetime, timedelta, timezone

import mongomock
from bson import ObjectId
from fastapi.testclient import TestClient
from jose import jwt

import app.auth as auth
import app.auth_routes as auth_routes
import app.auth_sessions as auth_sessions
from app.main import app


client = TestClient(app)


def _mock_auth_store(monkeypatch):
    mock_client = mongomock.MongoClient()
    database = mock_client["boasted_auth_test"]
    users = database["users"]
    sessions = database["auth_sessions"]
    monkeypatch.setattr(auth_routes, "users_collection", users)
    monkeypatch.setattr(auth, "users_collection", users)
    monkeypatch.setattr(auth_sessions, "auth_sessions_collection", sessions)
    return users, sessions


def _insert_verified_user(users, email="person@example.com", password="secure-pass-123"):
    user_id = ObjectId()
    users.insert_one(
        {
            "_id": user_id,
            "name": "Session Person",
            "email": email,
            "hashed_password": auth.hash_password(password),
            "email_verification_required": False,
            "email_verified_at": datetime.now(timezone.utc).isoformat(),
            "public_slug": "session-person-test",
        }
    )
    return user_id


def _login(email="person@example.com", password="secure-pass-123"):
    response = client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_login_issues_session_bound_token(monkeypatch):
    users, sessions = _mock_auth_store(monkeypatch)
    user_id = _insert_verified_user(users)

    token = _login()
    payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

    assert payload["sub"] == str(user_id)
    assert payload["sid"]
    stored = sessions.find_one({"_id": payload["sid"]})
    assert stored is not None
    assert stored["user_id"] == str(user_id)
    assert stored["revoked_at"] is None

    current = client.get("/auth/me", headers=_auth_headers(token))
    assert current.status_code == 200
    assert current.json()["email"] == "person@example.com"


def test_idle_session_is_rejected_after_sixty_minutes(monkeypatch):
    users, sessions = _mock_auth_store(monkeypatch)
    _insert_verified_user(users)
    token = _login()
    payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

    sessions.update_one(
        {"_id": payload["sid"]},
        {"$set": {"last_seen_at": datetime.now(timezone.utc) - timedelta(minutes=61)}},
    )

    response = client.get("/auth/me", headers=_auth_headers(token))
    assert response.status_code == 401
    assert "Session expired" in response.json()["detail"]
    stored = sessions.find_one({"_id": payload["sid"]})
    assert stored["revoked_reason"] == "idle_timeout"


def test_logout_revokes_current_session_server_side(monkeypatch):
    users, sessions = _mock_auth_store(monkeypatch)
    _insert_verified_user(users)
    token = _login()
    payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

    logout = client.post("/auth/logout", headers=_auth_headers(token))
    assert logout.status_code == 200
    assert sessions.find_one({"_id": payload["sid"]})["revoked_reason"] == "logout"

    after_logout = client.get("/auth/me", headers=_auth_headers(token))
    assert after_logout.status_code == 401


def test_password_reset_revokes_all_existing_sessions(monkeypatch):
    users, sessions = _mock_auth_store(monkeypatch)
    user_id = _insert_verified_user(users)
    first = _login()
    second = _login()
    assert sessions.count_documents({"user_id": str(user_id), "revoked_at": None}) == 2

    raw_reset_token = "reset-token-with-enough-characters-123456789"
    users.update_one(
        {"_id": user_id},
        {
            "$set": {
                "password_reset_token_hash": auth_routes._hash_token(raw_reset_token),
                "password_reset_expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
            }
        },
    )

    response = client.post(
        "/auth/password-reset/confirm",
        json={"token": raw_reset_token, "password": "new-secure-pass-456"},
    )
    assert response.status_code == 200
    assert sessions.count_documents({"user_id": str(user_id), "revoked_at": None}) == 0
    assert sessions.count_documents({"user_id": str(user_id), "revoked_reason": "password_reset"}) == 2

    assert client.get("/auth/me", headers=_auth_headers(first)).status_code == 401
    assert client.get("/auth/me", headers=_auth_headers(second)).status_code == 401


def test_legacy_token_without_session_id_is_rejected(monkeypatch):
    users, _ = _mock_auth_store(monkeypatch)
    user_id = _insert_verified_user(users)
    legacy_token = auth.create_access_token({"sub": str(user_id)})

    response = client.get("/auth/me", headers=_auth_headers(legacy_token))
    assert response.status_code == 401
