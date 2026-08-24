import mongomock
import pytest
from pymongo.errors import DuplicateKeyError

from app.indexes import ensure_core_indexes


def test_core_indexes_are_created_with_expected_shapes():
    db = mongomock.MongoClient()["bragstack_test"]

    created = ensure_core_indexes(db)

    assert set(created) == {"users", "entries", "impact_receipts"}

    user_indexes = db.users.index_information()
    assert user_indexes["uniq_users_email"]["key"] == [("email", 1)]
    assert user_indexes["uniq_users_email"]["unique"] is True
    assert user_indexes["uniq_users_public_slug"]["key"] == [("public_slug", 1)]
    assert user_indexes["uniq_users_public_slug"]["unique"] is True

    entry_indexes = db.entries.index_information()
    assert entry_indexes["entries_user_created"]["key"] == [("user_id", 1), ("created_at", -1)]
    assert entry_indexes["entries_user_public_created"]["key"] == [
        ("user_id", 1),
        ("is_public", 1),
        ("created_at", -1),
    ]

    receipt_indexes = db.impact_receipts.index_information()
    assert receipt_indexes["receipts_user_created"]["key"] == [("user_id", 1), ("created_at", -1)]
    assert receipt_indexes["receipts_source_entry"]["key"] == [("source_entry_id", 1)]


def test_unique_email_index_rejects_duplicate_accounts():
    db = mongomock.MongoClient()["bragstack_test"]
    ensure_core_indexes(db)
    db.users.insert_one({"email": "person@example.com", "public_slug": "person-a"})

    with pytest.raises(DuplicateKeyError):
        db.users.insert_one({"email": "person@example.com", "public_slug": "person-b"})


def test_sparse_public_slug_allows_missing_values_but_rejects_duplicate_slug():
    db = mongomock.MongoClient()["bragstack_test"]
    ensure_core_indexes(db)
    db.users.insert_many([{"email": "one@example.com"}, {"email": "two@example.com"}])
    db.users.insert_one({"email": "three@example.com", "public_slug": "same-slug"})

    with pytest.raises(DuplicateKeyError):
        db.users.insert_one({"email": "four@example.com", "public_slug": "same-slug"})


def test_index_creation_is_idempotent():
    db = mongomock.MongoClient()["bragstack_test"]

    first = ensure_core_indexes(db)
    second = ensure_core_indexes(db)

    assert first == second
