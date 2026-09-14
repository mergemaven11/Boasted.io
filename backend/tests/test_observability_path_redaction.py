"""Regression tests for secret-bearing route redaction in operational telemetry."""

import app.observability as observability
from app.ops_debug import clear_for_tests, recent_requests, record_request


def test_sanitize_request_path_redacts_private_packet_tokens():
    token = "super-secret-packet-token"
    assert observability.sanitize_request_path(f"/shared/packets/{token}") == "/shared/packets/:token"
    assert observability.sanitize_request_path(f"/shared/packets/{token}/access") == "/shared/packets/:token/access"
    assert observability.sanitize_request_path(f"/shared/packets/{token}/download.pdf") == "/shared/packets/:token/download.pdf"


def test_sanitize_request_path_redacts_receipt_verification_tokens():
    token = "secret-verification-token"
    assert observability.sanitize_request_path(f"/receipt-verifications/{token}") == "/receipt-verifications/:token"
    assert observability.sanitize_request_path(f"/receipt-verifications/{token}/decision") == "/receipt-verifications/:token/decision"


def test_in_memory_telemetry_never_keeps_secret_token():
    clear_for_tests()
    token = "never-store-me"
    record_request(
        request_id="request-1",
        method="GET",
        path=f"/shared/packets/{token}/download.pdf",
        status_code=200,
        duration_ms=12.5,
    )
    event = recent_requests(1)[0]
    assert event["path"] == "/shared/packets/:token/download.pdf"
    assert token not in str(event)


def test_persistent_telemetry_sanitizes_before_insert(monkeypatch):
    inserted = []
    monkeypatch.setattr(observability, "_ensure_indexes", lambda: None)
    monkeypatch.setattr(observability.ops_events_collection, "insert_one", lambda document: inserted.append(document))

    token = "never-persist-me"
    observability.record_persistent_request(
        request_id="request-2",
        method="POST",
        path=f"/receipt-verifications/{token}/decision",
        status_code=202,
        duration_ms=4.2,
    )

    assert inserted[0]["path"] == "/receipt-verifications/:token/decision"
    assert token not in str(inserted[0])
