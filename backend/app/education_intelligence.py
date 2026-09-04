"""Deterministic application intelligence for student and early-career evidence.

This module ranks a user's own BragStack accomplishments for application use.
It never predicts admission, scholarship, hiring, or selection outcomes.
"""
from __future__ import annotations

import re
from collections import defaultdict
from typing import Iterable

EDUCATION_ENTRY_TYPES = {
    "Middle School",
    "High School",
    "College / University",
    "Learning / Certification",
}

QUANTIFIED_PATTERN = re.compile(
    r"(?:\$\s?\d|\b\d+(?:\.\d+)?\s?(?:%|x)(?!\w)|\b\d+(?:\.\d+)?\s?(?:hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?|people|students?|members?|participants?|attendees?|volunteers?|projects?|awards?|events?|dollars?)\b)",
    re.IGNORECASE,
)

APPLICATION_PROFILES = {
    "scholarship": {
        "title": "Scholarship",
        "description": "Surface evidence of contribution, leadership, academics, service, initiative, and sustained effort for scholarship applications.",
        "dimensions": {
            "leadership": ["lead", "leader", "captain", "president", "officer", "mentor", "organized", "founded", "coordinated"],
            "service": ["service", "volunteer", "community", "nonprofit", "fundraiser", "donation", "helped", "served"],
            "academics": ["academic", "honor", "award", "gpa", "research", "study", "course", "competition", "olympiad", "dean"],
            "initiative": ["created", "started", "launched", "built", "founded", "proposed", "designed", "organized"],
            "persistence": ["challenge", "overcame", "improved", "growth", "persist", "continued", "years", "season"],
        },
        "preferred_categories": ["Award / Honor", "Leadership", "Community Service", "Academic Achievement", "Research", "STEM / Competition"],
    },
    "special-program": {
        "title": "Special Program",
        "description": "Find experiences that show subject interest, initiative, depth, collaboration, growth, and readiness for selective programs.",
        "dimensions": {
            "subject_depth": ["research", "project", "course", "lab", "experiment", "portfolio", "competition", "study", "certification"],
            "curiosity": ["learned", "explored", "investigated", "researched", "question", "discovered", "curious"],
            "initiative": ["created", "started", "built", "designed", "organized", "proposed", "launched"],
            "collaboration": ["team", "collaborated", "partnered", "group", "mentor", "peer", "coordinated"],
            "growth": ["learned", "improved", "developed", "growth", "progress", "advanced", "practice"],
        },
        "preferred_categories": ["Research", "Academic Achievement", "STEM / Competition", "Arts / Performance", "Special Program", "Certification / Course"],
    },
    "internship": {
        "title": "Internship",
        "description": "Prioritize demonstrated skills, responsibility, teamwork, initiative, and results for internship applications and resumes.",
        "dimensions": {
            "skills": ["built", "coded", "designed", "wrote", "analyzed", "presented", "research", "technical", "skill", "certification"],
            "responsibility": ["responsible", "managed", "owned", "coordinated", "maintained", "delivered", "completed"],
            "results": ["result", "impact", "improved", "increased", "reduced", "won", "placed", "completed", "served"],
            "teamwork": ["team", "collaborated", "partnered", "group", "peer", "mentor", "customer"],
            "initiative": ["created", "started", "built", "designed", "organized", "proposed", "launched"],
        },
        "preferred_categories": ["Internship / Work Experience", "Research", "STEM / Competition", "Leadership", "Certification / Course", "Academic Achievement"],
    },
    "essay-prep": {
        "title": "Essay Prep",
        "description": "Surface real stories with reflection, growth, values, curiosity, challenge, and contribution so the student can choose what to write about.",
        "dimensions": {
            "identity_values": ["identity", "family", "culture", "community", "values", "meaningful", "belong", "background"],
            "challenge": ["challenge", "setback", "failure", "difficult", "obstacle", "problem", "struggle"],
            "growth": ["learned", "growth", "changed", "realized", "improved", "developed", "lesson"],
            "curiosity": ["curious", "research", "explored", "question", "discovered", "learned", "interest"],
            "initiative_contribution": ["created", "started", "helped", "served", "built", "organized", "led", "contributed"],
        },
        "preferred_categories": ["Leadership", "Community Service", "Research", "Academic Achievement", "Extracurricular Activity", "Arts / Performance", "Athletics"],
    },
}

COMMON_APP_REFERENCE = {
    "season": "2026-2027",
    "reference_only": True,
    "activity_fields": ["years_participated", "hours_per_week", "weeks_per_year", "position_or_leadership", "description"],
    "honors_tracked_separately": True,
    "essay_theme_keys": ["identity", "challenge", "belief", "gratitude", "growth", "curiosity", "open_topic"],
}


def _text(value) -> str:
    return str(value or "").strip()


def _entry_id(entry: dict) -> str:
    return _text(entry.get("_id") or entry.get("id"))


def _searchable_text(entry: dict) -> str:
    values = [
        entry.get("title"),
        entry.get("category"),
        entry.get("entry_type"),
        entry.get("situation"),
        entry.get("action"),
        entry.get("impact"),
        entry.get("lesson"),
        entry.get("resume_bullet"),
        *(entry.get("tags") or []),
    ]
    return " ".join(_text(value) for value in values if _text(value)).casefold()


def _receipt_state(receipts: Iterable[dict]) -> dict[str, dict]:
    state: dict[str, dict] = defaultdict(lambda: {"evidence_items": 0, "confirmations": 0, "has_metrics": False})
    for receipt in receipts:
        source_id = _text(receipt.get("source_entry_id"))
        if not source_id:
            continue
        item = state[source_id]
        item["evidence_items"] += len(receipt.get("evidence") or [])
        item["confirmations"] += sum(1 for confirmation in receipt.get("confirmations") or [] if confirmation.get("status") == "confirmed")
        item["has_metrics"] = bool(item["has_metrics"] or receipt.get("metrics"))
    return state


def _dimension_matches(text: str, terms: list[str]) -> list[str]:
    return [term for term in terms if term.casefold() in text]


def build_application_intelligence(entries: Iterable[dict], receipts: Iterable[dict], application_type: str) -> dict:
    """Rank user-owned evidence for one application workflow."""
    if application_type not in APPLICATION_PROFILES:
        raise ValueError(f"Unsupported application type: {application_type}")

    entries = list(entries)
    receipts = list(receipts)
    profile = APPLICATION_PROFILES[application_type]
    receipt_state = _receipt_state(receipts)
    dimension_coverage: dict[str, int] = defaultdict(int)
    ranked = []

    for entry in entries:
        text = _searchable_text(entry)
        entry_id = _entry_id(entry)
        category = _text(entry.get("category"))
        entry_type = _text(entry.get("entry_type"))
        linked = receipt_state.get(entry_id, {"evidence_items": 0, "confirmations": 0, "has_metrics": False})
        matched_dimensions = []
        fit_reasons = []
        points = 0

        for dimension, terms in profile["dimensions"].items():
            matches = _dimension_matches(text, terms)
            if matches:
                matched_dimensions.append(dimension)
                dimension_coverage[dimension] += 1
                points += 14 + min(len(matches) - 1, 2) * 3

        if category in profile["preferred_categories"]:
            points += 12
            fit_reasons.append(f"Category aligns with {profile['title'].lower()} evidence")
        if entry_type in EDUCATION_ENTRY_TYPES:
            points += 8
            fit_reasons.append("Captured in an education context")
        if QUANTIFIED_PATTERN.search(text) or linked.get("has_metrics"):
            points += 9
            fit_reasons.append("Includes a measurable result or time commitment")
        if _text(entry.get("lesson")):
            points += 5
            if application_type == "essay-prep":
                fit_reasons.append("Includes reflection or learning")
        if linked.get("evidence_items"):
            points += min(int(linked["evidence_items"]), 3) * 3
            fit_reasons.append("Has supporting evidence")
        if linked.get("confirmations"):
            points += min(int(linked["confirmations"]), 2) * 4
            fit_reasons.append("Has third-party confirmation")

        if matched_dimensions:
            readable = ", ".join(dimension.replace("_", " ") for dimension in matched_dimensions[:3])
            fit_reasons.insert(0, f"Shows {readable}")

        if points >= 48:
            fit_strength = "strong"
        elif points >= 26:
            fit_strength = "relevant"
        else:
            fit_strength = "emerging"

        ranked.append({
            "entry_id": entry_id,
            "title": _text(entry.get("title")) or "Untitled accomplishment",
            "category": category or "Uncategorized",
            "entry_type": entry_type or "Other",
            "fit_strength": fit_strength,
            "matched_dimensions": matched_dimensions,
            "fit_reasons": fit_reasons[:4] or ["Saved accomplishment available for review"],
            "has_evidence": bool(linked.get("evidence_items")),
            "has_confirmation": bool(linked.get("confirmations")),
            "has_measurable_detail": bool(QUANTIFIED_PATTERN.search(text) or linked.get("has_metrics")),
            "_points": points,
        })

    ranked.sort(key=lambda item: (item["_points"], len(item["matched_dimensions"]), item["title"].casefold()), reverse=True)
    for item in ranked:
        item.pop("_points", None)

    gaps = []
    for dimension in profile["dimensions"]:
        if dimension_coverage.get(dimension, 0):
            continue
        label = dimension.replace("_", " ").title()
        gaps.append({
            "dimension": dimension,
            "label": label,
            "detail": f"Your saved record does not yet clearly show {label.lower()} for this application workflow.",
            "action": f"Capture or strengthen one real accomplishment that demonstrates {label.lower()}.",
        })

    student_entries = sum(1 for entry in entries if _text(entry.get("entry_type")) in EDUCATION_ENTRY_TYPES)
    if entries and student_entries == 0:
        gaps.insert(0, {
            "dimension": "education_context",
            "label": "Education context",
            "detail": "Your record has accomplishments, but none are currently labeled as school, university, or learning experiences.",
            "action": "Add school or learning accomplishments you genuinely want available for future applications.",
        })

    return {
        "application_type": application_type,
        "profile": {
            "title": profile["title"],
            "description": profile["description"],
            "dimensions": [key for key in profile["dimensions"]],
        },
        "summary": {
            "accomplishments_analyzed": len(entries),
            "education_accomplishments": student_entries,
            "impact_receipts_analyzed": len(receipts),
            "recommended_evidence_count": min(len(ranked), 8),
        },
        "recommended_evidence": ranked[:8],
        "gaps": gaps[:5],
        "reference": COMMON_APP_REFERENCE if application_type in {"scholarship", "essay-prep", "special-program"} else None,
        "methodology": {
            "version": "education-intelligence-v1",
            "deterministic": True,
            "acceptance_prediction": False,
            "scholarship_prediction": False,
            "employment_decision": False,
            "description": "Ranks the user's own saved evidence for relevance to an application workflow. It does not predict selection outcomes and does not invent accomplishments.",
        },
    }
