from app import student_opportunity_routes as opportunity


def test_program_location_requires_real_state_context():
    assert opportunity._location_parts("Atlanta, GA") == ("Atlanta", "GA")
    assert opportunity._location_parts("Georgia") == (None, "GA")
    assert opportunity._location_parts("GA") == (None, "GA")
    assert opportunity._location_parts("30060") == (None, None)


def test_program_terms_expand_common_career_language_without_fit_score():
    terms = opportunity._program_terms("software developer")
    assert "software" in terms
    assert "programming" in terms
    assert "computer" in terms


def test_scorecard_program_item_keeps_source_data_separate_from_boasted_annotations():
    item = opportunity._program_item(
        {
            "id": 123,
            "school": {
                "name": "Example State College",
                "city": "Atlanta",
                "state": "GA",
                "zip": "30303",
                "school_url": "https://example.edu",
            },
            "latest": {
                "student": {"size": 4200},
                "cost": {"avg_net_price": {"overall": 11000}},
            },
        },
        {"title": "Computer Programming", "code": "11.0201", "credential": 2},
        reason={"direction": "Technology & data", "supported_by": ["Programming"]},
    )
    assert item["source"]["title"] == "Computer Programming"
    assert item["source"]["provider"] == "Example State College"
    assert item["source"]["avg_net_price"] == 11000
    assert item["boasted"]["display_kind"] == "college-program"
    assert item["boasted"]["why_shown"]["direction"] == "Technology & data"
    assert "fit" not in repr(item).lower()


def test_usajobs_item_requires_explicit_intern_or_student_trainee_signal():
    internship = opportunity._usajobs_item(
        {
            "MatchedObjectId": "abc",
            "MatchedObjectDescriptor": {
                "PositionTitle": "Student Trainee (Information Technology)",
                "OrganizationName": "Example Agency",
                "PositionLocationDisplay": "Atlanta, Georgia",
                "PositionURI": "https://www.usajobs.gov/job/123",
                "UserArea": {"Details": {"JobSummary": "Paid student trainee opportunity."}},
            },
        },
        reason={"direction": "Technology & data", "supported_by": ["Programming"]},
    )
    ordinary = opportunity._usajobs_item(
        {
            "MatchedObjectId": "def",
            "MatchedObjectDescriptor": {
                "PositionTitle": "Information Technology Specialist",
                "UserArea": {"Details": {"JobSummary": "Full-time federal role."}},
            },
        }
    )
    assert internship["boasted"]["internship_signal"] is True
    assert ordinary["boasted"]["internship_signal"] is False
    assert internship["source"]["title"] == "Student Trainee (Information Technology)"


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


def test_audit_event_never_logs_query_location_or_credentials(monkeypatch):
    stored = []
    monkeypatch.setattr(opportunity.education_source_audit_events_collection, "insert_one", lambda doc: stored.append(doc))
    opportunity._audit_event(
        provider="USAJOBS",
        operation="federal_internship_search",
        outcome="success",
        request_id="req-1",
        http_status=200,
        result_count=2,
    )
    assert stored
    document = stored[0]
    assert document["safeguards"]["raw_query_or_location_logged"] is False
    assert document["safeguards"]["api_credentials_logged"] is False
    assert document["safeguards"]["upstream_records_persisted"] is False
    assert "api_key" not in repr(document).lower()
