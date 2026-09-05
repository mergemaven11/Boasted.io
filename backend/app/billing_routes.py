"""Document this first-party Python module."""
import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timedelta, timezone

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pymongo.errors import DuplicateKeyError

from app.auth import get_current_user
from app.database import stripe_webhook_events_collection, users_collection
from app.plans import (
    TEMPORARY_PRO_GIFT_CAMPAIGN,
    TEMPORARY_PRO_GIFT_NOTICE,
    get_plan_for_user,
    has_temporary_pro_gift,
)

router = APIRouter(prefix="/billing", tags=["billing"])

STRIPE_API_BASE = "https://api.stripe.com/v1"
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRO_PRICE_ID = os.getenv("STRIPE_PRO_PRICE_ID", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
STRIPE_EVENT_LEASE_SECONDS = 300


def _require_stripe_checkout_config() -> None:
    """Handle require stripe checkout config."""
    if not STRIPE_SECRET_KEY or not STRIPE_PRO_PRICE_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe billing is not configured yet.",
        )


def _require_stripe_subscription_config() -> None:
    """Handle require stripe subscription config."""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe billing is not configured yet.",
        )


def _stripe_headers() -> dict[str, str]:
    """Handle stripe headers.

    Returns:
        Function result.
    """
    return {
        "Authorization": f"Bearer {STRIPE_SECRET_KEY}",
        "Content-Type": "application/x-www-form-urlencoded",
    }


def _verify_stripe_signature(payload: bytes, signature_header: str) -> None:
    """Handle verify stripe signature.

    Args:
        payload: Function argument.
        signature_header: Function argument.
    """
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook verification is not configured.",
        )

    parts: dict[str, list[str]] = {}
    for item in signature_header.split(","):
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        parts.setdefault(key, []).append(value)

    timestamp_values = parts.get("t", [])
    signatures = parts.get("v1", [])
    if not timestamp_values or not signatures:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature header")

    timestamp = timestamp_values[0]
    try:
        timestamp_int = int(timestamp)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature timestamp") from exc

    if abs(int(time.time()) - timestamp_int) > 300:
        raise HTTPException(status_code=400, detail="Expired Stripe webhook signature")

    signed_payload = timestamp.encode("utf-8") + b"." + payload
    expected = hmac.new(
        STRIPE_WEBHOOK_SECRET.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()

    if not any(hmac.compare_digest(expected, candidate) for candidate in signatures):
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook signature")


def _claim_stripe_event(event_id: str, event_type: str) -> str:
    """Atomically claim a Stripe event. Return claimed, duplicate, or processing."""
    now = datetime.now(timezone.utc)
    lease_until = now + timedelta(seconds=STRIPE_EVENT_LEASE_SECONDS)
    document = {
        "_id": event_id,
        "event_type": event_type,
        "status": "processing",
        "created_at": now,
        "lease_until": lease_until,
    }
    try:
        stripe_webhook_events_collection.insert_one(document)
        return "claimed"
    except DuplicateKeyError:
        existing = stripe_webhook_events_collection.find_one({"_id": event_id}) or {}
        if existing.get("status") == "processed":
            return "duplicate"

        result = stripe_webhook_events_collection.update_one(
            {
                "_id": event_id,
                "status": {"$ne": "processed"},
                "lease_until": {"$lte": now},
            },
            {
                "$set": {
                    "event_type": event_type,
                    "status": "processing",
                    "lease_until": lease_until,
                    "last_claimed_at": now,
                }
            },
        )
        return "claimed" if result.modified_count else "processing"


def _mark_stripe_event_processed(event_id: str) -> None:
    """Handle mark stripe event processed.

    Args:
        event_id: Function argument.
    """
    stripe_webhook_events_collection.update_one(
        {"_id": event_id},
        {
            "$set": {
                "status": "processed",
                "processed_at": datetime.now(timezone.utc),
            },
            "$unset": {"lease_until": ""},
        },
    )


def _release_stripe_event(event_id: str) -> None:
    """Release a failed claim so Stripe can safely retry the same event."""
    stripe_webhook_events_collection.delete_one({"_id": event_id, "status": "processing"})


def _set_subscription_state(
    user_id: str,
    *,
    plan: str,
    billing_status: str,
    customer_id: str | None = None,
    subscription_id: str | None = None,
    cancel_at_period_end: bool | None = None,
    current_period_end: int | None = None,
    stripe_event_created: int | None = None,
) -> None:
    """Handle set subscription state.

    Args:
        user_id: Function argument.
        plan: Function argument.
        billing_status: Function argument.
        customer_id: Function argument.
        subscription_id: Function argument.
        cancel_at_period_end: Function argument.
        current_period_end: Function argument.
        stripe_event_created: Function argument.
    """
    if not ObjectId.is_valid(user_id):
        return

    updates = {
        "plan": plan,
        "billing_status": billing_status,
    }
    if customer_id:
        updates["stripe_customer_id"] = customer_id
    if subscription_id:
        updates["stripe_subscription_id"] = subscription_id
    if cancel_at_period_end is not None:
        updates["billing_cancel_at_period_end"] = cancel_at_period_end
    if current_period_end is not None:
        updates["billing_current_period_end"] = current_period_end
    if stripe_event_created is not None:
        updates["billing_last_stripe_event_created"] = stripe_event_created

    query: dict = {"_id": ObjectId(user_id)}
    if stripe_event_created is not None:
        query["$or"] = [
            {"billing_last_stripe_event_created": {"$exists": False}},
            {"billing_last_stripe_event_created": {"$lte": stripe_event_created}},
        ]

    users_collection.update_one(query, {"$set": updates})


def _user_id_from_subscription(subscription: dict) -> str | None:
    """Handle user id from subscription.

    Args:
        subscription: Function argument.

    Returns:
        Function result.
    """
    metadata = subscription.get("metadata") or {}
    user_id = metadata.get("user_id")
    if user_id:
        return str(user_id)

    subscription_id = subscription.get("id")
    customer_id = subscription.get("customer")
    query = {"$or": []}
    if subscription_id:
        query["$or"].append({"stripe_subscription_id": subscription_id})
    if customer_id:
        query["$or"].append({"stripe_customer_id": customer_id})
    if not query["$or"]:
        return None

    user = users_collection.find_one(query)
    return str(user["_id"]) if user else None


def _find_user_for_invoice(invoice: dict) -> dict | None:
    """Handle find user for invoice.

    Args:
        invoice: Function argument.

    Returns:
        Function result.
    """
    subscription_id = invoice.get("subscription")
    customer_id = invoice.get("customer")
    user = None
    if subscription_id:
        user = users_collection.find_one({"stripe_subscription_id": subscription_id})
    if user is None and customer_id:
        user = users_collection.find_one({"stripe_customer_id": customer_id})
    return user


def _subscription_status_payload(user: dict) -> dict:
    """Return subscription state separately from temporary promotional access."""
    promotional_access = has_temporary_pro_gift(user)
    has_subscription = bool(user.get("stripe_subscription_id"))
    return {
        "plan": get_plan_for_user(user),
        "persisted_plan": user.get("plan", "free"),
        "billing_status": user.get("billing_status", "free"),
        "cancel_at_period_end": bool(user.get("billing_cancel_at_period_end", False)),
        "current_period_end": user.get("billing_current_period_end"),
        "has_subscription": has_subscription,
        "temporary_pro_gift": promotional_access,
        "access_source": "complimentary_pro" if promotional_access else ("subscription" if has_subscription else "plan"),
        "promotional_campaign": TEMPORARY_PRO_GIFT_CAMPAIGN if promotional_access else None,
        "promotional_notice": TEMPORARY_PRO_GIFT_NOTICE if promotional_access else None,
    }


async def _update_stripe_subscription(subscription_id: str, *, cancel_at_period_end: bool) -> dict:
    """Handle update stripe subscription.

    Args:
        subscription_id: Function argument.
        cancel_at_period_end: Function argument.

    Returns:
        Function result.
    """
    _require_stripe_subscription_config()
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{STRIPE_API_BASE}/subscriptions/{subscription_id}",
            headers=_stripe_headers(),
            data={"cancel_at_period_end": "true" if cancel_at_period_end else "false"},
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe could not update this subscription.",
        )
    return response.json()


@router.post("/checkout-session")
async def create_checkout_session(current_user: dict = Depends(get_current_user)):
    """Create a Stripe Checkout subscription session for BragStack Pro."""
    if has_temporary_pro_gift(current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "complimentary_pro_active",
                "message": "BragStack Pro is temporarily complimentary for this account, so a new paid checkout is not required right now.",
                "campaign": TEMPORARY_PRO_GIFT_CAMPAIGN,
                "notice": TEMPORARY_PRO_GIFT_NOTICE,
            },
        )

    _require_stripe_checkout_config()

    if get_plan_for_user(current_user) == "pro" and current_user.get("billing_status") in {
        "active",
        "trialing",
    }:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This account already has an active BragStack Pro subscription.",
        )

    user_id = str(current_user["_id"])
    form = {
        "mode": "subscription",
        "line_items[0][price]": STRIPE_PRO_PRICE_ID,
        "line_items[0][quantity]": "1",
        "success_url": f"{FRONTEND_URL}/?billing=success",
        "cancel_url": f"{FRONTEND_URL}/?billing=cancelled#pricing",
        "client_reference_id": user_id,
        "customer_email": current_user.get("email", ""),
        "metadata[user_id]": user_id,
        "subscription_data[metadata][user_id]": user_id,
        "allow_promotion_codes": "true",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"{STRIPE_API_BASE}/checkout/sessions",
            headers=_stripe_headers(),
            data=form,
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Stripe could not create a checkout session.",
        )

    session = response.json()
    checkout_url = session.get("url")
    if not checkout_url:
        raise HTTPException(status_code=502, detail="Stripe did not return a checkout URL")

    return {"url": checkout_url}


@router.get("/status")
def billing_status(current_user: dict = Depends(get_current_user)):
    """Handle billing status.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    return _subscription_status_payload(current_user)


@router.post("/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Handle cancel subscription.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    subscription_id = current_user.get("stripe_subscription_id")
    if not subscription_id or get_plan_for_user(current_user) != "pro":
        raise HTTPException(status_code=409, detail="There is no active Pro subscription to cancel.")

    subscription = await _update_stripe_subscription(subscription_id, cancel_at_period_end=True)
    user_id = str(current_user["_id"])
    _set_subscription_state(
        user_id,
        plan="pro",
        billing_status=str(subscription.get("status") or current_user.get("billing_status") or "active"),
        customer_id=subscription.get("customer"),
        subscription_id=subscription.get("id"),
        cancel_at_period_end=True,
        current_period_end=subscription.get("current_period_end"),
    )

    refreshed = users_collection.find_one({"_id": current_user["_id"]}) or current_user
    return _subscription_status_payload(refreshed)


@router.post("/resume")
async def resume_subscription(current_user: dict = Depends(get_current_user)):
    """Handle resume subscription.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    subscription_id = current_user.get("stripe_subscription_id")
    if not subscription_id or get_plan_for_user(current_user) != "pro":
        raise HTTPException(status_code=409, detail="There is no Pro subscription to resume.")
    if not current_user.get("billing_cancel_at_period_end"):
        raise HTTPException(status_code=409, detail="This subscription is already set to renew.")

    subscription = await _update_stripe_subscription(subscription_id, cancel_at_period_end=False)
    user_id = str(current_user["_id"])
    _set_subscription_state(
        user_id,
        plan="pro",
        billing_status=str(subscription.get("status") or current_user.get("billing_status") or "active"),
        customer_id=subscription.get("customer"),
        subscription_id=subscription.get("id"),
        cancel_at_period_end=False,
        current_period_end=subscription.get("current_period_end"),
    )

    refreshed = users_collection.find_one({"_id": current_user["_id"]}) or current_user
    return _subscription_status_payload(refreshed)


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Apply Stripe subscription lifecycle events to BragStack entitlements."""
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    _verify_stripe_signature(payload, signature)

    try:
        event = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook body") from exc

    event_id = str(event.get("id") or "")
    event_type = str(event.get("type") or "")
    if not event_id or not event_type:
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook event")

    claim = _claim_stripe_event(event_id, event_type)
    if claim == "duplicate":
        return {"received": True, "duplicate": True}
    if claim == "processing":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe event is already being processed; retry later.",
        )

    created_value = event.get("created")
    event_created = int(created_value) if isinstance(created_value, (int, float)) else None
    obj = ((event.get("data") or {}).get("object") or {})

    try:
        if event_type == "checkout.session.completed":
            user_id = obj.get("client_reference_id") or (obj.get("metadata") or {}).get("user_id")
            if user_id:
                _set_subscription_state(
                    str(user_id),
                    plan="pro",
                    billing_status="active",
                    customer_id=obj.get("customer"),
                    subscription_id=obj.get("subscription"),
                    stripe_event_created=event_created,
                )

        elif event_type in {"customer.subscription.created", "customer.subscription.updated"}:
            user_id = _user_id_from_subscription(obj)
            if user_id:
                stripe_status = str(obj.get("status") or "unknown")
                paid = stripe_status in {"active", "trialing"}
                _set_subscription_state(
                    user_id,
                    plan="pro" if paid else "free",
                    billing_status=stripe_status,
                    customer_id=obj.get("customer"),
                    subscription_id=obj.get("id"),
                    cancel_at_period_end=bool(obj.get("cancel_at_period_end", False)),
                    current_period_end=obj.get("current_period_end"),
                    stripe_event_created=event_created,
                )

        elif event_type == "customer.subscription.deleted":
            user_id = _user_id_from_subscription(obj)
            if user_id:
                _set_subscription_state(
                    user_id,
                    plan="free",
                    billing_status="cancelled",
                    customer_id=obj.get("customer"),
                    subscription_id=obj.get("id"),
                    cancel_at_period_end=False,
                    current_period_end=obj.get("current_period_end"),
                    stripe_event_created=event_created,
                )

        elif event_type == "invoice.payment_failed":
            user = _find_user_for_invoice(obj)
            if user:
                _set_subscription_state(
                    str(user["_id"]),
                    plan="free",
                    billing_status="payment_failed",
                    customer_id=obj.get("customer"),
                    subscription_id=obj.get("subscription"),
                    stripe_event_created=event_created,
                )

        elif event_type == "invoice.paid":
            user = _find_user_for_invoice(obj)
            if user:
                _set_subscription_state(
                    str(user["_id"]),
                    plan="pro",
                    billing_status="active",
                    customer_id=obj.get("customer"),
                    subscription_id=obj.get("subscription"),
                    stripe_event_created=event_created,
                )

        _mark_stripe_event_processed(event_id)
    except Exception:
        _release_stripe_event(event_id)
        raise

    return {"received": True, "duplicate": False}
