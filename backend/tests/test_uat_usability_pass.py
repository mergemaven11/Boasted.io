from __future__ import annotations

from datetime import datetime, timezone

import mongomock
from bson import ObjectId

from app import billing_details_routes, packet_audit
from app.resume_import_fast_routes import _extract_fast


def sample_packet() -> dict:
    return {
        "kind": "performance-review",
        "period": {"start_date": "2026-01-01", "end_date": "2026-09-03", "label": "2026 YTD"},
        "context": {"career_area": "Technology"},
        "render_config": {"theme": "modern-minimal"},
        # Content-like fields prove the audit helper never copies packet bodies.
        "summary": "Private packet body",
        "evidence": [{"title": "Private evidence"}],
    }


def test_packet_generation_history_is_metadata_only(monkeypatch):
    collection = mongomock.MongoClient().db.packet_export_audit
    monkeypatch.setattr(packet_audit, "packet_export_audit_collection", collection)

    history_id = packet_audit.record_packet_generation(user_id="user-1", packet=sample_packet())
    item = collection.find_one({"_id": ObjectId(history_id)})

    assert item["activity"] == "generated"
    assert item["packet_kind"] == "performance-review"
    assert item["review_period"]["label"] == "2026 YTD"
    assert item["career_area"] == "Technology"
    assert "summary" not in item
    assert "evidence" not in item
    assert "packet" not in item


def test_pdf_export_upgrades_recent_generation_without_duplicate(monkeypatch):
    collection = mongomock.MongoClient().db.packet_export_audit
    monkeypatch.setattr(packet_audit, "packet_export_audit_collection", collection)
    packet = sample_packet()

    generated_id = packet_audit.record_packet_generation(user_id="user-1", packet=packet)
    exported_id = packet_audit.record_packet_export(
        user_id="user-1",
        packet=packet,
        filename="performance-review.pdf",
        pdf_bytes=b"%PDF-1.4\n/Type /Page\n%%EOF",
    )

    assert exported_id == generated_id
    assert collection.count_documents({"user_id": "user-1"}) == 1
    item = collection.find_one({"_id": ObjectId(generated_id)})
    assert item["activity"] == "pdf_exported"
    assert item["filename"] == "performance-review.pdf"
    assert item["page_count"] == 1
    assert isinstance(item["exported_at"], datetime)


def test_billing_fallback_exposes_customer_safe_fields_only():
    user = {
        "_id": ObjectId(),
        "plan": "pro",
        "billing_status": "active",
        "billing_cancel_at_period_end": False,
        "billing_current_period_end": 1790000000,
        "stripe_customer_id": "cus_private_identifier",
        "stripe_subscription_id": "sub_private_identifier",
    }

    payload = billing_details_routes._fallback_payload(user)

    assert payload["plan"] == "pro"
    assert payload["amount"] == 9
    assert payload["currency"] == "usd"
    assert payload["interval"] == "month"
    assert payload["payment_method"] is None
    assert "stripe_customer_id" not in payload
    assert "stripe_subscription_id" not in payload


def test_fast_resume_import_accepts_text_without_mutation():
    text = "Tobias Scott\nSenior Software Engineer\nExperience\nBuilt reliable platform services and automation."
    extracted = _extract_fast("resume.txt", "text/plain", text.encode("utf-8"))
    assert extracted == text
