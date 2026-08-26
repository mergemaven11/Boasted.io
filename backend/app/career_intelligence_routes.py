from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.career_intelligence import build_career_intelligence
from app.database import entries_collection, impact_receipts_collection

router = APIRouter(prefix="/career-intelligence", tags=["career-intelligence"])


def _load_intelligence(current_user: dict) -> dict:
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    return build_career_intelligence(entries, receipts)


@router.get("")
def get_career_intelligence(current_user: dict = Depends(get_current_user)):
    return _load_intelligence(current_user)


@router.get("/skills")
def get_skill_intelligence(current_user: dict = Depends(get_current_user)):
    intelligence = _load_intelligence(current_user)
    return {"skills": intelligence["skills"], "methodology": intelligence["methodology"]}


@router.get("/gaps")
def get_career_intelligence_gaps(current_user: dict = Depends(get_current_user)):
    intelligence = _load_intelligence(current_user)
    return {
        "gaps": intelligence["gaps"],
        "recommended_actions": intelligence["recommended_actions"],
        "methodology": intelligence["methodology"],
    }
