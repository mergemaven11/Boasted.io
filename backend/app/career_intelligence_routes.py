"""Career Intelligence routes with deterministic quality verification."""
from fastapi import APIRouter, Depends, HTTPException

from app.ai.verification import record_verification_event
from app.auth import get_current_user
from app.career_intelligence import build_career_intelligence
from app.database import entries_collection, impact_receipts_collection

router = APIRouter(prefix="/career-intelligence", tags=["career-intelligence"])


def _verify_intelligence(result: dict, entries: list[dict], receipts: list[dict]) -> list[str]:
    """Return invariant violations that would make smart analysis misleading."""
    violations: list[str] = []
    summary = result.get("summary") or {}
    expected_total = len(entries) + len(receipts)
    if summary.get("accomplishments") != len(entries):
        violations.append("accomplishment_count_mismatch")
    if summary.get("impact_receipts") != len(receipts):
        violations.append("receipt_count_mismatch")
    if summary.get("total_proof_records") != expected_total:
        violations.append("total_proof_count_mismatch")
    if int(summary.get("confirmed_receipts") or 0) > len(receipts):
        violations.append("confirmed_receipt_overcount")
    if int(summary.get("quantified_results") or 0) > expected_total:
        violations.append("quantified_result_overcount")
    if int(summary.get("evidence_items") or 0) < 0:
        violations.append("negative_evidence_count")
    for skill in result.get("skills") or []:
        demonstrations = int(skill.get("demonstrations") or 0)
        if demonstrations < 0 or demonstrations > expected_total:
            violations.append("skill_demonstration_count_invalid")
            break
    return sorted(set(violations))


def _load_intelligence(current_user: dict) -> dict:
    """Build and verify Career Intelligence from the user's own proof."""
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    result = build_career_intelligence(entries, receipts)
    violations = _verify_intelligence(result, entries, receipts)
    record_verification_event(
        feature="career_intelligence",
        task="analysis",
        passed=not violations,
        violation_codes=violations,
        provider="deterministic",
        model_id="career-intelligence-v1",
        model_revision="deterministic",
        schema_version="career-intelligence-v1",
        source_count=len(entries) + len(receipts),
        generated_item_count=len(result.get("skills") or []) + len(result.get("recommended_actions") or []),
        user_id=user_id,
    )
    if violations:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "career_intelligence_verification_failed",
                "message": "BragStack withheld Career Intelligence because its calculated metrics did not reconcile to your saved proof.",
                "violation_codes": violations,
            },
        )
    return result


@router.get("")
def get_career_intelligence(current_user: dict = Depends(get_current_user)):
    """Return verified Career Intelligence."""
    return _load_intelligence(current_user)


@router.get("/skills")
def get_skill_intelligence(current_user: dict = Depends(get_current_user)):
    """Return verified skill intelligence."""
    intelligence = _load_intelligence(current_user)
    return {"skills": intelligence["skills"], "methodology": intelligence["methodology"]}


@router.get("/gaps")
def get_career_intelligence_gaps(current_user: dict = Depends(get_current_user)):
    """Return verified evidence gaps and recommended actions."""
    intelligence = _load_intelligence(current_user)
    return {
        "gaps": intelligence["gaps"],
        "recommended_actions": intelligence["recommended_actions"],
        "methodology": intelligence["methodology"],
    }
