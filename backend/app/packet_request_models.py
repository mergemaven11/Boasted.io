from __future__ import annotations

from pydantic import BaseModel, Field

from app.packet_platform import OPTIONAL_SECTIONS


class BasePacketRequest(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    career_area: str | None = Field(default=None, max_length=120)
    role_title: str | None = Field(default=None, max_length=160)
    organization: str | None = Field(default=None, max_length=180)
    confidential: bool = True


class PromotionPacketRequest(BasePacketRequest):
    target_role: str | None = Field(default=None, max_length=160)
    target_level: str | None = Field(default=None, max_length=120)


class InterviewPacketRequest(BasePacketRequest):
    selected_entry_ids: list[str] = Field(default_factory=list, max_length=8)
    target_role: str | None = Field(default=None, max_length=160)
    target_organization: str | None = Field(default=None, max_length=180)
    include_evidence_references: bool = False


class CertificationPacketRequest(BasePacketRequest):
    credential_name: str | None = Field(default=None, max_length=180)
    issuing_body: str | None = Field(default=None, max_length=180)
    review_type: str | None = Field(default=None, max_length=120)
    requirement_notes: str | None = Field(default=None, max_length=1200)


class PlatformPacketRequest(BasePacketRequest):
    signature_entry_ids: list[str] = Field(default_factory=list, max_length=8)
    sections: list[str] | None = Field(default=None, max_length=len(OPTIONAL_SECTIONS))
    packet_note: str | None = Field(default=None, max_length=1500)
    item_notes: dict[str, str] = Field(default_factory=dict, max_length=20)
    include_notes: bool = True
    theme: str | None = Field(default="classic-dossier", max_length=40)
    brand_name: str | None = Field(default=None, max_length=120)
    department_label: str | None = Field(default=None, max_length=120)
    reviewer_name: str | None = Field(default=None, max_length=120)
    review_cycle_label: str | None = Field(default=None, max_length=120)

    def normalized_sections(self) -> list[str] | None:
        if self.sections is None:
            return None
        requested = set(self.sections)
        return [section for section in OPTIONAL_SECTIONS if section in requested]
