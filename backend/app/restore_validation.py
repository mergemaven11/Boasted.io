"""Document this first-party Python module."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


# These collections are expected to exist in every current Boasted production
# restore. MongoDB creates other application collections lazily on first write,
# so their absence is valid when the feature has not stored data yet.
REQUIRED_COLLECTIONS = {
    "users",
    "entries",
    "impact_receipts",
    "interview_careers",
}

OPTIONAL_COLLECTIONS = {
    "packet_export_audit",
    "packet_shares",
    "beta_feedback",
}


@dataclass
class RestoreValidationResult:
    """Represent RestoreValidationResult."""
    passed: bool
    checks: dict[str, bool] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    counts: dict[str, int] = field(default_factory=dict)


def _fail(result: RestoreValidationResult, check: str, message: str) -> None:
    """Handle fail.

    Args:
        result: Function argument.
        check: Function argument.
        message: Function argument.
    """
    result.checks[check] = False
    result.errors.append(message)
    result.passed = False


def validate_restored_database(db: Any) -> RestoreValidationResult:
    """Validate an isolated restored Boasted database using read-only checks."""
    result = RestoreValidationResult(passed=True)

    available = set(db.list_collection_names())
    missing = sorted(REQUIRED_COLLECTIONS - available)
    result.checks["required_collections_present"] = not missing
    if missing:
        _fail(
            result,
            "required_collections_present",
            f"Missing required collections: {', '.join(missing)}",
        )
        return result

    # Record all known collection counts. Optional/lazy collections are reported
    # as zero when absent rather than treated as restore failures.
    for name in sorted(REQUIRED_COLLECTIONS | OPTIONAL_COLLECTIONS):
        result.counts[name] = db[name].count_documents({}) if name in available else 0
    result.checks["optional_collections_accounted_for"] = True

    users = {str(doc["_id"]) for doc in db["users"].find({}, {"_id": 1})}
    result.checks["users_readable"] = True

    owner_collections = (
        "entries",
        "impact_receipts",
        "packet_export_audit",
        "packet_shares",
        "beta_feedback",
    )
    ownership_ok = True
    for collection_name in owner_collections:
        if collection_name not in available:
            continue
        for doc in db[collection_name].find({"user_id": {"$exists": True}}):
            user_id = str(doc.get("user_id", ""))
            if not user_id or user_id not in users:
                ownership_ok = False
                result.errors.append(f"{collection_name} contains an orphaned user_id")
    result.checks["ownership_integrity"] = ownership_ok
    if not ownership_ok:
        result.passed = False

    source_links_ok = True
    for receipt in db["impact_receipts"].find(
        {"source_entry_id": {"$exists": True, "$ne": None}},
        {"source_entry_id": 1, "user_id": 1},
    ):
        entry_id = receipt.get("source_entry_id")
        entry = None
        try:
            from bson import ObjectId

            if ObjectId.is_valid(str(entry_id)):
                entry = db["entries"].find_one({"_id": ObjectId(str(entry_id))})
        except Exception:
            entry = None
        if entry is None:
            entry = db["entries"].find_one({"_id": entry_id})
        if entry and str(entry.get("user_id")) != str(receipt.get("user_id")):
            source_links_ok = False
            result.errors.append("impact_receipts contains a source entry owned by another user")
    result.checks["receipt_source_ownership"] = source_links_ok
    if not source_links_ok:
        result.passed = False

    privacy_ok = True
    for collection_name in ("entries", "impact_receipts"):
        for doc in db[collection_name].find({"is_public": {"$exists": True}}):
            if not isinstance(doc.get("is_public"), bool):
                privacy_ok = False
                result.errors.append(f"{collection_name} contains a non-boolean is_public value")

    for receipt in db["impact_receipts"].find({"evidence": {"$type": "array"}}):
        for evidence in receipt.get("evidence", []):
            if "is_public" in evidence and not isinstance(evidence.get("is_public"), bool):
                privacy_ok = False
                result.errors.append("impact_receipts evidence contains a non-boolean is_public value")

    result.checks["privacy_flags_valid"] = privacy_ok
    if not privacy_ok:
        result.passed = False

    active_careers = db["interview_careers"].count_documents({"active": True})
    catalog_ok = active_careers > 0
    result.checks["interview_catalog_readable"] = catalog_ok
    if not catalog_ok:
        _fail(result, "interview_catalog_readable", "No active interview careers found")

    result.checks["collections_readable"] = True
    return result
