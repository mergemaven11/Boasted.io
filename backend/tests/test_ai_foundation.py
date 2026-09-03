"""Regression tests for BragStack's AI evidence-assistance safety foundation."""
from app.ai.contracts import AISuggestion, EvidenceContext
from app.ai.feature_flags import experimental_ai_enabled
from app.ai.guards import validate_grounded_suggestion
from app.ai.licensing import ModelLicenseRecord, ProductionLicenseGate


def _suggestion(payload, source_ids=("ev-1",)):
    """Build a deterministic AI suggestion fixture.

    Args:
        payload: Structured payload to place in the test suggestion.
        source_ids: Evidence identifiers cited by the suggestion.

    Returns:
        AI suggestion populated with deterministic test provenance metadata.
    """
    return AISuggestion(
        task="impact_receipt",
        payload=payload,
        source_evidence_ids=source_ids,
        provider="test",
        model_id="test-model",
        model_revision="abc123",
        prompt_version="receipt-v1",
        schema_version="receipt-v1",
    )


def _evidence(text="Reduced build time by 30% for the release pipeline."):
    """Build a deterministic evidence-context fixture.

    Args:
        text: User-controlled evidence text supplied to the grounding guard.

    Returns:
        Single evidence context wrapped in a tuple for validator input.
    """
    return (EvidenceContext(evidence_ids=("ev-1",), content=text),)


def test_grounded_numeric_claim_is_allowed():
    """Verify numeric claims already present in evidence pass the guard."""
    violations = validate_grounded_suggestion(
        _suggestion({"result": "Reduced build time by 30%."}),
        _evidence(),
    )
    assert violations == []


def test_new_numeric_claim_is_rejected():
    """Verify invented numeric specificity is rejected."""
    violations = validate_grounded_suggestion(
        _suggestion({"result": "Reduced build time by 55%."}),
        _evidence(),
    )
    assert "unsupported_numeric_claim" in {item.code for item in violations}


def test_unknown_provenance_id_is_rejected():
    """Verify suggestions cannot cite evidence absent from the request."""
    violations = validate_grounded_suggestion(
        _suggestion({"result": "Improved the release pipeline."}, source_ids=("ev-missing",)),
        _evidence(),
    )
    assert "unknown_evidence_id" in {item.code for item in violations}


def test_missing_provenance_is_rejected():
    """Verify every AI suggestion must cite at least one evidence identifier."""
    violations = validate_grounded_suggestion(
        _suggestion({"result": "Improved the release pipeline."}, source_ids=()),
        _evidence(),
    )
    assert "missing_provenance" in {item.code for item in violations}


def test_unsupported_verification_language_is_rejected():
    """Verify unsupported verification language is rejected."""
    violations = validate_grounded_suggestion(
        _suggestion({"evidence": "Result was verified by leadership."}),
        _evidence(),
    )
    assert "unsupported_high_risk_language" in {item.code for item in violations}


def test_supported_high_risk_language_is_allowed():
    """Verify high-risk wording passes when directly supported by evidence."""
    evidence = _evidence("Leadership verified the release-pipeline result.")
    violations = validate_grounded_suggestion(
        _suggestion({"evidence": "Leadership verified the release-pipeline result."}),
        evidence,
    )
    assert violations == []


def test_permissive_complete_model_record_passes_license_gate():
    """Verify a complete permissive commercial-use record passes licensing."""
    record = ModelLicenseRecord(
        model_id="example/model",
        revision="deadbeef",
        source_url="https://example.com/model",
        license_id="apache-2.0",
        license_url="https://www.apache.org/licenses/LICENSE-2.0",
        commercial_use=True,
        modification=True,
        redistribution=True,
        attribution_notice="Preserve Apache-2.0 notices.",
        runtime="local",
        hardware_envelope="CPU or GPU; benchmark before release",
        intended_task="evidence extraction",
    )
    assert ProductionLicenseGate.allows_production(record)


def test_license_gate_fails_closed_for_noncommercial_or_unpinned_model():
    """Verify unclear commercial rights and missing revisions fail closed."""
    record = ModelLicenseRecord(
        model_id="example/research-only",
        revision="",
        source_url="https://example.com/model",
        license_id="research-only",
        license_url="https://example.com/license",
        commercial_use=False,
        modification=False,
        redistribution=False,
        attribution_notice="",
        runtime="local",
        hardware_envelope="unknown",
        intended_task="evidence extraction",
    )
    violations = ProductionLicenseGate.violations(record)
    assert "license_not_allowlisted" in violations
    assert "commercial_use_not_confirmed" in violations
    assert "revision_missing" in violations


def test_experimental_ai_is_disabled_by_default(monkeypatch):
    """Verify experimental AI remains disabled when no flag is configured."""
    monkeypatch.delenv("BRAGSTACK_EXPERIMENTAL_AI", raising=False)
    assert experimental_ai_enabled() is False


def test_experimental_ai_requires_explicit_opt_in(monkeypatch):
    """Verify experimental AI activates only after explicit environment opt-in."""
    monkeypatch.setenv("BRAGSTACK_EXPERIMENTAL_AI", "true")
    assert experimental_ai_enabled() is True
