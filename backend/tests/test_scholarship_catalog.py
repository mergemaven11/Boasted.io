from datetime import datetime, timezone

import pytest

from app.scholarship_catalog import (
    ScholarshipSourceLicenseError,
    build_scholarship_filter,
    interpret_scholarship_query,
    normalize_open_scholarship,
    validate_open_scholarships_license,
)


APPROVED_ATTRIBUTION = (
    "Open Scholarships by Grudged LLC - https://github.com/Grudged/open-scholarships (CC BY 4.0)"
)


def _record(**overrides):
    record = {
        "id": "us-example",
        "name": "Example STEM Scholarship",
        "sponsor": "Example Foundation",
        "type": "scholarship",
        "award": {"amount_max": 5000, "currency": "USD", "basis": "merit"},
        "deadline": {"type": "annual", "date": "2027-04-15"},
        "eligibility": {
            "residency": ["US"],
            "education_level": ["undergraduate"],
            "fields_of_study": ["Computer Science"],
            "tags": ["stem"],
        },
        "geo": {"scope": "national", "counties": []},
        "links": {"info_url": "https://example.edu/scholarship", "apply_url": "https://example.edu/apply"},
        "provenance": {"source_name": "Example", "source_url": "https://example.edu/scholarship", "last_verified": "2026-09-01", "added": "2026-08-01"},
        "status": "active",
        "availability": "open",
    }
    record.update(overrides)
    return record


def _approved_meta(**overrides):
    meta = {
        "license": "CC-BY-4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "attribution_required": APPROVED_ATTRIBUTION,
    }
    meta.update(overrides)
    return {"meta": meta}


def test_open_scholarships_license_gate_accepts_only_approved_cc_by_metadata():
    validate_open_scholarships_license(_approved_meta())

    with pytest.raises(ScholarshipSourceLicenseError):
        validate_open_scholarships_license(_approved_meta(license="unknown"))


def test_open_scholarships_license_gate_fails_closed_on_attribution_drift():
    with pytest.raises(ScholarshipSourceLicenseError):
        validate_open_scholarships_license(
            _approved_meta(attribution_required="Open Scholarships by Grudged LLC")
        )


def test_normalized_scholarship_keeps_rights_and_source_provenance():
    item = normalize_open_scholarship(_record(), imported_at=datetime(2026, 9, 7, tzinfo=timezone.utc))
    assert item["rights_basis"] == "open_license"
    assert item["license_id"] == "CC-BY-4.0"
    assert item["source_url"] == "https://example.edu/scholarship"
    assert item["status"] == "active"
    assert "computer science" in item["search_text"]


def test_past_fixed_deadline_is_soft_expired_not_deleted():
    record = _record(deadline={"type": "annual", "date": "2026-01-15"})
    item = normalize_open_scholarship(record, imported_at=datetime(2026, 9, 7, tzinfo=timezone.utc))
    assert item["status"] == "expired"


def test_natural_query_interpreter_extracts_student_friendly_filters():
    parsed = interpret_scholarship_query("Georgia undergraduate need-based STEM at least $5,000")
    assert parsed["states"] == ["GA"]
    assert "undergraduate" in parsed["levels"]
    assert "need" in parsed["basis"]
    assert parsed["min_amount"] == 5000
    assert "stem" in parsed["text_tokens"]


def test_search_filter_defaults_to_active_scholarships():
    mongo_filter, _ = build_scholarship_filter(query="nursing")
    rendered = repr(mongo_filter)
    assert "active" in rendered
    assert "nursing" in rendered
