"""Shared verification runtime for every Boasted intelligence surface."""
from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from fastapi import HTTPException

from app.ai.verification import record_verification_event

INTELLIGENCE_RUNTIME_VERSION = "bragstack-intelligence-v6"


def record_intelligence_outcome(
    *, feature: str, task: str, violations: Iterable[str] = (), provider: str = "deterministic",
    model_id: str = "", model_revision: str = "deterministic", schema_version: str = "",
    source_count: int = 0, generated_item_count: int = 0, user_id: str = "",
) -> list[str]:
    """Normalize and persist a privacy-safe outcome for the shared engine."""
    normalized = sorted({str(code).strip()[:120] for code in violations if str(code).strip()})
    record_verification_event(
        feature=feature, task=task, passed=not normalized, violation_codes=normalized,
        provider=provider, model_id=model_id or INTELLIGENCE_RUNTIME_VERSION,
        model_revision=model_revision, prompt_version=INTELLIGENCE_RUNTIME_VERSION,
        schema_version=schema_version or INTELLIGENCE_RUNTIME_VERSION,
        source_count=source_count, generated_item_count=generated_item_count, user_id=user_id,
    )
    return normalized


def enforce_intelligence_result(
    result: dict[str, Any], *, feature: str, task: str, violations: Iterable[str],
    failure_code: str, failure_message: str, status_code: int = 500, **telemetry: Any,
) -> dict[str, Any]:
    """Record one engine run and fail closed when its invariants do not hold."""
    normalized = record_intelligence_outcome(feature=feature, task=task, violations=violations, **telemetry)
    if normalized:
        raise HTTPException(status_code=status_code, detail={
            "code": failure_code, "message": failure_message, "violation_codes": normalized,
            "engine_version": INTELLIGENCE_RUNTIME_VERSION,
        })
    result.setdefault("intelligence_runtime", {"version": INTELLIGENCE_RUNTIME_VERSION, "verified": True})
    return result
