from datetime import datetime, timezone

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
        sent.update({"to": to_email, "owner": owner_name, "token": raw_token})

    monkeypatch.setattr(verification_routes, "impact_receipts_collection", receipts)
    monkeypatch.setattr(verification_routes, "_send_request_email", fake_send)
    app.dependency_overrides[verification_routes.get_current_user] = lambda: user
    yield user, receipts, receipt_id, sent
    app.dependency_overrides.clear()


def test_owner_can_request_verification_and_email_token_is_not_returned(verification_context):
    _, receipts, receipt_id, sent = verification_context
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
    stored = receipts.find_one({"_id": receipt_id})["confirmations"][0]
    assert stored["status"] == "pending"
    assert stored["token_hash"] != sent["token"]


def test_public_link_exposes_claim_but_not_verifier_email(verification_context):
    _, _, receipt_id, sent = verification_context
    client.post(f"/impact-receipts/{receipt_id}/verification-requests", json={"name": "Jane", "email": "jane@example.com", "confirmation_type": "collaborator"})
    response = client.get(f"/receipt-verifications/{sent['token']}")
    assert response.status_code == 200
    data = response.json()
    assert data["accomplishment"] == "Reduced deployment failures"
    assert data["verifier_name"] == "Jane"
    assert "email" not in data
    assert "BragStack records your attestation" in data["statement"]


def test_confirm_adds_trust_signal_and_token_is_single_use(verification_context):
    _, receipts, receipt_id, sent = verification_context
    client.post(f"/impact-receipts/{receipt_id}/verification-requests", json={"name": "Jane", "email": "jane@example.com", "confirmation_type": "collaborator"})
    response = client.post(f"/receipt-verifications/{sent['token']}/decision", json={"decision": "confirmed"})
    assert response.status_code == 200
    stored = receipts.find_one({"_id": receipt_id})
    assert stored["confirmations"][0]["status"] == "confirmed"
    assert "collaborator-confirmed" in stored["trust_signals"]
    assert "email" not in stored["confirmations"][0]
    second = client.post(f"/receipt-verifications/{sent['token']}/decision", json={"decision": "confirmed"})
    assert second.status_code == 404


def test_decline_is_recorded_without_confirmed_trust_signal(verification_context):
    _, receipts, receipt_id, sent = verification_context
    client.post(f"/impact-receipts/{receipt_id}/verification-requests", json={"name": "Jane", "email": "jane@example.com", "confirmation_type": "stakeholder"})
    response = client.post(f"/receipt-verifications/{sent['token']}/decision", json={"decision": "declined"})
    assert response.status_code == 200
    stored = receipts.find_one({"_id": receipt_id})
    assert stored["confirmations"][0]["status"] == "declined"
    assert "stakeholder-verified" not in stored["trust_signals"]
