from app.education_toolkit import SOURCE_REGISTRY, TOOL_PROFILES, build_education_toolkit
from app.education_toolkit_routes import _verify_toolkit


def _entries():
    return [
        {
            "_id": "coursework-1",
            "title": "Cloud systems lab",
            "category": "Coursework",
            "entry_type": "College / University",
            "situation": "Advanced cloud computing course.",
            "action": "Built and documented a containerized service with Python and collaborated with a partner.",
            "impact": "Completed 6 labs and presented the final system.",
            "lesson": "Improved debugging, documentation, and technical communication.",
            "tags": ["Python", "Docker", "Collaboration", "Documentation"],
            "is_public": False,
        },
        {
            "_id": "project-1",
            "title": "Robotics capstone",
            "category": "Capstone / Thesis",
            "entry_type": "College / University",
            "situation": "Senior engineering capstone.",
            "action": "Researched computer vision, designed a prototype, analyzed test data, and presented results.",
            "impact": "Delivered a working prototype with a four-person team.",
            "lesson": "Learned to turn uncertain research into testable project milestones.",
            "tags": ["Research", "Data analysis", "Design", "Project management"],
            "is_public": True,
        },
        {
            "_id": "job-1",
            "title": "Weekend customer support",
            "category": "Customer Support",
            "entry_type": "Current Job",
            "situation": "Busy shifts.",
            "action": "Helped customers.",
            "impact": "Resolved questions.",
            "lesson": "Communication.",
            "tags": ["Customer service"],
            "is_public": False,
        },
    ]


def _receipts():
    return [
        {
            "source_entry_id": "project-1",
            "evidence": [{"title": "Capstone demo"}],
            "confirmations": [{"status": "confirmed"}],
            "metrics": [{"label": "Team size", "value": "4"}],
        }
    ]


def test_every_non_major_education_card_has_a_real_tool_profile():
    expected = {
        "education-profile", "coursework", "academic-projects", "certifications",
        "academic-achievements", "group-projects", "graduation-progress",
        "experience-translator", "impact-receipts", "education-skills",
        "career-match", "resume-builder", "interview-prep", "academic-portfolio",
        "career-paths",
    }
    assert set(TOOL_PROFILES) == expected

    for tool_id in expected:
        result = build_education_toolkit(_entries(), _receipts(), tool_id)
        assert result["tool"]["id"] == tool_id
        assert result["tool"]["prompts"]
        assert result["tool"]["primary_action"]["href"].startswith("/app/")
        assert result["methodology"]["evidence_mode"] == "member-saved-proof-only"
        assert result["methodology"]["employment_decision"] is False
        assert result["methodology"]["admissions_prediction"] is False


def test_coursework_tool_prioritizes_coursework_and_never_invents_entry_ids():
    result = build_education_toolkit(_entries(), _receipts(), "coursework")
    assert result["recommended_evidence"][0]["entry_id"] == "coursework-1"
    assert all(item["entry_id"] in {"coursework-1", "project-1"} for item in result["recommended_evidence"])
    assert result["summary"]["education_records"] == 2


def test_skills_from_education_are_traceable_to_saved_records():
    result = build_education_toolkit(_entries(), _receipts(), "education-skills")
    skills = {item["skill"]: item for item in result["skill_signals"]}
    assert "Programming" in skills
    assert "Research" in skills
    assert "coursework-1" in skills["Programming"]["evidence_entry_ids"]
    assert "project-1" in skills["Research"]["evidence_entry_ids"]
    assert all(item["demonstrations"] > 0 for item in result["skill_signals"])


def test_career_path_explorer_returns_directions_without_fake_fit_scores():
    result = build_education_toolkit(_entries(), _receipts(), "career-paths")
    assert result["career_directions"]
    assert all(item["demonstrated_skills"] for item in result["career_directions"])
    assert all("fit_score" not in item and "probability" not in item for item in result["career_directions"])
    assert result["methodology"]["best_career_claim"] is False
    assert result["methodology"]["fit_percentage"] is False
    assert result["methodology"]["salary_prediction"] is False


def test_portfolio_tool_preserves_visibility_as_information_only():
    result = build_education_toolkit(_entries(), _receipts(), "academic-portfolio")
    visibility = {item["entry_id"]: item["is_public"] for item in result["recommended_evidence"]}
    assert visibility["coursework-1"] is False
    assert visibility["project-1"] is True
    assert any(gap["label"] == "Private records" for gap in result["gaps"])


def test_official_reference_registry_is_versioned_and_attributed():
    by_id = {source["id"]: source for source in SOURCE_REGISTRY}
    assert by_id["onet-31"]["version"] == "31.0 (August 2026)"
    assert by_id["onet-31"]["license"] == "CC BY 4.0"
    assert "U.S. Department of Labor" in by_id["onet-31"]["publisher"]
    assert "nces-cip-soc" in by_id
    assert "bls-oews-2025" in by_id
    assert "college-scorecard" in by_id
    assert by_id["careeronestop"]["runtime"] == "optional-adapter"


def test_verifier_rejects_unknown_evidence_and_prediction_drift():
    entries = _entries()
    receipts = _receipts()
    result = build_education_toolkit(entries, receipts, "career-paths")
    assert _verify_toolkit(result, entries, receipts, "career-paths") == []

    result["recommended_evidence"][0]["entry_id"] = "invented-entry"
    result["methodology"]["employment_prediction"] = True
    violations = _verify_toolkit(result, entries, receipts, "career-paths")
    assert "education_toolkit_unknown_entry" in violations
    assert "education_toolkit_employment_prediction_enabled" in violations
