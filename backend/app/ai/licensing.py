"""Production licensing gate for candidate AI models and runtimes."""
from __future__ import annotations

from dataclasses import dataclass

_PERMISSIVE_LICENSES = {"apache-2.0", "mit", "bsd-2-clause", "bsd-3-clause"}


@dataclass(frozen=True)
class ModelLicenseRecord:
    """Represent auditable model licensing and deployment metadata.

    Attributes:
        model_id: Exact upstream model identifier.
        revision: Immutable reviewed model revision or commit identifier.
        source_url: Permanent HTTPS source for the model or model card.
        license_id: Normalized SPDX-style license identifier.
        license_url: Permanent HTTPS URL for the reviewed license text.
        commercial_use: Whether commercial use is explicitly permitted.
        modification: Whether modification is explicitly permitted.
        redistribution: Whether redistribution is explicitly permitted.
        attribution_notice: Required attribution or notice text, when applicable.
        runtime: Runtime selected or proposed for model execution.
        hardware_envelope: Documented CPU, GPU, memory, or platform expectations.
        intended_task: BragStack task for which the model is being evaluated.
        evaluation_status: Current BragStack-specific evaluation state.
        known_limitations: Known model, runtime, or task limitations.
    """

    model_id: str
    revision: str
    source_url: str
    license_id: str
    license_url: str
    commercial_use: bool
    modification: bool
    redistribution: bool
    attribution_notice: str
    runtime: str
    hardware_envelope: str
    intended_task: str
    evaluation_status: str = "not_evaluated"
    known_limitations: str = ""


class ProductionLicenseGate:
    """Fail closed unless model weights have clear permissive commercial terms."""

    @staticmethod
    def violations(record: ModelLicenseRecord) -> list[str]:
        """Return every reason a model record is not license-eligible for production.

        Args:
            record: Auditable model-license record to evaluate.

        Returns:
            Stable violation identifiers. An empty list means the licensing
            metadata satisfies this gate; it does not imply quality approval.
        """
        problems: list[str] = []
        if record.license_id.casefold() not in _PERMISSIVE_LICENSES:
            problems.append("license_not_allowlisted")
        if not record.commercial_use:
            problems.append("commercial_use_not_confirmed")
        if not record.modification:
            problems.append("modification_not_confirmed")
        if not record.redistribution:
            problems.append("redistribution_not_confirmed")
        if not record.revision.strip():
            problems.append("revision_missing")
        if not record.source_url.startswith("https://"):
            problems.append("source_url_missing_or_insecure")
        if not record.license_url.startswith("https://"):
            problems.append("license_url_missing_or_insecure")
        if not record.intended_task.strip():
            problems.append("intended_task_missing")
        return problems

    @classmethod
    def allows_production(cls, record: ModelLicenseRecord) -> bool:
        """Return whether the record passes the production licensing gate.

        Args:
            record: Auditable model-license record to evaluate.

        Returns:
            True only when no licensing metadata violations are present. This
            result does not replace BragStack's separate model-evaluation gate.
        """
        return not cls.violations(record)
