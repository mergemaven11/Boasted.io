"""Account-closure cleanup helpers.

The closure path removes the account record and user-owned product data while
leaving narrowly scoped operational, billing, security, source-governance, and legal
records that may need to be retained under Boasted's published privacy/compliance policy.
"""
from __future__ import annotations

from bson import ObjectId


OWNER_FIELDS = (
    "user_id",
    "owner_user_id",
    "requester_user_id",
    "created_by_user_id",
)

# These collections are intentionally excluded from self-service deletion.
# They contain operational/security/billing/legal/source-governance records rather
# than a user's career workspace. Education source audit receipts intentionally omit
# raw member evidence, queries, locations, API credentials, and full upstream records.
RETAINED_COLLECTIONS = {
    "ops_audit",
    "ops_events",
    "stripe_webhook_events",
    "rate_limits",
    "ai_verification_events",
    "compliance_audit_runs",
    "confidentiality_attestations",
    "education_source_audit_events",
}


def _user_id_variants(user_id: str) -> list[object]:
    """Return string/ObjectId forms used by historical collections."""
    variants: list[object] = [user_id]
    if ObjectId.is_valid(user_id):
        variants.append(ObjectId(user_id))
    return variants


def purge_user_owned_data(db, user_id: str) -> dict[str, int]:
    """Delete user-owned documents from every non-retained collection.

    Boasted's user-owned collections consistently carry a user ownership
    field. Scanning the database's current collection list makes closure cover
    newer product collections without requiring every feature to be hard-coded
    here, while the retained allow-list prevents deletion of records that may
    have a separate compliance, legal, source-governance, or security retention purpose.
    """
    variants = _user_id_variants(user_id)
    ownership_query = {
        "$or": [{field: {"$in": variants}} for field in OWNER_FIELDS],
    }
    deleted: dict[str, int] = {}

    for collection_name in db.list_collection_names():
        if collection_name == "users" or collection_name in RETAINED_COLLECTIONS:
            continue
        result = db[collection_name].delete_many(ownership_query)
        if result.deleted_count:
            deleted[collection_name] = int(result.deleted_count)

    return deleted


def close_user_account(db, user_id: str) -> dict[str, object]:
    """Permanently remove the user account and its user-owned product data."""
    if not ObjectId.is_valid(user_id):
        raise ValueError("Invalid user id")

    object_id = ObjectId(user_id)
    if db["users"].find_one({"_id": object_id}, {"_id": 1}) is None:
        raise LookupError("Account not found")

    deleted_by_collection = purge_user_owned_data(db, user_id)
    user_result = db["users"].delete_one({"_id": object_id})
    if user_result.deleted_count != 1:
        raise RuntimeError("Account could not be closed")

    return {
        "account_deleted": True,
        "deleted_records": sum(deleted_by_collection.values()),
        "deleted_by_collection": deleted_by_collection,
    }
