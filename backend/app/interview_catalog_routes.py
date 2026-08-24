from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_current_user
from app.database import interview_careers_collection
from app.interview_question_rotation import select_rotated_questions
from app.plans import require_feature

router = APIRouter(prefix="/interview-catalog", tags=["interview-catalog"])


def _serialize(document: dict) -> dict:
    return {
        "slug": document["slug"],
        "title": document["title"],
        "family": document["family"],
        "aliases": document.get("aliases", []),
        "question_count": document.get("question_count", len(document.get("questions", []))),
        "questions": document.get("questions", []),
        "catalog_version": document.get("catalog_version", 1),
    }


@router.get("/careers")
def list_interview_careers(
    family: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    require_feature(current_user, "interview_practice")
    query = {"active": True}
    if family:
        query["family"] = family
    cursor = interview_careers_collection.find(query, {"questions": 0}).sort("title", 1)
    careers = [
        {
            "slug": document["slug"],
            "title": document["title"],
            "family": document["family"],
            "aliases": document.get("aliases", []),
            "question_count": document.get("question_count", 0),
        }
        for document in cursor
    ]
    return {"careers": careers, "count": len(careers)}


@router.get("/careers/{slug}")
def get_interview_career(slug: str, current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "interview_practice")
    document = interview_careers_collection.find_one({"slug": slug, "active": True})
    if not document:
        raise HTTPException(status_code=404, detail="Interview career not found")
    return _serialize(document)


@router.get("/careers/{slug}/questions")
def get_interview_questions(
    slug: str,
    count: int = Query(default=8, ge=1, le=15),
    exclude: str | None = Query(default=None, description="Comma-separated question IDs used recently"),
    seed: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    require_feature(current_user, "interview_practice")
    document = interview_careers_collection.find_one({"slug": slug, "active": True})
    if not document:
        raise HTTPException(status_code=404, detail="Interview career not found")
    excluded = {item.strip() for item in (exclude or "").split(",") if item.strip()}
    questions = select_rotated_questions(
        document.get("questions", []),
        count=count,
        exclude_ids=excluded,
        seed=seed,
    )
    return {
        "slug": document["slug"],
        "title": document["title"],
        "family": document["family"],
        "catalog_version": document.get("catalog_version", 1),
        "question_count": document.get("question_count", len(document.get("questions", []))),
        "selected_count": len(questions),
        "excluded_count": len(excluded),
        "questions": questions,
    }
