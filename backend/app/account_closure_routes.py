"""Authenticated self-service account closure."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.account_closure import close_user_account
from app.auth import get_current_user
from app.database import db
from app.plans import has_active_paid_subscription


router = APIRouter(prefix="/auth", tags=["auth"])
RECENT_AUTH_WINDOW = timedelta(minutes=10)


class CloseAccountRequest(BaseModel):
    """Explicit server-side confirmation for a destructive account action."""

    confirmation: str = Field(..., pattern="^CLOSE$")


def _require_recent_authentication(current_user: dict) -> None:
    """Require a freshly issued access token before irreversible deletion."""
    issued_at = current_user.get("_auth_iat")
    try:
        issued_at_dt = datetime.fromtimestamp(float(issued_at), tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        issued_at_dt = None

    if issued_at_dt is None or datetime.now(timezone.utc) - issued_at_dt > RECENT_AUTH_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "For your security, sign out and sign back in before closing your account, "
                "then try again within 10 minutes."
            ),
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.delete("/me/account")
def close_account(
    payload: CloseAccountRequest,
    current_user: dict = Depends(get_current_user),
):
    """Close the current user's Boasted account after recent authentication.

    A paid subscription must have future renewal canceled before closure. Once
    cancel-at-period-end is recorded, the user may close immediately if they
    accept losing access to any remaining paid period.
    """
    _require_recent_authentication(current_user)

    has_uncanceled_paid_subscription = (
        has_active_paid_subscription(current_user)
        and not bool(current_user.get("billing_cancel_at_period_end", False))
    )
    if has_uncanceled_paid_subscription:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cancel future renewal for your paid subscription before closing your account.",
        )

    user_id = str(current_user["_id"])
    try:
        result = close_user_account(db, user_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Account not found.") from exc
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Your account could not be closed right now. Please try again.",
        ) from exc

    return {
        "message": "Your Boasted account has been closed.",
        "deleted_records": result["deleted_records"],
    }
