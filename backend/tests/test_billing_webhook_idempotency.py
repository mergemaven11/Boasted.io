import hashlib
import hmac
import json
import time

import mongomock
from bson import ObjectId
from fastapi.testclient import TestClient

import app.billing_routes as billing_routes
from app.main import app


TEST_WEBHOOK_SECRET = "whsec_bragstack_test"
client = TestClient(app)
client_without_server_exceptions = TestClient(app, raise_server_exceptions=False)


def _signed_request(event: dict) -> tuple[bytes, dict[str, str]]:
    payload = json.dumps(event, separators=(",", ":")).encode("utf-8")
    timestamp = str(int(time.time()))
    digest = hmac.new(
        TEST_WEBHOOK_SECRET.encode("utf-8"),
        timestamp.encode("utf-8") + b"." + payload,
        hashlib.sha256,
    ).hexdigest()
    return payload, {"stripe-signature": f"t={timestamp},v1={digest}"}


def _use_mock_billing_db(monkeypatch):
    mock_db = mongomock.MongoClient()["bragstack_test"]
    monkeypatch.setattr(billing_routes, "users_collection", mock_db["users"])
    monkeypatch.setattr(
        billing_routes,
        "stripe_webhook_events_collection",
        mock_db["stripe_webhook_events"],
    )
    monkeypatch.setattr(billing_routes, "STRIPE_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET)
    return mock_db


def test_duplicate_stripe_event_is_processed_once(monkeypatch):
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = str(ObjectId())
    calls: list[tuple[str, dict]] = []

    def record_state_change(received_user_id: str, **kwargs):
        calls.append((received_user_id, kwargs))

    monkeypatch.setattr(billing_routes, "_set_subscription_state", record_state_change)
    event = {
        "id": "evt_duplicate_checkout",
        "created": 1_780_000_000,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": user_id,
                "customer": "cus_test",
                "subscription": "sub_test",
            }
        },
    }
    payload, headers = _signed_request(event)

    first = client.post("/billing/webhook", content=payload, headers=headers)
    second = client.post("/billing/webhook", content=payload, headers=headers)

    assert first.status_code == 200
    assert first.json() == {"received": True, "duplicate": False}
    assert second.status_code == 200
    assert second.json() == {"received": True, "duplicate": True}
    assert len(calls) == 1
    assert calls[0][0] == user_id
    assert mock_db["stripe_webhook_events"].count_documents({}) == 1
    stored = mock_db["stripe_webhook_events"].find_one({"_id": event["id"]})
    assert stored["status"] == "processed"
    assert "processed_at" in stored


def test_older_stripe_event_cannot_regress_newer_subscription_state(monkeypatch):
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = ObjectId()
    billing_routes.users_collection.insert_one(
        {
            "_id": user_id,
            "email": "billing@example.com",
            "plan": "free",
            "billing_status": "free",
        }
    )

    billing_routes._set_subscription_state(
        str(user_id),
        plan="pro",
        billing_status="active",
        customer_id="cus_test",
        subscription_id="sub_test",
        stripe_event_created=200,
    )
    billing_routes._set_subscription_state(
        str(user_id),
        plan="free",
        billing_status="cancelled",
        customer_id="cus_test",
        subscription_id="sub_test",
        stripe_event_created=100,
    )

    user = billing_routes.users_collection.find_one({"_id": user_id})
    assert user["plan"] == "pro"
    assert user["billing_status"] == "active"
    assert user["billing_last_stripe_event_created"] == 200
    assert mock_db["users"].count_documents({}) == 1


def test_failed_webhook_processing_releases_claim_for_retry(monkeypatch):
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = str(ObjectId())
    event = {
        "id": "evt_retry_after_failure",
        "created": 1_780_000_100,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": user_id,
                "customer": "cus_retry",
                "subscription": "sub_retry",
            }
        },
    }
    payload, headers = _signed_request(event)

    def fail_once(*args, **kwargs):
        raise RuntimeError("simulated processing failure")

    monkeypatch.setattr(billing_routes, "_set_subscription_state", fail_once)
    failed = client_without_server_exceptions.post("/billing/webhook", content=payload, headers=headers)
    assert failed.status_code == 500
    assert mock_db["stripe_webhook_events"].find_one({"_id": event["id"]}) is None

    calls = []

    def succeed(received_user_id: str, **kwargs):
        calls.append((received_user_id, kwargs))

    monkeypatch.setattr(billing_routes, "_set_subscription_state", succeed)
    retried = client.post("/billing/webhook", content=payload, headers=headers)

    assert retried.status_code == 200
    assert retried.json() == {"received": True, "duplicate": False}
    assert len(calls) == 1
    stored = mock_db["stripe_webhook_events"].find_one({"_id": event["id"]})
    assert stored["status"] == "processed"
