from datetime import datetime, timezone

from app.career_intelligence_routes import _verify_major_explorer
from app.major_explorer import build_major_explorer


def test_major_explorer_surfaces_directions_from_saved_proof_without_percentages():
    entries = [
        {
            "_id": "e1",
            "category": "Academic Project",
            "entry_type": "College / University",
            "title": "Linux automation project",
            "action": "Built a Python service and automated Linux workflows",
            "impact": "Reduced manual setup time by 40%",
            "tags": ["Python", "Linux", "Git"],
            "entry_date": "2026-01-15",
        },
        {
            "_id": "e2",
            "category": "Academic Project",
            "entry_type": "College / University",
            "title": "Database-backed web app",
            "action": "Designed an application using PostgreSQL and FastAPI",
            "impact": "Delivered a working class project",
            "tags": ["Postgres", "FastAPI", "Python", "SQL"],
            "entry_date": "2026-03-20",
        },
        {
            "_id": "e3",
            "category": "Learning / Certification",
            "entry_type": "Learning / Certification",
            "title": "Systems troubleshooting lab",
            "action": "Troubleshot networking and Linux services",
            "impact": "Completed the lab successfully",
            "tags": ["Linux", "Networking", "Troubleshooting"],
            "entry_date": "2026-05-10",
        },
    ]

    result = build_major_explorer(entries, [])

    names = [row["major"] for row in result["recommendations"]]
    assert "Computer Science" in names
    assert "Information Systems" in names
    assert result["summary"]["proof_records_analyzed"] == 3
    assert result["summary"]["self_reported_interests_included"] is False
    assert result["methodology"]["fit_percentage"] is False
    assert result["methodology"]["best_major_claim"] is False
    assert all("score" not in row for row in result["recommendations"])
    assert all("probability" not in row for row in result["recommendations"])


def test_major_explorer_keeps_evidence_strength_separate_from_future_outcomes():
    entries = [
        {
            "_id": "pi-1",
            "category": "STEM / Competition",
            "entry_type": "College / University",
            "title": "Portable computing project",
            "action": "Built and troubleshot a Raspberry Pi Linux system",
            "impact": "Created a working prototype",
            "tags": ["Raspberry Pi", "Linux", "Python", "SSH", "Networking"],
            "entry_date": "2026-09-01",
        }
    ]

    result = build_major_explorer(entries, [])
    computer_engineering = next(
        row for row in result["recommendations"] if row["major"] == "Computer Engineering"
    )

    assert computer_engineering["fit_label"] in {
        "possible-direction",
        "worth-exploring",
        "strong-exploration-candidate",
    }
    assert computer_engineering["evidence_strength"] in {"limited", "developing", "supported"}
    assert computer_engineering["what_we_do_not_know"]
    assert len(computer_engineering["next_experiments"]) == 2
    assert result["methodology"]["acceptance_prediction"] is False
    assert result["methodology"]["employment_prediction"] is False
    assert result["methodology"]["salary_prediction"] is False
    assert result["methodology"]["licensing_prediction"] is False
    assert result["methodology"]["career_success_prediction"] is False


def test_major_explorer_disclaimer_is_part_of_the_payload():
    result = build_major_explorer([], [])
    disclaimer = result["disclaimer"]

    assert "exploration" in disclaimer["title"].lower()
    assert "not academic" in disclaimer["not_advice"].lower()
    assert "does not predict or guarantee" in disclaimer["no_guarantees"].lower()
    assert "verify" in disclaimer["verify_requirements"].lower()
    assert "responsible" in disclaimer["user_decision"].lower()
    assert result["recommendations"] == []
    assert result["summary"]["recommendations_returned"] == 0


def test_major_explorer_route_verifier_accepts_safe_payload():
    entries = [
        {
            "_id": "e1",
            "category": "Academic Project",
            "entry_type": "College / University",
            "title": "Programming project",
            "action": "Built software using Python",
            "tags": ["Python"],
            "entry_date": datetime(2026, 9, 1, tzinfo=timezone.utc),
        }
    ]
    result = build_major_explorer(entries, [])

    assert _verify_major_explorer(result, entries, []) == []


def test_major_explorer_route_verifier_rejects_prediction_or_fake_precision():
    entries = [
        {
            "_id": "e1",
            "title": "Programming project",
            "action": "Built software using Python",
            "tags": ["Python"],
        }
    ]
    unsafe = build_major_explorer(entries, [])
    unsafe["methodology"]["employment_prediction"] = True
    if unsafe["recommendations"]:
        unsafe["recommendations"][0]["fit_percent"] = 94

    violations = _verify_major_explorer(unsafe, entries, [])

    assert "major_explorer_employment_prediction_enabled" in violations
    assert "major_explorer_fake_precision_exposed" in violations


def test_major_explorer_route_verifier_rejects_missing_disclaimer():
    result = build_major_explorer([], [])
    result["disclaimer"]["verify_requirements"] = ""

    violations = _verify_major_explorer(result, [], [])

    assert "major_explorer_disclaimer_verify_requirements_missing" in violations
