"""Regression coverage for confidentiality attestation issuance and enforcement."""
from datetime import datetime, timedelta, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi import HTTPException
from fastapi.testclient import TestClient

import app.confidentiality as confidentiality
import app.confidentiality_routes as confidentiality_routes
from app.main import app


client = TestClient(app)


@pytest.fixture
def confidentiality_context(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_confidentiality_test"]
    attestations = mock_db["confidentiality_attestations"]
    user = {"_id": ObjectId(), "email": "nda-test@example.com", "name": "NDA Test"}

    monkeypatch.setattr(confidentiality, "confidentiality_attestations_collection", attestations)
    monkeypatch.setattr(confidentiality_routes, "confidentiality_attestations_collection", attestations)
    app.dependency_overrides[confidentiality_routes.get_current_user] = lambda: user

    yield user, attestations
    app.dependency_overrides.clear()


@pytest.mark.parametrize(
    ("method", "path", "expected"),
    [
        ("POST", "/entries", "entry.create"),
        ("PUT", "/entries/abc", "entry.update"),
        ("PATCH", "/entries/abc", "entry.update"),
        ("POST", "/impact-receipts", "impact_receipt.create"),
        ("POST", "/impact-receipts/from-entry/abc", "impact_receipt.create_from_entry"),
        ("PATCH", "/impact-receipts/abc", "impact_receipt.update"),
        ("GET", "/entries", None),
        ("DELETE", "/entries/abc", None),
        ("POST", "/auth/login", None),
    ],
)
def test_confidentiality_action_mapping(method, path, expected):
    assert confidentiality.confidentiality_action_for_request(method, path) == expected


def test_issue_stores_hash_not_plaintext_token(confidentiality_context):
    user, attestations = confidentiality_context
    issued = confidentiality.issue_confidentiality_attestation(
        user_id=str(user["_id"]),
        method="POST",
        path="/entries",
        version=confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
    )

    stored = attestations.find_one({"_id": ObjectId(issued["id"])})
    assert stored["token_hash"] != issued["attestation_token"]
    assert issued["attestation_token"] not in str(stored)
    assert stored["status"] == "issued"
    assert "draft" not in stored
    assert "content" not in stored


def test_issue_rejects_stale_client_version(confidentiality_context):
    user, _ = confidentiality_context
    with pytest.raises(HTTPException) as exc:
        confidentiality.issue_confidentiality_attestation(
            user_id=str(user["_id"]),
            method="POST",
            path="/entries",
            version="old-version",
        )
    assert exc.value.status_code == 409
    assert exc.value.detail["code"] == "confidentiality_attestation_version_mismatch"


def test_issue_rejects_unprotected_action(confidentiality_context):
    user, _ = confidentiality_context
    with pytest.raises(HTTPException) as exc:
        confidentiality.issue_confidentiality_attestation(
            user_id=str(user["_id"]),
            method="GET",
            path="/entries",
            version=confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
        )
    assert exc.value.status_code == 400
    assert exc.value.detail["code"] == "unsupported_confidentiality_action"


def test_consume_requires_token_for_protected_write(confidentiality_context):
    user, _ = confidentiality_context
    with pytest.raises(HTTPException) as exc:
        confidentiality.consume_confidentiality_attestation(
            user_id=str(user["_id"]), method="POST", path="/entries", token=None
        )
    assert exc.value.status_code == 428
    assert exc.value.detail["code"] == "confidentiality_attestation_required"


def test_attestation_is_one_time(confidentiality_context):
    user, attestations = confidentiality_context
    issued = confidentiality.issue_confidentiality_attestation(
        user_id=str(user["_id"]),
        method="POST",
        path="/entries",
        version=confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
    )

    consumed = confidentiality.consume_confidentiality_attestation(
        user_id=str(user["_id"]),
        method="POST",
        path="/entries",
        token=issued["attestation_token"],
        request_id="req-123",
    )
    assert consumed["required"] is True
    assert consumed["action"] == "entry.create"

    stored = attestations.find_one({"_id": ObjectId(issued["id"])})
    assert stored["status"] == "consumed"
    assert stored["request_id"] == "req-123"

    with pytest.raises(HTTPException) as exc:
        confidentiality.consume_confidentiality_attestation(
            user_id=str(user["_id"]),
            method="POST",
            path="/entries",
            token=issued["attestation_token"],
        )
    assert exc.value.status_code == 428
    assert exc.value.detail["code"] == "confidentiality_attestation_invalid"


def test_attestation_is_bound_to_user(confidentiality_context):
    user, _ = confidentiality_context
    issued = confidentiality.issue_confidentiality_attestation(
        user_id=str(user["_id"]),
        method="POST",
        path="/entries",
        version=confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
    )
    with pytest.raises(HTTPException):
        confidentiality.consume_confidentiality_attestation(
            user_id=str(ObjectId()),
            method="POST",
            path="/entries",
            token=issued["attestation_token"],
        )


def test_attestation_is_bound_to_action(confidentiality_context):
    user, _ = confidentiality_context
    issued = confidentiality.issue_confidentiality_attestation(
        user_id=str(user["_id"]),
        method="POST",
        path="/entries",
        version=confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
    )
    with pytest.raises(HTTPException):
        confidentiality.consume_confidentiality_attestation(
            user_id=str(user["_id"]),
            method="PATCH",
            path="/impact-receipts/abc",
            token=issued["attestation_token"],
        )


def test_expired_attestation_is_rejected(confidentiality_context):
    user, _ = confidentiality_context
    issued_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    issued = confidentiality.issue_confidentiality_attestation(
        user_id=str(user["_id"]),
        method="POST",
        path="/entries",
        version=confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
        now=issued_at,
    )
    with pytest.raises(HTTPException):
        confidentiality.consume_confidentiality_attestation(
            user_id=str(user["_id"]),
            method="POST",
            path="/entries",
            token=issued["attestation_token"],
            now=datetime.now(timezone.utc),
        )


def test_unprotected_request_needs_no_attestation(confidentiality_context):
    user, _ = confidentiality_context
    result = confidentiality.consume_confidentiality_attestation(
        user_id=str(user["_id"]), method="GET", path="/entries", token=None
    )
    assert result == {"required": False}


def test_issue_route_requires_explicit_confirmation(confidentiality_context):
    response = client.post(
        "/confidentiality/attestations",
        json={
            "version": confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
            "method": "POST",
            "path": "/entries",
            "confirmed": False,
        },
    )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "confidentiality_confirmation_required"


def test_issue_route_returns_short_lived_token(confidentiality_context):
    response = client.post(
        "/confidentiality/attestations",
        json={
            "version": confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
            "method": "POST",
            "path": "/entries",
            "confirmed": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["action"] == "entry.create"
    assert data["version"] == confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION
    assert data["attestation_token"]
    issued_at = datetime.fromisoformat(data["issued_at"])
    expires_at = datetime.fromisoformat(data["expires_at"])
    assert 0 < (expires_at - issued_at).total_seconds() <= confidentiality.ATTESTATION_TTL_SECONDS


def test_ops_serializer_never_exposes_token_hash_or_draft():
    document = {
        "_id": ObjectId(),
        "user_id": "user-1",
        "action": "entry.create",
        "version": confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
        "status": "consumed",
        "issued_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc),
        "consumed_at": datetime.now(timezone.utc),
        "request_id": "req-1",
        "purge_at": datetime.now(timezone.utc),
        "token_hash": "secret-hash",
        "draft": "must never leak",
    }
    serialized = confidentiality_routes._serialize_receipt(document)
    assert "token_hash" not in serialized
    assert "draft" not in serialized
    assert serialized["action"] == "entry.create"
