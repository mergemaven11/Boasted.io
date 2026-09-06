"""Internal AI/smart-feature verification dashboard APIs."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.ai.evaluation import EVAL_SUITE_VERSION
from app.ai.expanded_release_evaluation import (
    AISHA_CASE_RULES,
    AISHA_RELEASE_SUITE_VERSION,
    record_aisha_release_case,
    run_compliance_release_evaluation,
)
from app.ai.feature_flags import experimental_ai_enabled
from app.ai.release_evaluation import release_evaluation_summary, run_resume_release_evaluation
from app.ai.verification import RELEASE_THRESHOLDS, SMART_FEATURES, build_verification_summary
from app.ops_routes import require_internal_role

router = APIRouter(prefix="/ops/ai-verification", tags=["ops", "ai-verification"])


class AishaReleaseCasePayload(BaseModel):
    """Sanitized metrics produced by one deterministic browser calibration case."""
    case_id: str = Field(min_length=1, max_length=120)
    metrics: dict[str, Any] = Field(default_factory=dict)


class AishaReleaseBatchPayload(BaseModel):
    """Complete current-version Aisha calibration batch."""
    suite_version: str = Field(min_length=1, max_length=120)
    cases: list[AishaReleaseCasePayload] = Field(min_length=1, max_length=64)


@router.get("/summary")
def get_ai_verification_summary(
    days: int = Query(default=30, ge=1, le=365),
    current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    """Return privacy-safe quality metrics for internal smart-feature review."""
    del current_user
    summary = build_verification_summary(days=days)
    summary["evaluation_suite_version"] = EVAL_SUITE_VERSION
    summary["experimental_model_ai_enabled"] = experimental_ai_enabled()
    summary["tracked_features"] = list(SMART_FEATURES)
    return summary


@router.post("/run-release-evaluation")
def run_server_release_evaluation(
    current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    """Run server-side deterministic release checks on the deployed revision."""
    actor_user_id = str(current_user.get("_id", ""))
    resume_results = run_resume_release_evaluation(actor_user_id=actor_user_id)
    compliance_results = run_compliance_release_evaluation(actor_user_id=actor_user_id)
    return {
        "resume_builder": release_evaluation_summary(resume_results),
        "compliance_intelligence": release_evaluation_summary(compliance_results),
        "client_evaluation_required": ["interview_practice"],
    }


@router.post("/record-aisha-release-evaluation")
def record_aisha_release_evaluation(
    payload: AishaReleaseBatchPayload,
    current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    """Validate browser-engine calibration metrics server-side and record results."""
    if payload.suite_version != AISHA_RELEASE_SUITE_VERSION:
        raise HTTPException(status_code=422, detail="Unsupported Aisha release evaluation suite.")
    expected_case_ids = set(AISHA_CASE_RULES)
    received_case_ids = [case.case_id for case in payload.cases]
    if len(received_case_ids) != len(set(received_case_ids)) or set(received_case_ids) != expected_case_ids:
        raise HTTPException(
            status_code=422,
            detail="Aisha release evaluation must include every expected calibration case exactly once.",
        )

    actor_user_id = str(current_user.get("_id", ""))
    results = [
        record_aisha_release_case(
            case_id=case.case_id,
            metrics=case.metrics,
            actor_user_id=actor_user_id,
        )
        for case in payload.cases
    ]
    return release_evaluation_summary(results)


@router.get("/release-policy")
def get_ai_release_policy(
    current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    """Return the pre-open-signup quality policy without exposing user content."""
    del current_user
    return {
        "policy_version": "open-signup-ai-gate-v1",
        "experimental_model_ai_enabled": experimental_ai_enabled(),
        "evaluation_suite_version": EVAL_SUITE_VERSION,
        "release_thresholds": RELEASE_THRESHOLDS,
        "non_negotiables": [
            "AI suggestions may not manufacture career facts.",
            "Unsupported numeric claims block the suggestion.",
            "Generated resume bullets require exact source provenance.",
            "Job-description terms cannot become user skills without user-controlled evidence.",
            "Target roles are user intent and cannot be presented as employment history.",
            "Company, title, education, credential, and verification claims cannot be synthesized without source evidence.",
            "Unsafe suggestions fail closed and are withheld from the browser.",
            "Verification telemetry stores metadata and error codes, not resume/evidence/output text.",
            "Release-evaluation samples are revision-scoped and idempotent so reruns cannot inflate the sample gate.",
        ],
        "open_signup_gate": {
            "resume_polish_required": True,
            "resume_quality_dashboard_required": True,
            "model_backed_ai_requires_evaluation_pass": True,
            "untracked_feature_status": "not-verified",
        },
    }
