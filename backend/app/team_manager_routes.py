"""Organizations, teams, invitations, and employee-controlled manager reviews.

This module intentionally does not expose a general organization-wide proof query.
Managers receive only the accomplishment and Impact Receipt records an employee
explicitly selects in a review share.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import re
import secrets

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.auth import get_current_user
from app.database import (
    entries_collection,
    impact_receipts_collection,
    organization_invitations_collection,
    organization_memberships_collection,
    organizations_collection,
    review_shares_collection,
    team_memberships_collection,
    teams_collection,
    users_collection,
)
from app.team_email import send_team_invitation

router = APIRouter(prefix="/organizations", tags=["organizations", "teams"])

ORG_ROLES = {"owner", "admin", "hr", "manager", "member"}
ORG_MANAGE_ROLES = {"owner", "admin", "hr"}
REVIEWER_ROLES = {"owner", "admin", "hr", "manager"}
TEAM_ROLES = {"manager", "member"}
INVITATION_TTL = timedelta(days=7)


class OrganizationCreate(BaseModel):
    """Create a BragStack organization."""

    name: str = Field(..., min_length=2, max_length=120)


class TeamCreate(BaseModel):
    """Create a team within an organization."""

    name: str = Field(..., min_length=2, max_length=120)


class TeamMemberAdd(BaseModel):
    """Add an existing organization member to a team."""

    user_id: str = Field(..., min_length=12, max_length=64)
    role: str = Field(default="member")

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in TEAM_ROLES:
            raise ValueError("Team role must be manager or member")
        return normalized


class OrganizationInvitationCreate(BaseModel):
    """Invite someone to an organization with an optional initial team."""

    email: EmailStr
    role: str = Field(default="member")
    team_id: str | None = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ORG_ROLES - {"owner"}:
            raise ValueError("Unknown organization role")
        return normalized


class ReviewShareCreate(BaseModel):
    """Share selected proof with one organization reviewer."""

    reviewer_user_id: str = Field(..., min_length=12, max_length=64)
    team_id: str | None = None
    entry_ids: list[str] = Field(default_factory=list, max_length=50)
    receipt_ids: list[str] = Field(default_factory=list, max_length=50)
    note: str = Field(default="", max_length=1000)
    review_label: str = Field(default="Performance review", max_length=120)

    @field_validator("entry_ids", "receipt_ids")
    @classmethod
    def unique_ids(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for raw in values:
            value = str(raw).strip()
            if not ObjectId.is_valid(value):
                raise ValueError("Proof IDs must be valid identifiers")
            if value not in seen:
                cleaned.append(value)
                seen.add(value)
        return cleaned



def _now() -> datetime:
    return datetime.now(timezone.utc)



def _slugify(value: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "organization"
    return base[:80]



def _organization_slug(name: str) -> str:
    base = _slugify(name)
    candidate = base
    while organizations_collection.find_one({"slug": candidate}):
        candidate = f"{base[:70]}-{secrets.token_hex(3)}"
    return candidate



def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()



def _org(org_id: str) -> dict:
    if not ObjectId.is_valid(org_id):
        raise HTTPException(status_code=404, detail="Organization not found")
    organization = organizations_collection.find_one({"_id": ObjectId(org_id)})
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization



def _membership(org_id: str, user_id: str) -> dict | None:
    return organization_memberships_collection.find_one(
        {"organization_id": org_id, "user_id": user_id, "status": "active"}
    )



def _require_membership(org_id: str, user_id: str) -> dict:
    membership = _membership(org_id, user_id)
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this organization")
    return membership



def _require_org_manager(org_id: str, user_id: str) -> dict:
    membership = _require_membership(org_id, user_id)
    if membership.get("role") not in ORG_MANAGE_ROLES:
        raise HTTPException(status_code=403, detail="Organization admin access required")
    return membership



def _team(org_id: str, team_id: str) -> dict:
    if not ObjectId.is_valid(team_id):
        raise HTTPException(status_code=404, detail="Team not found")
    team = teams_collection.find_one({"_id": ObjectId(team_id), "organization_id": org_id})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team



def _serialize_org(doc: dict, membership: dict | None = None) -> dict:
    payload = {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "slug": doc.get("slug", ""),
        "created_at": doc.get("created_at"),
    }
    if membership:
        payload["role"] = membership.get("role", "member")
    return payload



def _serialize_team(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "organization_id": doc.get("organization_id", ""),
        "name": doc.get("name", ""),
        "created_at": doc.get("created_at"),
    }



def _serialize_membership(doc: dict) -> dict:
    user = None
    if ObjectId.is_valid(doc.get("user_id", "")):
        user = users_collection.find_one({"_id": ObjectId(doc["user_id"])}, {"name": 1, "email": 1, "headline": 1})
    return {
        "id": str(doc["_id"]),
        "user_id": doc.get("user_id", ""),
        "role": doc.get("role", "member"),
        "status": doc.get("status", "active"),
        "name": (user or {}).get("name", ""),
        "email": (user or {}).get("email", ""),
        "headline": (user or {}).get("headline", ""),
    }



def _serialize_entry_for_review(doc: dict) -> dict:
    """Return only employee-approved accomplishment fields, never attachments."""
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "category": doc.get("category", ""),
        "entry_date": doc.get("entry_date"),
        "entry_type": doc.get("entry_type", ""),
        "situation": doc.get("situation", ""),
        "action": doc.get("action", ""),
        "impact": doc.get("impact", ""),
        "tags": doc.get("tags", []),
        "public": bool(doc.get("is_public", False)),
    }



def _serialize_receipt_for_review(doc: dict) -> dict:
    """Return the receipt claim itself without private evidence or verifier notes."""
    confirmations = doc.get("confirmations") or []
    return {
        "id": str(doc["_id"]),
        "accomplishment": doc.get("accomplishment", ""),
        "contribution": doc.get("contribution", ""),
        "result": doc.get("result", ""),
        "skills": doc.get("skills", []),
        "confirmation_count": len(confirmations),
        "public": bool(doc.get("is_public", False)),
    }



def _serialize_share(doc: dict, *, include_proof: bool = False) -> dict:
    payload = {
        "id": str(doc["_id"]),
        "organization_id": doc.get("organization_id", ""),
        "team_id": doc.get("team_id"),
        "subject_user_id": doc.get("subject_user_id", ""),
        "reviewer_user_id": doc.get("reviewer_user_id", ""),
        "review_label": doc.get("review_label", "Performance review"),
        "note": doc.get("note", ""),
        "status": doc.get("status", "active"),
        "created_at": doc.get("created_at"),
        "revoked_at": doc.get("revoked_at"),
        "entry_ids": doc.get("entry_ids", []),
        "receipt_ids": doc.get("receipt_ids", []),
    }
    if include_proof:
        subject_user_id = doc.get("subject_user_id", "")
        entries = []
        for raw_id in doc.get("entry_ids", []):
            if ObjectId.is_valid(raw_id):
                item = entries_collection.find_one({"_id": ObjectId(raw_id), "user_id": subject_user_id})
                if item:
                    entries.append(_serialize_entry_for_review(item))
        receipts = []
        for raw_id in doc.get("receipt_ids", []):
            if ObjectId.is_valid(raw_id):
                item = impact_receipts_collection.find_one({"_id": ObjectId(raw_id), "user_id": subject_user_id})
                if item:
                    receipts.append(_serialize_receipt_for_review(item))
        payload["entries"] = entries
        payload["receipts"] = receipts
    return payload


@router.get("/visibility-policy")
def visibility_policy():
    """Expose the non-surveillance contract for team features."""
    return {
        "employee_controls_sharing": True,
        "membership_grants_private_proof_access": False,
        "manager_auto_access": False,
        "review_scope": "Only accomplishments and Impact Receipts explicitly shared by the employee.",
        "private_evidence_attachments_included": False,
        "organization_analytics": "Aggregate, bounded, and non-scoring.",
    }


@router.post("")
def create_organization(payload: OrganizationCreate, current_user: dict = Depends(get_current_user)):
    """Create an organization and make the creator its owner."""
    now = _now()
    organization = {
        "name": payload.name.strip(),
        "slug": _organization_slug(payload.name),
        "owner_user_id": str(current_user["_id"]),
        "created_at": now,
        "updated_at": now,
    }
    result = organizations_collection.insert_one(organization)
    org_id = str(result.inserted_id)
    organization["_id"] = result.inserted_id
    membership = {
        "organization_id": org_id,
        "user_id": str(current_user["_id"]),
        "role": "owner",
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    organization_memberships_collection.insert_one(membership)
    return {"organization": _serialize_org(organization, membership)}


@router.get("")
def list_organizations(current_user: dict = Depends(get_current_user)):
    """List organizations the current user has actively joined."""
    user_id = str(current_user["_id"])
    memberships = list(organization_memberships_collection.find({"user_id": user_id, "status": "active"}))
    organizations = []
    for membership in memberships:
        org_id = membership.get("organization_id", "")
        if ObjectId.is_valid(org_id):
            org = organizations_collection.find_one({"_id": ObjectId(org_id)})
            if org:
                organizations.append(_serialize_org(org, membership))
    return {"organizations": organizations}


@router.get("/{org_id}/members")
def list_members(org_id: str, current_user: dict = Depends(get_current_user)):
    """List organization members for owner/admin/HR administration."""
    _org(org_id)
    _require_org_manager(org_id, str(current_user["_id"]))
    members = organization_memberships_collection.find({"organization_id": org_id, "status": "active"})
    return {"members": [_serialize_membership(item) for item in members]}


@router.post("/{org_id}/teams")
def create_team(org_id: str, payload: TeamCreate, current_user: dict = Depends(get_current_user)):
    """Create a team; managers cannot create arbitrary organization structure."""
    _org(org_id)
    _require_org_manager(org_id, str(current_user["_id"]))
    duplicate = teams_collection.find_one({"organization_id": org_id, "name_normalized": payload.name.strip().lower()})
    if duplicate:
        raise HTTPException(status_code=409, detail="A team with that name already exists")
    now = _now()
    team = {
        "organization_id": org_id,
        "name": payload.name.strip(),
        "name_normalized": payload.name.strip().lower(),
        "created_by_user_id": str(current_user["_id"]),
        "created_at": now,
        "updated_at": now,
    }
    result = teams_collection.insert_one(team)
    team["_id"] = result.inserted_id
    return {"team": _serialize_team(team)}


@router.get("/{org_id}/teams")
def list_teams(org_id: str, current_user: dict = Depends(get_current_user)):
    """List team names for any active organization member."""
    _org(org_id)
    _require_membership(org_id, str(current_user["_id"]))
    teams = teams_collection.find({"organization_id": org_id}).sort("name", 1)
    return {"teams": [_serialize_team(item) for item in teams]}


@router.post("/{org_id}/teams/{team_id}/members")
def add_team_member(org_id: str, team_id: str, payload: TeamMemberAdd, current_user: dict = Depends(get_current_user)):
    """Assign an existing organization member to a team."""
    _org(org_id)
    _team(org_id, team_id)
    _require_org_manager(org_id, str(current_user["_id"]))
    _require_membership(org_id, payload.user_id)
    now = _now()
    existing = team_memberships_collection.find_one({"organization_id": org_id, "team_id": team_id, "user_id": payload.user_id})
    if existing:
        team_memberships_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": payload.role, "status": "active", "updated_at": now}},
        )
    else:
        team_memberships_collection.insert_one(
            {
                "organization_id": org_id,
                "team_id": team_id,
                "user_id": payload.user_id,
                "role": payload.role,
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }
        )
    return {"ok": True, "team_id": team_id, "user_id": payload.user_id, "role": payload.role}


@router.get("/{org_id}/teams/{team_id}/members")
def list_team_members(org_id: str, team_id: str, current_user: dict = Depends(get_current_user)):
    """Let org admins or that team's managers see the team's member directory."""
    _org(org_id)
    _team(org_id, team_id)
    user_id = str(current_user["_id"])
    org_membership = _require_membership(org_id, user_id)
    if org_membership.get("role") not in ORG_MANAGE_ROLES:
        manager = team_memberships_collection.find_one(
            {"organization_id": org_id, "team_id": team_id, "user_id": user_id, "role": "manager", "status": "active"}
        )
        if not manager:
            raise HTTPException(status_code=403, detail="Team manager access required")
    memberships = team_memberships_collection.find({"organization_id": org_id, "team_id": team_id, "status": "active"})
    rows = []
    for item in memberships:
        user = users_collection.find_one({"_id": ObjectId(item["user_id"])}, {"name": 1, "email": 1, "headline": 1}) if ObjectId.is_valid(item.get("user_id", "")) else None
        rows.append(
            {
                "user_id": item.get("user_id", ""),
                "team_role": item.get("role", "member"),
                "name": (user or {}).get("name", ""),
                "email": (user or {}).get("email", ""),
                "headline": (user or {}).get("headline", ""),
            }
        )
    return {"members": rows}


@router.post("/{org_id}/invitations")
async def create_invitation(org_id: str, payload: OrganizationInvitationCreate, current_user: dict = Depends(get_current_user)):
    """Invite a member. There is deliberately no hiring-manager role."""
    organization = _org(org_id)
    _require_org_manager(org_id, str(current_user["_id"]))
    email = str(payload.email).strip().lower()
    if payload.role == "manager" and not payload.team_id:
        raise HTTPException(status_code=422, detail="Managers must be invited to a specific team")
    if payload.team_id:
        _team(org_id, payload.team_id)

    existing_user = users_collection.find_one({"email": email}, {"_id": 1})
    if existing_user and _membership(org_id, str(existing_user["_id"])):
        raise HTTPException(status_code=409, detail="That person is already a member of this organization")

    organization_invitations_collection.delete_many(
        {"organization_id": org_id, "email": email, "status": "pending"}
    )
    raw_token = secrets.token_urlsafe(48)
    now = _now()
    invitation = {
        "organization_id": org_id,
        "email": email,
        "role": payload.role,
        "team_id": payload.team_id,
        "token_hash": _hash_token(raw_token),
        "status": "pending",
        "invited_by_user_id": str(current_user["_id"]),
        "created_at": now,
        "expires_at": now + INVITATION_TTL,
    }
    result = organization_invitations_collection.insert_one(invitation)
    try:
        await send_team_invitation(
            email=email,
            inviter_name=current_user.get("name", "A BragStack administrator"),
            organization_name=organization.get("name", "your organization"),
            role=payload.role,
            token=raw_token,
        )
    except HTTPException:
        organization_invitations_collection.delete_one({"_id": result.inserted_id})
        raise
    return {"invitation_id": str(result.inserted_id), "email": email, "role": payload.role, "status": "pending"}


@router.post("/invitations/{token}/accept")
def accept_invitation(token: str, current_user: dict = Depends(get_current_user)):
    """Accept an invitation only when the signed-in email matches the invite."""
    invitation = organization_invitations_collection.find_one({"token_hash": _hash_token(token), "status": "pending"})
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found or already used")
    if invitation.get("expires_at") and invitation["expires_at"] < _now():
        organization_invitations_collection.update_one({"_id": invitation["_id"]}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=410, detail="Invitation has expired")
    if str(current_user.get("email", "")).strip().lower() != invitation.get("email", ""):
        raise HTTPException(status_code=403, detail="Sign in with the email address that received this invitation")

    org_id = invitation["organization_id"]
    _org(org_id)
    user_id = str(current_user["_id"])
    now = _now()
    existing = organization_memberships_collection.find_one({"organization_id": org_id, "user_id": user_id})
    if existing:
        organization_memberships_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": invitation["role"], "status": "active", "updated_at": now}},
        )
    else:
        organization_memberships_collection.insert_one(
            {
                "organization_id": org_id,
                "user_id": user_id,
                "role": invitation["role"],
                "status": "active",
                "created_at": now,
                "updated_at": now,
            }
        )

    team_id = invitation.get("team_id")
    if team_id:
        team_role = "manager" if invitation["role"] == "manager" else "member"
        existing_team = team_memberships_collection.find_one({"organization_id": org_id, "team_id": team_id, "user_id": user_id})
        if existing_team:
            team_memberships_collection.update_one(
                {"_id": existing_team["_id"]},
                {"$set": {"role": team_role, "status": "active", "updated_at": now}},
            )
        else:
            team_memberships_collection.insert_one(
                {
                    "organization_id": org_id,
                    "team_id": team_id,
                    "user_id": user_id,
                    "role": team_role,
                    "status": "active",
                    "created_at": now,
                    "updated_at": now,
                }
            )

    organization_invitations_collection.update_one(
        {"_id": invitation["_id"]},
        {"$set": {"status": "accepted", "accepted_at": now, "accepted_by_user_id": user_id}, "$unset": {"token_hash": ""}},
    )
    return {"ok": True, "organization_id": org_id, "role": invitation["role"], "team_id": team_id}


@router.post("/{org_id}/review-shares")
def create_review_share(org_id: str, payload: ReviewShareCreate, current_user: dict = Depends(get_current_user)):
    """Share selected proof with a manager/admin/HR reviewer without making it public."""
    _org(org_id)
    subject_user_id = str(current_user["_id"])
    _require_membership(org_id, subject_user_id)
    reviewer_membership = _require_membership(org_id, payload.reviewer_user_id)
    if reviewer_membership.get("role") not in REVIEWER_ROLES:
        raise HTTPException(status_code=422, detail="The selected reviewer does not have a review role")
    if payload.reviewer_user_id == subject_user_id:
        raise HTTPException(status_code=422, detail="Choose another organization member as reviewer")

    if reviewer_membership.get("role") == "manager":
        if not payload.team_id:
            raise HTTPException(status_code=422, detail="Manager reviews must be tied to a team")
        _team(org_id, payload.team_id)
        reviewer_team = team_memberships_collection.find_one(
            {"organization_id": org_id, "team_id": payload.team_id, "user_id": payload.reviewer_user_id, "role": "manager", "status": "active"}
        )
        subject_team = team_memberships_collection.find_one(
            {"organization_id": org_id, "team_id": payload.team_id, "user_id": subject_user_id, "status": "active"}
        )
        if not reviewer_team or not subject_team:
            raise HTTPException(status_code=403, detail="Manager reviews are limited to members of the manager's team")
    elif payload.team_id:
        _team(org_id, payload.team_id)

    if not payload.entry_ids and not payload.receipt_ids:
        raise HTTPException(status_code=422, detail="Choose at least one accomplishment or Impact Receipt to share")

    for entry_id in payload.entry_ids:
        if not entries_collection.find_one({"_id": ObjectId(entry_id), "user_id": subject_user_id}, {"_id": 1}):
            raise HTTPException(status_code=404, detail="One or more selected accomplishments were not found")
    for receipt_id in payload.receipt_ids:
        if not impact_receipts_collection.find_one({"_id": ObjectId(receipt_id), "user_id": subject_user_id}, {"_id": 1}):
            raise HTTPException(status_code=404, detail="One or more selected Impact Receipts were not found")

    now = _now()
    share = {
        "organization_id": org_id,
        "team_id": payload.team_id,
        "subject_user_id": subject_user_id,
        "reviewer_user_id": payload.reviewer_user_id,
        "entry_ids": payload.entry_ids,
        "receipt_ids": payload.receipt_ids,
        "note": payload.note.strip(),
        "review_label": payload.review_label.strip() or "Performance review",
        "status": "active",
        "created_at": now,
        "updated_at": now,
    }
    result = review_shares_collection.insert_one(share)
    share["_id"] = result.inserted_id
    return {"share": _serialize_share(share, include_proof=True)}


@router.get("/{org_id}/review-shares/outbox")
def review_outbox(org_id: str, current_user: dict = Depends(get_current_user)):
    """Show the current user's own review shares, including revoked history."""
    _org(org_id)
    user_id = str(current_user["_id"])
    _require_membership(org_id, user_id)
    shares = review_shares_collection.find({"organization_id": org_id, "subject_user_id": user_id}).sort("created_at", -1)
    return {"shares": [_serialize_share(item) for item in shares]}


@router.get("/{org_id}/review-shares/inbox")
def review_inbox(org_id: str, current_user: dict = Depends(get_current_user)):
    """Return only active review shares explicitly addressed to the current reviewer."""
    _org(org_id)
    user_id = str(current_user["_id"])
    membership = _require_membership(org_id, user_id)
    if membership.get("role") not in REVIEWER_ROLES:
        raise HTTPException(status_code=403, detail="Reviewer access required")
    shares = review_shares_collection.find(
        {"organization_id": org_id, "reviewer_user_id": user_id, "status": "active"}
    ).sort("created_at", -1)
    return {"shares": [_serialize_share(item, include_proof=True) for item in shares]}


@router.delete("/{org_id}/review-shares/{share_id}")
def revoke_review_share(org_id: str, share_id: str, current_user: dict = Depends(get_current_user)):
    """Let an employee revoke a review share immediately."""
    _org(org_id)
    user_id = str(current_user["_id"])
    _require_membership(org_id, user_id)
    if not ObjectId.is_valid(share_id):
        raise HTTPException(status_code=404, detail="Review share not found")
    share = review_shares_collection.find_one(
        {"_id": ObjectId(share_id), "organization_id": org_id, "subject_user_id": user_id}
    )
    if not share:
        raise HTTPException(status_code=404, detail="Review share not found")
    now = _now()
    review_shares_collection.update_one(
        {"_id": share["_id"]},
        {"$set": {"status": "revoked", "revoked_at": now, "updated_at": now}},
    )
    return {"ok": True, "status": "revoked"}
