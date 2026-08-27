from datetime import datetime, timedelta, timezone

import mongomock
from bson import ObjectId

from app.verification_data_migration import migrate_receipt_verification_privacy


def test_migration_preserves_live_links_and_minimizes_receipts():
    db = mongomock.MongoClient()["verification_privacy_migration"]
    receipts = db["impact_receipts"]
    requests = db["receipt_verification_requests"]
    now = datetime(2026, 8, 26, 20, 0, tzinfo=timezone.utc)
    receipt_id = ObjectId()

    receipts.insert_one({
        "_id": receipt_id,
        "user_id": "owner-1",
        "confirmations": [
            {
                "id": "live",
                "name": "Live Verifier",
                "email": "live@example.com",
                "role": "Manager",
                "confirmation_type": "stakeholder",
                "status": "pending",
                "message": "Please review this.",
                "token_hash": "live-token-hash",
                "requested_at": now - timedelta(days=1),
                "expires_at": now + timedelta(days=6),
                "confirmed_at": None,
            },
            {
                "id": "expired",
                "name": "Expired Verifier",
                "email": "expired@example.com",
                "confirmation_type": "stakeholder",
                "status": "pending",
                "message": "Old message",
                "token_hash": "expired-token-hash",
                "requested_at": now - timedelta(days=8),
                "expires_at": now - timedelta(days=1),
            },
            {
                "id": "done",
                "name": "Completed Verifier",
                "email": "done@example.com",
                "role": "Director",
                "confirmation_type": "organization",
                "status": "confirmed",
                "message": "Historical private message",
                "token_hash": "old-token-hash",
                "expires_at": now - timedelta(days=3),
                "confirmed_at": now - timedelta(days=4),
                "responded_at": now - timedelta(days=4),
            },
        ],
    })

    stats = migrate_receipt_verification_privacy(db, now=now)

    assert stats["receipts_updated"] == 1
    assert stats["active_requests_migrated"] == 1
    assert stats["expired_pending_removed"] == 1
    assert stats["completed_records_minimized"] == 1

    migrated = receipts.find_one({"_id": receipt_id})["confirmations"]
    assert [item["id"] for item in migrated] == ["live", "done"]
    live = migrated[0]
    completed = migrated[1]
    for item in (live, completed):
        assert "email" not in item
        assert "message" not in item
        assert "token_hash" not in item
    assert "expires_at" in live
    assert "expires_at" not in completed

    request = requests.find_one({"confirmation_id": "live"})
    assert request is not None
    assert request["email"] == "live@example.com"
    assert request["message"] == "Please review this."
    assert request["token_hash"] == "live-token-hash"
    stored_expires_at = request["expires_at"]
    if stored_expires_at.tzinfo is None:
        stored_expires_at = stored_expires_at.replace(tzinfo=timezone.utc)
    assert stored_expires_at == now + timedelta(days=6)
    assert requests.find_one({"confirmation_id": "expired"}) is None

    second = migrate_receipt_verification_privacy(db, now=now)
    assert second["receipts_updated"] == 0
    assert requests.count_documents({}) == 1
