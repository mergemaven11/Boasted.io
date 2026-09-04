"""Internal AI/smart-feature verification dashboard APIs."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.ai.evaluation import EVAL_SUITE_VERSION
from app.ai.feature_flags import experimental_ai_enabled
from app.ai.verification import RELEASE_THRESHOLDS, SMART_FEATURES, build_verification_summary
from app.ops_routes import require_internal_role

router = APIRouter(prefix="/ops/ai-verification", tags=["ops", "ai-verification"])


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
        ],
        "open_signup_gate": {
            "resume_polish_required": True,
            "resume_quality_dashboard_required": True,
            "model_backed_ai_requires_evaluation_pass": True,
            "untracked_feature_status": "not-verified",
        },
    }
