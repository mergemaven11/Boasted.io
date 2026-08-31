from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, model_validator

from app.auth import get_current_user
from app.database import executive_export_audit_collection, executive_goals_collection
from app.plans import require_feature

router = APIRouter(prefix="/enterprise/executive-impact", tags=["executive-impact"])
EXECUTIVE_ROLES = {"owner", "admin", "executive"}
MINIMUM_COHORT_SIZE = 5


class SourceRecord(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    reference: str = Field(min_length=1, max_length=500)
    observed_at: datetime


class OutcomeMetric(BaseModel):
    key: str = Field(pattern=r"^[a-z0-9][a-z0-9_-]{1,63}$")
    definition: str = Field(min_length=1, max_length=500)
    lens: Literal["revenue", "reliability", "customer", "efficiency", "risk", "people-development"]
    unit: str = Field(min_length=1, max_length=40)
    baseline: float | None = None
    target: float | None = None
    actual: float | None = None
    period: str = Field(min_length=1, max_length=80)
    owner: str = Field(min_length=1, max_length=120)
    limitations: str = Field(min_length=1, max_length=500)
    sources: list[SourceRecord] = Field(default_factory=list, max_length=20)
    cohort_size: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def actual_requires_source(self):
        if self.actual is not None and not self.sources:
            raise ValueError("Actual values require at least one source record")
        return self


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1, max_length=800)
    status: Literal["on-track", "at-risk", "stalled", "complete"] = "on-track"
    period: str = Field(min_length=1, max_length=80)
    owner: str = Field(min_length=1, max_length=120)
    project_ids: list[str] = Field(default_factory=list, max_length=50)
    metrics: list[OutcomeMetric] = Field(default_factory=list, max_length=30)


class ExportRequest(BaseModel):
    goal_ids: list[str] = Field(min_length=1, max_length=50)
    purpose: Literal["board", "leadership", "investor"]


def _authorize(user: dict) -> str:
    require_feature(user, "executive_command_center")
    role = str(user.get("workspace_role") or "").lower()
    if role not in EXECUTIVE_ROLES:
        raise HTTPException(status_code=403, detail={"code": "executive_role_required", "message": "Executive Impact requires an owner, admin, or executive workspace role."})
    workspace_id = str(user.get("workspace_id") or "")
    if not workspace_id:
        raise HTTPException(status_code=403, detail={"code": "workspace_required", "message": "An Enterprise workspace is required."})
    return workspace_id


def _metric_view(metric: dict, now: datetime) -> dict:
    item = dict(metric)
    cohort = item.get("cohort_size")
    item["suppressed"] = cohort is not None and cohort < MINIMUM_COHORT_SIZE
    if item["suppressed"]:
        item["actual"] = None
        item["sources"] = []
    sources = item.get("sources") or []
    observed = [source.get("observed_at") for source in sources if isinstance(source.get("observed_at"), datetime)]
    freshest = max((value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)) for value in observed) if observed else None
    item["freshness"] = "missing" if not freshest else ("stale" if (now - freshest).days > 90 else "current")
    item["data_quality"] = "missing-measurement" if item.get("actual") is None and not item["suppressed"] else "source-backed"
    return item


def _serialize(goal: dict) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "id": str(goal["_id"]), "title": goal["title"], "description": goal["description"],
        "status": goal["status"], "period": goal["period"], "owner": goal["owner"],
        "project_ids": goal.get("project_ids", []),
        "metrics": [_metric_view(metric, now) for metric in goal.get("metrics", [])],
        "updated_at": goal["updated_at"],
    }


@router.get("")
def dashboard(lens: str | None = Query(default=None), current_user: dict = Depends(get_current_user)):
    workspace_id = _authorize(current_user)
    goals = list(executive_goals_collection.find({"workspace_id": workspace_id, "restricted": {"$ne": True}}).sort("updated_at", -1))
    serialized = [_serialize(goal) for goal in goals]
    if lens:
        for goal in serialized:
            goal["metrics"] = [metric for metric in goal["metrics"] if metric["lens"] == lens]
    metrics = [metric for goal in serialized for metric in goal["metrics"]]
    return {
        "governance": {"minimum_cohort_size": MINIMUM_COHORT_SIZE, "individual_scoring": False, "causation_claims": False},
        "summary": {"goals": len(serialized), "at_risk": sum(goal["status"] in {"at-risk", "stalled"} for goal in serialized), "metrics": len(metrics), "source_backed": sum(metric["data_quality"] == "source-backed" for metric in metrics), "suppressed": sum(metric["suppressed"] for metric in metrics)},
        "goals": serialized,
    }


@router.post("/goals", status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, current_user: dict = Depends(get_current_user)):
    workspace_id = _authorize(current_user)
    now = datetime.now(timezone.utc)
    document = {**payload.model_dump(), "workspace_id": workspace_id, "restricted": False, "created_by": str(current_user["_id"]), "created_at": now, "updated_at": now, "definition_version": 1}
    result = executive_goals_collection.insert_one(document)
    return _serialize({**document, "_id": result.inserted_id})


@router.post("/exports", status_code=status.HTTP_202_ACCEPTED)
def request_export(payload: ExportRequest, current_user: dict = Depends(get_current_user)):
    workspace_id = _authorize(current_user)
    ids = [ObjectId(value) for value in payload.goal_ids if ObjectId.is_valid(value)]
    visible_count = executive_goals_collection.count_documents({"_id": {"$in": ids}, "workspace_id": workspace_id, "restricted": {"$ne": True}})
    if visible_count != len(payload.goal_ids):
        raise HTTPException(status_code=404, detail="One or more goals are unavailable.")
    now = datetime.now(timezone.utc)
    watermark = f"CONFIDENTIAL · {payload.purpose.upper()} · {now.date().isoformat()}"
    audit = {"workspace_id": workspace_id, "requested_by": str(current_user["_id"]), "goal_ids": payload.goal_ids, "purpose": payload.purpose, "watermark": watermark, "created_at": now}
    result = executive_export_audit_collection.insert_one(audit)
    return {"export_id": str(result.inserted_id), "status": "queued", "watermark": watermark, "audited": True}
