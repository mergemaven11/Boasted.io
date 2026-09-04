"""Profile media persistence."""
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user, serialize_user
from app.database import users_collection
from app.public_slug_routes import get_user_by_public_slug

router = APIRouter(tags=["auth"])
DATA_IMAGE_RE = re.compile(r"^data:image/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$")
MAX_AVATAR_VALUE_LENGTH = 450_000


class AvatarUpdateRequest(BaseModel):
    avatar_url: str = Field(default="", max_length=MAX_AVATAR_VALUE_LENGTH)


@router.patch("/auth/me/avatar")
def update_avatar(payload: AvatarUpdateRequest, current_user: dict = Depends(get_current_user)):
    """Store either a normal HTTPS image URL or a compressed browser-uploaded image."""
    avatar_url = payload.avatar_url.strip()
    valid_web_url = avatar_url.startswith(("http://", "https://"))
    valid_uploaded_image = bool(DATA_IMAGE_RE.fullmatch(avatar_url))
    if avatar_url and not (valid_web_url or valid_uploaded_image):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Profile photo must be a supported image upload or an http(s) image URL.",
        )

    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"avatar_url": avatar_url}},
    )
    updated_user = users_collection.find_one({"_id": current_user["_id"]})
    return serialize_user(updated_user)


@router.get("/public/brag/{slug}/avatar")
def get_public_profile_avatar(slug: str):
    """Return only the profile photo the owner saved for their public Proof Portfolio."""
    user = get_user_by_public_slug(slug)
    return {"avatar_url": str(user.get("avatar_url") or "")}
