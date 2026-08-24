import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.plans import PLAN_FEATURES
from app.resume_builder import analyze_resume, extract_terms, score_receipt
from app import resume_builder_routes as routes


def sample_receipt(**overrides):
    receipt = {
        "_id": "507f1f77bcf86cd799439011",
        "accomplishment": "Built Docker incident automation",
        "contribution": "Automated container diagnostics with Python",
        "result": "Reduced repeated troubleshooting work",
        "metrics": [{"label": "time saved", "value": "30 minutes per incident"}],
        "evidence": [{"title": "Runbook"}],
        "skills": ["Docker", "Python", "Incident Response"],
        "trust_signals": ["self-documented", "evidence-linked"],
    }
    receipt.update(overrides)
    return receipt


def test_resume_builder_is_pro_only():
    assert PLAN_FEATURES["free"]["resume_builder"] is False
    assert PLAN_FEATURES["pro"]["resume_builder"] is True
    assert PLAN_FEATURES["team"]["resume_builder"] is True
    assert PLAN_FEATURES["enterprise"]["resume_builder"] is True


def test_job_terms_are_extracted_without_common_noise():
    terms = extract_terms("We need a Data Analyst with SQL, SQL, Python, Tableau and stakeholder communication.")
    assert "sql" in terms
    assert "python" in terms
    assert "tableau" in terms
    assert "with" not in terms


def test_alias_expansion_does_not_replace_inside_unrelated_words():
    terms = extract_terms("Chair design and AI operations")
    assert "artificial" in terms
    assert "intelligence" in terms
    assert "chair" in terms


def test_requirement_matching_is_token_aware_not_substring_based():
    receipt = sample_receipt(accomplishment="Managed NoSQL databases", skills=["NoSQL"])
    score, matches = score_receipt(receipt, ["sql"])
    assert "sql" not in matches
    assert score > 0  # evidence/result quality can still contribute to ranking


def test_resume_uses_only_evidence_backed_receipts_and_keeps_provenance():
    result = analyze_resume(
        target_role="Platform Support Engineer",
        job_description="Docker Python incident response troubleshooting Kubernetes",
        receipts=[sample_receipt()],
    )
    assert result["bullets"]
    bullet = result["bullets"][0]
    assert bullet["source_receipt_id"] == "507f1f77bcf86cd799439011"
    assert bullet["edited"] is False
    assert "Docker" in bullet["text"]
    assert result["readiness"]["source_linked_draft"] is True
    assert "kubernetes" in result["unsupported_requirements"]
    assert "does not simulate" in result["ats_note"]


def test_metrics_raise_quantified_impact_signal():
    result = analyze_resume(
        target_role="Support Engineer",
        job_description="Docker Python troubleshooting",
        receipts=[sample_receipt(), sample_receipt(_id="507f191e810c19729de860ea", accomplishment="Python troubleshooting workflow")],
    )
    assert result["readiness"]["quantified_impact"] in {"Moderate", "Strong"}


def test_empty_receipts_never_invent_requirements():
    result = analyze_resume(target_role="Risk Analyst", job_description="SAS SQL operational risk controls", receipts=[])
    assert result["bullets"] == []
    assert result["supported_requirements"] == []
    assert set(result["unsupported_requirements"]) >= {"sas", "sql", "operational", "risk", "controls"}


def test_saved_resume_payload_is_bounded_and_readiness_not_client_supplied():
    bullet = {
        "text": "Built and improved a workflow",
        "source_receipt_id": "507f1f77bcf86cd799439011",
    }
    payload = routes.ResumeSaveRequest(
        title="Platform Support Engineer",
        target_role="Platform Support Engineer",
        job_description="Docker Python troubleshooting and incident response",
        summary="Evidence-backed support engineer.",
        bullets=[bullet],
        skills=["Docker", "Python"],
    )
    assert not hasattr(payload, "readiness")
    with pytest.raises(ValidationError):
        routes.ResumeSaveRequest(
            title="Platform Support Engineer",
            target_role="Platform Support Engineer",
            job_description="Docker Python troubleshooting and incident response",
            bullets=[bullet] * 21,
        )


def test_saved_bullet_sources_must_be_valid_and_owned(monkeypatch):
    valid = routes.ResumeBulletPayload(
        text="Built workflow",
        source_receipt_id="507f1f77bcf86cd799439011",
    )
    monkeypatch.setattr(routes.impact_receipts_collection, "count_documents", lambda query: 1)
    routes._validate_saved_bullet_sources("user-a", [valid])

    monkeypatch.setattr(routes.impact_receipts_collection, "count_documents", lambda query: 0)
    with pytest.raises(HTTPException) as exc:
        routes._validate_saved_bullet_sources("user-a", [valid])
    assert exc.value.status_code == 400

    malformed = routes.ResumeBulletPayload(text="Built workflow", source_receipt_id="not-an-object-id")
    with pytest.raises(HTTPException) as exc:
        routes._validate_saved_bullet_sources("user-a", [malformed])
    assert exc.value.status_code == 400


def test_server_readiness_marks_manual_edits_for_review():
    source_linked = routes.ResumeBulletPayload(
        text="Built workflow",
        source_receipt_id="507f1f77bcf86cd799439011",
        edited=False,
    )
    edited = routes.ResumeBulletPayload(
        text="Edited workflow claim",
        source_receipt_id="507f1f77bcf86cd799439011",
        edited=True,
    )
    assert routes._server_readiness([source_linked])["verification_status"] == "source-linked"
    result = routes._server_readiness([edited])
    assert result["verification_status"] == "needs-review"
    assert result["edited_bullets_needing_review"] == 1
