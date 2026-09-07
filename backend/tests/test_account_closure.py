"""Account-closure deletion and retention boundary tests."""

import mongomock
from bson import ObjectId

from app.account_closure import close_user_account, purge_user_owned_data


def _db():
    return mongomock.MongoClient()["bragstack_test"]


def test_purge_removes_only_target_users_owned_product_data():
    db = _db()
    target_id = str(ObjectId())
    other_id = str(ObjectId())

    db["entries"].insert_many(
        [
            {"user_id": target_id, "title": "target"},
            {"user_id": other_id, "title": "other"},
        ]
    )
    db["impact_receipts"].insert_many(
        [
            {"user_id": target_id, "accomplishment": "target"},
            {"user_id": other_id, "accomplishment": "other"},
        ]
    )
    db["future_product_collection"].insert_many(
        [
            {"owner_user_id": target_id, "value": 1},
            {"owner_user_id": other_id, "value": 2},
        ]
    )

    deleted = purge_user_owned_data(db, target_id)

    assert deleted["entries"] == 1
    assert deleted["impact_receipts"] == 1
    assert deleted["future_product_collection"] == 1
    assert db["entries"].count_documents({"user_id": target_id}) == 0
    assert db["entries"].count_documents({"user_id": other_id}) == 1
    assert db["future_product_collection"].count_documents({"owner_user_id": other_id}) == 1


def test_purge_preserves_retained_security_billing_legal_and_source_audit_records():
    db = _db()
    target_id = str(ObjectId())

    retained = (
        "ops_audit",
        "ops_events",
        "stripe_webhook_events",
        "rate_limits",
        "ai_verification_events",
        "compliance_audit_runs",
        "confidentiality_attestations",
        "education_source_audit_events",
    )
    for collection_name in retained:
        db[collection_name].insert_one({"user_id": target_id, "event": collection_name})

    purge_user_owned_data(db, target_id)

    for collection_name in retained:
        assert db[collection_name].count_documents({"user_id": target_id}) == 1


def test_close_user_account_deletes_account_and_user_owned_workspace_data():
    db = _db()
    target_object_id = ObjectId()
    target_id = str(target_object_id)

    db["users"].insert_one({"_id": target_object_id, "email": "target@example.com"})
    db["entries"].insert_one({"user_id": target_id, "title": "one"})
    db["resume_documents"].insert_one({"user_id": target_id, "resume": "content"})
    db["receipt_verification_requests"].insert_one({"user_id": target_id, "email": "verifier@example.com"})

    result = close_user_account(db, target_id)

    assert result["account_deleted"] is True
    assert result["deleted_records"] == 3
    assert db["users"].find_one({"_id": target_object_id}) is None
    assert db["entries"].count_documents({"user_id": target_id}) == 0
    assert db["resume_documents"].count_documents({"user_id": target_id}) == 0
    assert db["receipt_verification_requests"].count_documents({"user_id": target_id}) == 0


def test_close_user_account_rejects_unknown_account_without_deleting_other_data():
    db = _db()
    missing_id = str(ObjectId())
    other_id = str(ObjectId())
    db["entries"].insert_one({"user_id": other_id, "title": "keep"})

    try:
        close_user_account(db, missing_id)
    except LookupError:
        pass
    else:
        raise AssertionError("Expected LookupError")

    assert db["entries"].count_documents({"user_id": other_id}) == 1
