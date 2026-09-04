"""Fail-closed quality verification for generated resume suggestions."""
from __future__ import annotations

from dataclasses import dataclass
import re

from app.ai.contracts import AISuggestion, EvidenceContext
from app.ai.guards import validate_grounded_suggestion
from app.resume_builder import receipt_text


@dataclass(frozen=True)
class ResumeQualityViolation:
    """One machine-readable reason a resume suggestion must be withheld."""

    code: str
    message: str


def _normalize(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip().casefold()


def _receipt_id(receipt: dict) -> str:
    return str(receipt.get("_id", receipt.get("id", "")))


def build_safe_generated_summary(*, target_role: str, receipts: list[dict], existing_resume_text: str, current_summary: str) -> str:
    """Return a summary that cannot turn a target role into employment history.

    User-provided summaries are preserved exactly. When BragStack needs to
    generate a summary, it uses only skills present in selected Impact Receipts
    and phrases the target role as intent ("Targeting … roles") rather than a
    claim that the user already holds that title. Without source evidence, the
    generated summary is intentionally blank.
    """
    source_text = _normalize(existing_resume_text)
    summary = str(current_summary or "").strip()
    if summary and _normalize(summary) in source_text:
        return summary[:1200]
    if not receipts:
        return ""

    skills: list[str] = []
    seen_skills: set[str] = set()
    for receipt in receipts:
        for raw_skill in receipt.get("skills") or []:
            skill = str(raw_skill or "").strip()
            key = skill.casefold()
            if skill and key not in seen_skills:
                skills.append(skill)
                seen_skills.add(key)
    role = str(target_role or "").strip()
    if skills:
        return f"Targeting {role} roles, with documented work demonstrating {', '.join(skills[:5])}."[:1200]
    return f"Targeting {role} roles, with resume content grounded in selected Impact Receipts."[:1200]


def verify_resume_analysis(
    *,
    analysis: dict,
    receipts: list[dict],
    existing_resume_text: str,
    target_role: str,
) -> dict:
    """Verify generated resume content against only user-controlled sources.

    Imported resume content is treated as user-provided source text. Generated
    Impact Receipt bullets must cite a selected receipt and pass BragStack's
    deterministic grounding guards. Skills may only come from the imported
    resume or selected receipts. A generated summary requires source evidence
    and may not introduce unsupported numbers/high-risk factual language.
    """
    violations: list[ResumeQualityViolation] = []
    receipt_map = {_receipt_id(receipt): receipt for receipt in receipts if _receipt_id(receipt)}

    generated_bullets = [
        bullet for bullet in analysis.get("bullets", [])
        if bullet.get("source_kind") == "impact-receipt"
    ]
    imported_bullets = [
        bullet for bullet in analysis.get("bullets", [])
        if bullet.get("source_kind") == "imported"
    ]

    for bullet in generated_bullets:
        source_id = str(bullet.get("source_receipt_id") or "")
        receipt = receipt_map.get(source_id)
        if not receipt:
            violations.append(
                ResumeQualityViolation(
                    "invalid_source_receipt",
                    "A generated resume bullet does not point to one of the selected Impact Receipts.",
                )
            )
            continue
        evidence = EvidenceContext(evidence_ids=(source_id,), content=receipt_text(receipt))
        suggestion = AISuggestion(
            task="career_writing",
            payload={"text": str(bullet.get("text") or "")},
            source_evidence_ids=(source_id,),
            provider="resume-builder-deterministic",
            model_id="resume-builder-v1",
            model_revision="deterministic",
            prompt_version="resume-bullet-v1",
            schema_version="resume-bullet-v1",
        )
        for item in validate_grounded_suggestion(suggestion, (evidence,)):
            violations.append(ResumeQualityViolation(item.code, item.message))

    source_text = _normalize(existing_resume_text)
    imported_skills = set()
    for skill in analysis.get("skills", []):
        normalized = _normalize(skill)
        if normalized and normalized in source_text:
            imported_skills.add(normalized)

    receipt_skills = {
        _normalize(skill)
        for receipt in receipts
        for skill in (receipt.get("skills") or [])
        if _normalize(skill)
    }
    for skill in analysis.get("skills", []):
        normalized = _normalize(skill)
        if normalized and normalized not in imported_skills and normalized not in receipt_skills:
            violations.append(
                ResumeQualityViolation(
                    "unsupported_skill",
                    "A suggested skill is not present in the imported resume or selected Impact Receipts.",
                )
            )

    summary = str(analysis.get("summary") or "").strip()
    summary_is_imported = bool(summary and _normalize(summary) in source_text)
    if summary and not summary_is_imported:
        if not receipts:
            violations.append(
                ResumeQualityViolation(
                    "generated_summary_without_evidence",
                    "BragStack generated a resume summary without selected career evidence.",
                )
            )
        else:
            evidence = tuple(
                EvidenceContext(evidence_ids=(_receipt_id(receipt),), content=receipt_text(receipt))
                for receipt in receipts
                if _receipt_id(receipt)
            )
            suggestion = AISuggestion(
                task="career_writing",
                payload={"summary": summary},
                source_evidence_ids=tuple(item.evidence_ids[0] for item in evidence),
                provider="resume-builder-deterministic",
                model_id="resume-builder-v1",
                model_revision="deterministic",
                prompt_version="resume-summary-v1",
                schema_version="resume-summary-v1",
            )
            for item in validate_grounded_suggestion(suggestion, evidence):
                violations.append(ResumeQualityViolation(item.code, item.message))

            normalized_summary = _normalize(summary)
            role = _normalize(target_role)
            if role and normalized_summary.startswith(role + " with"):
                violations.append(
                    ResumeQualityViolation(
                        "target_role_presented_as_fact",
                        "The target role was presented as an existing professional title rather than user intent.",
                    )
                )

    unique = {(item.code, item.message): item for item in violations}
    violations = list(unique.values())
    checks = {
        "generated_bullet_provenance": not any(item.code in {"invalid_source_receipt", "missing_provenance", "unknown_evidence_id"} for item in violations),
        "unsupported_numeric_claims": not any(item.code == "unsupported_numeric_claim" for item in violations),
        "unsupported_high_risk_language": not any(item.code == "unsupported_high_risk_language" for item in violations),
        "skills_grounded_in_user_sources": not any(item.code == "unsupported_skill" for item in violations),
        "target_role_not_claimed_as_history": not any(item.code == "target_role_presented_as_fact" for item in violations),
        "summary_requires_evidence": not any(item.code == "generated_summary_without_evidence" for item in violations),
        # Company and education fields are imported/manual only in the current
        # builder; BragStack does not synthesize them from a job description.
        "company_and_education_generation": True,
    }
    return {
        "gate_version": "resume-grounding-v1",
        "passed": not violations,
        "release_gate": "pass" if not violations else "block",
        "checks": checks,
        "violations": [{"code": item.code, "message": item.message} for item in violations],
        "source_receipt_count": len(receipts),
        "generated_bullet_count": len(generated_bullets),
        "imported_bullet_count": len(imported_bullets),
        "privacy_note": "Verification telemetry stores counts and error codes only; it does not store resume or evidence text.",
    }
