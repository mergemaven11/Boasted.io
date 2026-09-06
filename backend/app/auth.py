"""Authentication, JWT, and current-user helpers for BragStack."""

import os
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

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
    """Check whether a password fits bcrypt's 72-byte input limit.

    Args:
        password: Plain-text password to measure after UTF-8 encoding.

    Returns:
        True when the encoded password is at most 72 bytes.
    """
    return len(password.encode("utf-8")) <= MAX_BCRYPT_PASSWORD_BYTES


def hash_password(password: str) -> str:
    """Hash a BragStack password with the configured bcrypt context.

    Args:
        password: Plain-text password supplied during account creation or
            password reset.

    Returns:
        Encoded bcrypt password hash suitable for persistence.

    Raises:
        HTTPException: If the UTF-8 encoded password exceeds bcrypt's
            supported 72-byte limit.
    """
    if not _password_fits_bcrypt(password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password is too long. Use at most 72 UTF-8 bytes.",
        )
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a candidate password against a stored bcrypt hash.

    Args:
        plain_password: Candidate plain-text password.
        hashed_password: Persisted bcrypt password hash.

    Returns:
        True when the password matches; otherwise False. Passwords exceeding
        bcrypt's byte limit are rejected without verification.
    """
    if not _password_fits_bcrypt(plain_password):
        return False
    return password_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a signed BragStack access token with standard timing claims.

    Args:
        data: Claims to include in the token, typically including the user's
            identifier as ``sub``.

    Returns:
        An HS256-signed JWT containing expiration, issue time, not-before time,
        and a unique token identifier.
    """
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


def serialize_user(user: dict) -> dict:
    """Convert a MongoDB user document into the public API response shape.

    Args:
        user: MongoDB user document containing an ``_id`` and optional profile,
            plan, entitlement, and internal-role fields.

    Returns:
        A JSON-friendly dictionary containing profile data, plan information,
        effective entitlements, and allow-listed internal roles. Password hashes
        and other authentication secrets are intentionally excluded.
    """
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

    Args:
        token: OAuth2 bearer token injected by FastAPI.

    Returns:
        The matching MongoDB user document.

    Raises:
        HTTPException: If the token is missing required claims, cannot be
            decoded, contains an invalid MongoDB identifier, or references a
            user that no longer exists.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    if not ObjectId.is_valid(user_id):
        raise credentials_error

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_error

    return user
