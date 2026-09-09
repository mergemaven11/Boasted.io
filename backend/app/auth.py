"""Authentication, JWT, and current-user helpers for Boasted."""

import os
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.auth_sessions import validate_and_touch_auth_session
from app.database import users_collection
from app.plans import get_entitlements_for_user, get_plan_for_user

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET environment variable is required")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
MAX_BCRYPT_PASSWORD_BYTES = 72

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _password_fits_bcrypt(password: str) -> bool:
    """Check whether a password fits bcrypt's 72-byte input limit."""
    return len(password.encode("utf-8")) <= MAX_BCRYPT_PASSWORD_BYTES


def hash_password(password: str) -> str:
    """Hash a Boasted password with the configured bcrypt context."""
    if not _password_fits_bcrypt(password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password is too long. Use at most 72 UTF-8 bytes.",
        )
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a candidate password against a stored bcrypt hash."""
    if not _password_fits_bcrypt(plain_password):
        return False
    return password_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a signed Boasted access token with standard timing claims."""
    payload = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update(
        {
            "exp": expire,
            "iat": now,
            "nbf": now,
            "jti": secrets.token_urlsafe(16),
        }
    )
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode a signed access token or raise a standard credentials error."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise credentials_error from exc
    return payload


def get_current_session_id(token: str = Depends(oauth2_scheme)) -> str:
    """Return the authenticated session identifier embedded in a JWT."""
    payload = decode_access_token(token)
    session_id = payload.get("sid")
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return str(session_id)


def serialize_user(user: dict) -> dict:
    """Convert a MongoDB user document into the public API response shape."""
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "email_verified": bool(user.get("email_verified_at")) or not user.get("email_verification_required", False),
        "public_slug": user.get("public_slug", ""),
        "headline": user.get("headline", ""),
        "bio": user.get("bio", ""),
        "location": user.get("location", ""),
        "avatar_url": user.get("avatar_url", ""),
        "github_url": user.get("github_url", ""),
        "portfolio_url": user.get("portfolio_url", ""),
        "resume_url": user.get("resume_url", ""),
        "profile_theme": user.get("profile_theme", "default"),
        "profile_layout": user.get("profile_layout", "editorial"),
        "work_history": user.get("work_history", []),
        "profile_projects": user.get("profile_projects", []),
        "profile_primary_color": user.get("profile_primary_color", ""),
        "profile_secondary_color": user.get("profile_secondary_color", ""),
        "profile_background_color": user.get("profile_background_color", ""),
        "open_to_talk": bool(user.get("open_to_talk", False)),
        "open_to_talk_url": user.get("open_to_talk_url", ""),
        "open_to_talk_note": user.get("open_to_talk_note", ""),
        "open_to_talk_types": user.get("open_to_talk_types", []),
        "plan": get_plan_for_user(user),
        "entitlements": get_entitlements_for_user(user),
        "internal_roles": [
            str(role).strip().lower()
            for role in user.get("internal_roles", [])
            if str(role).strip().lower() in {"support", "ops", "security", "admin"}
        ],
        "created_at": user.get("created_at"),
    }


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Resolve and return the authenticated user for a bearer token.

    A valid signature is necessary but not sufficient. Every access token must
    also reference an active server-side session. This enables inactivity
    expiry, logout revocation, and password-reset revocation without waiting for
    the JWT's cryptographic expiration time.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    user_id = payload.get("sub")
    session_id = payload.get("sid")
    if not user_id or not session_id:
        raise credentials_error
    user_id = str(user_id)
    session_id = str(session_id)

    if not ObjectId.is_valid(user_id):
        raise credentials_error

    if not validate_and_touch_auth_session(session_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_error

    return user
