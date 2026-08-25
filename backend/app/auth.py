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
    return len(password.encode("utf-8")) <= MAX_BCRYPT_PASSWORD_BYTES


def hash_password(password: str) -> str:
    if not _password_fits_bcrypt(password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password is too long. Use at most 72 UTF-8 bytes.",
        )
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not _password_fits_bcrypt(plain_password):
        return False
    return password_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
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
        "profile_primary_color": user.get("profile_primary_color", ""),
        "profile_secondary_color": user.get("profile_secondary_color", ""),
        "profile_background_color": user.get("profile_background_color", ""),
        "plan": get_plan_for_user(user),
        "entitlements": get_entitlements_for_user(user),
        "created_at": user.get("created_at"),
    }


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
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
