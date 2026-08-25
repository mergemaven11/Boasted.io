from __future__ import annotations

import re
from collections import Counter
from typing import Iterable

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
    "in", "is", "it", "of", "on", "or", "our", "that", "the", "their", "this", "to",
    "with", "you", "your", "will", "we", "using", "use", "work", "role", "team", "teams",
    "experience", "years", "required", "preferred", "skills", "responsibilities", "including",
    "ability", "strong", "knowledge", "through", "across", "support", "supports", "supporting",
    "customer", "customers", "company", "business", "position", "candidate", "candidates", "job",
    "information", "process", "hiring", "time", "based", "may", "also", "such", "other", "within",
}

LEGAL_BOILERPLATE = {
    "legitimate", "interest", "pre-contractual", "applicable", "protection", "gdpr", "rights",
    "access", "rectification", "erasure", "objection", "law", "laws", "privacy", "consent",
    "personal", "processing", "controller", "processor", "retention", "contractual", "compliance",
}

ALIASES = {
    "k8s": "kubernetes",
    "postgres": "postgresql",
    "js": "javascript",
    "ts": "typescript",
    "ci/cd": "continuous integration continuous delivery",
    "sre": "site reliability engineering",
    "ml": "machine learning",
    "ai": "artificial intelligence",
}

SECTION_HEADINGS = ("summary", "experience", "skills", "education", "projects")
SECTION_NAMES = {
    "summary": {"summary", "professional summary", "profile", "professional profile", "career summary"},
    "experience": {"experience", "work experience", "professional experience", "employment", "employment history"},
    "skills": {"skills", "technical skills", "core skills", "competencies", "core competencies"},
    "education": {"education", "education & training", "training"},
    "projects": {"projects", "selected projects", "project experience"},
}


def normalize_text(value: str) -> str:
    text = (value or "").lower()
    for alias, expanded in ALIASES.items():
        pattern = rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])"
        text = re.sub(pattern, f" {expanded} ", text)
    return re.sub(r"[^a-z0-9+#./-]+", " ", text)


def _tokens(value: str) -> list[str]:
    normalized = normalize_text(value)
    return [token.strip("./-") for token in normalized.split() if token.strip("./-")]


def extract_terms(job_description: str, limit: int = 24) -> list[str]:
    tokens = [
        token for token in _tokens(job_description)
        if len(token) >= 3 and token not in STOPWORDS and token not in LEGAL_BOILERPLATE
    ]
    counts = Counter(tokens)
    first_position = {token: tokens.index(token) for token in counts}
    ranked = sorted(counts, key=lambda token: (-counts[token], first_position[token], token))
    return ranked[:limit]


def receipt_text(receipt: dict) -> str:
    metric_text = " ".join(
        f"{metric.get('label', '')} {metric.get('value', '')} {metric.get('context', '')}"
        for metric in receipt.get("metrics", [])
    )
    return " ".join([
        str(receipt.get("accomplishment", "")),
        str(receipt.get("contribution", "")),
        str(receipt.get("result", "")),
        " ".join(receipt.get("skills", [])),
        metric_text,
    ])


def _term_matches(term: str, text: str) -> bool:
    return term in set(_tokens(text))


def score_receipt(receipt: dict, terms: Iterable[str]) -> tuple[int, list[str]]:
    text = receipt_text(receipt)
    matches = [term for term in terms if _term_matches(term, text)]
    score = len(matches) * 4
    if receipt.get("result"): score += 2
    if receipt.get("metrics"): score += 3
    if receipt.get("evidence"): score += 2
    if any(signal != "self-documented" for signal in receipt.get("trust_signals", [])): score += 2
    return score, matches


def build_resume_bullet(receipt: dict) -> str:
    accomplishment = str(receipt.get("accomplishment", "")).strip().rstrip(".")
    contribution = str(receipt.get("contribution", "")).strip().rstrip(".")
    result = str(receipt.get("result", "")).strip().rstrip(".")
    metric_bits = []
    for metric in receipt.get("metrics", []):
        label = str(metric.get("label", "")).strip()
        value = str(metric.get("value", "")).strip()
        if label and value:
            metric_bits.append(f"{label}: {value}")
    parts = [part for part in (accomplishment, contribution, result) if part]
    bullet = "; ".join(parts)
    if metric_bits:
        bullet += f" ({'; '.join(metric_bits[:2])})"
    return bullet[:420]


def _clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", line or "").strip()


def _heading_key(line: str) -> str | None:
    normalized = re.sub(r"[^a-z& ]+", "", line.lower()).strip()
    for key, names in SECTION_NAMES.items():
        if normalized in names:
            return key
    return None


def parse_existing_resume_text(raw_text: str) -> dict:
    lines = [_clean_line(line) for line in (raw_text or "").splitlines()]
    lines = [line for line in lines if line]
    sections: dict[str, list[str]] = {key: [] for key in SECTION_HEADINGS}
    current: str | None = None
    unsectioned: list[str] = []
    for line in lines:
        heading = _heading_key(line)
        if heading:
            current = heading
            continue
        if current:
            sections[current].append(line)
        else:
            unsectioned.append(line)

    bullet_pattern = re.compile(r"^[\u2022\-*▪◦]\s*")
    experience_lines = sections["experience"] or []
    bullets = []
    for line in experience_lines:
        text = bullet_pattern.sub("", line).strip()
        if len(text) >= 18 and (bullet_pattern.match(line) or len(text.split()) >= 5):
            bullets.append(text[:500])

    if not bullets:
        for line in lines:
            if bullet_pattern.match(line):
                text = bullet_pattern.sub("", line).strip()
                if len(text) >= 18:
                    bullets.append(text[:500])

    summary = " ".join(sections["summary"][:3]).strip()[:1200]
    skills = []
    for line in sections["skills"]:
        for skill in re.split(r"[,|•·;/]", line):
            skill = _clean_line(skill)
            if 1 < len(skill) <= 80 and skill.lower() not in {item.lower() for item in skills}:
                skills.append(skill)

    preview_sections = {key: values[:80] for key, values in sections.items() if values}
    return {
        "summary": summary,
        "bullets": bullets[:20],
        "skills": skills[:40],
        "sections_found": [key for key, values in sections.items() if values],
        "sections": preview_sections,
        "header_lines": unsectioned[:12],
        "line_count": len(lines),
        "text": "\n".join(lines)[:50000],
    }


def build_summary(target_role: str, matched_receipts: list[dict], imported_summary: str = "") -> str:
    if imported_summary.strip():
        return imported_summary.strip()[:1200]
    skills = []
    for item in matched_receipts:
        for skill in item["receipt"].get("skills", []):
            if skill and skill.lower() not in {s.lower() for s in skills}:
                skills.append(skill)
    skill_phrase = ", ".join(skills[:5])
    if skill_phrase:
        return f"{target_role} with evidence-backed impact across {skill_phrase}, focused on measurable results and clear ownership."
    return f"{target_role} focused on measurable results, clear ownership, and evidence-backed impact."


def analyze_resume(*, target_role: str, job_description: str, receipts: list[dict], existing_resume_text: str = "") -> dict:
    terms = extract_terms(job_description)
    imported = parse_existing_resume_text(existing_resume_text) if existing_resume_text.strip() else {
        "summary": "", "bullets": [], "skills": [], "sections_found": [], "sections": {}, "header_lines": [], "line_count": 0, "text": ""
    }
    imported_text = imported.get("text", "")

    scored = []
    for receipt in receipts:
        score, matches = score_receipt(receipt, terms)
        if score > 0:
            scored.append({"receipt": receipt, "score": score, "matches": matches})
    scored.sort(key=lambda item: (-item["score"], str(item["receipt"].get("accomplishment", ""))))

    supported_by_import = [term for term in terms if imported_text and _term_matches(term, imported_text)]
    supported_by_receipts = [term for term in terms if any(term in item["matches"] for item in scored)]
    supported_terms = list(dict.fromkeys([*supported_by_import, *supported_by_receipts]))
    unsupported_terms = [term for term in terms if term not in supported_terms]

    imported_bullets = [{
        "text": text,
        "source_receipt_id": "",
        "source_title": "Imported resume",
        "source_kind": "imported",
        "matched_terms": [term for term in terms if _term_matches(term, text)],
        "evidence_count": 0,
        "has_metrics": bool(re.search(r"\b\d+(?:\.\d+)?%?\b", text)),
        "edited": False,
    } for text in imported.get("bullets", [])]

    selected = scored[:10]
    generated_bullets = [{
        "text": build_resume_bullet(item["receipt"]),
        "source_receipt_id": str(item["receipt"].get("_id", item["receipt"].get("id", ""))),
        "source_title": item["receipt"].get("accomplishment", "Impact Receipt"),
        "source_kind": "impact-receipt",
        "matched_terms": item["matches"],
        "evidence_count": len(item["receipt"].get("evidence", [])),
        "has_metrics": bool(item["receipt"].get("metrics")),
        "edited": False,
    } for item in selected]

    bullets = [*imported_bullets, *generated_bullets][:20]
    coverage = round((len(supported_terms) / len(terms)) * 100) if terms else 0
    quantified = sum(1 for bullet in bullets if bullet.get("has_metrics"))
    evidence_backed = sum(1 for bullet in generated_bullets if bullet.get("evidence_count", 0) > 0)
    receipt_count = len(generated_bullets)
    readiness = {
        "format_readiness": "Strong",
        "requirement_coverage": "Strong" if coverage >= 65 else "Moderate" if coverage >= 35 else "Needs work",
        "evidence_strength": "Strong" if evidence_backed >= max(1, receipt_count // 2) else "Moderate",
        "quantified_impact": "Strong" if quantified >= 3 else "Moderate" if quantified else "Needs work",
        "source_linked_draft": all(bullet.get("source_kind") == "impact-receipt" for bullet in bullets) if bullets else True,
        "coverage_percent": coverage,
    }

    skills = list(imported.get("skills", []))
    for item in selected:
        for skill in item["receipt"].get("skills", []):
            if skill and skill.lower() not in {existing.lower() for existing in skills}:
                skills.append(skill)

    return {
        "target_role": target_role.strip(),
        "requirements": terms,
        "supported_requirements": supported_terms,
        "unsupported_requirements": unsupported_terms,
        "summary": build_summary(target_role.strip(), selected, imported.get("summary", "")),
        "bullets": bullets,
        "skills": skills[:18],
        "imported_resume": {
            "used": bool(existing_resume_text.strip()),
            "sections_found": imported.get("sections_found", []),
            "sections": imported.get("sections", {}),
            "header_lines": imported.get("header_lines", []),
            "imported_bullet_count": len(imported_bullets),
        },
        "readiness": readiness,
        "ats_preview_sections": list(SECTION_HEADINGS),
        "ats_note": "ATS-friendly preview only; BragStack does not simulate every employer ATS parser.",
    }
