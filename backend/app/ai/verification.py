"""Internal quality telemetry for BragStack smart features.

Only aggregate/sanitized verification metadata is stored here. Resume text,
job descriptions, private evidence, model prompts, and model output bodies are
intentionally excluded from the verification event collection.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Iterable

from app.database import ai_verification_events_collection

VERIFICATION_SCHEMA_VERSION = "ai-verification-v1"
SMART_FEATURES = (
    "resume_builder",
    "career_intelligence",
    "interview_practice",
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
) -> None:
    """Persist privacy-safe verification metadata for one smart-feature run."""
    normalized_codes = sorted({str(code).strip()[:120] for code in violation_codes if str(code).strip()})
    ai_verification_events_collection.insert_one(
        {
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
            # User ID is retained only for deduplicating repeated internal runs;
            # no email, name, resume text, evidence text, or output text is stored.
            "user_id": str(user_id).strip()[:64],
            "created_at": datetime.now(timezone.utc),
        }
    )


def _percentage(numerator: int, denominator: int) -> float:
    return round((numerator / denominator) * 100, 1) if denominator else 0.0


def build_verification_summary(*, days: int = 30) -> dict:
    """Aggregate smart-feature quality metrics for the internal dashboard."""
    days = max(1, min(int(days), 365))
    since = datetime.now(timezone.utc) - timedelta(days=days)
    events = list(
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
                "created_at": 1,
            },
        ).sort("created_at", -1).limit(10000)
    )

    by_feature: dict[str, dict] = {}
    grouped: dict[str, list[dict]] = defaultdict(list)
    for event in events:
        grouped[str(event.get("feature") or "unknown")].append(event)

    for feature in SMART_FEATURES:
        feature_events = grouped.get(feature, [])
        failures = [event for event in feature_events if not event.get("passed")]
        violations = Counter(
            code
            for event in feature_events
            for code in (event.get("violation_codes") or [])
        )
        by_feature[feature] = {
            "samples": len(feature_events),
            "passed": len(feature_events) - len(failures),
            "failed": len(failures),
            "pass_rate": _percentage(len(feature_events) - len(failures), len(feature_events)),
            "top_error_codes": [
                {"code": code, "count": count} for code, count in violations.most_common(8)
            ],
            "instrumented": bool(feature_events),
        }

    resume = by_feature["resume_builder"]
    resume_threshold = RELEASE_THRESHOLDS["resume_builder"]
    resume_errors = Counter(
        code
        for event in grouped.get("resume_builder", [])
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
        ) <= resume_threshold["maximum_fabrication_failures"],
    }

    recent_failures = []
    for event in events:
        if event.get("passed"):
            continue
        recent_failures.append(
            {
                "feature": event.get("feature", "unknown"),
                "task": event.get("task", "unknown"),
                "violation_codes": event.get("violation_codes", []),
                "provider": event.get("provider", ""),
                "model_id": event.get("model_id", ""),
                "model_revision": event.get("model_revision", ""),
                "created_at": event.get("created_at"),
            }
        )
        if len(recent_failures) >= 25:
            break

    return {
        "window_days": days,
        "total_events": len(events),
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
