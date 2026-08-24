from app.plans import PLAN_FEATURES
from app.resume_builder import analyze_resume, extract_terms


def sample_receipt(**overrides):
    receipt = {
        "_id": "r1",
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


def test_resume_uses_only_evidence_backed_receipts_and_keeps_provenance():
    result = analyze_resume(
        target_role="Platform Support Engineer",
        job_description="Docker Python incident response troubleshooting Kubernetes",
        receipts=[sample_receipt()],
    )
    assert result["bullets"]
    bullet = result["bullets"][0]
    assert bullet["source_receipt_id"] == "r1"
    assert "Docker" in bullet["text"]
    assert result["readiness"]["unsupported_claims"] == 0
    assert "kubernetes" in result["unsupported_requirements"]


def test_metrics_raise_quantified_impact_signal():
    result = analyze_resume(
        target_role="Support Engineer",
        job_description="Docker Python troubleshooting",
        receipts=[sample_receipt(), sample_receipt(_id="r2", accomplishment="Python troubleshooting workflow")],
    )
    assert result["readiness"]["quantified_impact"] in {"Moderate", "Strong"}


def test_empty_receipts_never_invent_requirements():
    result = analyze_resume(target_role="Risk Analyst", job_description="SAS SQL operational risk controls", receipts=[])
    assert result["bullets"] == []
    assert result["supported_requirements"] == []
    assert set(result["unsupported_requirements"]) >= {"sas", "sql", "operational", "risk", "controls"}
