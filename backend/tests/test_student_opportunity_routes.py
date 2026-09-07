from datetime import datetime, timedelta, timezone

from app import student_opportunity_routes as opportunity


def test_program_item_keeps_source_values_separate_from_boasted_annotations():
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

    assert item["source"]["title"] == "Cloud Support Certificate"
    assert item["source"]["provider"] == "Example Technical College"
    assert item["source"]["distance"] == 7.2
    assert item["boasted"]["cost_claim"] == "unknown"
    assert item["boasted"]["wioa_or_etp_signal"] is True
    assert item["boasted"]["why_shown"]["direction"] == "Technology & data"
    assert "price" not in item["source"]


def test_youth_program_does_not_invent_a_free_price_claim():
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
    assert item["source"]["title"] == "Youth Career Center"
    assert item["boasted"]["display_kind"] == "youth-support"
    assert item["boasted"]["cost_claim"] == "verify-with-provider"


def test_job_item_keeps_listing_text_verbatim_and_requires_intern_signal():
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
    assert internship["source"]["title"] == "Software Engineering Intern"
    assert internship["source"]["description"] == "Work with the platform team."
    assert internship["boasted"]["internship_signal"] is True
    assert ordinary_job["boasted"]["internship_signal"] is False


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


def test_license_gate_requires_explicit_grant_and_future_expiration(monkeypatch):
    now = datetime.now(timezone.utc)
    monkeypatch.setattr(opportunity, "CAREERONESTOP_LICENSE_STATUS", "granted")
    monkeypatch.setattr(opportunity, "CAREERONESTOP_LICENSE_GRANTED_AT", now.isoformat())
    monkeypatch.setattr(opportunity, "CAREERONESTOP_LICENSE_EXPIRES_AT", (now + timedelta(days=365)).isoformat())
    state = opportunity._license_state(now=now)
    assert state["active"] is True
    assert state["days_remaining"] >= 364

    monkeypatch.setattr(opportunity, "CAREERONESTOP_LICENSE_EXPIRES_AT", (now - timedelta(days=1)).isoformat())
    assert opportunity._license_state(now=now)["active"] is False


def test_audit_event_is_data_minimized_and_records_geocode_safeguard(monkeypatch):
    captured = {}
    monkeypatch.setattr(opportunity.careeronestop_audit_events_collection, "insert_one", lambda doc: captured.update(doc))
    opportunity._audit_event(
        request_id="req-1",
        operation="internship_search",
        outcome="success",
        http_status=200,
        result_count=12,
        metadata={"LastAccessDate": "2026-09-07", "CitationSuggested": "CareerOneStop citation"},
    )
    assert captured["provider"] == "CareerOneStop"
    assert captured["result_count"] == 12
    assert captured["safeguards"]["private_member_evidence_sent_to_cos"] is False
    assert captured["safeguards"]["raw_query_or_location_logged"] is False
    assert captured["safeguards"]["cos_geocodes_persisted_copied_or_shared"] is False
    assert "query" not in captured
    assert "location" not in captured
