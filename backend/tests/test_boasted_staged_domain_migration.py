"""Regression guards for the staged BOASTED domain migration.

The public BOASTED frontend can move to boasted.io before the OAuth provider
callbacks move off the legacy API hostname. Keeping those two origins
decoupled lets existing Google/GitHub OAuth registrations keep working while
the customer-facing brand/domain changes.
"""

from fastapi import Request

import app.oauth_routes as oauth_routes


def _request() -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "scheme": "https",
        "path": "/auth/google/login",
        "raw_path": b"/auth/google/login",
        "query_string": b"",
        "headers": [(b"host", b"internal-service")],
        "client": ("127.0.0.1", 12345),
        "server": ("internal-service", 443),
    }
    return Request(scope)


def test_boasted_frontend_keeps_legacy_google_callback(monkeypatch):
    monkeypatch.setattr(oauth_routes, "FRONTEND_URL", "https://boasted.io")
    monkeypatch.setattr(
        oauth_routes,
        "OAUTH_CALLBACK_BASE_URL",
        "https://api.usebragstack.com",
    )

    assert oauth_routes._redirect_uri(_request(), "google") == (
        "https://api.usebragstack.com/auth/google/callback"
    )


def test_boasted_frontend_keeps_legacy_github_callback(monkeypatch):
    monkeypatch.setattr(oauth_routes, "FRONTEND_URL", "https://boasted.io")
    monkeypatch.setattr(
        oauth_routes,
        "OAUTH_CALLBACK_BASE_URL",
        "https://api.usebragstack.com",
    )

    assert oauth_routes._redirect_uri(_request(), "github") == (
        "https://api.usebragstack.com/auth/github/callback"
    )


def test_oauth_success_returns_existing_user_to_boasted(monkeypatch):
    monkeypatch.setattr(oauth_routes, "FRONTEND_URL", "https://boasted.io")
    monkeypatch.setattr(oauth_routes, "create_access_token", lambda _payload: "test-token")

    response = oauth_routes._frontend_success_redirect({"_id": "existing-user-id"})

    assert response.headers["location"] == (
        "https://boasted.io/login#oauth_token=test-token"
    )
