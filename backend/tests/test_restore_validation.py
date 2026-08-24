import mongomock
from bson import ObjectId

from app.restore_validation import REQUIRED_COLLECTIONS, validate_restored_database


def _restored_db():
    client = mongomock.MongoClient()
    db = client["bragstack_restore_test"]
    for name in REQUIRED_COLLECTIONS:
        db.create_collection(name)
    return db


def test_restore_validator_passes_valid_restored_database():
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
    assert result.errors == []


def test_restore_validator_fails_when_required_collection_is_missing():
    db = _restored_db()
    db.drop_collection("packet_shares")

    result = validate_restored_database(db)

    assert result.passed is False
    assert result.checks["required_collections_present"] is False
    assert any("packet_shares" in error for error in result.errors)


def test_restore_validator_fails_for_orphaned_user_owned_record():
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
    db = _restored_db()
    owner_a = ObjectId()
    owner_b = ObjectId()
    entry_id = ObjectId()

    db.users.insert_many([{"_id": owner_a}, {"_id": owner_b}])
    db.entries.insert_one(
        {"_id": entry_id, "user_id": str(owner_a), "is_public": False}
    )
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
    db = _restored_db()
    user_id = ObjectId()

    db.users.insert_one({"_id": user_id})
    db.entries.insert_one(
        {
            "_id": ObjectId(),
            "user_id": str(user_id),
            "is_public": "false",
        }
    )
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
