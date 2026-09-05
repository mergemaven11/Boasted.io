"""Tests for internal smart-feature verification metrics and release gates."""
from __future__ import annotations

from datetime import datetime, timezone

import mongomock
from pymongo.errors import PyMongoError

import app.ai.verification as verification


def test_uninstrumented_features_are_never_reported_as_passing(monkeypatch):
    collection = mongomock.MongoClient()["test"]["ai_verification_events"]
    monkeypatch.setattr(verification, "ai_verification_events_collection", collection)

    summary = verification.build_verification_summary(days=30)

    assert summary["features"]["resume_builder"]["instrumented"] is False
    assert summary["features"]["resume_builder"]["pass_rate"] == 0.0
    assert summary["features"]["interview_practice"]["instrumented"] is False
    assert summary["features"]["education_intelligence"]["instrumented"] is False
    assert summary["features"]["compliance_intelligence"]["instrumented"] is False
    assert summary["release_gate"]["resume_builder"]["ready"] is False


def test_resume_gate_requires_minimum_samples_and_zero_failures(monkeypatch):
    collection = mongomock.MongoClient()["test"]["ai_verification_events"]
    monkeypatch.setattr(verification, "ai_verification_events_collection", collection)
    now = datetime.now(timezone.utc)

    for _ in range(19):
        collection.insert_one({
            "feature": "resume_builder",
            "task": "build_verified",
            "passed": True,
            "violation_codes": [],
            "provider": "deterministic",
            "model_id": "resume-builder-v1",
            "model_revision": "grounded-v1",
            "created_at": now,
        })

    summary = verification.build_verification_summary(days=30)
    assert summary["release_gate"]["resume_builder"]["ready"] is False
    assert summary["release_gate"]["resume_builder"]["checks"]["minimum_samples"] is False

    collection.insert_one({
        "feature": "resume_builder",
        "task": "build_verified",
        "passed": True,
        "violation_codes": [],
        "provider": "deterministic",
        "model_id": "resume-builder-v1",
        "model_revision": "grounded-v1",
        "created_at": now,
    })
    summary = verification.build_verification_summary(days=30)
    assert summary["release_gate"]["resume_builder"]["ready"] is True

    collection.insert_one({
        "feature": "resume_builder",
        "task": "build_verified",
        "passed": False,
        "violation_codes": ["unsupported_numeric_claim"],
        "provider": "deterministic",
        "model_id": "resume-builder-v1",
        "model_revision": "grounded-v1",
        "created_at": now,
    })
    summary = verification.build_verification_summary(days=30)
    assert summary["release_gate"]["resume_builder"]["ready"] is False
    assert summary["features"]["resume_builder"]["failed"] == 1
    assert summary["features"]["resume_builder"]["top_error_codes"][0]["code"] == "unsupported_numeric_claim"


def test_telemetry_write_failure_never_blocks_customer_feature(monkeypatch):
    class FailingCollection:
        def insert_one(self, _document):
            raise PyMongoError("telemetry unavailable")

    monkeypatch.setattr(verification, "ai_verification_events_collection", FailingCollection())

    written = verification.record_verification_event(
        feature="resume_builder",
        task="build_verified",
        passed=True,
        source_count=1,
        generated_item_count=2,
        user_id="test-user",
    )

    assert written is False
