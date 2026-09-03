"""Document this first-party Python module."""
from datetime import datetime, timedelta, timezone
import hashlib
import os
import re
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.auth import create_access_token, get_current_user, hash_password, serialize_user, verify_password
from app.database import users_collection
from app.email_templates import build_email_verification_html, build_password_reset_html

router = APIRouter(prefix="/auth", tags=["auth"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
PASSWORD_RESET_FROM = os.getenv("PASSWORD_RESET_FROM", "BragStack <noreply@usebragstack.com>")
EMAIL_VERIFICATION_FROM = os.getenv("EMAIL_VERIFICATION_FROM", PASSWORD_RESET_FROM)
PROFILE_THEMES = {"default", "clinical", "educator", "engineer", "designer", "executive", "trades", "creator", "hospitality", "finance", "legal", "public-service"}
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


class RegisterRequest(BaseModel):
    """Represent RegisterRequest."""
    name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8)


class EmailVerificationRequest(BaseModel):
    """Represent EmailVerificationRequest."""
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    """Represent EmailVerificationConfirm."""
    token: str = Field(..., min_length=20, max_length=300)


class PasswordResetRequest(BaseModel):
    """Represent PasswordResetRequest."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Represent PasswordResetConfirm."""
    token: str = Field(..., min_length=20, max_length=300)
    password: str = Field(..., min_length=8, max_length=256)


class ProfileUpdateRequest(BaseModel):
    """Represent ProfileUpdateRequest."""
    name: str = Field(..., min_length=1, max_length=80)
    headline: str = Field(default="", max_length=120)
    bio: str = Field(default="", max_length=500)
    location: str = Field(default="", max_length=100)
    github_url: str = Field(default="", max_length=300)
    portfolio_url: str = Field(default="", max_length=300)
    resume_url: str = Field(default="", max_length=300)
    profile_theme: str = "default"
    profile_primary_color: str = ""
    profile_secondary_color: str = ""
    profile_background_color: str = ""

    @field_validator("profile_theme")
    @classmethod
    def valid_theme(cls, value):
        """Handle valid theme.

        Args:
            value: Function argument.

        Returns:
            Function result.
        """
        if value not in PROFILE_THEMES:
            raise ValueError("Unknown profile theme")
        return value

    @field_validator("profile_primary_color", "profile_secondary_color", "profile_background_color")
    @classmethod
    def valid_color(cls, value):
        """Handle valid color.

        Args:
            value: Function argument.

        Returns:
            Function result.
        """
        if value and not HEX_COLOR_RE.fullmatch(value):
            raise ValueError("Color must be a six-digit hex value")
        return value.lower()


def slugify(value: str) -> str:
    """Handle slugify.

    Args:
        value: Function argument.

    Returns:
        Function result.
    """
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "user"


def generate_unique_public_slug(name: str) -> str:
    """Handle generate unique public slug.

    Args:
        name: Function argument.

    Returns:
        Function result.
    """
    base_slug = slugify(name)
    while True:
        slug = f"{base_slug}-{secrets.token_hex(3)}"
        if not users_collection.find_one({"public_slug": slug}):
            return slug


def _hash_token(token: str) -> str:
    """Handle hash token.

    Args:
        token: Function argument.

    Returns:
        Function result.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def _send_email(to_email, subject, html, from_value):
    """Handle send email.

    Args:
        to_email: Function argument.
        subject: Function argument.
        html: Function argument.
        from_value: Function argument.
    """
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
    """Handle send verification email.

    Args:
        email: Function argument.
        url: Function argument.
    """
    await _send_email(
        email,
        "Verify your BragStack email",
        build_email_verification_html(url),
        EMAIL_VERIFICATION_FROM,
    )


async def _send_password_reset_email(email, url):
    """Handle send password reset email.

    Args:
        email: Function argument.
        url: Function argument.
    """
    await _send_email(
        email,
        "Reset your BragStack password",
        build_password_reset_html(url),
        PASSWORD_RESET_FROM,
    )


def _issue_verification_token(user):
    """Handle issue verification token.

    Args:
        user: Function argument.

    Returns:
        Function result.
    """
    raw = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "email_verification_required": True,
                "email_verification_token_hash": _hash_token(raw),
                "email_verification_expires_at": expires.isoformat(),
            }
        },
    )
    return raw, expires


@router.post("/register")
async def register_user(payload: RegisterRequest):
    """Handle register user.

    Args:
        payload: Function argument.

    Returns:
        Function result.
    """
    email = payload.email.lower().strip()
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    doc = {
        "name": payload.name.strip(),
        "email": email,
        "public_slug": generate_unique_public_slug(payload.name),
        "hashed_password": hash_password(payload.password),
        "email_verification_required": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = users_collection.insert_one(doc)
    user = users_collection.find_one({"_id": result.inserted_id})
    raw, _ = _issue_verification_token(user)
    try:
        await _send_verification_email(email, f"{FRONTEND_URL}/login#verify_token={raw}")
        sent = True
    except HTTPException:
        sent = False
    return {
        "verification_required": True,
        "email_sent": sent,
        "message": "Account created. Check your email to verify your account.",
    }


@router.post("/email-verification/resend")
async def resend_email_verification(payload: EmailVerificationRequest):
    """Handle resend email verification.

    Args:
        payload: Function argument.

    Returns:
        Function result.
    """
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
    """Handle confirm email verification.

    Args:
        payload: Function argument.

    Returns:
        Function result.
    """
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
        {
            "$set": {
                "email_verified_at": datetime.now(timezone.utc).isoformat(),
                "email_verification_required": False,
            },
            "$unset": {
                "email_verification_token_hash": "",
                "email_verification_expires_at": "",
            },
        },
    )
    updated = users_collection.find_one({"_id": user["_id"]})
    return {
        "access_token": create_access_token({"sub": str(user["_id"])}),
        "token_type": "bearer",
        "user": serialize_user(updated),
    }


@router.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    """Handle login user.

    Args:
        form_data: Function argument.

    Returns:
        Function result.
    """
    user = users_collection.find_one({"email": form_data.username.lower().strip()})
    hashed = user.get("hashed_password") if user else None
    if not user or not hashed or not verify_password(form_data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.get("email_verification_required", False) and not user.get("email_verified_at"):
        raise HTTPException(status_code=403, detail="Please verify your email before signing in.")
    return {
        "access_token": create_access_token({"sub": str(user["_id"])}),
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.post("/password-reset/request")
async def request_password_reset(payload: PasswordResetRequest):
    """Handle request password reset.

    Args:
        payload: Function argument.

    Returns:
        Function result.
    """
    message = {"message": "If that email belongs to an account, a reset link has been sent."}
    email = payload.email.lower().strip()
    user = users_collection.find_one({"email": email})
    if not user:
        return message
    raw = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_reset_token_hash": _hash_token(raw),
                "password_reset_expires_at": expires.isoformat(),
            }
        },
    )
    try:
        await _send_password_reset_email(email, f"{FRONTEND_URL}/login#reset_token={raw}")
    except HTTPException:
        pass
    return message


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm):
    """Handle confirm password reset.

    Args:
        payload: Function argument.

    Returns:
        Function result.
    """
    user = users_collection.find_one({"password_reset_token_hash": _hash_token(payload.token)})
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired.")
    try:
        expires = datetime.fromisoformat(user.get("password_reset_expires_at"))
    except (TypeError, ValueError):
        expires = datetime.min.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="This reset link is invalid or expired.")
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"hashed_password": hash_password(payload.password)},
            "$unset": {"password_reset_token_hash": "", "password_reset_expires_at": ""},
        },
    )
    return {"message": "Password updated. You can now sign in."}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Handle get me.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    current_slug = current_user.get("public_slug", "")
    basic = slugify(current_user.get("name", "user"))
    if not current_slug or current_slug == basic:
        slug = generate_unique_public_slug(current_user.get("name", "user"))
        users_collection.update_one({"_id": current_user["_id"]}, {"$set": {"public_slug": slug}})
        current_user["public_slug"] = slug
    return serialize_user(current_user)


@router.patch("/me/profile")
def update_profile(payload: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    """Handle update profile.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    updates = {
        "name": payload.name.strip(),
        "headline": payload.headline.strip(),
        "bio": payload.bio.strip(),
        "location": payload.location.strip(),
        "github_url": payload.github_url.strip(),
        "portfolio_url": payload.portfolio_url.strip(),
        "resume_url": payload.resume_url.strip(),
        "profile_theme": payload.profile_theme,
        "profile_primary_color": payload.profile_primary_color,
        "profile_secondary_color": payload.profile_secondary_color,
        "profile_background_color": payload.profile_background_color,
    }
    for field in ("github_url", "portfolio_url", "resume_url"):
        if updates[field] and not updates[field].startswith(("http://", "https://")):
            raise HTTPException(status_code=422, detail=f"{field} must start with http:// or https://")
    users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    return serialize_user(users_collection.find_one({"_id": current_user["_id"]}))
