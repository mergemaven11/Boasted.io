"""Document this first-party Python module."""
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
    """Create a signed Stripe-style webhook request."""
    payload = json.dumps(event, separators=(",", ":")).encode("utf-8")
    timestamp = str(int(time.time()))
    digest = hmac.new(
        TEST_WEBHOOK_SECRET.encode("utf-8"),
        timestamp.encode("utf-8") + b"." + payload,
        hashlib.sha256,
    ).hexdigest()
    return payload, {"stripe-signature": f"t={timestamp},v1={digest}"}


def _use_mock_billing_db(monkeypatch):
    """Point billing persistence at an isolated in-memory database."""
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
    """Verify duplicate Stripe events do not repeat their side effect."""
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = str(ObjectId())
    calls: list[tuple[str, dict]] = []

    def record_link(received_user_id: str, **kwargs):
        calls.append((received_user_id, kwargs))

    monkeypatch.setattr(billing_routes, "_link_stripe_checkout", record_link)
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
    assert calls[0][1]["customer_id"] == "cus_test"
    assert calls[0][1]["subscription_id"] == "sub_test"
    assert mock_db["stripe_webhook_events"].count_documents({}) == 1
    stored = mock_db["stripe_webhook_events"].find_one({"_id": event["id"]})
    assert stored["status"] == "processed"
    assert "processed_at" in stored


def test_checkout_completion_links_stripe_ids_without_granting_pro(monkeypatch):
    """Checkout completion alone must not be treated as authoritative payment state."""
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = ObjectId()
    mock_db["users"].insert_one(
        {"_id": user_id, "email": "checkout@example.com", "plan": "free", "billing_status": "free"}
    )
    event = {
        "id": "evt_checkout_links_only",
        "created": 1_780_000_010,
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "client_reference_id": str(user_id),
                "customer": "cus_checkout",
                "subscription": "sub_checkout",
            }
        },
    }
    payload, headers = _signed_request(event)

    response = client.post("/billing/webhook", content=payload, headers=headers)

    assert response.status_code == 200
    user = mock_db["users"].find_one({"_id": user_id})
    assert user["plan"] == "free"
    assert user["billing_status"] == "free"
    assert user["stripe_customer_id"] == "cus_checkout"
    assert user["stripe_subscription_id"] == "sub_checkout"


def test_past_due_subscription_keeps_pro_during_dunning_grace(monkeypatch):
    """A past-due subscription keeps access while Stripe is still dunning."""
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = ObjectId()
    mock_db["users"].insert_one(
        {"_id": user_id, "email": "grace@example.com", "plan": "pro", "billing_status": "active"}
    )
    event = {
        "id": "evt_subscription_past_due",
        "created": 1_780_000_020,
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_grace",
                "customer": "cus_grace",
                "status": "past_due",
                "metadata": {"user_id": str(user_id)},
                "cancel_at_period_end": False,
                "current_period_end": 1_781_000_000,
            }
        },
    }
    payload, headers = _signed_request(event)

    response = client.post("/billing/webhook", content=payload, headers=headers)

    assert response.status_code == 200
    user = mock_db["users"].find_one({"_id": user_id})
    assert user["plan"] == "pro"
    assert user["billing_status"] == "past_due"


def test_unpaid_subscription_removes_pro(monkeypatch):
    """Stripe's terminal unpaid state removes paid entitlement."""
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = ObjectId()
    mock_db["users"].insert_one(
        {"_id": user_id, "email": "unpaid@example.com", "plan": "pro", "billing_status": "past_due"}
    )
    event = {
        "id": "evt_subscription_unpaid",
        "created": 1_780_000_030,
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": "sub_unpaid",
                "customer": "cus_unpaid",
                "status": "unpaid",
                "metadata": {"user_id": str(user_id)},
                "cancel_at_period_end": False,
            }
        },
    }
    payload, headers = _signed_request(event)

    response = client.post("/billing/webhook", content=payload, headers=headers)

    assert response.status_code == 200
    user = mock_db["users"].find_one({"_id": user_id})
    assert user["plan"] == "free"
    assert user["billing_status"] == "unpaid"


def test_invoice_payment_failed_does_not_revoke_subscription_access(monkeypatch):
    """Invoice failure is informational; subscription lifecycle owns entitlement."""
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = ObjectId()
    mock_db["users"].insert_one(
        {
            "_id": user_id,
            "email": "invoice@example.com",
            "plan": "pro",
            "billing_status": "active",
            "stripe_customer_id": "cus_invoice",
            "stripe_subscription_id": "sub_invoice",
        }
    )
    event = {
        "id": "evt_invoice_failed",
        "created": 1_780_000_040,
        "type": "invoice.payment_failed",
        "data": {"object": {"customer": "cus_invoice", "subscription": "sub_invoice"}},
    }
    payload, headers = _signed_request(event)

    response = client.post("/billing/webhook", content=payload, headers=headers)

    assert response.status_code == 200
    user = mock_db["users"].find_one({"_id": user_id})
    assert user["plan"] == "pro"
    assert user["billing_status"] == "active"


def test_invoice_paid_cannot_grant_pro_by_itself(monkeypatch):
    """A paid invoice cannot independently grant subscription entitlement."""
    mock_db = _use_mock_billing_db(monkeypatch)
    user_id = ObjectId()
    mock_db["users"].insert_one(
        {
            "_id": user_id,
            "email": "invoice-paid@example.com",
            "plan": "free",
            "billing_status": "unpaid",
            "stripe_customer_id": "cus_invoice_paid",
            "stripe_subscription_id": "sub_invoice_paid",
        }
    )
    event = {
        "id": "evt_invoice_paid",
        "created": 1_780_000_050,
        "type": "invoice.paid",
        "data": {"object": {"customer": "cus_invoice_paid", "subscription": "sub_invoice_paid"}},
    }
    payload, headers = _signed_request(event)

    response = client.post("/billing/webhook", content=payload, headers=headers)

    assert response.status_code == 200
    user = mock_db["users"].find_one({"_id": user_id})
    assert user["plan"] == "free"
    assert user["billing_status"] == "unpaid"


def test_older_stripe_event_cannot_regress_newer_subscription_state(monkeypatch):
    """Verify older Stripe events cannot regress newer subscription state."""
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
    """Verify failed webhook processing releases its event claim for retry."""
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

    monkeypatch.setattr(billing_routes, "_link_stripe_checkout", fail_once)
    failed = client_without_server_exceptions.post("/billing/webhook", content=payload, headers=headers)
    assert failed.status_code == 500
    assert mock_db["stripe_webhook_events"].find_one({"_id": event["id"]}) is None

    calls = []

    def succeed(received_user_id: str, **kwargs):
        calls.append((received_user_id, kwargs))

    monkeypatch.setattr(billing_routes, "_link_stripe_checkout", succeed)
    retried = client.post("/billing/webhook", content=payload, headers=headers)

    assert retried.status_code == 200
    assert retried.json() == {"received": True, "duplicate": False}
    assert len(calls) == 1
    stored = mock_db["stripe_webhook_events"].find_one({"_id": event["id"]})
    assert stored["status"] == "processed"


def test_malformed_signed_event_is_rejected_before_claim(monkeypatch):
    """Verify malformed signed events are rejected before a claim is recorded."""
    mock_db = _use_mock_billing_db(monkeypatch)
    event = {
        "created": 1_780_000_200,
        "type": "invoice.paid",
        "data": {"object": {}},
    }
    payload, headers = _signed_request(event)

    response = client.post("/billing/webhook", content=payload, headers=headers)

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid Stripe webhook event"
    assert mock_db["stripe_webhook_events"].count_documents({}) == 0
