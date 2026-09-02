"""Document this first-party Python module."""
from datetime import datetime, timedelta, timezone

import mongomock
import pytest
from bson import ObjectId
from fastapi.testclient import TestClient

import app.executive_impact_routes as routes
from app.main import app

client = TestClient(app)


@pytest.fixture
def context(monkeypatch):
    """Handle context.

    Args:
        monkeypatch: Function argument.

    Yields:
        Values produced by the function.
    """
    db = mongomock.MongoClient()["executive_test"]
    monkeypatch.setattr(routes, "executive_goals_collection", db["goals"])
    monkeypatch.setattr(routes, "executive_export_audit_collection", db["exports"])
    user = {"_id": ObjectId(), "email": "exec@example.com", "plan": "enterprise", "workspace_id": "acme", "workspace_role": "executive"}
    app.dependency_overrides[routes.get_current_user] = lambda: user
    yield user, db["goals"], db["exports"]
    app.dependency_overrides.clear()


def metric(**overrides):
    """Handle metric.

    Args:
        overrides: Function argument.

    Returns:
        Function result.
    """
    value = {"key": "reliability", "definition": "Successful requests", "lens": "reliability", "unit": "%", "baseline": 97, "target": 99.9, "actual": 99.5, "period": "Q3 2026", "owner": "Platform", "limitations": "Excludes planned maintenance", "sources": [{"title": "SLO report", "reference": "slo:q3", "observed_at": datetime.now(timezone.utc).isoformat()}]}
    value.update(overrides)
    return value


def goal_payload(metrics=None):
    """Handle goal payload.

    Args:
        metrics: Function argument.

    Returns:
        Function result.
    """
    return {"title": "Reliable platform", "description": "Improve customer-facing reliability", "status": "at-risk", "period": "Q3 2026", "owner": "VP Engineering", "project_ids": ["platform-12"], "metrics": metrics if metrics is not None else [metric()]}


def test_enterprise_executive_can_create_and_read_source_backed_goal(context):
    """Verify enterprise executive can create and read source backed goal.

    Args:
        context: Function argument.
    """
    _, _, _ = context
    created = client.post("/enterprise/executive-impact/goals", json=goal_payload())
    assert created.status_code == 201
    response = client.get("/enterprise/executive-impact")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] == {"goals": 1, "at_risk": 1, "metrics": 1, "source_backed": 1, "suppressed": 0}
    assert data["governance"]["individual_scoring"] is False
    assert data["goals"][0]["metrics"][0]["freshness"] == "current"


def test_actual_without_source_is_rejected(context):
    """Verify actual without source is rejected.

    Args:
        context: Function argument.
    """
    response = client.post("/enterprise/executive-impact/goals", json=goal_payload([metric(sources=[])]))
    assert response.status_code == 422


def test_small_cohort_is_suppressed_and_stale_source_is_visible(context):
    """Verify small cohort is suppressed and stale source is visible.

    Args:
        context: Function argument.
    """
    old = (datetime.now(timezone.utc) - timedelta(days=120)).isoformat()
    payload = goal_payload([metric(cohort_size=3), metric(key="risk", lens="risk", cohort_size=10, sources=[{"title": "Risk register", "reference": "risk:q3", "observed_at": old}])])
    assert client.post("/enterprise/executive-impact/goals", json=payload).status_code == 201
    metrics = client.get("/enterprise/executive-impact").json()["goals"][0]["metrics"]
    assert metrics[0]["suppressed"] is True
    assert metrics[0]["actual"] is None
    assert metrics[0]["sources"] == []
    assert metrics[1]["freshness"] == "stale"


def test_free_plan_and_member_role_are_denied(context):
    """Verify free plan and member role are denied.

    Args:
        context: Function argument.
    """
    user, _, _ = context
    user["plan"] = "free"
    assert client.get("/enterprise/executive-impact").status_code == 403
    user["plan"] = "enterprise"
    user["workspace_role"] = "member"
    assert client.get("/enterprise/executive-impact").json()["detail"]["code"] == "executive_role_required"


def test_board_export_is_bounded_watermarked_and_audited(context):
    """Verify board export is bounded watermarked and audited.

    Args:
        context: Function argument.
    """
    _, _, exports = context
    goal_id = client.post("/enterprise/executive-impact/goals", json=goal_payload()).json()["id"]
    response = client.post("/enterprise/executive-impact/exports", json={"goal_ids": [goal_id], "purpose": "board"})
    assert response.status_code == 202
    assert "CONFIDENTIAL · BOARD" in response.json()["watermark"]
    assert response.json()["audited"] is True
    assert exports.count_documents({"purpose": "board"}) == 1
