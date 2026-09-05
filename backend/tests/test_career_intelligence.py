"""Tests for explainable Career Intelligence."""
from datetime import datetime, timezone

from app.career_intelligence import build_career_intelligence


def test_career_intelligence_combines_entries_and_receipts():
    """Verify career intelligence combines entries and receipts."""
    now = datetime(2026, 8, 26, tzinfo=timezone.utc)
    entries = [
        {
            "category": "Platform Engineering",
            "tags": ["Docker", "Python"],
            "impact": "Reduced deployment time by 40%",
            "entry_date": "2026-08-01",
        },
        {
            "category": "Platform Engineering",
            "tags": ["docker", "Linux"],
            "impact": "Automated container health checks",
            "entry_date": "2026-07-15",
        },
    ]
    receipts = [
        {
            "skills": ["Docker", "Automation"],
            "result": "Cut recovery time to 12 minutes",
            "metrics": [{"label": "Recovery time", "value": "12 min"}],
            "evidence": [{"title": "Incident report"}],
            "confirmations": [
                {"status": "confirmed", "confirmation_type": "stakeholder"}
            ],
            "created_at": datetime(2026, 8, 5, tzinfo=timezone.utc),
        }
    ]

    result = build_career_intelligence(entries, receipts, now=now)

    assert result["summary"]["accomplishments"] == 2
    assert result["summary"]["impact_receipts"] == 1
    assert result["summary"]["total_proof_records"] == 3
    assert result["summary"]["distinct_demonstrations"] == 3
    assert result["summary"]["quantified_results"] == 2
    docker = next(
        skill for skill in result["skills"] if skill["skill"].casefold() == "docker"
    )
    assert docker["demonstrations"] == 3
    assert docker["quantified_examples"] == 2
    assert docker["evidence_items"] == 1
    assert docker["evidence_backed_demonstrations"] == 1
    assert docker["confirmations"] == 1
    assert docker["confirmed_demonstrations"] == 1
    assert docker["support_level"] == "well-supported"
    assert docker["recent"] is True
    assert result["career_profile"]["primary_skills"]
    assert "Docker" in result["career_profile"]["primary_skills"]
    assert result["career_profile"]["maturity"] == "developing"
    assert "repeated signals" in result["recommended_actions"][0]
    assert result["methodology"]["employment_decision"] is False
    assert result["methodology"]["version"] == "career-intelligence-v3"


def test_linked_receipt_enriches_instead_of_double_counting_proof():
    """Verify linked receipt enriches instead of double counting proof."""
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
            "confirmations": [
                {"status": "confirmed", "confirmation_type": "stakeholder"}
            ],
            "created_at": datetime(2026, 8, 2, tzinfo=timezone.utc),
        }
    ]

    result = build_career_intelligence(entries, receipts, now=now)

    assert result["summary"]["total_proof_records"] == 2
    assert result["summary"]["distinct_demonstrations"] == 1
    assert result["summary"]["quantified_results"] == 1
    assert result["summary"]["receipt_coverage_percent"] == 100
    docker = next(skill for skill in result["skills"] if skill["skill"] == "Docker")
    assert docker["demonstrations"] == 1
    assert docker["accomplishments"] == 1
    assert docker["impact_receipts"] == 1
    assert docker["quantified_examples"] == 1
    assert docker["evidence_items"] == 1
    assert docker["evidence_backed_demonstrations"] == 1
    assert docker["confirmations"] == 1
    assert docker["confirmed_demonstrations"] == 1


def test_career_intelligence_surfaces_proof_gaps_without_readiness_score():
    """Verify career intelligence surfaces proof gaps without readiness score."""
    result = build_career_intelligence(
        [
            {
                "category": "Operations",
                "tags": [],
                "impact": "Improved the process",
                "entry_date": "2026-08-01",
            },
            {
                "category": "Operations",
                "tags": [],
                "impact": "Documented the workflow",
                "entry_date": "2026-08-02",
            },
            {
                "category": "Operations",
                "tags": [],
                "impact": "Coordinated the launch",
                "entry_date": "2026-08-03",
            },
        ],
        [],
        now=datetime(2026, 8, 26, tzinfo=timezone.utc),
    )

    gap_types = {gap["type"] for gap in result["gaps"]}
    assert result["summary"]["total_proof_records"] == 3
    assert "receipt_coverage" in gap_types
    assert "quantified_impact" in gap_types
    assert "skills" in gap_types
    assert "readiness_score" not in result
    assert result["recommended_actions"]


def test_compound_skill_tags_are_split_into_individual_signals():
    """Historical pasted skill lists should not become one giant skill."""
    result = build_career_intelligence(
        [
            {
                "category": "Platform Engineering",
                "tags": [
                    "Linux · Raspberry Pi · SSH · Networking · Systems Administration",
                    "Troubleshooting, Platform Engineering; Edge Computing | Developer Tooling",
                    "Python\nDocker",
                ],
                "impact": "Built and troubleshot a portable Linux platform.",
                "entry_date": "2026-09-05",
            }
        ],
        [],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    names = {skill["skill"] for skill in result["skills"]}
    assert {
        "Linux",
        "Raspberry Pi",
        "SSH",
        "Networking",
        "Systems Administration",
        "Troubleshooting",
        "Platform Engineering",
        "Edge Computing",
        "Developer Tooling",
        "Python",
        "Docker",
    }.issubset(names)
    assert not any(" · " in name for name in names)
    assert not any("," in name or ";" in name or "|" in name for name in names)


def test_recent_singleton_does_not_get_extra_proof_strength_for_recency():
    """Freshness should not inflate evidence points above older repeated proof."""
    result = build_career_intelligence(
        [
            {
                "category": "Operations",
                "tags": ["Linux"],
                "impact": "Resolved production incidents",
                "entry_date": "2025-01-10",
            },
            {
                "category": "Operations",
                "tags": ["Linux"],
                "impact": "Improved server reliability",
                "entry_date": "2025-02-10",
            },
            {
                "category": "Edge Computing",
                "tags": ["Raspberry Pi"],
                "impact": "Built a field device",
                "entry_date": "2026-09-05",
            },
        ],
        [],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    linux = next(skill for skill in result["skills"] if skill["skill"] == "Linux")
    pi = next(
        skill for skill in result["skills"] if skill["skill"] == "Raspberry Pi"
    )

    assert linux["recent"] is False
    assert pi["recent"] is True
    assert linux["evidence_points"] > pi["evidence_points"]
    assert result["skills"][0]["skill"] == "Linux"


def test_career_profile_synthesizes_multiple_records_instead_of_one_latest_skill():
    """The hero model should describe a combined body of proof."""
    result = build_career_intelligence(
        [
            {
                "category": "Platform Engineering",
                "tags": ["Linux", "Troubleshooting"],
                "impact": "Resolved production incidents",
                "entry_date": "2026-01-10",
            },
            {
                "category": "Platform Engineering",
                "tags": ["Linux", "Platform Engineering"],
                "impact": "Improved deployment reliability by 25%",
                "entry_date": "2026-03-10",
            },
            {
                "category": "Developer Tooling",
                "tags": ["Developer Tooling", "Troubleshooting"],
                "impact": "Created internal support tooling",
                "entry_date": "2026-05-10",
            },
            {
                "category": "Edge Computing",
                "tags": ["Raspberry Pi · SSH · Networking"],
                "impact": "Built a portable field device",
                "entry_date": "2026-09-05",
            },
        ],
        [],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    profile = result["career_profile"]
    assert profile["repeated_skill_count"] >= 2
    assert "Linux" in profile["primary_skills"]
    assert "Troubleshooting" in profile["primary_skills"]
    assert len(profile["primary_skills"]) > 1
    assert profile["headline"] == "Platform Engineering"
    assert "ranks repeated work before emerging signals" in profile["summary"]
    assert "Raspberry Pi · SSH · Networking" not in profile["headline"]


def test_linked_receipt_creation_date_does_not_refresh_old_work():
    """Documenting old work later must not make the underlying skill recent."""
    result = build_career_intelligence(
        [
            {
                "_id": "entry-old",
                "category": "Systems",
                "tags": ["Linux"],
                "impact": "Maintained production systems",
                "entry_date": "2024-01-01",
            }
        ],
        [
            {
                "_id": "receipt-new",
                "source_entry_id": "entry-old",
                "skills": ["Linux"],
                "evidence": [{"title": "Historical runbook"}],
                "created_at": "2026-09-05",
            }
        ],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    linux = result["skills"][0]
    assert linux["skill"] == "Linux"
    assert linux["recent"] is False
    assert linux["last_demonstrated_at"].startswith("2024-01-01")


def test_attachment_volume_does_not_inflate_skill_breadth_score():
    """Several files on one example should not fake several demonstrations."""
    base_receipt = {
        "_id": "receipt-1",
        "skills": ["Docker"],
        "result": "Documented a container deployment",
        "created_at": "2026-09-01",
    }
    one_file = build_career_intelligence(
        [],
        [{**base_receipt, "evidence": [{"title": "Report"}]}],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )
    many_files = build_career_intelligence(
        [],
        [
            {
                **base_receipt,
                "evidence": [
                    {"title": "Report"},
                    {"title": "Runbook"},
                    {"title": "Dashboard"},
                    {"title": "Ticket"},
                    {"title": "Diagram"},
                ],
            }
        ],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    one = one_file["skills"][0]
    many = many_files["skills"][0]
    assert one["evidence_items"] == 1
    assert many["evidence_items"] == 5
    assert one["evidence_backed_demonstrations"] == 1
    assert many["evidence_backed_demonstrations"] == 1
    assert one["evidence_points"] == many["evidence_points"]


def test_established_signal_ranks_ahead_of_well_documented_singleton():
    """Durability should rank ahead of a newly documented one-off skill."""
    result = build_career_intelligence(
        [
            {
                "category": "Operations",
                "tags": ["Linux"],
                "impact": "Resolved incidents",
                "entry_date": "2025-01-01",
            },
            {
                "category": "Operations",
                "tags": ["Linux"],
                "impact": "Maintained servers",
                "entry_date": "2025-02-01",
            },
        ],
        [
            {
                "skills": ["Raspberry Pi"],
                "result": "Reduced setup time by 50%",
                "metrics": [{"label": "Setup time", "value": "50%"}],
                "evidence": [{"title": "Build notes"}],
                "confirmations": [{"status": "confirmed"}],
                "created_at": "2026-09-05",
            }
        ],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    linux = next(skill for skill in result["skills"] if skill["skill"] == "Linux")
    pi = next(
        skill for skill in result["skills"] if skill["skill"] == "Raspberry Pi"
    )
    assert linux["signal"] == "established"
    assert pi["signal"] == "emerging"
    assert pi["evidence_points"] > linux["evidence_points"]
    assert result["skills"][0]["skill"] == "Linux"


def test_summary_exposes_proof_coverage_and_career_themes():
    """Coverage and themes should explain the body of proof without a readiness score."""
    result = build_career_intelligence(
        [
            {
                "_id": "e1",
                "category": "Platform Engineering",
                "tags": ["Docker", "Linux"],
                "impact": "Cut deployment time by 30%",
                "entry_date": "2026-01-01",
            },
            {
                "_id": "e2",
                "category": "Platform Engineering",
                "tags": ["Docker", "Troubleshooting"],
                "impact": "Resolved incidents",
                "entry_date": "2026-02-01",
            },
            {
                "_id": "e3",
                "category": "Developer Tooling",
                "tags": ["Python"],
                "impact": "Built internal tooling",
                "entry_date": "2026-03-01",
            },
        ],
        [
            {
                "source_entry_id": "e1",
                "skills": ["Docker"],
                "metrics": [{"label": "Deployment time", "value": "30%"}],
                "evidence": [{"title": "Deployment report"}],
                "confirmations": [{"status": "confirmed"}],
                "created_at": "2026-04-01",
            }
        ],
        now=datetime(2026, 9, 5, tzinfo=timezone.utc),
    )

    summary = result["summary"]
    assert summary["total_proof_records"] == 4
    assert summary["distinct_demonstrations"] == 3
    assert summary["quantified_coverage_percent"] == 33
    assert summary["evidence_coverage_percent"] == 33
    assert summary["confirmation_coverage_percent"] == 33
    assert summary["receipt_coverage_percent"] == 33

    platform = next(
        theme
        for theme in result["career_themes"]
        if theme["theme"] == "Platform Engineering"
    )
    assert platform["demonstrations"] == 2
    assert "Docker" in platform["skills"]
    assert result["career_profile"]["primary_themes"] == ["Platform Engineering"]
    assert result["career_profile"]["maturity"] == "developing"
