"""Regression tests for Career Intelligence temporal trajectory."""
from datetime import datetime, timezone

from app.career_intelligence import build_career_intelligence
from app.career_intelligence_trajectory import enrich_career_trajectory


def _build(entries, receipts, *, now):
    result = build_career_intelligence(entries, receipts, now=now)
    return enrich_career_trajectory(result, entries, receipts, now=now)


def test_trajectory_separates_current_core_historical_core_and_recent_growth():
    now = datetime(2026, 9, 5, tzinfo=timezone.utc)
    entries = [
        {
            "_id": "linux-old-1",
            "category": "Systems",
            "tags": ["Linux"],
            "impact": "Maintained production systems",
            "entry_date": "2024-01-01",
        },
        {
            "_id": "linux-old-2",
            "category": "Systems",
            "tags": ["Linux"],
            "impact": "Resolved server incidents",
            "entry_date": "2024-03-01",
        },
        {
            "_id": "docker-recent-1",
            "category": "Platform Engineering",
            "tags": ["Docker"],
            "impact": "Improved container reliability",
            "entry_date": "2026-07-01",
        },
        {
            "_id": "docker-recent-2",
            "category": "Platform Engineering",
            "tags": ["Docker"],
            "impact": "Automated container troubleshooting",
            "entry_date": "2026-08-15",
        },
        {
            "_id": "pi-recent",
            "category": "Edge Computing",
            "tags": ["Raspberry Pi"],
            "impact": "Built a portable field device",
            "entry_date": "2026-09-01",
        },
    ]

    result = _build(entries, [], now=now)

    linux = next(skill for skill in result["skills"] if skill["skill"] == "Linux")
    docker = next(skill for skill in result["skills"] if skill["skill"] == "Docker")
    pi = next(skill for skill in result["skills"] if skill["skill"] == "Raspberry Pi")

    assert linux["trajectory"] == "historical-core"
    assert linux["recent_demonstrations"] == 0
    assert linux["historical_demonstrations"] == 2
    assert docker["trajectory"] == "current-core"
    assert docker["recent_demonstrations"] == 2
    assert pi["trajectory"] == "recent-emerging"

    profile = result["career_profile"]
    assert profile["current_core_skills"] == ["Docker"]
    assert profile["historical_core_skills"] == ["Linux"]
    assert profile["recent_emerging_skills"] == ["Raspberry Pi"]
    assert profile["headline"] == "Platform Engineering"
    assert "Current repeated signals include Docker" in profile["summary"]
    assert result["methodology"]["version"] == "career-intelligence-v4"


def test_one_recent_and_one_old_example_is_active_not_artificially_strong():
    now = datetime(2026, 9, 5, tzinfo=timezone.utc)
    entries = [
        {
            "category": "Developer Tooling",
            "tags": ["Python"],
            "impact": "Built support automation",
            "entry_date": "2024-01-01",
        },
        {
            "category": "Developer Tooling",
            "tags": ["Python"],
            "impact": "Built a new internal tool",
            "entry_date": "2026-08-01",
        },
    ]

    result = _build(entries, [], now=now)
    python = result["skills"][0]

    assert python["signal"] == "established"
    assert python["trajectory"] == "active"
    assert python["recent_demonstrations"] == 1
    assert python["historical_demonstrations"] == 1
    assert result["summary"]["active_skill_count"] == 1


def test_linked_receipt_does_not_turn_historical_work_into_current_momentum():
    now = datetime(2026, 9, 5, tzinfo=timezone.utc)
    entries = [
        {
            "_id": "old-entry",
            "category": "Operations",
            "tags": ["Troubleshooting"],
            "impact": "Resolved recurring incidents",
            "entry_date": "2024-01-01",
        }
    ]
    receipts = [
        {
            "_id": "new-receipt",
            "source_entry_id": "old-entry",
            "skills": ["Troubleshooting"],
            "result": "Resolved recurring incidents",
            "evidence": [{"title": "Historical incident report"}],
            "created_at": "2026-09-05",
        }
    ]

    result = _build(entries, receipts, now=now)
    skill = result["skills"][0]

    assert skill["demonstrations"] == 1
    assert skill["trajectory"] == "historical"
    assert skill["recent_demonstrations"] == 0
    assert skill["historical_demonstrations"] == 1
    assert result["summary"]["recent_emerging_skill_count"] == 0


def test_undated_proof_is_not_mislabeled_historical():
    now = datetime(2026, 9, 5, tzinfo=timezone.utc)
    entries = [
        {
            "category": "Operations",
            "tags": ["Networking"],
            "impact": "Resolved connectivity issue",
        }
    ]

    result = _build(entries, [], now=now)
    networking = result["skills"][0]

    assert networking["trajectory"] == "undated"
    assert networking["recent_demonstrations"] == 0
    assert networking["historical_demonstrations"] == 0
    assert networking["undated_demonstrations"] == 1


def test_trajectory_does_not_change_base_evidence_points():
    now = datetime(2026, 9, 5, tzinfo=timezone.utc)
    entries = [
        {
            "category": "Platform Engineering",
            "tags": ["Docker"],
            "impact": "Reduced deployment time by 20%",
            "entry_date": "2026-08-01",
        },
        {
            "category": "Platform Engineering",
            "tags": ["Docker"],
            "impact": "Improved recovery workflow",
            "entry_date": "2026-08-15",
        },
    ]

    base = build_career_intelligence(entries, [], now=now)
    points_before = base["skills"][0]["evidence_points"]
    enriched = enrich_career_trajectory(base, entries, [], now=now)

    assert enriched["skills"][0]["evidence_points"] == points_before
    assert enriched["skills"][0]["trajectory"] == "current-core"
