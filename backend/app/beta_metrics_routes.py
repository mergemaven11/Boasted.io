"""Document this first-party Python module."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import beta_feedback_collection, impact_receipts_collection


router = APIRouter(prefix="/beta", tags=["beta"])


class BetaFeedbackCreate(BaseModel):
    """Represent BetaFeedbackCreate."""
    willingness_to_pay: Literal["yes", "maybe", "no"]
    willing_price_cents: int | None = Field(default=None, ge=0, le=100000)
    would_miss_score: int = Field(..., ge=1, le=5)
    would_miss_text: str = Field(default="", max_length=2000)
    primary_value: str = Field(default="", max_length=500)


def _receipt_dates(user_id: str) -> list[str]:
    """Handle receipt dates.

    Args:
        user_id: Function argument.

    Returns:
        Function result.
    """
    dates = []
    for receipt in impact_receipts_collection.find({"user_id": user_id}):
        value = receipt.get("created_at")
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            dates.append(value.astimezone(timezone.utc).date().isoformat())
    return sorted(set(dates))


def _user_product_metrics(user_id: str) -> dict:
    """Handle user product metrics.

    Args:
        user_id: Function argument.

    Returns:
        Function result.
    """
    receipt_count = impact_receipts_collection.count_documents({"user_id": user_id})
    distinct_days = _receipt_dates(user_id)
    return {
        "activated": receipt_count >= 1,
        "receipt_count": receipt_count,
        "repeat_creator": receipt_count >= 2,
        "returned_to_create": len(distinct_days) >= 2,
        "distinct_receipt_days": len(distinct_days),
    }


@router.post("/feedback")
def submit_beta_feedback(
    payload: BetaFeedbackCreate,
    current_user: dict = Depends(get_current_user),
):
    """Handle submit beta feedback.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    user_id = str(current_user["_id"])
    now = datetime.now(timezone.utc)
    document = {
        "user_id": user_id,
        "willingness_to_pay": payload.willingness_to_pay,
        "willing_price_cents": payload.willing_price_cents,
        "would_miss_score": payload.would_miss_score,
        "would_miss_text": payload.would_miss_text.strip(),
        "primary_value": payload.primary_value.strip(),
        "product_metrics": _user_product_metrics(user_id),
        "submitted_at": now,
    }

    beta_feedback_collection.update_one(
        {"user_id": user_id},
        {"$set": document},
        upsert=True,
    )

    return {
        "saved": True,
        "product_metrics": document["product_metrics"],
        "feedback": {
            "willingness_to_pay": document["willingness_to_pay"],
            "willing_price_cents": document["willing_price_cents"],
            "would_miss_score": document["would_miss_score"],
        },
    }


@router.get("/me")
def my_beta_metrics(current_user: dict = Depends(get_current_user)):
    """Handle my beta metrics.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    user_id = str(current_user["_id"])
    feedback = beta_feedback_collection.find_one({"user_id": user_id})
    return {
        "product_metrics": _user_product_metrics(user_id),
        "feedback_submitted": feedback is not None,
        "feedback": None if feedback is None else {
            "willingness_to_pay": feedback.get("willingness_to_pay"),
            "willing_price_cents": feedback.get("willing_price_cents"),
            "would_miss_score": feedback.get("would_miss_score"),
            "would_miss_text": feedback.get("would_miss_text", ""),
            "primary_value": feedback.get("primary_value", ""),
            "submitted_at": feedback.get("submitted_at"),
        },
    }


@router.get("/metrics")
def aggregate_beta_metrics(current_user: dict = Depends(get_current_user)):
    """Return anonymized beta-level funnel and pull metrics with no user identities."""

    receipt_users = impact_receipts_collection.distinct("user_id")
    feedback_users = beta_feedback_collection.distinct("user_id")
    beta_users = sorted(set(receipt_users) | set(feedback_users))

    product_rows = [_user_product_metrics(user_id) for user_id in beta_users]
    feedback_rows = list(beta_feedback_collection.find({}))

    total = len(beta_users)
    activated = sum(1 for row in product_rows if row["activated"])
    repeat = sum(1 for row in product_rows if row["repeat_creator"])
    returned = sum(1 for row in product_rows if row["returned_to_create"])
    pay_yes = sum(1 for row in feedback_rows if row.get("willingness_to_pay") == "yes")
    pay_maybe = sum(1 for row in feedback_rows if row.get("willingness_to_pay") == "maybe")
    miss_scores = [int(row.get("would_miss_score", 0)) for row in feedback_rows if row.get("would_miss_score")]
    strong_miss = sum(1 for score in miss_scores if score >= 4)

    def pct(value: int, denominator: int) -> int:
        """Handle pct.

        Args:
            value: Function argument.
            denominator: Function argument.

        Returns:
            Function result.
        """
        return round((value / denominator) * 100) if denominator else 0

    return {
        "beta_users": total,
        "feedback_responses": len(feedback_rows),
        "activation_rate_percent": pct(activated, total),
        "repeat_receipt_rate_percent": pct(repeat, activated),
        "return_creation_rate_percent": pct(returned, activated),
        "willing_to_pay_yes_percent": pct(pay_yes, len(feedback_rows)),
        "willing_to_pay_yes_or_maybe_percent": pct(pay_yes + pay_maybe, len(feedback_rows)),
        "would_miss_strongly_percent": pct(strong_miss, len(miss_scores)),
        "average_would_miss_score": round(sum(miss_scores) / len(miss_scores), 2) if miss_scores else 0,
        "pull_signal": {
            "strong": bool(feedback_rows) and pct(strong_miss, len(miss_scores)) >= 40,
            "definition": "At least 40% of respondents rate missing BragStack a 4 or 5 out of 5.",
        },
    }
