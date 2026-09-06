"""Expanded Boasted packet catalog with themed PDF and DOCX exports."""
from __future__ import annotations

import io
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.certification_packet_routes import _build_certification_packet
from app.interview_packet_routes import _build_interview_packet
from app.packet_audit import record_packet_export, record_packet_generation
from app.packet_document_exports import DOCX_MIME, make_career_packet_filename
from app.packet_platform import apply_packet_platform
from app.packet_platform_routes import _signature_candidates, build_platform_packet
from app.packet_reviewer_exports import (
    build_reviewable_career_packet_docx,
    build_reviewable_career_packet_pdf,
    reviewer_guide_for_packet,
)
from app.performance_packet_routes import _build_packet, _clean_string, _parse_period
from app.plans import require_feature
from app.promotion_packet_routes import _build_promotion_packet


router = APIRouter(prefix="/packets/catalog", tags=["packets"])

QUALITY_MESSAGE = (
    "The more data you submit - accomplishments, Impact Receipts, evidence, skills, "
    "verified recognition, and measurable results - the more accurate and helpful "
    "this packet can be."
)

PACKET_SPECS: dict[str, dict[str, str]] = {
    "performance-review": {
        "title": "Performance Review Packet",
        "example": "Use it before an annual review, midyear check-in, or performance conversation.",
        "scorecard_label": "Performance Evidence Scorecard",
        "scorecard_title": "Your documented work at a glance",
        "scorecard_intro": "A transparent summary of saved accomplishments, Impact Receipts, evidence, skills, measurable results, and verified recognition.",
        "highlight_label": "Review-ready accomplishment",
    },
    "promotion": {
        "title": "Promotion Packet",
        "example": "Use it when asking for a promotion, title change, level increase, or advancement review.",
        "scorecard_label": "Promotion Evidence Scorecard",
        "scorecard_title": "The proof behind the progression case",
        "scorecard_intro": "A transparent view of documented impact supporting a progression conversation. Boasted does not calculate promotion readiness.",
        "highlight_label": "Promotion evidence highlight",
    },
    "interview": {
        "title": "Interview Packet",
        "example": "Use it before an interview to organize stories, results, proof, and questions to prepare for.",
        "scorecard_label": "Interview Story Scorecard",
        "scorecard_title": "The stories you chose",
        "scorecard_intro": "A transparent view of selected accomplishments. Missing context becomes a preparation prompt instead of invented content.",
        "highlight_label": "Interview story highlight",
    },
    "certification": {
        "title": "Certification & Licensure Packet",
        "example": "Use it for a license renewal, certification review, competency review, or regulated-career submission.",
        "scorecard_label": "Credential Evidence Scorecard",
        "scorecard_title": "Evidence for the credential review",
        "scorecard_intro": "A transparent view of documented experience, competencies, evidence, and recognition relevant to a credential review.",
        "highlight_label": "Credential-supporting accomplishment",
    },
    "program-application": {
        "title": "Program Application Packet",
        "example": "Use it when applying to a college program, bootcamp, fellowship, residency, apprenticeship, or leadership program.",
        "scorecard_label": "Application Evidence Scorecard",
        "scorecard_title": "Proof for the application",
        "scorecard_intro": "A factual summary of saved work, outcomes, evidence, and skills that can support a program application. It does not predict selection or admission.",
        "highlight_label": "Application-supporting accomplishment",
    },
    "scholarship": {
        "title": "Scholarship & Award Packet",
        "example": "Use it to prepare scholarship essays, award nominations, grant-style personal statements, or selection interviews.",
        "scorecard_label": "Scholarship Evidence Scorecard",
        "scorecard_title": "Documented impact for the application",
        "scorecard_intro": "A factual summary of saved accomplishments, service, leadership, outcomes, evidence, and recognition. It does not predict an award decision.",
        "highlight_label": "Scholarship-supporting accomplishment",
    },
    "portfolio": {
        "title": "Portfolio & Project Showcase Packet",
        "example": "Use it for a recruiter portfolio, client pitch, creative review, project showcase, or professional website companion.",
        "scorecard_label": "Portfolio Evidence Scorecard",
        "scorecard_title": "Your selected proof at a glance",
        "scorecard_intro": "A professional showcase of documented projects, outcomes, skills, evidence, and recognition from your Boasted record.",
        "highlight_label": "Featured project or accomplishment",
    },
    "career-transition": {
        "title": "Career Transition Packet",
        "example": "Use it when changing industries, returning to work, moving from school to work, or repositioning transferable skills.",
        "scorecard_label": "Transferable Evidence Scorecard",
        "scorecard_title": "What your existing proof can demonstrate",
        "scorecard_intro": "A factual bridge from documented work to a new career context. Boasted does not predict hiring outcomes or claim undocumented experience.",
        "highlight_label": "Transferable accomplishment",
    },
}


class PacketCatalogRequest(BaseModel):
    """Universal request model for the packet catalog."""

    start_date: str | None = None
    end_date: str | None = None
    career_area: str | None = Field(default=None, max_length=120)
    role_title: str | None = Field(default=None, max_length=160)
    organization: str | None = Field(default=None, max_length=180)
    confidential: bool = True

    target_role: str | None = Field(default=None, max_length=160)
    target_level: str | None = Field(default=None, max_length=120)
    target_organization: str | None = Field(default=None, max_length=180)
    selected_entry_ids: list[str] = Field(default_factory=list)
    include_evidence_references: bool = False

    credential_name: str | None = Field(default=None, max_length=180)
    issuing_body: str | None = Field(default=None, max_length=180)
    review_type: str | None = Field(default=None, max_length=120)
    requirement_notes: str | None = Field(default=None, max_length=1200)

    program_name: str | None = Field(default=None, max_length=180)
    institution_name: str | None = Field(default=None, max_length=180)
    application_type: str | None = Field(default=None, max_length=120)
    application_deadline: str | None = Field(default=None, max_length=40)
    application_prompt: str | None = Field(default=None, max_length=1800)

    scholarship_name: str | None = Field(default=None, max_length=180)
    sponsor_name: str | None = Field(default=None, max_length=180)
    award_focus: str | None = Field(default=None, max_length=180)
    scholarship_deadline: str | None = Field(default=None, max_length=40)
    essay_prompt: str | None = Field(default=None, max_length=1800)

    portfolio_title: str | None = Field(default=None, max_length=180)
    portfolio_audience: str | None = Field(default=None, max_length=180)
    portfolio_focus: str | None = Field(default=None, max_length=180)
    project_notes: str | None = Field(default=None, max_length=1800)

    target_industry: str | None = Field(default=None, max_length=180)
    transition_goal: str | None = Field(default=None, max_length=300)
    transferable_skills_focus: str | None = Field(default=None, max_length=1200)
    transition_notes: str | None = Field(default=None, max_length=1800)

    signature_entry_ids: list[str] = Field(default_factory=list)
    sections: list[str] | None = None
    packet_note: str | None = Field(default=None, max_length=1500)
    item_notes: dict[str, str] = Field(default_factory=dict)
    include_notes: bool = True
    theme: str | None = Field(default="modern-minimal", max_length=40)
    brand_name: str | None = Field(default=None, max_length=120)
    department_label: str | None = Field(default=None, max_length=120)
    reviewer_name: str | None = Field(default=None, max_length=120)
    review_cycle_label: str | None = Field(default=None, max_length=120)


def _spec(packet_type: str) -> dict[str, str]:
    spec = PACKET_SPECS.get(packet_type)
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown packet type.",
        )
    return spec


def _period(payload: PacketCatalogRequest) -> tuple[date | None, date | None]:
    return _parse_period(payload.start_date, payload.end_date)


def _safe_ids(values: list[str], max_items: int = 8) -> list[str]:
    result: list[str] = []
    for value in values:
        text = str(value or "").strip()
        if text and text not in result:
            result.append(text)
        if len(result) >= max_items:
            break
    return result


def _apply_common_platform(packet: dict[str, Any], payload: PacketCatalogRequest, current_user: dict, start_date: date | None, end_date: date | None) -> dict[str, Any]:
    candidates = _signature_candidates(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )
    return apply_packet_platform(
        packet,
        signature_entry_ids=_safe_ids(payload.signature_entry_ids),
        signature_candidates=candidates,
        sections=payload.sections,
        packet_note=payload.packet_note,
        item_notes=payload.item_notes,
        include_notes=payload.include_notes,
        theme=payload.theme,
        brand_name=payload.brand_name,
        department_label=payload.department_label,
        reviewer_name=payload.reviewer_name,
        review_cycle_label=payload.review_cycle_label,
    )


def _focus(label: str, value: Any) -> dict[str, str] | None:
    clean = _clean_string(value)
    return {"label": label, "value": clean} if clean else None


def _focus_fields(packet_type: str, payload: PacketCatalogRequest) -> list[dict[str, str]]:
    candidates: list[dict[str, str] | None]
    if packet_type == "performance-review":
        candidates = [
            _focus("Review cycle", payload.review_cycle_label),
            _focus("Prepared for", payload.reviewer_name),
            _focus("Organization / team", payload.organization),
        ]
    elif packet_type == "promotion":
        candidates = [
            _focus("Target role", payload.target_role),
            _focus("Target level", payload.target_level),
            _focus("Organization / team", payload.organization),
        ]
    elif packet_type == "interview":
        candidates = [
            _focus("Target role", payload.target_role),
            _focus("Target organization", payload.target_organization),
        ]
    elif packet_type == "certification":
        candidates = [
            _focus("Credential / license", payload.credential_name),
            _focus("Issuing / reviewing body", payload.issuing_body),
            _focus("Review type", payload.review_type),
        ]
    elif packet_type == "program-application":
        candidates = [
            _focus("Program", payload.program_name),
            _focus("Institution / provider", payload.institution_name),
            _focus("Application type", payload.application_type),
            _focus("Deadline", payload.application_deadline),
        ]
    elif packet_type == "scholarship":
        candidates = [
            _focus("Scholarship / award", payload.scholarship_name),
            _focus("Sponsor", payload.sponsor_name),
            _focus("Selection focus", payload.award_focus),
            _focus("Deadline", payload.scholarship_deadline),
        ]
    elif packet_type == "portfolio":
        candidates = [
            _focus("Portfolio title", payload.portfolio_title),
            _focus("Audience", payload.portfolio_audience),
            _focus("Focus", payload.portfolio_focus),
        ]
    else:
        candidates = [
            _focus("Target industry / field", payload.target_industry),
            _focus("Target role", payload.target_role),
            _focus("Transition goal", payload.transition_goal),
        ]
    return [item for item in candidates if item]


def _generic_summary(packet_type: str, packet: dict[str, Any], payload: PacketCatalogRequest) -> str:
    subject = packet.get("subject") or {}
    scorecard = packet.get("scorecard") or {}
    name = _clean_string(subject.get("name"), "This Boasted member")
    count = int(scorecard.get("accomplishments") or 0)
    proof = int(scorecard.get("impact_receipts") or 0)
    evidence = int(scorecard.get("evidence_items") or 0)

    lead = f"{name} has {count} documented accomplishment{'s' if count != 1 else ''}, {proof} Impact Receipt{'s' if proof != 1 else ''}, and {evidence} evidence item{'s' if evidence != 1 else ''} available in this packet."
    if packet_type == "program-application":
        target = " at ".join(value for value in [_clean_string(payload.program_name), _clean_string(payload.institution_name)] if value)
        middle = f"The saved proof is organized to support an application for {target}." if target else "The saved proof is organized to support a program application."
        ending = "This packet is preparation material and does not predict admission, acceptance, eligibility, or selection."
    elif packet_type == "scholarship":
        target = _clean_string(payload.scholarship_name) or "the named scholarship or award"
        middle = f"The saved proof is organized around accomplishments, impact, service, leadership, and evidence relevant to {target}."
        ending = "This packet does not predict scholarship, award, grant, or selection outcomes."
    elif packet_type == "portfolio":
        focus = _clean_string(payload.portfolio_focus)
        middle = "The saved proof is organized as a professional portfolio and project showcase" + (f" with emphasis on {focus}." if focus else ".")
        ending = "Only documented Boasted material is presented; missing achievements or project outcomes are not invented."
    else:
        target = " / ".join(value for value in [_clean_string(payload.target_role), _clean_string(payload.target_industry)] if value)
        middle = f"The saved proof is organized to explain transferable experience for {target}." if target else "The saved proof is organized to explain transferable experience for a career transition."
        ending = "This packet does not predict hiring outcomes or claim experience that is not present in the saved record."
    return " ".join([lead, middle, ending])


def _generic_context(packet_type: str, payload: PacketCatalogRequest) -> tuple[str, dict[str, Any]]:
    if packet_type == "program-application":
        return "application_context", {
            "program_name": _clean_string(payload.program_name),
            "institution_name": _clean_string(payload.institution_name),
            "application_type": _clean_string(payload.application_type, "Program application"),
            "application_deadline": _clean_string(payload.application_deadline),
            "application_prompt": _clean_string(payload.application_prompt),
        }
    if packet_type == "scholarship":
        return "scholarship_context", {
            "scholarship_name": _clean_string(payload.scholarship_name),
            "sponsor_name": _clean_string(payload.sponsor_name),
            "award_focus": _clean_string(payload.award_focus),
            "scholarship_deadline": _clean_string(payload.scholarship_deadline),
            "essay_prompt": _clean_string(payload.essay_prompt),
        }
    if packet_type == "portfolio":
        return "portfolio_context", {
            "portfolio_title": _clean_string(payload.portfolio_title),
            "portfolio_audience": _clean_string(payload.portfolio_audience),
            "portfolio_focus": _clean_string(payload.portfolio_focus),
            "project_notes": _clean_string(payload.project_notes),
        }
    return "transition_context", {
        "target_industry": _clean_string(payload.target_industry),
        "target_role": _clean_string(payload.target_role),
        "transition_goal": _clean_string(payload.transition_goal),
        "transferable_skills_focus": _clean_string(payload.transferable_skills_focus),
        "transition_notes": _clean_string(payload.transition_notes),
    }


def build_catalog_packet(packet_type: str, payload: PacketCatalogRequest, current_user: dict) -> dict[str, Any]:
    spec = _spec(packet_type)
    start_date, end_date = _period(payload)

    if packet_type == "performance-review":
        packet = build_platform_packet(
            current_user=current_user,
            start_date=start_date,
            end_date=end_date,
            career_area=payload.career_area,
            role_title=payload.role_title,
            organization=payload.organization,
            confidential=payload.confidential,
            signature_entry_ids=_safe_ids(payload.signature_entry_ids),
            sections=payload.sections,
            packet_note=payload.packet_note,
            item_notes=payload.item_notes,
            include_notes=payload.include_notes,
            theme=payload.theme,
            brand_name=payload.brand_name,
            department_label=payload.department_label,
            reviewer_name=payload.reviewer_name,
            review_cycle_label=payload.review_cycle_label,
        )
    elif packet_type == "promotion":
        packet = _build_promotion_packet(
            current_user=current_user,
            start_date=start_date,
            end_date=end_date,
            career_area=payload.career_area,
            role_title=payload.role_title,
            organization=payload.organization,
            confidential=payload.confidential,
            target_role=payload.target_role,
            target_level=payload.target_level,
        )["packet"]
        packet = _apply_common_platform(packet, payload, current_user, start_date, end_date)
    elif packet_type == "interview":
        packet = _build_interview_packet(
            current_user=current_user,
            start_date=start_date,
            end_date=end_date,
            career_area=payload.career_area,
            role_title=payload.role_title,
            organization=payload.organization,
            confidential=payload.confidential,
            selected_entry_ids=_safe_ids(payload.selected_entry_ids),
            target_role=payload.target_role,
            target_organization=payload.target_organization,
            include_evidence_references=payload.include_evidence_references,
        )["packet"]
        packet = _apply_common_platform(packet, payload, current_user, start_date, end_date)
    elif packet_type == "certification":
        packet = _build_certification_packet(
            current_user=current_user,
            start_date=start_date,
            end_date=end_date,
            career_area=payload.career_area,
            role_title=payload.role_title,
            organization=payload.organization,
            confidential=payload.confidential,
            credential_name=payload.credential_name,
            issuing_body=payload.issuing_body,
            review_type=payload.review_type,
            requirement_notes=payload.requirement_notes,
        )["packet"]
        packet = _apply_common_platform(packet, payload, current_user, start_date, end_date)
    else:
        packet = _build_packet(
            current_user=current_user,
            start_date=start_date,
            end_date=end_date,
            career_area=payload.career_area,
            role_title=payload.role_title,
            organization=payload.organization,
            confidential=payload.confidential,
        )["packet"]
        packet = _apply_common_platform(packet, payload, current_user, start_date, end_date)
        context_key, context_value = _generic_context(packet_type, payload)
        packet[context_key] = context_value
        packet["kind"] = packet_type
        packet["title"] = spec["title"]
        packet["review_summary"] = _generic_summary(packet_type, packet, payload)

    packet["kind"] = packet_type
    packet["title"] = spec["title"]
    packet["quality_message"] = QUALITY_MESSAGE
    packet["usage_example"] = spec["example"]
    packet["focus_fields"] = _focus_fields(packet_type, payload)
    packet["presentation"] = {
        "scorecard_label": spec["scorecard_label"],
        "scorecard_title": spec["scorecard_title"],
        "scorecard_intro": spec["scorecard_intro"],
        "highlight_label": spec["highlight_label"],
    }
    packet["reviewer_guide"] = reviewer_guide_for_packet(packet_type)
    return packet


def _pdf_response(packet: dict[str, Any], current_user: dict):
    require_feature(current_user, "export_pdf")
    pdf_bytes = build_reviewable_career_packet_pdf(packet)
    filename = make_career_packet_filename(packet, "pdf")
    record_packet_export(
        user_id=str(current_user["_id"]),
        packet=packet,
        filename=filename,
        pdf_bytes=pdf_bytes,
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


def _docx_response(packet: dict[str, Any], current_user: dict):
    require_feature(current_user, "export_pdf")
    docx_bytes = build_reviewable_career_packet_docx(packet)
    filename = make_career_packet_filename(packet, "docx")
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type=DOCX_MIME,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.post("/{packet_type}.pdf")
def download_catalog_packet_pdf(
    packet_type: str,
    payload: PacketCatalogRequest,
    current_user: dict = Depends(get_current_user),
):
    packet = build_catalog_packet(packet_type, payload, current_user)
    return _pdf_response(packet, current_user)


@router.post("/{packet_type}.docx")
def download_catalog_packet_docx(
    packet_type: str,
    payload: PacketCatalogRequest,
    current_user: dict = Depends(get_current_user),
):
    packet = build_catalog_packet(packet_type, payload, current_user)
    return _docx_response(packet, current_user)


@router.post("/{packet_type}")
def create_catalog_packet(
    packet_type: str,
    payload: PacketCatalogRequest,
    current_user: dict = Depends(get_current_user),
):
    packet = build_catalog_packet(packet_type, payload, current_user)
    history_id = record_packet_generation(
        user_id=str(current_user["_id"]),
        packet=packet,
    )
    return {"packet": packet, "history_id": history_id}
