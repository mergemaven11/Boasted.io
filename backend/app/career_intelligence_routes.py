"""Career Intelligence routes with deterministic quality verification."""
from fastapi import APIRouter, Depends, HTTPException

from app.ai.verification import record_verification_event
from app.auth import get_current_user
from app.career_intelligence import build_career_intelligence
from app.career_intelligence_trajectory import (
    TRAJECTORY_LABELS,
    enrich_career_trajectory,
)
from app.database import entries_collection, impact_receipts_collection
from app.education_intelligence import APPLICATION_PROFILES, build_application_intelligence

router = APIRouter(prefix="/career-intelligence", tags=["career-intelligence"])


def _bounded_percent(value) -> bool:
    """Return whether a value can represent a percentage from 0 through 100."""
    try:
        number = int(value or 0)
    except (TypeError, ValueError):
        return False
    return 0 <= number <= 100


def _verify_intelligence(result: dict, entries: list[dict], receipts: list[dict]) -> list[str]:
    """Return invariant violations that would make smart analysis misleading."""
    violations: list[str] = []
    summary = result.get("summary") or {}
    methodology = result.get("methodology") or {}
    expected_total = len(entries) + len(receipts)

    if summary.get("accomplishments") != len(entries):
        violations.append("accomplishment_count_mismatch")
    if summary.get("impact_receipts") != len(receipts):
        violations.append("receipt_count_mismatch")
    if summary.get("total_proof_records") != expected_total:
        violations.append("total_proof_count_mismatch")

    try:
        distinct_demonstrations = int(summary.get("distinct_demonstrations") or 0)
    except (TypeError, ValueError):
        distinct_demonstrations = -1
    if distinct_demonstrations < 0 or distinct_demonstrations > expected_total:
        violations.append("distinct_demonstration_count_invalid")

    if int(summary.get("confirmed_receipts") or 0) > len(receipts):
        violations.append("confirmed_receipt_overcount")
    if int(summary.get("quantified_results") or 0) > distinct_demonstrations:
        violations.append("quantified_result_overcount")
    if int(summary.get("evidence_backed_demonstrations") or 0) > distinct_demonstrations:
        violations.append("evidence_demonstration_overcount")
    if int(summary.get("confirmed_demonstrations") or 0) > distinct_demonstrations:
        violations.append("confirmed_demonstration_overcount")
    if int(summary.get("evidence_items") or 0) < 0:
        violations.append("negative_evidence_count")

    for field in (
        "quantified_coverage_percent",
        "evidence_coverage_percent",
        "confirmation_coverage_percent",
        "receipt_coverage_percent",
    ):
        if not _bounded_percent(summary.get(field)):
            violations.append(f"{field}_invalid")

    valid_signals = {"emerging", "established", "strong"}
    valid_support_levels = {"basic", "supported", "well-supported"}
    for skill in result.get("skills") or []:
        demonstrations = int(skill.get("demonstrations") or 0)
        if demonstrations < 0 or demonstrations > distinct_demonstrations:
            violations.append("skill_demonstration_count_invalid")
            break
        if int(skill.get("evidence_backed_demonstrations") or 0) > demonstrations:
            violations.append("skill_evidence_demonstration_overcount")
            break
        if int(skill.get("confirmed_demonstrations") or 0) > demonstrations:
            violations.append("skill_confirmed_demonstration_overcount")
            break
        points = int(skill.get("evidence_points") or 0)
        if points < 0 or points > 100:
            violations.append("skill_evidence_points_invalid")
            break
        if skill.get("signal") not in valid_signals:
            violations.append("skill_signal_invalid")
            break
        if skill.get("support_level") not in valid_support_levels:
            violations.append("skill_support_level_invalid")
            break
        if "trajectory" in skill and skill.get("trajectory") not in TRAJECTORY_LABELS:
            violations.append("skill_trajectory_invalid")
            break
        if int(skill.get("recent_demonstrations") or 0) > demonstrations:
            violations.append("skill_recent_demonstration_overcount")
            break
        if int(skill.get("historical_demonstrations") or 0) > demonstrations:
            violations.append("skill_historical_demonstration_overcount")
            break

    profile = result.get("career_profile") or {}
    if profile.get("maturity") not in {"early", "developing", "well-supported"}:
        violations.append("career_profile_maturity_invalid")

    version = str(methodology.get("version") or "")
    if not version.startswith("career-intelligence-v"):
        violations.append("career_intelligence_version_invalid")
    if methodology.get("employment_decision") is not False:
        violations.append("employment_decision_enabled")

    return sorted(set(violations))


def _verify_application_intelligence(result: dict, entries: list[dict], receipts: list[dict]) -> list[str]:
    """Return invariant violations for application-focused evidence ranking."""
    violations: list[str] = []
    summary = result.get("summary") or {}
    if summary.get("accomplishments_analyzed") != len(entries):
        violations.append("application_accomplishment_count_mismatch")
    if summary.get("impact_receipts_analyzed") != len(receipts):
        violations.append("application_receipt_count_mismatch")
    known_entry_ids = {str(entry.get("_id") or entry.get("id") or "") for entry in entries}
    recommendations = result.get("recommended_evidence") or []
    if len(recommendations) > min(len(entries), 8):
        violations.append("application_recommendation_overcount")
    for recommendation in recommendations:
        if recommendation.get("entry_id") not in known_entry_ids:
            violations.append("application_unknown_entry")
            break
        if recommendation.get("fit_strength") not in {"strong", "relevant", "emerging"}:
            violations.append("application_invalid_fit_strength")
            break
    methodology = result.get("methodology") or {}
    if methodology.get("acceptance_prediction") is not False:
        violations.append("application_acceptance_prediction_enabled")
    if methodology.get("scholarship_prediction") is not False:
        violations.append("application_scholarship_prediction_enabled")
    return sorted(set(violations))


def _load_intelligence(current_user: dict) -> dict:
    """Build, enrich, and verify Career Intelligence from the user's own proof."""
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    result = build_career_intelligence(entries, receipts)
    result = enrich_career_trajectory(result, entries, receipts)
    violations = _verify_intelligence(result, entries, receipts)
    methodology = result.get("methodology") or {}
    version = str(methodology.get("version") or "career-intelligence-unknown")
    schema_version = str(methodology.get("schema_version") or version)
    record_verification_event(
        feature="career_intelligence",
        task="analysis",
        passed=not violations,
        violation_codes=violations,
        provider="deterministic",
        model_id=version,
        model_revision="deterministic",
        schema_version=schema_version,
        source_count=len(entries) + len(receipts),
        generated_item_count=(
            len(result.get("skills") or [])
            + len(result.get("career_themes") or [])
            + len(result.get("recommended_actions") or [])
        ),
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


def _load_application_intelligence(current_user: dict, application_type: str) -> dict:
    """Build and verify application evidence ranking from the user's own proof."""
    if application_type not in APPLICATION_PROFILES:
        raise HTTPException(status_code=404, detail="Unknown application workflow")
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    result = build_application_intelligence(entries, receipts, application_type)
    violations = _verify_application_intelligence(result, entries, receipts)
    record_verification_event(
        feature="career_intelligence",
        task=f"application_{application_type}",
        passed=not violations,
        violation_codes=violations,
        provider="deterministic",
        model_id="education-intelligence-v1",
        model_revision="deterministic",
        schema_version="education-intelligence-v1",
        source_count=len(entries) + len(receipts),
        generated_item_count=len(result.get("recommended_evidence") or []) + len(result.get("gaps") or []),
        user_id=user_id,
    )
    if violations:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "application_intelligence_verification_failed",
                "message": "BragStack withheld application guidance because its recommendations did not reconcile to your saved proof.",
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


@router.get("/applications/{application_type}")
def get_application_intelligence(application_type: str, current_user: dict = Depends(get_current_user)):
    """Return verified evidence recommendations for a student application workflow."""
    return _load_application_intelligence(current_user, application_type)
