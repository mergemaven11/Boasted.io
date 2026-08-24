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

    resumes = db["resume_documents"]
    created["resume_documents"] = [
        resumes.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)], name="resumes_user_updated"),
    ]

    return created
