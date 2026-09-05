"""Tests for the shared BragStack intelligence verification runtime."""
from __future__ import annotations

import pytest
from fastapi import HTTPException

import app.ai.runtime as runtime


def test_verified_result_gets_shared_runtime_receipt(monkeypatch):
    events = []
    monkeypatch.setattr(runtime, "record_verification_event", lambda **event: events.append(event) or True)

    result = runtime.enforce_intelligence_result(
        {"summary": {"count": 1}}, feature="education_intelligence", task="scholarship",
        violations=[], failure_code="failed", failure_message="withheld", source_count=1,
    )

    assert result["intelligence_runtime"]["verified"] is True
    assert result["intelligence_runtime"]["version"] == runtime.INTELLIGENCE_RUNTIME_VERSION
    assert events[0]["feature"] == "education_intelligence"
    assert events[0]["passed"] is True


def test_invalid_result_is_recorded_and_withheld(monkeypatch):
    events = []
    monkeypatch.setattr(runtime, "record_verification_event", lambda **event: events.append(event) or True)

    with pytest.raises(HTTPException) as raised:
        runtime.enforce_intelligence_result(
            {}, feature="career_intelligence", task="analysis",
            violations=["proof_count_mismatch", "proof_count_mismatch"],
            failure_code="career_intelligence_verification_failed", failure_message="withheld",
        )

    assert raised.value.status_code == 500
    assert raised.value.detail["violation_codes"] == ["proof_count_mismatch"]
    assert events[0]["passed"] is False

