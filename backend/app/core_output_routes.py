from __future__ import annotations

import re
from collections import Counter
from datetime import date, datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.auth import get_current_user
from app.database import impact_receipts_collection


router = APIRouter(prefix="/outputs", tags=["outputs"])


class ResumeTargetRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=200)
    target_description: str = Field(default="", max_length=12000)
    max_bullets: int = Field(default=8, ge=1, le=20)


def _clean(value: Any) -> str:
    return str(value or "").strip()


def _receipt_date(receipt: dict) -> date | None:
    value = receipt.get("created_at")
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).date()
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        except ValueError:
            return None
    return None


def _receipts_for_user(user_id: str, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    receipts = list(impact_receipts_collection.find({"user_id": user_id}).sort("created_at", -1))
    if start_date is None and end_date is None:
        return receipts

    selected = []
    for receipt in receipts:
        created = _receipt_date(receipt)
        if start_date is not None and (created is None or created < start_date):
            continue
        if end_date is not None and (created is None or created > end_date):
            continue
        selected.append(receipt)
    return selected


def _metric_text(receipt: dict) -> list[str]:
    values = []
    for metric in receipt.get("metrics", []) or []:
        label = _clean(metric.get("label"))
        value = _clean(metric.get("value"))
        context = _clean(metric.get("context"))
        if not label or not value:
            continue
        text = f"{label}: {value}"
        if context:
            text += f" ({context})"
        values.append(text)
    return values


def _evidence_summary(receipt: dict) -> list[dict]:
    return [
        {
            "title": _clean(item.get("title")),
            "type": _clean(item.get("evidence_type")) or "other",
            "reference": _clean(item.get("reference")) or None,
            "description": _clean(item.get("description")) or None,
            "is_shareable": bool(item.get("is_public", False)),
        }
        for item in (receipt.get("evidence", []) or [])
        if _clean(item.get("title"))
    ]


def _proof_strength(receipt: dict) -> int:
    score = min(len(receipt.get("evidence", []) or []), 3)
    score += min(len(receipt.get("metrics", []) or []), 2)
    score += 1 if any(
        item.get("status") == "confirmed"
        for item in (receipt.get("confirmations", []) or [])
    ) else 0
    return score


def _receipt_record(receipt: dict) -> dict:
    created = _receipt_date(receipt)
    return {
        "receipt_id": str(receipt["_id"]),
        "date": created.isoformat() if created else None,
        "accomplishment": _clean(receipt.get("accomplishment")),
        "contribution": _clean(receipt.get("contribution")),
        "result": _clean(receipt.get("result")),
        "metrics": _metric_text(receipt),
        "skills": [_clean(skill) for skill in (receipt.get("skills", []) or []) if _clean(skill)],
        "evidence": _evidence_summary(receipt),
        "trust_signals": [_clean(signal) for signal in (receipt.get("trust_signals", []) or []) if _clean(signal)],
        "proof_strength": _proof_strength(receipt),
    }


def _tokenize(value: str) -> set[str]:
    stop_words = {
        "and", "the", "with", "for", "from", "that", "this", "your", "you", "our", "are",
        "will", "have", "has", "into", "using", "use", "job", "role", "work", "team", "their",
    }
    return {
        token
        for token in re.findall(r"[a-z0-9+#.-]+", value.lower())
        if len(token) >= 2 and token not in stop_words
    }


def _resume_score(receipt: dict, target_tokens: set[str]) -> tuple[int, int]:
    searchable = " ".join(
        [
            _clean(receipt.get("accomplishment")),
            _clean(receipt.get("contribution")),
            _clean(receipt.get("result")),
            " ".join(_clean(skill) for skill in receipt.get("skills", []) or []),
        ]
    )
    overlap = len(_tokenize(searchable) & target_tokens)
    return overlap, _proof_strength(receipt)


def _resume_bullet(receipt: dict) -> str:
    contribution = _clean(receipt.get("contribution"))
    result = _clean(receipt.get("result"))
    accomplishment = _clean(receipt.get("accomplishment"))

    if contribution and result:
        return f"{contribution.rstrip('.')} — {result[0].lower() + result[1:] if result else result}".rstrip(".") + "."
    if accomplishment and result:
        return f"{accomplishment.rstrip('.')} — {result[0].lower() + result[1:] if result else result}".rstrip(".") + "."
    return (accomplishment or contribution or result).rstrip(".") + "."


@router.get("/performance-review")
def evidence_only_performance_review(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """Build a performance-review packet exclusively from owned Impact Receipts."""

    user_id = str(current_user["_id"])
    receipts = _receipts_for_user(user_id, start_date, end_date)
    records = [_receipt_record(receipt) for receipt in receipts]

    skill_counts = Counter(skill for record in records for skill in record["skills"])
    evidence_count = sum(len(record["evidence"]) for record in records)
    metric_count = sum(len(record["metrics"]) for record in records)
    confirmed_count = sum(
        1 for record in records if any(signal != "self-documented" and "confirmed" in signal or "verified" in signal for signal in record["trust_signals"])
    )

    strongest = sorted(records, key=lambda item: (item["proof_strength"], item["date"] or ""), reverse=True)

    return {
        "source_policy": "impact_receipts_only",
        "source_receipt_ids": [record["receipt_id"] for record in records],
        "period": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
        },
        "summary": {
            "receipt_count": len(records),
            "evidence_count": evidence_count,
            "measurable_metric_count": metric_count,
            "confirmed_receipt_count": confirmed_count,
            "top_skills": [
                {"skill": skill, "receipt_count": count}
                for skill, count in skill_counts.most_common(10)
            ],
        },
        "review_highlights": strongest[:8],
        "all_receipts": records,
        "generation_notes": [
            "Every claim in this packet comes directly from an Impact Receipt owned by the authenticated user.",
            "No accomplishment, metric, skill, or evidence reference is invented or inferred from external data.",
        ],
    }


@router.post("/resume-material")
def evidence_only_resume_material(
    payload: ResumeTargetRequest,
    current_user: dict = Depends(get_current_user),
):
    """Rank and format evidence-backed resume material for a target job."""

    user_id = str(current_user["_id"])
    receipts = _receipts_for_user(user_id)
    target_tokens = _tokenize(f"{payload.target_role} {payload.target_description}")

    ranked = sorted(
        receipts,
        key=lambda receipt: _resume_score(receipt, target_tokens),
        reverse=True,
    )

    selected = ranked[: payload.max_bullets]
    materials = []
    skill_counts: Counter[str] = Counter()

    for receipt in selected:
        overlap, proof_strength = _resume_score(receipt, target_tokens)
        skills = [_clean(skill) for skill in receipt.get("skills", []) or [] if _clean(skill)]
        skill_counts.update(skills)
        materials.append(
            {
                "receipt_id": str(receipt["_id"]),
                "bullet": _resume_bullet(receipt),
                "target_keyword_overlap": overlap,
                "proof_strength": proof_strength,
                "skills": skills,
                "metrics": _metric_text(receipt),
                "evidence": _evidence_summary(receipt),
            }
        )

    return {
        "source_policy": "impact_receipts_only",
        "target_role": payload.target_role,
        "source_receipt_ids": [item["receipt_id"] for item in materials],
        "resume_bullets": materials,
        "evidence_backed_skills": [skill for skill, _ in skill_counts.most_common(20)],
        "generation_notes": [
            "Bullets are composed only from the user's recorded contribution and result fields.",
            "Target-job text is used only to rank existing evidence; it cannot add unsupported claims.",
        ],
    }
