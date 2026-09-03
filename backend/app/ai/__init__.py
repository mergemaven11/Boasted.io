"""BragStack AI evidence-assistance foundation.

AI output is suggestion state only. Domain evidence remains user-controlled and
must be traceable to source evidence IDs.
"""

from .contracts import AIProvider, AISuggestion, EvidenceContext, InferenceRequest
from .evaluation import (
    EVAL_SUITE_VERSION,
    EvaluationCase,
    EvaluationResult,
    EvaluationSummary,
    evaluate_suggestion,
    run_evaluation,
)
from .guards import GroundingViolation, validate_grounded_suggestion
from .licensing import ModelLicenseRecord, ProductionLicenseGate

__all__ = [
    "AIProvider",
    "AISuggestion",
    "EVAL_SUITE_VERSION",
    "EvaluationCase",
    "EvaluationResult",
    "EvaluationSummary",
    "EvidenceContext",
    "GroundingViolation",
    "InferenceRequest",
    "ModelLicenseRecord",
    "ProductionLicenseGate",
    "evaluate_suggestion",
    "run_evaluation",
    "validate_grounded_suggestion",
]
