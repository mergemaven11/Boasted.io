"""Deterministic release evaluations for BragStack smart features.

These checks execute the same production verification code used by customer
workflows. Only pass/fail metadata and machine-readable case identifiers are
persisted; fixture text is never written to verification telemetry.
"""
from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
from typing import Any

from bson import ObjectId

from app.ai.verification import (
    RELEASE_EVALUATION_SAMPLE_KIND,
    current_release_revision,
    record_verification_event,
)
from app.compliance_routes import STATUS_ORDER, SEVERITY_ORDER, _summary, evaluate_controls
from app.resume_builder import analyze_resume
from app.resume_quality import build_safe_generated_summary, verify_resume_analysis

RESUME_RELEASE_SUITE_VERSION = "resume-release-eval-v1"
COMPLIANCE_RELEASE_SUITE_VERSION = "compliance-release-eval-v1"
AISHA_RELEASE_SUITE_VERSION = "aisha-calibration-v1"

_RESUME_PROFILES = (
    ("platform-engineer", "Platform Engineer", "Python", "Automation", "Reduced average incident triage time by 42%", "Triage reduction", "42%"),
    ("support-engineer", "Customer Support Engineer", "Docker", "Troubleshooting", "Reduced repeat customer escalations by 18%", "Escalation reduction", "18%"),
    ("data-analyst", "Data Analyst", "SQL", "Tableau", "Reduced weekly reporting preparation time by 35%", "Reporting reduction", "35%"),
    ("project-manager", "Project Manager", "Planning", "Risk Management", "Reduced missed project handoffs by 24%", "Handoff reduction", "24%"),
    ("security-analyst", "Security Analyst", "Incident Response", "SIEM", "Reduced alert investigation time by 31%", "Investigation reduction", "31%"),
    ("ux-designer", "UX Designer", "Figma", "Accessibility", "Reduced accessibility review rework by 22%", "Rework reduction", "22%"),
    ("teacher", "Teacher", "Curriculum Planning", "Assessment", "Increased assignment completion by 16%", "Completion increase", "16%"),
    ("nurse", "Registered Nurse", "Patient Education", "Clinical Documentation", "Reduced discharge instruction follow-up questions by 14%", "Follow-up reduction", "14%"),
    ("sales-operations", "Sales Operations Analyst", "CRM", "Forecasting", "Reduced duplicate opportunity records by 27%", "Duplicate reduction", "27%"),
    ("accountant", "Accountant", "Reconciliation", "Excel", "Reduced month-end reconciliation exceptions by 19%", "Exception reduction", "19%"),
)

_ADVERSARIAL_MUTATIONS = (
    "unsupported_numeric_claim",
    "unsupported_skill",
    "target_role_presented_as_fact",
    "invalid_source_receipt",
    "unsupported_high_risk_language",
    "generated_summary_without_evidence",
    "unsupported_numeric_claim",
    "unsupported_skill",
    "target_role_presented_as_fact",
    "unsupported_high_risk_language",
)


@dataclass(frozen=True)
class ReleaseCaseResult:
    feature: str
    case_id: str
    passed: bool
    violation_codes: tuple[str, ...]
    suite_version: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "feature": self.feature,
            "case_id": self.case_id,
            "passed": self.passed,
            "violation_codes": list(self.violation_codes),
            "suite_version": self.suite_version,
        }


def _resume_receipt(index: int, profile: tuple[str, str, str, str, str, str, str]) -> dict[str, Any]:
    slug, _role, skill_one, skill_two, result, metric_label, metric_value = profile
    return {
        "_id": ObjectId(f"{index + 1:024x}"),
        "accomplishment": f"Improved {slug.replace('-', ' ')} workflow",
        "contribution": f"Built and documented a repeatable workflow using {skill_one} and {skill_two}",
        "result": result,
        "skills": [skill_one, skill_two],
        "metrics": [{"label": metric_label, "value": metric_value, "context": result}],
        "evidence": [{"title": f"{slug} release evaluation fixture"}],
        "trust_signals": ["self-documented"],
    }


def _build_verified_resume_fixture(index: int, profile: tuple[str, str, str, str, str, str, str]) -> tuple[dict, dict, str]:
    _slug, role, skill_one, skill_two, _result, _metric_label, _metric_value = profile
    receipt = _resume_receipt(index, profile)
    analysis = analyze_resume(
        target_role=role,
        job_description=f"We need {skill_one} and {skill_two} experience for this {role} role.",
        receipts=[receipt],
        existing_resume_text="",
    )
    analysis["summary"] = build_safe_generated_summary(
        target_role=role,
        receipts=[receipt],
        existing_resume_text="",
        current_summary=analysis.get("summary", ""),
    )
    return analysis, receipt, role


def _positive_resume_case(index: int, profile: tuple[str, str, str, str, str, str, str]) -> ReleaseCaseResult:
    slug = profile[0]
    analysis, receipt, role = _build_verified_resume_fixture(index, profile)
    verification = verify_resume_analysis(
        analysis=analysis,
        receipts=[receipt],
        existing_resume_text="",
        target_role=role,
    )
    observed = tuple(sorted(item["code"] for item in verification.get("violations", [])))
    passed = bool(verification.get("passed"))
    violation_codes = () if passed else tuple(f"release_eval_positive_failed:{code}" for code in (observed or ("unknown",)))
    return ReleaseCaseResult(
        feature="resume_builder",
        case_id=f"safe-{slug}",
        passed=passed,
        violation_codes=violation_codes,
        suite_version=RESUME_RELEASE_SUITE_VERSION,
    )


def _adversarial_resume_case(
    index: int,
    profile: tuple[str, str, str, str, str, str, str],
    mutation: str,
) -> ReleaseCaseResult:
    slug = profile[0]
    analysis, receipt, role = _build_verified_resume_fixture(index, profile)
    mutated = deepcopy(analysis)
    receipts = [receipt]

    if mutation == "unsupported_numeric_claim":
        if not mutated.get("bullets"):
            mutated["bullets"] = [{
                "text": "Improved results by 987%",
                "source_receipt_id": str(receipt["_id"]),
                "source_kind": "impact-receipt",
            }]
        else:
            mutated["bullets"][0]["text"] = f"{mutated['bullets'][0]['text']}; increased revenue by 987%"
    elif mutation == "unsupported_skill":
        mutated["skills"] = list(mutated.get("skills") or []) + ["Quantum Computing"]
    elif mutation == "target_role_presented_as_fact":
        mutated["summary"] = f"{role} with evidence-backed impact across {profile[2]}."
    elif mutation == "invalid_source_receipt":
        if mutated.get("bullets"):
            mutated["bullets"][0]["source_receipt_id"] = "000000000000000000000000"
    elif mutation == "unsupported_high_risk_language":
        mutated["summary"] = f"Targeting {role} roles, with certified expertise in {profile[2]}."
    elif mutation == "generated_summary_without_evidence":
        receipts = []
        mutated = {"summary": f"Targeting {role} roles with proven impact.", "skills": [], "bullets": []}

    verification = verify_resume_analysis(
        analysis=mutated,
        receipts=receipts,
        existing_resume_text="",
        target_role=role,
    )
    observed = {item["code"] for item in verification.get("violations", [])}
    expected = mutation
    if mutation == "invalid_source_receipt":
        expected = "invalid_source_receipt"

    passed = verification.get("passed") is False and expected in observed
    violation_codes = () if passed else (f"release_eval_expected_rejection_missing:{expected}",)
    return ReleaseCaseResult(
        feature="resume_builder",
        case_id=f"guard-{slug}-{mutation}",
        passed=passed,
        violation_codes=violation_codes,
        suite_version=RESUME_RELEASE_SUITE_VERSION,
    )


def run_resume_release_evaluation(*, actor_user_id: str = "") -> list[ReleaseCaseResult]:
    """Run 10 grounded happy paths and 10 fail-closed adversarial cases."""
    revision = current_release_revision()
    results: list[ReleaseCaseResult] = []
    for index, profile in enumerate(_RESUME_PROFILES):
        results.append(_positive_resume_case(index, profile))
    for index, (profile, mutation) in enumerate(zip(_RESUME_PROFILES, _ADVERSARIAL_MUTATIONS, strict=True)):
        results.append(_adversarial_resume_case(index, profile, mutation))

    for result in results:
        record_verification_event(
            feature=result.feature,
            task="release_evaluation",
            passed=result.passed,
            violation_codes=result.violation_codes,
            provider="deterministic",
            model_id="resume-builder-v1",
            model_revision="grounded-v1",
            prompt_version="resume-grounding-v1",
            schema_version="resume-builder-schema-v4",
            source_count=1,
            generated_item_count=1,
            user_id=actor_user_id,
            sample_kind=RELEASE_EVALUATION_SAMPLE_KIND,
            suite_version=result.suite_version,
            case_id=result.case_id,
            release_revision=revision,
        )
    return results


def _compliance_fixture_cases() -> tuple[tuple[str, dict[str, Any]], ...]:
    """Return sanitized business-state fixtures; no production data is read."""
    return (
        ("empty-beta", {}),
        ("consented-beta", {
            "total_users": 8,
            "users_with_terms_acceptance": 8,
            "users_with_privacy_acknowledgement": 8,
        }),
        ("paid-not-verified", {
            "total_users": 12,
            "users_with_terms_acceptance": 12,
            "users_with_privacy_acknowledgement": 12,
            "paid_recurring_subscribers": 3,
            "persisted_pro_accounts": 3,
        }),
        ("operations-verified", {
            "total_users": 20,
            "users_with_terms_acceptance": 20,
            "users_with_privacy_acknowledgement": 20,
            "legal_entity_formed": True,
            "ein_obtained": True,
            "customer_legal_package_counsel_reviewed": True,
            "georgia_renewal_flow_production_verified": True,
            "vendor_inventory_verified": True,
            "retention_jobs_verified": True,
            "drive_compliance_evidence_verified": True,
            "commercial_email_controls_verified": True,
            "marketing_claim_review_verified": True,
        }),
        ("future-ai-review", {
            "total_users": 5,
            "users_with_terms_acceptance": 5,
            "users_with_privacy_acknowledgement": 5,
            "employer_facing_ai_decisions_enabled": True,
        }),
    )


def _verify_compliance_fixture(facts: dict[str, Any]) -> tuple[str, ...]:
    findings = evaluate_controls(facts)
    summary = _summary(findings)
    violations: list[str] = []
    valid_statuses = set(STATUS_ORDER)
    valid_severities = set(SEVERITY_ORDER)
    control_ids = [str(item.get("control_id") or "") for item in findings]

    if not findings:
        violations.append("compliance_eval:no_findings")
    if any(not control_id for control_id in control_ids) or len(control_ids) != len(set(control_ids)):
        violations.append("compliance_eval:control_ids_invalid")
    if any(item.get("status") not in valid_statuses for item in findings):
        violations.append("compliance_eval:status_invalid")
    if any(item.get("severity") not in valid_severities for item in findings):
        violations.append("compliance_eval:severity_invalid")
    if sum((summary.get("by_status") or {}).values()) != len(findings):
        violations.append("compliance_eval:status_counts_mismatch")
    if sum((summary.get("by_severity") or {}).values()) != len(findings):
        violations.append("compliance_eval:severity_counts_mismatch")
    if summary.get("overall") not in {"ready", "action_required", "critical_actions"}:
        violations.append("compliance_eval:overall_invalid")
    if summary.get("beta_posture") not in {"continue_beta", "pause_site"}:
        violations.append("compliance_eval:beta_posture_invalid")
    if summary.get("paid_launch_posture") not in {"verified", "verify_before_paid_launch", "pause_new_paid_checkout"}:
        violations.append("compliance_eval:paid_posture_invalid")
    if summary.get("fundraising_posture") not in {"reviewed", "hold_until_legal_ready"}:
        violations.append("compliance_eval:fundraising_posture_invalid")
    for item in findings:
        if not str(item.get("title") or "").strip() or not str(item.get("next_action") or "").strip():
            violations.append("compliance_eval:finding_content_missing")
            break
        if not isinstance(item.get("evidence"), list):
            violations.append("compliance_eval:evidence_shape_invalid")
            break
    return tuple(sorted(set(violations)))


def run_compliance_release_evaluation(*, actor_user_id: str = "") -> list[ReleaseCaseResult]:
    """Verify compliance-engine structure without treating real business gaps as defects."""
    revision = current_release_revision()
    results: list[ReleaseCaseResult] = []
    for case_id, facts in _compliance_fixture_cases():
        violations = _verify_compliance_fixture(facts)
        result = ReleaseCaseResult(
            feature="compliance_intelligence",
            case_id=case_id,
            passed=not violations,
            violation_codes=violations,
            suite_version=COMPLIANCE_RELEASE_SUITE_VERSION,
        )
        results.append(result)
        record_verification_event(
            feature=result.feature,
            task="release_evaluation",
            passed=result.passed,
            violation_codes=result.violation_codes,
            provider="deterministic",
            model_id="compliance-rule-pack",
            model_revision="deterministic",
            schema_version="compliance-release-eval-v1",
            source_count=len(facts),
            generated_item_count=1,
            user_id=actor_user_id,
            sample_kind=RELEASE_EVALUATION_SAMPLE_KIND,
            suite_version=result.suite_version,
            case_id=result.case_id,
            release_revision=revision,
        )
    return results


AISHA_CASE_RULES: dict[str, dict[str, Any]] = {
    "vague-all-red": {"overall_max": 54, "all_dimensions_max": 54},
    "ownership-no-credit": {"ownership_max": 20, "action_found": False},
    "short-answer-low-score": {"overall_max": 25},
    "strong-star": {"overall_min": 65, "strong_dimension_min": 70, "strong_dimension_count_min": 4, "action_found": True, "result_found": True},
    "truthful-impact-no-metric": {"impact_min": 70, "quantified": False, "result_found": True},
    "weak-session-summary": {"overall_max": 54, "has_strong_areas": False, "strongest_area_count": 0, "improvement_area_count": 6},
}


def evaluate_aisha_release_case(case_id: str, metrics: dict[str, Any]) -> ReleaseCaseResult:
    """Independently validate sanitized metrics produced by the deployed JS engine."""
    rule = AISHA_CASE_RULES.get(case_id)
    violations: list[str] = []
    if not rule:
        violations.append("aisha_eval:unknown_case")
    else:
        overall = int(metrics.get("overall_score", -1))
        dimensions = metrics.get("dimensions") or {}
        if "overall_max" in rule and not (0 <= overall <= int(rule["overall_max"])):
            violations.append("aisha_eval:overall_too_high")
        if "overall_min" in rule and overall < int(rule["overall_min"]):
            violations.append("aisha_eval:overall_too_low")
        if "all_dimensions_max" in rule:
            scores = [int(value) for value in dimensions.values()]
            if len(scores) != 6 or any(score > int(rule["all_dimensions_max"]) for score in scores):
                violations.append("aisha_eval:weak_dimensions_not_calibrated")
        if "ownership_max" in rule and int(dimensions.get("ownership", 101)) > int(rule["ownership_max"]):
            violations.append("aisha_eval:ownership_overcredited")
        if "impact_min" in rule and int(dimensions.get("impact", -1)) < int(rule["impact_min"]):
            violations.append("aisha_eval:impact_undercredited")
        if "strong_dimension_count_min" in rule:
            minimum = int(rule["strong_dimension_min"])
            count = sum(int(value) >= minimum for value in dimensions.values())
            if count < int(rule["strong_dimension_count_min"]):
                violations.append("aisha_eval:strong_dimensions_missing")
        bool_checks = {
            "action_found": "action_found",
            "result_found": "result_found",
            "quantified": "quantified",
            "has_strong_areas": "has_strong_areas",
        }
        for rule_key, metric_key in bool_checks.items():
            if rule_key in rule and bool(metrics.get(metric_key)) is not bool(rule[rule_key]):
                violations.append(f"aisha_eval:{metric_key}_mismatch")
        count_checks = {
            "strongest_area_count": "strongest_area_count",
            "improvement_area_count": "improvement_area_count",
        }
        for rule_key, metric_key in count_checks.items():
            if rule_key in rule and int(metrics.get(metric_key, -1)) != int(rule[rule_key]):
                violations.append(f"aisha_eval:{metric_key}_mismatch")

    return ReleaseCaseResult(
        feature="interview_practice",
        case_id=case_id,
        passed=not violations,
        violation_codes=tuple(sorted(set(violations))),
        suite_version=AISHA_RELEASE_SUITE_VERSION,
    )


def record_aisha_release_case(
    *,
    case_id: str,
    metrics: dict[str, Any],
    actor_user_id: str = "",
) -> ReleaseCaseResult:
    """Validate and persist one browser-executed Aisha calibration case."""
    result = evaluate_aisha_release_case(case_id, metrics)
    record_verification_event(
        feature=result.feature,
        task="release_evaluation",
        passed=result.passed,
        violation_codes=result.violation_codes,
        provider="deterministic-browser",
        model_id="aisha-jordan-interview-v6",
        model_revision="deterministic",
        schema_version="aisha-calibration-v1",
        source_count=1,
        generated_item_count=1,
        user_id=actor_user_id,
        sample_kind=RELEASE_EVALUATION_SAMPLE_KIND,
        suite_version=result.suite_version,
        case_id=result.case_id,
        release_revision=current_release_revision(),
    )
    return result


def release_evaluation_summary(results: list[ReleaseCaseResult]) -> dict[str, Any]:
    return {
        "samples": len(results),
        "passed": sum(result.passed for result in results),
        "failed": sum(not result.passed for result in results),
        "pass_rate": round((sum(result.passed for result in results) / len(results)) * 100, 1) if results else 0.0,
        "cases": [result.as_dict() for result in results],
    }
