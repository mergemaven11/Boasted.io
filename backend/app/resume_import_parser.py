from __future__ import annotations

import re

SECTION_KEYS = ("summary", "skills", "projects", "experience", "education")
SECTION_NAMES = {
    "summary": {"summary", "professional summary", "profile", "professional profile"},
    "skills": {"skills", "technical skills", "core skills", "technical proficiencies"},
    "projects": {"projects", "technical projects", "selected projects", "project experience"},
    "experience": {"experience", "work experience", "professional experience", "professional work experience", "employment history"},
    "education": {"education", "education & training", "training"},
}
BULLET_RE = re.compile(r"^[•▪◦*-]\s*")
MONTH_RE = re.compile(r"^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|present|current)$", re.I)
YEAR_RE = re.compile(r"^(?:19|20)\d{2}$")
ROLE_RE = re.compile(r"\b(?:engineer|analyst|manager|developer|specialist|consultant|administrator|designer|director|lead|coordinator|recruiter|intern)\b", re.I)
CONTACT_RE = re.compile(r"(?:@|\b\d{3}[-.)\s]\d{3}[-.\s]\d{4}\b|linkedin|github\.com|https?://)", re.I)


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
    return bool(ROLE_RE.search(line)) and len(line.split()) <= 18


def _looks_short_label(line: str) -> bool:
    words = line.split()
    return 0 < len(words) <= 8 and not re.search(r"[.!?]$", line)


def _join_fragments(lines: list[str], start: int) -> tuple[str, int]:
    parts = [_clean(lines[start]).strip("|")]
    i = start + 1
    while i < len(lines):
        nxt = _clean(lines[i])
        if not nxt or _heading(nxt) or BULLET_RE.match(nxt) or _date_atom(nxt) or _looks_role(nxt):
            break
        # PDF column extraction often emits comma-terminated skill/tech fragments.
        if len(parts) >= 1 and _looks_short_label(parts[0]) and _looks_short_label(nxt) and not parts[-1].endswith((",", ";", ":")):
            break
        parts.append(nxt.strip("|"))
        i += 1
        if re.search(r"[.!?]$", parts[-1]):
            break
    return _clean(" ".join(parts)), i


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
            out.append(line); i += 1; continue
        if _date_atom(line):
            parts = [line]; i += 1
            while i < len(source) and (_date_atom(source[i]) or _clean(source[i]) in {"-", "–", "—"}) and len(parts) < 6:
                parts.append(source[i]); i += 1
            out.append(_date_range(parts)); continue
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
            out.append("• " + _clean(text)); continue
        out.append(line.strip("| "))
        i += 1
    return [x for x in out if x]


def parse_existing_resume_text(raw_text: str) -> dict:
    lines = _repair(raw_text)
    sections = {key: [] for key in SECTION_KEYS}
    header: list[str] = []
    current: str | None = None
    i = 0
    while i < len(lines):
        line = lines[i]
        heading = _heading(line)
        if heading:
            current = heading; i += 1; continue
        if current is None:
            header.append(line); i += 1; continue
        sections[current].append(line)
        i += 1

    # Rebuild skills into compact category rows instead of one token per line.
    skill_lines = sections["skills"]
    compact_skills: list[str] = []
    pending_label = ""
    for line in skill_lines:
        if line == "|":
            continue
        if _looks_short_label(line) and not any(ch in line for ch in ",;|") and line.lower() in {"languages", "frameworks", "libraries", "tools", "platforms", "databases", "cloud", "operating systems"}:
            pending_label = line
            continue
        if pending_label:
            compact_skills.append(f"{pending_label} | {line.strip('| ')}")
            pending_label = ""
        elif compact_skills and (line.startswith("|") or len(line.split()) <= 2):
            compact_skills[-1] = _clean(compact_skills[-1] + ", " + line.strip("| ,"))
        else:
            compact_skills.append(line)
    sections["skills"] = compact_skills

    bullets = [BULLET_RE.sub("", x).strip() for x in sections["experience"] if BULLET_RE.match(x) and len(BULLET_RE.sub("", x).strip()) >= 18]
    if not bullets:
        bullets = [BULLET_RE.sub("", x).strip() for x in lines if BULLET_RE.match(x) and len(BULLET_RE.sub("", x).strip()) >= 18]
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
        "line_count": len(lines),
        "text": "\n".join(lines)[:50000],
    }
