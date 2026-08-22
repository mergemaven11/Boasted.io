from datetime import datetime, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

import app.impact_receipt_routes as impact_receipt_routes
from app.main import app


client = TestClient(app)


@pytest.fixture
def receipt_context(monkeypatch):
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["bragstack_receipt_core_loop_test"]
    receipts = mock_db["impact_receipts"]
    entries = mock_db["entries"]
    user = {
        "_id": ObjectId(),
        "name": "Core Loop User",
        "email": "core-loop@example.com",
    }

    monkeypatch.setattr(impact_receipt_routes, "entries_collection", entries)
    monkeypatch.setattr(impact_receipt_routes, "impact_receipts_collection", receipts)
    app.dependency_overrides[impact_receipt_routes.get_current_user] = lambda: user

    yield user, receipts
    app.dependency_overrides.clear()


def valid_payload():
    return {
        "accomplishment": "Reduced repeat support incidents",
        "contribution": "Found the recurring Docker DNS failure and documented the fix.",
        "result": "Repeat incidents fell after the troubleshooting guide shipped.",
        "metrics": [
            {
                "label": "Repeat incidents reduced",
                "value": "25%",
                "context": "30 days after the guide shipped",
            }
        ],
        "evidence": [
            {
                "evidence_type": "support-incident",
                "title": "Incident INC-1042",
                "reference": "INC-1042",
                "description": "Shows the original failure and resolution.",
                "is_public": False,
            }
        ],
        "skills": ["Docker", "Troubleshooting"],
        "is_public": False,
    }


def test_create_standalone_receipt_captures_complete_core_loop(receipt_context):
    user, receipts = receipt_context

    response = client.post("/impact-receipts", json=valid_payload())

    assert response.status_code == 201
    data = response.json()
    assert data["source_entry_id"] is None
    assert data["schema_version"] == 2
    assert data["is_public"] is False
    assert data["metrics"][0]["value"] == "25%"
    assert data["evidence"][0]["title"] == "Incident INC-1042"
    assert data["evidence"][0]["is_public"] is False
    assert data["skills"] == ["Docker", "Troubleshooting"]
    assert "evidence-linked" in data["trust_signals"]

    stored = receipts.find_one({"_id": ObjectId(data["id"])})
    assert stored["user_id"] == str(user["_id"])
    assert stored["schema_version"] == 2


def test_create_receipt_requires_evidence(receipt_context):
    payload = valid_payload()
    payload["evidence"] = []

    response = client.post("/impact-receipts", json=payload)

    assert response.status_code == 422


def test_create_receipt_rejects_blank_skills_after_normalization(receipt_context):
    payload = valid_payload()
    payload["skills"] = ["   "]

    response = client.post("/impact-receipts", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"] == "At least one skill is required."


def test_owner_can_update_evidence_metrics_and_visibility(receipt_context):
    user, receipts = receipt_context
    now = datetime.now(timezone.utc)
    receipt_id = receipts.insert_one(
        {
            "user_id": str(user["_id"]),
            "source_entry_id": None,
            "accomplishment": "Original accomplishment",
            "contribution": "Original contribution",
            "result": "Original result",
            "metrics": [],
            "evidence": [],
            "skills": ["Python"],
            "credit": [],
            "confirmations": [],
            "trust_signals": ["self-documented"],
            "is_public": False,
            "schema_version": 2,
            "created_at": now,
            "updated_at": now,
        }
    ).inserted_id

    response = client.patch(
        f"/impact-receipts/{receipt_id}",
        json={
            "metrics": [{"label": "Time saved", "value": "4 hours/week"}],
            "evidence": [
                {
                    "evidence_type": "documentation",
                    "title": "Runbook",
                    "reference": "https://example.com/runbook",
                    "is_public": True,
                }
            ],
            "is_public": True,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_public"] is True
    assert data["metrics"][0]["value"] == "4 hours/week"
    assert "evidence-linked" in data["trust_signals"]


def test_owner_can_delete_receipt(receipt_context):
    user, receipts = receipt_context
    now = datetime.now(timezone.utc)
    receipt_id = receipts.insert_one(
        {
            "user_id": str(user["_id"]),
            "source_entry_id": None,
            "accomplishment": "Delete me",
            "contribution": "Temporary",
            "result": "Temporary",
            "metrics": [],
            "evidence": [],
            "skills": [],
            "credit": [],
            "confirmations": [],
            "trust_signals": ["self-documented"],
            "is_public": False,
            "schema_version": 2,
            "created_at": now,
            "updated_at": now,
        }
    ).inserted_id

    response = client.delete(f"/impact-receipts/{receipt_id}")

    assert response.status_code == 204
    assert receipts.find_one({"_id": receipt_id}) is None


def test_user_cannot_delete_someone_elses_receipt(receipt_context):
    _, receipts = receipt_context
    now = datetime.now(timezone.utc)
    receipt_id = receipts.insert_one(
        {
            "user_id": str(ObjectId()),
            "source_entry_id": None,
            "accomplishment": "Not yours",
            "contribution": "Another user's work",
            "result": "Another user's result",
            "metrics": [],
            "evidence": [],
            "skills": [],
            "credit": [],
            "confirmations": [],
            "trust_signals": ["self-documented"],
            "is_public": False,
            "schema_version": 2,
            "created_at": now,
            "updated_at": now,
        }
    ).inserted_id

    response = client.delete(f"/impact-receipts/{receipt_id}")

    assert response.status_code == 404
    assert receipts.find_one({"_id": receipt_id}) is not None
