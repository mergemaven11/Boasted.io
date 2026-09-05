"""Build deterministic, explainable career intelligence from user-owned proof."""
from __future__ import annotations

import re
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Iterable, Iterator

QUANTIFIED_PATTERN = re.compile(
    r"(?:\$\s?\d|\b\d+(?:\.\d+)?\s?(?:%|x)(?!\w)|\b\d+(?:\.\d+)?\s?(?:hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?|users?|customers?|tickets?|incidents?|requests?|deployments?|projects?|people|members?)\b)",
    re.IGNORECASE,
)

# Delimiters that are commonly used to paste several skills into one tag. We do
# not split on "/" or "-" because those are meaningful inside skills such as
# CI/CD, TCP/IP, and problem-solving.
SKILL_SEPARATOR_PATTERN = re.compile(r"\s*(?:[·•|;,]|\r?\n)+\s*")
RECENT_WINDOW_DAYS = 180
PRIMARY_SKILL_LIMIT = 4
EMERGING_SKILL_LIMIT = 4


def _clean_text(value) -> str:
    """Return trimmed text without turning None into the literal string 'None'."""
    return str(value or "").strip()


def _split_skill_values(value) -> Iterator[str]:
    """Yield individual skills from one stored tag/skill value.

    Historical records may contain a single string such as
    ``"Linux · SSH · Networking"``. Treating that as one skill lets a newly
    added record dominate the ranking and makes the UI look like it analyzed
    only the latest accomplishment. Split only on unambiguous list separators.
    """
    text = _clean_text(value)
    if not text:
        return
    for part in SKILL_SEPARATOR_PATTERN.split(text):
        cleaned = part.strip(" \t-–—")
        if cleaned:
            yield cleaned


def _normalized_skills(values) -> Iterator[tuple[str, str]]:
    """Yield normalized (key, display) pairs from a string or iterable."""
    if values is None:
        return

    raw_values = [values] if isinstance(values, str) else values
    try:
        iterator = iter(raw_values)
    except TypeError:
        iterator = iter([raw_values])

    for raw_value in iterator:
        for display in _split_skill_values(raw_value):
            yield display.casefold(), display


def _as_datetime(value) -> datetime | None:
    """Normalize supported date-like values to UTC."""
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
    """Return the best available timestamp for a proof record."""
    return (
        _as_datetime(document.get("entry_date"))
        or _as_datetime(document.get("updated_at"))
        or _as_datetime(document.get("created_at"))
    )


def _has_quantified_text(*values) -> bool:
    """Return whether any supplied text contains a measurable result."""
    return any(QUANTIFIED_PATTERN.search(_clean_text(value)) for value in values)


def _confirmed_count(receipt: dict) -> int:
    """Count confirmed contribution/recognition records on one receipt."""
    return sum(
        1
        for confirmation in receipt.get("confirmations", []) or []
        if confirmation.get("status") == "confirmed"
    )


def _document_id(document: dict) -> str | None:
    """Return a stable string id for a proof record when one is available."""
    value = document.get("_id") or document.get("id")
    text = _clean_text(value)
    return text or None


def _skill_evidence_points(
    *,
    demonstrations: int,
    quantified_count: int,
    evidence_count: int,
    confirmed_count: int,
) -> int:
    """Score proof strength without letting freshness masquerade as proof quality.

    Recency is still exposed separately and used only as a late ranking
    tie-breaker. Repetition, measurable outcomes, evidence, and confirmation
    therefore remain the things that make a skill stronger.
    """
    points = min(demonstrations, 5) * 10
    points += min(quantified_count, 3) * 12
    points += min(evidence_count, 3) * 8
    points += min(confirmed_count, 2) * 10
    return min(points, 100)


def _profile_skill_sets(skills: list[dict]) -> tuple[list[dict], list[dict]]:
    """Choose a balanced set of repeated/core and emerging skills."""
    repeated = [skill for skill in skills if skill["demonstrations"] >= 2]
    primary = repeated[:PRIMARY_SKILL_LIMIT]

    if len(primary) < PRIMARY_SKILL_LIMIT:
        selected = {skill["skill"].casefold() for skill in primary}
        for skill in skills:
            if skill["skill"].casefold() in selected:
                continue
            primary.append(skill)
            selected.add(skill["skill"].casefold())
            if len(primary) >= PRIMARY_SKILL_LIMIT:
                break

    primary_keys = {skill["skill"].casefold() for skill in primary}
    emerging = [
        skill
        for skill in skills
        if skill["demonstrations"] == 1 and skill["skill"].casefold() not in primary_keys
    ][:EMERGING_SKILL_LIMIT]
    return primary, emerging


def _build_career_profile(
    skills: list[dict],
    *,
    total_proof_records: int,
    accomplishment_count: int,
    receipt_count: int,
) -> dict:
    """Build the combined profile shown above any one individual skill."""
    primary, emerging = _profile_skill_sets(skills)
    repeated_count = sum(1 for skill in skills if skill["demonstrations"] >= 2)
    strong_count = sum(1 for skill in skills if skill["signal"] == "strong")
    established_count = sum(1 for skill in skills if skill["signal"] == "established")

    if not primary:
        return {
            "headline": "Build your career signal",
            "primary_skills": [],
            "emerging_skills": [],
            "repeated_skill_count": 0,
            "established_skill_count": 0,
            "strong_skill_count": 0,
            "summary": (
                "Add specific skills to accomplishments and Impact Receipts so "
                "BragStack can connect your proof into a combined career profile."
            ),
        }

    primary_names = [skill["skill"] for skill in primary]
    emerging_names = [skill["skill"] for skill in emerging]
    headline = " · ".join(primary_names[:3])

    if repeated_count:
        repeated_names = [
            skill["skill"] for skill in skills if skill["demonstrations"] >= 2
        ][:3]
        summary = (
            f"Across {total_proof_records} proof record"
            f"{'' if total_proof_records == 1 else 's'}, your strongest repeated "
            f"signals include {', '.join(repeated_names)}. "
            f"The profile combines {accomplishment_count} accomplishment"
            f"{'' if accomplishment_count == 1 else 's'} and {receipt_count} "
            f"Impact Receipt{'' if receipt_count == 1 else 's'} instead of "
            "promoting whichever accomplishment was added most recently."
        )
    else:
        summary = (
            f"Across {total_proof_records} proof record"
            f"{'' if total_proof_records == 1 else 's'}, BragStack sees several "
            "emerging signals but not enough repeated demonstrations yet to call "
            "one a durable core strength. The profile therefore shows a balanced "
            "set rather than elevating the newest record."
        )

    return {
        "headline": headline,
        "primary_skills": primary_names,
        "emerging_skills": emerging_names,
        "repeated_skill_count": repeated_count,
        "established_skill_count": established_count,
        "strong_skill_count": strong_count,
        "summary": summary,
    }


def build_career_intelligence(
    entries: Iterable[dict],
    receipts: Iterable[dict],
    *,
    now: datetime | None = None,
) -> dict:
    """Build explainable career signals from user-owned proof records.

    Every accomplishment and every Impact Receipt is analyzed. For a
    skill-specific demonstration count, a receipt derived from an
    accomplishment enriches the same underlying demonstration rather than
    inflating that skill merely because a second document exists.
    """
    entries = list(entries)
    receipts = list(receipts)
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    total_proof_records = len(entries) + len(receipts)

    skill_state = defaultdict(
        lambda: {
            "display_names": defaultdict(int),
            "entry_count": 0,
            "receipt_count": 0,
            "proof_keys": set(),
            "quantified_keys": set(),
            "evidence_count": 0,
            "confirmed_count": 0,
            "latest_at": None,
        }
    )

    categories = defaultdict(int)
    evidence_items = 0
    confirmed_receipts = 0
    quantified_proof_keys: set[str] = set()

    entry_proof_keys: dict[str, str] = {}
    for index, entry in enumerate(entries):
        entry_id = _document_id(entry)
        proof_key = f"entry:{entry_id}" if entry_id else f"entry-index:{index}"
        if entry_id:
            entry_proof_keys[entry_id] = proof_key

        category = _clean_text(entry.get("category")) or "Uncategorized"
        categories[category] += 1
        is_quantified = _has_quantified_text(
            entry.get("impact"), entry.get("resume_bullet"), entry.get("action")
        )
        if is_quantified:
            quantified_proof_keys.add(proof_key)
        observed_at = _document_datetime(entry)
        seen_in_entry = set()
        for key, display in _normalized_skills(entry.get("tags", []) or []):
            if key in seen_in_entry:
                continue
            seen_in_entry.add(key)
            state = skill_state[key]
            state["display_names"][display] += 1
            state["entry_count"] += 1
            state["proof_keys"].add(proof_key)
            if is_quantified:
                state["quantified_keys"].add(proof_key)
            if observed_at and (
                state["latest_at"] is None or observed_at > state["latest_at"]
            ):
                state["latest_at"] = observed_at

    for index, receipt in enumerate(receipts):
        receipt_id = _document_id(receipt)
        source_entry_id = _clean_text(receipt.get("source_entry_id")) or None
        proof_key = entry_proof_keys.get(source_entry_id or "")
        if proof_key is None:
            proof_key = f"receipt:{receipt_id}" if receipt_id else f"receipt-index:{index}"

        evidence = receipt.get("evidence", []) or []
        evidence_items += len(evidence)
        confirmations = _confirmed_count(receipt)
        if confirmations:
            confirmed_receipts += 1
        has_metrics = bool(receipt.get("metrics")) or _has_quantified_text(
            receipt.get("result")
        )
        if has_metrics:
            quantified_proof_keys.add(proof_key)
        observed_at = _document_datetime(receipt)
        seen_in_receipt = set()
        for key, display in _normalized_skills(receipt.get("skills", []) or []):
            if key in seen_in_receipt:
                continue
            seen_in_receipt.add(key)
            state = skill_state[key]
            state["display_names"][display] += 1
            state["receipt_count"] += 1
            state["proof_keys"].add(proof_key)
            state["evidence_count"] += len(evidence)
            state["confirmed_count"] += confirmations
            if has_metrics:
                state["quantified_keys"].add(proof_key)
            if observed_at and (
                state["latest_at"] is None or observed_at > state["latest_at"]
            ):
                state["latest_at"] = observed_at

    skills = []
    for state in skill_state.values():
        display = max(
            state["display_names"].items(),
            key=lambda item: (item[1], len(item[0])),
        )[0]
        demonstrations = len(state["proof_keys"])
        quantified_count = len(state["quantified_keys"])
        latest_at = state["latest_at"]
        days_since = (now - latest_at).days if latest_at else None
        recent = days_since is not None and days_since <= RECENT_WINDOW_DAYS

        points = _skill_evidence_points(
            demonstrations=demonstrations,
            quantified_count=quantified_count,
            evidence_count=state["evidence_count"],
            confirmed_count=state["confirmed_count"],
        )

        if demonstrations >= 4 and (state["evidence_count"] or quantified_count >= 2):
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
                "quantified_examples": quantified_count,
                "evidence_items": state["evidence_count"],
                "confirmations": state["confirmed_count"],
                "recent": recent,
                "last_demonstrated_at": latest_at.isoformat() if latest_at else None,
            }
        )

    # Evidence strength comes first. Freshness only breaks otherwise-close ties;
    # it is not added to proof points and cannot make a new singleton look like a
    # stronger body of work by itself.
    skills.sort(
        key=lambda item: (
            item["evidence_points"],
            item["demonstrations"],
            item["quantified_examples"],
            item["confirmations"],
            bool(item["recent"]),
            item["last_demonstrated_at"] or "",
            item["skill"].casefold(),
        ),
        reverse=True,
    )

    gaps = []
    if entries and len(receipts) < max(1, len(entries) // 3):
        gaps.append(
            {
                "type": "receipt_coverage",
                "title": "Turn more wins into Impact Receipts",
                "detail": "Your accomplishment history is stronger than your structured proof coverage.",
                "action": "Create Impact Receipts for your highest-impact accomplishments.",
            }
        )
    if entries and not quantified_proof_keys:
        gaps.append(
            {
                "type": "quantified_impact",
                "title": "Add measurable outcomes",
                "detail": "No quantified results are visible in your current career proof.",
                "action": "Add a number, percentage, time saved, volume, cost, or other measurable result where accurate.",
            }
        )
    if receipts and evidence_items == 0:
        gaps.append(
            {
                "type": "supporting_evidence",
                "title": "Strengthen supporting evidence",
                "detail": "Your Impact Receipts do not currently reference supporting evidence.",
                "action": "Attach safe evidence metadata such as reports, feedback, links, or artifacts.",
            }
        )
    if receipts and confirmed_receipts == 0:
        gaps.append(
            {
                "type": "recognition",
                "title": "Capture independent recognition",
                "detail": "None of your Impact Receipts currently include a confirmed contribution.",
                "action": "Where appropriate, request or record collaborator, stakeholder, or organization confirmation.",
            }
        )
    if not skills and entries:
        gaps.append(
            {
                "type": "skills",
                "title": "Tag demonstrated skills",
                "detail": "Your accomplishments do not yet expose reusable skill signals.",
                "action": "Add specific skills to accomplishments so BragStack can connect work to capabilities.",
            }
        )

    profile = _build_career_profile(
        skills,
        total_proof_records=total_proof_records,
        accomplishment_count=len(entries),
        receipt_count=len(receipts),
    )

    recommendations = [gap["action"] for gap in gaps[:3]]
    repeated_skills = [skill for skill in skills if skill["demonstrations"] >= 2]
    if repeated_skills:
        names = ", ".join(skill["skill"] for skill in repeated_skills[:3])
        recommendations.insert(
            0,
            f"Lead with your repeated signals: {names}. They are supported by more than one distinct demonstration rather than recency alone.",
        )
    elif skills:
        names = ", ".join(skill["skill"] for skill in skills[:3])
        recommendations.insert(
            0,
            f"Build repetition around {names}; these are promising signals, but each needs another distinct demonstration before BragStack treats it as established.",
        )
    if not recommendations:
        recommendations.append(
            "Keep capturing new accomplishments so your career signals stay current."
        )

    top_categories = sorted(categories.items(), key=lambda item: (-item[1], item[0]))[:5]
    return {
        "summary": {
            "accomplishments": len(entries),
            "impact_receipts": len(receipts),
            "total_proof_records": total_proof_records,
            "unique_skills": len(skills),
            "quantified_results": len(quantified_proof_keys),
            "evidence_items": evidence_items,
            "confirmed_receipts": confirmed_receipts,
        },
        "career_profile": profile,
        "top_skills": skills[:8],
        "skills": skills,
        "top_categories": [
            {"category": category, "count": count} for category, count in top_categories
        ],
        "gaps": gaps,
        "recommended_actions": recommendations[:4],
        "methodology": {
            "version": "career-intelligence-v2",
            "employment_decision": False,
            "description": (
                "Signals summarize user-owned proof. Repetition, measurable outcomes, "
                "evidence, and confirmation determine proof strength; recency is only "
                "a tie-breaker. BragStack does not predict hiring or promotion outcomes."
            ),
        },
    }
