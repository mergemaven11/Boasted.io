"""Document this first-party Python module."""
from datetime import datetime, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

import app.confidentiality as confidentiality
import app.confidentiality_routes as confidentiality_routes
import app.impact_receipt_routes as impact_receipt_routes
from app.main import app


client = TestClient(app)


def attestation_headers(method: str, path: str) -> dict[str, str]:
    """Mint the same one-time confidentiality token the browser uses."""
    response = client.post(
        "/confidentiality/attestations",
        json={
            "version": confidentiality.CONFIDENTIALITY_ATTESTATION_VERSION,
            "method": method,
            "path": path,
            "confirmed": True,
        },
    )
    assert response.status_code == 201, response.text
    return {
        confidentiality.CONFIDENTIALITY_ATTESTATION_HEADER: response.json()["attestation_token"],
    }


@pytest.fixture
def receipt_context(monkeypatch):
    """Handle receipt context.

    Args:
        monkeypatch: Function argument.

    Yields:
        Values produced by the function.
    """
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["bragstack_receipt_core_loop_test"]
    receipts = mock_db["impact_receipts"]
    entries = mock_db["entries"]
    attestations = mock_db["confidentiality_attestations"]
    user = {
        "_id": ObjectId(),
        "name": "Core Loop User",
        "email": "core-loop@example.com",
    }

    monkeypatch.setattr(impact_receipt_routes, "entries_collection", entries)
    monkeypatch.setattr(impact_receipt_routes, "impact_receipts_collection", receipts)
    monkeypatch.setattr(confidentiality, "confidentiality_attestations_collection", attestations)
    monkeypatch.setattr(confidentiality_routes, "confidentiality_attestations_collection", attestations)
    app.dependency_overrides[impact_receipt_routes.get_current_user] = lambda: user

    yield user, receipts
    app.dependency_overrides.clear()


def valid_payload():
    """Handle valid payload.

    Returns:
        Function result.
    """
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
    """Verify create standalone receipt captures complete core loop.

    Args:
        receipt_context: Function argument.
    """
    user, receipts = receipt_context

    response = client.post(
        "/impact-receipts",
        json=valid_payload(),
        headers=attestation_headers("POST", "/impact-receipts"),
    )

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
    """Verify create receipt requires evidence.

    Args:
        receipt_context: Function argument.
    """
    payload = valid_payload()
    payload["evidence"] = []

    response = client.post(
        "/impact-receipts",
        json=payload,
        headers=attestation_headers("POST", "/impact-receipts"),
    )

    assert response.status_code == 422


def test_create_receipt_rejects_blank_skills_after_normalization(receipt_context):
    """Verify create receipt rejects blank skills after normalization.

    Args:
        receipt_context: Function argument.
    """
    payload = valid_payload()
    payload["skills"] = ["   "]

    response = client.post(
        "/impact-receipts",
        json=payload,
        headers=attestation_headers("POST", "/impact-receipts"),
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "At least one skill is required."


def test_owner_can_update_evidence_metrics_and_visibility(receipt_context):
    """Verify owner can update evidence metrics and visibility.

    Args:
        receipt_context: Function argument.
    """
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
    path = f"/impact-receipts/{receipt_id}"

    response = client.patch(
        path,
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
        headers=attestation_headers("PATCH", path),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_public"] is True
    assert data["metrics"][0]["value"] == "4 hours/week"
    assert "evidence-linked" in data["trust_signals"]


def test_owner_can_delete_receipt(receipt_context):
    """Verify owner can delete receipt.

    Args:
        receipt_context: Function argument.
    """
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
    """Verify user cannot delete someone elses receipt.

    Args:
        receipt_context: Function argument.
    """
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
