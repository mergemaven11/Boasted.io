"""Document this first-party Python module."""
from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from app.auth import get_current_user
from app.database import (
    impact_receipts_collection,
    receipt_verification_requests_collection,
)
from app.email_templates import build_receipt_verification_html
from app.impact_receipt_routes import build_trust_signals

router = APIRouter(tags=["receipt-verification"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
VERIFICATION_FROM = os.getenv("RECEIPT_VERIFICATION_FROM", "BragStack <noreply@usebragstack.com>")
TOKEN_TTL = timedelta(days=7)


class VerificationRequest(BaseModel):
    """Represent VerificationRequest."""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(default="", max_length=120)
    confirmation_type: str = Field(default="stakeholder", pattern="^(collaborator|stakeholder|organization)$")
    message: str = Field(default="", max_length=500)


class VerificationDecision(BaseModel):
    """Represent VerificationDecision."""
    decision: str = Field(..., pattern="^(confirmed|declined)$")


def _hash_token(token: str) -> str:
    """Handle hash token.

    Args:
        token: Function argument.

    Returns:
        Function result.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _as_utc(value):
    """Handle as utc.

    Args:
        value: Function argument.

    Returns:
        Function result.
    """
    if isinstance(value, datetime):
        return value.replace(tzinfo=value.tzinfo or timezone.utc).astimezone(timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
            return parsed.replace(tzinfo=parsed.tzinfo or timezone.utc).astimezone(timezone.utc)
        except ValueError:
            pass
    return datetime.min.replace(tzinfo=timezone.utc)


def _remove_pending_confirmation(receipt_id: ObjectId, confirmation_id: str, *, now: datetime | None = None) -> None:
    """Handle remove pending confirmation.

    Args:
        receipt_id: Function argument.
        confirmation_id: Function argument.
        now: Function argument.
    """
    impact_receipts_collection.update_one(
        {"_id": receipt_id},
        {
            "$pull": {"confirmations": {"id": confirmation_id}},
            "$set": {"updated_at": now or datetime.now(timezone.utc)},
        },
    )


def _prune_expired_pending_confirmations(receipt: dict, now: datetime) -> dict:
    """Handle prune expired pending confirmations.

    Args:
        receipt: Function argument.
        now: Function argument.

    Returns:
        Function result.
    """
    expired_ids = [
        item.get("id")
        for item in receipt.get("confirmations", [])
        if item.get("status") == "pending"
        and item.get("id")
        and _as_utc(item.get("expires_at")) <= now
    ]
    if not expired_ids:
        return receipt

    receipt_id = receipt["_id"]
    receipt_verification_requests_collection.delete_many(
        {"receipt_id": str(receipt_id), "confirmation_id": {"$in": expired_ids}}
    )
    impact_receipts_collection.update_one(
        {"_id": receipt_id},
        {
            "$pull": {"confirmations": {"id": {"$in": expired_ids}}},
            "$set": {"updated_at": now},
        },
    )
    receipt["confirmations"] = [
        item for item in receipt.get("confirmations", []) if item.get("id") not in expired_ids
    ]
    return receipt


def _find_by_token(token: str):
    """Handle find by token.

    Args:
        token: Function argument.

    Returns:
        Function result.
    """
    token_hash = _hash_token(token)
    request_record = receipt_verification_requests_collection.find_one({"token_hash": token_hash})
    if not request_record:
        raise HTTPException(status_code=404, detail="This verification request is invalid or no longer available.")

    now = datetime.now(timezone.utc)
    if _as_utc(request_record.get("expires_at")) <= now:
        receipt_id_text = str(request_record.get("receipt_id") or "")
        confirmation_id = str(request_record.get("confirmation_id") or "")
        receipt_verification_requests_collection.delete_one({"_id": request_record["_id"]})
        if ObjectId.is_valid(receipt_id_text) and confirmation_id:
            _remove_pending_confirmation(ObjectId(receipt_id_text), confirmation_id, now=now)
        raise HTTPException(status_code=410, detail="This verification request has expired.")

    receipt_id_text = str(request_record.get("receipt_id") or "")
    if not ObjectId.is_valid(receipt_id_text):
        receipt_verification_requests_collection.delete_one({"_id": request_record["_id"]})
        raise HTTPException(status_code=404, detail="This verification request is invalid or no longer available.")

    receipt = impact_receipts_collection.find_one({"_id": ObjectId(receipt_id_text)})
    if not receipt:
        receipt_verification_requests_collection.delete_one({"_id": request_record["_id"]})
        raise HTTPException(status_code=404, detail="This verification request is invalid or no longer available.")

    confirmation_id = request_record.get("confirmation_id")
    confirmation = next(
        (item for item in receipt.get("confirmations", []) if item.get("id") == confirmation_id),
        None,
    )
    if not confirmation:
        receipt_verification_requests_collection.delete_one({"_id": request_record["_id"]})
        raise HTTPException(status_code=404, detail="This verification request is invalid or no longer available.")
    if confirmation.get("status") != "pending":
        receipt_verification_requests_collection.delete_one({"_id": request_record["_id"]})
        raise HTTPException(status_code=409, detail="This verification request has already been completed.")

    return receipt, confirmation, request_record


async def _send_request_email(
    to_email: str,
    owner_name: str,
    receipt: dict,
    confirmation: dict,
    raw_token: str,
):
    """Handle send request email.

    Args:
        to_email: Function argument.
        owner_name: Function argument.
        receipt: Function argument.
        confirmation: Function argument.
        raw_token: Function argument.
    """
    if not RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="Email delivery is not configured yet.")

    url = f"{FRONTEND_URL}/verify-receipt?token={raw_token}"
    body = build_receipt_verification_html(
        owner_name=owner_name,
        verifier_name=confirmation["name"],
        accomplishment=receipt.get("accomplishment", "Impact Receipt"),
        message=confirmation.get("message", ""),
        url=url,
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={
                "from": VERIFICATION_FROM,
                "to": [to_email],
                "subject": f"{owner_name} asked you to confirm career proof on BragStack",
                "html": body,
            },
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Verification email could not be sent.")


@router.post("/impact-receipts/{receipt_id}/verification-requests", status_code=status.HTTP_201_CREATED)
async def request_receipt_verification(
    receipt_id: str,
    payload: VerificationRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle request receipt verification.

    Args:
        receipt_id: Function argument.
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    if not ObjectId.is_valid(receipt_id):
        raise HTTPException(status_code=400, detail="Invalid Impact Receipt ID")
    query = {"_id": ObjectId(receipt_id), "user_id": str(current_user["_id"])}
    receipt = impact_receipts_collection.find_one(query)
    if not receipt:
        raise HTTPException(status_code=404, detail="Impact Receipt not found")

    now = datetime.now(timezone.utc)
    receipt = _prune_expired_pending_confirmations(receipt, now)
    email = str(payload.email).lower().strip()
    message = payload.message.strip()

    # TTL deletion is asynchronous, so proactively remove an already-expired
    # record before enforcing the unique receipt/email pending-request key.
    receipt_verification_requests_collection.delete_many(
        {"receipt_id": receipt_id, "email": email, "expires_at": {"$lte": now}}
    )
    if receipt_verification_requests_collection.find_one(
        {"receipt_id": receipt_id, "email": email, "expires_at": {"$gt": now}}
    ):
        raise HTTPException(status_code=409, detail="A verification request is already pending for this email.")

    raw_token = secrets.token_urlsafe(48)
    confirmation_id = secrets.token_hex(12)
    expires_at = now + TOKEN_TTL
    confirmation = {
        "id": confirmation_id,
        "name": payload.name.strip(),
        "role": payload.role.strip() or None,
        "confirmation_type": payload.confirmation_type,
        "status": "pending",
        "requested_at": now,
        "expires_at": expires_at,
        "confirmed_at": None,
    }
    request_record = {
        "receipt_id": receipt_id,
        "user_id": str(current_user["_id"]),
        "confirmation_id": confirmation_id,
        "email": email,
        "message": message,
        "token_hash": _hash_token(raw_token),
        "requested_at": now,
        "expires_at": expires_at,
    }

    try:
        receipt_verification_requests_collection.insert_one(request_record)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="A verification request is already pending for this email.") from exc

    result = impact_receipts_collection.update_one(
        query,
        {"$push": {"confirmations": confirmation}, "$set": {"updated_at": now}},
    )
    if result.matched_count == 0:
        receipt_verification_requests_collection.delete_one({"token_hash": request_record["token_hash"]})
        raise HTTPException(status_code=404, detail="Impact Receipt not found")

    try:
        await _send_request_email(
            email,
            current_user.get("name") or "A BragStack user",
            receipt,
            {**confirmation, "message": message},
            raw_token,
        )
    except HTTPException:
        receipt_verification_requests_collection.delete_one({"token_hash": request_record["token_hash"]})
        _remove_pending_confirmation(ObjectId(receipt_id), confirmation_id, now=now)
        raise
    return {
        "status": "pending",
        "message": "Verification request sent.",
        "confirmation_id": confirmation_id,
    }


@router.get("/receipt-verifications/{token}")
def get_receipt_verification(token: str):
    """Handle get receipt verification.

    Args:
        token: Function argument.

    Returns:
        Function result.
    """
    receipt, confirmation, request_record = _find_by_token(token)
    return {
        "accomplishment": receipt.get("accomplishment", ""),
        "contribution": receipt.get("contribution", ""),
        "result": receipt.get("result", ""),
        "metrics": receipt.get("metrics", []),
        "skills": receipt.get("skills", []),
        "verifier_name": confirmation.get("name", ""),
        "verifier_role": confirmation.get("role"),
        "confirmation_type": confirmation.get("confirmation_type"),
        "message": request_record.get("message", ""),
        "expires_at": request_record.get("expires_at"),
        "statement": "Confirming means you believe this receipt accurately represents the work and result described. BragStack records your attestation but does not independently verify the claim.",
    }


@router.post("/receipt-verifications/{token}/decision")
def decide_receipt_verification(token: str, payload: VerificationDecision):
    """Handle decide receipt verification.

    Args:
        token: Function argument.
        payload: Function argument.

    Returns:
        Function result.
    """
    receipt, confirmation, request_record = _find_by_token(token)
    now = datetime.now(timezone.utc)
    confirmations = receipt.get("confirmations", [])
    for item in confirmations:
        if item.get("id") == confirmation.get("id"):
            item["status"] = payload.decision
            item["confirmed_at"] = now if payload.decision == "confirmed" else None
            item["responded_at"] = now
            item.pop("expires_at", None)
            item.pop("email", None)
            item.pop("message", None)
            item.pop("token_hash", None)
            break
    trust_signals = build_trust_signals(receipt.get("evidence", []), confirmations)
    impact_receipts_collection.update_one(
        {"_id": receipt["_id"]},
        {"$set": {"confirmations": confirmations, "trust_signals": trust_signals, "updated_at": now}},
    )
    receipt_verification_requests_collection.delete_one({"_id": request_record["_id"]})
    return {"status": payload.decision, "message": "Thank you. Your response has been recorded."}
