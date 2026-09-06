"""Confidence-aware resume import parsing built on the proven legacy parser.

This module intentionally keeps parsing deterministic. It learns from ATS-safe
resume structure (clear headings and linear reading order) without copying any
third-party resume text or templates.
"""
from __future__ import annotations

import re
from collections import OrderedDict

from app.resume_import_parser import parse_existing_resume_text as parse_legacy_resume

CORE_SECTION_HEADINGS = OrderedDict(
    {
        "summary": {
            "summary",
            "professional summary",
            "career summary",
            "profile",
            "professional profile",
            "career profile",
            "about me",
            "objective",
            "career objective",
            "professional objective",
            "value summary",
            "executive summary",
            "technical summary",
        },
        "skills": {
            "skills",
            "technical skills",
            "core skills",
            "key skills",
            "skills and tools",
            "skills & tools",
            "technical expertise",
            "technical proficiencies",
            "core competencies",
            "competencies",
            "areas of expertise",
            "expertise",
            "technology",
            "technologies",
        },
        "experience": {
            "experience",
            "work experience",
            "professional experience",
            "professional work experience",
            "employment history",
            "employment",
            "work history",
            "career experience",
            "career history",
            "professional history",
            "relevant experience",
            "employment experience",
            "professional background",
            "work background",
        },
        "education": {
            "education",
            "education and training",
            "education & training",
            "academic background",
            "academic history",
            "academic experience",
        },
        "projects": {
            "projects",
            "technical projects",
            "selected projects",
            "project experience",
            "academic projects",
            "personal projects",
            "portfolio projects",
            "selected work",
        },
    }
)

EXTRA_SECTION_HEADINGS = OrderedDict(
    {
        "certifications": {
            "certifications",
            "certification",
            "licenses and certifications",
            "licensure and certifications",
            "credentials",
            "professional certifications",
            "certificates",
        },
        "awards": {
            "awards",
            "honors",
            "honors and awards",
            "honors & awards",
            "achievements",
            "selected achievements",
        },
        "leadership": {
            "leadership",
            "leadership experience",
            "leadership and activities",
            "leadership & activities",
            "activities",
            "campus leadership",
        },
        "volunteer": {
            "volunteer experience",
            "volunteering",
            "community involvement",
            "community service",
            "service",
        },
        "publications": {
            "publications",
            "publications and presentations",
            "publications & presentations",
            "presentations",
            "research publications",
        },
        "languages": {
            "languages",
            "language skills",
        },
    }
)

CANONICAL_HEADING = {
    "summary": "PROFESSIONAL SUMMARY",
    "skills": "SKILLS",
    "experience": "PROFESSIONAL EXPERIENCE",
    "education": "EDUCATION",
    "projects": "PROJECTS",
}

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
PHONE_RE = re.compile(r"(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s])\d{3}[-.\s]\d{4}")
DATE_RE = re.compile(r"\b(?:19|20)\d{2}\b|\b(?:present|current)\b", re.I)
BULLET_RE = re.compile(r"^[•▪◦*\-]\s*")


def _normalize_heading(value: str) -> str:
    value = (value or "").strip().lower().replace("/", " and ")
    value = re.sub(r"[^a-z0-9&+ ]", "", value)
    value = value.replace("+", " and ")
    return re.sub(r"\s+", " ", value).strip()


def _heading_key(line: str) -> str | None:
    normalized = _normalize_heading(line)
    if not normalized or len(normalized.split()) > 6:
        return None
    for key, names in (*CORE_SECTION_HEADINGS.items(), *EXTRA_SECTION_HEADINGS.items()):
        if normalized in names:
            return key
    return None


def _split_sections(raw_text: str) -> tuple[list[str], list[tuple[str, list[str]]]]:
    """Split recognized sections while retaining their original order."""
    lines = [line.strip() for line in (raw_text or "").splitlines() if line.strip()]
    header: list[str] = []
    segments: list[tuple[str, list[str]]] = []
    current_key: str | None = None
    current_lines: list[str] = []

    def flush() -> None:
        nonlocal current_lines
        if current_key is not None:
            segments.append((current_key, current_lines))
        current_lines = []

    for line in lines:
        key = _heading_key(line)
        if key:
            flush()
            current_key = key
            continue
        if current_key is None:
            header.append(line)
        else:
            current_lines.append(line)
    flush()
    return header, segments


def _core_input(raw_text: str) -> tuple[str, dict[str, list[str]], list[str]]:
    """Build clean legacy-parser input and preserve non-core sections separately."""
    header, segments = _split_sections(raw_text)
    core_parts = list(header)
    extra: dict[str, list[str]] = {}
    core_found: list[str] = []
    for key, lines in segments:
        if key in CANONICAL_HEADING:
            core_found.append(key)
            core_parts.extend([CANONICAL_HEADING[key], *lines])
        else:
            extra.setdefault(key, []).extend(lines)

    # When no core heading was recognized, give the legacy parser the untouched
    # source so its low-confidence work-history inference still gets a chance.
    if not core_found:
        return raw_text, extra, core_found
    return "\n".join(core_parts), extra, core_found


def _role_confidence(role: dict) -> dict:
    base = role.get("confidence", "low")
    identity_level = "high" if base == "high" else "medium" if base in {"medium", "manual"} else "low"
    return {
        "company": identity_level if role.get("company") else "missing",
        "title": identity_level if role.get("title") else "missing",
        "location": "high" if role.get("location") else "missing",
        "dates": "high" if role.get("dates_raw") or role.get("start_date") else "missing",
        "bullets": "high" if role.get("bullets") else "missing",
    }


def _contact_confidence(contact: dict) -> dict:
    name = str(contact.get("name") or "").strip()
    email = str(contact.get("email") or "").strip()
    phone = str(contact.get("phone") or "").strip()
    return {
        "name": "high" if len(name.split()) >= 2 else "medium" if name else "missing",
        "email": "high" if EMAIL_RE.fullmatch(email) else "medium" if email else "missing",
        "phone": "high" if PHONE_RE.search(phone) else "medium" if phone else "missing",
        "location": "high" if contact.get("location") else "missing",
        "linkedin": "high" if contact.get("linkedin") else "missing",
        "github": "high" if contact.get("github") else "missing",
    }


def _quality_summary(parsed: dict, raw_text: str, extra_sections: dict[str, list[str]]) -> dict:
    roles = parsed.get("experience", [])
    complete_roles = sum(1 for role in roles if role.get("company") and role.get("title") and (role.get("dates_raw") or role.get("start_date")))
    role_fields = sum(
        bool(role.get(field))
        for role in roles
        for field in ("company", "title", "location", "dates_raw")
    )
    role_field_total = max(1, len(roles) * 4)
    contact = parsed.get("contact", {})
    contact_fields = sum(bool(contact.get(field)) for field in ("name", "email", "phone", "location", "linkedin", "github"))
    recognized_sections = len(parsed.get("sections_found", []))
    warnings = len(parsed.get("parse_warnings", []))

    if roles:
        structural = round((complete_roles / len(roles)) * 55 + (role_fields / role_field_total) * 20)
    else:
        structural = 35 if recognized_sections else 10
    score = min(100, structural + min(15, contact_fields * 3) + min(10, recognized_sections * 2) - min(20, warnings * 4))

    return {
        "score": max(0, int(score)),
        "role_count": len(roles),
        "complete_role_count": complete_roles,
        "contact_field_count": contact_fields,
        "recognized_section_count": recognized_sections,
        "extra_section_count": len([key for key, lines in extra_sections.items() if lines]),
        "source_line_count": len([line for line in (raw_text or "").splitlines() if line.strip()]),
        "warning_count": warnings,
    }


def parse_existing_resume_text(raw_text: str) -> dict:
    """Parse a resume with broader headings and auditable field confidence.

    The function never invents missing values. Low-confidence or absent fields are
    surfaced so the review UI can ask the user to correct them.
    """
    core_text, extra_sections, _core_found = _core_input(raw_text)
    parsed = parse_legacy_resume(core_text)

    sections = dict(parsed.get("sections", {}))
    for key, lines in extra_sections.items():
        cleaned = [line.strip() for line in lines if line.strip()]
        if cleaned:
            sections[key] = cleaned[:100]
    parsed["sections"] = sections

    found = list(parsed.get("sections_found", []))
    for key in extra_sections:
        if extra_sections[key] and key not in found:
            found.append(key)
    parsed["sections_found"] = found

    source_signals = dict(parsed.get("source_signals", {}))
    for key in EXTRA_SECTION_HEADINGS:
        source_signals[f"has_{key}_heading"] = key in found
    parsed["source_signals"] = source_signals

    field_confidence = {
        "contact": _contact_confidence(parsed.get("contact", {})),
        "experience": [_role_confidence(role) for role in parsed.get("experience", [])],
        "sections": {key: ("high" if sections.get(key) else "missing") for key in (*CORE_SECTION_HEADINGS.keys(), *EXTRA_SECTION_HEADINGS.keys())},
    }
    parsed["field_confidence"] = field_confidence
    parsed["parse_quality"] = _quality_summary(parsed, raw_text, extra_sections)

    warnings = list(parsed.get("parse_warnings", []))
    for index, role in enumerate(parsed.get("experience", []), start=1):
        confidence = _role_confidence(role)
        if confidence["company"] == "missing" or confidence["title"] == "missing":
            warning = f"Role {index} has an identity field that needs confirmation."
            if warning not in warnings:
                warnings.append(warning)
        if confidence["dates"] == "missing" and (role.get("company") or role.get("title")):
            warning = f"Confirm dates for {role.get('title') or role.get('company')}."
            if warning not in warnings:
                warnings.append(warning)
    parsed["parse_warnings"] = warnings[:20]

    # Preserve the real uploaded source for auditing/corrections, not the
    # normalized core-only text fed to the legacy parser.
    parsed["raw_text"] = (raw_text or "")[:50000]
    return parsed
