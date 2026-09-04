"""Packet history routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.database import packet_export_audit_collection
from app.packet_audit import serialize_export
from app.plans import require_feature

router = APIRouter(prefix="/packets", tags=["packets"])


def _history_items(user_id: str, limit: int) -> list[dict]:
    return list(
        packet_export_audit_collection.find({"user_id": user_id})
        .sort("generated_at", -1)
        .limit(limit)
    )


@router.get("/history")
def get_packet_history(
    limit: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Return metadata-only packet generation and PDF-export history."""
    items = _history_items(str(current_user["_id"]), limit)
    return {"history": [serialize_export(item) for item in items]}


@router.get("/export-history")
def get_packet_export_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """Return only PDF export history for compatibility and analytics."""
    require_feature(current_user, "export_pdf")
    items = list(
        packet_export_audit_collection.find({
            "user_id": str(current_user["_id"]),
            "$or": [
                {"activity": "pdf_exported"},
                {"activity": {"$exists": False}},
            ],
        })
        .sort("generated_at", -1)
        .limit(limit)
    )
    return {"exports": [serialize_export(item) for item in items]}
