"""Opt-in connection settings for BragStack Proof Profiles."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.auth import get_current_user
from app.database import users_collection
from app.public_slug_routes import get_user_by_public_slug

router = APIRouter(tags=["profile-connection"])

ALLOWED_CONVERSATION_TYPES = {
    "recruiter-chat",
    "technical-deep-dive",
    "networking",
    "mentoring",
    "consulting",
}


class ProfileConnectionUpdate(BaseModel):
    """Represent user-controlled Open to Talk settings."""

    open_to_talk: bool = False
    open_to_talk_url: str = Field(default="", max_length=500)
    open_to_talk_note: str = Field(default="", max_length=240)
    open_to_talk_types: list[str] = Field(default_factory=list, max_length=5)

    @field_validator("open_to_talk_url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        """Require a normal web URL when a connection URL is supplied."""
        normalized = value.strip()
        if normalized and not normalized.startswith(("https://", "http://")):
            raise ValueError("Open to Talk URL must start with http:// or https://")
        return normalized

    @field_validator("open_to_talk_types")
    @classmethod
    def validate_types(cls, values: list[str]) -> list[str]:
        """Allow only known conversation types and remove duplicates."""
        normalized = []
        for value in values:
            item = value.strip().lower()
            if item not in ALLOWED_CONVERSATION_TYPES:
                raise ValueError(f"Unknown Open to Talk conversation type: {item}")
            if item not in normalized:
                normalized.append(item)
        return normalized


def serialize_connection_settings(user: dict, *, public: bool) -> dict:
    """Serialize connection settings without leaking disabled contact data.

    Args:
        user: MongoDB user document.
        public: Whether the response is being served anonymously.

    Returns:
        Safe connection settings. Disabled public settings never expose the
        stored URL, note, or conversation types.
    """
    enabled = bool(user.get("open_to_talk", False))
    if public and not enabled:
        return {
            "open_to_talk": False,
            "open_to_talk_url": "",
            "open_to_talk_note": "",
            "open_to_talk_types": [],
        }
    return {
        "open_to_talk": enabled,
        "open_to_talk_url": user.get("open_to_talk_url", ""),
        "open_to_talk_note": user.get("open_to_talk_note", ""),
        "open_to_talk_types": user.get("open_to_talk_types", []),
    }


@router.get("/profile/connection")
def get_profile_connection(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's Open to Talk settings."""
    return serialize_connection_settings(current_user, public=False)


@router.patch("/profile/connection")
def update_profile_connection(
    payload: ProfileConnectionUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Persist explicit, user-controlled Open to Talk settings."""
    if payload.open_to_talk and not payload.open_to_talk_url:
        raise HTTPException(
            status_code=422,
            detail="Add a contact or booking URL before turning on Open to Talk.",
        )
    updates = {
        "open_to_talk": payload.open_to_talk,
        "open_to_talk_url": payload.open_to_talk_url,
        "open_to_talk_note": payload.open_to_talk_note.strip(),
        "open_to_talk_types": payload.open_to_talk_types,
    }
    users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    updated = users_collection.find_one({"_id": current_user["_id"]})
    return serialize_connection_settings(updated, public=False)


@router.get("/public/brag/{slug}/connection")
def get_public_profile_connection(slug: str):
    """Return only connection settings the profile owner explicitly enabled."""
    user = get_user_by_public_slug(slug)
    return serialize_connection_settings(user, public=True)
