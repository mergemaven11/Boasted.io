"""Evidence-aware education opportunity discovery using simpler public APIs.

Programs use the U.S. Department of Education College Scorecard. Federal internships
use the USAJOBS public search API. Boasted keeps member evidence separate from source
data, never stores upstream job/program records as a competing database, and records
only data-minimized source-access receipts in the permanent education source audit log.
"""
from __future__ import annotations

import math
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_current_user
from app.database import (
    education_source_audit_events_collection,
    entries_collection,
    impact_receipts_collection,
)
from app.education_toolkit import build_education_toolkit
from app.ops_routes import require_internal_role

router = APIRouter(prefix="/student-opportunities", tags=["student-opportunities"])

COLLEGE_SCORECARD_BASE = "https://api.data.gov/ed/collegescorecard/v1/schools.json"
COLLEGE_SCORECARD_API_KEY = os.getenv("COLLEGE_SCORECARD_API_KEY", "").strip()
USAJOBS_BASE = "https://data.usajobs.gov/api/search"
USAJOBS_API_KEY = os.getenv("USAJOBS_API_KEY", "").strip()
USAJOBS_USER_AGENT = os.getenv("USAJOBS_USER_AGENT", "").strip()

COLLEGE_SCORECARD_SOURCE = {
    "id": "college-scorecard",
    "name": "College Scorecard",
    "publisher": "U.S. Department of Education",
    "url": "https://collegescorecard.ed.gov/data/",
    "rights_basis": "Public federal dataset; Data.gov catalog links CC BY licensing information",
    "usage": "Live institution and field-of-study discovery. Boasted does not turn aggregate outcomes into personal predictions.",
}
USAJOBS_SOURCE = {
    "id": "usajobs",
    "name": "USAJOBS",
    "publisher": "U.S. Office of Personnel Management",
    "url": "https://www.usajobs.gov/",
    "rights_basis": "USAJOBS API Terms of Service; public job opportunity announcement data",
    "usage": "Live federal internship discovery with attribution and links back to USAJOBS.",
}
VOLUNTEER_SOURCE = {
    "id": "volunteer-gov",
    "name": "Volunteer.gov",
    "publisher": "U.S. Department of the Interior and participating federal agencies",
    "url": "https://www.volunteer.gov/",
    "rights_basis": "link-only",
    "usage": "Official federal volunteer opportunity search. Boasted links out rather than copying listings.",
}

STATE_CODES = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC",
}

PROGRAM_ALIASES = {
    "software": {"computer", "computing", "programming", "software", "information technology"},
    "developer": {"computer", "computing", "programming", "software", "information technology"},
    "cybersecurity": {"cyber", "security", "information technology", "computer"},
    "data": {"data", "statistics", "analytics", "computer", "information"},
    "nursing": {"nursing", "registered nurse", "health"},
    "health": {"health", "public health", "healthcare", "nursing"},
    "marketing": {"marketing", "advertising", "communications", "business"},
    "finance": {"finance", "financial", "accounting", "business"},
    "education": {"education", "teaching", "teacher"},
    "teaching": {"education", "teaching", "teacher"},
    "design": {"design", "graphic", "visual", "digital"},
    "engineering": {"engineering", "engineer"},
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _audit_event(
    *,
    provider: str,
    operation: str,
    outcome: str,
    request_id: str,
    http_status: int | None = None,
    result_count: int | None = None,
    error_type: str | None = None,
    metadata: dict[str, Any] | None = None,
    required: bool = False,
) -> None:
    """Append a permanent, data-minimized source-access receipt.

    There is intentionally no TTL index or delete route for this collection. Raw search
    terms, locations, member evidence, API keys, and upstream response records are not
    written to the log.
    """
    document = {
        "event_id": uuid.uuid4().hex,
        "provider": provider,
        "event_type": "education_source_access",
        "operation": operation,
        "outcome": outcome,
        "request_id": request_id,
        "occurred_at": _utcnow(),
        "http_status": http_status,
        "result_count": result_count,
        "error_type": error_type,
        "source_metadata": metadata or {},
        "safeguards": {
            "private_member_evidence_sent": False,
            "raw_query_or_location_logged": False,
            "api_credentials_logged": False,
            "upstream_records_persisted": False,
            "boasted_annotations_separate": True,
        },
    }
    try:
        education_source_audit_events_collection.insert_one(document)
    except Exception as exc:  # pragma: no cover - database outage path
        if required:
            raise HTTPException(
                status_code=503,
                detail={
                    "code": "education_source_audit_unavailable",
                    "message": "External opportunity search was withheld because the compliance audit receipt could not be written.",
                },
            ) from exc


def _career_context(current_user: dict) -> dict:
    """Build editable search hints from member-saved evidence; never a fit score."""
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
            suggested.append({
                "query": example,
                "direction": direction.get("title") or "Career direction",
                "supported_by": supported[:4],
            })
    if not suggested:
        for item in skills[:4]:
            skill = str(item.get("skill") or "").strip()
            if skill:
                suggested.append({"query": skill, "direction": "Demonstrated skill", "supported_by": [skill]})

    return {
        "location": str(current_user.get("location") or "").strip(),
        "suggested_queries": suggested[:6],
        "evidence_mode": "member-saved-proof-only",
        "fit_percentage": False,
        "best_program_claim": False,
        "best_internship_claim": False,
    }


def _location_parts(location: str) -> tuple[str | None, str | None]:
    cleaned = " ".join(location.strip().split())
    if not cleaned:
        return None, None
    pieces = [piece.strip() for piece in cleaned.split(",") if piece.strip()]
    state: str | None = None
    city: str | None = pieces[0] if len(pieces) > 1 else None

    candidates = pieces[1:] if len(pieces) > 1 else pieces
    for candidate in reversed(candidates):
        letters = re.sub(r"[^A-Za-z ]", "", candidate).strip()
        if len(letters) == 2 and letters.upper() in set(STATE_CODES.values()):
            state = letters.upper()
            break
        if letters.lower() in STATE_CODES:
            state = STATE_CODES[letters.lower()]
            break
    if state is None and cleaned.lower() in STATE_CODES:
        state = STATE_CODES[cleaned.lower()]
        city = None
    if state is None and len(cleaned) == 2 and cleaned.upper() in set(STATE_CODES.values()):
        state = cleaned.upper()
        city = None
    return city, state


def _scorecard_configured() -> bool:
    return bool(COLLEGE_SCORECARD_API_KEY)


def _usajobs_configured() -> bool:
    return bool(USAJOBS_API_KEY and USAJOBS_USER_AGENT)


def _scorecard_request(params: dict[str, Any]) -> dict:
    if not _scorecard_configured():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "college_scorecard_not_configured",
                "message": "Program search is ready but the server still needs a College Scorecard API key.",
            },
        )
    request_id = uuid.uuid4().hex
    _audit_event(provider="College Scorecard", operation="program_search", outcome="attempt", request_id=request_id, required=True)
    try:
        response = httpx.get(
            COLLEGE_SCORECARD_BASE,
            params={**params, "api_key": COLLEGE_SCORECARD_API_KEY},
            headers={"Accept": "application/json", "User-Agent": "Boasted Education/1.0"},
            timeout=18.0,
            follow_redirects=True,
        )
        response.raise_for_status()
        payload = response.json()
        results = payload.get("results") or []
        metadata = payload.get("metadata") or {}
        _audit_event(
            provider="College Scorecard",
            operation="program_search",
            outcome="success",
            request_id=request_id,
            http_status=response.status_code,
            result_count=len(results),
            metadata={"total": metadata.get("total"), "page": metadata.get("page")},
            required=True,
        )
        return payload
    except httpx.HTTPError as exc:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        _audit_event(provider="College Scorecard", operation="program_search", outcome="upstream_error", request_id=request_id, http_status=status, error_type=type(exc).__name__)
        raise HTTPException(status_code=502, detail="College Scorecard could not be reached right now.") from exc
    except ValueError as exc:
        _audit_event(provider="College Scorecard", operation="program_search", outcome="unreadable_response", request_id=request_id, error_type=type(exc).__name__)
        raise HTTPException(status_code=502, detail="College Scorecard returned an unreadable response.") from exc


def _usajobs_request(params: dict[str, Any]) -> dict:
    if not _usajobs_configured():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "usajobs_not_configured",
                "message": "Federal internship search is ready but the server still needs the USAJOBS API key and registered email.",
            },
        )
    request_id = uuid.uuid4().hex
    _audit_event(provider="USAJOBS", operation="federal_internship_search", outcome="attempt", request_id=request_id, required=True)
    try:
        response = httpx.get(
            USAJOBS_BASE,
            params=params,
            headers={
                "Host": "data.usajobs.gov",
                "User-Agent": USAJOBS_USER_AGENT,
                "Authorization-Key": USAJOBS_API_KEY,
                "Accept": "application/json",
            },
            timeout=18.0,
            follow_redirects=True,
        )
        response.raise_for_status()
        payload = response.json()
        search_result = payload.get("SearchResult") or {}
        items = search_result.get("SearchResultItems") or []
        _audit_event(
            provider="USAJOBS",
            operation="federal_internship_search",
            outcome="success",
            request_id=request_id,
            http_status=response.status_code,
            result_count=len(items),
            metadata={"matched": search_result.get("SearchResultCountAll")},
            required=True,
        )
        return payload
    except httpx.HTTPError as exc:
        status = getattr(getattr(exc, "response", None), "status_code", None)
        _audit_event(provider="USAJOBS", operation="federal_internship_search", outcome="upstream_error", request_id=request_id, http_status=status, error_type=type(exc).__name__)
        raise HTTPException(status_code=502, detail="USAJOBS could not be reached right now.") from exc
    except ValueError as exc:
        _audit_event(provider="USAJOBS", operation="federal_internship_search", outcome="unreadable_response", request_id=request_id, error_type=type(exc).__name__)
        raise HTTPException(status_code=502, detail="USAJOBS returned an unreadable response.") from exc


def _program_terms(query: str) -> set[str]:
    tokens = {token for token in re.findall(r"[a-z0-9]+", query.lower()) if len(token) >= 3}
    expanded = set(tokens)
    for token in tokens:
        expanded.update(PROGRAM_ALIASES.get(token, set()))
    return expanded


def _scorecard_programs(record: dict) -> list[dict]:
    direct = record.get("latest.programs.cip_4_digit")
    if isinstance(direct, list):
        return direct
    latest = record.get("latest") or {}
    programs = latest.get("programs") if isinstance(latest, dict) else None
    cip = programs.get("cip_4_digit") if isinstance(programs, dict) else None
    return cip if isinstance(cip, list) else []


def _scorecard_school_value(record: dict, dotted: str, nested_path: tuple[str, ...]) -> Any:
    if dotted in record:
        return record.get(dotted)
    current: Any = record
    for key in nested_path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _program_item(record: dict, program: dict, *, reason: dict | None = None) -> dict:
    school_id = record.get("id")
    title = program.get("title") or program.get("Title") or program.get("cip_title")
    code = program.get("code") or program.get("cip_code")
    credential = program.get("credential") or program.get("credential.level") or program.get("credential_level")
    school_name = _scorecard_school_value(record, "school.name", ("school", "name"))
    city = _scorecard_school_value(record, "school.city", ("school", "city"))
    state = _scorecard_school_value(record, "school.state", ("school", "state"))
    zip_code = _scorecard_school_value(record, "school.zip", ("school", "zip"))
    school_url = _scorecard_school_value(record, "school.school_url", ("school", "school_url"))
    student_size = _scorecard_school_value(record, "latest.student.size", ("latest", "student", "size"))
    net_price = _scorecard_school_value(record, "latest.cost.avg_net_price.overall", ("latest", "cost", "avg_net_price", "overall"))
    return {
        "id": f"scorecard:{school_id}:{code}:{credential}",
        "source": {
            "title": title,
            "provider": school_name,
            "city": city,
            "state": state,
            "zip": zip_code,
            "url": school_url,
            "credential": f"Credential level {credential}" if credential is not None else None,
            "cip_code": code,
            "student_size": student_size,
            "avg_net_price": net_price,
            "data_source": "College Scorecard",
        },
        "boasted": {
            "display_kind": "college-program",
            "cost_claim": "aggregate-context-only",
            "why_shown": reason,
        },
    }


def _usajobs_item(item: dict, *, reason: dict | None = None) -> dict:
    descriptor = item.get("MatchedObjectDescriptor") or {}
    user_area = descriptor.get("UserArea") or {}
    details = user_area.get("Details") or {}
    title = str(descriptor.get("PositionTitle") or "")
    summary = str(details.get("JobSummary") or descriptor.get("QualificationSummary") or "")
    signal_text = f"{title} {summary}".lower()
    internship_signal = "intern" in signal_text or "student trainee" in signal_text
    return {
        "id": f"usajobs:{item.get('MatchedObjectId') or descriptor.get('PositionID')}",
        "source": {
            "title": descriptor.get("PositionTitle"),
            "company": descriptor.get("OrganizationName") or descriptor.get("DepartmentName"),
            "location": descriptor.get("PositionLocationDisplay"),
            "description": details.get("JobSummary") or descriptor.get("QualificationSummary"),
            "posted_at": descriptor.get("PublicationStartDate"),
            "deadline": descriptor.get("ApplicationCloseDate"),
            "url": descriptor.get("PositionURI"),
            "schedule": descriptor.get("PositionSchedule") or [],
            "offering_type": descriptor.get("PositionOfferingType") or [],
            "data_source": "USAJOBS",
        },
        "boasted": {
            "display_kind": "federal-internship",
            "internship_signal": internship_signal,
            "why_shown": reason,
        },
    }


@router.get("/context")
def opportunity_context(current_user: dict = Depends(get_current_user)):
    """Return member-controlled defaults and evidence-connected search ideas."""
    return {
        **_career_context(current_user),
        "program_api_configured": _scorecard_configured(),
        "internship_api_configured": _usajobs_configured(),
        "api_configured": _scorecard_configured() and _usajobs_configured(),
        "sources": [COLLEGE_SCORECARD_SOURCE, USAJOBS_SOURCE, VOLUNTEER_SOURCE],
    }


@router.get("/compliance/audit")
def education_source_compliance_audit(
    limit: int = Query(default=100, ge=1, le=500),
    _current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    """Return recent permanent education source receipts to authorized operators."""
    events = list(
        education_source_audit_events_collection.find({}, {"_id": 0})
        .sort("occurred_at", -1)
        .limit(limit)
    )
    return {
        "retention": "append-only/no-TTL",
        "sources": [COLLEGE_SCORECARD_SOURCE, USAJOBS_SOURCE],
        "events": events,
    }


@router.get("/programs")
def find_programs(
    location: str = Query(min_length=2, max_length=120),
    q: str = Query(default="", max_length=120),
    radius: int = Query(default=25, ge=5, le=100),  # kept for stable client contract; Scorecard is city/state based
    page: int = Query(default=1, ge=1, le=100),
    page_size: int = Query(default=20, ge=10, le=40),
    current_user: dict = Depends(get_current_user),
):
    """Find postsecondary programs near the member using College Scorecard data."""
    del radius
    context = _career_context(current_user)
    suggestions = context["suggested_queries"]
    selected_reason = None
    keyword = q.strip()
    if not keyword and suggestions:
        keyword = suggestions[0]["query"]
        selected_reason = suggestions[0]
    keyword = keyword or "career"

    city, state = _location_parts(location)
    if not state:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "program_location_needs_state",
                "message": "For College Scorecard program search, enter a state or a city and state, such as Atlanta, GA.",
            },
        )

    fields = ",".join([
        "id",
        "school.name",
        "school.city",
        "school.state",
        "school.zip",
        "school.school_url",
        "latest.student.size",
        "latest.cost.avg_net_price.overall",
        "latest.programs.cip_4_digit",
    ])
    params: dict[str, Any] = {
        "school.operating": "1",
        "school.state": state,
        "fields": fields,
        "keys_nested": "true",
        "_per_page": 100,
        "page": 0,
    }
    if city:
        params["school.city"] = city

    payload = _scorecard_request(params)
    terms = _program_terms(keyword)
    matches: list[dict] = []
    for school in payload.get("results") or []:
        for program in _scorecard_programs(school):
            title = str(program.get("title") or program.get("Title") or program.get("cip_title") or "")
            haystack = title.lower()
            if terms and not any(term in haystack for term in terms):
                continue
            matches.append(_program_item(school, program, reason=selected_reason))

    total = len(matches)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "results": matches[start:end],
        "training_total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
        "location": location,
        "query": keyword,
        "used_career_suggestion": selected_reason is not None,
        "career_context": context,
        "source": COLLEGE_SCORECARD_SOURCE,
        "volunteer_source": VOLUNTEER_SOURCE,
        "coverage_notice": "College Scorecard program matching is based on the active schools returned for the selected city/state and transparent program-title terms; it is discovery help, not a ranking.",
        "notices": [
            "College Scorecard aggregates can have cohort and coverage limitations.",
            "Net-price and outcome fields are context only and are never personal cost, salary, admission, or graduation predictions.",
            "Volunteer.gov remains link-only because Boasted does not copy its listings without an approved data-use path.",
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
    """Search current federal internships through USAJOBS."""
    context = _career_context(current_user)
    suggestions = context["suggested_queries"]
    selected_reason = None
    career_term = q.strip()
    if not career_term and suggestions:
        career_term = suggestions[0]["query"]
        selected_reason = suggestions[0]
    career_term = career_term or "student"

    payload = _usajobs_request({
        "Keyword": f"{career_term} intern",
        "LocationName": location,
        "Radius": radius,
        "ResultsPerPage": page_size,
        "Page": page,
        "DatePosted": days,
    })
    search_result = payload.get("SearchResult") or {}
    raw_items = search_result.get("SearchResultItems") or []
    normalized = [_usajobs_item(item, reason=selected_reason) for item in raw_items]
    results = [item for item in normalized if item["boasted"]["internship_signal"]]
    total = int(search_result.get("SearchResultCountAll") or len(results))

    return {
        "results": results,
        "upstream_result_count": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total else 0,
        "location": location,
        "query": career_term,
        "used_career_suggestion": selected_reason is not None,
        "career_context": context,
        "source": USAJOBS_SOURCE,
        "notice": "Results are live USAJOBS public job announcements filtered to records that explicitly contain an intern or student-trainee signal. Boasted does not predict hiring or selection.",
    }
