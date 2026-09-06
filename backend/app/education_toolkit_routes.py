"""Verified API routes for the Boasted Education toolkit."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.ai.runtime import enforce_intelligence_result
from app.auth import get_current_user
from app.database import entries_collection, impact_receipts_collection
from app.education_toolkit import (
    EDUCATION_TOOLKIT_VERSION,
    MAX_EVIDENCE,
    TOOL_PROFILES,
    build_education_toolkit,
)

router = APIRouter(prefix="/career-intelligence/education-toolkit", tags=["education-toolkit"])


def _verify_toolkit(result: dict, entries: list[dict], receipts: list[dict], tool_id: str) -> list[str]:
    """Fail closed if a toolkit result drifts away from saved evidence or safety rules."""
    violations: list[str] = []
    methodology = result.get("methodology") or {}
    summary = result.get("summary") or {}
    tool = result.get("tool") or {}

    if tool.get("id") != tool_id or tool_id not in TOOL_PROFILES:
        violations.append("education_toolkit_unknown_tool")

    known_entry_ids = {str(entry.get("_id") or entry.get("id") or "") for entry in entries}
    recommendations = result.get("recommended_evidence") or []
    if len(recommendations) > min(len(entries), MAX_EVIDENCE):
        violations.append("education_toolkit_recommendation_overcount")
    for recommendation in recommendations:
        if str(recommendation.get("entry_id") or "") not in known_entry_ids:
            violations.append("education_toolkit_unknown_entry")
            break
        if recommendation.get("support_level") not in {"saved-record", "supported", "well-supported"}:
            violations.append("education_toolkit_support_level_invalid")
            break

    for skill in result.get("skill_signals") or []:
        if int(skill.get("demonstrations") or 0) <= 0:
            violations.append("education_toolkit_skill_count_invalid")
            break
        for entry_id in skill.get("evidence_entry_ids") or []:
            if str(entry_id) not in known_entry_ids:
                violations.append("education_toolkit_skill_unknown_entry")
                break

    valid_direction_ids = {str(item.get("id") or "") for item in result.get("career_directions") or []}
    if len(valid_direction_ids) != len(result.get("career_directions") or []):
        violations.append("education_toolkit_direction_ids_invalid")

    if int(summary.get("education_records") or 0) < 0 or int(summary.get("education_records") or 0) > len(entries):
        violations.append("education_toolkit_education_count_invalid")
    if int(summary.get("records_with_impact_receipts") or 0) > len(receipts):
        # One receipt can support one education record. This field counts records, not receipts.
        receipt_source_ids = {str(receipt.get("source_entry_id") or "") for receipt in receipts}
        if int(summary.get("records_with_impact_receipts") or 0) > len(receipt_source_ids):
            violations.append("education_toolkit_receipt_count_invalid")

    if methodology.get("version") != EDUCATION_TOOLKIT_VERSION:
        violations.append("education_toolkit_version_invalid")
    if methodology.get("evidence_mode") != "member-saved-proof-only":
        violations.append("education_toolkit_evidence_mode_invalid")

    for field in (
        "fit_percentage",
        "best_major_claim",
        "best_career_claim",
        "admissions_prediction",
        "scholarship_prediction",
        "graduation_prediction",
        "employment_prediction",
        "salary_prediction",
        "employment_decision",
    ):
        if methodology.get(field) is not False:
            violations.append(f"education_toolkit_{field}_enabled")

    return sorted(set(violations))


@router.get("/{tool_id}")
def get_education_toolkit(tool_id: str, current_user: dict = Depends(get_current_user)):
    """Return one verified Education tool powered only by the member's saved proof."""
    if tool_id not in TOOL_PROFILES:
        raise HTTPException(status_code=404, detail="Unknown Education tool")

    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    result = build_education_toolkit(entries, receipts, tool_id)
    violations = _verify_toolkit(result, entries, receipts, tool_id)

    return enforce_intelligence_result(
        result,
        violations=violations,
        feature="education_toolkit",
        task=tool_id,
        failure_code="education_toolkit_verification_failed",
        failure_message="Boasted withheld this Education tool because its output did not reconcile to your saved proof.",
        provider="deterministic",
        model_id=EDUCATION_TOOLKIT_VERSION,
        model_revision="deterministic",
        schema_version=EDUCATION_TOOLKIT_VERSION,
        source_count=len(entries) + len(receipts),
        generated_item_count=(
            len(result.get("recommended_evidence") or [])
            + len(result.get("gaps") or [])
            + len(result.get("skill_signals") or [])
            + len(result.get("career_directions") or [])
        ),
        user_id=user_id,
    )
