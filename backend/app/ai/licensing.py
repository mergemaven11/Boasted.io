"""Production licensing gate for candidate AI models and runtimes."""
from __future__ import annotations

from dataclasses import dataclass

_PERMISSIVE_LICENSES = {"apache-2.0", "mit", "bsd-2-clause", "bsd-3-clause"}


@dataclass(frozen=True)
class ModelLicenseRecord:
    """Auditable model licensing and deployment metadata."""

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
        """Return every reason the model is not eligible for production use."""
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
        """Return true only when all licensing metadata passes the gate."""
        return not cls.violations(record)
