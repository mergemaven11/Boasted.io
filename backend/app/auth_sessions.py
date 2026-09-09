"""Server-managed authentication sessions for Boasted.

JWTs prove that a request was signed by Boasted. Session records add the
server-side controls a stateless JWT cannot provide on its own: inactivity
expiry, absolute expiry, logout revocation, and account-wide revocation after a
password reset or other security event.
"""

from datetime import datetime, timedelta, timezone
import os
import secrets

from app.database import auth_sessions_collection

AUTH_SESSION_IDLE_MINUTES = int(os.getenv("AUTH_SESSION_IDLE_MINUTES", "60"))
AUTH_SESSION_ABSOLUTE_DAYS = int(os.getenv("AUTH_SESSION_ABSOLUTE_DAYS", "7"))
AUTH_SESSION_TOUCH_SECONDS = int(os.getenv("AUTH_SESSION_TOUCH_SECONDS", "60"))


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
        except ValueError:
            return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    return None


def create_auth_session(user_id: str) -> str:
    """Create and persist a revocable session for one authenticated user."""
    now = _utcnow()
    session_id = secrets.token_urlsafe(32)
    auth_sessions_collection.insert_one(
        {
            "_id": session_id,
            "user_id": str(user_id),
            "created_at": now,
            "last_seen_at": now,
            "expires_at": now + timedelta(days=AUTH_SESSION_ABSOLUTE_DAYS),
            "revoked_at": None,
            "revoked_reason": None,
        }
    )
    return session_id


def validate_and_touch_auth_session(session_id: str, user_id: str) -> bool:
    """Validate idle/absolute expiry and touch recent activity.

    Returns False for unknown, revoked, idle-expired, or absolute-expired
    sessions. Expired sessions are marked revoked so subsequent checks are
    cheap and auditable.
    """
    if not session_id:
        return False

    session = auth_sessions_collection.find_one(
        {"_id": session_id, "user_id": str(user_id)}
    )
    if not session or session.get("revoked_at"):
        return False

    now = _utcnow()
    expires_at = _as_utc(session.get("expires_at"))
    last_seen_at = _as_utc(session.get("last_seen_at"))
    if not expires_at or not last_seen_at:
        revoke_auth_session(session_id, "invalid_session_record")
        return False

    if expires_at <= now:
        revoke_auth_session(session_id, "absolute_timeout")
        return False

    if last_seen_at + timedelta(minutes=AUTH_SESSION_IDLE_MINUTES) <= now:
        revoke_auth_session(session_id, "idle_timeout")
        return False

    if (now - last_seen_at).total_seconds() >= AUTH_SESSION_TOUCH_SECONDS:
        auth_sessions_collection.update_one(
            {"_id": session_id, "revoked_at": None},
            {"$set": {"last_seen_at": now}},
        )
    return True


def revoke_auth_session(session_id: str, reason: str = "logout") -> None:
    """Revoke one session without deleting its audit trail."""
    if not session_id:
        return
    auth_sessions_collection.update_one(
        {"_id": session_id, "revoked_at": None},
        {
            "$set": {
                "revoked_at": _utcnow(),
                "revoked_reason": reason,
            }
        },
    )


def revoke_all_auth_sessions(user_id: str, reason: str) -> int:
    """Revoke every active session for a user and return the affected count."""
    result = auth_sessions_collection.update_many(
        {"user_id": str(user_id), "revoked_at": None},
        {
            "$set": {
                "revoked_at": _utcnow(),
                "revoked_reason": reason,
            }
        },
    )
    return int(result.modified_count)
