import pytest

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


def test_usajobs_item_prefers_structured_internship_classification_and_keeps_text_fallback():
    structured = opportunity._usajobs_item(
        {
            "MatchedObjectId": "abc",
            "MatchedObjectDescriptor": {
                "PositionTitle": "Computer Engineer",
                "OrganizationName": "Department of the Air Force",
                "PositionLocationDisplay": "Location Negotiable After Selection",
                "PositionURI": "https://www.usajobs.gov/job/123",
                "PositionOfferingType": [{"Name": "Internships", "Code": "153"}],
                "UserArea": {"Details": {"JobSummary": "Civilian career training opportunity."}},
            },
        },
        reason={"direction": "Technology & data", "supported_by": ["Programming"]},
    )
    text_fallback = opportunity._usajobs_item(
        {
            "MatchedObjectId": "def",
            "MatchedObjectDescriptor": {
                "PositionTitle": "Student Trainee (Information Technology)",
                "UserArea": {"Details": {"JobSummary": "Paid student trainee opportunity."}},
            },
        }
    )
    ordinary = opportunity._usajobs_item(
        {
            "MatchedObjectId": "ghi",
            "MatchedObjectDescriptor": {
                "PositionTitle": "Information Technology Specialist",
                "UserArea": {"Details": {"JobSummary": "Full-time federal role."}},
            },
        }
    )
    assert structured["boasted"]["internship_signal"] is True
    assert structured["boasted"]["internship_signal_source"] == "position_offering_type"
    assert structured["source"]["title"] == "Computer Engineer"
    assert text_fallback["boasted"]["internship_signal"] is True
    assert text_fallback["boasted"]["internship_signal_source"] == "title_or_summary"
    assert ordinary["boasted"]["internship_signal"] is False


def test_computer_engineer_query_expands_locally_without_one_api_call_per_synonym():
    plan = opportunity._internship_search_plan("COMMUPTER ENGINEER")
    assert plan["normalized_query"] == "computer engineer"
    assert plan["family"] == "software-computing"
    assert plan["provider_keyword"] is None
    assert "software engineer" in plan["related_terms"]
    assert "backend engineer" in plan["related_terms"]
    assert "software developer" in plan["related_terms"]


def test_internship_search_has_no_hidden_30_day_filter_and_pages_cached_provider_results(monkeypatch):
    requests = []

    monkeypatch.setattr(
        opportunity,
        "_career_context",
        lambda _user: {"suggested_queries": [], "location": "Macon, GA"},
    )

    def fake_usajobs_request(params):
        requests.append(dict(params))
        return {
            "SearchResult": {
                "SearchResultCountAll": 1,
                "SearchResultItems": [
                    {
                        "MatchedObjectId": "job-1",
                        "MatchedObjectDescriptor": {
                            "PositionTitle": "Software Engineer",
                            "OrganizationName": "Example Agency",
                            "PositionLocationDisplay": "Robins AFB, Georgia",
                            "PositionOfferingType": [{"Name": "Internships", "Code": "153"}],
                            "PositionURI": "https://www.usajobs.gov/job/1",
                            "UserArea": {"Details": {"JobSummary": "Software engineering internship."}},
                        },
                    }
                ],
            }
        }

    monkeypatch.setattr(opportunity, "_usajobs_request", fake_usajobs_request)
    result = opportunity.find_internships(
        location="Macon, GA",
        q="computer engineer",
        radius=100,
        page=1,
        page_size=20,
        current_user={"_id": "user-1"},
    )

    assert len(requests) == 1
    assert requests[0]["LocationName"] == "Macon, GA"
    assert requests[0]["Radius"] == 100
    assert requests[0]["ResultsPerPage"] == 500
    assert requests[0]["Page"] == 1
    assert "DatePosted" not in requests[0]
    assert "Keyword" not in requests[0]
    assert result["results"][0]["source"]["title"] == "Software Engineer"
    assert result["search_interpretation"]["date_posted_filter"] is False
    assert result["search_interpretation"]["career_family"] == "software-computing"


def test_usajobs_memory_cache_avoids_duplicate_provider_calls(monkeypatch):
    opportunity.SOURCE_CACHE.clear()
    monkeypatch.setattr(opportunity, "USAJOBS_API_KEY", "key")
    monkeypatch.setattr(opportunity, "USAJOBS_USER_AGENT", "owner@example.com")
    monkeypatch.setattr(opportunity, "_audit_event", lambda **_kwargs: None)

    params = {"LocationName": "Macon, GA", "Radius": 100, "ResultsPerPage": 500, "Page": 1}
    payload = {"SearchResult": {"SearchResultCountAll": 0, "SearchResultItems": []}}
    opportunity._cache_put("usajobs", params, payload, opportunity.USAJOBS_CACHE_SECONDS)

    def unexpected_http_call(*_args, **_kwargs):
        raise AssertionError("cached USAJOBS search should not call the provider again")

    monkeypatch.setattr(opportunity.httpx, "get", unexpected_http_call)
    assert opportunity._usajobs_request(params) == payload


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


def test_required_audit_event_fails_closed_when_receipt_cannot_be_written(monkeypatch):
    def fail_write(_document):
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(opportunity.education_source_audit_events_collection, "insert_one", fail_write)

    with pytest.raises(opportunity.HTTPException) as exc_info:
        opportunity._audit_event(
            provider="College Scorecard",
            operation="program_search",
            outcome="attempt",
            request_id="req-audit-fail",
            required=True,
        )

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail["code"] == "education_source_audit_unavailable"


def test_source_configuration_gates_require_server_side_credentials(monkeypatch):
    monkeypatch.setattr(opportunity, "COLLEGE_SCORECARD_API_KEY", "")
    monkeypatch.setattr(opportunity, "USAJOBS_API_KEY", "")
    monkeypatch.setattr(opportunity, "USAJOBS_USER_AGENT", "")
    assert opportunity._scorecard_configured() is False
    assert opportunity._usajobs_configured() is False

    monkeypatch.setattr(opportunity, "COLLEGE_SCORECARD_API_KEY", "scorecard-key")
    monkeypatch.setattr(opportunity, "USAJOBS_API_KEY", "usajobs-key")
    assert opportunity._scorecard_configured() is True
    assert opportunity._usajobs_configured() is False

    monkeypatch.setattr(opportunity, "USAJOBS_USER_AGENT", "api-owner@example.com")
    assert opportunity._usajobs_configured() is True
