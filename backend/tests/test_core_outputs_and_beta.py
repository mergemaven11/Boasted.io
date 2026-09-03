"""Document this first-party Python module."""
from datetime import datetime, timedelta, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

import app.beta_metrics_routes as beta_metrics_routes
import app.core_output_routes as core_output_routes
from app.main import app


client = TestClient(app)


@pytest.fixture
def output_context(monkeypatch):
    """Handle output context.

    Args:
        monkeypatch: Function argument.

    Yields:
        Values produced by the function.
    """
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["bragstack_core_outputs_test"]
    receipts = mock_db["impact_receipts"]
    feedback = mock_db["beta_feedback"]

    user = {
        "_id": ObjectId(),
        "name": "Evidence User",
        "email": "evidence@example.com",
    }

    monkeypatch.setattr(core_output_routes, "impact_receipts_collection", receipts)
    monkeypatch.setattr(beta_metrics_routes, "impact_receipts_collection", receipts)
    monkeypatch.setattr(beta_metrics_routes, "beta_feedback_collection", feedback)

    app.dependency_overrides[core_output_routes.get_current_user] = lambda: user
    app.dependency_overrides[beta_metrics_routes.get_current_user] = lambda: user

    yield user, receipts, feedback

    app.dependency_overrides.clear()


def insert_receipt(receipts, user, **overrides):
    """Handle insert receipt.

    Args:
        receipts: Function argument.
        user: Function argument.
        overrides: Function argument.

    Returns:
        Function result.
    """
    now = overrides.pop("created_at", datetime.now(timezone.utc))
    document = {
        "user_id": str(user["_id"]),
        "source_entry_id": None,
        "accomplishment": "Reduced recurring Docker incidents",
        "contribution": "Diagnosed container DNS failures and documented the fix",
        "result": "Reduced repeat incidents by 25%",
        "metrics": [
            {"label": "Repeat incidents reduced", "value": "25%", "context": "quarter over quarter"}
        ],
        "evidence": [
            {
                "evidence_type": "support-incident",
                "title": "Incident INC-1042",
                "reference": "INC-1042",
                "description": "Original incident and resolution notes",
                "is_public": False,
            }
        ],
        "skills": ["Docker", "Networking", "Troubleshooting"],
        "credit": [],
        "confirmations": [],
        "trust_signals": ["self-documented", "evidence-linked"],
        "is_public": False,
        "schema_version": 2,
        "created_at": now,
        "updated_at": now,
    }
    document.update(overrides)
    return receipts.insert_one(document).inserted_id


def test_performance_review_uses_only_receipts(output_context):
    """Verify performance review uses only receipts.

    Args:
        output_context: Function argument.
    """
    user, receipts, _ = output_context
    receipt_id = insert_receipt(receipts, user)

    response = client.get("/outputs/performance-review")

    assert response.status_code == 200
    data = response.json()
    assert data["source_policy"] == "impact_receipts_only"
    assert data["source_receipt_ids"] == [str(receipt_id)]
    assert data["summary"]["receipt_count"] == 1
    assert data["summary"]["evidence_count"] == 1
    assert data["review_highlights"][0]["result"] == "Reduced repeat incidents by 25%"
    assert data["review_highlights"][0]["evidence"][0]["reference"] == "INC-1042"


def test_resume_target_can_rank_but_not_invent_claims(output_context):
    """Verify resume target can rank but not invent claims.

    Args:
        output_context: Function argument.
    """
    user, receipts, _ = output_context
    insert_receipt(receipts, user)

    response = client.post(
        "/outputs/resume-material",
        json={
            "target_role": "Kubernetes Platform Engineer",
            "target_description": "Requires Kubernetes, Terraform, AWS, Docker, networking, and Python.",
            "max_bullets": 5,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["source_policy"] == "impact_receipts_only"
    assert len(data["resume_bullets"]) == 1

    bullet = data["resume_bullets"][0]["bullet"]
    assert "Docker" not in bullet or "Docker" in "Diagnosed container DNS failures and documented the fix Reduced repeat incidents by 25%"
    assert "Kubernetes" not in bullet
    assert "Terraform" not in bullet
    assert "AWS" not in bullet
    assert data["evidence_backed_skills"] == ["Docker", "Networking", "Troubleshooting"]


def test_resume_output_does_not_use_other_users_receipts(output_context):
    """Verify resume output does not use other users receipts.

    Args:
        output_context: Function argument.
    """
    user, receipts, _ = output_context
    insert_receipt(receipts, user)
    other_user = {"_id": ObjectId()}
    insert_receipt(
        receipts,
        other_user,
        accomplishment="Migrated Kubernetes clusters",
        contribution="Migrated clusters",
        result="Cut deploy time by 50%",
        skills=["Kubernetes"],
    )

    response = client.post(
        "/outputs/resume-material",
        json={"target_role": "Kubernetes Engineer", "target_description": "Kubernetes"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["resume_bullets"]) == 1
    assert "Kubernetes" not in data["resume_bullets"][0]["bullet"]


def test_beta_feedback_captures_activation_repeat_return_and_pull(output_context):
    """Verify beta feedback captures activation repeat return and pull.

    Args:
        output_context: Function argument.
    """
    user, receipts, feedback = output_context
    now = datetime.now(timezone.utc)
    insert_receipt(receipts, user, created_at=now - timedelta(days=2))
    insert_receipt(
        receipts,
        user,
        accomplishment="Improved runbook quality",
        contribution="Rewrote escalation runbooks",
        result="Reduced escalation handoff time by 15%",
        created_at=now,
    )

    response = client.post(
        "/beta/feedback",
        json={
            "willingness_to_pay": "yes",
            "willing_price_cents": 1200,
            "would_miss_score": 5,
            "would_miss_text": "I would miss having proof ready for reviews.",
            "primary_value": "Evidence-backed review prep",
        },
    )

    assert response.status_code == 200
    metrics = response.json()["product_metrics"]
    assert metrics["activated"] is True
    assert metrics["repeat_creator"] is True
    assert metrics["returned_to_create"] is True
    assert feedback.count_documents({}) == 1

    aggregate = client.get("/beta/metrics")
    assert aggregate.status_code == 200
    data = aggregate.json()
    assert data["activation_rate_percent"] == 100
    assert data["repeat_receipt_rate_percent"] == 100
    assert data["return_creation_rate_percent"] == 100
    assert data["willing_to_pay_yes_percent"] == 100
    assert data["would_miss_strongly_percent"] == 100
    assert data["pull_signal"]["strong"] is True
