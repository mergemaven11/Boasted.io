from datetime import datetime, timedelta, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

import app.receipt_verification_routes as verification_routes
from app.main import app

client = TestClient(app)


@pytest.fixture
def verification_context(monkeypatch):
    db = mongomock.MongoClient()["receipt_verification_test"]
    receipts = db["impact_receipts"]
    requests = db["receipt_verification_requests"]
    user = {"_id": ObjectId(), "name": "Tee Test", "email": "owner@example.com"}
    now = datetime.now(timezone.utc)
    receipt_id = receipts.insert_one({
        "user_id": str(user["_id"]),
        "accomplishment": "Reduced deployment failures",
        "contribution": "Built safer deployment checks.",
        "result": "Deployment failures fell by 30%.",
        "metrics": [{"label": "Failures reduced", "value": "30%"}],
        "evidence": [{"evidence_type": "pull-request", "title": "Deployment PR", "is_public": False}],
        "skills": ["Docker", "CI/CD"],
        "credit": [],
        "confirmations": [],
        "trust_signals": ["self-documented", "evidence-linked"],
        "is_public": False,
        "schema_version": 2,
        "created_at": now,
        "updated_at": now,
    }).inserted_id
    sent = {}

    async def fake_send(to_email, owner_name, receipt, confirmation, raw_token):
        sent.update({"to": to_email, "owner": owner_name, "token": raw_token, "message": confirmation.get("message")})

    monkeypatch.setattr(verification_routes, "impact_receipts_collection", receipts)
    monkeypatch.setattr(verification_routes, "receipt_verification_requests_collection", requests)
    monkeypatch.setattr(verification_routes, "_send_request_email", fake_send)
    app.dependency_overrides[verification_routes.get_current_user] = lambda: user
    yield user, receipts, requests, receipt_id, sent
    app.dependency_overrides.clear()


def test_owner_can_request_verification_without_storing_contact_payload_on_receipt(verification_context):
    _, receipts, requests, receipt_id, sent = verification_context
    response = client.post(f"/impact-receipts/{receipt_id}/verification-requests", json={
        "name": "Jane Manager",
        "email": "Jane@example.com",
        "role": "Engineering Manager",
        "confirmation_type": "stakeholder",
        "message": "Please confirm this project impact.",
    })
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
    assert "token" not in response.json()
    assert sent["to"] == "jane@example.com"
    assert sent["message"] == "Please confirm this project impact."

    stored = receipts.find_one({"_id": receipt_id})["confirmations"][0]
    assert stored["status"] == "pending"
    assert "email" not in stored
    assert "message" not in stored
    assert "token_hash" not in stored

    request_record = requests.find_one({"receipt_id": str(receipt_id)})
    assert request_record["email"] == "jane@example.com"
    assert request_record["message"] == "Please confirm this project impact."
    assert request_record["token_hash"] != sent["token"]
    assert sent["token"] not in repr(request_record)


def test_public_link_exposes_claim_and_optional_message_but_not_verifier_email(verification_context):
    _, _, _, receipt_id, sent = verification_context
    client.post(
        f"/impact-receipts/{receipt_id}/verification-requests",
        json={"name": "Jane", "email": "jane@example.com", "confirmation_type": "collaborator", "message": "Please review."},
    )
    response = client.get(f"/receipt-verifications/{sent['token']}")
    assert response.status_code == 200
    data = response.json()
    assert data["accomplishment"] == "Reduced deployment failures"
    assert data["verifier_name"] == "Jane"
    assert data["message"] == "Please review."
    assert "email" not in data
    assert "BragStack records your attestation" in data["statement"]


def test_confirm_minimizes_attestation_and_deletes_pending_contact_payload(verification_context):
    _, receipts, requests, receipt_id, sent = verification_context
    client.post(
        f"/impact-receipts/{receipt_id}/verification-requests",
        json={"name": "Jane", "email": "jane@example.com", "confirmation_type": "collaborator", "message": "Private note"},
    )
    assert requests.count_documents({}) == 1

    response = client.post(f"/receipt-verifications/{sent['token']}/decision", json={"decision": "confirmed"})
    assert response.status_code == 200
    stored = receipts.find_one({"_id": receipt_id})
    confirmation = stored["confirmations"][0]
    assert confirmation["status"] == "confirmed"
    assert "collaborator-confirmed" in stored["trust_signals"]
    assert "email" not in confirmation
    assert "message" not in confirmation
    assert "token_hash" not in confirmation
    assert "expires_at" not in confirmation
    assert confirmation["confirmed_at"] is not None
    assert requests.count_documents({}) == 0

    second = client.post(f"/receipt-verifications/{sent['token']}/decision", json={"decision": "confirmed"})
    assert second.status_code == 404


def test_decline_is_minimized_and_contact_payload_deleted(verification_context):
    _, receipts, requests, receipt_id, sent = verification_context
    client.post(
        f"/impact-receipts/{receipt_id}/verification-requests",
        json={"name": "Jane", "email": "jane@example.com", "confirmation_type": "stakeholder"},
    )
    response = client.post(f"/receipt-verifications/{sent['token']}/decision", json={"decision": "declined"})
    assert response.status_code == 200
    stored = receipts.find_one({"_id": receipt_id})
    confirmation = stored["confirmations"][0]
    assert confirmation["status"] == "declined"
    assert "stakeholder-verified" not in stored["trust_signals"]
    assert "email" not in confirmation
    assert "message" not in confirmation
    assert "token_hash" not in confirmation
    assert requests.count_documents({}) == 0


def test_duplicate_active_verification_request_for_same_email_is_rejected(verification_context):
    _, _, requests, receipt_id, _ = verification_context
    first = client.post(
        f"/impact-receipts/{receipt_id}/verification-requests",
        json={"name": "Jane", "email": "jane@example.com", "confirmation_type": "stakeholder"},
    )
    second = client.post(
        f"/impact-receipts/{receipt_id}/verification-requests",
        json={"name": "Jane Again", "email": "JANE@example.com", "confirmation_type": "stakeholder"},
    )
    assert first.status_code == 201
    assert second.status_code == 409
    assert requests.count_documents({"email": "jane@example.com"}) == 1


def test_expired_request_removes_pending_confirmation_and_contact_payload(verification_context):
    _, receipts, requests, receipt_id, _ = verification_context
    raw_token = "expired-token"
    confirmation_id = "expired-confirmation"
    expired_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    receipts.update_one(
        {"_id": receipt_id},
        {"$push": {"confirmations": {
            "id": confirmation_id,
            "name": "Expired Verifier",
            "role": None,
            "confirmation_type": "stakeholder",
            "status": "pending",
            "requested_at": expired_at - timedelta(days=7),
            "expires_at": expired_at,
            "confirmed_at": None,
        }}},
    )
    requests.insert_one({
        "receipt_id": str(receipt_id),
        "user_id": "owner",
        "confirmation_id": confirmation_id,
        "email": "expired@example.com",
        "message": "Delete me",
        "token_hash": verification_routes._hash_token(raw_token),
        "requested_at": expired_at - timedelta(days=7),
        "expires_at": expired_at,
    })

    response = client.get(f"/receipt-verifications/{raw_token}")
    assert response.status_code in {404, 410}
    assert requests.count_documents({}) == 0
    stored = receipts.find_one({"_id": receipt_id})
    assert all(item.get("id") != confirmation_id for item in stored.get("confirmations", []))
