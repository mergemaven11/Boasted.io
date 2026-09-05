"""Server-side confidentiality attestation helpers for protected career-evidence writes."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from pymongo import ReturnDocument

from app.auth import get_current_user
from app.database import confidentiality_attestations_collection


CONFIDENTIALITY_ATTESTATION_VERSION = "2026-09-05.v2"
CONFIDENTIALITY_ATTESTATION_HEADER = "X-BragStack-Confidentiality-Attestation"
ATTESTATION_TTL_SECONDS = 120
ATTESTATION_AUDIT_RETENTION_DAYS = 90


def _normalized_path(path: str) -> str:
    value = str(path or "").split("?", 1)[0].rstrip("/")
    return value or "/"


def confidentiality_action_for_request(method: str, path: str) -> str | None:
    """Return a stable action class for writes that require confidentiality attestation."""
    normalized_method = str(method or "").upper()
    normalized_path = _normalized_path(path)

    if normalized_method == "POST" and normalized_path == "/entries":
        return "entry.create"

    if normalized_method in {"PUT", "PATCH"} and normalized_path.startswith("/entries/"):
        remainder = normalized_path.removeprefix("/entries/")
        if remainder and "/" not in remainder:
            return "entry.update"

    if normalized_method == "POST" and normalized_path == "/impact-receipts":
        return "impact_receipt.create"

    if normalized_method == "POST" and normalized_path.startswith("/impact-receipts/from-entry/"):
        remainder = normalized_path.removeprefix("/impact-receipts/from-entry/")
        if remainder and "/" not in remainder:
            return "impact_receipt.create_from_entry"

    if normalized_method == "PATCH" and normalized_path.startswith("/impact-receipts/"):
        remainder = normalized_path.removeprefix("/impact-receipts/")
        if remainder and "/" not in remainder:
            return "impact_receipt.update"

    return None


def _token_hash(token: str) -> str:
    return hashlib.sha256(str(token).encode("utf-8")).hexdigest()


def issue_confidentiality_attestation(
    *,
    user_id: str,
    method: str,
    path: str,
    version: str,
    now: datetime | None = None,
) -> dict:
    """Issue a short-lived one-time token and persist only its hash plus safe audit metadata."""
    if version != CONFIDENTIALITY_ATTESTATION_VERSION:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "confidentiality_attestation_version_mismatch",
                "message": "The confidentiality confirmation is out of date. Review the current NDA safety check and try again.",
                "required_version": CONFIDENTIALITY_ATTESTATION_VERSION,
            },
        )

    action = confidentiality_action_for_request(method, path)
    if action is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "unsupported_confidentiality_action",
                "message": "That request does not use a confidentiality attestation.",
            },
        )

    issued_at = now or datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(seconds=ATTESTATION_TTL_SECONDS)
    purge_at = issued_at + timedelta(days=ATTESTATION_AUDIT_RETENTION_DAYS)
    token = secrets.token_urlsafe(32)

    result = confidentiality_attestations_collection.insert_one(
        {
            "user_id": str(user_id),
            "action": action,
            "version": version,
            "token_hash": _token_hash(token),
            "status": "issued",
            "issued_at": issued_at,
            "expires_at": expires_at,
            "consumed_at": None,
            "request_id": None,
            "purge_at": purge_at,
        }
    )

    return {
        "id": str(result.inserted_id),
        "attestation_token": token,
        "version": version,
        "action": action,
        "issued_at": issued_at,
        "expires_at": expires_at,
    }


def consume_confidentiality_attestation(
    *,
    user_id: str,
    method: str,
    path: str,
    token: str | None,
    request_id: str | None = None,
    now: datetime | None = None,
) -> dict:
    """Atomically consume one matching attestation token for a protected write."""
    action = confidentiality_action_for_request(method, path)
    if action is None:
        return {"required": False}

    if not token:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail={
                "code": "confidentiality_attestation_required",
                "message": "Review and confirm the NDA & confidentiality check before saving or publishing this career evidence.",
            },
        )

    consumed_at = now or datetime.now(timezone.utc)
    receipt = confidentiality_attestations_collection.find_one_and_update(
        {
            "user_id": str(user_id),
            "action": action,
            "version": CONFIDENTIALITY_ATTESTATION_VERSION,
            "token_hash": _token_hash(token),
            "status": "issued",
            "expires_at": {"$gt": consumed_at},
        },
        {
            "$set": {
                "status": "consumed",
                "consumed_at": consumed_at,
                "request_id": request_id,
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    if receipt is None:
        raise HTTPException(
            status_code=status.HTTP_428_PRECONDITION_REQUIRED,
            detail={
                "code": "confidentiality_attestation_invalid",
                "message": "The confidentiality confirmation is missing, expired, already used, or does not match this action. Review the check again.",
            },
        )

    return {
        "required": True,
        "receipt_id": str(receipt["_id"]),
        "action": receipt["action"],
        "version": receipt["version"],
        "consumed_at": receipt["consumed_at"],
    }


def enforce_confidentiality_attestation(
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> None:
    """FastAPI dependency that blocks protected writes without a valid one-time attestation."""
    action = confidentiality_action_for_request(request.method, request.url.path)
    if action is None:
        return

    receipt = consume_confidentiality_attestation(
        user_id=str(current_user["_id"]),
        method=request.method,
        path=request.url.path,
        token=request.headers.get(CONFIDENTIALITY_ATTESTATION_HEADER),
        request_id=getattr(request.state, "request_id", None),
    )
    request.state.confidentiality_attestation = receipt
