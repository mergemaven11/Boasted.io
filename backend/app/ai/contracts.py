"""Provider-neutral contracts for evidence-grounded AI assistance."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal

SuggestionKind = Literal[
    "evidence_extraction",
    "evidence_quality",
    "impact_receipt",
    "career_writing",
    "skill_classification",
    "semantic_search",
]


@dataclass(frozen=True)
class EvidenceContext:
    """User-selected evidence made available to an AI task.

    Raw content is intentionally carried beside stable evidence IDs so every
    generated suggestion can preserve provenance without making AI output part
    of the durable evidence record.
    """

    evidence_ids: tuple[str, ...]
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class InferenceRequest:
    """Versioned request passed to an AI provider implementation."""

    task: SuggestionKind
    evidence: tuple[EvidenceContext, ...]
    prompt_version: str
    schema_version: str
    instructions: str = ""


@dataclass(frozen=True)
class AISuggestion:
    """Unaccepted AI draft with explicit provenance and reproducibility data."""

    task: SuggestionKind
    payload: dict[str, Any]
    source_evidence_ids: tuple[str, ...]
    provider: str
    model_id: str
    model_revision: str
    prompt_version: str
    schema_version: str
    accepted: bool = False


class AIProvider(ABC):
    """Vendor-neutral inference adapter.

    Provider implementations may be local or hosted, but callers interact only
    with this contract and must validate returned suggestions before surfacing
    them to users.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Return a stable provider identifier."""

    @abstractmethod
    def suggest(self, request: InferenceRequest) -> AISuggestion:
        """Return an evidence-grounded draft for a validated request."""
