"""Regression coverage for the expanded Aisha and compliance release suites."""
from __future__ import annotations

import mongomock

import app.ai.verification as verification
from app.ai.expanded_release_evaluation import (
    AISHA_CASE_RULES,
    AISHA_RELEASE_SUITE_VERSION,
    COMPLIANCE_CASES,
    COMPLIANCE_RELEASE_SUITE_VERSION,
    EXPECTED_COMPLIANCE_CONTROL_IDS,
    evaluate_aisha_release_case,
    run_compliance_release_evaluation,
)
from app.compliance_routes import _summary, evaluate_controls


def _collection(monkeypatch):
    collection = mongomock.MongoClient()["test"]["ai_verification_events"]
    monkeypatch.setattr(verification, "ai_verification_events_collection", collection)
    monkeypatch.setenv("GIT_SHA", "expanded-release-test-sha")
    monkeypatch.delenv("RENDER_GIT_COMMIT", raising=False)
    return collection


def _metrics_for_rule(rule: dict) -> dict:
    dimensions = {
        "relevance": 70,
        "structure": 70,
        "ownership": 70,
        "specificity": 70,
        "impact": 70,
        "communication": 70,
    }
    if "all_dimensions_max" in rule:
        dimensions = {name: int(rule["all_dimensions_max"]) for name in dimensions}
    for name, minimum in (rule.get("dimension_min") or {}).items():
        dimensions[name] = int(minimum)
    for name, maximum in (rule.get("dimension_max") or {}).items():
        dimensions[name] = min(dimensions.get(name, int(maximum)), int(maximum))

    if "overall_min" in rule:
        overall = int(rule["overall_min"])
    elif "overall_max" in rule:
        overall = min(40, int(rule["overall_max"]))
    else:
        overall = 60

    metrics = {
        "overall_score": overall,
        "dimensions": dimensions,
        "action_found": bool(rule.get("action_found", True)),
        "result_found": bool(rule.get("result_found", True)),
        "quantified": bool(rule.get("quantified", False)),
        "warning_triggered": bool(rule.get("warning_triggered", False)),
        "word_count": int(rule.get("word_count_min", 40)),
        "filler_count": int(rule.get("filler_count_min", 0)),
        "has_strong_areas": bool(rule.get("has_strong_areas", True)),
        "strongest_area_count": int(rule.get("strongest_area_count", rule.get("strongest_area_count_min", 2))),
        "improvement_area_count": int(rule.get("improvement_area_count", 2)),
        "weak_answer_count": int(rule.get("weak_answer_count_min", 0)),
        "quantified_answer_count": int(rule.get("quantified_answer_count", 0)),
        "result_answer_count": int(rule.get("result_answer_count_min", 3)),
    }
    if "word_count_max" in rule:
        metrics["word_count"] = min(metrics["word_count"], int(rule["word_count_max"]))
    if "weak_answer_count_max" in rule:
        metrics["weak_answer_count"] = min(metrics["weak_answer_count"], int(rule["weak_answer_count_max"]))
    if "strong_dimension_count_min" in rule:
        threshold = int(rule["strong_dimension_min"])
        needed = int(rule["strong_dimension_count_min"])
        for name in list(dimensions)[:needed]:
            dimensions[name] = max(dimensions[name], threshold)
    return metrics


def test_expanded_compliance_suite_runs_32_semantic_cases_and_is_idempotent(monkeypatch):
    collection = _collection(monkeypatch)

    first = run_compliance_release_evaluation(actor_user_id="ops-user")
    assert COMPLIANCE_RELEASE_SUITE_VERSION == "compliance-release-eval-v2-32"
    assert len(first) == 32
    assert len(COMPLIANCE_CASES) == 32
    assert all(result.passed for result in first)
    assert collection.count_documents({"feature": "compliance_intelligence"}) == 32

    second = run_compliance_release_evaluation(actor_user_id="ops-user")
    assert len(second) == 32
    assert all(result.passed for result in second)
    assert collection.count_documents({"feature": "compliance_intelligence"}) == 32

    summary = verification.build_verification_summary(days=30)
    compliance = summary["features"]["compliance_intelligence"]
    assert compliance["samples"] == 32
    assert compliance["evaluation_samples"] == 32
    assert compliance["runtime_samples"] == 0
    assert compliance["failed"] == 0
    assert compliance["pass_rate"] == 100.0


def test_compliance_suite_covers_every_control_and_high_risk_posture():
    assert len(EXPECTED_COMPLIANCE_CONTROL_IDS) == 14
    case_map = dict(COMPLIANCE_CASES)

    for case_id, facts in COMPLIANCE_CASES:
        findings = evaluate_controls(facts)
        assert {item["control_id"] for item in findings} == EXPECTED_COMPLIANCE_CONTROL_IDS, case_id

    employer_summary = _summary(evaluate_controls(case_map["employer-ai-enabled"]))
    assert employer_summary["overall"] == "critical_actions"
    assert "AI-EMPLOYMENT-001" in employer_summary["blockers"]
    assert employer_summary["beta_posture"] == "continue_beta"

    investment_summary = _summary(evaluate_controls(case_map["investment-no-entity"]))
    assert investment_summary["overall"] == "critical_actions"
    assert "FUND-SEC-001" in investment_summary["blockers"]

    paid_summary = _summary(evaluate_controls(case_map["paid-five-unverified"]))
    assert paid_summary["paid_launch_posture"] == "pause_new_paid_checkout"

    verified_paid_summary = _summary(evaluate_controls(case_map["operations-verified-paid"]))
    assert verified_paid_summary["paid_launch_posture"] == "verified"


def test_aisha_server_validator_covers_all_32_sanitized_cases():
    assert AISHA_RELEASE_SUITE_VERSION == "aisha-calibration-v2-32"
    assert len(AISHA_CASE_RULES) == 32

    results = [
        evaluate_aisha_release_case(case_id, _metrics_for_rule(rule))
        for case_id, rule in AISHA_CASE_RULES.items()
    ]
    failures = {result.case_id: result.violation_codes for result in results if not result.passed}
    assert failures == {}


def test_aisha_server_validator_rejects_regressions_in_strong_and_weak_cases():
    strong = _metrics_for_rule(AISHA_CASE_RULES["strong-star"])
    strong["overall_score"] = 20
    strong["action_found"] = False
    strong_result = evaluate_aisha_release_case("strong-star", strong)
    assert strong_result.passed is False
    assert "aisha_eval:overall_too_low" in strong_result.violation_codes
    assert "aisha_eval:action_found_mismatch" in strong_result.violation_codes

    weak = _metrics_for_rule(AISHA_CASE_RULES["vague-all-red"])
    weak["overall_score"] = 90
    weak["dimensions"]["impact"] = 90
    weak_result = evaluate_aisha_release_case("vague-all-red", weak)
    assert weak_result.passed is False
    assert "aisha_eval:overall_too_high" in weak_result.violation_codes
    assert "aisha_eval:weak_dimensions_not_calibrated" in weak_result.violation_codes
