"""Authenticated self-service account closure."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.account_closure import close_user_account
from app.auth import get_current_user
from app.database import db
from app.plans import has_active_paid_subscription


router = APIRouter(prefix="/auth", tags=["auth"])


class CloseAccountRequest(BaseModel):
    """Explicit server-side confirmation for a destructive account action."""

    confirmation: str = Field(..., pattern="^CLOSE$")


@router.delete("/me/account")
def close_account(
    payload: CloseAccountRequest,
    current_user: dict = Depends(get_current_user),
):
    """Close the current user's BragStack account.

    Active paid subscriptions must be canceled before closure so deleting the
    local account cannot leave a user without access to subscription controls.
    """
    if has_active_paid_subscription(current_user):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cancel your active paid subscription before closing your account.",
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
        "message": "Your BragStack account has been closed.",
        "deleted_records": result["deleted_records"],
    }
