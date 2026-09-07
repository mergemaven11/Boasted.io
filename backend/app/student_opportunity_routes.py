"""Career-aware student opportunity discovery using CareerOneStop under license.

CareerOneStop API use is fail-closed: credentials alone are not enough. Boasted also
requires an explicit active license status and future license-expiration date before
making a CareerOneStop request. Every upstream call receives a compliance audit
receipt, while private accomplishments, raw search terms, locations, and geocodes are
not written to the audit log.
"""
from __future__ import annotations

import math
import os
import uuid
from datetime import datetime, timezone
from urllib.parse import quote

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import get_current_user
from app.database import (
    careeronestop_audit_events_collection,
    entries_collection,
    impact_receipts_collection,
)
from app.education_toolkit import build_education_toolkit
from app.ops_routes import require_internal_role

router = APIRouter(prefix="/student-opportunities", tags=["student-opportunities"])

CAREERONESTOP_BASE = "https://api.careeronestop.org"
CAREERONESTOP_USER_ID = os.getenv("CAREERONESTOP_USER_ID", "").strip()
CAREERONESTOP_API_TOKEN = os.getenv("CAREERONESTOP_API_TOKEN", "").strip()
CAREERONESTOP_LICENSE_STATUS = os.getenv("CAREERONESTOP_LICENSE_STATUS", "pending").strip().lower()
CAREERONESTOP_LICENSE_GRANTED_AT = os.getenv("CAREERONESTOP_LICENSE_GRANTED_AT", "").strip()
CAREERONESTOP_LICENSE_EXPIRES_AT = os.getenv("CAREERONESTOP_LICENSE_EXPIRES_AT", "").strip()
CAREERONESTOP_LICENSE_PURPOSE_VERSION = "boasted-education-opportunity-discovery-v1"
CAREERONESTOP_REQUIRED_ATTRIBUTION = (
    "CareerOneStop data source acknowledgement: U.S. Department of Labor Employment and Training "
    "Administration (DOLETA) and Minnesota Department of Employment & Economic Development (DEED)."
)
CAREERONESTOP_SOURCE = {
    "name": "CareerOneStop Web API",
    "publisher": "DOLETA and Minnesota DEED",
    "url": "https://www.careeronestop.org/Developers/WebAPI/web-api.aspx",
    "rights_basis": "CareerOneStop Data Sharing and Use/Display Click License Agreement; active grant required",
    "usage": "Live program, youth-service, and job discovery with required source attribution.",
    "required_attribution": CAREERONESTOP_REQUIRED_ATTRIBUTION,
}
VOLUNTEER_SOURCE = {
    "name": "Volunteer.gov",
    "publisher": "U.S. Department of the Interior and participating federal agencies",
    "url": "https://www.volunteer.gov/",
    "rights_basis": "link-only",
    "usage": "Official federal volunteer opportunity search. Boasted does not ingest it because no approved public opportunity API was identified.",
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _license_state(*, now: datetime | None = None) -> dict:
    """Return a non-secret license state and fail closed on missing/expired dates."""
    now = now or _utcnow()
    expires_at = _parse_datetime(CAREERONESTOP_LICENSE_EXPIRES_AT)
    granted_at = _parse_datetime(CAREERONESTOP_LICENSE_GRANTED_AT)
    active = CAREERONESTOP_LICENSE_STATUS == "granted" and expires_at is not None and expires_at > now
    days_remaining = max(0, (expires_at - now).days) if expires_at else None
    return {
        "status": CAREERONESTOP_LICENSE_STATUS or "pending",
        "active": active,
        "granted_at": granted_at,
        "expires_at": expires_at,
        "days_remaining": days_remaining,
        "purpose_version": CAREERONESTOP_LICENSE_PURPOSE_VERSION,
        "renewal_warning": bool(active and days_remaining is not None and days_remaining <= 90),
    }


def _credentials_configured() -> bool:
    return bool(CAREERONESTOP_USER_ID and CAREERONESTOP_API_TOKEN)


def _configured() -> bool:
    return _credentials_configured() and bool(_license_state()["active"])


def _auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {CAREERONESTOP_API_TOKEN}",
        "Accept": "application/json",
        "User-Agent": "Boasted Student Opportunity Discovery/1.0",
    }


def _audit_event(
    *,
    request_id: str,
    operation: str,
    outcome: str,
    http_status: int | None = None,
    result_count: int | None = None,
    metadata: dict | None = None,
    error_type: str | None = None,
    required: bool = False,
) -> None:
    """Persist a data-minimized CareerOneStop compliance receipt.

    Raw search terms, locations, member evidence, API credentials, API paths containing
    those values, response records, and geocodes are intentionally excluded.
    """
    state = _license_state()
    upstream = metadata or {}
    document = {
        "provider": "CareerOneStop",
        "event_type": "licensed_api_access",
        "request_id": request_id,
        "operation": operation,
        "outcome": outcome,
        "occurred_at": _utcnow(),
        "http_status": http_status,
        "result_count": result_count,
        "error_type": error_type,
        "license": {
            "status": state["status"],
            "active": state["active"],
            "granted_at": state["granted_at"],
            "expires_at": state["expires_at"],
            "purpose_version": state["purpose_version"],
        },
        "source_metadata": {
            "publisher": upstream.get("Publisher"),
            "sponsor": upstream.get("Sponsor"),
            "last_access_date": upstream.get("LastAccessDate"),
            "citation_suggested": upstream.get("CitationSuggested"),
        },
        "safeguards": {
            "private_member_evidence_sent_to_cos": False,
            "raw_query_or_location_logged": False,
            "cos_records_persisted_by_boasted": False,
            "cos_geocodes_persisted_copied_or_shared": False,
            "source_text_rewritten": False,
            "boasted_annotations_separate_from_source_fields": True,
            "doletta_deed_attribution_required_on_results_page": True,
        },
    }
    try:
        careeronestop_audit_events_collection.insert_one(document)
    except Exception as exc:  # pragma: no cover - exercised by integration/DB failure handling
        if required:
            raise HTTPException(
                status_code=503,
                detail={
                    "code": "careeronestop_audit_unavailable",
                    "message": "CareerOneStop search was withheld because the compliance audit trail could not be written.",
                },
            ) from exc


def _require_active_license(operation: str, request_id: str) -> None:
    if not _credentials_configured():
        _audit_event(request_id=request_id, operation=operation, outcome="blocked_missing_credentials")
        raise HTTPException(
            status_code=503,
            detail={
                "code": "careeronestop_not_configured",
                "message": "Opportunity search is ready but the CareerOneStop API credentials have not been configured on the server.",
            },
        )
    state = _license_state()
    if not state["active"]:
        _audit_event(request_id=request_id, operation=operation, outcome="blocked_license_inactive")
        raise HTTPException(
            status_code=503,
            detail={
                "code": "careeronestop_license_not_active",
                "message": "CareerOneStop results are disabled until Boasted has been notified that its license is granted and a future license expiration date is configured.",
            },
        )


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

    return {
        "location": str(current_user.get("location") or "").strip(),
        "suggested_queries": suggested[:6],
        "evidence_mode": "member-saved-proof-only",
        "fit_percentage": False,
        "best_program_claim": False,
        "best_internship_claim": False,
    }


def _request(path: str, *, operation: str, params: dict | None = None) -> dict:
    request_id = uuid.uuid4().hex
    _require_active_license(operation, request_id)
    _audit_event(request_id=request_id, operation=operation, outcome="attempt", required=True)
    try:
        response = httpx.get(
            f"{CAREERONESTOP_BASE}{path}",
            headers=_auth_headers(),
            params=params or {},
            timeout=18.0,
            follow_redirects=True,
        )
        response.raise_for_status()
        payload = response.json()
        metadata = payload.get("MetaData") or payload.get("Metadata") or {}
        result_count = None
        for key in ("RecordCount", "JobCount"):
            if payload.get(key) is not None:
                try:
                    result_count = int(payload.get(key))
                except (TypeError, ValueError):
                    result_count = None
                break
        _audit_event(
            request_id=request_id,
            operation=operation,
            outcome="success",
            http_status=response.status_code,
            result_count=result_count,
            metadata=metadata,
            required=True,
        )
        return payload
    except httpx.HTTPError as exc:
        status_code = getattr(getattr(exc, "response", None), "status_code", None)
        _audit_event(
            request_id=request_id,
            operation=operation,
            outcome="upstream_error",
            http_status=status_code,
            error_type=type(exc).__name__,
        )
        raise HTTPException(status_code=502, detail="CareerOneStop could not be reached right now.") from exc
    except ValueError as exc:
        _audit_event(
            request_id=request_id,
            operation=operation,
            outcome="unreadable_response",
            error_type=type(exc).__name__,
        )
        raise HTTPException(status_code=502, detail="CareerOneStop returned an unreadable response.") from exc


def _source_metadata(payload: dict) -> dict:
    metadata = payload.get("MetaData") or payload.get("Metadata") or {}
    return {
        **CAREERONESTOP_SOURCE,
        "citation": metadata.get("CitationSuggested"),
        "last_access_date": metadata.get("LastAccessDate"),
        "upstream_sources": metadata.get("DataSource") or [],
        "license": _license_state(),
    }


def _program_item(record: dict, *, reason: dict | None = None) -> dict:
    """Keep CareerOneStop values verbatim and put Boasted annotations in a separate block."""
    source_label = str(record.get("DataSource") or "")
    return {
        "id": f"training:{record.get('DetailId')}",
        "source": {
            "title": record.get("EtaProgramName") if record.get("EtaProgramName") is not None else record.get("CipTitle"),
            "provider": record.get("SchoolName"),
            "credential": record.get("Credential") if record.get("Credential") is not None else record.get("AwardLevel"),
            "formats": record.get("Format") or [],
            "occupations": record.get("OccupationsList") or [],
            "address": record.get("Address"),
            "city": record.get("City"),
            "state": record.get("StateAbbr") if record.get("StateAbbr") is not None else record.get("State"),
            "zip": record.get("Zip"),
            "distance": record.get("Distance"),
            "phone": record.get("Phone"),
            "url": record.get("SchoolURL"),
            "data_source": record.get("DataSource"),
        },
        "boasted": {
            "display_kind": "training",
            "cost_claim": "unknown",
            "wioa_or_etp_signal": "ETP" in source_label.upper() or "WIOA" in source_label.upper(),
            "why_shown": reason,
        },
    }


def _youth_program_item(record: dict) -> dict:
    """Do not turn the Youth Program Finder category into a per-provider price claim."""
    return {
        "id": f"youth:{record.get('ID')}",
        "source": {
            "title": record.get("Name"),
            "provider": record.get("ProgramType"),
            "address": record.get("Address1"),
            "city": record.get("City"),
            "state": record.get("StateAbbr") if record.get("StateAbbr") is not None else record.get("StateName"),
            "zip": record.get("Zip"),
            "distance": record.get("Distance"),
            "phone": record.get("Phone"),
            "email": record.get("GeneralEmail"),
            "url": record.get("WebSiteUrl"),
            "status": record.get("CenterStatus"),
            "service_message": record.get("ServiceMessage"),
        },
        "boasted": {
            "display_kind": "youth-support",
            "cost_claim": "verify-with-provider",
            "why_shown": {"direction": "Local student support", "supported_by": []},
        },
    }


def _job_item(record: dict, *, reason: dict | None = None) -> dict:
    """Keep listing text unchanged; derive only a separate internship-filter signal."""
    title = str(record.get("JobTitle") or "")
    snippet = str(record.get("DescriptionSnippet") or "")
    internship_signal = "intern" in f"{title} {snippet}".lower()
    return {
        "id": f"job:{record.get('JvId')}",
        "source": {
            "title": record.get("JobTitle"),
            "company": record.get("Company"),
            "location": record.get("Location"),
            "distance": record.get("Distance"),
            "description": record.get("DescriptionSnippet"),
            "posted_at": record.get("AcquisitionDate"),
            "url": record.get("URL"),
            "onet_codes": record.get("OnetCodes") or [],
        },
        "boasted": {
            "display_kind": "internship-candidate",
            "internship_signal": internship_signal,
            "why_shown": reason,
        },
    }


@router.get("/context")
def opportunity_context(current_user: dict = Depends(get_current_user)):
    """Return member-controlled defaults and evidence-connected search ideas."""
    license_state = _license_state()
    return {
        **_career_context(current_user),
        "credentials_configured": _credentials_configured(),
        "license_active": license_state["active"],
        "api_configured": _configured(),
        "license": license_state,
        "sources": [CAREERONESTOP_SOURCE, VOLUNTEER_SOURCE],
    }


@router.get("/compliance/audit")
def careeronestop_compliance_audit(
    limit: int = Query(default=100, ge=1, le=500),
    _current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    """Return recent data-minimized CareerOneStop access receipts to authorized operators."""
    events = list(
        careeronestop_audit_events_collection.find(
            {"provider": "CareerOneStop"},
            {"_id": 0},
        ).sort("occurred_at", -1).limit(limit)
    )
    return {
        "license": _license_state(),
        "required_attribution": CAREERONESTOP_REQUIRED_ATTRIBUTION,
        "events": events,
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
    training_payload = _request(
        path,
        operation="training_program_search",
        params={"enableMetaData": "true"},
    )
    programs = [_program_item(item, reason=selected_reason) for item in training_payload.get("SchoolPrograms") or []]
    training_count = int(training_payload.get("RecordCount") or 0)

    youth_items: list[dict] = []
    youth_payload: dict = {}
    if include_youth_support and page == 1:
        youth_path = (
            f"/v1/youthprogramfinder/{quote(CAREERONESTOP_USER_ID, safe='')}/{quote(location, safe='')}/"
            f"{radius}/Distance/ASC/0/{min(8, page_size)}"
        )
        youth_payload = _request(
            youth_path,
            operation="youth_program_search",
            params={"enableMetaData": "true"},
        )
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
            "CareerOneStop source values are displayed without rewriting; Boasted annotations are separate.",
            "Training price is not inferred when the source does not provide it.",
            "A WIOA/ETP source signal is only a Boasted search annotation; funding and eligibility must be confirmed with the provider or American Job Center.",
            "CareerOneStop Youth Program Finder results are not individually labeled free unless the source record itself says so; verify services and eligibility with the provider.",
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
        operation="job_internship_search",
        params={"enableJobDescriptionSnippet": "true", "enableMetaData": "true"},
    )
    raw_jobs = payload.get("Jobs") or []
    results = [_job_item(item, reason=selected_reason) for item in raw_jobs]
    internship_results = [item for item in results if item["boasted"]["internship_signal"]]
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
        "notice": "CareerOneStop listing fields are shown without rewriting. Boasted filters to listings whose source title/snippet contains an intern signal and does not predict hiring or selection.",
    }
