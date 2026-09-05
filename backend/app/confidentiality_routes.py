"""Routes for issuing and reviewing confidentiality attestation receipts."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.confidentiality import issue_confidentiality_attestation
from app.database import confidentiality_attestations_collection
from app.ops_routes import require_internal_role


router = APIRouter(prefix="/confidentiality", tags=["confidentiality"])
ops_router = APIRouter(prefix="/ops/confidentiality", tags=["ops", "confidentiality"])


class ConfidentialityAttestationIssue(BaseModel):
    """Minimal client assertion used to mint a one-time protected-write token."""

    version: str = Field(min_length=1, max_length=64)
    method: str = Field(min_length=3, max_length=10)
    path: str = Field(min_length=1, max_length=512)
    confirmed: bool


@router.post("/attestations", status_code=status.HTTP_201_CREATED)
def create_confidentiality_attestation(
    payload: ConfidentialityAttestationIssue,
    current_user: dict = Depends(get_current_user),
):
    """Create a short-lived one-time token after the user explicitly confirms the gate."""
    if payload.confirmed is not True:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "confidentiality_confirmation_required",
                "message": "Explicit confidentiality confirmation is required before a protected write can continue.",
            },
        )

    return issue_confidentiality_attestation(
        user_id=str(current_user["_id"]),
        method=payload.method,
        path=payload.path,
        version=payload.version,
    )


def _serialize_receipt(document: dict) -> dict:
    """Return only safe operational metadata; never expose token hashes or draft content."""
    return {
        "id": str(document.get("_id", "")),
        "user_id": document.get("user_id", ""),
        "action": document.get("action", ""),
        "version": document.get("version", ""),
        "status": document.get("status", ""),
        "issued_at": document.get("issued_at"),
        "expires_at": document.get("expires_at"),
        "consumed_at": document.get("consumed_at"),
        "request_id": document.get("request_id"),
        "purge_at": document.get("purge_at"),
    }


@ops_router.get("/attestations")
def list_confidentiality_attestations(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    """List recent non-sensitive confidentiality guard receipts for internal audit."""
    del current_user
    cursor = confidentiality_attestations_collection.find({}).sort("issued_at", -1).limit(limit)
    receipts = [_serialize_receipt(item) for item in cursor]
    return {
        "receipts": receipts,
        "returned": len(receipts),
        "note": "Receipts contain control metadata only; career draft content and attestation token hashes are not returned.",
    }
