"""Email/password auth and persistent profile settings."""
from datetime import datetime, timedelta, timezone
import hashlib
import os
import re
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.auth import create_access_token, get_current_user, hash_password, serialize_user, verify_password
from app.database import users_collection
from app.email_templates import build_email_verification_html, build_password_reset_html

router = APIRouter(prefix="/auth", tags=["auth"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
PASSWORD_RESET_FROM = os.getenv("PASSWORD_RESET_FROM", "Boasted <noreply@boasted.io>")
EMAIL_VERIFICATION_FROM = os.getenv("EMAIL_VERIFICATION_FROM", PASSWORD_RESET_FROM)
TERMS_VERSION = "2026-09-05"
PRIVACY_VERSION = "2026-09-05"
PROFILE_THEMES = {
    "default",
    "clinical",
    "educator",
    "engineer",
    "designer",
    "executive",
    "trades",
    "creator",
    "hospitality",
    "finance",
    "legal",
    "public-service",
    "midnight",
    "aurora",
    "ember",
    "monochrome",
    "ocean",
    "orchid",
    "forest",
    "copper",
    "rose-gold",
    "blueprint",
    "studio",
    "research",
}
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
PROFILE_LAYOUTS = {"editorial", "executive-sidebar", "career-timeline", "studio-split", "minimal-column", "portfolio-grid", "case-study", "modern-resume", "command-center", "academic", "founder", "compact"}
PROFILE_TEXT_FIELDS = {"name", "headline", "bio", "location", "github_url", "portfolio_url", "resume_url"}
PROFILE_COLOR_FIELDS = {"profile_primary_color", "profile_secondary_color", "profile_background_color"}


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8)
    accepted_terms: bool
    accepted_privacy: bool


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    token: str = Field(..., min_length=20, max_length=300)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=20, max_length=300)
    password: str = Field(..., min_length=8, max_length=256)


class WorkExperienceItem(BaseModel):
    role: str = Field(..., min_length=1, max_length=120)
    company: str = Field(default="", max_length=120)
    location: str = Field(default="", max_length=100)
    start_date: str = Field(default="", max_length=30)
    end_date: str = Field(default="", max_length=30)
    summary: str = Field(default="", max_length=800)


class ProfileProjectItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    role: str = Field(default="", max_length=120)
    url: str = Field(default="", max_length=300)
    summary: str = Field(default="", max_length=800)
    skills: list[str] = Field(default_factory=list, max_length=12)


class ProfileUpdateRequest(BaseModel):
    """Partial profile patch; omitted fields are never cleared."""

    name: str | None = Field(default=None, min_length=1, max_length=80)
    headline: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=500)
    location: str | None = Field(default=None, max_length=100)
    github_url: str | None = Field(default=None, max_length=300)
    portfolio_url: str | None = Field(default=None, max_length=300)
    resume_url: str | None = Field(default=None, max_length=300)
    profile_theme: str | None = None
    profile_layout: str | None = None
    work_history: list[WorkExperienceItem] | None = Field(default=None, max_length=12)
    profile_projects: list[ProfileProjectItem] | None = Field(default=None, max_length=12)
    profile_primary_color: str | None = None
    profile_secondary_color: str | None = None
    profile_background_color: str | None = None

    @field_validator("profile_theme")
    @classmethod
    def valid_theme(cls, value):
        if value is not None and value not in PROFILE_THEMES:
            raise ValueError("Unknown profile theme")
        return value

    @field_validator("profile_layout")
    @classmethod
    def valid_layout(cls, value):
        if value is not None and value not in PROFILE_LAYOUTS:
            raise ValueError("Unknown profile layout")
        return value

    @field_validator("profile_projects")
    @classmethod
    def valid_project_urls(cls, value):
        for project in value or []:
            if project.url and not project.url.startswith(("http://", "https://")):
                raise ValueError("Project URLs must start with http:// or https://")
            project.skills = [skill.strip()[:60] for skill in project.skills if skill.strip()]
        return value

    @field_validator("profile_primary_color", "profile_secondary_color", "profile_background_color")
    @classmethod
    def valid_color(cls, value):
        if value is None:
            return value
        value = value.strip()
        if value and not HEX_COLOR_RE.fullmatch(value):
            raise ValueError("Color must be a six-digit hex value")
        return value.lower()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "user"


def generate_unique_public_slug(name: str) -> str:
    base_slug = slugify(name)
    while True:
        slug = f"{base_slug}-{secrets.token_hex(3)}"
        if not users_collection.find_one({"public_slug": slug}):
            return slug


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def _send_email(to_email, subject, html, from_value):
    if not RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="Email delivery is not configured yet.")
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": from_value, "to": [to_email], "subject": subject, "html": html},
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Email could not be sent.")


async def _send_verification_email(email, url):
    await _send_email(email, "Verify your Boasted email", build_email_verification_html(url), EMAIL_VERIFICATION_FROM)


async def _send_password_reset_email(email, url):
    await _send_email(email, "Reset your Boasted password", build_password_reset_html(url), PASSWORD_RESET_FROM)


def _issue_verification_token(user):
    raw = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "email_verification_required": True,
            "email_verification_token_hash": _hash_token(raw),
            "email_verification_expires_at": expires.isoformat(),
        }},
    )
    return raw, expires


@router.post("/register")
async def register_user(payload: RegisterRequest):
    if not payload.accepted_terms or not payload.accepted_privacy:
        raise HTTPException(
            status_code=422,
            detail="You must accept the Terms and Privacy Policy to create a Boasted account.",
        )

    email = payload.email.lower().strip()
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    accepted_at = datetime.now(timezone.utc).isoformat()
    doc = {
        "name": payload.name.strip(),
        "email": email,
        "public_slug": generate_unique_public_slug(payload.name),
        "hashed_password": hash_password(payload.password),
        "email_verification_required": True,
        "created_at": accepted_at,
        "terms_accepted_at": accepted_at,
        "terms_version": TERMS_VERSION,
        "privacy_accepted_at": accepted_at,
        "privacy_version": PRIVACY_VERSION,
        "legal_acceptance_source": "email-registration",
        "consents": {
            "terms": {
                "accepted": True,
                "version": TERMS_VERSION,
                "accepted_at": accepted_at,
            },
            "privacy_policy": {
                "accepted": True,
                "version": PRIVACY_VERSION,
                "accepted_at": accepted_at,
            },
        },
    }
    result = users_collection.insert_one(doc)
    user = users_collection.find_one({"_id": result.inserted_id})
    raw, _ = _issue_verification_token(user)
    try:
        await _send_verification_email(email, f"{FRONTEND_URL}/login#verify_token={raw}")
        sent = True
    except HTTPException:
        sent = False
    return {"verification_required": True, "email_sent": sent, "message": "Account created. Check your email to verify your account."}


@router.post("/email-verification/resend")
async def resend_email_verification(payload: EmailVerificationRequest):
    message = {"message": "If that account needs verification, a new email has been sent."}
    email = payload.email.lower().strip()
    user = users_collection.find_one({"email": email})
    if not user or user.get("email_verified_at") or not user.get("email_verification_required", False):
        return message
    raw, _ = _issue_verification_token(user)
    try:
        await _send_verification_email(email, f"{FRONTEND_URL}/login#verify_token={raw}")
    except HTTPException:
        pass
    return message


@router.post("/email-verification/confirm")
def confirm_email_verification(payload: EmailVerificationConfirm):
    user = users_collection.find_one({"email_verification_token_hash": _hash_token(payload.token)})
    if not user:
        raise HTTPException(status_code=400, detail="This verification link is invalid or expired.")
    try:
        expires = datetime.fromisoformat(user.get("email_verification_expires_at"))
    except (TypeError, ValueError):
        expires = datetime.min.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This verification link is invalid or expired.")
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified_at": datetime.now(timezone.utc).isoformat(), "email_verification_required": False}, "$unset": {"email_verification_token_hash": "", "email_verification_expires_at": ""}},
    )
    updated = users_collection.find_one({"_id": user["_id"]})
    return {"access_token": create_access_token({"sub": str(user["_id"])}), "token_type": "bearer", "user": serialize_user(updated)}


@router.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username.lower().strip()})
    hashed = user.get("hashed_password") if user else None
    if not user or not hashed or not verify_password(form_data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("email_verification_required", False) and not user.get("email_verified_at"):
        raise HTTPException(status_code=403, detail="Please verify your email before signing in.")
    return {"access_token": create_access_token({"sub": str(user["_id"])}), "token_type": "bearer", "user": serialize_user(user)}


@router.post("/password-reset/request")
async def request_password_reset(payload: PasswordResetRequest):
    message = {"message": "If that email belongs to an account, a reset link has been sent."}
    email = payload.email.lower().strip()
    user = users_collection.find_one({"email": email})
    if not user:
        return message
    raw = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"password_reset_token_hash": _hash_token(raw), "password_reset_expires_at": expires.isoformat()}})
    try:
        await _send_password_reset_email(email, f"{FRONTEND_URL}/login#reset_token={raw}")
    except HTTPException:
        pass
    return message


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm):
    user = users_collection.find_one({"password_reset_token_hash": _hash_token(payload.token)})
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired.")
    try:
        expires = datetime.fromisoformat(user.get("password_reset_expires_at"))
    except (TypeError, ValueError):
        expires = datetime.min.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired.")
    users_collection.update_one({"_id": user["_id"]}, {"$set": {"hashed_password": hash_password(payload.password)}, "$unset": {"password_reset_token_hash": "", "password_reset_expires_at": ""}})
    return {"message": "Password updated. You can now sign in."}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    current_slug = current_user.get("public_slug", "")
    basic = slugify(current_user.get("name", "user"))
    if not current_slug or current_slug == basic:
        slug = generate_unique_public_slug(current_user.get("name", "user"))
        users_collection.update_one({"_id": current_user["_id"]}, {"$set": {"public_slug": slug}})
        current_user["public_slug"] = slug
    return serialize_user(current_user)


@router.patch("/me/profile")
def update_profile(payload: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    """Patch only fields explicitly sent by the client."""
    incoming = payload.model_dump(exclude_unset=True)
    updates = {}

    for field, value in incoming.items():
        if value is None:
            continue
        if field in PROFILE_TEXT_FIELDS:
            value = value.strip()
        updates[field] = value

    if "name" in updates and not updates["name"]:
        raise HTTPException(status_code=422, detail="name cannot be empty")

    for field in ("github_url", "portfolio_url", "resume_url"):
        if field in updates and updates[field] and not updates[field].startswith(("http://", "https://")):
            raise HTTPException(status_code=422, detail=f"{field} must start with http:// or https://")

    if updates:
        users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    return serialize_user(users_collection.find_one({"_id": current_user["_id"]}))