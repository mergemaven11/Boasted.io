"""Document this first-party Python module."""
from __future__ import annotations

import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.auth import get_current_user
from app.certification_packet_pdf import (
    build_certification_packet_pdf,
    make_certification_packet_filename,
)
from app.certification_packet_routes import _build_certification_packet
from app.interview_packet_pdf import build_interview_packet_pdf, make_interview_packet_filename
from app.interview_packet_routes import _build_interview_packet
from app.packet_audit import record_packet_export
from app.packet_platform_pdf import build_platform_packet_pdf, make_platform_packet_filename
from app.packet_platform_routes import build_platform_packet
from app.packet_request_models import (
    BasePacketRequest,
    CertificationPacketRequest,
    InterviewPacketRequest,
    PlatformPacketRequest,
    PromotionPacketRequest,
)
from app.performance_packet_pdf import build_performance_packet_pdf, make_packet_filename
from app.performance_packet_routes import _build_packet, _parse_period
from app.plans import require_feature
from app.promotion_packet_pdf import build_promotion_packet_pdf, make_promotion_packet_filename
from app.promotion_packet_routes import _build_promotion_packet


router = APIRouter(prefix="/packets", tags=["packets"])


def _period(payload: BasePacketRequest):
    """Handle period.

    Args:
        payload: Function argument.

    Returns:
        Function result.
    """
    return _parse_period(payload.start_date, payload.end_date)


def _build_base(payload: BasePacketRequest, current_user: dict) -> dict:
    """Handle build base.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    start_date, end_date = _period(payload)
    return _build_packet(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        career_area=payload.career_area,
        role_title=payload.role_title,
        organization=payload.organization,
        confidential=payload.confidential,
    )["packet"]


def _build_platform(payload: PlatformPacketRequest, current_user: dict) -> dict:
    """Handle build platform.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    start_date, end_date = _period(payload)
    return build_platform_packet(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        career_area=payload.career_area,
        role_title=payload.role_title,
        organization=payload.organization,
        confidential=payload.confidential,
        signature_entry_ids=payload.signature_entry_ids,
        sections=payload.normalized_sections(),
        packet_note=payload.packet_note,
        item_notes=payload.item_notes,
        include_notes=payload.include_notes,
        theme=payload.theme,
        brand_name=payload.brand_name,
        department_label=payload.department_label,
        reviewer_name=payload.reviewer_name,
        review_cycle_label=payload.review_cycle_label,
    )


def _build_promotion(payload: PromotionPacketRequest, current_user: dict) -> dict:
    """Handle build promotion.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    start_date, end_date = _period(payload)
    return _build_promotion_packet(
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


def _build_interview(payload: InterviewPacketRequest, current_user: dict) -> dict:
    """Handle build interview.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    start_date, end_date = _period(payload)
    return _build_interview_packet(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        career_area=payload.career_area,
        role_title=payload.role_title,
        organization=payload.organization,
        confidential=payload.confidential,
        selected_entry_ids=payload.selected_entry_ids,
        target_role=payload.target_role,
        target_organization=payload.target_organization,
        include_evidence_references=payload.include_evidence_references,
    )["packet"]


def _build_certification(payload: CertificationPacketRequest, current_user: dict) -> dict:
    """Handle build certification.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    start_date, end_date = _period(payload)
    return _build_certification_packet(
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


def _pdf_response(*, current_user: dict, packet: dict, pdf_bytes: bytes, filename: str):
    """Handle pdf response.

    Args:
        current_user: Function argument.
        packet: Function argument.
        pdf_bytes: Function argument.
        filename: Function argument.

    Returns:
        Function result.
    """
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


@router.post("/performance-review")
def create_performance_review_packet(
    payload: BasePacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle create performance review packet.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    return {"packet": _build_base(payload, current_user)}


@router.post("/performance-review-v12")
def create_performance_review_packet_v12(
    payload: PlatformPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle create performance review packet v12.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    return {"packet": _build_platform(payload, current_user)}


@router.post("/promotion")
def create_promotion_packet(
    payload: PromotionPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle create promotion packet.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    return {"packet": _build_promotion(payload, current_user)}


@router.post("/interview")
def create_interview_packet(
    payload: InterviewPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle create interview packet.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    return {"packet": _build_interview(payload, current_user)}


@router.post("/certification")
def create_certification_packet(
    payload: CertificationPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle create certification packet.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    return {"packet": _build_certification(payload, current_user)}


@router.post("/performance-review.pdf")
def download_performance_review_packet_pdf(
    payload: BasePacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle download performance review packet pdf.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    require_feature(current_user, "export_pdf")
    packet = _build_base(payload, current_user)
    pdf_bytes = build_performance_packet_pdf(packet)
    return _pdf_response(
        current_user=current_user,
        packet=packet,
        pdf_bytes=pdf_bytes,
        filename=make_packet_filename(packet),
    )


@router.post("/performance-review-v12.pdf")
def download_performance_review_packet_v12_pdf(
    payload: PlatformPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle download performance review packet v12 pdf.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    require_feature(current_user, "export_pdf")
    packet = _build_platform(payload, current_user)
    pdf_bytes = build_platform_packet_pdf(packet)
    return _pdf_response(
        current_user=current_user,
        packet=packet,
        pdf_bytes=pdf_bytes,
        filename=make_platform_packet_filename(packet),
    )


@router.post("/promotion.pdf")
def download_promotion_packet_pdf(
    payload: PromotionPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle download promotion packet pdf.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    require_feature(current_user, "export_pdf")
    packet = _build_promotion(payload, current_user)
    pdf_bytes = build_promotion_packet_pdf(packet)
    return _pdf_response(
        current_user=current_user,
        packet=packet,
        pdf_bytes=pdf_bytes,
        filename=make_promotion_packet_filename(packet),
    )


@router.post("/interview.pdf")
def download_interview_packet_pdf(
    payload: InterviewPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle download interview packet pdf.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    require_feature(current_user, "export_pdf")
    packet = _build_interview(payload, current_user)
    pdf_bytes = build_interview_packet_pdf(packet)
    return _pdf_response(
        current_user=current_user,
        packet=packet,
        pdf_bytes=pdf_bytes,
        filename=make_interview_packet_filename(packet),
    )


@router.post("/certification.pdf")
def download_certification_packet_pdf(
    payload: CertificationPacketRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle download certification packet pdf.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    require_feature(current_user, "export_pdf")
    packet = _build_certification(payload, current_user)
    pdf_bytes = build_certification_packet_pdf(packet)
    return _pdf_response(
        current_user=current_user,
        packet=packet,
        pdf_bytes=pdf_bytes,
        filename=make_certification_packet_filename(packet),
    )
