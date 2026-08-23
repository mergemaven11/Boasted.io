import os

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.auth import get_current_user
from app.auth_routes import router as auth_router
from app.oauth_routes import router as oauth_router
from app.billing_routes import router as billing_router
from app.beta_metrics_routes import router as beta_metrics_router
from app.certification_packet_export_routes import router as certification_packet_export_router
from app.certification_packet_routes import router as certification_packet_router
from app.core_output_routes import router as core_output_router
from app.database import entries_collection, impact_receipts_collection
from app.impact_receipt_routes import router as impact_receipts_router
from app.interview_packet_export_routes import router as interview_packet_export_router
from app.interview_packet_routes import router as interview_packet_router
from app.packet_audit_routes import router as packet_audit_router
from app.packet_platform_export_routes import router as packet_platform_export_router
from app.packet_platform_routes import router as packet_platform_router
from app.packet_share_routes import router as packet_share_router
from app.performance_packet_export_routes import router as performance_packet_export_router
from app.performance_packet_routes import router as performance_packet_router
from app.plans import enforce_usage_limit, require_feature
from app.promotion_packet_export_routes import router as promotion_packet_export_router
from app.promotion_packet_routes import router as promotion_packet_router
from app.public_slug_routes import router as public_slug_router
from app.reports_routes import router as reports_router
from app.routes import public_router, router as entries_router


app = FastAPI(
    title="BragStack API",
    description="Evidence-backed career proof for accomplishments, impact, and reports.",
    version="1.0.0",
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.app\.github\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def enforce_entry_usage(request: Request, current_user: dict = Depends(get_current_user)):
    if request.method != "POST" or request.url.path.rstrip("/") != "/entries":
        return
    user_id = str(current_user["_id"])
    enforce_usage_limit(
        user=current_user,
        entitlement_name="max_entries",
        current_count=entries_collection.count_documents({"user_id": user_id}),
        resource_name="proof entries",
    )


def enforce_receipt_usage(request: Request, current_user: dict = Depends(get_current_user)):
    path = request.url.path.rstrip("/")
    is_create = request.method == "POST" and (
        path == "/impact-receipts" or path.startswith("/impact-receipts/from-entry/")
    )
    if not is_create:
        return

    user_id = str(current_user["_id"])
    enforce_usage_limit(
        user=current_user,
        entitlement_name="max_impact_receipts",
        current_count=impact_receipts_collection.count_documents({"user_id": user_id}),
        resource_name="Impact Receipts",
    )


def require_advanced_reports(current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "advanced_reports")


def require_performance_builder(current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "performance_review_builder")


def require_promotion_packet(current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "promotion_packet")


def require_interview_packet(current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "interview_packet")


def require_certification_packet(current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "certification_packet")


def require_pdf_export(current_user: dict = Depends(get_current_user)):
    require_feature(current_user, "export_pdf")


app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(billing_router)
app.include_router(entries_router, dependencies=[Depends(enforce_entry_usage)])
app.include_router(public_router)
app.include_router(public_slug_router)
app.include_router(impact_receipts_router, dependencies=[Depends(enforce_receipt_usage)])
app.include_router(core_output_router, dependencies=[Depends(require_performance_builder)])
app.include_router(beta_metrics_router)
app.include_router(reports_router, dependencies=[Depends(require_advanced_reports)])
app.include_router(performance_packet_router, dependencies=[Depends(require_performance_builder)])
app.include_router(performance_packet_export_router, dependencies=[Depends(require_pdf_export)])
app.include_router(packet_platform_router, dependencies=[Depends(require_performance_builder)])
app.include_router(packet_platform_export_router, dependencies=[Depends(require_pdf_export)])
app.include_router(packet_audit_router, dependencies=[Depends(require_performance_builder)])
app.include_router(packet_share_router, dependencies=[Depends(require_performance_builder)])
app.include_router(promotion_packet_router, dependencies=[Depends(require_promotion_packet)])
app.include_router(promotion_packet_export_router, dependencies=[Depends(require_pdf_export)])
app.include_router(interview_packet_router, dependencies=[Depends(require_interview_packet)])
app.include_router(interview_packet_export_router, dependencies=[Depends(require_pdf_export)])
app.include_router(certification_packet_router, dependencies=[Depends(require_certification_packet)])
app.include_router(certification_packet_export_router, dependencies=[Depends(require_pdf_export)])


@app.get("/")
def root():
    """Return a basic API health check."""
    return {"message": "BragStack API is running"}
