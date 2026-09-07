"""Scholarship discovery and provider-submission routes."""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field

from app.database import scholarship_submissions_collection, scholarships_collection
from app.ops_routes import require_internal_role
from app.scholarship_catalog import (
    OPEN_SCHOLARSHIPS_SOURCE,
    archive_expired_scholarships,
    build_scholarship_filter,
    catalog_needs_sync,
    scholarship_source_summary,
    sync_open_scholarships,
)

router = APIRouter(prefix="/scholarships", tags=["scholarships"])


class ScholarshipSubmissionRequest(BaseModel):
    """Provider-supplied scholarship facts awaiting human review."""

    scholarship_name: str = Field(min_length=3, max_length=180)
    provider_name: str = Field(min_length=2, max_length=180)
    provider_email: EmailStr
    provider_website: str = Field(min_length=8, max_length=500)
    application_url: str = Field(min_length=8, max_length=500)
    description: str = Field(min_length=20, max_length=3000)
    award_amount: str = Field(default="", max_length=120)
    deadline: str = Field(default="", max_length=120)
    eligibility: str = Field(min_length=10, max_length=3000)
    contact_name: str = Field(default="", max_length=120)
    attestation: bool = False
    # Honeypot: real users never see this field.
    company_fax: str = Field(default="", max_length=120)


class ScholarshipSubmissionResponse(BaseModel):
    message: str
    submission_id: str
    status: str


def _public_record(document: dict) -> dict:
    return {
        "id": document.get("catalog_id"),
        "title": document.get("title"),
        "sponsor": document.get("sponsor"),
        "sponsor_type": document.get("sponsor_type"),
        "opportunity_type": document.get("opportunity_type"),
        "summary": document.get("summary"),
        "award_min": document.get("award_min"),
        "award_max": document.get("award_max"),
        "currency": document.get("currency"),
        "basis": document.get("basis"),
        "renewable": document.get("renewable"),
        "deadline_type": document.get("deadline_type"),
        "deadline_date": document.get("deadline_date"),
        "deadline_notes": document.get("deadline_notes"),
        "residency": document.get("residency") or [],
        "education_levels": document.get("education_levels") or [],
        "fields_of_study": document.get("fields_of_study") or [],
        "gpa_min": document.get("gpa_min"),
        "eligibility_other": document.get("eligibility_other") or [],
        "tags": document.get("tags") or [],
        "geo_state": document.get("geo_state"),
        "geo_scope": document.get("geo_scope"),
        "info_url": document.get("info_url"),
        "apply_url": document.get("apply_url"),
        "availability": document.get("availability"),
        "source_name": document.get("source_name"),
        "source_url": document.get("source_url"),
        "source_verified_at": document.get("source_verified_at"),
        "source_added_at": document.get("source_added_at"),
        "rights_basis": document.get("rights_basis"),
        "license_id": document.get("license_id"),
        "license_url": document.get("license_url"),
        "attribution": document.get("attribution"),
    }


def _ensure_seeded(background_tasks: BackgroundTasks) -> None:
    """Seed synchronously once, then refresh stale data after responses."""
    if scholarships_collection.count_documents({"source": OPEN_SCHOLARSHIPS_SOURCE}, limit=1) == 0:
        try:
            sync_open_scholarships()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The scholarship catalog is being initialized. Please try again shortly.",
            ) from exc
    elif catalog_needs_sync():
        background_tasks.add_task(sync_open_scholarships)
    archive_expired_scholarships()


@router.get("")
def list_scholarships(
    background_tasks: BackgroundTasks,
    q: str = Query(default="", max_length=220),
    state_code: str | None = Query(default=None, alias="state", min_length=2, max_length=2),
    level: str | None = Query(default=None, max_length=60),
    basis: str | None = Query(default=None, max_length=40),
    availability: str | None = Query(default=None, max_length=30),
    min_amount: int | None = Query(default=None, ge=0, le=10_000_000),
    sort: Literal["recent", "deadline", "amount"] = "recent",
    page: int = Query(default=1, ge=1, le=10_000),
    page_size: int = Query(default=20, ge=8, le=40),
):
    """Search active scholarships with deterministic natural-query interpretation."""
    _ensure_seeded(background_tasks)
    mongo_filter, interpreted = build_scholarship_filter(
        query=q,
        state=state_code,
        level=level,
        basis=basis,
        availability=availability,
        min_amount=min_amount,
    )
    sort_spec = {
        "recent": [("source_added_at", -1), ("source_verified_at", -1), ("title", 1)],
        "deadline": [("deadline_date", 1), ("title", 1)],
        "amount": [("award_max", -1), ("title", 1)],
    }[sort]
    total = scholarships_collection.count_documents(mongo_filter)
    skip = (page - 1) * page_size
    cursor = scholarships_collection.find(mongo_filter).sort(sort_spec).skip(skip).limit(page_size)
    results = [_public_record(document) for document in cursor]

    active_filter = {"status": "active"}
    active_total = scholarships_collection.count_documents(active_filter)
    source = scholarship_source_summary()
    return {
        "results": results,
        "total": total,
        "active_total": active_total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, math.ceil(total / page_size)) if total else 0,
        "sort": sort,
        "query": q,
        "query_interpretation": interpreted,
        "source": source,
        "coverage_notice": (
            "Current licensed seed uses Open Scholarships (CC BY 4.0), a Nevada-first dataset that also includes national opportunities. "
            "Boasted does not copy proprietary scholarship aggregators."
        ),
    }


@router.get("/sources")
def scholarship_sources():
    """Expose provenance and licensing for scholarship data shown by Boasted."""
    return {
        "approved": [scholarship_source_summary()],
        "policy": "Only first-party submissions or sources with an explicit storage/display rights basis may enter the catalog.",
    }


@router.post("/submissions", response_model=ScholarshipSubmissionResponse, status_code=status.HTTP_202_ACCEPTED)
def submit_scholarship(payload: ScholarshipSubmissionRequest):
    """Accept a provider listing for review; nothing is auto-published."""
    if payload.company_fax.strip():
        # Do not reveal honeypot behavior to automated submitters.
        return ScholarshipSubmissionResponse(message="Scholarship submitted for review.", submission_id="received", status="pending_review")
    if not payload.attestation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must confirm that you are authorized to submit and publish this scholarship information.",
        )
    for value in (payload.provider_website, payload.application_url):
        if not value.lower().startswith(("https://", "http://")):
            raise HTTPException(status_code=400, detail="Provider and application links must be full http(s) URLs.")

    now = datetime.now(timezone.utc)
    document = {
        **payload.model_dump(exclude={"company_fax"}),
        "provider_email": str(payload.provider_email).lower(),
        "status": "pending_review",
        "rights_basis": "provider_submission_attestation",
        "submitted_at": now,
        "updated_at": now,
        "published_at": None,
        "reviewed_at": None,
    }
    result = scholarship_submissions_collection.insert_one(document)
    return ScholarshipSubmissionResponse(
        message="Scholarship submitted for review. Boasted will verify the provider, source, eligibility, and deadline before publication.",
        submission_id=str(result.inserted_id),
        status="pending_review",
    )


@router.post("/sync")
def sync_scholarships_now(
    _current_user: dict = Depends(require_internal_role("ops", "admin")),
):
    """Allow an authorized operator/cron caller to force the approved-source refresh."""
    return sync_open_scholarships()
