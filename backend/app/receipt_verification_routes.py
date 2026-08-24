from datetime import datetime, timedelta, timezone
import hashlib
import html
import os
import secrets

import httpx
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.auth import get_current_user
from app.database import impact_receipts_collection
from app.impact_receipt_routes import build_trust_signals

router = APIRouter(tags=["receipt-verification"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
VERIFICATION_FROM = os.getenv("RECEIPT_VERIFICATION_FROM", "BragStack <noreply@usebragstack.com>")
TOKEN_TTL = timedelta(days=7)


class VerificationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    role: str = Field(default="", max_length=120)
    confirmation_type: str = Field(default="stakeholder", pattern="^(collaborator|stakeholder|organization)$")
    message: str = Field(default="", max_length=500)


class VerificationDecision(BaseModel):
    decision: str = Field(..., pattern="^(confirmed|declined)$")


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _as_utc(value):
    if isinstance(value, datetime):
        return value.replace(tzinfo=value.tzinfo or timezone.utc).astimezone(timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
            return parsed.replace(tzinfo=parsed.tzinfo or timezone.utc).astimezone(timezone.utc)
        except ValueError:
            pass
    return datetime.min.replace(tzinfo=timezone.utc)


def _find_by_token(token: str):
    token_hash = _hash_token(token)
    receipt = impact_receipts_collection.find_one({"confirmations.token_hash": token_hash})
    if not receipt:
        raise HTTPException(status_code=404, detail="This verification request is invalid or no longer available.")
    confirmation = next((item for item in receipt.get("confirmations", []) if item.get("token_hash") == token_hash), None)
    if not confirmation:
        raise HTTPException(status_code=404, detail="This verification request is invalid or no longer available.")
    if confirmation.get("status") != "pending":
        raise HTTPException(status_code=409, detail="This verification request has already been completed.")
    if _as_utc(confirmation.get("expires_at")) < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="This verification request has expired.")
    return receipt, confirmation, token_hash


async def _send_request_email(to_email: str, owner_name: str, receipt: dict, confirmation: dict, raw_token: str):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="Email delivery is not configured yet.")
    url = f"{FRONTEND_URL}/verify-receipt?token={raw_token}"
    safe_owner = html.escape(owner_name)
    safe_name = html.escape(confirmation["name"])
    safe_accomplishment = html.escape(receipt.get("accomplishment", "Impact Receipt"))
    safe_message = html.escape(confirmation.get("message", ""))
    message_html = f"<p><strong>Message from {safe_owner}:</strong> {safe_message}</p>" if safe_message else ""
    body = (
        f"<h2>{safe_owner} asked you to confirm career proof on BragStack</h2>"
        f"<p>Hi {safe_name},</p><p>Please review this Impact Receipt: <strong>{safe_accomplishment}</strong>.</p>"
        f"{message_html}<p>Your response records your attestation; BragStack does not independently verify the claim.</p>"
        f"<p><a href='{url}'>Review and respond</a></p><p>This secure link expires in 7 days. No BragStack account is required.</p>"
    )
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": VERIFICATION_FROM, "to": [to_email], "subject": f"{owner_name} asked you to confirm career proof on BragStack", "html": body},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Verification email could not be sent.")


@router.post("/impact-receipts/{receipt_id}/verification-requests", status_code=status.HTTP_201_CREATED)
async def request_receipt_verification(receipt_id: str, payload: VerificationRequest, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(receipt_id):
        raise HTTPException(status_code=400, detail="Invalid Impact Receipt ID")
    query = {"_id": ObjectId(receipt_id), "user_id": str(current_user["_id"])}
    receipt = impact_receipts_collection.find_one(query)
    if not receipt:
        raise HTTPException(status_code=404, detail="Impact Receipt not found")
    email = str(payload.email).lower().strip()
    pending_for_email = any(item.get("status") == "pending" and item.get("email") == email for item in receipt.get("confirmations", []))
    if pending_for_email:
        raise HTTPException(status_code=409, detail="A verification request is already pending for this email.")

    raw_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    confirmation = {
        "id": secrets.token_hex(12),
        "name": payload.name.strip(),
        "email": email,
        "role": payload.role.strip() or None,
        "confirmation_type": payload.confirmation_type,
        "status": "pending",
        "message": payload.message.strip(),
        "requested_at": now,
        "expires_at": now + TOKEN_TTL,
        "confirmed_at": None,
        "token_hash": _hash_token(raw_token),
    }
    impact_receipts_collection.update_one(query, {"$push": {"confirmations": confirmation}, "$set": {"updated_at": now}})
    try:
        await _send_request_email(email, current_user.get("name") or "A BragStack user", receipt, confirmation, raw_token)
    except HTTPException:
        impact_receipts_collection.update_one(query, {"$pull": {"confirmations": {"id": confirmation["id"]}}})
        raise
    return {"status": "pending", "message": "Verification request sent.", "confirmation_id": confirmation["id"]}


@router.get("/receipt-verifications/{token}")
def get_receipt_verification(token: str):
    receipt, confirmation, _ = _find_by_token(token)
    return {
        "accomplishment": receipt.get("accomplishment", ""),
        "contribution": receipt.get("contribution", ""),
        "result": receipt.get("result", ""),
        "metrics": receipt.get("metrics", []),
        "skills": receipt.get("skills", []),
        "verifier_name": confirmation.get("name", ""),
        "verifier_role": confirmation.get("role"),
        "confirmation_type": confirmation.get("confirmation_type"),
        "message": confirmation.get("message", ""),
        "expires_at": confirmation.get("expires_at"),
        "statement": "Confirming means you believe this receipt accurately represents the work and result described. BragStack records your attestation but does not independently verify the claim.",
    }


@router.post("/receipt-verifications/{token}/decision")
def decide_receipt_verification(token: str, payload: VerificationDecision):
    receipt, confirmation, token_hash = _find_by_token(token)
    now = datetime.now(timezone.utc)
    confirmations = receipt.get("confirmations", [])
    for item in confirmations:
        if item.get("token_hash") == token_hash:
            item["status"] = payload.decision
            item["confirmed_at"] = now if payload.decision == "confirmed" else None
            item["responded_at"] = now
            item.pop("token_hash", None)
            item.pop("expires_at", None)
            item.pop("email", None)
            item.pop("message", None)
            break
    trust_signals = build_trust_signals(receipt.get("evidence", []), confirmations)
    impact_receipts_collection.update_one(
        {"_id": receipt["_id"]},
        {"$set": {"confirmations": confirmations, "trust_signals": trust_signals, "updated_at": now}},
    )
    return {"status": payload.decision, "message": "Thank you. Your response has been recorded."}
