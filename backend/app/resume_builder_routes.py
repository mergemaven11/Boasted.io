from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import impact_receipts_collection, resume_documents_collection
from app.plans import require_feature
from app.resume_builder import analyze_resume

router = APIRouter(prefix="/resume-builder", tags=["resume-builder"])


class ResumeBuildRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=120)
    job_description: str = Field(min_length=20, max_length=20000)
    selected_receipt_ids: list[str] = Field(default_factory=list, max_length=100)


class ResumeBulletPayload(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    source_receipt_id: str = Field(min_length=1, max_length=64)
    source_title: str = Field(default="Impact Receipt", max_length=240)
    matched_terms: list[str] = Field(default_factory=list, max_length=50)
    evidence_count: int = Field(default=0, ge=0, le=1000)
    has_metrics: bool = False
    edited: bool = False


class ResumeSaveRequest(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    target_role: str = Field(min_length=2, max_length=120)
    job_description: str = Field(min_length=20, max_length=20000)
    summary: str = Field(default="", max_length=1200)
    bullets: list[ResumeBulletPayload] = Field(default_factory=list, max_length=20)
    skills: list[str] = Field(default_factory=list, max_length=40)


def _owned_receipts(user_id: str, selected_ids: list[str]) -> list[dict]:
    query: dict = {"user_id": user_id}
    if selected_ids:
        valid_ids = [ObjectId(value) for value in selected_ids if ObjectId.is_valid(value)]
        if not valid_ids:
            return []
        query["_id"] = {"$in": valid_ids}
    return list(impact_receipts_collection.find(query).sort("created_at", -1).limit(100))


def _validate_saved_bullet_sources(user_id: str, bullets: list[ResumeBulletPayload]) -> None:
    source_ids = {bullet.source_receipt_id for bullet in bullets if ObjectId.is_valid(bullet.source_receipt_id)}
    if len(source_ids) != len({bullet.source_receipt_id for bullet in bullets}):
        raise HTTPException(status_code=400, detail="Every saved resume bullet must reference a valid Impact Receipt")
    if not source_ids:
        return
    owned_count = impact_receipts_collection.count_documents(
        {"_id": {"$in": [ObjectId(value) for value in source_ids]}, "user_id": user_id}
    )
    if owned_count != len(source_ids):
        raise HTTPException(status_code=400, detail="Resume bullet source does not belong to this account")


def _server_readiness(bullets: list[ResumeBulletPayload]) -> dict:
    edited_count = sum(1 for bullet in bullets if bullet.edited)
    return {
        "source_linked_draft": edited_count == 0,
        "edited_bullets_needing_review": edited_count,
        "verification_status": "source-linked" if edited_count == 0 else "needs-review",
    }


@router.post("/build")
def build_resume(payload: ResumeBuildRequest, current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "resume_builder")
    user_id = str(current_user["_id"])
    receipts = _owned_receipts(user_id, payload.selected_receipt_ids)
    result = analyze_resume(
        target_role=payload.target_role,
        job_description=payload.job_description,
        receipts=receipts,
    )
    result["source_receipt_count"] = len(receipts)
    return result


@router.post("/resumes", status_code=status.HTTP_201_CREATED)
def save_resume(payload: ResumeSaveRequest, current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "resume_builder")
    user_id = str(current_user["_id"])
    _validate_saved_bullet_sources(user_id, payload.bullets)
    now = datetime.now(timezone.utc)
    bullets = [bullet.model_dump() for bullet in payload.bullets]
    document = {
        "user_id": user_id,
        "title": payload.title.strip(),
        "target_role": payload.target_role.strip(),
        "job_description": payload.job_description,
        "summary": payload.summary,
        "bullets": bullets,
        "skills": [skill.strip()[:120] for skill in payload.skills if skill.strip()],
        "readiness": _server_readiness(payload.bullets),
        "schema_version": 2,
        "created_at": now,
        "updated_at": now,
    }
    result = resume_documents_collection.insert_one(document)
    return {"id": str(result.inserted_id), **{k: v for k, v in document.items() if k != "user_id"}}


@router.get("/resumes")
def list_resumes(current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "resume_builder")
    cursor = resume_documents_collection.find({"user_id": str(current_user["_id"])}).sort("updated_at", -1).limit(50)
    return {
        "resumes": [
            {
                "id": str(item["_id"]),
                "title": item.get("title", "Untitled resume"),
                "target_role": item.get("target_role", ""),
                "summary": item.get("summary", ""),
                "bullets": item.get("bullets", []),
                "skills": item.get("skills", []),
                "readiness": item.get("readiness", {}),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at"),
            }
            for item in cursor
        ]
    }


@router.delete("/resumes/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "resume_builder")
    if not ObjectId.is_valid(resume_id):
        raise HTTPException(status_code=400, detail="Invalid resume ID")
    result = resume_documents_collection.delete_one(
        {"_id": ObjectId(resume_id), "user_id": str(current_user["_id"])}
    )
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Resume not found")
    return None
