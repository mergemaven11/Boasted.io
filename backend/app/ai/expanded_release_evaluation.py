"""Expanded deterministic release suites for Aisha and Compliance Intelligence.

The cases are intentionally synthetic and sanitized. Only case identifiers,
score/signals, and pass/fail metadata are persisted by the verification layer.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any

from app.ai.release_evaluation import ReleaseCaseResult
from app.ai.verification import (
    RELEASE_EVALUATION_SAMPLE_KIND,
    current_release_revision,
    record_verification_event,
)
from app.compliance_routes import STATUS_ORDER, SEVERITY_ORDER, _summary, evaluate_controls

COMPLIANCE_RELEASE_SUITE_VERSION = "compliance-release-eval-v2-32"
AISHA_RELEASE_SUITE_VERSION = "aisha-calibration-v2-32"

EXPECTED_COMPLIANCE_CONTROL_IDS = {
    "BUS-CORP-001",
    "BUS-TAX-001",
    "PRIV-CONSENT-001",
    "BILL-GA-001",
    "LEGAL-PACKAGE-001",
    "PRIV-VENDOR-001",
    "PRIV-RETENTION-001",
    "GOV-DRIVE-001",
    "MKT-EMAIL-001",
    "MKT-CLAIMS-001",
    "MINORS-COPPA-001",
    "AI-GA-2027-001",
    "AI-EMPLOYMENT-001",
    "FUND-SEC-001",
}


def _all_verified_facts() -> dict[str, Any]:
    return {
        "total_users": 20,
        "users_with_terms_acceptance": 20,
        "users_with_privacy_acknowledgement": 20,
        "paid_recurring_subscribers": 0,
        "persisted_pro_accounts": 0,
        "temporary_pro_gift_enabled": False,
        "legal_entity_formed": True,
        "ein_obtained": True,
        "customer_legal_package_counsel_reviewed": True,
        "georgia_renewal_flow_production_verified": True,
        "vendor_inventory_verified": True,
        "retention_jobs_verified": True,
        "drive_compliance_evidence_verified": True,
        "commercial_email_controls_verified": True,
        "marketing_claim_review_verified": True,
        "accepting_investment": False,
        "employer_facing_ai_decisions_enabled": False,
    }


def _facts(base: dict[str, Any] | None = None, **updates: Any) -> dict[str, Any]:
    result = deepcopy(base or {})
    result.update(updates)
    return result


_ALL_VERIFIED = _all_verified_facts()

COMPLIANCE_CASES: tuple[tuple[str, dict[str, Any]], ...] = (
    ("empty-beta", {}),
    ("one-user-no-consent", {"total_users": 1}),
    ("terms-only", {"total_users": 10, "users_with_terms_acceptance": 10}),
    ("privacy-only", {"total_users": 10, "users_with_privacy_acknowledgement": 10}),
    ("partial-consent", {"total_users": 10, "users_with_terms_acceptance": 9, "users_with_privacy_acknowledgement": 8}),
    ("all-consented", {"total_users": 10, "users_with_terms_acceptance": 10, "users_with_privacy_acknowledgement": 10}),
    ("consent-counts-over-total", {"total_users": 5, "users_with_terms_acceptance": 6, "users_with_privacy_acknowledgement": 5}),
    ("paid-one-unverified", {"paid_recurring_subscribers": 1, "persisted_pro_accounts": 1}),
    ("paid-five-unverified", {"paid_recurring_subscribers": 5, "persisted_pro_accounts": 5}),
    ("gift-pro-no-paid", {"temporary_pro_gift_enabled": True, "persisted_pro_accounts": 12}),
    ("renewal-verified-no-paid", {"georgia_renewal_flow_production_verified": True}),
    ("renewal-verified-paid-one", {"georgia_renewal_flow_production_verified": True, "paid_recurring_subscribers": 1, "persisted_pro_accounts": 1}),
    ("renewal-verified-paid-five", {"georgia_renewal_flow_production_verified": True, "paid_recurring_subscribers": 5, "persisted_pro_accounts": 5}),
    ("entity-only", {"legal_entity_formed": True}),
    ("ein-only", {"ein_obtained": True}),
    ("entity-and-ein", {"legal_entity_formed": True, "ein_obtained": True}),
    ("legal-package-reviewed", {"customer_legal_package_counsel_reviewed": True}),
    ("vendor-inventory-verified", {"vendor_inventory_verified": True}),
    ("retention-verified", {"retention_jobs_verified": True}),
    ("drive-evidence-verified", {"drive_compliance_evidence_verified": True}),
    ("email-controls-verified", {"commercial_email_controls_verified": True}),
    ("marketing-claims-verified", {"marketing_claim_review_verified": True}),
    ("employer-ai-enabled", {"employer_facing_ai_decisions_enabled": True}),
    ("employer-ai-enabled-otherwise-verified", _facts(_ALL_VERIFIED, employer_facing_ai_decisions_enabled=True)),
    ("investment-no-entity", {"accepting_investment": True, "legal_entity_formed": False}),
    ("investment-with-entity", {"accepting_investment": True, "legal_entity_formed": True}),
    ("paid-and-investment-no-entity", {"paid_recurring_subscribers": 2, "persisted_pro_accounts": 2, "accepting_investment": True}),
    ("operations-verified", _facts(_ALL_VERIFIED)),
    ("operations-verified-paid", _facts(_ALL_VERIFIED, paid_recurring_subscribers=3, persisted_pro_accounts=3)),
    ("operations-verified-paid-employer-ai", _facts(_ALL_VERIFIED, paid_recurring_subscribers=3, persisted_pro_accounts=3, employer_facing_ai_decisions_enabled=True)),
    ("operations-verified-partial-consent", _facts(_ALL_VERIFIED, total_users=20, users_with_terms_acceptance=19, users_with_privacy_acknowledgement=18)),
    ("operations-verified-investment", _facts(_ALL_VERIFIED, accepting_investment=True)),
)


def _expected_compliance_statuses(facts: dict[str, Any]) -> dict[str, str]:
    total_users = int(facts.get("total_users") or 0)
    terms_users = int(facts.get("users_with_terms_acceptance") or 0)
    privacy_users = int(facts.get("users_with_privacy_acknowledgement") or 0)
    consent_complete = total_users > 0 and max(total_users - min(terms_users, privacy_users), 0) == 0
    renewal_verified = bool(facts.get("georgia_renewal_flow_production_verified"))
    paid = int(facts.get("paid_recurring_subscribers") or 0)
    entity = bool(facts.get("legal_entity_formed"))
    employer_ai = bool(facts.get("employer_facing_ai_decisions_enabled"))
    accepting_investment = bool(facts.get("accepting_investment"))
    return {
        "BUS-CORP-001": "pass" if entity else "gap",
        "BUS-TAX-001": "pass" if facts.get("ein_obtained") else "needs_evidence",
        "PRIV-CONSENT-001": "pass" if consent_complete else "needs_evidence",
        "BILL-GA-001": "pass" if renewal_verified else ("gap" if paid > 0 else "needs_evidence"),
        "LEGAL-PACKAGE-001": "pass" if facts.get("customer_legal_package_counsel_reviewed") else "counsel_review",
        "PRIV-VENDOR-001": "pass" if facts.get("vendor_inventory_verified") else "needs_evidence",
        "PRIV-RETENTION-001": "pass" if facts.get("retention_jobs_verified") else "needs_evidence",
        "GOV-DRIVE-001": "pass" if facts.get("drive_compliance_evidence_verified") else "needs_evidence",
        "MKT-EMAIL-001": "pass" if facts.get("commercial_email_controls_verified") else "needs_evidence",
        "MKT-CLAIMS-001": "pass" if facts.get("marketing_claim_review_verified") else "needs_evidence",
        "MINORS-COPPA-001": "counsel_review",
        "AI-GA-2027-001": "upcoming",
        "AI-EMPLOYMENT-001": "gap" if employer_ai else "not_applicable",
        "FUND-SEC-001": "gap" if accepting_investment and not entity else "counsel_review",
    }


def _expected_summary(facts: dict[str, Any]) -> dict[str, Any]:
    paid = int(facts.get("paid_recurring_subscribers") or 0)
    renewal_verified = bool(facts.get("georgia_renewal_flow_production_verified"))
    employer_ai = bool(facts.get("employer_facing_ai_decisions_enabled"))
    investment_without_entity = bool(facts.get("accepting_investment")) and not bool(facts.get("legal_entity_formed"))
    blockers = []
    if employer_ai:
        blockers.append("AI-EMPLOYMENT-001")
    if investment_without_entity:
        blockers.append("FUND-SEC-001")
    return {
        "overall": "critical_actions" if blockers else "action_required",
        "beta_posture": "continue_beta",
        "paid_launch_posture": "verified" if renewal_verified else ("pause_new_paid_checkout" if paid > 0 else "verify_before_paid_launch"),
        "fundraising_posture": "hold_until_legal_ready",
        "blockers": blockers,
    }


def _verify_compliance_fixture(facts: dict[str, Any]) -> tuple[str, ...]:
    findings = evaluate_controls(facts)
    summary = _summary(findings)
    violations: list[str] = []
    valid_statuses = set(STATUS_ORDER)
    valid_severities = set(SEVERITY_ORDER)
    ids = [str(item.get("control_id") or "") for item in findings]

    if set(ids) != EXPECTED_COMPLIANCE_CONTROL_IDS or len(ids) != len(EXPECTED_COMPLIANCE_CONTROL_IDS):
        violations.append("compliance_eval:control_catalog_mismatch")
    if len(ids) != len(set(ids)):
        violations.append("compliance_eval:duplicate_control_id")
    if any(item.get("status") not in valid_statuses for item in findings):
        violations.append("compliance_eval:status_invalid")
    if any(item.get("severity") not in valid_severities for item in findings):
        violations.append("compliance_eval:severity_invalid")
    if sum((summary.get("by_status") or {}).values()) != len(findings):
        violations.append("compliance_eval:status_counts_mismatch")
    if sum((summary.get("by_severity") or {}).values()) != len(findings):
        violations.append("compliance_eval:severity_counts_mismatch")

    by_id = {item["control_id"]: item for item in findings if item.get("control_id")}
    for control_id, expected_status in _expected_compliance_statuses(facts).items():
        observed = (by_id.get(control_id) or {}).get("status")
        if observed != expected_status:
            violations.append(f"compliance_eval:{control_id}:expected_{expected_status}:got_{observed}")

    expected_summary = _expected_summary(facts)
    for key in ("overall", "beta_posture", "paid_launch_posture", "fundraising_posture"):
        if summary.get(key) != expected_summary[key]:
            violations.append(f"compliance_eval:{key}_mismatch")
    if sorted(summary.get("blockers") or []) != sorted(expected_summary["blockers"]):
        violations.append("compliance_eval:blockers_mismatch")

    for item in findings:
        if not str(item.get("title") or "").strip() or not str(item.get("summary") or "").strip() or not str(item.get("next_action") or "").strip():
            violations.append("compliance_eval:finding_content_missing")
            break
        if not isinstance(item.get("evidence"), list) or not item.get("evidence"):
            violations.append("compliance_eval:evidence_shape_invalid")
            break
        if not isinstance(item.get("sources"), list):
            violations.append("compliance_eval:sources_shape_invalid")
            break
    return tuple(sorted(set(violations)))


def run_compliance_release_evaluation(*, actor_user_id: str = "") -> list[ReleaseCaseResult]:
    """Run 32 semantic + structural Compliance Intelligence fixtures."""
    revision = current_release_revision()
    results: list[ReleaseCaseResult] = []
    for case_id, facts in COMPLIANCE_CASES:
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
            schema_version="compliance-release-eval-v2",
            source_count=len(facts),
            generated_item_count=len(EXPECTED_COMPLIANCE_CONTROL_IDS),
            user_id=actor_user_id,
            sample_kind=RELEASE_EVALUATION_SAMPLE_KIND,
            suite_version=result.suite_version,
            case_id=result.case_id,
            release_revision=revision,
        )
    return results


AISHA_CASE_RULES: dict[str, dict[str, Any]] = {
    "vague-all-red": {"overall_max": 54, "all_dimensions_max": 54},
    "ownership-no-credit": {"dimension_max": {"ownership": 20}, "action_found": False},
    "short-answer-low-score": {"overall_max": 25, "word_count_max": 4},
    "team-credit-only": {"overall_max": 45, "dimension_max": {"ownership": 20}, "action_found": False},
    "context-no-action": {"overall_max": 45, "action_found": False, "result_found": False},
    "action-no-result": {"overall_max": 60, "dimension_max": {"impact": 5}, "action_found": True, "result_found": False},
    "result-no-action": {"overall_max": 60, "action_found": False, "result_found": True},
    "off-topic": {"overall_max": 60, "dimension_max": {"relevance": 54}},
    "filler-heavy": {"filler_count_min": 6, "dimension_max": {"communication": 70}, "action_found": True, "result_found": True},
    "profanity-coaching": {"warning_triggered": True, "dimension_max": {"communication": 70}},
    "truthful-impact-no-metric": {"dimension_min": {"impact": 70}, "quantified": False, "result_found": True},
    "quantified-but-thin": {"overall_max": 25, "quantified": True, "action_found": True, "result_found": True},
    "concise-complete": {"overall_min": 55, "action_found": True, "result_found": True},
    "customer-handoff-no-number": {"overall_min": 55, "dimension_min": {"impact": 70}, "quantified": False, "action_found": True, "result_found": True},
    "learning-example": {"overall_min": 55, "action_found": True, "result_found": True},
    "entry-project": {"overall_min": 55, "action_found": True, "result_found": True},
    "strong-star": {"overall_min": 65, "strong_dimension_min": 70, "strong_dimension_count_min": 4, "action_found": True, "result_found": True},
    "strong-platform": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-support": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-data": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-project": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-security": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-ux": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-teacher": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-nurse": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-sales": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-accounting": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "strong-leadership": {"overall_min": 55, "dimension_min": {"impact": 70}, "action_found": True, "result_found": True},
    "weak-session-summary": {"overall_max": 54, "has_strong_areas": False, "strongest_area_count": 0, "improvement_area_count": 6, "weak_answer_count_min": 3},
    "strong-session-summary": {"overall_min": 60, "has_strong_areas": True, "strongest_area_count_min": 1, "improvement_area_count": 2, "weak_answer_count_max": 0},
    "mixed-session-summary": {"overall_min": 35, "overall_max": 75, "weak_answer_count_min": 1},
    "no-metric-session-summary": {"overall_min": 55, "quantified_answer_count": 0, "result_answer_count_min": 3},
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
        for name, minimum in (rule.get("dimension_min") or {}).items():
            if int(dimensions.get(name, -1)) < int(minimum):
                violations.append(f"aisha_eval:{name}_under_min")
        for name, maximum in (rule.get("dimension_max") or {}).items():
            if int(dimensions.get(name, 101)) > int(maximum):
                violations.append(f"aisha_eval:{name}_over_max")
        if "strong_dimension_count_min" in rule:
            minimum = int(rule["strong_dimension_min"])
            count = sum(int(value) >= minimum for value in dimensions.values())
            if count < int(rule["strong_dimension_count_min"]):
                violations.append("aisha_eval:strong_dimensions_missing")

        bool_checks = ("action_found", "result_found", "quantified", "warning_triggered", "has_strong_areas")
        for key in bool_checks:
            if key in rule and bool(metrics.get(key)) is not bool(rule[key]):
                violations.append(f"aisha_eval:{key}_mismatch")

        exact_int_checks = (
            "strongest_area_count",
            "improvement_area_count",
            "quantified_answer_count",
        )
        for key in exact_int_checks:
            if key in rule and int(metrics.get(key, -1)) != int(rule[key]):
                violations.append(f"aisha_eval:{key}_mismatch")

        minimum_checks = {
            "word_count_min": "word_count",
            "filler_count_min": "filler_count",
            "strongest_area_count_min": "strongest_area_count",
            "weak_answer_count_min": "weak_answer_count",
            "result_answer_count_min": "result_answer_count",
        }
        maximum_checks = {
            "word_count_max": "word_count",
            "weak_answer_count_max": "weak_answer_count",
        }
        for rule_key, metric_key in minimum_checks.items():
            if rule_key in rule and int(metrics.get(metric_key, -1)) < int(rule[rule_key]):
                violations.append(f"aisha_eval:{metric_key}_below_min")
        for rule_key, metric_key in maximum_checks.items():
            if rule_key in rule and int(metrics.get(metric_key, 10**9)) > int(rule[rule_key]):
                violations.append(f"aisha_eval:{metric_key}_above_max")

    return ReleaseCaseResult(
        feature="interview_practice",
        case_id=case_id,
        passed=not violations,
        violation_codes=tuple(sorted(set(violations))),
        suite_version=AISHA_RELEASE_SUITE_VERSION,
    )


def record_aisha_release_case(*, case_id: str, metrics: dict[str, Any], actor_user_id: str = "") -> ReleaseCaseResult:
    result = evaluate_aisha_release_case(case_id, metrics)
    record_verification_event(
        feature=result.feature,
        task="release_evaluation",
        passed=result.passed,
        violation_codes=result.violation_codes,
        provider="deterministic-browser",
        model_id="aisha-jordan-interview-v7",
        model_revision="deterministic",
        schema_version="aisha-calibration-v2",
        source_count=1,
        generated_item_count=1,
        user_id=actor_user_id,
        sample_kind=RELEASE_EVALUATION_SAMPLE_KIND,
        suite_version=result.suite_version,
        case_id=result.case_id,
        release_revision=current_release_revision(),
    )
    return result
