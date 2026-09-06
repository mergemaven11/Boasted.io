"""Versioned evaluation harness for evidence-grounded AI suggestions."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .contracts import AIProvider, AISuggestion, EvidenceContext, InferenceRequest
from .guards import GroundingViolation, validate_grounded_suggestion

EVAL_SUITE_VERSION = "ai-eval-v1"


@dataclass(frozen=True)
class EvaluationCase:
    """Represent one deterministic AI evaluation fixture.

    Args:
        case_id: Stable identifier for the fixture.
        profession: Role family used to track cross-profession coverage.
        task: AI task under evaluation.
        evidence: Evidence supplied to the provider.
        expected_source_ids: Evidence IDs the suggestion is expected to cite.
        forbidden_substrings: Text that must never appear in the suggestion payload.
        prompt_version: Prompt contract version under test.
        schema_version: Structured-output schema version under test.
        instructions: Optional task-specific instructions.
    """

    case_id: str
    profession: str
    task: str
    evidence: tuple[EvidenceContext, ...]
    expected_source_ids: tuple[str, ...]
    forbidden_substrings: tuple[str, ...] = ()
    prompt_version: str = "eval-prompt-v1"
    schema_version: str = "eval-schema-v1"
    instructions: str = ""


@dataclass(frozen=True)
class EvaluationResult:
    """Represent the outcome of evaluating one model suggestion.

    Args:
        case_id: Stable fixture identifier.
        passed: Whether all deterministic gates passed.
        grounding_violations: Grounding and provenance violations.
        forbidden_hits: Forbidden strings found in model output.
        provenance_exact: Whether cited evidence IDs exactly match expectations.
    """

    case_id: str
    passed: bool
    grounding_violations: tuple[GroundingViolation, ...]
    forbidden_hits: tuple[str, ...]
    provenance_exact: bool


@dataclass(frozen=True)
class EvaluationSummary:
    """Aggregate deterministic quality metrics for an evaluation run.

    Args:
        suite_version: Version of the evaluation contract and fixtures.
        total_cases: Number of evaluated cases.
        passed_cases: Number of cases passing all deterministic gates.
        grounding_violation_count: Total deterministic grounding violations.
        forbidden_hit_count: Total forbidden-output hits.
        provenance_failures: Number of cases with incorrect provenance.
    """

    suite_version: str
    total_cases: int
    passed_cases: int
    grounding_violation_count: int
    forbidden_hit_count: int
    provenance_failures: int

    @property
    def pass_rate(self) -> float:
        """Return the fraction of fixtures that passed.

        Returns:
            A value from 0.0 to 1.0, or 0.0 when no fixtures were evaluated.
        """
        return self.passed_cases / self.total_cases if self.total_cases else 0.0


def _payload_text(suggestion: AISuggestion) -> str:
    """Flatten a suggestion payload into searchable text.

    Args:
        suggestion: Suggestion whose payload should be inspected.

    Returns:
        Case-folded textual representation of the payload.
    """

    def walk(value):
        """Yield scalar text from nested payload values.

        Args:
            value: Nested payload value.

        Yields:
            String representations of scalar payload values.
        """
        if isinstance(value, dict):
            for child in value.values():
                yield from walk(child)
        elif isinstance(value, (list, tuple, set)):
            for child in value:
                yield from walk(child)
        else:
            yield str(value)

    return "\n".join(walk(suggestion.payload)).casefold()


def evaluate_suggestion(case: EvaluationCase, suggestion: AISuggestion) -> EvaluationResult:
    """Evaluate one suggestion against deterministic Boasted gates.

    Args:
        case: Versioned fixture describing expected grounded behavior.
        suggestion: Provider output to evaluate.

    Returns:
        Deterministic evaluation result for the fixture.
    """
    violations = tuple(validate_grounded_suggestion(suggestion, case.evidence))
    text = _payload_text(suggestion)
    forbidden_hits = tuple(item for item in case.forbidden_substrings if item.casefold() in text)
    provenance_exact = set(suggestion.source_evidence_ids) == set(case.expected_source_ids)
    return EvaluationResult(
        case_id=case.case_id,
        passed=not violations and not forbidden_hits and provenance_exact,
        grounding_violations=violations,
        forbidden_hits=forbidden_hits,
        provenance_exact=provenance_exact,
    )


def run_evaluation(provider: AIProvider, cases: Iterable[EvaluationCase]) -> tuple[tuple[EvaluationResult, ...], EvaluationSummary]:
    """Run a provider through the versioned deterministic evaluation suite.

    Args:
        provider: AI provider implementation under evaluation.
        cases: Evaluation fixtures to execute.

    Returns:
        Per-case results and an aggregate summary.
    """
    results: list[EvaluationResult] = []
    for case in cases:
        request = InferenceRequest(
            task=case.task,
            evidence=case.evidence,
            prompt_version=case.prompt_version,
            schema_version=case.schema_version,
            instructions=case.instructions,
        )
        results.append(evaluate_suggestion(case, provider.suggest(request)))

    frozen = tuple(results)
    summary = EvaluationSummary(
        suite_version=EVAL_SUITE_VERSION,
        total_cases=len(frozen),
        passed_cases=sum(result.passed for result in frozen),
        grounding_violation_count=sum(len(result.grounding_violations) for result in frozen),
        forbidden_hit_count=sum(len(result.forbidden_hits) for result in frozen),
        provenance_failures=sum(not result.provenance_exact for result in frozen),
    )
    return frozen, summary
