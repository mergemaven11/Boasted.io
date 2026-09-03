"""Tests for first-party founder and per-user analytics."""
from datetime import datetime, timedelta, timezone

import mongomock
from bson import ObjectId

from app import ops_routes, ops_user_routes, profile_connection_routes


def _patch_founder_collections(monkeypatch, db):
    monkeypatch.setattr(ops_routes, "users_collection", db.users)
    monkeypatch.setattr(ops_routes, "entries_collection", db.entries)
    monkeypatch.setattr(ops_routes, "impact_receipts_collection", db.impact_receipts)
    monkeypatch.setattr(ops_routes, "packet_export_audit_collection", db.packet_export_audit)
    monkeypatch.setattr(ops_routes, "analytics_events_collection", db.analytics_events)
    monkeypatch.setattr(ops_routes, "ops_events_collection", db.ops_events)


def _patch_user_collections(monkeypatch, db):
    monkeypatch.setattr(ops_user_routes, "entries_collection", db.entries)
    monkeypatch.setattr(ops_user_routes, "impact_receipts_collection", db.impact_receipts)
    monkeypatch.setattr(ops_user_routes, "packet_export_audit_collection", db.packet_export_audit)
    monkeypatch.setattr(ops_user_routes, "resume_documents_collection", db.resume_documents)
    monkeypatch.setattr(ops_user_routes, "analytics_events_collection", db.analytics_events)


def test_founder_analytics_uses_real_first_party_metadata(monkeypatch):
    db = mongomock.MongoClient()["analytics_test"]
    _patch_founder_collections(monkeypatch, db)
    now = datetime.now(timezone.utc)

    user_a = ObjectId()
    user_b = ObjectId()
    db.users.insert_many(
        [
            {
                "_id": user_a,
                "email": "a@example.com",
                "created_at": (now - timedelta(hours=2)).isoformat(),
                "public_slug": "person-a",
                "plan": "pro",
            },
            {
                "_id": user_b,
                "email": "b@example.com",
                "created_at": (now - timedelta(days=40)).isoformat(),
                "plan": "free",
            },
        ]
    )
    db.entries.insert_many(
        [
            {"user_id": str(user_a), "created_at": now - timedelta(hours=1), "updated_at": now - timedelta(hours=1)},
            {"user_id": str(user_b), "created_at": now - timedelta(days=5), "updated_at": now - timedelta(days=5)},
        ]
    )
    db.impact_receipts.insert_one(
        {
            "user_id": str(user_a),
            "created_at": now - timedelta(minutes=45),
            "evidence": [{"title": "proof"}],
            "confirmations": [{"status": "confirmed"}],
        }
    )
    db.packet_export_audit.insert_one(
        {"user_id": str(user_a), "generated_at": now - timedelta(minutes=30), "packet_kind": "promotion"}
    )
    db.analytics_events.insert_many(
        [
            {"user_id": str(user_a), "event_type": "profile_view", "visitor_id": "visitor-1", "created_at": now - timedelta(minutes=20)},
            {"user_id": str(user_a), "event_type": "profile_view", "visitor_id": "visitor-2", "created_at": now - timedelta(minutes=15)},
            {"user_id": str(user_a), "event_type": "open_to_talk_click", "visitor_id": "visitor-1", "created_at": now - timedelta(minutes=10)},
        ]
    )
    db.ops_events.insert_many(
        [
            {"created_at": now, "method": "GET", "path": "/health", "status_code": 200, "duration_ms": 20},
            {"created_at": now, "method": "GET", "path": "/ops/overview", "status_code": 500, "duration_ms": 900},
        ]
    )

    result = ops_routes._founder_analytics()

    assert result["users"]["total"] == 2
    assert result["users"]["new_today"] == 1
    assert result["users"]["activation_rate"] == 100.0
    assert result["users"]["receipt_adoption_rate"] == 50.0
    assert result["funnel"]["packet_generated"] == 1
    assert result["engagement"]["evidence_attachment_rate"] == 100.0
    assert result["profiles"]["views_30d"] == 2
    assert result["profiles"]["unique_visitors_30d"] == 2
    assert result["profiles"]["open_to_talk_conversion_rate"] == 50.0
    assert result["business"]["pro_subscribers"] == 1
    assert result["api"]["sample_size"] == 2
    assert result["api"]["server_error_rate"] == 50.0


def test_user_analytics_describes_evidence_journey_without_private_content(monkeypatch):
    db = mongomock.MongoClient()["user_analytics_test"]
    _patch_user_collections(monkeypatch, db)
    now = datetime.now(timezone.utc)
    user_id = ObjectId()
    user = {
        "_id": user_id,
        "email": "person@example.com",
        "name": "Person",
        "headline": "Platform Engineer",
        "bio": "Career proof",
        "location": "Atlanta",
        "public_slug": "person",
        "open_to_talk": True,
        "created_at": (now - timedelta(days=10)).isoformat(),
    }
    uid = str(user_id)

    db.entries.insert_one(
        {
            "user_id": uid,
            "created_at": now - timedelta(days=9),
            "updated_at": now - timedelta(days=1),
            "tags": ["Docker", "Kubernetes"],
            "is_public": True,
            "description": "This private content must never be returned by analytics.",
        }
    )
    db.impact_receipts.insert_one(
        {
            "user_id": uid,
            "created_at": now - timedelta(days=8),
            "updated_at": now - timedelta(hours=20),
            "skills": ["Docker"],
            "evidence": [{"title": "private proof"}],
            "confirmations": [{"status": "confirmed"}],
            "is_public": True,
            "result": "Private result text",
        }
    )
    db.packet_export_audit.insert_one(
        {"user_id": uid, "generated_at": now - timedelta(days=7), "packet_kind": "promotion"}
    )
    db.analytics_events.insert_many(
        [
            {"user_id": uid, "event_type": "profile_view", "visitor_id": "v1", "created_at": now - timedelta(days=1)},
            {"user_id": uid, "event_type": "open_to_talk_click", "visitor_id": "v1", "created_at": now - timedelta(hours=12)},
        ]
    )

    result = ops_user_routes._user_analytics(user)

    assert result["activation_status"] == "published"
    assert result["dormancy_status"] == "active"
    assert result["career_evidence_score"] > 50
    assert result["evidence"]["skills_documented"] == 2
    assert result["evidence"]["evidence_attachment_rate"] == 100.0
    assert result["evidence"]["confirmation_rate"] == 100.0
    assert result["profile_engagement_30d"]["views"] == 1
    assert result["profile_engagement_30d"]["open_to_talk_conversion_rate"] == 100.0
    assert "description" not in str(result)
    assert "Private result text" not in str(result)


def test_public_profile_view_events_are_deduplicated_for_30_minutes(monkeypatch):
    db = mongomock.MongoClient()["public_analytics_test"]
    user = {"_id": ObjectId(), "public_slug": "person"}
    monkeypatch.setattr(profile_connection_routes, "analytics_events_collection", db.analytics_events)
    monkeypatch.setattr(profile_connection_routes, "get_user_by_public_slug", lambda slug: user)

    payload = profile_connection_routes.PublicProfileAnalyticsEvent(
        event_type="profile_view",
        visitor_id="visitor-1",
        referrer_host="linkedin.com",
    )
    first = profile_connection_routes.record_public_profile_analytics("person", payload)
    second = profile_connection_routes.record_public_profile_analytics("person", payload)

    assert first == {"recorded": True, "deduplicated": False}
    assert second == {"recorded": False, "deduplicated": True}
    assert db.analytics_events.count_documents({}) == 1
    stored = db.analytics_events.find_one({})
    assert stored["referrer_host"] == "linkedin.com"
    assert "ip" not in stored
    assert "user_agent" not in stored
