"""Document this first-party Python module."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user, serialize_user
from app.database import users_collection

router = APIRouter(prefix="/auth/me", tags=["auth"])


class AvatarUpdateRequest(BaseModel):
    """Represent AvatarUpdateRequest."""
    avatar_url: str = Field(default="", max_length=1000)


@router.patch("/avatar")
def update_avatar(
    payload: AvatarUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Handle update avatar.

    Args:
        payload: Function argument.
        current_user: Function argument.

    Returns:
        Function result.
    """
    avatar_url = payload.avatar_url.strip()
    if avatar_url and not avatar_url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="avatar_url must start with http:// or https://",
        )

    users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"avatar_url": avatar_url}},
    )
    updated_user = users_collection.find_one({"_id": current_user["_id"]})
    return serialize_user(updated_user)
