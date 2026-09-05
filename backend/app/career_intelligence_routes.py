"""Career Intelligence routes with deterministic quality verification."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.ai.runtime import enforce_intelligence_result, record_intelligence_outcome
from app.auth import get_current_user
from app.career_intelligence_graph import build_career_intelligence_v5
from app.career_intelligence_trajectory import TRAJECTORY_LABELS
from app.database import entries_collection, impact_receipts_collection
from app.education_intelligence import APPLICATION_PROFILES, build_application_intelligence
from app.major_explorer import (
    MAJOR_EXPLORER_VERSION,
    MAJOR_PROFILES,
    MAX_RECOMMENDATIONS,
    build_major_explorer,
)

router = APIRouter(prefix="/career-intelligence", tags=["career-intelligence"])


class InterviewVerificationPayload(BaseModel):
    """Privacy-safe client verification summary for Aisha Jordan sessions."""
    response_count: int = Field(ge=0, le=50)
    overall_score: int = Field(ge=0, le=100)
    failed: bool = False
    violation_codes: list[str] = Field(default_factory=list, max_length=20)


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

    graph = result.get("career_graph") or {}
    if version == "career-intelligence-v5":
        if graph.get("version") != methodology.get("graph_version"):
            violations.append("career_graph_version_mismatch")
        if graph.get("taxonomy_version") != methodology.get("taxonomy_version"):
            violations.append("career_graph_taxonomy_version_mismatch")
        if graph.get("normalization_strategy") != "exact-curated-aliases-only":
            violations.append("career_graph_normalization_strategy_invalid")
        if summary.get("canonical_skill_count") != len(result.get("skills") or []):
            violations.append("canonical_skill_count_mismatch")

        nodes = graph.get("nodes") or []
        node_ids = [str(node.get("id") or "") for node in nodes]
        if any(not node_id for node_id in node_ids) or len(node_ids) != len(set(node_ids)):
            violations.append("career_graph_node_ids_invalid")
        valid_node_ids = set(node_ids)
        for node in nodes:
            if node.get("type") not in {"skill", "domain"}:
                violations.append("career_graph_node_type_invalid")
                break
            demonstrations = int(node.get("demonstrations") or 0)
            if demonstrations < 0 or demonstrations > distinct_demonstrations:
                violations.append("career_graph_node_demonstration_count_invalid")
                break

        for edge in graph.get("edges") or []:
            if edge.get("relationship") not in {"supports-domain", "co-demonstrated"}:
                violations.append("career_graph_edge_relationship_invalid")
                break
            if edge.get("source") not in valid_node_ids or edge.get("target") not in valid_node_ids:
                violations.append("career_graph_edge_endpoint_invalid")
                break
            demonstrations = int(edge.get("demonstrations") or 0)
            if demonstrations < 0 or demonstrations > distinct_demonstrations:
                violations.append("career_graph_edge_demonstration_count_invalid")
                break

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


def _verify_major_explorer(result: dict, entries: list[dict], receipts: list[dict]) -> list[str]:
    """Fail closed if Major Explorer drifts into misleading decision language."""
    violations: list[str] = []
    summary = result.get("summary") or {}
    methodology = result.get("methodology") or {}
    disclaimer = result.get("disclaimer") or {}
    recommendations = result.get("recommendations") or []
    expected_total = len(entries) + len(receipts)

    if int(summary.get("proof_records_analyzed") or 0) != expected_total:
        violations.append("major_explorer_proof_count_mismatch")
    distinct_demonstrations = int(summary.get("distinct_demonstrations") or 0)
    if distinct_demonstrations < 0 or distinct_demonstrations > expected_total:
        violations.append("major_explorer_demonstration_count_invalid")
    if int(summary.get("recommendations_returned") or 0) != len(recommendations):
        violations.append("major_explorer_recommendation_count_mismatch")
    if len(recommendations) > MAX_RECOMMENDATIONS:
        violations.append("major_explorer_recommendation_overcount")
    if summary.get("evidence_mode") != "saved-proof-only":
        violations.append("major_explorer_evidence_mode_invalid")
    if summary.get("self_reported_interests_included") is not False:
        violations.append("major_explorer_interest_source_misrepresented")

    valid_fit_labels = {
        "strong-exploration-candidate",
        "worth-exploring",
        "possible-direction",
    }
    valid_strength = {"limited", "developing", "supported"}
    seen_major_ids: set[str] = set()
    for recommendation in recommendations:
        major_id = str(recommendation.get("major_id") or "")
        if major_id not in MAJOR_PROFILES or major_id in seen_major_ids:
            violations.append("major_explorer_major_id_invalid")
            break
        seen_major_ids.add(major_id)
        if recommendation.get("fit_label") not in valid_fit_labels:
            violations.append("major_explorer_fit_label_invalid")
            break
        if recommendation.get("evidence_strength") not in valid_strength:
            violations.append("major_explorer_evidence_strength_invalid")
            break
        if int(recommendation.get("evidence_signal_count") or 0) <= 0:
            violations.append("major_explorer_signal_count_invalid")
            break
        demonstrations = int(recommendation.get("evidence_demonstrations") or 0)
        if demonstrations < 0 or demonstrations > distinct_demonstrations:
            violations.append("major_explorer_evidence_demonstrations_invalid")
            break
        if not recommendation.get("why_it_appeared"):
            violations.append("major_explorer_reason_missing")
            break
        if not recommendation.get("next_experiments"):
            violations.append("major_explorer_experiment_missing")
            break
        if not str(recommendation.get("what_we_do_not_know") or "").strip():
            violations.append("major_explorer_uncertainty_missing")
            break
        for forbidden in ("score", "fit_score", "fit_percent", "probability", "odds"):
            if forbidden in recommendation:
                violations.append("major_explorer_fake_precision_exposed")
                break

    if methodology.get("version") != MAJOR_EXPLORER_VERSION:
        violations.append("major_explorer_version_invalid")
    if methodology.get("career_intelligence_version") != "career-intelligence-v5":
        violations.append("major_explorer_engine_version_invalid")
    if methodology.get("ranking_meaning") != "evidence-alignment-for-exploration-only":
        violations.append("major_explorer_ranking_meaning_invalid")

    for field in (
        "fit_percentage",
        "best_major_claim",
        "decision_maker",
        "professional_advice",
        "acceptance_prediction",
        "scholarship_prediction",
        "graduation_prediction",
        "employment_prediction",
        "salary_prediction",
        "licensing_prediction",
        "career_success_prediction",
    ):
        if methodology.get(field) is not False:
            violations.append(f"major_explorer_{field}_enabled")

    for field in (
        "title",
        "scope",
        "not_advice",
        "no_guarantees",
        "verify_requirements",
        "user_decision",
    ):
        if not str(disclaimer.get(field) or "").strip():
            violations.append(f"major_explorer_disclaimer_{field}_missing")

    return sorted(set(violations))


def _load_intelligence(current_user: dict) -> dict:
    """Build, enrich, and verify Career Intelligence from the user's own proof."""
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    result = build_career_intelligence_v5(entries, receipts)
    violations = _verify_intelligence(result, entries, receipts)
    methodology = result.get("methodology") or {}
    version = str(methodology.get("version") or "career-intelligence-unknown")
    schema_version = str(methodology.get("schema_version") or version)
    graph = result.get("career_graph") or {}
    return enforce_intelligence_result(result, violations=violations,
        feature="career_intelligence",
        task="analysis",
        failure_code="career_intelligence_verification_failed",
        failure_message="BragStack withheld Career Intelligence because its calculated metrics did not reconcile to your saved proof.",
        provider="deterministic",
        model_id=version,
        model_revision="deterministic",
        schema_version=schema_version,
        source_count=len(entries) + len(receipts),
        generated_item_count=(
            len(result.get("skills") or [])
            + len(result.get("career_themes") or [])
            + len(result.get("recommended_actions") or [])
            + len(graph.get("nodes") or [])
            + len(graph.get("edges") or [])
        ),
        user_id=user_id,
    )


def _load_application_intelligence(current_user: dict, application_type: str) -> dict:
    """Build and verify application evidence ranking from the user's own proof."""
    if application_type not in APPLICATION_PROFILES:
        raise HTTPException(status_code=404, detail="Unknown application workflow")
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    result = build_application_intelligence(entries, receipts, application_type)
    violations = _verify_application_intelligence(result, entries, receipts)
    return enforce_intelligence_result(result, violations=violations,
        feature="education_intelligence",
        task=f"application_{application_type}",
        failure_code="application_intelligence_verification_failed",
        failure_message="BragStack withheld application guidance because its recommendations did not reconcile to your saved proof.",
        provider="deterministic",
        model_id="education-intelligence-v1",
        model_revision="deterministic",
        schema_version="education-intelligence-v1",
        source_count=len(entries) + len(receipts),
        generated_item_count=len(result.get("recommended_evidence") or []) + len(result.get("gaps") or []),
        user_id=user_id,
    )


def _load_major_explorer(current_user: dict) -> dict:
    """Build and verify evidence-backed major exploration guidance."""
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    result = build_major_explorer(entries, receipts)
    violations = _verify_major_explorer(result, entries, receipts)
    return enforce_intelligence_result(result, violations=violations,
        feature="education_intelligence",
        task="major_explorer",
        failure_code="major_explorer_verification_failed",
        failure_message="BragStack withheld Major Explorer guidance because the result did not satisfy its exploration and safety rules.",
        provider="deterministic",
        model_id=MAJOR_EXPLORER_VERSION,
        model_revision="deterministic",
        schema_version=MAJOR_EXPLORER_VERSION,
        source_count=len(entries) + len(receipts),
        generated_item_count=len(result.get("recommendations") or []),
        user_id=user_id,
    )


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


@router.get("/major-explorer")
def get_major_explorer(current_user: dict = Depends(get_current_user)):
    """Return verified, non-predictive major exploration guidance."""
    return _load_major_explorer(current_user)


@router.get("/applications/{application_type}")
def get_application_intelligence(application_type: str, current_user: dict = Depends(get_current_user)):
    """Return verified evidence recommendations for a student application workflow."""
    return _load_application_intelligence(current_user, application_type)


@router.post("/interview-verification", status_code=202)
def record_interview_verification(payload: InterviewVerificationPayload, current_user: dict = Depends(get_current_user)):
    """Record a sanitized Aisha Jordan engine outcome for the Ops intelligence inbox."""
    violations = list(payload.violation_codes)
    if payload.failed and not violations:
        violations.append("interview_engine_failed")
    record_intelligence_outcome(
        feature="interview_practice", task="aisha_jordan_session", violations=violations,
        model_id="aisha-jordan-interview-v6", schema_version="interview-summary-v1",
        source_count=payload.response_count, generated_item_count=1, user_id=str(current_user["_id"]),
    )
    return {"recorded": True}
