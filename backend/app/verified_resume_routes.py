"""Verified, fail-closed resume build endpoint used by every client path."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.ai.verification import record_verification_event
from app.auth import get_current_user
from app.plans import require_feature
from app.resume_builder import analyze_resume
from app.resume_builder_routes import ResumeBuildRequest, _owned_receipts
from app.resume_quality import build_safe_generated_summary, verify_resume_analysis

router = APIRouter(prefix="/resume-builder", tags=["resume-builder", "verification"])


@router.post("/build")
@router.post("/build-verified", include_in_schema=False)
def build_verified_resume(payload: ResumeBuildRequest, current_user: dict = Depends(get_current_user)):
    """Build resume suggestions and withhold any output that fails grounding checks.

    The canonical legacy-compatible ``/build`` route and the explicit verified
    alias share this exact implementation. This router is mounted before the
    older resume-builder router so existing API clients cannot bypass the
    verification gate by continuing to call the historical endpoint.
    """
    require_feature(current_user, "resume_builder")
    user_id = str(current_user["_id"])
    receipts = _owned_receipts(user_id, payload.selected_receipt_ids)
    result = analyze_resume(
        target_role=payload.target_role,
        job_description=payload.job_description,
        receipts=receipts,
        existing_resume_text=payload.existing_resume_text,
    )

    result["summary"] = build_safe_generated_summary(
        target_role=payload.target_role,
        receipts=receipts,
        existing_resume_text=payload.existing_resume_text,
        current_summary=result.get("summary", ""),
    )
    verification = verify_resume_analysis(
        analysis=result,
        receipts=receipts,
        existing_resume_text=payload.existing_resume_text,
        target_role=payload.target_role,
    )
    result["source_receipt_count"] = len(receipts)
    result["quality_verification"] = verification

    violation_codes = [item["code"] for item in verification.get("violations", [])]
    record_verification_event(
        feature="resume_builder",
        task="build_verified",
        passed=verification["passed"],
        violation_codes=violation_codes,
        provider="deterministic",
        model_id="resume-builder-v1",
        model_revision="grounded-v1",
        prompt_version="resume-grounding-v1",
        schema_version="resume-builder-schema-v4",
        source_count=len(receipts) + (1 if payload.existing_resume_text.strip() else 0),
        generated_item_count=verification.get("generated_bullet_count", 0) + (1 if result.get("summary") else 0),
        user_id=user_id,
    )

    if not verification["passed"]:
        # Fail closed: unsafe generated text is not returned to the browser.
        raise HTTPException(
            status_code=422,
            detail={
                "code": "resume_suggestion_verification_failed",
                "message": "BragStack withheld generated resume suggestions because they could not be verified against your source evidence.",
                "violation_codes": violation_codes,
            },
        )
    return result
