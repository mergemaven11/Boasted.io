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
    selected_receipt_ids: list[str] = []


class ResumeSaveRequest(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    target_role: str = Field(min_length=2, max_length=120)
    job_description: str = Field(min_length=20, max_length=20000)
    summary: str = Field(default="", max_length=1200)
    bullets: list[dict] = []
    skills: list[str] = []
    readiness: dict = {}


def _owned_receipts(user_id: str, selected_ids: list[str]) -> list[dict]:
    query: dict = {"user_id": user_id}
    if selected_ids:
        valid_ids = [ObjectId(value) for value in selected_ids if ObjectId.is_valid(value)]
        if not valid_ids:
            return []
        query["_id"] = {"$in": valid_ids}
    return list(impact_receipts_collection.find(query).sort("created_at", -1).limit(100))


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
    now = datetime.now(timezone.utc)
    document = {
        "user_id": str(current_user["_id"]),
        "title": payload.title.strip(),
        "target_role": payload.target_role.strip(),
        "job_description": payload.job_description,
        "summary": payload.summary,
        "bullets": payload.bullets,
        "skills": payload.skills,
        "readiness": payload.readiness,
        "schema_version": 1,
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
    result = resume_documents_collection.delete_one({"_id": ObjectId(resume_id), "user_id": str(current_user["_id"])})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Resume not found")
    return None
