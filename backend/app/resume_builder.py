from __future__ import annotations

import re
from collections import Counter
from typing import Iterable

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have",
    "in", "is", "it", "of", "on", "or", "our", "that", "the", "their", "this", "to",
    "with", "you", "your", "will", "we", "using", "use", "work", "role", "team",
    "experience", "years", "required", "preferred", "skills", "responsibilities", "including",
    "ability", "strong", "knowledge",
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
    tokens = [token for token in _tokens(job_description) if len(token) >= 3 and token not in STOPWORDS]
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


def build_summary(target_role: str, matched_receipts: list[dict]) -> str:
    skills = []
    for item in matched_receipts:
        for skill in item["receipt"].get("skills", []):
            if skill and skill.lower() not in {s.lower() for s in skills}:
                skills.append(skill)
    evidence_count = len(matched_receipts)
    skill_phrase = ", ".join(skills[:5])
    if skill_phrase:
        return f"Evidence-backed {target_role} candidate with documented impact across {skill_phrase}. Brings {evidence_count} relevant accomplishment{'s' if evidence_count != 1 else ''} with traceable career proof."
    return f"Evidence-backed {target_role} candidate with {evidence_count} relevant documented accomplishment{'s' if evidence_count != 1 else ''} and a focus on measurable, verifiable impact."


def analyze_resume(*, target_role: str, job_description: str, receipts: list[dict]) -> dict:
    terms = extract_terms(job_description)
    scored = []
    for receipt in receipts:
        score, matches = score_receipt(receipt, terms)
        if score > 0:
            scored.append({"receipt": receipt, "score": score, "matches": matches})
    scored.sort(key=lambda item: (-item["score"], str(item["receipt"].get("accomplishment", ""))))
    supported_terms = [term for term in terms if any(term in item["matches"] for item in scored)]
    unsupported_terms = [term for term in terms if term not in supported_terms]
    selected = scored[:10]
    bullets = [{
        "text": build_resume_bullet(item["receipt"]),
        "source_receipt_id": str(item["receipt"].get("_id", item["receipt"].get("id", ""))),
        "source_title": item["receipt"].get("accomplishment", "Impact Receipt"),
        "matched_terms": item["matches"],
        "evidence_count": len(item["receipt"].get("evidence", [])),
        "has_metrics": bool(item["receipt"].get("metrics")),
        "edited": False,
    } for item in selected]
    coverage = round((len(supported_terms) / len(terms)) * 100) if terms else 0
    quantified = sum(1 for item in selected if item["receipt"].get("metrics"))
    evidence_backed = sum(1 for item in selected if item["receipt"].get("evidence"))
    readiness = {
        "format_readiness": "Strong",
        "requirement_coverage": "Strong" if coverage >= 65 else "Moderate" if coverage >= 35 else "Needs work",
        "evidence_strength": "Strong" if evidence_backed >= max(1, len(selected) // 2) else "Moderate",
        "quantified_impact": "Strong" if quantified >= 3 else "Moderate" if quantified else "Needs work",
        "source_linked_draft": True,
        "coverage_percent": coverage,
    }
    return {
        "target_role": target_role.strip(),
        "requirements": terms,
        "supported_requirements": supported_terms,
        "unsupported_requirements": unsupported_terms,
        "summary": build_summary(target_role.strip(), selected),
        "bullets": bullets,
        "skills": list(dict.fromkeys(skill for item in selected for skill in item["receipt"].get("skills", []) if skill))[:18],
        "readiness": readiness,
        "ats_preview_sections": list(SECTION_HEADINGS),
        "ats_note": "ATS-friendly preview only; BragStack does not simulate every employer ATS parser.",
    }
