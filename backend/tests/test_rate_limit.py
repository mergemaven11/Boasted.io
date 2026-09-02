"""Document this first-party Python module."""
import mongomock
from fastapi.testclient import TestClient
from starlette.requests import Request

import app.auth_routes as auth_routes
import app.main as main_module
import app.rate_limit as rate_limit
from app.main import app

TEST_EPOCH = 1_800_000_000


def _request(path: str, *, method: str = "POST", client_ip: str = "203.0.113.10") -> Request:
    """Handle request.

    Args:
        path: Function argument.
        method: Function argument.
        client_ip: Function argument.

    Returns:
        Function result.
    """
    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": method,
        "scheme": "https",
        "path": path,
        "raw_path": path.encode("utf-8"),
        "query_string": b"",
        "headers": [],
        "client": (client_ip, 12345),
        "server": ("testserver", 443),
    }
    return Request(scope)


def _use_mock_rate_limits(monkeypatch):
    """Handle use mock rate limits.

    Args:
        monkeypatch: Function argument.

    Returns:
        Function result.
    """
    db = mongomock.MongoClient()["bragstack_test"]
    monkeypatch.setattr(rate_limit, "rate_limits_collection", db["rate_limits"])
    monkeypatch.setattr(rate_limit, "RATE_LIMIT_ENABLED", True)
    return db


def test_fixed_window_limit_returns_retry_after_and_resets(monkeypatch):
    """Verify fixed window limit returns retry after and resets.

    Args:
        monkeypatch: Function argument.
    """
    db = _use_mock_rate_limits(monkeypatch)
    monkeypatch.setitem(
        rate_limit.POLICIES,
        "auth_login",
        rate_limit.RateLimitPolicy("auth_login", limit=2, window_seconds=60),
    )
    request = _request("/auth/login")

    assert rate_limit.check_rate_limit(request, now_epoch=TEST_EPOCH) is None
    assert rate_limit.check_rate_limit(request, now_epoch=TEST_EPOCH + 1) is None
    blocked = rate_limit.check_rate_limit(request, now_epoch=TEST_EPOCH + 2)

    assert blocked is not None
    assert blocked.policy == "auth_login"
    assert blocked.limit == 2
    assert blocked.retry_after == 58

    assert rate_limit.check_rate_limit(request, now_epoch=TEST_EPOCH + 60) is None
    assert db.rate_limits.count_documents({}) == 2


def test_rate_limit_bucket_does_not_store_raw_client_address(monkeypatch):
    """Verify rate limit bucket does not store raw client address.

    Args:
        monkeypatch: Function argument.
    """
    db = _use_mock_rate_limits(monkeypatch)
    client_ip = "198.51.100.42"
    request = _request("/auth/register", client_ip=client_ip)

    rate_limit.check_rate_limit(request, now_epoch=TEST_EPOCH)

    bucket = db.rate_limits.find_one()
    assert bucket is not None
    assert client_ip not in bucket["_id"]
    assert client_ip not in repr(bucket)
    assert bucket["policy"] == "auth_register"


def test_targeted_policy_selection_covers_abuse_sensitive_routes(monkeypatch):
    """Verify targeted policy selection covers abuse sensitive routes.

    Args:
        monkeypatch: Function argument.
    """
    monkeypatch.setattr(rate_limit, "RATE_LIMIT_ENABLED", True)

    cases = [
        ("POST", "/auth/login", "auth_login"),
        ("POST", "/auth/register", "auth_register"),
        ("POST", "/auth/email-verification/resend", "auth_email"),
        ("POST", "/auth/password-reset/request", "auth_email"),
        ("POST", "/auth/password-reset/confirm", "auth_confirm"),
        ("GET", "/auth/google/login", "oauth"),
        ("GET", "/auth/github/callback", "oauth"),
        ("POST", "/impact-receipts/507f1f77bcf86cd799439011/verification-requests", "receipt_verification_send"),
        ("GET", "/receipt-verifications/token-value", "receipt_verification_public"),
        ("POST", "/receipt-verifications/token-value/decision", "receipt_verification_public"),
        ("POST", "/shared/packets/share-token/access", "packet_share_access"),
        ("GET", "/public/brag/example-user", "public_profile"),
        ("GET", "/public/brag/example-user/profile", "public_profile"),
    ]

    for method, path, expected in cases:
        policy = rate_limit.policy_for_request(_request(path, method=method))
        assert policy is not None
        assert policy.name == expected

    assert rate_limit.policy_for_request(_request("/health", method="GET")) is None
    assert rate_limit.policy_for_request(_request("/entries", method="GET")) is None


def test_login_429_is_generic_pre_lookup_and_browser_readable(monkeypatch):
    """Verify login 429 is generic pre lookup and browser readable.

    Args:
        monkeypatch: Function argument.
    """
    db = _use_mock_rate_limits(monkeypatch)
    monkeypatch.setitem(
        rate_limit.POLICIES,
        "auth_login",
        rate_limit.RateLimitPolicy("auth_login", limit=1, window_seconds=600),
    )
    monkeypatch.setattr(auth_routes, "users_collection", db["users"])
    monkeypatch.setattr(main_module, "record_request", lambda **kwargs: None)
    monkeypatch.setattr(main_module, "record_persistent_request", lambda **kwargs: None)

    client = TestClient(app)
    browser_headers = {"Origin": "http://localhost:5173"}
    first = client.post(
        "/auth/login",
        data={"username": "missing@example.com", "password": "wrong-password"},
        headers=browser_headers,
    )
    second = client.post(
        "/auth/login",
        data={"username": "another@example.com", "password": "wrong-password"},
        headers=browser_headers,
    )

    assert first.status_code == 401
    assert second.status_code == 429
    assert second.json() == {"detail": "Too many requests. Try again later."}
    assert int(second.headers["Retry-After"]) >= 1
    assert second.headers["RateLimit-Limit"] == "1"
    assert second.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "missing@example.com" not in second.text
    assert "another@example.com" not in second.text
