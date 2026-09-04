"""Packet history metadata helpers.

Packet history intentionally stores metadata only. It never stores packet bodies,
evidence content, manager notes, or generated PDF bytes.
"""
from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any

from app.database import packet_export_audit_collection


def count_pdf_pages(pdf_bytes: bytes) -> int | None:
    if not pdf_bytes:
        return None
    count = len(re.findall(rb"/Type\s*/Page(?!s)\b", pdf_bytes))
    return count or None


def _history_document(*, user_id: str, packet: dict[str, Any], activity: str) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "activity": activity,
        "packet_kind": packet.get("kind") or "unknown",
        "generated_at": datetime.now(timezone.utc),
        "review_period": {
            "start_date": packet.get("period", {}).get("start_date"),
            "end_date": packet.get("period", {}).get("end_date"),
            "label": packet.get("period", {}).get("label"),
        },
        "career_area": packet.get("context", {}).get("career_area") or "",
        "theme": packet.get("render_config", {}).get("theme") or "classic-dossier",
    }


def record_packet_generation(*, user_id: str, packet: dict[str, Any]) -> str:
    """Persist a metadata-only history item when a packet preview is generated."""
    document = _history_document(user_id=user_id, packet=packet, activity="generated")
    result = packet_export_audit_collection.insert_one(document)
    return str(result.inserted_id)


def record_packet_export(
    *,
    user_id: str,
    packet: dict[str, Any],
    filename: str,
    pdf_bytes: bytes,
) -> str:
    """Upgrade a recent generated packet to exported, or create an export-only history row."""
    now = datetime.now(timezone.utc)
    packet_kind = packet.get("kind") or "unknown"
    period = {
        "start_date": packet.get("period", {}).get("start_date"),
        "end_date": packet.get("period", {}).get("end_date"),
        "label": packet.get("period", {}).get("label"),
    }
    recent = packet_export_audit_collection.find_one(
        {
            "user_id": user_id,
            "activity": "generated",
            "packet_kind": packet_kind,
            "review_period.start_date": period.get("start_date"),
            "review_period.end_date": period.get("end_date"),
            "generated_at": {"$gte": now - timedelta(minutes=20)},
        },
        sort=[("generated_at", -1)],
    )
    export_fields = {
        "activity": "pdf_exported",
        "exported_at": now,
        "filename": filename,
        "page_count": count_pdf_pages(pdf_bytes),
    }
    if recent:
        packet_export_audit_collection.update_one({"_id": recent["_id"]}, {"$set": export_fields})
        return str(recent["_id"])

    document = _history_document(user_id=user_id, packet=packet, activity="pdf_exported")
    document.update(export_fields)
    result = packet_export_audit_collection.insert_one(document)
    return str(result.inserted_id)


def serialize_export(item: dict[str, Any]) -> dict[str, Any]:
    generated = item.get("generated_at")
    exported = item.get("exported_at")
    activity = item.get("activity") or "pdf_exported"
    return {
        "id": str(item.get("_id")),
        "activity": activity,
        "packet_kind": item.get("packet_kind"),
        "generated_at": generated.isoformat() if hasattr(generated, "isoformat") else generated,
        "exported_at": exported.isoformat() if hasattr(exported, "isoformat") else exported,
        "review_period": item.get("review_period") or {},
        "career_area": item.get("career_area") or "",
        "filename": item.get("filename") or "",
        "page_count": item.get("page_count"),
        "theme": item.get("theme") or "classic-dossier",
    }
