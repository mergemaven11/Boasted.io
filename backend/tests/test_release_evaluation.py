"""Release-evaluation regression tests for the internal verification dashboard."""
from __future__ import annotations

from datetime import datetime, timezone

import mongomock

import app.ai.verification as verification
from app.ai.release_evaluation import (
    AISHA_CASE_RULES,
    evaluate_aisha_release_case,
    run_compliance_release_evaluation,
    run_resume_release_evaluation,
)


def _collection(monkeypatch):
    collection = mongomock.MongoClient()["test"]["ai_verification_events"]
    monkeypatch.setattr(verification, "ai_verification_events_collection", collection)
    monkeypatch.setenv("GIT_SHA", "release-test-sha")
    monkeypatch.delenv("RENDER_GIT_COMMIT", raising=False)
    return collection


def test_resume_release_evaluation_passes_twenty_real_guard_cases_and_is_idempotent(monkeypatch):
    collection = _collection(monkeypatch)

    first = run_resume_release_evaluation(actor_user_id="ops-user")
    assert len(first) == 20
    assert all(result.passed for result in first)
    assert collection.count_documents({"feature": "resume_builder"}) == 20

    second = run_resume_release_evaluation(actor_user_id="ops-user")
    assert len(second) == 20
    assert all(result.passed for result in second)
    assert collection.count_documents({"feature": "resume_builder"}) == 20

    summary = verification.build_verification_summary(days=30)
    resume = summary["features"]["resume_builder"]
    assert resume["samples"] == 20
    assert resume["evaluation_samples"] == 20
    assert resume["runtime_samples"] == 0
    assert resume["failed"] == 0
    assert summary["release_gate"]["resume_builder"]["ready"] is True


def test_stale_release_evaluations_do_not_satisfy_current_release_gate(monkeypatch):
    collection = _collection(monkeypatch)
    now = datetime.now(timezone.utc)
    for index in range(20):
        collection.insert_one({
            "feature": "resume_builder",
            "task": "release_evaluation",
            "passed": True,
            "violation_codes": [],
            "sample_kind": "release_evaluation",
            "suite_version": "resume-release-eval-v1",
            "case_id": f"old-{index}",
            "release_revision": "previous-release",
            "created_at": now,
        })

    summary = verification.build_verification_summary(days=30)
    assert summary["features"]["resume_builder"]["samples"] == 0
    assert summary["stale_release_evaluations_ignored"] == 20
    assert summary["release_gate"]["resume_builder"]["ready"] is False


def test_compliance_release_evaluation_verifies_engine_without_calling_business_gaps_failures(monkeypatch):
    _collection(monkeypatch)

    results = run_compliance_release_evaluation(actor_user_id="ops-user")
    assert len(results) == 5
    assert all(result.passed for result in results)

    summary = verification.build_verification_summary(days=30)
    compliance = summary["features"]["compliance_intelligence"]
    assert compliance["samples"] == 5
    assert compliance["failed"] == 0
    assert compliance["pass_rate"] == 100.0


def test_legacy_compliance_gap_events_are_advisories_not_engine_failures(monkeypatch):
    collection = _collection(monkeypatch)
    collection.insert_one({
        "feature": "compliance_intelligence",
        "task": "whole_business_audit",
        "passed": False,
        "violation_codes": ["compliance:BUS-CORP-001:gap", "compliance:LEGAL-PACKAGE-001:counsel_review"],
        "created_at": datetime.now(timezone.utc),
    })

    summary = verification.build_verification_summary(days=30)
    compliance = summary["features"]["compliance_intelligence"]
    assert compliance["samples"] == 1
    assert compliance["passed"] == 1
    assert compliance["failed"] == 0
    assert compliance["advisory_count"] == 2
    assert summary["recent_failures"] == []


def test_aisha_release_rules_validate_only_sanitized_engine_metrics():
    cases = {
        "vague-all-red": {
            "overall_score": 30,
            "dimensions": {name: 30 for name in ("relevance", "structure", "ownership", "specificity", "impact", "communication")},
        },
        "ownership-no-credit": {
            "overall_score": 20,
            "dimensions": {"ownership": 20},
            "action_found": False,
        },
        "short-answer-low-score": {"overall_score": 25, "dimensions": {}},
        "strong-star": {
            "overall_score": 70,
            "dimensions": {"relevance": 75, "structure": 72, "ownership": 74, "specificity": 71, "impact": 60, "communication": 60},
            "action_found": True,
            "result_found": True,
        },
        "truthful-impact-no-metric": {
            "overall_score": 70,
            "dimensions": {"impact": 72},
            "quantified": False,
            "result_found": True,
        },
        "weak-session-summary": {
            "overall_score": 40,
            "has_strong_areas": False,
            "strongest_area_count": 0,
            "improvement_area_count": 6,
        },
    }
    assert set(cases) == set(AISHA_CASE_RULES)
    results = [evaluate_aisha_release_case(case_id, metrics) for case_id, metrics in cases.items()]
    assert all(result.passed for result in results)
