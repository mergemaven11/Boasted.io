"""Regression tests for fail-closed resume suggestion verification."""
from __future__ import annotations

from bson import ObjectId

from app.resume_builder import analyze_resume, build_resume_bullet
from app.resume_quality import build_safe_generated_summary, verify_resume_analysis


def _receipt(**overrides):
    receipt = {
        "_id": ObjectId(),
        "accomplishment": "Reduced incident triage time",
        "contribution": "Built an automated triage workflow",
        "result": "Reduced average triage time by 42%",
        "skills": ["Python", "Automation"],
        "metrics": [{"label": "Triage reduction", "value": "42%", "context": "average triage time"}],
        "evidence": [{"title": "Incident dashboard"}],
        "trust_signals": ["self-documented"],
    }
    receipt.update(overrides)
    return receipt


def test_safe_generated_summary_treats_target_role_as_intent():
    receipt = _receipt()
    summary = build_safe_generated_summary(
        target_role="Senior Platform Engineer",
        receipts=[receipt],
        existing_resume_text="",
        current_summary="Senior Platform Engineer with evidence-backed impact.",
    )
    assert summary.startswith("Targeting Senior Platform Engineer roles")
    assert "Python" in summary


def test_generated_summary_is_blank_without_user_source_evidence():
    summary = build_safe_generated_summary(
        target_role="Director of Operations",
        receipts=[],
        existing_resume_text="",
        current_summary="Director of Operations focused on measurable results.",
    )
    assert summary == ""


def test_grounded_resume_analysis_passes_with_exact_receipt_provenance():
    receipt = _receipt()
    analysis = analyze_resume(
        target_role="Platform Engineer",
        job_description="We need Python automation and incident response experience for this platform engineering role.",
        receipts=[receipt],
        existing_resume_text="",
    )
    analysis["summary"] = build_safe_generated_summary(
        target_role="Platform Engineer",
        receipts=[receipt],
        existing_resume_text="",
        current_summary=analysis["summary"],
    )
    verification = verify_resume_analysis(
        analysis=analysis,
        receipts=[receipt],
        existing_resume_text="",
        target_role="Platform Engineer",
    )
    assert verification["passed"] is True
    assert verification["release_gate"] == "pass"


def test_hallucinated_percentage_blocks_resume_suggestion():
    receipt = _receipt()
    analysis = {
        "summary": "Targeting Platform Engineer roles, with documented work demonstrating Python.",
        "skills": ["Python"],
        "bullets": [
            {
                "text": "Reduced average triage time by 92%",
                "source_receipt_id": str(receipt["_id"]),
                "source_kind": "impact-receipt",
            }
        ],
    }
    verification = verify_resume_analysis(
        analysis=analysis,
        receipts=[receipt],
        existing_resume_text="",
        target_role="Platform Engineer",
    )
    assert verification["passed"] is False
    assert "unsupported_numeric_claim" in {item["code"] for item in verification["violations"]}


def test_job_description_skill_cannot_be_promoted_without_user_evidence():
    receipt = _receipt(skills=["Python"])
    analysis = {
        "summary": "Targeting Platform Engineer roles, with documented work demonstrating Python.",
        "skills": ["Python", "Kubernetes"],
        "bullets": [
            {
                "text": build_resume_bullet(receipt),
                "source_receipt_id": str(receipt["_id"]),
                "source_kind": "impact-receipt",
            }
        ],
    }
    verification = verify_resume_analysis(
        analysis=analysis,
        receipts=[receipt],
        existing_resume_text="",
        target_role="Platform Engineer",
    )
    assert verification["passed"] is False
    assert "unsupported_skill" in {item["code"] for item in verification["violations"]}


def test_target_role_presented_as_existing_title_is_blocked():
    receipt = _receipt()
    analysis = {
        "summary": "Platform Engineer with evidence-backed impact across Python.",
        "skills": ["Python"],
        "bullets": [],
    }
    verification = verify_resume_analysis(
        analysis=analysis,
        receipts=[receipt],
        existing_resume_text="",
        target_role="Platform Engineer",
    )
    assert verification["passed"] is False
    assert "target_role_presented_as_fact" in {item["code"] for item in verification["violations"]}
