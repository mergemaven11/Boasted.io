"""Build deterministic, explainable career intelligence from user-owned proof."""
from __future__ import annotations

import re
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Iterable, Iterator

QUANTIFIED_PATTERN = re.compile(
    r"(?:"
    r"\$\s?\d"
    r"|\b\d+(?:\.\d+)?\s?(?:%|x)(?!\w)"
    r"|\b\d+(?:\.\d+)?\s?(?:"
    r"milliseconds?|ms|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?"
    r"|users?|customers?|tickets?|incidents?|requests?|pull requests?|prs?|deployments?|releases?"
    r"|builds?|servers?|containers?|nodes?|projects?|people|members?|mb|gb|tb"
    r")\b"
    r")",
    re.IGNORECASE,
)

# Delimiters that are commonly used to paste several skills into one tag. We do
# not split on "/" or "-" because those are meaningful inside skills such as
# CI/CD, TCP/IP, and problem-solving.
SKILL_SEPARATOR_PATTERN = re.compile(r"\s*(?:[·•|;,]|\r?\n)+\s*")
RECENT_WINDOW_DAYS = 180
PRIMARY_SKILL_LIMIT = 4
EMERGING_SKILL_LIMIT = 4
PRIMARY_THEME_LIMIT = 2

_SIGNAL_RANK = {"emerging": 1, "established": 2, "strong": 3}
_SUPPORT_RANK = {"basic": 1, "supported": 2, "well-supported": 3}


def _clean_text(value) -> str:
    """Return trimmed text without turning None into the literal string 'None'."""
    return str(value or "").strip()


def _display_text(value) -> str:
    """Normalize whitespace while preserving user-facing capitalization."""
    return re.sub(r"\s+", " ", _clean_text(value))


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
        cleaned = _display_text(part).strip(" \t-–—")
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


def _percent(numerator: int, denominator: int) -> int:
    """Return a bounded whole-number coverage percentage."""
    if denominator <= 0:
        return 0
    return max(0, min(100, round((numerator / denominator) * 100)))


def _signal_label(demonstrations: int, support_level: str) -> str:
    """Classify durability separately from proof-quality enrichment."""
    if demonstrations >= 4 and support_level != "basic":
        return "strong"
    if demonstrations >= 2:
        return "established"
    return "emerging"


def _support_level(
    *,
    quantified_count: int,
    evidence_backed_count: int,
    confirmed_demo_count: int,
) -> str:
    """Classify how well demonstrations are substantiated.

    This is intentionally separate from durability. One deeply documented
    example can be well-supported while still being an emerging career signal.
    """
    dimensions = sum(
        1
        for count in (quantified_count, evidence_backed_count, confirmed_demo_count)
        if count > 0
    )
    if dimensions == 3 and (evidence_backed_count >= 2 or quantified_count >= 2):
        return "well-supported"
    if dimensions >= 2 or confirmed_demo_count > 0:
        return "supported"
    return "basic"


def _skill_evidence_points(
    *,
    demonstrations: int,
    quantified_count: int,
    evidence_backed_count: int,
    confirmed_demo_count: int,
) -> tuple[int, dict]:
    """Score proof strength using breadth across demonstrations, not file volume.

    A single receipt with several attachments should not receive the same signal
    boost as several distinct work examples. Raw attachment and confirmation
    counts are still exposed, but the score uses distinct underlying proof keys.
    """
    breakdown = {
        "demonstration_breadth": min(demonstrations, 5) * 12,
        "quantified_breadth": min(quantified_count, 3) * 8,
        "evidence_breadth": min(evidence_backed_count, 3) * 6,
        "confirmation_breadth": min(confirmed_demo_count, 2) * 8,
    }
    return min(sum(breakdown.values()), 100), breakdown


def _strength_reasons(
    *,
    demonstrations: int,
    quantified_count: int,
    evidence_backed_count: int,
    confirmed_demo_count: int,
) -> list[str]:
    """Return concise, inspectable reasons behind a skill signal."""
    reasons = [
        f"{demonstrations} distinct demonstration{'' if demonstrations == 1 else 's'}",
    ]
    if quantified_count:
        reasons.append(
            f"{quantified_count} quantified example{'' if quantified_count == 1 else 's'}"
        )
    if evidence_backed_count:
        reasons.append(
            f"{evidence_backed_count} evidence-backed demonstration"
            f"{'' if evidence_backed_count == 1 else 's'}"
        )
    if confirmed_demo_count:
        reasons.append(
            f"{confirmed_demo_count} confirmed demonstration"
            f"{'' if confirmed_demo_count == 1 else 's'}"
        )
    return reasons


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


def _profile_maturity(distinct_demonstrations: int, repeated_skill_count: int) -> str:
    """Describe evidence coverage without predicting employment outcomes."""
    if distinct_demonstrations < 3:
        return "early"
    if distinct_demonstrations < 6 or repeated_skill_count < 2:
        return "developing"
    return "well-supported"


def _theme_rows(category_state: dict, now: datetime) -> list[dict]:
    """Build category-level themes from accomplishment history."""
    rows: list[dict] = []
    for state in category_state.values():
        demonstrations = len(state["proof_keys"])
        if demonstrations <= 0:
            continue

        display = max(
            state["display_names"].items(),
            key=lambda item: (item[1], len(item[0])),
        )[0]
        latest_at = state["latest_at"]
        days_since = (now - latest_at).days if latest_at else None
        recent = days_since is not None and days_since <= RECENT_WINDOW_DAYS
        support = _support_level(
            quantified_count=len(state["quantified_keys"]),
            evidence_backed_count=len(state["evidence_keys"]),
            confirmed_demo_count=len(state["confirmed_keys"]),
        )
        signal = _signal_label(demonstrations, support)

        ranked_skills = []
        for skill_key, proof_keys in state["skill_proof_keys"].items():
            display_names = state["skill_display_names"][skill_key]
            skill_display = max(
                display_names.items(),
                key=lambda item: (item[1], len(item[0])),
            )[0]
            ranked_skills.append(
                (len(proof_keys), skill_display.casefold(), skill_display)
            )
        ranked_skills.sort(reverse=True)

        rows.append(
            {
                "theme": display,
                "signal": signal,
                "support_level": support,
                "demonstrations": demonstrations,
                "skills": [item[2] for item in ranked_skills[:4]],
                "quantified_examples": len(state["quantified_keys"]),
                "evidence_backed_demonstrations": len(state["evidence_keys"]),
                "confirmed_demonstrations": len(state["confirmed_keys"]),
                "recent": recent,
                "last_demonstrated_at": latest_at.isoformat() if latest_at else None,
            }
        )

    rows.sort(
        key=lambda item: (
            _SIGNAL_RANK[item["signal"]],
            item["demonstrations"],
            _SUPPORT_RANK[item["support_level"]],
            item["quantified_examples"],
            item["theme"].casefold(),
        ),
        reverse=True,
    )
    return rows


def _build_career_profile(
    skills: list[dict],
    themes: list[dict],
    *,
    total_proof_records: int,
    distinct_demonstrations: int,
    accomplishment_count: int,
    receipt_count: int,
) -> dict:
    """Build the combined profile shown above any one individual skill."""
    primary, emerging = _profile_skill_sets(skills)
    repeated = [skill for skill in skills if skill["demonstrations"] >= 2]
    repeated_count = len(repeated)
    strong_count = sum(1 for skill in skills if skill["signal"] == "strong")
    established_count = sum(1 for skill in skills if skill["signal"] == "established")
    maturity = _profile_maturity(distinct_demonstrations, repeated_count)

    durable_themes = [
        theme
        for theme in themes
        if theme["demonstrations"] >= 2 and theme["theme"] != "Uncategorized"
    ][:PRIMARY_THEME_LIMIT]
    primary_theme_names = [theme["theme"] for theme in durable_themes]
    primary_names = [skill["skill"] for skill in primary]
    emerging_names = [skill["skill"] for skill in emerging]
    recent_emerging = [
        skill["skill"]
        for skill in skills
        if skill["demonstrations"] == 1 and skill["recent"]
    ][:EMERGING_SKILL_LIMIT]

    if primary_theme_names:
        headline = " · ".join(primary_theme_names)
    elif repeated:
        headline = " · ".join(skill["skill"] for skill in repeated[:3])
    elif primary_names:
        headline = " · ".join(primary_names[:3])
    else:
        headline = "Build your career signal"

    if not skills:
        summary = (
            "Add specific skills to accomplishments and Impact Receipts so "
            "Boasted can connect your proof into a combined career profile."
        )
    elif repeated:
        repeated_names = ", ".join(skill["skill"] for skill in repeated[:3])
        summary = (
            f"Across {total_proof_records} saved proof record"
            f"{'' if total_proof_records == 1 else 's'} representing "
            f"{distinct_demonstrations} distinct demonstration"
            f"{'' if distinct_demonstrations == 1 else 's'}, your most durable "
            f"signals include {repeated_names}. Boasted ranks repeated work "
            "before emerging signals and tracks recent growth separately."
        )
    else:
        summary = (
            f"Across {total_proof_records} saved proof record"
            f"{'' if total_proof_records == 1 else 's'} representing "
            f"{distinct_demonstrations} distinct demonstration"
            f"{'' if distinct_demonstrations == 1 else 's'}, Boasted sees "
            "promising emerging signals but not enough repeated demonstrations "
            "yet to call one a durable core strength."
        )

    return {
        "headline": headline,
        "primary_themes": primary_theme_names,
        "primary_skills": primary_names,
        "emerging_skills": emerging_names,
        "recent_emerging_skills": recent_emerging,
        "repeated_skill_count": repeated_count,
        "established_skill_count": established_count,
        "strong_skill_count": strong_count,
        "maturity": maturity,
        "accomplishment_count": accomplishment_count,
        "receipt_count": receipt_count,
        "distinct_demonstrations": distinct_demonstrations,
        "summary": summary,
    }


def _recommendations(skills: list[dict], gaps: list[dict]) -> list[str]:
    """Build prioritized, evidence-aware next actions."""
    recommendations: list[str] = []
    repeated = [skill for skill in skills if skill["demonstrations"] >= 2]

    if repeated:
        names = ", ".join(skill["skill"] for skill in repeated[:3])
        recommendations.append(
            f"Lead with your repeated signals: {names}. They are backed by more "
            "than one distinct work example."
        )

        top = repeated[0]
        if top["quantified_examples"] == 0:
            recommendations.append(
                f"Add a measurable outcome to a {top['skill']} example where "
                "you can do so accurately."
            )
        elif top["evidence_backed_demonstrations"] == 0:
            recommendations.append(
                f"Strengthen {top['skill']} by turning one strong example into "
                "an Impact Receipt with safe supporting evidence."
            )
        elif top["confirmed_demonstrations"] == 0 and top["impact_receipts"]:
            recommendations.append(
                f"If appropriate, add independent confirmation to one "
                f"{top['skill']} Impact Receipt."
            )
    elif skills:
        names = ", ".join(skill["skill"] for skill in skills[:3])
        recommendations.append(
            f"Build repetition around {names}; another distinct example will "
            "help separate durable strengths from one-off work."
        )

    for gap in gaps:
        action = gap["action"]
        if action not in recommendations:
            recommendations.append(action)
        if len(recommendations) >= 4:
            break

    if len(recommendations) < 4:
        recent_emerging = next(
            (
                skill
                for skill in skills
                if skill["demonstrations"] == 1 and skill["recent"]
            ),
            None,
        )
        if recent_emerging:
            action = (
                f"If {recent_emerging['skill']} is becoming a recurring part of "
                "your work, capture the next distinct example so Boasted can "
                "measure whether it is becoming established."
            )
            if action not in recommendations:
                recommendations.append(action)

    if not recommendations:
        recommendations.append(
            "Keep capturing new accomplishments so your career signals stay current."
        )

    return recommendations[:4]


def build_career_intelligence(
    entries: Iterable[dict],
    receipts: Iterable[dict],
    *,
    now: datetime | None = None,
) -> dict:
    """Build explainable career signals from user-owned proof records.

    Every accomplishment and every Impact Receipt is analyzed. A linked receipt
    enriches its source accomplishment instead of creating a second underlying
    demonstration. Strength, proof quality, themes, and recency are exposed as
    separate concepts so freshness cannot masquerade as career depth.
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
            "evidence_keys": set(),
            "confirmed_keys": set(),
            "evidence_item_count": 0,
            "confirmation_count": 0,
            "latest_at": None,
        }
    )
    category_state = defaultdict(
        lambda: {
            "display_names": defaultdict(int),
            "proof_keys": set(),
            "quantified_keys": set(),
            "evidence_keys": set(),
            "confirmed_keys": set(),
            "skill_proof_keys": defaultdict(set),
            "skill_display_names": defaultdict(lambda: defaultdict(int)),
            "latest_at": None,
        }
    )

    evidence_items = 0
    confirmed_receipts = 0
    quantified_proof_keys: set[str] = set()
    evidence_proof_keys: set[str] = set()
    confirmed_proof_keys: set[str] = set()
    all_proof_keys: set[str] = set()
    linked_receipt_entry_ids: set[str] = set()

    entry_proof_keys: dict[str, str] = {}
    entry_dates: dict[str, datetime | None] = {}
    proof_category_keys: dict[str, str] = {}

    for index, entry in enumerate(entries):
        entry_id = _document_id(entry)
        proof_key = f"entry:{entry_id}" if entry_id else f"entry-index:{index}"
        all_proof_keys.add(proof_key)
        if entry_id:
            entry_proof_keys[entry_id] = proof_key

        observed_at = _document_datetime(entry)
        if entry_id:
            entry_dates[entry_id] = observed_at

        category_display = _display_text(entry.get("category")) or "Uncategorized"
        category_key = category_display.casefold()
        proof_category_keys[proof_key] = category_key
        theme = category_state[category_key]
        theme["display_names"][category_display] += 1
        theme["proof_keys"].add(proof_key)
        if observed_at and (
            theme["latest_at"] is None or observed_at > theme["latest_at"]
        ):
            theme["latest_at"] = observed_at

        is_quantified = _has_quantified_text(
            entry.get("impact"), entry.get("resume_bullet"), entry.get("action")
        )
        if is_quantified:
            quantified_proof_keys.add(proof_key)
            theme["quantified_keys"].add(proof_key)

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

            theme["skill_proof_keys"][key].add(proof_key)
            theme["skill_display_names"][key][display] += 1

    for index, receipt in enumerate(receipts):
        receipt_id = _document_id(receipt)
        source_entry_id = _clean_text(receipt.get("source_entry_id")) or None
        linked_proof_key = entry_proof_keys.get(source_entry_id or "")
        proof_key = linked_proof_key
        if proof_key is None:
            proof_key = f"receipt:{receipt_id}" if receipt_id else f"receipt-index:{index}"
        else:
            linked_receipt_entry_ids.add(source_entry_id)

        all_proof_keys.add(proof_key)

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
        if evidence:
            evidence_proof_keys.add(proof_key)
        if confirmations:
            confirmed_proof_keys.add(proof_key)

        # A linked receipt documents the original work; creating the receipt later
        # should not make old work look newly demonstrated.
        if linked_proof_key is not None and source_entry_id:
            observed_at = entry_dates.get(source_entry_id) or _document_datetime(receipt)
        else:
            observed_at = _document_datetime(receipt)

        category_key = proof_category_keys.get(proof_key)
        if category_key is not None:
            theme = category_state[category_key]
            if has_metrics:
                theme["quantified_keys"].add(proof_key)
            if evidence:
                theme["evidence_keys"].add(proof_key)
            if confirmations:
                theme["confirmed_keys"].add(proof_key)

        seen_in_receipt = set()
        for key, display in _normalized_skills(receipt.get("skills", []) or []):
            if key in seen_in_receipt:
                continue
            seen_in_receipt.add(key)

            state = skill_state[key]
            state["display_names"][display] += 1
            state["receipt_count"] += 1
            state["proof_keys"].add(proof_key)
            state["evidence_item_count"] += len(evidence)
            state["confirmation_count"] += confirmations
            if has_metrics:
                state["quantified_keys"].add(proof_key)
            if evidence:
                state["evidence_keys"].add(proof_key)
            if confirmations:
                state["confirmed_keys"].add(proof_key)
            if observed_at and (
                state["latest_at"] is None or observed_at > state["latest_at"]
            ):
                state["latest_at"] = observed_at

            if category_key is not None:
                theme = category_state[category_key]
                theme["skill_proof_keys"][key].add(proof_key)
                theme["skill_display_names"][key][display] += 1

    skills = []
    for state in skill_state.values():
        display = max(
            state["display_names"].items(),
            key=lambda item: (item[1], len(item[0])),
        )[0]
        demonstrations = len(state["proof_keys"])
        quantified_count = len(state["quantified_keys"])
        evidence_backed_count = len(state["evidence_keys"])
        confirmed_demo_count = len(state["confirmed_keys"])
        latest_at = state["latest_at"]
        days_since = (now - latest_at).days if latest_at else None
        recent = days_since is not None and days_since <= RECENT_WINDOW_DAYS

        support = _support_level(
            quantified_count=quantified_count,
            evidence_backed_count=evidence_backed_count,
            confirmed_demo_count=confirmed_demo_count,
        )
        signal = _signal_label(demonstrations, support)
        points, score_breakdown = _skill_evidence_points(
            demonstrations=demonstrations,
            quantified_count=quantified_count,
            evidence_backed_count=evidence_backed_count,
            confirmed_demo_count=confirmed_demo_count,
        )

        skills.append(
            {
                "skill": display,
                "signal": signal,
                "support_level": support,
                "evidence_points": points,
                "score_breakdown": score_breakdown,
                "strength_reasons": _strength_reasons(
                    demonstrations=demonstrations,
                    quantified_count=quantified_count,
                    evidence_backed_count=evidence_backed_count,
                    confirmed_demo_count=confirmed_demo_count,
                ),
                "demonstrations": demonstrations,
                "accomplishments": state["entry_count"],
                "impact_receipts": state["receipt_count"],
                "quantified_examples": quantified_count,
                "evidence_items": state["evidence_item_count"],
                "evidence_backed_demonstrations": evidence_backed_count,
                "confirmations": state["confirmation_count"],
                "confirmed_demonstrations": confirmed_demo_count,
                "recent": recent,
                "last_demonstrated_at": latest_at.isoformat() if latest_at else None,
            }
        )

    # Durability is the first sort dimension: a deeply documented one-off can be
    # high-quality evidence while still remaining an emerging career signal.
    skills.sort(
        key=lambda item: (
            _SIGNAL_RANK[item["signal"]],
            item["demonstrations"],
            item["evidence_points"],
            _SUPPORT_RANK[item["support_level"]],
            item["quantified_examples"],
            item["confirmed_demonstrations"],
            bool(item["recent"]),
            item["last_demonstrated_at"] or "",
            item["skill"].casefold(),
        ),
        reverse=True,
    )

    themes = _theme_rows(category_state, now)
    distinct_demonstrations = len(all_proof_keys)
    quantified_count = len(quantified_proof_keys)
    evidence_demo_count = len(evidence_proof_keys)
    confirmed_demo_count = len(confirmed_proof_keys)

    # Legacy receipts may predate source_entry_id linking. Use explicit linkage
    # when available, with a conservative document-count fallback so old data is
    # not treated as having zero structured coverage.
    explicit_receipt_coverage = len(linked_receipt_entry_ids)
    fallback_receipt_coverage = min(len(receipts), len(entries))
    effective_receipt_coverage = max(
        explicit_receipt_coverage,
        fallback_receipt_coverage,
    )
    receipt_coverage_percent = _percent(effective_receipt_coverage, len(entries))

    gaps = []
    if entries and receipt_coverage_percent < 34:
        gaps.append(
            {
                "type": "receipt_coverage",
                "title": "Turn more wins into Impact Receipts",
                "detail": (
                    f"Structured proof currently covers about "
                    f"{receipt_coverage_percent}% of your accomplishments."
                ),
                "action": "Create Impact Receipts for your highest-impact accomplishments.",
            }
        )

    quantified_coverage_percent = _percent(quantified_count, distinct_demonstrations)
    if distinct_demonstrations and quantified_coverage_percent < 34:
        gaps.append(
            {
                "type": "quantified_impact",
                "title": "Increase measurable-outcome coverage",
                "detail": (
                    f"{quantified_count} of {distinct_demonstrations} distinct "
                    "demonstrations currently include a measurable result."
                ),
                "action": (
                    "Add a number, percentage, time saved, volume, cost, or other "
                    "measurable result where accurate."
                ),
            }
        )

    evidence_coverage_percent = _percent(evidence_demo_count, distinct_demonstrations)
    if receipts and evidence_coverage_percent < 34:
        gaps.append(
            {
                "type": "supporting_evidence",
                "title": "Broaden supporting-evidence coverage",
                "detail": (
                    f"{evidence_demo_count} of {distinct_demonstrations} distinct "
                    "demonstrations are backed by supporting evidence metadata."
                ),
                "action": (
                    "Attach safe evidence metadata such as reports, feedback, links, "
                    "or artifacts to more of your strongest receipts."
                ),
            }
        )

    confirmation_coverage_percent = _percent(
        confirmed_demo_count,
        distinct_demonstrations,
    )
    if receipts and confirmed_demo_count == 0:
        gaps.append(
            {
                "type": "recognition",
                "title": "Capture independent recognition",
                "detail": "None of your distinct demonstrations currently include confirmation.",
                "action": (
                    "Where appropriate, request or record collaborator, stakeholder, "
                    "or organization confirmation."
                ),
            }
        )

    if not skills and entries:
        gaps.append(
            {
                "type": "skills",
                "title": "Tag demonstrated skills",
                "detail": "Your accomplishments do not yet expose reusable skill signals.",
                "action": (
                    "Add specific skills to accomplishments so Boasted can connect "
                    "work to capabilities."
                ),
            }
        )

    if (
        skills
        and distinct_demonstrations >= 2
        and not any(skill["demonstrations"] >= 2 for skill in skills)
    ):
        gaps.append(
            {
                "type": "repetition",
                "title": "Build repeatable career signals",
                "detail": (
                    "Your proof shows several skills, but none appears across more "
                    "than one distinct work example yet."
                ),
                "action": (
                    "Keep tagging recurring skills consistently so repeated strengths "
                    "become visible over time."
                ),
            }
        )

    profile = _build_career_profile(
        skills,
        themes,
        total_proof_records=total_proof_records,
        distinct_demonstrations=distinct_demonstrations,
        accomplishment_count=len(entries),
        receipt_count=len(receipts),
    )

    top_categories = [
        {"category": theme["theme"], "count": theme["demonstrations"]}
        for theme in themes[:5]
    ]

    return {
        "summary": {
            "accomplishments": len(entries),
            "impact_receipts": len(receipts),
            "total_proof_records": total_proof_records,
            "distinct_demonstrations": distinct_demonstrations,
            "unique_skills": len(skills),
            "quantified_results": quantified_count,
            "quantified_coverage_percent": quantified_coverage_percent,
            "evidence_items": evidence_items,
            "evidence_backed_demonstrations": evidence_demo_count,
            "evidence_coverage_percent": evidence_coverage_percent,
            "confirmed_receipts": confirmed_receipts,
            "confirmed_demonstrations": confirmed_demo_count,
            "confirmation_coverage_percent": confirmation_coverage_percent,
            "receipt_coverage_percent": receipt_coverage_percent,
        },
        "career_profile": profile,
        "career_themes": themes,
        "top_skills": skills[:8],
        "skills": skills,
        "top_categories": top_categories,
        "gaps": gaps,
        "recommended_actions": _recommendations(skills, gaps),
        "methodology": {
            "version": "career-intelligence-v3",
            "schema_version": "career-intelligence-v3",
            "employment_decision": False,
            "description": (
                "Signals summarize user-owned proof. Durability is based on repeated "
                "distinct demonstrations; proof quality is tracked separately through "
                "measurable outcomes, evidence-backed demonstrations, and confirmations. "
                "Linked receipts enrich their source work without creating fake repetition, "
                "and receipt creation dates do not make older work look newly demonstrated. "
                "Boasted does not predict hiring or promotion outcomes."
            ),
        },
    }
