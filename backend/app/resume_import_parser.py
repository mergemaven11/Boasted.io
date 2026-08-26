from __future__ import annotations

import re

SECTION_KEYS = ("summary", "skills", "projects", "experience", "education")
SECTION_NAMES = {
    "summary": {"summary", "professional summary", "profile", "professional profile", "career summary"},
    "skills": {
        "skills", "technical skills", "core skills", "technical proficiencies", "core competencies",
        "competencies", "areas of expertise",
    },
    "projects": {"projects", "technical projects", "selected projects", "project experience"},
    "experience": {
        "experience", "work experience", "professional experience", "professional work experience",
        "employment history", "employment", "work history", "career experience", "relevant experience",
        "employment experience", "professional background",
    },
    "education": {"education", "education & training", "training", "academic background"},
}
BULLET_RE = re.compile(r"^[•▪◦*-]\s*")
MONTH_RE = re.compile(
    r"^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
    r"sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|present|current)$",
    re.I,
)
YEAR_RE = re.compile(r"^(?:19|20)\d{2}$")
ROLE_RE = re.compile(
    r"\b(?:engineer|analyst|manager|developer|specialist|consultant|administrator|designer|director|"
    r"lead|coordinator|recruiter|intern|architect|technician|officer|associate|supervisor|scientist|"
    r"advisor|representative|executive|technologist|programmer|tester|strategist|product owner|"
    r"program manager|project manager|scrum master|customer success|service desk|support professional)\b",
    re.I,
)
CONTACT_RE = re.compile(r"(?:@|\b\d{3}[-.)\s]\d{3}[-.\s]\d{4}\b|linkedin|github\.com|https?://)", re.I)
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
PHONE_RE = re.compile(r"(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s])\d{3}[-.\s]\d{4}")
LINK_RE = re.compile(r"(?:https?://\S+|(?:www\.)?linkedin\.com/\S+|(?:www\.)?github\.com/\S+)", re.I)
DATE_RANGE_RE = re.compile(
    r"(?P<start>(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
    r"sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*(?:19|20)\d{2})\s*[-–—]\s*"
    r"(?P<end>(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|"
    r"sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)?\s*(?:19|20)\d{2}|present|current))",
    re.I,
)
SIMPLE_DATE_RANGE_RE = re.compile(r"\b(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current)\b", re.I)
SEPARATOR_RE = re.compile(r"\s*(?:[|·•]|\s+[–—]\s+|\s+-\s+)\s*")
SKILL_LABELS = {
    "languages", "frameworks", "libraries", "tools", "platforms", "databases", "cloud", "operating systems"
}
PROJECT_SIGNAL_RE = re.compile(
    r"\b(?:app|application|website|web site|site|api|service|dashboard|bot|cli|pipeline|system|portfolio|"
    r"repository|repo|project|tracker|tooling|extension|plugin|integration|automation)\b",
    re.I,
)


def _clean(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def _heading(line: str) -> str | None:
    normalized = re.sub(r"[^a-z& ]", "", line.lower()).strip()
    for key, names in SECTION_NAMES.items():
        if normalized in names:
            return key
    return None


def _date_atom(line: str) -> bool:
    value = _clean(line).strip("|,.-–— ")
    return bool(MONTH_RE.fullmatch(value) or YEAR_RE.fullmatch(value) or value in {"-", "–", "—"})


def _date_range(parts: list[str]) -> str:
    text = " ".join(_clean(p).strip("|") for p in parts)
    text = re.sub(r"\s+[-–—]\s+", " – ", text)
    return _clean(text)


def _looks_role(line: str) -> bool:
    return bool(ROLE_RE.search(line)) and len(line.split()) <= 20


def _looks_short_label(line: str) -> bool:
    words = line.split()
    return 0 < len(words) <= 10 and not re.search(r"[.!?]$", line)


def _looks_location(line: str) -> bool:
    value = _clean(line).strip("|, ")
    if not value or CONTACT_RE.search(value):
        return False
    if re.search(r"\b(?:remote|hybrid|onsite|on-site)\b", value, re.I):
        return True
    if re.search(r",\s*[A-Z]{2}\b", value):
        return True
    return bool(re.search(r"\b[A-Z]{2}\b", value) and len(value.split()) <= 6)


def _repair(raw_text: str) -> list[str]:
    raw_text = re.sub(r"(?<=\S)\s+([•▪◦])\s*", r"\n\1 ", raw_text or "")
    source = [_clean(x) for x in raw_text.splitlines() if _clean(x)]
    out: list[str] = []
    i = 0
    while i < len(source):
        line = source[i]
        if line == "|":
            i += 1
            continue
        if _heading(line):
            out.append(line)
            i += 1
            continue
        if _date_atom(line):
            parts = [line]
            i += 1
            while i < len(source) and (_date_atom(source[i]) or _clean(source[i]) in {"-", "–", "—"}) and len(parts) < 7:
                parts.append(source[i])
                i += 1
            out.append(_date_range(parts))
            continue
        if BULLET_RE.match(line):
            text = BULLET_RE.sub("", line).strip()
            i += 1
            while i < len(source):
                nxt = source[i]
                if _heading(nxt) or BULLET_RE.match(nxt) or _date_atom(nxt) or _looks_role(nxt):
                    break
                text += " " + nxt.strip("|")
                i += 1
                if re.search(r"[.!?]$", text):
                    break
            out.append("• " + _clean(text))
            continue
        out.append(line.strip("| "))
        i += 1
    return [x for x in out if x]


def _split_role_company(line: str) -> tuple[str, str, str]:
    """Return company, title, confidence for one employer/title line."""
    value = _clean(line).strip("| ")
    at_match = re.match(r"(?P<title>.+?)\s+at\s+(?P<company>.+)$", value, re.I)
    if at_match and _looks_role(at_match.group("title")):
        return _clean(at_match.group("company")), _clean(at_match.group("title")), "high"

    parts = [_clean(part) for part in SEPARATOR_RE.split(value) if _clean(part)]
    if len(parts) >= 2:
        left, right = parts[0], parts[1]
        left_role = bool(ROLE_RE.search(left))
        right_role = bool(ROLE_RE.search(right))
        if right_role and not left_role:
            return left, right, "high"
        if left_role and not right_role:
            return right, left, "high"
        if right_role:
            return left, right, "medium"
        if left_role:
            return right, left, "medium"
    if _looks_role(value):
        return "", value, "low"
    return value, "", "low"


def _parse_dates(value: str) -> dict:
    raw = _clean(value).replace("—", "–")
    match = DATE_RANGE_RE.search(raw)
    if not match:
        years = re.findall(r"(?:19|20)\d{2}", raw)
        current = bool(re.search(r"\b(?:present|current)\b", raw, re.I))
        return {
            "start_date": years[0] if years else "",
            "end_date": "present" if current else (years[1] if len(years) > 1 else ""),
            "current": current,
            "dates_raw": raw,
        }
    start = _clean(match.group("start"))
    end = _clean(match.group("end"))
    current = end.lower() in {"present", "current"}
    return {
        "start_date": start,
        "end_date": "present" if current else end,
        "current": current,
        "dates_raw": _clean(match.group(0)).replace("—", "–"),
    }


def _parse_contact(header: list[str]) -> dict:
    contact = {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "github": "",
        "links": [],
    }
    if header:
        first = _clean(header[0])
        if first and not CONTACT_RE.search(first) and not _looks_role(first):
            contact["name"] = first

    for line in header[:12]:
        email = EMAIL_RE.search(line)
        phone = PHONE_RE.search(line)
        links = LINK_RE.findall(line)
        if email and not contact["email"]:
            contact["email"] = email.group(0).rstrip(".,;")
        if phone and not contact["phone"]:
            contact["phone"] = phone.group(0)
        for link in links:
            clean_link = link.rstrip(".,;)")
            if clean_link not in contact["links"]:
                contact["links"].append(clean_link)
            lower = clean_link.lower()
            if "linkedin.com" in lower and not contact["linkedin"]:
                contact["linkedin"] = clean_link
            if "github.com" in lower and not contact["github"]:
                contact["github"] = clean_link

    for line in header[1:8]:
        candidate = _clean(line)
        if not candidate or _looks_role(candidate):
            continue
        pieces = [piece.strip() for piece in candidate.split("|") if piece.strip()]
        for piece in pieces:
            if CONTACT_RE.search(piece):
                continue
            if _looks_location(piece):
                contact["location"] = piece
                break
        if contact["location"]:
            break
    return contact


def _blank_entry(*, company: str = "", title: str = "", confidence: str = "low") -> dict:
    return {
        "company": company,
        "title": title,
        "location": "",
        "start_date": "",
        "end_date": "",
        "current": False,
        "dates_raw": "",
        "bullets": [],
        "confidence": confidence,
    }


def _date_match(line: str):
    return DATE_RANGE_RE.search(line) or SIMPLE_DATE_RANGE_RE.search(line)


def _identity_and_location_around_dates(line: str) -> tuple[str, str]:
    match = _date_match(line)
    remainder = line
    if match:
        remainder = f"{line[:match.start()]} {line[match.end():]}"
    remainder = _clean(remainder).strip("|,; -–—")
    if not remainder:
        return "", ""

    parts = [_clean(part) for part in SEPARATOR_RE.split(remainder) if _clean(part)]
    location = ""
    identity_parts: list[str] = []
    for part in parts:
        if not location and _looks_location(part):
            location = part
        else:
            identity_parts.append(part)
    return " | ".join(identity_parts), location


def _parse_experience(lines: list[str]) -> tuple[list[dict], list[str]]:
    entries: list[dict] = []
    warnings: list[str] = []
    current: dict | None = None
    pending_company = ""

    def flush() -> None:
        nonlocal current
        if not current:
            return
        if current.get("company") or current.get("title") or current.get("bullets"):
            if not current.get("company"):
                warnings.append(f"Confirm employer for {current.get('title') or 'an imported role'}")
            if not current.get("title"):
                warnings.append(f"Confirm job title for {current.get('company') or 'an imported employer'}")
            entries.append(current)
        current = None

    i = 0
    while i < len(lines):
        line = _clean(lines[i])
        if not line or _heading(line):
            i += 1
            continue

        if BULLET_RE.match(line):
            if current is None:
                current = _blank_entry(company=pending_company)
                pending_company = ""
            text = BULLET_RE.sub("", line).strip()
            if text:
                current["bullets"].append({"text": text[:500], "source_kind": "imported"})
            i += 1
            continue

        date_hit = bool(_date_match(line)) or (
            re.search(r"(?:19|20)\d{2}", line) and re.search(r"[-–—]|present|current", line, re.I)
        )
        if date_hit:
            identity_text, location = _identity_and_location_around_dates(line)
            if identity_text and (_looks_role(identity_text) or "|" in identity_text or re.search(r"\s+at\s+", identity_text, re.I)):
                company, title, confidence = _split_role_company(identity_text)
                if title:
                    flush()
                    current = _blank_entry(
                        company=company or pending_company,
                        title=title,
                        confidence=confidence if company or pending_company else "low",
                    )
                    pending_company = ""
            if current is None:
                current = _blank_entry(company=pending_company)
                pending_company = ""
            current.update(_parse_dates(line))
            if location and not current.get("location"):
                current["location"] = location
            i += 1
            continue

        if "|" in line or "·" in line or _looks_role(line) or re.search(r"\s+at\s+", line, re.I):
            company, title, confidence = _split_role_company(line)
            if title:
                flush()
                current = _blank_entry(
                    company=company or pending_company,
                    title=title,
                    confidence=confidence if company or pending_company else "low",
                )
                pending_company = ""
                i += 1
                continue

        if _looks_short_label(line):
            next_line = _clean(lines[i + 1]) if i + 1 < len(lines) else ""
            next_is_date = bool(_date_match(next_line)) or bool(
                re.search(r"(?:19|20)\d{2}", next_line) and re.search(r"[-–—]|present|current", next_line, re.I)
            )
            if current and current.get("title") and not current.get("company") and not _looks_location(line):
                if next_is_date or BULLET_RE.match(next_line) or _looks_location(next_line):
                    current["company"] = line
                    current["confidence"] = "medium"
                    i += 1
                    continue
            if current and current.get("title") and not current.get("location") and _looks_location(line):
                current["location"] = line
            elif _looks_role(next_line):
                pending_company = line
            elif current is None:
                pending_company = line
            i += 1
            continue

        i += 1

    flush()
    return entries[:20], list(dict.fromkeys(warnings))[:20]


def _structured_experience_lines(entries: list[dict]) -> list[str]:
    out: list[str] = []
    for entry in entries:
        heading = " | ".join(part for part in [entry.get("company", ""), entry.get("title", "")] if part)
        if heading:
            out.append(heading)
        if entry.get("dates_raw"):
            out.append(entry["dates_raw"])
        if entry.get("location"):
            out.append(entry["location"])
        for bullet in entry.get("bullets", []):
            text = _clean(bullet.get("text", ""))
            if text:
                out.append(f"• {text}")
    return out


def _projects_are_skill_only(lines: list[str]) -> bool:
    """Return True only when a projects section is clearly mislabeled skills."""
    cleaned = [_clean(line) for line in lines if _clean(line)]
    if not cleaned:
        return False

    label_count = 0
    value_count = 0
    for line in cleaned:
        normalized = line.strip(" :|").lower()
        if normalized in SKILL_LABELS:
            label_count += 1
            continue
        if BULLET_RE.match(line) or _date_match(line):
            return False
        if PROJECT_SIGNAL_RE.search(line):
            return False
        if re.search(r"[.!?]$", line) or len(line.split()) > 12:
            return False
        value_count += 1

    return label_count > 0 and value_count > 0


def parse_existing_resume_text(raw_text: str) -> dict:
    lines = _repair(raw_text)
    sections = {key: [] for key in SECTION_KEYS}
    header: list[str] = []
    current: str | None = None
    for line in lines:
        heading = _heading(line)
        if heading:
            current = heading
            continue
        if current is None:
            header.append(line)
        else:
            sections[current].append(line)

    if _projects_are_skill_only(sections["projects"]):
        sections["skills"].extend(sections["projects"])
        sections["projects"] = []

    skill_lines = sections["skills"]
    compact_skills: list[str] = []
    pending_label = ""
    for line in skill_lines:
        if line == "|":
            continue
        if (
            _looks_short_label(line)
            and not any(ch in line for ch in ",;|")
            and line.lower() in SKILL_LABELS
        ):
            pending_label = line
            continue
        if pending_label:
            compact_skills.append(f"{pending_label} | {line.strip('| ')}")
            pending_label = ""
        elif compact_skills and (line.startswith("|") or len(line.split()) <= 2):
            base = compact_skills[-1].rstrip(" ,;")
            addition = line.strip("| ,;")
            compact_skills[-1] = _clean(f"{base}, {addition}")
        else:
            compact_skills.append(line)
    sections["skills"] = compact_skills

    experience, parse_warnings = _parse_experience(sections["experience"])
    if not experience:
        inferred, inferred_warnings = _parse_experience(lines)
        inferred = [
            entry for entry in inferred
            if entry.get("title") and (entry.get("company") or entry.get("dates_raw") or entry.get("bullets"))
        ]
        if inferred:
            experience = inferred
            parse_warnings = inferred_warnings
            if not sections["experience"]:
                parse_warnings = [
                    "Work history was inferred because the resume did not use a standard experience heading.",
                    *parse_warnings,
                ]
            sections["experience"] = _structured_experience_lines(experience)

    contact = _parse_contact(header if header else lines[:12])

    bullets = [
        bullet["text"]
        for entry in experience
        for bullet in entry.get("bullets", [])
        if len(bullet.get("text", "")) >= 18
    ]
    if not bullets:
        bullets = [
            BULLET_RE.sub("", x).strip()
            for x in sections["experience"]
            if BULLET_RE.match(x) and len(BULLET_RE.sub("", x).strip()) >= 18
        ]
    if not bullets:
        bullets = [
            BULLET_RE.sub("", x).strip()
            for x in lines
            if BULLET_RE.match(x) and len(BULLET_RE.sub("", x).strip()) >= 18
        ]

    skills: list[str] = []
    for line in sections["skills"]:
        value = line.split("|", 1)[-1]
        for skill in re.split(r"[,;•·/]", value):
            skill = _clean(skill)
            if 1 < len(skill) <= 80 and skill.lower() not in {x.lower() for x in skills}:
                skills.append(skill)

    summary = " ".join(sections["summary"][:3])[:1200]
    return {
        "summary": summary,
        "bullets": bullets[:20],
        "skills": skills[:40],
        "sections_found": [k for k, v in sections.items() if v],
        "sections": {k: v[:100] for k, v in sections.items() if v},
        "header_lines": header[:12],
        "contact": contact,
        "experience": experience,
        "parse_warnings": list(dict.fromkeys(parse_warnings))[:20],
        "line_count": len(lines),
        "text": "\n".join(lines)[:50000],
    }
