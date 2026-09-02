"""Document this first-party Python module."""
import mongomock
from bson import ObjectId

from app.restore_validation import OPTIONAL_COLLECTIONS, REQUIRED_COLLECTIONS, validate_restored_database


def _restored_db(*, include_optional=True):
    """Handle restored db.

    Args:
        include_optional: Function argument.

    Returns:
        Function result.
    """
    client = mongomock.MongoClient()
    db = client["bragstack_restore_test"]
    for name in REQUIRED_COLLECTIONS:
        db.create_collection(name)
    if include_optional:
        for name in OPTIONAL_COLLECTIONS:
            db.create_collection(name)
    db.interview_careers.insert_one(
        {
            "slug": "software-engineer",
            "active": True,
            "questions": [{"question_id": "behavioral-01", "text": "Tell me about a production incident."}],
        }
    )
    return db


def test_restore_validator_passes_valid_restored_database():
    """Verify restore validator passes valid restored database."""
    db = _restored_db()
    user_id = ObjectId()
    entry_id = ObjectId()

    db.users.insert_one({"_id": user_id, "email": "restore@example.com"})
    db.entries.insert_one(
        {
            "_id": entry_id,
            "user_id": str(user_id),
            "title": "Restored accomplishment",
            "is_public": False,
        }
    )
    db.impact_receipts.insert_one(
        {
            "_id": ObjectId(),
            "user_id": str(user_id),
            "source_entry_id": str(entry_id),
            "is_public": True,
            "evidence": [{"title": "Private proof", "is_public": False}],
        }
    )

    result = validate_restored_database(db)

    assert result.passed is True
    assert all(result.checks.values())
    assert result.counts["users"] == 1
    assert result.counts["entries"] == 1
    assert result.counts["impact_receipts"] == 1
    assert result.counts["interview_careers"] == 1
    assert result.errors == []


def test_restore_validator_allows_absent_lazy_optional_collections():
    """Verify restore validator allows absent lazy optional collections."""
    db = _restored_db(include_optional=False)
    user_id = ObjectId()
    db.users.insert_one({"_id": user_id, "email": "restore@example.com"})

    result = validate_restored_database(db)

    assert result.passed is True
    assert result.checks["required_collections_present"] is True
    assert result.checks["optional_collections_accounted_for"] is True
    for name in OPTIONAL_COLLECTIONS:
        assert result.counts[name] == 0


def test_restore_validator_fails_when_required_collection_is_missing():
    """Verify restore validator fails when required collection is missing."""
    db = _restored_db()
    db.drop_collection("users")

    result = validate_restored_database(db)

    assert result.passed is False
    assert result.checks["required_collections_present"] is False
    assert any("users" in error for error in result.errors)


def test_restore_validator_fails_for_orphaned_user_owned_record():
    """Verify restore validator fails for orphaned user owned record."""
    db = _restored_db()
    db.entries.insert_one(
        {
            "_id": ObjectId(),
            "user_id": str(ObjectId()),
            "title": "Orphan",
            "is_public": False,
        }
    )

    result = validate_restored_database(db)

    assert result.passed is False
    assert result.checks["ownership_integrity"] is False
    assert any("orphaned user_id" in error for error in result.errors)


def test_restore_validator_fails_cross_user_receipt_source_link():
    """Verify restore validator fails cross user receipt source link."""
    db = _restored_db()
    owner_a = ObjectId()
    owner_b = ObjectId()
    entry_id = ObjectId()

    db.users.insert_many([{"_id": owner_a}, {"_id": owner_b}])
    db.entries.insert_one({"_id": entry_id, "user_id": str(owner_a), "is_public": False})
    db.impact_receipts.insert_one(
        {
            "_id": ObjectId(),
            "user_id": str(owner_b),
            "source_entry_id": str(entry_id),
            "is_public": False,
            "evidence": [],
        }
    )

    result = validate_restored_database(db)

    assert result.passed is False
    assert result.checks["receipt_source_ownership"] is False
    assert any("another user" in error for error in result.errors)


def test_restore_validator_fails_invalid_privacy_flags():
    """Verify restore validator fails invalid privacy flags."""
    db = _restored_db()
    user_id = ObjectId()

    db.users.insert_one({"_id": user_id})
    db.entries.insert_one({"_id": ObjectId(), "user_id": str(user_id), "is_public": "false"})
    db.impact_receipts.insert_one(
        {
            "_id": ObjectId(),
            "user_id": str(user_id),
            "is_public": False,
            "evidence": [{"is_public": "false"}],
        }
    )

    result = validate_restored_database(db)

    assert result.passed is False
    assert result.checks["privacy_flags_valid"] is False
    assert sum("non-boolean is_public" in error for error in result.errors) == 2


def test_restore_validator_fails_when_interview_catalog_has_no_active_careers():
    """Verify restore validator fails when interview catalog has no active careers."""
    db = _restored_db()
    db.interview_careers.update_many({}, {"$set": {"active": False}})

    result = validate_restored_database(db)

    assert result.passed is False
    assert result.checks["interview_catalog_readable"] is False
    assert any("No active interview careers" in error for error in result.errors)
