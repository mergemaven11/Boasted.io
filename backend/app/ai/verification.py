"""Internal quality telemetry for BragStack smart features.

Only aggregate/sanitized verification metadata is stored here. Resume text,
job descriptions, private evidence, model prompts, and model output bodies are
intentionally excluded from the verification event collection.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
import os
from typing import Iterable

from pymongo.errors import PyMongoError

from app.database import ai_verification_events_collection

VERIFICATION_SCHEMA_VERSION = "ai-verification-v2"
RELEASE_EVALUATION_SAMPLE_KIND = "release_evaluation"
RUNTIME_SAMPLE_KIND = "runtime"
SMART_FEATURES = (
    "resume_builder",
    "career_intelligence",
    "education_intelligence",
    "interview_practice",
    "compliance_intelligence",
    "evidence_assistant",
)

# Open-signup safety policy. A feature can be useful below these thresholds in
# internal testing, but it is not considered verified for open customer access.
RELEASE_THRESHOLDS = {
    "resume_builder": {
        "minimum_samples": 20,
        "minimum_pass_rate": 1.0,
        "maximum_unsupported_numeric_claims": 0,
        "maximum_provenance_failures": 0,
        "maximum_fabrication_failures": 0,
    },
}


def current_release_revision() -> str:
    """Return the deployed source revision used to scope release evaluations."""
    return (
        os.getenv("RENDER_GIT_COMMIT")
        or os.getenv("GIT_SHA")
        or os.getenv("SOURCE_VERSION")
        or "local"
    ).strip()[:80]


def record_verification_event(
    *,
    feature: str,
    task: str,
    passed: bool,
    violation_codes: Iterable[str] = (),
    provider: str = "deterministic",
    model_id: str = "",
    model_revision: str = "",
    prompt_version: str = "",
    schema_version: str = "",
    source_count: int = 0,
    generated_item_count: int = 0,
    user_id: str = "",
    sample_kind: str = RUNTIME_SAMPLE_KIND,
    suite_version: str = "",
    case_id: str = "",
    release_revision: str = "",
) -> bool:
    """Persist privacy-safe verification metadata without blocking the feature.

    Runtime telemetry is append-only. Release-evaluation cases are idempotent for
    one deployed revision so repeatedly running the same suite cannot inflate a
    feature's sample count or game a minimum-sample gate.
    """
    normalized_codes = sorted({str(code).strip()[:120] for code in violation_codes if str(code).strip()})
    normalized_sample_kind = str(sample_kind or RUNTIME_SAMPLE_KIND).strip()[:40]
    normalized_suite = str(suite_version or "").strip()[:120]
    normalized_case = str(case_id or "").strip()[:120]
    normalized_revision = str(release_revision or "").strip()[:80]
    if normalized_sample_kind == RELEASE_EVALUATION_SAMPLE_KIND and not normalized_revision:
        normalized_revision = current_release_revision()

    document = {
        "verification_schema_version": VERIFICATION_SCHEMA_VERSION,
        "feature": str(feature).strip()[:80],
        "task": str(task).strip()[:120],
        "passed": bool(passed),
        "violation_codes": normalized_codes,
        "provider": str(provider).strip()[:120],
        "model_id": str(model_id).strip()[:160],
        "model_revision": str(model_revision).strip()[:160],
        "prompt_version": str(prompt_version).strip()[:120],
        "schema_version": str(schema_version).strip()[:120],
        "source_count": max(0, int(source_count)),
        "generated_item_count": max(0, int(generated_item_count)),
        "sample_kind": normalized_sample_kind,
        "suite_version": normalized_suite,
        "case_id": normalized_case,
        "release_revision": normalized_revision,
        # User ID is retained only for deduplicating repeated internal runs;
        # no email, name, resume text, evidence text, or output text is stored.
        "user_id": str(user_id).strip()[:64],
        "created_at": datetime.now(timezone.utc),
    }

    try:
        if normalized_sample_kind == RELEASE_EVALUATION_SAMPLE_KIND:
            if not normalized_suite or not normalized_case:
                return False
            ai_verification_events_collection.replace_one(
                {
                    "feature": document["feature"],
                    "sample_kind": RELEASE_EVALUATION_SAMPLE_KIND,
                    "suite_version": normalized_suite,
                    "case_id": normalized_case,
                    "release_revision": normalized_revision,
                },
                document,
                upsert=True,
            )
        else:
            ai_verification_events_collection.insert_one(document)
        return True
    except PyMongoError:
        return False


def _percentage(numerator: int, denominator: int) -> float:
    return round((numerator / denominator) * 100, 1) if denominator else 0.0


def _effective_events(events: list[dict], release_revision: str) -> list[dict]:
    """Exclude stale release-evaluation samples from previous deployments."""
    return [
        event
        for event in events
        if event.get("sample_kind") != RELEASE_EVALUATION_SAMPLE_KIND
        or str(event.get("release_revision") or "") == release_revision
    ]


def _is_compliance_advisory(event: dict) -> bool:
    """Legacy compliance gap codes describe business posture, not engine defects."""
    if event.get("feature") != "compliance_intelligence":
        return False
    codes = [str(code) for code in (event.get("violation_codes") or [])]
    return bool(codes) and all(code.startswith("compliance:") for code in codes)


def _event_passed(event: dict) -> bool:
    """Return verification pass/fail while preserving legacy compliance advisories."""
    return bool(event.get("passed")) or _is_compliance_advisory(event)


def build_verification_summary(*, days: int = 30) -> dict:
    """Aggregate smart-feature quality metrics for the internal dashboard."""
    days = max(1, min(int(days), 365))
    since = datetime.now(timezone.utc) - timedelta(days=days)
    release_revision = current_release_revision()
    queried_events = list(
        ai_verification_events_collection.find(
            {"created_at": {"$gte": since}},
            {
                "_id": 0,
                "feature": 1,
                "task": 1,
                "passed": 1,
                "violation_codes": 1,
                "provider": 1,
                "model_id": 1,
                "model_revision": 1,
                "sample_kind": 1,
                "suite_version": 1,
                "case_id": 1,
                "release_revision": 1,
                "created_at": 1,
            },
        ).sort("created_at", -1).limit(10000)
    )
    events = _effective_events(queried_events, release_revision)

    by_feature: dict[str, dict] = {}
    grouped: dict[str, list[dict]] = defaultdict(list)
    for event in events:
        grouped[str(event.get("feature") or "unknown")].append(event)

    for feature in SMART_FEATURES:
        feature_events = grouped.get(feature, [])
        failures = [event for event in feature_events if not _event_passed(event)]
        advisories = [
            code
            for event in feature_events
            if _is_compliance_advisory(event)
            for code in (event.get("violation_codes") or [])
        ]
        violations = Counter(
            code
            for event in failures
            for code in (event.get("violation_codes") or [])
        )
        runtime_samples = sum(
            event.get("sample_kind", RUNTIME_SAMPLE_KIND) != RELEASE_EVALUATION_SAMPLE_KIND
            for event in feature_events
        )
        evaluation_samples = len(feature_events) - runtime_samples
        by_feature[feature] = {
            "samples": len(feature_events),
            "passed": len(feature_events) - len(failures),
            "failed": len(failures),
            "pass_rate": _percentage(len(feature_events) - len(failures), len(feature_events)),
            "runtime_samples": runtime_samples,
            "evaluation_samples": evaluation_samples,
            "advisory_count": len(advisories),
            "top_error_codes": [
                {"code": code, "count": count} for code, count in violations.most_common(8)
            ],
            "instrumented": bool(feature_events),
        }

    resume = by_feature["resume_builder"]
    resume_threshold = RELEASE_THRESHOLDS["resume_builder"]
    resume_failures = [
        event for event in grouped.get("resume_builder", [])
        if not _event_passed(event)
    ]
    resume_errors = Counter(
        code
        for event in resume_failures
        for code in (event.get("violation_codes") or [])
    )
    resume_gate_checks = {
        "minimum_samples": resume["samples"] >= resume_threshold["minimum_samples"],
        "pass_rate": (resume["pass_rate"] / 100.0) >= resume_threshold["minimum_pass_rate"] if resume["samples"] else False,
        "unsupported_numeric_claims": resume_errors.get("unsupported_numeric_claim", 0) <= resume_threshold["maximum_unsupported_numeric_claims"],
        "provenance_failures": (
            resume_errors.get("missing_provenance", 0)
            + resume_errors.get("unknown_evidence_id", 0)
            + resume_errors.get("invalid_source_receipt", 0)
        ) <= resume_threshold["maximum_provenance_failures"],
        "fabrication_failures": (
            resume_errors.get("unsupported_high_risk_language", 0)
            + resume_errors.get("unsupported_skill", 0)
            + resume_errors.get("generated_summary_without_evidence", 0)
            + resume_errors.get("target_role_presented_as_fact", 0)
        ) <= resume_threshold["maximum_fabrication_failures"],
    }

    recent_failures = []
    for event in events:
        if _event_passed(event):
            continue
        recent_failures.append(
            {
                "feature": event.get("feature", "unknown"),
                "task": event.get("task", "unknown"),
                "violation_codes": event.get("violation_codes", []),
                "provider": event.get("provider", ""),
                "model_id": event.get("model_id", ""),
                "model_revision": event.get("model_revision", ""),
                "sample_kind": event.get("sample_kind", RUNTIME_SAMPLE_KIND),
                "suite_version": event.get("suite_version", ""),
                "case_id": event.get("case_id", ""),
                "created_at": event.get("created_at"),
            }
        )
        if len(recent_failures) >= 25:
            break

    return {
        "window_days": days,
        "total_events": len(events),
        "current_release_revision": release_revision,
        "stale_release_evaluations_ignored": len(queried_events) - len(events),
        "features": by_feature,
        "release_gate": {
            "resume_builder": {
                "ready": all(resume_gate_checks.values()),
                "checks": resume_gate_checks,
                "thresholds": resume_threshold,
            }
        },
        "recent_failures": recent_failures,
        "privacy": {
            "stores_resume_text": False,
            "stores_job_description": False,
            "stores_private_evidence": False,
            "stores_generated_output": False,
            "stored_data": "quality metadata, model/version identifiers, counts, and violation codes only",
        },
    }
