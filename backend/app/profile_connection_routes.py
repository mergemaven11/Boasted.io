"""Opt-in connection settings for BragStack Proof Profiles."""

from datetime import datetime, timedelta, timezone
from typing import Literal
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.auth import get_current_user
from app.database import analytics_events_collection, users_collection
from app.public_slug_routes import get_user_by_public_slug

router = APIRouter(tags=["profile-connection"])

ALLOWED_CONVERSATION_TYPES = {
    "recruiter-chat",
    "technical-deep-dive",
    "networking",
    "mentoring",
    "consulting",
}

PUBLIC_PROFILE_EVENT_TYPES = {
    "profile_view",
    "open_to_talk_click",
    "github_click",
    "portfolio_click",
    "resume_click",
}


def _is_calendly_booking_url(value: str | None) -> bool:
    """Return whether a URL is an HTTPS Calendly scheduling page."""
    if not value:
        return False
    normalized = value.strip().rstrip("/")
    parsed = urlparse(normalized)
    hostname = (parsed.hostname or "").lower()
    return bool(
        parsed.scheme == "https"
        and (hostname == "calendly.com" or hostname.endswith(".calendly.com"))
        and parsed.path
        and parsed.path != "/"
    )


class ProfileConnectionUpdate(BaseModel):
    """Represent user-controlled Open to Talk and public scheduling settings."""

    open_to_talk: bool | None = None
    open_to_talk_url: str | None = Field(default=None, max_length=500)
    open_to_talk_note: str | None = Field(default=None, max_length=240)
    open_to_talk_types: list[str] | None = Field(default=None, max_length=5)
    calendly_enabled: bool | None = None
    calendly_url: str | None = Field(default=None, max_length=500)

    @field_validator("open_to_talk_url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        """Require a normal web URL when a connection URL is supplied."""
        if value is None:
            return value
        normalized = value.strip()
        if normalized and not normalized.startswith(("https://", "http://")):
            raise ValueError("Open to Talk URL must start with http:// or https://")
        return normalized

    @field_validator("calendly_url")
    @classmethod
    def validate_calendly_url(cls, value: str | None) -> str | None:
        """Accept only HTTPS Calendly scheduling links for the public embed."""
        if value is None:
            return value
        normalized = value.strip().rstrip("/")
        if not normalized:
            return ""
        if not _is_calendly_booking_url(normalized):
            raise ValueError("Calendly URL must be an https://calendly.com/... scheduling link")
        return normalized

    @field_validator("open_to_talk_types")
    @classmethod
    def validate_types(cls, values: list[str] | None) -> list[str] | None:
        """Allow only known conversation types and remove duplicates."""
        if values is None:
            return values
        normalized = []
        for value in values:
            item = value.strip().lower()
            if item not in ALLOWED_CONVERSATION_TYPES:
                raise ValueError(f"Unknown Open to Talk conversation type: {item}")
            if item not in normalized:
                normalized.append(item)
        return normalized


class PublicProfileAnalyticsEvent(BaseModel):
    """Privacy-minimized analytics emitted by a public Proof Profile."""

    event_type: Literal[
        "profile_view",
        "open_to_talk_click",
        "github_click",
        "portfolio_click",
        "resume_click",
    ]
    visitor_id: str = Field(default="", max_length=80, pattern=r"^[A-Za-z0-9._:-]*$")
    referrer_host: str = Field(default="", max_length=160)

    @field_validator("referrer_host")
    @classmethod
    def normalize_referrer_host(cls, value: str) -> str:
        """Keep only a compact hostname-like value supplied by the browser."""
        normalized = value.strip().lower()
        if any(char in normalized for char in ("/", "?", "#", "@")):
            raise ValueError("Referrer host must not contain a URL path or user information")
        return normalized


def serialize_connection_settings(user: dict, *, public: bool) -> dict:
    """Serialize connection settings without leaking disabled contact data.

    Legacy users stored Calendly in ``open_to_talk_url`` before dedicated
    Calendly fields existed. When that legacy URL was already explicitly
    public through Open to Talk, continue exposing it as the inline scheduler
    until the user saves the new Calendly settings. An explicit
    ``calendly_enabled`` value always wins, so disabling the new integration is
    respected.
    """
    open_to_talk_enabled = bool(user.get("open_to_talk", False))
    open_to_talk_url = user.get("open_to_talk_url", "") or ""
    stored_calendly_url = user.get("calendly_url", "") or ""

    legacy_calendly_url = ""
    if open_to_talk_enabled and _is_calendly_booking_url(open_to_talk_url):
        legacy_calendly_url = open_to_talk_url.strip().rstrip("/")

    if "calendly_enabled" in user:
        calendly_enabled = bool(user.get("calendly_enabled", False))
    else:
        calendly_enabled = bool(legacy_calendly_url)

    effective_calendly_url = stored_calendly_url or legacy_calendly_url

    return {
        "open_to_talk": open_to_talk_enabled,
        "open_to_talk_url": open_to_talk_url
        if (open_to_talk_enabled or not public)
        else "",
        "open_to_talk_note": user.get("open_to_talk_note", "")
        if (open_to_talk_enabled or not public)
        else "",
        "open_to_talk_types": user.get("open_to_talk_types", [])
        if (open_to_talk_enabled or not public)
        else [],
        "calendly_enabled": calendly_enabled,
        "calendly_url": effective_calendly_url
        if (calendly_enabled or not public)
        else "",
    }


@router.get("/profile/connection")
def get_profile_connection(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's connection and scheduling settings."""
    return serialize_connection_settings(current_user, public=False)


@router.patch("/profile/connection")
def update_profile_connection(
    payload: ProfileConnectionUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Persist explicit, user-controlled connection and public scheduling settings."""
    incoming = payload.model_dump(exclude_unset=True)
    current = serialize_connection_settings(current_user, public=False)
    merged = {**current, **incoming}

    if merged["open_to_talk"] and not merged["open_to_talk_url"]:
        raise HTTPException(
            status_code=422,
            detail="Add a contact or booking URL before turning on Open to Talk.",
        )
    if merged["calendly_enabled"] and not merged["calendly_url"]:
        raise HTTPException(
            status_code=422,
            detail="Add your Calendly scheduling link before showing it on your Proof Profile.",
        )

    updates = {}
    for key, value in incoming.items():
        if key == "open_to_talk_note" and value is not None:
            value = value.strip()
        updates[key] = value

    if updates:
        users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    updated = users_collection.find_one({"_id": current_user["_id"]})
    return serialize_connection_settings(updated, public=False)


@router.get("/public/brag/{slug}/connection")
def get_public_profile_connection(slug: str):
    """Return only connection settings the profile owner explicitly enabled."""
    user = get_user_by_public_slug(slug)
    return serialize_connection_settings(user, public=True)


@router.post("/public/brag/{slug}/analytics", status_code=status.HTTP_202_ACCEPTED)
def record_public_profile_analytics(slug: str, payload: PublicProfileAnalyticsEvent):
    """Record privacy-minimized Proof Profile engagement without IPs or user agents."""
    user = get_user_by_public_slug(slug)
    now = datetime.now(timezone.utc)
    user_id = str(user["_id"])

    if payload.event_type == "profile_view" and payload.visitor_id:
        recent_view = analytics_events_collection.find_one(
            {
                "user_id": user_id,
                "event_type": "profile_view",
                "visitor_id": payload.visitor_id,
                "created_at": {"$gte": now - timedelta(minutes=30)},
            },
            {"_id": 1},
        )
        if recent_view is not None:
            return {"recorded": False, "deduplicated": True}

    analytics_events_collection.insert_one(
        {
            "user_id": user_id,
            "public_slug": (user.get("public_slug") or slug).strip().lower(),
            "event_type": payload.event_type,
            "visitor_id": payload.visitor_id,
            "referrer_host": payload.referrer_host,
            "created_at": now,
        }
    )
    return {"recorded": True, "deduplicated": False}
