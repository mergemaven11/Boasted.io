"""Document this first-party Python module."""
from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.career_intelligence import build_career_intelligence
from app.database import entries_collection, impact_receipts_collection

router = APIRouter(prefix="/career-intelligence", tags=["career-intelligence"])


def _load_intelligence(current_user: dict) -> dict:
    """Handle load intelligence.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    return build_career_intelligence(entries, receipts)


@router.get("")
def get_career_intelligence(current_user: dict = Depends(get_current_user)):
    """Handle get career intelligence.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    return _load_intelligence(current_user)


@router.get("/skills")
def get_skill_intelligence(current_user: dict = Depends(get_current_user)):
    """Handle get skill intelligence.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    intelligence = _load_intelligence(current_user)
    return {"skills": intelligence["skills"], "methodology": intelligence["methodology"]}


@router.get("/gaps")
def get_career_intelligence_gaps(current_user: dict = Depends(get_current_user)):
    """Handle get career intelligence gaps.

    Args:
        current_user: Function argument.

    Returns:
        Function result.
    """
    intelligence = _load_intelligence(current_user)
    return {
        "gaps": intelligence["gaps"],
        "recommended_actions": intelligence["recommended_actions"],
        "methodology": intelligence["methodology"],
    }
