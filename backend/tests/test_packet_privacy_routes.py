from datetime import datetime, timedelta, timezone

import mongomock
from bson import ObjectId
from fastapi.testclient import TestClient
from starlette.requests import Request

import app.private_packet_routes as private_packet_routes
import app.private_packet_share_routes as private_share_routes
import app.rate_limit as rate_limit
from app.auth import hash_password
from app.main import app


client = TestClient(app)

SENSITIVE_PACKET_PATHS = [
    "/packets/performance-review",
    "/packets/performance-review-v12",
    "/packets/promotion",
    "/packets/interview",
    "/packets/certification",
    "/packets/performance-review.pdf",
    "/packets/performance-review-v12.pdf",
    "/packets/promotion.pdf",
    "/packets/interview.pdf",
    "/packets/certification.pdf",
]


def test_private_packet_builders_and_exports_are_post_only():
    paths = app.openapi()["paths"]
    for path in SENSITIVE_PACKET_PATHS:
        assert path in paths
        methods = set(paths[path])
        assert "post" in methods
        assert "get" not in methods


def test_sensitive_packet_context_is_accepted_in_json_body_not_query(monkeypatch):
    user = {"_id": ObjectId(), "email": "packet@example.com", "name": "Packet User", "plan": "pro"}
    captured = {}

    def build_platform(payload, current_user):
        captured["payload"] = payload
        captured["user"] = current_user
        return {
            "kind": "performance-review",
            "context": {"organization": payload.organization},
            "branding": {"reviewer_name": payload.reviewer_name},
            "annotations": {
                "packet_note": payload.packet_note,
                "item_notes": payload.item_notes,
            },
        }

    app.dependency_overrides[private_packet_routes.get_current_user] = lambda: user
    monkeypatch.setattr(private_packet_routes, "_build_platform", build_platform)

    sensitive = {
        "organization": "Quiet Acquisition Target",
        "reviewer_name": "Private Reviewer",
        "packet_note": "Do not put this note in browser history",
        "item_notes": {"entry-1": "Manager-only context"},
        "signature_entry_ids": ["entry-1"],
        "sections": ["review-summary"],
        "confidential": True,
    }
    response = client.post("/packets/performance-review-v12", json=sensitive)

    assert response.status_code == 200
    assert captured["user"] == user
    assert captured["payload"].organization == sensitive["organization"]
    assert captured["payload"].reviewer_name == sensitive["reviewer_name"]
    assert captured["payload"].packet_note == sensitive["packet_note"]
    assert captured["payload"].item_notes == sensitive["item_notes"]
    assert "?" not in str(response.request.url)
    for value in [sensitive["organization"], sensitive["reviewer_name"], sensitive["packet_note"]]:
        assert value not in str(response.request.url)

    legacy = client.get(
        "/packets/performance-review-v12",
        params={"organization": sensitive["organization"], "reviewer_name": sensitive["reviewer_name"]},
    )
    assert legacy.status_code == 405
    app.dependency_overrides.clear()


def test_protected_share_code_is_exchanged_for_clean_cookie_grant(monkeypatch):
    mock_db = mongomock.MongoClient()["packet_privacy_test"]
    shares = mock_db["packet_shares"]
    rate_limits = mock_db["rate_limits"]
    token = "share-token-value"
    access_code = "correct-horse-battery"
    item = {
        "_id": ObjectId(),
        "token_hash": private_share_routes._token_hash(token),
        "access_code_hash": hash_password(access_code),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=2),
        "revoked": False,
        "allow_download": False,
    }
    shares.insert_one(item)

    monkeypatch.setattr(private_share_routes.packet_share_routes, "packet_shares_collection", shares)
    monkeypatch.setattr(rate_limit, "rate_limits_collection", rate_limits)
    monkeypatch.setattr(private_share_routes, "SHARE_COOKIE_SECURE", False)
    monkeypatch.setattr(
        private_share_routes,
        "_build_shared_packet",
        lambda stored: ({"_id": ObjectId()}, {"title": "Unlocked packet"}),
    )
    monkeypatch.setattr(
        private_share_routes,
        "_shared_html",
        lambda packet, **kwargs: "<html><body>Unlocked packet</body></html>",
    )

    untrusted_query = client.get(f"/shared/packets/{token}", params={"code": access_code})
    assert untrusted_query.status_code == 200
    assert "Protected packet" in untrusted_query.text
    assert access_code not in untrusted_query.text

    granted = client.post(
        f"/shared/packets/{token}/access",
        data={"access_code": access_code},
        follow_redirects=False,
    )
    assert granted.status_code == 303
    assert granted.headers["location"] == f"/shared/packets/{token}"
    assert access_code not in granted.headers["location"]
    assert access_code not in granted.headers["set-cookie"]
    assert "HttpOnly" in granted.headers["set-cookie"]
    assert "SameSite=lax" in granted.headers["set-cookie"]

    clean_view = client.get(f"/shared/packets/{token}")
    assert clean_view.status_code == 200
    assert "Unlocked packet" in clean_view.text
    assert access_code not in str(clean_view.request.url)


def test_expired_signed_share_grant_is_rejected(monkeypatch):
    token = "expiring-share"
    item = {"access_code_hash": "stored-access-hash"}
    expires_epoch = 2_000_000_000
    grant = private_share_routes._grant_value(token, item, expires_epoch)
    cookie_name = private_share_routes._cookie_name(token)
    scope = {
        "type": "http",
        "method": "GET",
        "scheme": "https",
        "path": f"/shared/packets/{token}",
        "raw_path": f"/shared/packets/{token}".encode(),
        "query_string": b"",
        "headers": [(b"cookie", f"{cookie_name}={grant}".encode())],
        "client": ("203.0.113.10", 1234),
        "server": ("testserver", 443),
    }
    request = Request(scope)

    monkeypatch.setattr(private_share_routes.time, "time", lambda: expires_epoch - 1)
    assert private_share_routes._has_access(request, token, item) is True

    monkeypatch.setattr(private_share_routes.time, "time", lambda: expires_epoch)
    assert private_share_routes._has_access(request, token, item) is False
