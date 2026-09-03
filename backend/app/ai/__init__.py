"""BragStack AI evidence-assistance foundation.

AI output is suggestion state only. Domain evidence remains user-controlled and
must be traceable to source evidence IDs.
"""

from .contracts import AIProvider, AISuggestion, EvidenceContext, InferenceRequest
from .guards import GroundingViolation, validate_grounded_suggestion
from .licensing import ModelLicenseRecord, ProductionLicenseGate

__all__ = [
    "AIProvider",
    "AISuggestion",
    "EvidenceContext",
    "GroundingViolation",
    "InferenceRequest",
    "ModelLicenseRecord",
    "ProductionLicenseGate",
    "validate_grounded_suggestion",
]
