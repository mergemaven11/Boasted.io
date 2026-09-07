from app import student_opportunity_routes as opportunity


def test_program_item_does_not_invent_price_and_surfaces_funding_signal():
    item = opportunity._program_item(
        {
            "DetailId": 12,
            "EtaProgramName": "Cloud Support Certificate",
            "SchoolName": "Example Technical College",
            "Credential": "Certificate",
            "Format": ["In Person"],
            "OccupationsList": ["Computer User Support Specialists"],
            "DataSource": "State Eligible Training Provider / WIOA",
            "City": "Atlanta",
            "StateAbbr": "GA",
            "Zip": "30303",
            "Distance": 7.2,
            "SchoolURL": "https://example.edu/cloud",
        },
        reason={"direction": "Technology & data", "supported_by": ["Technical problem solving"]},
    )

    assert item["cost_type"] == "funding-unknown"
    assert item["wioa_or_etp_signal"] is True
    assert item["why_shown"]["direction"] == "Technology & data"
    assert "price" not in item


def test_youth_program_is_labeled_free_support_without_claiming_every_training_is_free():
    item = opportunity._youth_program_item(
        {
            "ID": 9,
            "Name": "Youth Career Center",
            "ProgramType": "Youth Program",
            "City": "Marietta",
            "StateAbbr": "GA",
            "Zip": "30060",
        }
    )
    assert item["kind"] == "free-support"
    assert item["cost_type"] == "free"


def test_job_item_requires_an_explicit_intern_signal():
    internship = opportunity._job_item(
        {
            "JvId": "abc",
            "JobTitle": "Software Engineering Intern",
            "Company": "Example Co",
            "DescriptionSnippet": "Work with the platform team.",
            "URL": "https://example.com/jobs/abc",
        },
        reason={"direction": "Technology & data", "supported_by": ["Programming"]},
    )
    ordinary_job = opportunity._job_item(
        {
            "JvId": "def",
            "JobTitle": "Software Engineer",
            "Company": "Example Co",
            "DescriptionSnippet": "Full-time role.",
        }
    )
    assert internship["internship_signal"] is True
    assert ordinary_job["internship_signal"] is False


def test_career_context_uses_member_evidence_without_fit_or_best_claims(monkeypatch):
    monkeypatch.setattr(opportunity.entries_collection, "find", lambda query: [{"_id": "entry-1"}])
    monkeypatch.setattr(opportunity.impact_receipts_collection, "find", lambda query: [])
    monkeypatch.setattr(
        opportunity,
        "build_education_toolkit",
        lambda entries, receipts, tool: {
            "career_directions": [
                {
                    "title": "Technology & data",
                    "examples": ["Software development", "Data analysis"],
                    "demonstrated_skills": ["Programming", "Technical problem solving"],
                }
            ],
            "skill_signals": [],
        },
    )
    result = opportunity._career_context({"_id": "user-1", "location": "Atlanta, GA"})
    assert result["location"] == "Atlanta, GA"
    assert result["suggested_queries"][0]["query"] == "Software development"
    assert result["fit_percentage"] is False
    assert result["best_program_claim"] is False
    assert result["best_internship_claim"] is False
