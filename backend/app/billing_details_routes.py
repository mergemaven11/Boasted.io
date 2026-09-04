"""Safe customer-visible billing details sourced from Stripe when available."""
from __future__ import annotations

import os

import httpx
from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.plans import PLAN_PRICING, get_plan_for_user, open_pro_access_enabled

router = APIRouter(prefix="/billing", tags=["billing"])
STRIPE_API_BASE = "https://api.stripe.com/v1"
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")


def _fallback_payload(user: dict) -> dict:
    plan = get_plan_for_user(user)
    has_subscription = bool(user.get("stripe_subscription_id"))
    open_access = open_pro_access_enabled()
    pricing = PLAN_PRICING.get(plan, {})
    monthly = pricing.get("monthly")
    if open_access and not has_subscription:
        monthly = 0
    return {
        "plan": plan,
        "status": user.get("billing_status", "free"),
        "cancel_at_period_end": bool(user.get("billing_cancel_at_period_end", False)),
        "current_period_end": user.get("billing_current_period_end"),
        "amount": monthly,
        "currency": "usd" if monthly is not None else None,
        "interval": "month" if monthly not in {None, 0} else None,
        "payment_method": None,
        "stripe_live": False,
        "has_subscription": has_subscription,
        "open_pro_access": open_access,
        "new_paid_upgrades_enabled": not open_access,
    }


def _payment_method(payment_method: dict | None) -> dict | None:
    if not payment_method:
        return None
    card = payment_method.get("card") or {}
    if not card:
        return {"type": payment_method.get("type") or "unknown"}
    return {
        "type": "card",
        "brand": card.get("brand"),
        "last4": card.get("last4"),
        "exp_month": card.get("exp_month"),
        "exp_year": card.get("exp_year"),
        "funding": card.get("funding"),
    }


@router.get("/details")
async def billing_details(current_user: dict = Depends(get_current_user)):
    """Return customer-visible subscription and safe payment-method metadata."""
    payload = _fallback_payload(current_user)
    subscription_id = current_user.get("stripe_subscription_id")
    if not STRIPE_SECRET_KEY or not subscription_id:
        return payload

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.get(
                f"{STRIPE_API_BASE}/subscriptions/{subscription_id}",
                headers={"Authorization": f"Bearer {STRIPE_SECRET_KEY}"},
                params={"expand[]": "default_payment_method"},
            )
        if response.status_code >= 400:
            return payload
        subscription = response.json()
        first_item = ((subscription.get("items") or {}).get("data") or [{}])[0]
        price = first_item.get("price") or {}
        unit_amount = price.get("unit_amount")
        recurring = price.get("recurring") or {}
        payload.update({
            "status": subscription.get("status") or payload["status"],
            "cancel_at_period_end": bool(subscription.get("cancel_at_period_end", payload["cancel_at_period_end"])),
            "current_period_end": subscription.get("current_period_end") or payload["current_period_end"],
            "amount": (unit_amount / 100) if isinstance(unit_amount, int) else payload["amount"],
            "currency": price.get("currency") or payload["currency"],
            "interval": recurring.get("interval") or payload["interval"],
            "payment_method": _payment_method(subscription.get("default_payment_method")),
            "stripe_live": True,
            "has_subscription": True,
        })
        return payload
    except Exception:
        # Billing settings must remain usable even during a transient Stripe outage.
        return payload
