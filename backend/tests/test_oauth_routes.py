from fastapi import Request

import app.oauth_routes as oauth_routes


def _request(url: str = "http://internal-service/auth/google/login") -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "scheme": "http",
        "path": "/auth/google/login",
        "raw_path": b"/auth/google/login",
        "query_string": b"",
        "headers": [(b"host", b"internal-service")],
        "client": ("127.0.0.1", 12345),
        "server": ("internal-service", 80),
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


def test_redirect_uri_falls_back_to_request_url_for_local_dev(monkeypatch):
    monkeypatch.setattr(oauth_routes, "OAUTH_CALLBACK_BASE_URL", "")

    class FakeRequest:
        def url_for(self, name):
            return f"http://localhost:8000/{name}"

    request = FakeRequest()

    assert oauth_routes._redirect_uri(request, "google") == "http://localhost:8000/google_callback"
    assert oauth_routes._redirect_uri(request, "github") == "http://localhost:8000/github_callback"
