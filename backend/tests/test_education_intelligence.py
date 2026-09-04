from app.education_intelligence import build_application_intelligence


def _entries():
    return [
        {
            "_id": "school-leadership",
            "title": "Led community tutoring drive",
            "category": "Community Service",
            "entry_type": "High School",
            "situation": "Students needed free math support.",
            "action": "Organized 12 student volunteers and led weekly tutoring sessions.",
            "impact": "Served 48 students over 16 weeks.",
            "lesson": "Learned how to adapt explanations and lead peers.",
            "tags": ["Leadership", "Teaching", "Community Service"],
        },
        {
            "_id": "research-project",
            "title": "Independent robotics research project",
            "category": "Research",
            "entry_type": "High School",
            "situation": "Wanted to explore computer vision.",
            "action": "Researched object detection and built a working prototype with a teammate.",
            "impact": "Presented the project at a regional STEM showcase.",
            "lesson": "Discovered an interest in applied machine learning.",
            "tags": ["Research", "Python", "Robotics", "Collaboration"],
        },
        {
            "_id": "job-entry",
            "title": "Helped customers at weekend job",
            "category": "Internship / Work Experience",
            "entry_type": "Current Job",
            "situation": "Busy weekend shifts.",
            "action": "Handled customer questions and coordinated with teammates.",
            "impact": "Resolved issues reliably.",
            "lesson": "Improved communication.",
            "tags": ["Customer Service", "Teamwork"],
        },
    ]


def _receipts():
    return [
        {
            "source_entry_id": "school-leadership",
            "evidence": [{"title": "Volunteer roster"}],
            "confirmations": [{"status": "confirmed"}],
            "metrics": [{"label": "Students served", "value": "48"}],
        }
    ]


def test_scholarship_ranking_uses_user_owned_school_evidence():
    result = build_application_intelligence(_entries(), _receipts(), "scholarship")

    assert result["summary"]["accomplishments_analyzed"] == 3
    assert result["summary"]["education_accomplishments"] == 2
    assert result["recommended_evidence"][0]["entry_id"] == "school-leadership"
    assert "leadership" in result["recommended_evidence"][0]["matched_dimensions"]
    assert "service" in result["recommended_evidence"][0]["matched_dimensions"]
    assert result["recommended_evidence"][0]["has_evidence"] is True
    assert result["recommended_evidence"][0]["has_confirmation"] is True


def test_special_program_prioritizes_research_and_curiosity():
    result = build_application_intelligence(_entries(), _receipts(), "special-program")
    top = result["recommended_evidence"][0]

    assert top["entry_id"] == "research-project"
    assert "subject_depth" in top["matched_dimensions"]
    assert "curiosity" in top["matched_dimensions"]


def test_internship_can_use_school_and_real_work_records():
    result = build_application_intelligence(_entries(), _receipts(), "internship")
    ids = [item["entry_id"] for item in result["recommended_evidence"]]

    assert "job-entry" in ids
    assert "research-project" in ids


def test_essay_prep_surfaces_stories_without_generating_claims():
    result = build_application_intelligence(_entries(), _receipts(), "essay-prep")

    assert result["methodology"]["deterministic"] is True
    assert result["methodology"]["acceptance_prediction"] is False
    assert result["methodology"]["scholarship_prediction"] is False
    assert result["methodology"]["employment_decision"] is False
    assert all("entry_id" in item for item in result["recommended_evidence"])
    assert result["reference"]["season"] == "2026-2027"


def test_unknown_application_type_is_rejected():
    try:
        build_application_intelligence(_entries(), _receipts(), "admissions-chance")
    except ValueError as error:
        assert "Unsupported application type" in str(error)
    else:
        raise AssertionError("Unknown application type should fail closed")
