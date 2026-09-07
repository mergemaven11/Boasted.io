"""Career-aware student opportunity discovery using licensed/open public APIs.

CareerOneStop is sponsored by the U.S. Department of Labor and explicitly exposes
its career, employment, and education datasets as Web APIs for third-party sites.
The API documentation states that its API datasets are open data under USDOL's
Open Data Policy. Boasted queries these endpoints live; it does not scrape job
boards or copy proprietary internship/program databases.
"""
from __future__ import annotations

import math
import os
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_current_user
from app.database import entries_collection, impact_receipts_collection
from app.education_toolkit import build_education_toolkit

router = APIRouter(prefix="/student-opportunities", tags=["student-opportunities"])

CAREERONESTOP_BASE = "https://api.careeronestop.org"
CAREERONESTOP_USER_ID = os.getenv("CAREERONESTOP_USER_ID", "").strip()
CAREERONESTOP_API_TOKEN = os.getenv("CAREERONESTOP_API_TOKEN", "").strip()
CAREERONESTOP_SOURCE = {
    "name": "CareerOneStop Web API",
    "publisher": "U.S. Department of Labor, Employment and Training Administration",
    "url": "https://www.careeronestop.org/Developers/WebAPI/web-api.aspx",
    "rights_basis": "USDOL open data / CareerOneStop Web API",
    "usage": "Live program, youth-service, and job discovery with source attribution.",
}
VOLUNTEER_SOURCE = {
    "name": "Volunteer.gov",
    "publisher": "U.S. Department of the Interior and participating federal agencies",
    "url": "https://www.volunteer.gov/",
    "rights_basis": "link-only",
    "usage": "Official federal volunteer opportunity search. Boasted does not ingest it because no approved public opportunity API was identified.",
}


def _configured() -> bool:
    return bool(CAREERONESTOP_USER_ID and CAREERONESTOP_API_TOKEN)


def _auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {CAREERONESTOP_API_TOKEN}",
        "Accept": "application/json",
        "User-Agent": "Boasted Student Opportunity Discovery/1.0",
    }


def _career_context(current_user: dict) -> dict:
    """Build safe search hints from verified member-saved evidence; never a fit score."""
    user_id = str(current_user["_id"])
    entries = list(entries_collection.find({"user_id": user_id}))
    receipts = list(impact_receipts_collection.find({"user_id": user_id}))
    toolkit = build_education_toolkit(entries, receipts, "career-paths")
    directions = toolkit.get("career_directions") or []
    skills = toolkit.get("skill_signals") or []

    suggested: list[dict] = []
    for direction in directions[:3]:
        examples = [str(value).strip() for value in direction.get("examples") or [] if str(value).strip()]
        supported = [str(value).strip() for value in direction.get("demonstrated_skills") or [] if str(value).strip()]
        for example in examples[:2]:
            suggested.append(
                {
                    "query": example,
                    "direction": direction.get("title") or "Career direction",
                    "supported_by": supported[:4],
                }
            )
    if not suggested:
        for item in skills[:4]:
            skill = str(item.get("skill") or "").strip()
            if skill:
                suggested.append({"query": skill, "direction": "Demonstrated skill", "supported_by": [skill]})

    # Profile location is only a convenience default. The member can replace it in the UI.
    return {
        "location": str(current_user.get("location") or "").strip(),
        "suggested_queries": suggested[:6],
        "evidence_mode": "member-saved-proof-only",
        "fit_percentage": False,
        "best_program_claim": False,
        "best_internship_claim": False,
    }


def _request(path: str, *, params: dict | None = None) -> dict:
    if not _configured():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "careeronestop_not_configured",
                "message": "Opportunity search is ready but the CareerOneStop API credentials have not been configured on the server.",
            },
        )
    try:
        response = httpx.get(
            f"{CAREERONESTOP_BASE}{path}",
            headers=_auth_headers(),
            params=params or {},
            timeout=18.0,
            follow_redirects=True,
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="CareerOneStop could not be reached right now.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="CareerOneStop returned an unreadable response.") from exc


def _source_metadata(payload: dict) -> dict:
    metadata = payload.get("MetaData") or payload.get("Metadata") or {}
    return {
        **CAREERONESTOP_SOURCE,
        "citation": metadata.get("CitationSuggested"),
        "last_access_date": metadata.get("LastAccessDate"),
        "upstream_sources": metadata.get("DataSource") or [],
    }


def _program_item(record: dict, *, reason: dict | None = None) -> dict:
    formats = record.get("Format") or []
    occupations = record.get("OccupationsList") or []
    source_label = str(record.get("DataSource") or "")
    return {
        "id": f"training:{record.get('DetailId')}",
        "kind": "training",
        "cost_type": "funding-unknown",
        "title": record.get("EtaProgramName") or record.get("CipTitle") or "Training program",
        "provider": record.get("SchoolName"),
        "credential": record.get("Credential") or record.get("AwardLevel"),
        "formats": formats,
        "occupations": occupations,
        "address": record.get("Address"),
        "city": record.get("City"),
        "state": record.get("StateAbbr") or record.get("State"),
        "zip": record.get("Zip"),
        "distance": record.get("Distance"),
        "phone": record.get("Phone"),
        "url": record.get("SchoolURL"),
        "wioa_or_etp_signal": "ETP" in source_label.upper() or "WIOA" in source_label.upper(),
        "data_source": source_label,
        "why_shown": reason,
    }


def _youth_program_item(record: dict) -> dict:
    return {
        "id": f"youth:{record.get('ID')}",
        "kind": "free-support",
        "cost_type": "free",
        "title": record.get("Name") or "Youth employment program",
        "provider": record.get("ProgramType") or "Youth employment program",
        "credential": None,
        "formats": [],
        "occupations": [],
        "address": record.get("Address1"),
        "city": record.get("City"),
        "state": record.get("StateAbbr") or record.get("StateName"),
        "zip": record.get("Zip"),
        "distance": record.get("Distance"),
        "phone": record.get("Phone"),
        "email": record.get("GeneralEmail"),
        "url": record.get("WebSiteUrl"),
        "status": record.get("CenterStatus"),
        "service_message": record.get("ServiceMessage"),
        "why_shown": {"direction": "Local student support", "supported_by": []},
    }


def _job_item(record: dict, *, reason: dict | None = None) -> dict:
    title = str(record.get("JobTitle") or "")
    snippet = str(record.get("DescriptionSnippet") or "")
    internship_signal = "intern" in f"{title} {snippet}".lower()
    return {
        "id": f"job:{record.get('JvId')}",
        "kind": "internship",
        "title": title or "Internship opportunity",
        "company": record.get("Company"),
        "location": record.get("Location"),
        "distance": record.get("Distance"),
        "description": snippet,
        "posted_at": record.get("AcquisitionDate"),
        "url": record.get("URL"),
        "onet_codes": record.get("OnetCodes") or [],
        "internship_signal": internship_signal,
        "why_shown": reason,
    }


@router.get("/context")
def opportunity_context(current_user: dict = Depends(get_current_user)):
    """Return member-controlled defaults and evidence-connected search ideas."""
    return {
        **_career_context(current_user),
        "api_configured": _configured(),
        "sources": [CAREERONESTOP_SOURCE, VOLUNTEER_SOURCE],
    }


@router.get("/programs")
def find_programs(
    location: str = Query(min_length=2, max_length=120),
    q: str = Query(default="", max_length=120),
    radius: int = Query(default=25, ge=5, le=100),
    page: int = Query(default=1, ge=1, le=100),
    page_size: int = Query(default=20, ge=10, le=40),
    include_youth_support: bool = True,
    current_user: dict = Depends(get_current_user),
):
    """Find local training/support programs using career evidence as optional search guidance."""
    context = _career_context(current_user)
    suggested = context["suggested_queries"]
    selected_reason = None
    keyword = q.strip()
    if not keyword and suggested:
        keyword = suggested[0]["query"]
        selected_reason = suggested[0]
    keyword = keyword or "career training"
    start = (page - 1) * page_size
    encoded = [quote(value, safe="") for value in [CAREERONESTOP_USER_ID, keyword, location]]
    path = (
        f"/v2/training/programs/{encoded[0]}/{encoded[1]}/{encoded[2]}/{radius}/"
        f"0/0/0/0/0/0/0/0/0/{start}/{page_size}"
    )
    training_payload = _request(path, params={"enableMetaData": "true"})
    programs = [_program_item(item, reason=selected_reason) for item in training_payload.get("SchoolPrograms") or []]
    training_count = int(training_payload.get("RecordCount") or 0)

    youth_items: list[dict] = []
    youth_payload: dict = {}
    # Youth Program Finder is a local free-service directory. Keep it on page one so it
    # complements, rather than overwhelms, the career-specific training results.
    if include_youth_support and page == 1:
        youth_path = (
            f"/v1/youthprogramfinder/{quote(CAREERONESTOP_USER_ID, safe='')}/{quote(location, safe='')}/"
            f"{radius}/Distance/ASC/0/{min(8, page_size)}"
        )
        youth_payload = _request(youth_path, params={"enableMetaData": "true"})
        youth_items = [_youth_program_item(item) for item in youth_payload.get("YouthProgramList") or []]

    return {
        "results": youth_items + programs,
        "training_total": training_count,
        "page": page,
        "page_size": page_size,
        "pages": max(1, math.ceil(training_count / page_size)) if training_count else 0,
        "location": location,
        "query": keyword,
        "used_career_suggestion": selected_reason is not None,
        "career_context": context,
        "source": _source_metadata(training_payload),
        "youth_source": _source_metadata(youth_payload) if youth_payload else None,
        "volunteer_source": VOLUNTEER_SOURCE,
        "notices": [
            "Training price is not inferred when the source does not provide it.",
            "WIOA/ETP indicators may mean training funding is available for eligible people; eligibility must be confirmed with the provider or American Job Center.",
            "Volunteer.gov is linked as an official volunteer source, but Boasted does not ingest its listings without an approved API/data-use path.",
        ],
    }


@router.get("/internships")
def find_internships(
    location: str = Query(min_length=2, max_length=120),
    q: str = Query(default="", max_length=120),
    radius: int = Query(default=25, ge=5, le=100),
    page: int = Query(default=1, ge=1, le=100),
    page_size: int = Query(default=20, ge=10, le=40),
    days: int = Query(default=30, ge=1, le=90),
    current_user: dict = Depends(get_current_user),
):
    """Search current internships around the member using evidence-connected career terms."""
    context = _career_context(current_user)
    suggested = context["suggested_queries"]
    selected_reason = None
    career_term = q.strip()
    if not career_term and suggested:
        career_term = suggested[0]["query"]
        selected_reason = suggested[0]
    career_term = career_term or "student"
    keyword = f"{career_term} intern"
    start = (page - 1) * page_size
    path = (
        f"/v2/jobsearch/{quote(CAREERONESTOP_USER_ID, safe='')}/{quote(keyword, safe='')}/"
        f"{quote(location, safe='')}/{radius}/acquisitiondate/DESC/{start}/{page_size}/{days}"
    )
    payload = _request(
        path,
        params={"enableJobDescriptionSnippet": "true", "enableMetaData": "true"},
    )
    raw_jobs = payload.get("Jobs") or []
    results = [_job_item(item, reason=selected_reason) for item in raw_jobs]
    # CareerOneStop does keyword search across job data, but be explicit when a returned
    # record does not itself contain an internship marker. Never relabel it silently.
    internship_results = [item for item in results if item["internship_signal"]]
    total = int(payload.get("JobCount") or len(internship_results))
    return {
        "results": internship_results,
        "upstream_result_count": total,
        "page": page,
        "page_size": page_size,
        "location": location,
        "query": career_term,
        "used_career_suggestion": selected_reason is not None,
        "career_context": context,
        "source": _source_metadata(payload),
        "notice": "Results are live CareerOneStop job listings filtered to records that explicitly contain an intern/internship signal. Boasted does not predict hiring or selection.",
    }
