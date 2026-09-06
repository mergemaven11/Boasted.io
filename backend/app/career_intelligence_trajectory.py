"""Temporal trajectory enrichment for deterministic Career Intelligence."""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Iterable

from app.career_intelligence import (
    RECENT_WINDOW_DAYS,
    _clean_text,
    _document_datetime,
    _document_id,
    _normalized_skills,
)

TRAJECTORY_LABELS = {
    "current-core",
    "active",
    "historical-core",
    "recent-emerging",
    "historical",
    "undated",
}


def _proof_key(document: dict, *, kind: str, index: int) -> str:
    """Mirror the base engine's stable proof-key construction."""
    document_id = _document_id(document)
    if document_id:
        return f"{kind}:{document_id}"
    return f"{kind}-index:{index}"


def _trajectory_label(*, demonstrations: int, recent: int, dated: int) -> str:
    """Classify temporal position without changing proof-strength scoring."""
    if dated == 0:
        return "undated"
    if demonstrations >= 2:
        if recent >= 2:
            return "current-core"
        if recent == 1:
            return "active"
        return "historical-core"
    if recent == 1:
        return "recent-emerging"
    return "historical"


def _trajectory_reason(label: str, *, recent: int, historical: int) -> str:
    """Return a concise explanation for one trajectory label."""
    if label == "current-core":
        return f"Repeated strength with {recent} recent distinct demonstrations."
    if label == "active":
        return "Repeated strength with at least one recent demonstration."
    if label == "historical-core":
        return f"Repeated strength supported by {historical} dated historical demonstrations, with no recent example in the current window."
    if label == "recent-emerging":
        return "Newly demonstrated skill; another distinct example would show whether it is becoming durable."
    if label == "undated":
        return "The proof is usable, but no reliable demonstration date is available for trajectory analysis."
    return "A historical one-off demonstration; useful context, but not a current repeated signal."


def enrich_career_trajectory(
    result: dict,
    entries: Iterable[dict],
    receipts: Iterable[dict],
    *,
    now: datetime | None = None,
) -> dict:
    """Add current-vs-historical trajectory to an existing intelligence result.

    This enrichment never changes evidence points or durability labels. It only
    describes *when* the distinct demonstrations happened, so recency remains a
    separate dimension rather than an invisible score bonus.
    """
    entries = list(entries)
    receipts = list(receipts)
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)

    entry_proof_keys: dict[str, str] = {}
    entry_dates: dict[str, datetime | None] = {}
    proof_dates: dict[str, datetime | None] = {}
    skill_proofs: dict[str, set[str]] = defaultdict(set)

    for index, entry in enumerate(entries):
        proof_key = _proof_key(entry, kind="entry", index=index)
        entry_id = _document_id(entry)
        observed_at = _document_datetime(entry)
        proof_dates[proof_key] = observed_at
        if entry_id:
            entry_proof_keys[entry_id] = proof_key
            entry_dates[entry_id] = observed_at
        for key, _display in _normalized_skills(entry.get("tags", []) or []):
            skill_proofs[key].add(proof_key)

    for index, receipt in enumerate(receipts):
        source_entry_id = _clean_text(receipt.get("source_entry_id")) or None
        linked_key = entry_proof_keys.get(source_entry_id or "")
        proof_key = linked_key or _proof_key(receipt, kind="receipt", index=index)
        if linked_key is not None and source_entry_id:
            observed_at = entry_dates.get(source_entry_id) or _document_datetime(receipt)
        else:
            observed_at = _document_datetime(receipt)
        proof_dates.setdefault(proof_key, observed_at)
        for key, _display in _normalized_skills(receipt.get("skills", []) or []):
            skill_proofs[key].add(proof_key)

    current_core: list[str] = []
    active: list[str] = []
    historical_core: list[str] = []
    recent_emerging: list[str] = []

    for skill in result.get("skills") or []:
        key = _clean_text(skill.get("skill")).casefold()
        proofs = skill_proofs.get(key, set())
        demonstrations = int(skill.get("demonstrations") or len(proofs))
        dates = [proof_dates.get(proof_key) for proof_key in proofs]
        dated = sum(1 for observed_at in dates if observed_at is not None)
        recent = sum(
            1
            for observed_at in dates
            if observed_at is not None
            and 0 <= (now - observed_at).days <= RECENT_WINDOW_DAYS
        )
        historical = sum(
            1
            for observed_at in dates
            if observed_at is not None and (now - observed_at).days > RECENT_WINDOW_DAYS
        )
        undated = max(0, demonstrations - dated)
        label = _trajectory_label(
            demonstrations=demonstrations,
            recent=recent,
            dated=dated,
        )

        skill["trajectory"] = label
        skill["recent_demonstrations"] = recent
        skill["historical_demonstrations"] = historical
        skill["undated_demonstrations"] = undated
        skill["trajectory_reason"] = _trajectory_reason(
            label,
            recent=recent,
            historical=historical,
        )

        name = skill.get("skill")
        if label == "current-core":
            current_core.append(name)
        elif label == "active":
            active.append(name)
        elif label == "historical-core":
            historical_core.append(name)
        elif label == "recent-emerging":
            recent_emerging.append(name)

    profile = result.setdefault("career_profile", {})
    profile["current_core_skills"] = current_core[:4]
    profile["active_skills"] = active[:4]
    profile["historical_core_skills"] = historical_core[:4]
    profile["recent_emerging_skills"] = recent_emerging[:4]

    current_repeated = current_core + active
    current_themes = [
        theme.get("theme")
        for theme in result.get("career_themes") or []
        if theme.get("signal") in {"established", "strong"} and theme.get("recent")
    ]
    current_themes = [theme for theme in current_themes if theme]

    if current_repeated:
        trajectory_summary = (
            f"Current repeated signals include {', '.join(current_repeated[:3])}."
        )
        if historical_core:
            trajectory_summary += (
                f" Historical strengths such as {', '.join(historical_core[:2])} "
                "remain in the record without being presented as current momentum."
            )
    elif historical_core:
        trajectory_summary = (
            f"Your strongest repeated signals are currently historical: "
            f"{', '.join(historical_core[:3])}. Add a fresh example only if those "
            "skills still reflect your current work."
        )
    elif recent_emerging:
        trajectory_summary = (
            f"Recent growth is visible in {', '.join(recent_emerging[:3])}, but "
            "those signals still need repetition before they become current core strengths."
        )
    else:
        trajectory_summary = (
            "There is not enough dated repeated proof yet to separate current core "
            "strengths from historical ones."
        )

    profile["trajectory_summary"] = trajectory_summary
    if current_themes:
        profile["headline"] = " · ".join(current_themes[:2])
    elif current_repeated:
        profile["headline"] = " · ".join(current_repeated[:3])

    base_summary = _clean_text(profile.get("summary"))
    if base_summary and trajectory_summary not in base_summary:
        profile["summary"] = f"{base_summary} {trajectory_summary}"
    elif not base_summary:
        profile["summary"] = trajectory_summary

    summary = result.setdefault("summary", {})
    summary["current_core_skill_count"] = len(current_core)
    summary["active_skill_count"] = len(active)
    summary["historical_core_skill_count"] = len(historical_core)
    summary["recent_emerging_skill_count"] = len(recent_emerging)

    methodology = result.setdefault("methodology", {})
    methodology["version"] = "career-intelligence-v4"
    methodology["schema_version"] = "career-intelligence-v4"
    methodology["trajectory_window_days"] = RECENT_WINDOW_DAYS
    methodology["description"] = (
        "Signals summarize user-owned proof. Durability, proof support, and temporal "
        "trajectory are separate dimensions. Current-core, active, historical-core, "
        "and recent-emerging labels describe when distinct demonstrations occurred "
        "without adding recency points. Linked receipts inherit their source work date, "
        "so late documentation cannot create fake current momentum. Boasted does not "
        "predict hiring or promotion outcomes."
    )
    return result
