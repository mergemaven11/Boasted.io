from __future__ import annotations

import re
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Iterable

QUANTIFIED_PATTERN = re.compile(
    r"(?:\$\s?\d|\b\d+(?:\.\d+)?\s?(?:%|x|hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?|users?|customers?|tickets?|incidents?|requests?|deployments?|projects?|people|members?)\b)",
    re.IGNORECASE,
)


def _clean_text(value) -> str:
    return str(value or "").strip()


def _normalized_skill(value) -> tuple[str, str] | None:
    display = _clean_text(value)
    if not display:
        return None
    return display.casefold(), display


def _as_datetime(value) -> datetime | None:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        try:
            parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            try:
                parsed = datetime.strptime(text, "%Y-%m-%d")
            except ValueError:
                return None
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    return None


def _document_datetime(document: dict) -> datetime | None:
    return (
        _as_datetime(document.get("entry_date"))
        or _as_datetime(document.get("updated_at"))
        or _as_datetime(document.get("created_at"))
    )


def _has_quantified_text(*values) -> bool:
    return any(QUANTIFIED_PATTERN.search(_clean_text(value)) for value in values)


def _confirmed_count(receipt: dict) -> int:
    return sum(
        1
        for confirmation in receipt.get("confirmations", []) or []
        if confirmation.get("status") == "confirmed"
    )


def build_career_intelligence(
    entries: Iterable[dict],
    receipts: Iterable[dict],
    *,
    now: datetime | None = None,
) -> dict:
    """Build explainable career signals from user-owned proof records."""
    entries = list(entries)
    receipts = list(receipts)
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)

    skill_state = defaultdict(
        lambda: {
            "display_names": defaultdict(int),
            "entry_count": 0,
            "receipt_count": 0,
            "quantified_count": 0,
            "evidence_count": 0,
            "confirmed_count": 0,
            "latest_at": None,
        }
    )

    quantified_entries = 0
    categories = defaultdict(int)
    evidence_items = 0
    confirmed_receipts = 0

    for entry in entries:
        category = _clean_text(entry.get("category")) or "Uncategorized"
        categories[category] += 1
        is_quantified = _has_quantified_text(
            entry.get("impact"), entry.get("resume_bullet"), entry.get("action")
        )
        if is_quantified:
            quantified_entries += 1
        observed_at = _document_datetime(entry)
        seen_in_entry = set()
        for raw_skill in entry.get("tags", []) or []:
            normalized = _normalized_skill(raw_skill)
            if not normalized:
                continue
            key, display = normalized
            if key in seen_in_entry:
                continue
            seen_in_entry.add(key)
            state = skill_state[key]
            state["display_names"][display] += 1
            state["entry_count"] += 1
            if is_quantified:
                state["quantified_count"] += 1
            if observed_at and (state["latest_at"] is None or observed_at > state["latest_at"]):
                state["latest_at"] = observed_at

    quantified_receipts = 0
    for receipt in receipts:
        evidence = receipt.get("evidence", []) or []
        evidence_items += len(evidence)
        confirmations = _confirmed_count(receipt)
        if confirmations:
            confirmed_receipts += 1
        has_metrics = bool(receipt.get("metrics")) or _has_quantified_text(receipt.get("result"))
        if has_metrics:
            quantified_receipts += 1
        observed_at = _document_datetime(receipt)
        seen_in_receipt = set()
        for raw_skill in receipt.get("skills", []) or []:
            normalized = _normalized_skill(raw_skill)
            if not normalized:
                continue
            key, display = normalized
            if key in seen_in_receipt:
                continue
            seen_in_receipt.add(key)
            state = skill_state[key]
            state["display_names"][display] += 1
            state["receipt_count"] += 1
            state["evidence_count"] += len(evidence)
            state["confirmed_count"] += confirmations
            if has_metrics:
                state["quantified_count"] += 1
            if observed_at and (state["latest_at"] is None or observed_at > state["latest_at"]):
                state["latest_at"] = observed_at

    skills = []
    for state in skill_state.values():
        display = max(
            state["display_names"].items(),
            key=lambda item: (item[1], len(item[0])),
        )[0]
        demonstrations = state["entry_count"] + state["receipt_count"]
        latest_at = state["latest_at"]
        days_since = (now - latest_at).days if latest_at else None
        recent = days_since is not None and days_since <= 180

        points = min(demonstrations, 5) * 8
        points += min(state["quantified_count"], 3) * 10
        points += min(state["evidence_count"], 3) * 8
        points += min(state["confirmed_count"], 2) * 6
        points += 8 if recent else 0
        points = min(points, 100)

        if demonstrations >= 4 and (state["evidence_count"] or state["quantified_count"] >= 2):
            label = "strong"
        elif demonstrations >= 2:
            label = "established"
        else:
            label = "emerging"

        skills.append(
            {
                "skill": display,
                "signal": label,
                "evidence_points": points,
                "demonstrations": demonstrations,
                "accomplishments": state["entry_count"],
                "impact_receipts": state["receipt_count"],
                "quantified_examples": state["quantified_count"],
                "evidence_items": state["evidence_count"],
                "confirmations": state["confirmed_count"],
                "recent": recent,
                "last_demonstrated_at": latest_at.isoformat() if latest_at else None,
            }
        )

    skills.sort(
        key=lambda item: (
            item["evidence_points"],
            item["demonstrations"],
            item["quantified_examples"],
            item["skill"].casefold(),
        ),
        reverse=True,
    )

    gaps = []
    if entries and len(receipts) < max(1, len(entries) // 3):
        gaps.append({
            "type": "receipt_coverage",
            "title": "Turn more wins into Impact Receipts",
            "detail": "Your accomplishment history is stronger than your structured proof coverage.",
            "action": "Create Impact Receipts for your highest-impact accomplishments.",
        })
    if entries and quantified_entries + quantified_receipts == 0:
        gaps.append({
            "type": "quantified_impact",
            "title": "Add measurable outcomes",
            "detail": "No quantified results are visible in your current career proof.",
            "action": "Add a number, percentage, time saved, volume, cost, or other measurable result where accurate.",
        })
    if receipts and evidence_items == 0:
        gaps.append({
            "type": "supporting_evidence",
            "title": "Strengthen supporting evidence",
            "detail": "Your Impact Receipts do not currently reference supporting evidence.",
            "action": "Attach safe evidence metadata such as reports, feedback, links, or artifacts.",
        })
    if receipts and confirmed_receipts == 0:
        gaps.append({
            "type": "recognition",
            "title": "Capture independent recognition",
            "detail": "None of your Impact Receipts currently include a confirmed contribution.",
            "action": "Where appropriate, request or record collaborator, stakeholder, or organization confirmation.",
        })
    if not skills and entries:
        gaps.append({
            "type": "skills",
            "title": "Tag demonstrated skills",
            "detail": "Your accomplishments do not yet expose reusable skill signals.",
            "action": "Add specific skills to accomplishments so BragStack can connect work to capabilities.",
        })

    recommendations = [gap["action"] for gap in gaps[:3]]
    if skills:
        top = skills[0]
        recommendations.insert(
            0,
            f"Use {top['skill']} as a lead career signal; it is supported by {top['demonstrations']} proof record{'s' if top['demonstrations'] != 1 else ''}.",
        )
    if not recommendations:
        recommendations.append("Keep capturing new accomplishments so your career signals stay current.")

    top_categories = sorted(categories.items(), key=lambda item: (-item[1], item[0]))[:5]
    return {
        "summary": {
            "accomplishments": len(entries),
            "impact_receipts": len(receipts),
            "unique_skills": len(skills),
            "quantified_results": quantified_entries + quantified_receipts,
            "evidence_items": evidence_items,
            "confirmed_receipts": confirmed_receipts,
        },
        "top_skills": skills[:8],
        "skills": skills,
        "top_categories": [
            {"category": category, "count": count} for category, count in top_categories
        ],
        "gaps": gaps,
        "recommended_actions": recommendations[:4],
        "methodology": {
            "version": "career-intelligence-v1",
            "employment_decision": False,
            "description": "Signals summarize user-owned proof. BragStack does not predict hiring or promotion outcomes.",
        },
    }
