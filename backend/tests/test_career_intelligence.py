from datetime import datetime, timezone

from app.career_intelligence import build_career_intelligence


def test_career_intelligence_combines_entries_and_receipts():
    now = datetime(2026, 8, 26, tzinfo=timezone.utc)
    entries = [
        {"category": "Platform Engineering", "tags": ["Docker", "Python"], "impact": "Reduced deployment time by 40%", "entry_date": "2026-08-01"},
        {"category": "Platform Engineering", "tags": ["docker", "Linux"], "impact": "Automated container health checks", "entry_date": "2026-07-15"},
    ]
    receipts = [
        {
            "skills": ["Docker", "Automation"],
            "result": "Cut recovery time to 12 minutes",
            "metrics": [{"label": "Recovery time", "value": "12 min"}],
            "evidence": [{"title": "Incident report"}],
            "confirmations": [{"status": "confirmed", "confirmation_type": "stakeholder"}],
            "created_at": datetime(2026, 8, 5, tzinfo=timezone.utc),
        }
    ]

    result = build_career_intelligence(entries, receipts, now=now)

    assert result["summary"]["accomplishments"] == 2
    assert result["summary"]["impact_receipts"] == 1
    assert result["summary"]["quantified_results"] == 2
    docker = next(skill for skill in result["skills"] if skill["skill"].casefold() == "docker")
    assert docker["demonstrations"] == 3
    assert docker["quantified_examples"] == 2
    assert docker["evidence_items"] == 1
    assert docker["confirmations"] == 1
    assert docker["recent"] is True
    assert result["methodology"]["employment_decision"] is False


def test_linked_receipt_enriches_instead_of_double_counting_proof():
    now = datetime(2026, 8, 26, tzinfo=timezone.utc)
    entries = [
        {
            "_id": "entry-1",
            "category": "Platform Engineering",
            "tags": ["Docker"],
            "impact": "Reduced deployment time by 40%",
            "entry_date": "2026-08-01",
        }
    ]
    receipts = [
        {
            "_id": "receipt-1",
            "source_entry_id": "entry-1",
            "skills": ["Docker"],
            "result": "Reduced deployment time by 40%",
            "metrics": [{"label": "Deployment time", "value": "40%"}],
            "evidence": [{"title": "Deployment report"}],
            "confirmations": [{"status": "confirmed", "confirmation_type": "stakeholder"}],
            "created_at": datetime(2026, 8, 2, tzinfo=timezone.utc),
        }
    ]

    result = build_career_intelligence(entries, receipts, now=now)

    assert result["summary"]["quantified_results"] == 1
    docker = next(skill for skill in result["skills"] if skill["skill"] == "Docker")
    assert docker["demonstrations"] == 1
    assert docker["accomplishments"] == 1
    assert docker["impact_receipts"] == 1
    assert docker["quantified_examples"] == 1
    assert docker["evidence_items"] == 1
    assert docker["confirmations"] == 1


def test_career_intelligence_surfaces_proof_gaps_without_readiness_score():
    result = build_career_intelligence(
        [
            {"category": "Operations", "tags": [], "impact": "Improved the process", "entry_date": "2026-08-01"},
            {"category": "Operations", "tags": [], "impact": "Documented the workflow", "entry_date": "2026-08-02"},
            {"category": "Operations", "tags": [], "impact": "Coordinated the launch", "entry_date": "2026-08-03"},
        ],
        [],
        now=datetime(2026, 8, 26, tzinfo=timezone.utc),
    )

    gap_types = {gap["type"] for gap in result["gaps"]}
    assert "receipt_coverage" in gap_types
    assert "quantified_impact" in gap_types
    assert "skills" in gap_types
    assert "readiness_score" not in result
    assert result["recommended_actions"]
