from datetime import datetime, timedelta, timezone
import hashlib
import os
import re
import secrets

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    serialize_user,
    verify_password,
)
from app.database import users_collection

router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
PASSWORD_RESET_FROM = os.getenv("PASSWORD_RESET_FROM", "BragStack <noreply@usebragstack.com>")
EMAIL_VERIFICATION_FROM = os.getenv("EMAIL_VERIFICATION_FROM", PASSWORD_RESET_FROM)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8)


class EmailVerificationRequest(BaseModel):
    email: EmailStr


class EmailVerificationConfirm(BaseModel):
    token: str = Field(..., min_length=20, max_length=300)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=20, max_length=300)
    password: str = Field(..., min_length=8, max_length=256)


class ProfileUpdateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    headline: str = Field(default="", max_length=120)
    bio: str = Field(default="", max_length=500)
    location: str = Field(default="", max_length=100)
    github_url: str = Field(default="", max_length=300)
    portfolio_url: str = Field(default="", max_length=300)
    resume_url: str = Field(default="", max_length=300)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "user"


def generate_unique_public_slug(name: str) -> str:
    base_slug = slugify(name)
    while True:
        random_suffix = secrets.token_hex(3)
        slug = f"{base_slug}-{random_suffix}"
        if not users_collection.find_one({"public_slug": slug}):
            return slug


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


async def _send_email(to_email: str, subject: str, html: str, from_value: str) -> None:
    if not RESEND_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email delivery is not configured yet.",
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={"from": from_value, "to": [to_email], "subject": subject, "html": html},
        )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Email could not be sent.",
        )


async def _send_verification_email(email: str, verification_url: str) -> None:
    await _send_email(
        email,
        "Verify your BragStack email",
        (
            "<div style='font-family:Arial,sans-serif;line-height:1.6'>"
            "<h2>Verify your BragStack email</h2>"
            "<p>Confirm your email address to finish creating your BragStack account.</p>"
            f"<p><a href='{verification_url}'>Verify email</a></p>"
            "<p>This link expires in 24 hours.</p>"
            "</div>"
        ),
        EMAIL_VERIFICATION_FROM,
    )


async def _send_password_reset_email(email: str, reset_url: str) -> None:
    await _send_email(
        email,
        "Reset your BragStack password",
        (
            "<div style='font-family:Arial,sans-serif;line-height:1.6'>"
            "<h2>Reset your BragStack password</h2>"
            "<p>We received a request to reset your password.</p>"
            f"<p><a href='{reset_url}'>Reset password</a></p>"
            "<p>This link expires in 30 minutes. If you did not request it, you can ignore this email.</p>"
            "</div>"
        ),
        PASSWORD_RESET_FROM,
    )


def _issue_verification_token(user: dict) -> tuple[str, datetime]:
    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "email_verification_required": True,
                "email_verification_token_hash": _hash_token(raw_token),
                "email_verification_expires_at": expires_at.isoformat(),
            }
        },
    )
    return raw_token, expires_at


@router.post("/register")
async def register_user(payload: RegisterRequest):
    normalized_email = payload.email.lower().strip()
    existing_user = users_collection.find_one({"email": normalized_email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user_doc = {
        "name": payload.name.strip(),
        "email": normalized_email,
        "public_slug": generate_unique_public_slug(payload.name),
        "hashed_password": hash_password(payload.password),
        "email_verification_required": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = users_collection.insert_one(user_doc)
    created_user = users_collection.find_one({"_id": result.inserted_id})
    raw_token, _ = _issue_verification_token(created_user)
    verification_url = f"{FRONTEND_URL}/login#verify_token={raw_token}"

    try:
        await _send_verification_email(normalized_email, verification_url)
        email_sent = True
    except HTTPException:
        email_sent = False

    return {
        "verification_required": True,
        "email_sent": email_sent,
        "message": "Account created. Check your email to verify your account.",
    }


@router.post("/email-verification/resend")
async def resend_email_verification(payload: EmailVerificationRequest):
    normalized_email = payload.email.lower().strip()
    user = users_collection.find_one({"email": normalized_email})

    if not user or user.get("email_verified_at") or not user.get("email_verification_required", False):
        return {"message": "If that account needs verification, a new email has been sent."}

    raw_token, _ = _issue_verification_token(user)
    verification_url = f"{FRONTEND_URL}/login#verify_token={raw_token}"
    await _send_verification_email(normalized_email, verification_url)
    return {"message": "If that account needs verification, a new email has been sent."}


@router.post("/email-verification/confirm")
def confirm_email_verification(payload: EmailVerificationConfirm):
    token_hash = _hash_token(payload.token)
    user = users_collection.find_one({"email_verification_token_hash": token_hash})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This verification link is invalid or expired.")

    expires_raw = user.get("email_verification_expires_at")
    try:
        expires_at = datetime.fromisoformat(expires_raw)
    except (TypeError, ValueError):
        expires_at = datetime.min.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This verification link is invalid or expired.")

    verified_at = datetime.now(timezone.utc).isoformat()
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "email_verified_at": verified_at,
                "email_verification_required": False,
            },
            "$unset": {
                "email_verification_token_hash": "",
                "email_verification_expires_at": "",
            },
        },
    )
    updated_user = users_collection.find_one({"_id": user["_id"]})
    access_token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(updated_user),
    }


@router.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    normalized_email = form_data.username.lower().strip()
    user = users_collection.find_one({"email": normalized_email})
    hashed_password = user.get("hashed_password") if user else None

    if not user or not hashed_password or not verify_password(form_data.password, hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.get("email_verification_required", False) and not user.get("email_verified_at"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before signing in.",
        )

    access_token = create_access_token({"sub": str(user["_id"])})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": serialize_user(user),
    }


@router.post("/password-reset/request")
async def request_password_reset(payload: PasswordResetRequest):
    normalized_email = payload.email.lower().strip()
    user = users_collection.find_one({"email": normalized_email})

    if not user:
        return {"message": "If that email belongs to an account, a reset link has been sent."}

    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_reset_token_hash": _hash_token(raw_token),
                "password_reset_expires_at": expires_at.isoformat(),
            }
        },
    )
    reset_url = f"{FRONTEND_URL}/login#reset_token={raw_token}"

    try:
        await _send_password_reset_email(normalized_email, reset_url)
    except HTTPException:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$unset": {"password_reset_token_hash": "", "password_reset_expires_at": ""}},
        )
        raise

    return {"message": "If that email belongs to an account, a reset link has been sent."}


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm):
    token_hash = _hash_token(payload.token)
    user = users_collection.find_one({"password_reset_token_hash": token_hash})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or expired.")

    expires_raw = user.get("password_reset_expires_at")
    try:
        expires_at = datetime.fromisoformat(expires_raw)
    except (TypeError, ValueError):
        expires_at = datetime.min.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$unset": {"password_reset_token_hash": "", "password_reset_expires_at": ""}},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or expired.")

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
    current_slug = current_user.get("public_slug", "")
    basic_name_slug = slugify(current_user.get("name", "user"))
    if not current_slug or current_slug == basic_name_slug:
        public_slug = generate_unique_public_slug(current_user.get("name", "user"))
        users_collection.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"public_slug": public_slug}},
        )
        current_user["public_slug"] = public_slug
    return serialize_user(current_user)


@router.patch("/me/profile")
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    updates = {
        "name": payload.name.strip(),
        "headline": payload.headline.strip(),
        "bio": payload.bio.strip(),
        "location": payload.location.strip(),
        "github_url": payload.github_url.strip(),
        "portfolio_url": payload.portfolio_url.strip(),
        "resume_url": payload.resume_url.strip(),
    }
    for field_name in ("github_url", "portfolio_url", "resume_url"):
        value = updates[field_name]
        if value and not value.startswith(("http://", "https://")):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field_name} must start with http:// or https://",
            )

    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": updates},
    )
    updated_user = users_collection.find_one({"_id": current_user["_id"]})
    return serialize_user(updated_user)
