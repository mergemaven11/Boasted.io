"""Beta metrics and authenticated support intake routes."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Literal

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import beta_feedback_collection, db, impact_receipts_collection
from app.plans import is_internal_user


router = APIRouter(prefix="/beta", tags=["beta"])
support_tickets_collection = db["support_tickets"]

GITHUB_SUPPORT_TOKEN = os.getenv("GITHUB_SUPPORT_TOKEN", "").strip()
GITHUB_SUPPORT_REPO = os.getenv("GITHUB_SUPPORT_REPO", "mergemaven11/bragstack").strip()

SUPPORT_CATEGORIES = {
    "bug": "Bug / something is broken",
    "account": "Account / sign-in",
    "billing": "Billing / subscription",
    "education": "Education / applications",
    "feature": "Feature request",
    "accessibility": "Accessibility",
    "privacy_security": "Privacy / security",
    "other": "Other",
}

GITHUB_CATEGORY_LABELS = {
    "bug": ["bug"],
    "feature": ["enhancement"],
}


class BetaFeedbackCreate(BaseModel):
    """Represent BetaFeedbackCreate."""
    willingness_to_pay: Literal["yes", "maybe", "no"]
    willing_price_cents: int | None = Field(default=None, ge=0, le=100000)
    would_miss_score: int = Field(..., ge=1, le=5)
    would_miss_text: str = Field(default="", max_length=2000)
    primary_value: str = Field(default="", max_length=500)


class SupportTicketCreate(BaseModel):
    """Customer support request that can be synchronized to private GitHub Issues."""

    category: Literal[
        "bug",
        "account",
        "billing",
        "education",
        "feature",
        "accessibility",
        "privacy_security",
        "other",
    ]
    title: str = Field(..., min_length=4, max_length=140)
    description: str = Field(..., min_length=10, max_length=6000)
    page_url: str = Field(default="", max_length=500)
    browser: str = Field(default="", max_length=500)


def _receipt_dates(user_id: str) -> list[str]:
    """Handle receipt dates."""
    dates = []
    for receipt in impact_receipts_collection.find({"user_id": user_id}):
        value = receipt.get("created_at")
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            dates.append(value.astimezone(timezone.utc).date().isoformat())
    return sorted(set(dates))


def _user_product_metrics(user_id: str) -> dict:
    """Handle user product metrics."""
    receipt_count = impact_receipts_collection.count_documents({"user_id": user_id})
    distinct_days = _receipt_dates(user_id)
    return {
        "activated": receipt_count >= 1,
        "receipt_count": receipt_count,
        "repeat_creator": receipt_count >= 2,
        "returned_to_create": len(distinct_days) >= 2,
        "distinct_receipt_days": len(distinct_days),
    }


def _github_issue_body(ticket: dict) -> str:
    """Create a bounded support issue body without secrets or auth data."""
    return "\n".join(
        [
            "## Customer support intake",
            "",
            f"**Category:** {SUPPORT_CATEGORIES.get(ticket['category'], ticket['category'])}",
            f"**Ticket ID:** `{ticket['ticket_id']}`",
            f"**Reporter:** {ticket.get('reporter_email') or 'authenticated user'}",
            f"**Page:** {ticket.get('page_url') or 'Not provided'}",
            "",
            "## Description",
            ticket["description"],
            "",
            "## Browser / device",
            ticket.get("browser") or "Not provided",
            "",
            "---",
            "Submitted through the authenticated BragStack Support Center. Do not post passwords, tokens, API keys, confidential employer material, medical information, student records, or other sensitive data into this issue.",
        ]
    )


async def _sync_support_ticket_to_github(ticket: dict) -> dict | None:
    """Create a private GitHub issue when a server-side support token is configured."""
    if not GITHUB_SUPPORT_TOKEN or not GITHUB_SUPPORT_REPO:
        return None

    labels = GITHUB_CATEGORY_LABELS.get(ticket["category"], [])
    payload = {
        "title": f"[{SUPPORT_CATEGORIES.get(ticket['category'], ticket['category'])}] {ticket['title']}",
        "body": _github_issue_body(ticket),
    }
    if labels:
        payload["labels"] = labels

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            f"https://api.github.com/repos/{GITHUB_SUPPORT_REPO}/issues",
            headers={
                "Authorization": f"Bearer {GITHUB_SUPPORT_TOKEN}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "BragStack-Support",
            },
            json=payload,
        )
    if response.status_code not in {200, 201}:
        return {"error": f"github_status_{response.status_code}"}
    data = response.json()
    return {
        "issue_number": data.get("number"),
        "issue_url": data.get("html_url"),
    }


@router.post("/support-ticket")
async def submit_support_ticket(
    payload: SupportTicketCreate,
    current_user: dict = Depends(get_current_user),
):
    """Save a categorized support ticket first, then best-effort sync it to GitHub."""
    now = datetime.now(timezone.utc)
    ticket_id = f"BS-{now.strftime('%Y%m%d%H%M%S')}-{str(current_user['_id'])[-6:].upper()}"
    document = {
        "ticket_id": ticket_id,
        "user_id": str(current_user["_id"]),
        "reporter_email": (current_user.get("email") or "").strip().lower(),
        "category": payload.category,
        "title": payload.title.strip(),
        "description": payload.description.strip(),
        "page_url": payload.page_url.strip(),
        "browser": payload.browser.strip(),
        "status": "received",
        "github_sync_status": "pending" if GITHUB_SUPPORT_TOKEN else "not_configured",
        "created_at": now,
    }
    result = support_tickets_collection.insert_one(document)

    github = None
    try:
        github = await _sync_support_ticket_to_github(document)
    except Exception:
        github = {"error": "github_sync_failed"}

    if github and github.get("issue_number"):
        support_tickets_collection.update_one(
            {"_id": result.inserted_id},
            {
                "$set": {
                    "github_sync_status": "synced",
                    "github_issue_number": github["issue_number"],
                    "github_issue_url": github.get("issue_url"),
                }
            },
        )
    elif github and github.get("error"):
        support_tickets_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"github_sync_status": "failed", "github_sync_error": github["error"]}},
        )

    return {
        "saved": True,
        "ticket_id": ticket_id,
        "category": payload.category,
        "github_synced": bool(github and github.get("issue_number")),
        "github_issue_number": github.get("issue_number") if github else None,
        "message": "Your support request was received. BragStack support can follow up using the email on your account.",
    }


@router.post("/feedback")
def submit_beta_feedback(
    payload: BetaFeedbackCreate,
    current_user: dict = Depends(get_current_user),
):
    """Handle submit beta feedback."""
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
    """Handle my beta metrics."""
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
    """Return founder beta metrics only to verified BragStack internal identities."""
    if not is_internal_user(current_user):
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Internal analytics are not available for this account.")

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
        """Handle pct."""
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
