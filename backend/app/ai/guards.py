"""Deterministic grounding guards for AI-generated career suggestions."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Iterable

from .contracts import AISuggestion, EvidenceContext

_NUMERIC_RE = re.compile(r"(?<!\w)(?:[$£€]?\d+(?:[,.]\d+)*(?:%|x|\+)?)(?!\w)")
_HIGH_RISK_TERMS = (
    "verified",
    "certified",
    "confirmed by",
    "credential",
    "licensed",
    "promoted",
    "increased",
    "decreased",
    "reduced",
    "saved",
    "revenue",
)


@dataclass(frozen=True)
class GroundingViolation:
    """Represent one deterministic reason a suggestion is not grounded.

    Attributes:
        code: Stable machine-readable violation identifier.
        message: Human-readable explanation of the violation.
        value: Optional unsupported value or phrase that triggered the violation.
    """

    code: str
    message: str
    value: str | None = None


def _flatten_strings(value: Any) -> Iterable[str]:
    """Yield every nested string contained in a structured value.

    Args:
        value: Arbitrarily nested structured value from an AI suggestion payload.

    Yields:
        String values discovered recursively in dictionaries and iterable containers.
    """
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from _flatten_strings(child)
    elif isinstance(value, (list, tuple, set)):
        for child in value:
            yield from _flatten_strings(child)


def _normalized_corpus(evidence: Iterable[EvidenceContext]) -> str:
    """Build a case-insensitive corpus from supplied evidence text.

    Args:
        evidence: Evidence contexts supplied to the inference task.

    Returns:
        Newline-delimited case-folded evidence text for deterministic matching.
    """
    return "\n".join(item.content for item in evidence).casefold()


def validate_grounded_suggestion(
    suggestion: AISuggestion,
    evidence: Iterable[EvidenceContext],
) -> list[GroundingViolation]:
    """Reject provenance gaps and unsupported high-risk factual specificity.

    This guard is deliberately conservative. It does not attempt semantic fact
    checking; it blocks obvious classes of unsupported claims before a model
    output can be surfaced as a Boasted suggestion.

    Args:
        suggestion: Unaccepted AI suggestion to validate before it is surfaced.
        evidence: User-controlled evidence supplied to the originating inference task.

    Returns:
        Deterministic grounding violations. An empty list means this guard found
        no provenance, unsupported-number, or high-risk-language violations.
    """
    evidence_items = tuple(evidence)
    known_ids = {evidence_id for item in evidence_items for evidence_id in item.evidence_ids}
    violations: list[GroundingViolation] = []

    if not suggestion.source_evidence_ids:
        violations.append(
            GroundingViolation("missing_provenance", "AI suggestions must cite at least one evidence ID.")
        )
    for source_id in suggestion.source_evidence_ids:
        if source_id not in known_ids:
            violations.append(
                GroundingViolation(
                    "unknown_evidence_id",
                    "Suggestion references evidence that was not supplied to the task.",
                    source_id,
                )
            )

    corpus = _normalized_corpus(evidence_items)
    for text in _flatten_strings(suggestion.payload):
        for number in _NUMERIC_RE.findall(text):
            if number.casefold() not in corpus:
                violations.append(
                    GroundingViolation(
                        "unsupported_numeric_claim",
                        "Numeric specificity must already exist in user-controlled evidence.",
                        number,
                    )
                )
        lowered = text.casefold()
        for phrase in _HIGH_RISK_TERMS:
            if phrase in lowered and phrase not in corpus:
                violations.append(
                    GroundingViolation(
                        "unsupported_high_risk_language",
                        "High-risk factual language must be supported by supplied evidence.",
                        phrase,
                    )
                )

    return violations
