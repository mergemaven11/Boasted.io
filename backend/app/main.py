import os
import time
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import PyMongoError

from app.auth import get_current_user
from app.auth_routes import router as auth_router
from app.oauth_routes import router as oauth_router
from app.billing_routes import router as billing_router
from app.beta_metrics_routes import router as beta_metrics_router
from app.career_intelligence_routes import router as career_intelligence_router
from app.certification_packet_export_routes import router as certification_packet_export_router
from app.certification_packet_routes import router as certification_packet_router
from app.core_output_routes import router as core_output_router
from app.database import client as mongo_client, entries_collection, impact_receipts_collection
from app.impact_receipt_routes import router as impact_receipts_router
from app.receipt_verification_routes import router as receipt_verification_router
from app.interview_catalog_routes import router as interview_catalog_router
from app.interview_packet_export_routes import router as interview_packet_export_router
from app.interview_packet_routes import router as interview_packet_router
from app.observability import record_persistent_request
from app.ops_debug import new_request_id, record_request
from app.ops_routes import router as ops_router
from app.ops_user_routes import router as ops_user_router
from app.packet_audit_routes import router as packet_audit_router
from app.packet_platform_export_routes import router as packet_platform_export_router
from app.packet_platform_routes import router as packet_platform_router
from app.packet_share_routes import router as packet_share_router
from app.performance_packet_export_routes import router as performance_packet_export_router
from app.performance_packet_routes import router as performance_packet_router
from app.plans import enforce_usage_limit
from app.profile_media_routes import router as profile_media_router
from app.promotion_packet_export_routes import router as promotion_packet_export_router
from app.promotion_packet_routes import router as promotion_packet_router
from app.public_slug_routes import router as public_slug_router
from app.reports_routes import router as reports_router
from app.resume_builder_routes import router as resume_builder_router
from app.routes import public_router, router as entries_router

app = FastAPI(title="BragStack API", description="Evidence-backed career proof for accomplishments, impact, and reports.", version="1.0.0")
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
ENTRY_EDIT_WINDOW = timedelta(hours=1)
mongo_admin = mongo_client.admin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"https://.*\.app\.github\.dev",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"],
)

@app.middleware("http")
async def add_security_headers_and_telemetry(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or new_request_id()
    started = time.perf_counter(); status_code = 500
    try:
        response = await call_next(request); status_code = response.status_code
    except Exception as exc:
        duration_ms = (time.perf_counter() - started) * 1000
        record_request(request_id=request_id, method=request.method, path=request.url.path, status_code=500, duration_ms=duration_ms)
        record_persistent_request(request_id=request_id, method=request.method, path=request.url.path, status_code=500, duration_ms=duration_ms, error_type=type(exc).__name__)
        raise
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), microphone=()"
    if "cache-control" not in response.headers: response.headers["Cache-Control"] = "no-store"
    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    if request.url.scheme == "https" or forwarded_proto == "https": response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    duration_ms = (time.perf_counter() - started) * 1000
    record_request(request_id=request_id, method=request.method, path=request.url.path, status_code=status_code, duration_ms=duration_ms)
    record_persistent_request(request_id=request_id, method=request.method, path=request.url.path, status_code=status_code, duration_ms=duration_ms)
    return response

def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None: return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)

def enforce_entry_usage(request: Request, current_user: dict = Depends(get_current_user)):
    path=request.url.path.rstrip("/"); user_id=str(current_user["_id"])
    if request.method=="POST" and path=="/entries":
        enforce_usage_limit(user=current_user,entitlement_name="max_entries",current_count=entries_collection.count_documents({"user_id":user_id}),resource_name="proof entries"); return
    if request.method!="PUT" or not path.startswith("/entries/"): return
    entry_id=path.removeprefix("/entries/")
    if not ObjectId.is_valid(entry_id): return
    existing_entry=entries_collection.find_one({"_id":ObjectId(entry_id),"user_id":user_id},{"created_at":1})
    if not existing_entry: return
    created_at=existing_entry.get("created_at")
    if not isinstance(created_at,datetime): raise HTTPException(status_code=403,detail="This accomplishment can no longer be edited.")
    if datetime.now(timezone.utc)-_as_utc(created_at)>=ENTRY_EDIT_WINDOW: raise HTTPException(status_code=403,detail="The 60-minute edit window for this accomplishment has ended.")

def enforce_receipt_usage(request: Request, current_user: dict = Depends(get_current_user)):
    path=request.url.path.rstrip("/"); is_create=request.method=="POST" and (path=="/impact-receipts" or path.startswith("/impact-receipts/from-entry/"))
    if not is_create: return
    user_id=str(current_user["_id"]); enforce_usage_limit(user=current_user,entitlement_name="max_impact_receipts",current_count=impact_receipts_collection.count_documents({"user_id":user_id}),resource_name="Impact Receipts")

app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(profile_media_router)
app.include_router(billing_router)
app.include_router(entries_router, dependencies=[Depends(enforce_entry_usage)])
app.include_router(public_router)
app.include_router(public_slug_router)
app.include_router(impact_receipts_router, dependencies=[Depends(enforce_receipt_usage)])
app.include_router(receipt_verification_router)
app.include_router(core_output_router)
app.include_router(beta_metrics_router)
app.include_router(career_intelligence_router)
app.include_router(reports_router)
app.include_router(performance_packet_router)
app.include_router(performance_packet_export_router)
app.include_router(packet_platform_router)
app.include_router(packet_platform_export_router)
app.include_router(packet_audit_router)
app.include_router(packet_share_router)
app.include_router(promotion_packet_router)
app.include_router(promotion_packet_export_router)
app.include_router(interview_catalog_router)
app.include_router(interview_packet_router)
app.include_router(interview_packet_export_router)
app.include_router(certification_packet_router)
app.include_router(certification_packet_export_router)
app.include_router(resume_builder_router)
app.include_router(ops_router)
app.include_router(ops_user_router)

@app.get("/")
def root(): return {"message":"BragStack API is running"}
@app.head("/", include_in_schema=False)
def root_head(): return None
@app.get("/health")
def health(): return {"status": "ok"}
@app.get("/ready")
def ready():
    try: mongo_admin.command("ping")
    except PyMongoError as exc: raise HTTPException(status_code=503, detail="Service is not ready") from exc
    return {"status": "ready"}
