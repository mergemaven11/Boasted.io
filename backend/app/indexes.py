"""Document this first-party Python module."""
from __future__ import annotations

from pymongo import ASCENDING, DESCENDING


def ensure_core_indexes(db) -> dict[str, list[str]]:
    """Create BragStack's core MongoDB indexes idempotently.

    This function is intentionally not executed at import time. Operators run
    the companion script during deployment/maintenance so tests and local app
    imports never mutate a production database implicitly.
    """
    created: dict[str, list[str]] = {}

    users = db["users"]
    created["users"] = [
        users.create_index([("email", ASCENDING)], name="uniq_users_email", unique=True),
        users.create_index([("public_slug", ASCENDING)], name="uniq_users_public_slug", unique=True, sparse=True),
    ]

    entries = db["entries"]
    created["entries"] = [
        entries.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], name="entries_user_created"),
        entries.create_index([("user_id", ASCENDING), ("is_public", ASCENDING), ("created_at", DESCENDING)], name="entries_user_public_created"),
    ]

    receipts = db["impact_receipts"]
    created["impact_receipts"] = [
        receipts.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], name="receipts_user_created"),
        receipts.create_index([("user_id", ASCENDING), ("is_public", ASCENDING), ("created_at", DESCENDING)], name="receipts_user_public_created"),
        receipts.create_index([("source_entry_id", ASCENDING)], name="receipts_source_entry"),
    ]

    verification_requests = db["receipt_verification_requests"]
    created["receipt_verification_requests"] = [
        verification_requests.create_index(
            [("token_hash", ASCENDING)],
            name="uniq_receipt_verification_token",
            unique=True,
        ),
        verification_requests.create_index(
            [("receipt_id", ASCENDING), ("email", ASCENDING)],
            name="uniq_receipt_verification_pending_email",
            unique=True,
        ),
        verification_requests.create_index(
            [("expires_at", ASCENDING)],
            name="receipt_verification_ttl",
            expireAfterSeconds=0,
        ),
    ]

    resumes = db["resume_documents"]
    created["resume_documents"] = [
        resumes.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)], name="resumes_user_updated"),
    ]

    analytics_events = db["analytics_events"]
    created["analytics_events"] = [
        analytics_events.create_index(
            [("user_id", ASCENDING), ("event_type", ASCENDING), ("created_at", DESCENDING)],
            name="analytics_user_event_created",
        ),
        analytics_events.create_index(
            [("visitor_id", ASCENDING), ("created_at", DESCENDING)],
            name="analytics_visitor_created",
            sparse=True,
        ),
    ]

    rate_limits = db["rate_limits"]
    created["rate_limits"] = [
        rate_limits.create_index(
            [("expires_at", ASCENDING)],
            name="rate_limits_ttl",
            expireAfterSeconds=0,
        ),
    ]

    confidentiality = db["confidentiality_attestations"]
    created["confidentiality_attestations"] = [
        confidentiality.create_index(
            [("token_hash", ASCENDING)],
            name="uniq_confidentiality_attestation_token",
            unique=True,
        ),
        confidentiality.create_index(
            [("user_id", ASCENDING), ("issued_at", DESCENDING)],
            name="confidentiality_user_issued",
        ),
        confidentiality.create_index(
            [("purge_at", ASCENDING)],
            name="confidentiality_audit_retention_ttl",
            expireAfterSeconds=0,
        ),
    ]

    return created