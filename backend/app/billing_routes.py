import hashlib
import hmac
import json
import os
import time
from urllib.parse import parse_qs

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.auth import get_current_user
from app.database import users_collection
from app.plans import get_plan_for_user

router = APIRouter(prefix="/billing", tags=["billing"])

STRIPE_API_BASE = "https://api.stripe.com/v1"
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRO_PRICE_ID = os.getenv("STRIPE_PRO_PRICE_ID", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _require_stripe_checkout_config() -> None:
    if not STRIPE_SECRET_KEY or not STRIPE_PRO_PRICE_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe billing is not configured yet.",
        )


def _stripe_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {STRIPE_SECRET_KEY}",
        "Content-Type": "application/x-www-form-urlencoded",
    }


def _verify_stripe_signature(payload: bytes, signature_header: str) -> None:
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


def _set_subscription_state(
    user_id: str,
    *,
    plan: str,
    billing_status: str,
    customer_id: str | None = None,
    subscription_id: str | None = None,
) -> None:
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

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": updates},
    )


def _user_id_from_subscription(subscription: dict) -> str | None:
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


@router.post("/checkout-session")
async def create_checkout_session(current_user: dict = Depends(get_current_user)):
    """Create a Stripe Checkout subscription session for BragStack Pro."""
    _require_stripe_checkout_config()

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
    return {
        "plan": get_plan_for_user(current_user),
        "billing_status": current_user.get("billing_status", "free"),
    }


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

    event_type = event.get("type")
    obj = ((event.get("data") or {}).get("object") or {})

    if event_type == "checkout.session.completed":
        user_id = obj.get("client_reference_id") or (obj.get("metadata") or {}).get("user_id")
        if user_id:
            _set_subscription_state(
                str(user_id),
                plan="pro",
                billing_status="active",
                customer_id=obj.get("customer"),
                subscription_id=obj.get("subscription"),
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
            )

    elif event_type == "invoice.payment_failed":
        subscription_id = obj.get("subscription")
        customer_id = obj.get("customer")
        user = None
        if subscription_id:
            user = users_collection.find_one({"stripe_subscription_id": subscription_id})
        if user is None and customer_id:
            user = users_collection.find_one({"stripe_customer_id": customer_id})
        if user:
            _set_subscription_state(
                str(user["_id"]),
                plan="free",
                billing_status="payment_failed",
                customer_id=customer_id,
                subscription_id=subscription_id,
            )

    return {"received": True}
