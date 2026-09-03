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
    """Represent user-selected evidence made available to an AI task.

    Raw content is intentionally carried beside stable evidence IDs so every
    generated suggestion can preserve provenance without making AI output part
    of the durable evidence record.

    Attributes:
        evidence_ids: Stable identifiers for the evidence supplied to inference.
        content: User-controlled evidence text available to the AI task.
        metadata: Optional structured metadata associated with the evidence.
    """

    evidence_ids: tuple[str, ...]
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class InferenceRequest:
    """Represent a versioned request passed to an AI provider implementation.

    Attributes:
        task: Supported evidence-assistance task to perform.
        evidence: User-selected evidence contexts available to the task.
        prompt_version: Version identifier for the task prompt.
        schema_version: Version identifier for the expected structured output.
        instructions: Optional task-specific instructions that do not replace evidence.
    """

    task: SuggestionKind
    evidence: tuple[EvidenceContext, ...]
    prompt_version: str
    schema_version: str
    instructions: str = ""


@dataclass(frozen=True)
class AISuggestion:
    """Represent an unaccepted AI draft with provenance and reproducibility data.

    Attributes:
        task: Evidence-assistance task that produced the suggestion.
        payload: Structured suggestion content returned by the provider.
        source_evidence_ids: Evidence identifiers cited as support for the suggestion.
        provider: Stable identifier for the inference provider.
        model_id: Exact model identifier used for inference.
        model_revision: Pinned model revision used for reproducibility.
        prompt_version: Version identifier for the prompt used during inference.
        schema_version: Version identifier for the structured output schema.
        accepted: Whether the user explicitly accepted the suggestion.
    """

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
    """Define the vendor-neutral inference adapter contract.

    Provider implementations may be local or hosted, but callers interact only
    with this contract and must validate returned suggestions before surfacing
    them to users.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the stable provider identifier.

        Returns:
            Stable provider name used in audit and provenance records.
        """

    @abstractmethod
    def suggest(self, request: InferenceRequest) -> AISuggestion:
        """Return an evidence-grounded draft for a validated request.

        Args:
            request: Versioned inference request containing selected evidence.

        Returns:
            Unaccepted AI suggestion carrying model and evidence provenance.
        """
