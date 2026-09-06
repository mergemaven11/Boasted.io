"""OAuth redirect URI regression tests."""
from fastapi import Request

import app.oauth_routes as oauth_routes


def _request(
    *,
    host: str = "internal-service",
    scheme: str = "http",
    forwarded_proto: str = "",
    forwarded_host: str = "",
    cookie: str = "",
) -> Request:
    """Build a minimal Starlette request for OAuth redirect tests."""
    headers = [(b"host", host.encode())]
    if forwarded_proto:
        headers.append((b"x-forwarded-proto", forwarded_proto.encode()))
    if forwarded_host:
        headers.append((b"x-forwarded-host", forwarded_host.encode()))
    if cookie:
        headers.append((b"cookie", cookie.encode()))
    scope = {
        "type": "http",
        "method": "GET",
        "scheme": scheme,
        "path": "/auth/google/login",
        "raw_path": b"/auth/google/login",
        "query_string": b"",
        "headers": headers,
        "client": ("127.0.0.1", 12345),
        "server": (host.split(":", 1)[0], int(host.split(":", 1)[1]) if ":" in host else 80),
    }
    return Request(scope)


def test_redirect_uri_uses_explicit_callback_base(monkeypatch):
    monkeypatch.setattr(
        oauth_routes,
        "OAUTH_CALLBACK_BASE_URL",
        "https://bragstack-api-bxf3.onrender.com",
    )
    request = _request()

    assert oauth_routes._redirect_uri(request, "google") == (
        "https://bragstack-api-bxf3.onrender.com/auth/google/callback"
    )
    assert oauth_routes._redirect_uri(request, "github") == (
        "https://bragstack-api-bxf3.onrender.com/auth/github/callback"
    )


def test_redirect_uri_uses_request_host_for_local_dev(monkeypatch):
    monkeypatch.setattr(oauth_routes, "OAUTH_CALLBACK_BASE_URL", "")
    request = _request(host="localhost:8000")

    assert oauth_routes._redirect_uri(request, "google") == "http://localhost:8000/auth/google/callback"
    assert oauth_routes._redirect_uri(request, "github") == "http://localhost:8000/auth/github/callback"


def test_redirect_uri_honors_reverse_proxy_public_origin(monkeypatch):
    monkeypatch.setattr(oauth_routes, "OAUTH_CALLBACK_BASE_URL", "")
    request = _request(
        host="internal-service",
        forwarded_proto="https",
        forwarded_host="api.usebragstack.com",
    )

    assert oauth_routes._redirect_uri(request, "google") == "https://api.usebragstack.com/auth/google/callback"
    assert oauth_routes._redirect_uri(request, "github") == "https://api.usebragstack.com/auth/github/callback"


def test_registration_consent_is_bound_to_oauth_state():
    request = _request(cookie="oauth_registration_consent_google=expected-state")

    assert oauth_routes._registration_consent_matches(request, "google", "expected-state") is True
    assert oauth_routes._registration_consent_matches(request, "google", "different-state") is False
