"""Licensed scholarship catalog ingestion, freshness, and search helpers.

The catalog is deliberately source-gated. A feed is not eligible for ingestion merely
because it is publicly reachable. Every adapter must have an explicit rights basis
that permits Boasted to store and display the records.
"""
from __future__ import annotations

import re
import threading
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from pymongo import ASCENDING, DESCENDING, UpdateOne

from app.database import scholarship_sync_state_collection, scholarships_collection

OPEN_SCHOLARSHIPS_SOURCE = "open-scholarships"
OPEN_SCHOLARSHIPS_URL = "https://scholarships.grudged.io/scholarships.json"
OPEN_SCHOLARSHIPS_LICENSE = "CC-BY-4.0"
OPEN_SCHOLARSHIPS_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
OPEN_SCHOLARSHIPS_ATTRIBUTION = (
    "Open Scholarships by Grudged LLC — https://github.com/Grudged/open-scholarships (CC BY 4.0)"
)
SYNC_INTERVAL = timedelta(days=7)

_sync_lock = threading.Lock()


class ScholarshipSourceLicenseError(RuntimeError):
    """Raised when a source no longer presents the rights metadata we approved."""


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _parse_date(value: Any) -> datetime | None:
    if not value or not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        try:
            parsed = datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def validate_open_scholarships_license(payload: dict[str, Any]) -> None:
    """Fail closed if the upstream license identity changes or disappears."""
    meta = payload.get("meta") if isinstance(payload, dict) else None
    if not isinstance(meta, dict):
        raise ScholarshipSourceLicenseError("Open Scholarships response is missing license metadata")
    if meta.get("license") != OPEN_SCHOLARSHIPS_LICENSE:
        raise ScholarshipSourceLicenseError("Open Scholarships license is not the approved CC BY 4.0 license")
    license_url = str(meta.get("license_url") or "")
    if "creativecommons.org/licenses/by/4.0" not in license_url:
        raise ScholarshipSourceLicenseError("Open Scholarships license URL changed; manual review required")
    attribution = str(meta.get("attribution_required") or "").strip()
    if not attribution:
        raise ScholarshipSourceLicenseError("Open Scholarships attribution requirement is missing")


def normalize_open_scholarship(record: dict[str, Any], *, imported_at: datetime | None = None) -> dict[str, Any]:
    """Normalize one CC BY 4.0 record without inventing missing eligibility facts."""
    imported_at = imported_at or utcnow()
    award = record.get("award") or {}
    deadline = record.get("deadline") or {}
    eligibility = record.get("eligibility") or {}
    geo = record.get("geo") or {}
    links = record.get("links") or {}
    provenance = record.get("provenance") or {}

    source_record_id = str(record.get("id") or "").strip()
    if not source_record_id:
        raise ValueError("Scholarship source record is missing an id")

    title = str(record.get("name") or "").strip()
    sponsor = str(record.get("sponsor") or "").strip()
    summary = str(record.get("summary") or "").strip()
    fields = [str(value).strip() for value in (eligibility.get("fields_of_study") or []) if str(value).strip()]
    tags = [str(value).strip() for value in (eligibility.get("tags") or []) if str(value).strip()]
    other = [str(value).strip() for value in (eligibility.get("other") or []) if str(value).strip()]
    residency = [str(value).strip().upper() for value in (eligibility.get("residency") or []) if str(value).strip()]
    levels = [str(value).strip() for value in (eligibility.get("education_level") or []) if str(value).strip()]
    availability = str(record.get("availability") or "unknown").strip().lower()
    source_status = str(record.get("status") or "active").strip().lower()
    deadline_date = _parse_date(deadline.get("date"))

    status = "active"
    if availability == "closed" or source_status not in {"active", "open"}:
        status = "expired"
    elif deadline_date and deadline_date < imported_at and availability not in {"rolling", "upcoming"}:
        status = "expired"

    search_parts = [title, sponsor, summary, str(award.get("basis") or ""), *fields, *tags, *other, *residency, *levels]

    return {
        "catalog_id": f"{OPEN_SCHOLARSHIPS_SOURCE}:{source_record_id}",
        "source": OPEN_SCHOLARSHIPS_SOURCE,
        "source_record_id": source_record_id,
        "title": title,
        "sponsor": sponsor,
        "sponsor_type": str(record.get("sponsor_type") or "").strip(),
        "opportunity_type": str(record.get("type") or "scholarship").strip(),
        "summary": summary,
        "award_min": award.get("amount_min"),
        "award_max": award.get("amount_max"),
        "currency": str(award.get("currency") or "USD").strip(),
        "basis": str(award.get("basis") or "").strip(),
        "renewable": award.get("renewable"),
        "award_notes": str(award.get("notes") or "").strip(),
        "deadline_type": str(deadline.get("type") or "unknown").strip(),
        "deadline_date": deadline_date,
        "deadline_notes": str(deadline.get("notes") or "").strip(),
        "opens_date": _parse_date(deadline.get("opens")),
        "residency": residency,
        "education_levels": levels,
        "fields_of_study": fields,
        "gpa_min": eligibility.get("gpa_min"),
        "citizenship": [str(value).strip() for value in (eligibility.get("citizenship") or []) if str(value).strip()],
        "eligibility_other": other,
        "tags": tags,
        "geo_state": str(geo.get("state") or "").strip().upper() or None,
        "geo_scope": str(geo.get("scope") or "").strip(),
        "counties": [str(value).strip() for value in (geo.get("counties") or []) if str(value).strip()],
        "info_url": str(links.get("info_url") or "").strip(),
        "apply_url": str(links.get("apply_url") or "").strip(),
        "availability": availability,
        "status": status,
        "review_flags": [str(value).strip() for value in (record.get("review_flags") or []) if str(value).strip()],
        "source_name": str(provenance.get("source_name") or "").strip(),
        "source_url": str(provenance.get("source_url") or links.get("info_url") or "").strip(),
        "source_verified_at": _parse_date(provenance.get("last_verified")),
        "source_added_at": _parse_date(provenance.get("added")),
        "rights_basis": "open_license",
        "license_id": OPEN_SCHOLARSHIPS_LICENSE,
        "license_url": OPEN_SCHOLARSHIPS_LICENSE_URL,
        "attribution": OPEN_SCHOLARSHIPS_ATTRIBUTION,
        "source_active": True,
        "search_text": " ".join(part for part in search_parts if part).lower(),
        "updated_at": imported_at,
    }


def ensure_scholarship_indexes() -> None:
    scholarships_collection.create_index([("catalog_id", ASCENDING)], unique=True, name="catalog_id_unique")
    scholarships_collection.create_index([("status", ASCENDING), ("source_added_at", DESCENDING)], name="active_recent")
    scholarships_collection.create_index([("deadline_date", ASCENDING)], name="deadline_date")
    scholarships_collection.create_index([("residency", ASCENDING)], name="residency")
    scholarships_collection.create_index([("education_levels", ASCENDING)], name="education_levels")


def sync_open_scholarships(*, client: httpx.Client | None = None) -> dict[str, Any]:
    """Refresh the approved open feed and archive source records that disappeared.

    Existing rows are retained if the remote call fails. The feed is only written after
    its license metadata passes the explicit license gate.
    """
    if not _sync_lock.acquire(blocking=False):
        return {"status": "already_running"}
    started_at = utcnow()
    own_client = client is None
    http = client or httpx.Client(timeout=25.0, follow_redirects=True)
    try:
        response = http.get(OPEN_SCHOLARSHIPS_URL, headers={"User-Agent": "Boasted-Scholarship-Catalog/1.0"})
        response.raise_for_status()
        payload = response.json()
        validate_open_scholarships_license(payload)
        records = payload.get("results") or []
        if not isinstance(records, list) or not records:
            raise RuntimeError("Open Scholarships returned no records; refusing to replace the catalog")

        ensure_scholarship_indexes()
        normalized: list[dict[str, Any]] = []
        for record in records:
            if isinstance(record, dict):
                normalized.append(normalize_open_scholarship(record, imported_at=started_at))
        if not normalized:
            raise RuntimeError("No valid scholarship records were available after normalization")

        operations = [
            UpdateOne(
                {"catalog_id": item["catalog_id"]},
                {"$set": item, "$setOnInsert": {"created_at": started_at}},
                upsert=True,
            )
            for item in normalized
        ]
        result = scholarships_collection.bulk_write(operations, ordered=False)
        seen_ids = [item["catalog_id"] for item in normalized]
        archived = scholarships_collection.update_many(
            {"source": OPEN_SCHOLARSHIPS_SOURCE, "catalog_id": {"$nin": seen_ids}},
            {"$set": {"status": "archived", "source_active": False, "updated_at": started_at}},
        ).modified_count
        archive_expired_scholarships(now=started_at)

        scholarship_sync_state_collection.update_one(
            {"source": OPEN_SCHOLARSHIPS_SOURCE},
            {
                "$set": {
                    "source": OPEN_SCHOLARSHIPS_SOURCE,
                    "last_success_at": started_at,
                    "record_count": len(normalized),
                    "license_id": OPEN_SCHOLARSHIPS_LICENSE,
                    "license_url": OPEN_SCHOLARSHIPS_LICENSE_URL,
                    "attribution": OPEN_SCHOLARSHIPS_ATTRIBUTION,
                    "upstream_version": (payload.get("meta") or {}).get("version"),
                    "last_error": None,
                }
            },
            upsert=True,
        )
        return {
            "status": "ok",
            "source": OPEN_SCHOLARSHIPS_SOURCE,
            "records": len(normalized),
            "upserted": result.upserted_count,
            "modified": result.modified_count,
            "archived": archived,
            "synced_at": started_at.isoformat(),
        }
    except Exception as exc:
        scholarship_sync_state_collection.update_one(
            {"source": OPEN_SCHOLARSHIPS_SOURCE},
            {
                "$set": {
                    "source": OPEN_SCHOLARSHIPS_SOURCE,
                    "last_attempt_at": started_at,
                    "last_error": f"{type(exc).__name__}: {exc}"[:500],
                }
            },
            upsert=True,
        )
        raise
    finally:
        if own_client:
            http.close()
        _sync_lock.release()


def archive_expired_scholarships(*, now: datetime | None = None) -> int:
    """Soft-expire closed cycles so they disappear from normal discovery."""
    now = now or utcnow()
    result = scholarships_collection.update_many(
        {
            "status": "active",
            "$or": [
                {"availability": "closed"},
                {
                    "deadline_date": {"$lt": now},
                    "availability": {"$nin": ["rolling", "upcoming"]},
                },
            ],
        },
        {"$set": {"status": "expired", "expired_at": now, "updated_at": now}},
    )
    return result.modified_count


def catalog_needs_sync(*, now: datetime | None = None) -> bool:
    now = now or utcnow()
    state = scholarship_sync_state_collection.find_one({"source": OPEN_SCHOLARSHIPS_SOURCE})
    last_success = state.get("last_success_at") if state else None
    return not isinstance(last_success, datetime) or (now - last_success.astimezone(timezone.utc)) >= SYNC_INTERVAL


STATE_NAMES = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD", "massachusetts": "MA",
    "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO", "montana": "MT",
    "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
    "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC",
}
LEVEL_ALIASES = {
    "high school": "high-school-senior",
    "high-school": "high-school-senior",
    "high school senior": "high-school-senior",
    "undergraduate": "undergraduate",
    "college": "undergraduate",
    "graduate": "graduate",
    "grad school": "graduate",
    "community college": "community-college",
    "vocational": "vocational",
    "professional development": "professional-development",
}
STOPWORDS = {
    "a", "an", "and", "for", "in", "of", "or", "scholarship", "scholarships", "award", "awards",
    "find", "show", "me", "with", "that", "are", "is", "to", "the", "over", "under", "at", "least",
    "minimum", "min", "more", "than", "open", "available", "currently",
}


def interpret_scholarship_query(query: str) -> dict[str, Any]:
    """Extract deterministic filters while preserving remaining words for text search."""
    raw = (query or "").strip()
    lowered = raw.lower()
    understood: list[str] = []
    states: list[str] = []
    levels: list[str] = []
    basis: list[str] = []
    availability: str | None = None
    min_amount: int | None = None

    for name, code in STATE_NAMES.items():
        if re.search(rf"\b{re.escape(name)}\b", lowered):
            states.append(code)
            understood.append(name.title())
    for token in re.findall(r"\b[A-Z]{2}\b", raw):
        if token in set(STATE_NAMES.values()) and token not in states:
            states.append(token)
            understood.append(token)

    for phrase, level in sorted(LEVEL_ALIASES.items(), key=lambda item: -len(item[0])):
        if phrase in lowered and level not in levels:
            levels.append(level)
            understood.append(phrase.title())

    if "need-based" in lowered or "need based" in lowered or "financial need" in lowered:
        basis.append("need")
        understood.append("Need-based")
    if "merit" in lowered:
        basis.extend([value for value in ["merit", "merit-need"] if value not in basis])
        understood.append("Merit")

    if "rolling" in lowered:
        availability = "rolling"
        understood.append("Rolling")
    elif "upcoming" in lowered:
        availability = "upcoming"
        understood.append("Upcoming")
    elif re.search(r"\bopen\b", lowered):
        availability = "open"
        understood.append("Open now")

    amount_match = re.search(r"\$\s*([0-9][0-9,]*)\s*\+", raw)
    if not amount_match:
        amount_match = re.search(r"(?:over|at least|minimum|min)\s*\$?\s*([0-9][0-9,]*)", lowered)
    if amount_match:
        min_amount = int(amount_match.group(1).replace(",", ""))
        understood.append(f"${min_amount:,}+")

    words = re.findall(r"[a-z0-9][a-z0-9+#.-]*", lowered)
    excluded = set(STOPWORDS)
    excluded.update(part for name in STATE_NAMES for part in name.split() if name in lowered)
    excluded.update(part for phrase in LEVEL_ALIASES for part in phrase.split() if phrase in lowered)
    text_tokens = [
        word for word in words
        if word not in excluded and not word.isdigit() and not re.fullmatch(r"\d+[kK]?", word)
    ]
    # Keep ordering while deduplicating.
    text_tokens = list(dict.fromkeys(text_tokens))[:8]

    return {
        "raw": raw,
        "states": states,
        "levels": levels,
        "basis": list(dict.fromkeys(basis)),
        "availability": availability,
        "min_amount": min_amount,
        "text_tokens": text_tokens,
        "understood": understood,
    }


def build_scholarship_filter(
    *,
    query: str = "",
    state: str | None = None,
    level: str | None = None,
    basis: str | None = None,
    availability: str | None = None,
    min_amount: int | None = None,
    include_expired: bool = False,
) -> tuple[dict[str, Any], dict[str, Any]]:
    interpreted = interpret_scholarship_query(query)
    clauses: list[dict[str, Any]] = []
    if not include_expired:
        clauses.append({"status": "active"})

    states = [state.upper()] if state else interpreted["states"]
    if states:
        clauses.append({"$or": [{"residency": {"$in": states}}, {"residency": "US"}]})
    levels = [level] if level else interpreted["levels"]
    if levels:
        clauses.append({"education_levels": {"$in": levels}})
    bases = [basis] if basis else interpreted["basis"]
    if bases:
        clauses.append({"basis": {"$in": bases}})
    desired_availability = availability or interpreted["availability"]
    if desired_availability:
        clauses.append({"availability": desired_availability})
    desired_amount = min_amount if min_amount is not None else interpreted["min_amount"]
    if desired_amount is not None:
        clauses.append({"award_max": {"$gte": desired_amount}})

    for token in interpreted["text_tokens"]:
        clauses.append({"search_text": {"$regex": re.escape(token), "$options": "i"}})

    mongo_filter: dict[str, Any]
    if not clauses:
        mongo_filter = {}
    elif len(clauses) == 1:
        mongo_filter = clauses[0]
    else:
        mongo_filter = {"$and": clauses}
    return mongo_filter, interpreted


def scholarship_source_summary() -> dict[str, Any]:
    state = scholarship_sync_state_collection.find_one({"source": OPEN_SCHOLARSHIPS_SOURCE}) or {}
    return {
        "name": "Open Scholarships",
        "source": OPEN_SCHOLARSHIPS_SOURCE,
        "license": OPEN_SCHOLARSHIPS_LICENSE,
        "license_url": OPEN_SCHOLARSHIPS_LICENSE_URL,
        "attribution": OPEN_SCHOLARSHIPS_ATTRIBUTION,
        "last_synced_at": state.get("last_success_at"),
        "record_count": state.get("record_count"),
        "upstream_version": state.get("upstream_version"),
    }
