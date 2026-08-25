from fastapi import HTTPException
from fastapi.testclient import TestClient
from jose import jwt

import app.auth as auth
import app.main as main


client = TestClient(main.app)


def test_api_responses_include_security_headers():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["permissions-policy"] == "camera=(), geolocation=(), microphone=()"
    assert response.headers["cache-control"] == "no-store"


def test_hsts_is_only_added_for_https_requests():
    insecure = client.get("/health")
    secure = client.get("/health", headers={"x-forwarded-proto": "https"})

    assert "strict-transport-security" not in insecure.headers
    assert secure.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"


def test_password_hashing_rejects_values_beyond_bcrypt_limit():
    too_long = "a" * (auth.MAX_BCRYPT_PASSWORD_BYTES + 1)

    try:
        auth.hash_password(too_long)
    except HTTPException as exc:
        assert exc.status_code == 422
        assert "72 UTF-8 bytes" in exc.detail
    else:
        raise AssertionError("Overlong passwords must be rejected before bcrypt")

    assert auth.verify_password(too_long, "$2b$12$invalid.invalid.invalid.invalid.invalid.invalid.invalid.invalid") is False


def test_access_tokens_include_lifecycle_and_unique_identifier_claims():
    token = auth.create_access_token({"sub": "507f1f77bcf86cd799439011"})
    payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

    assert payload["sub"] == "507f1f77bcf86cd799439011"
    assert payload["jti"]
    assert payload["iat"] <= payload["exp"]
    assert payload["nbf"] <= payload["exp"]
