"""Document this first-party Python module."""
from __future__ import annotations

from collections import defaultdict
import random


def select_rotated_questions(
    questions: list[dict],
    *,
    count: int = 8,
    exclude_ids: set[str] | None = None,
    seed: str | int | None = None,
) -> list[dict]:
    """Select a varied interview set while avoiding recently-used questions.

    Recent questions are excluded until the unused pool cannot satisfy the requested
    interview size. At that point older/recent questions become eligible only for the
    remaining slots. Category round-robin prevents an interview from becoming eight
    nearly-identical behavioral prompts.
    """
    requested = max(1, min(15, int(count or 8)))
    excluded = set(exclude_ids or set())
    active = [question for question in questions if question.get("active", True)]
    if not active:
        return []

    rng = random.Random(str(seed) if seed is not None else None)
    fresh = [question for question in active if question.get("question_id") not in excluded]
    reused = [question for question in active if question.get("question_id") in excluded]
    rng.shuffle(fresh)
    rng.shuffle(reused)

    selected: list[dict] = []
    categories: dict[str, list[dict]] = defaultdict(list)
    for question in fresh:
        categories[str(question.get("category") or "other")].append(question)

    # Keep domain/role questions prominent while still mixing the session.
    category_priority = [
        "domain", "role-knowledge", "situational", "behavioral", "problem-solving",
        "judgment", "customer-stakeholder", "communication", "quality", "impact",
        "teamwork", "leadership", "motivation", "strength", "growth", "reflection",
    ]
    ordered_categories = [category for category in category_priority if categories.get(category)]
    ordered_categories.extend(sorted(set(categories) - set(ordered_categories)))

    while len(selected) < requested and ordered_categories:
        next_round = []
        for category in ordered_categories:
            bucket = categories[category]
            if bucket and len(selected) < requested:
                selected.append(bucket.pop())
            if bucket:
                next_round.append(category)
        ordered_categories = next_round

    if len(selected) < requested:
        already = {question.get("question_id") for question in selected}
        for question in fresh:
            if len(selected) >= requested:
                break
            if question.get("question_id") not in already:
                selected.append(question)
                already.add(question.get("question_id"))

    # Only recycle previously-used questions when the fresh bank is exhausted.
    if len(selected) < requested:
        already = {question.get("question_id") for question in selected}
        for question in reused:
            if len(selected) >= requested:
                break
            if question.get("question_id") not in already:
                selected.append(question)
                already.add(question.get("question_id"))

    return selected[:requested]
