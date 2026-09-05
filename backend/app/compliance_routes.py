"""Internal legal/compliance readiness auditing for BragStack Ops.

This module is intentionally conservative. It records evidence and gaps; it does
not certify that BragStack is legally compliant and must not be presented as a
substitute for qualified legal or tax advice.
"""
from __future__ import annotations

import hashlib
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.errors import PyMongoError

from app.ai.runtime import record_intelligence_outcome
from app.database import compliance_audit_runs_collection, users_collection
from app.ops_routes import require_internal_role

router = APIRouter(prefix="/ops/compliance", tags=["ops-compliance"])

RULE_PACK_VERSION = "2026-09-05.2"
STATUS_ORDER = {
    "gap": 5,
    "counsel_review": 4,
    "needs_evidence": 3,
    "upcoming": 2,
    "pass": 1,
    "not_applicable": 0,
}
SEVERITY_ORDER = {"blocker": 5, "high": 4, "medium": 3, "low": 2, "info": 1}


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _source(
    *,
    authority: str,
    title: str,
    url: str,
    jurisdiction: str,
    effective_date: str | None = None,
    last_verified: str = "2026-09-05",
) -> dict[str, Any]:
    return {
        "authority": authority,
        "title": title,
        "url": url,
        "jurisdiction": jurisdiction,
        "effective_date": effective_date,
        "last_verified": last_verified,
    }


SOURCES = {
    "ga_renewal": _source(
        authority="Georgia Attorney General",
        title="Online Automatic Renewal Transparency Act",
        url="https://law.georgia.gov/press-releases/2025-05-13/consumer-alert-new-online-automatic-renewal-transparency-act",
        jurisdiction="Georgia",
        effective_date="2025-01-01",
    ),
    "ga_formation": _source(
        authority="Georgia Secretary of State",
        title="Register a Business",
        url="https://sos.ga.gov/how-to-guide/how-guide-register-business",
        jurisdiction="Georgia",
    ),
    "irs_ein": _source(
        authority="Internal Revenue Service",
        title="Employer Identification Number (EIN)",
        url="https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers",
        jurisdiction="United States",
    ),
    "ftc_coppa": _source(
        authority="Federal Trade Commission",
        title="Children's Online Privacy Protection Rule",
        url="https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa",
        jurisdiction="United States",
    ),
    "ftc_can_spam": _source(
        authority="Federal Trade Commission",
        title="CAN-SPAM Act: A Compliance Guide for Business",
        url="https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business",
        jurisdiction="United States",
    ),
    "ftc_ads": _source(
        authority="Federal Trade Commission",
        title="Advertising and Marketing Basics",
        url="https://www.ftc.gov/business-guidance/advertising-marketing",
        jurisdiction="United States",
    ),
    "ftc_security": _source(
        authority="Federal Trade Commission",
        title="Start with Security: A Guide for Business",
        url="https://www.ftc.gov/business-guidance/resources/start-security-guide-business",
        jurisdiction="United States",
    ),
    "ga_ai": _source(
        authority="Georgia General Assembly",
        title="Act 518 / SB 540 — Artificial Intelligence Accountability Act",
        url="https://www.legis.ga.gov/legislation/71462",
        jurisdiction="Georgia",
        effective_date="2027-07-01",
    ),
}


def _finding(
    *,
    control_id: str,
    category: str,
    title: str,
    status: str,
    severity: str,
    summary: str,
    evidence: list[str],
    next_action: str,
    source_keys: list[str] | None = None,
    counsel_required: bool = False,
    affected_action: str = "General business readiness",
    site_pause_required: bool = False,
) -> dict[str, Any]:
    return {
        "control_id": control_id,
        "category": category,
        "title": title,
        "status": status,
        "severity": severity,
        "summary": summary,
        "evidence": evidence,
        "next_action": next_action,
        "counsel_required": counsel_required,
        "affected_action": affected_action,
        "site_pause_required": site_pause_required,
        "sources": [SOURCES[key] for key in (source_keys or [])],
    }


def _collect_facts() -> dict[str, Any]:
    """Collect only low-sensitivity facts needed for the readiness audit."""
    total_users = users_collection.count_documents({})
    users_with_terms = users_collection.count_documents({"terms_accepted_at": {"$exists": True, "$nin": [None, ""]}})
    users_with_privacy = users_collection.count_documents({"privacy_accepted_at": {"$exists": True, "$nin": [None, ""]}})
    persisted_pro_accounts = users_collection.count_documents({"plan": "pro"})
    paid_recurring_subscribers = users_collection.count_documents(
        {
            "stripe_subscription_id": {"$exists": True, "$nin": [None, ""]},
            "billing_status": {"$in": ["active", "trialing", "past_due"]},
        }
    )
    return {
        "total_users": total_users,
        "users_with_terms_acceptance": users_with_terms,
        "users_with_privacy_acknowledgement": users_with_privacy,
        "persisted_pro_accounts": persisted_pro_accounts,
        "paid_recurring_subscribers": paid_recurring_subscribers,
        "temporary_pro_gift_enabled": _env_bool("BRAGSTACK_TEMPORARY_PRO_GIFT_ENABLED", True),
        "legal_entity_formed": _env_bool("BRAGSTACK_LEGAL_ENTITY_FORMED", False),
        "ein_obtained": _env_bool("BRAGSTACK_EIN_OBTAINED", False),
        "customer_legal_package_counsel_reviewed": _env_bool("BRAGSTACK_LEGAL_PACKAGE_COUNSEL_REVIEWED", False),
        "georgia_renewal_flow_production_verified": _env_bool("BRAGSTACK_GEORGIA_RENEWAL_FLOW_VERIFIED", False),
        "vendor_inventory_verified": _env_bool("BRAGSTACK_VENDOR_INVENTORY_VERIFIED", False),
        "retention_jobs_verified": _env_bool("BRAGSTACK_RETENTION_JOBS_VERIFIED", False),
        "drive_compliance_evidence_verified": _env_bool("BRAGSTACK_DRIVE_COMPLIANCE_EVIDENCE_VERIFIED", False),
        "commercial_email_controls_verified": _env_bool("BRAGSTACK_COMMERCIAL_EMAIL_CONTROLS_VERIFIED", False),
        "marketing_claim_review_verified": _env_bool("BRAGSTACK_MARKETING_CLAIM_REVIEW_VERIFIED", False),
        "accepting_investment": _env_bool("BRAGSTACK_ACCEPTING_INVESTMENT", False),
        "employer_facing_ai_decisions_enabled": _env_bool("BRAGSTACK_EMPLOYER_AI_DECISIONS_ENABLED", False),
    }


def evaluate_controls(facts: dict[str, Any]) -> list[dict[str, Any]]:
    """Evaluate deterministic readiness controls from a sanitized facts snapshot."""
    findings: list[dict[str, Any]] = []

    entity_formed = bool(facts.get("legal_entity_formed"))
    findings.append(_finding(
        control_id="BUS-CORP-001",
        category="Corporate foundation",
        title="Legal entity formation and governing records",
        status="pass" if entity_formed else "gap",
        severity="info" if entity_formed else "high",
        summary=(
            "A legal-entity formation signal is present. Formation documents still belong in the controlled data room."
            if entity_formed
            else "No BragStack legal-entity formation evidence is configured. This is a business-readiness gap, not a finding that the public beta must be taken offline."
        ),
        evidence=[f"BRAGSTACK_LEGAL_ENTITY_FORMED={entity_formed}"],
        next_action=(
            "Store verified formation, governing, registered-agent, and good-standing records and have counsel confirm the structure."
            if entity_formed
            else "Before accepting investment, issuing equity, or signing material company contracts, form the entity and preserve the filed documents with qualified counsel guidance."
        ),
        source_keys=["ga_formation"],
        counsel_required=not entity_formed,
        affected_action="Investment, equity issuance, and material company contracts",
    ))

    ein_obtained = bool(facts.get("ein_obtained"))
    findings.append(_finding(
        control_id="BUS-TAX-001",
        category="Tax and identity",
        title="EIN and tax identity evidence",
        status="pass" if ein_obtained else "needs_evidence",
        severity="high" if not ein_obtained else "info",
        summary="EIN evidence is configured." if ein_obtained else "No EIN evidence is configured for this audit.",
        evidence=[f"BRAGSTACK_EIN_OBTAINED={ein_obtained}"],
        next_action="Obtain/store the IRS EIN confirmation when required and keep tax identifiers out of ordinary Ops receipts.",
        source_keys=["irs_ein"],
        affected_action="Business tax identity and formal company operations",
    ))

    total_users = int(facts.get("total_users") or 0)
    terms_users = int(facts.get("users_with_terms_acceptance") or 0)
    privacy_users = int(facts.get("users_with_privacy_acknowledgement") or 0)
    missing_consent_records = max(total_users - min(terms_users, privacy_users), 0)
    findings.append(_finding(
        control_id="PRIV-CONSENT-001",
        category="Privacy and contracting",
        title="Terms and privacy acceptance audit trail",
        status="pass" if total_users > 0 and missing_consent_records == 0 else "needs_evidence",
        severity="medium" if missing_consent_records else "info",
        summary=(
            "All currently stored users have both Terms and Privacy acceptance timestamps."
            if total_users and missing_consent_records == 0
            else f"{missing_consent_records} stored account(s) do not show both acceptance timestamps in the simple audit query. Legacy/OAuth handling may require separate review."
        ),
        evidence=[f"users={total_users}", f"terms_timestamps={terms_users}", f"privacy_timestamps={privacy_users}"],
        next_action="Preserve document versions and server-side acceptance times; have counsel decide whether legacy accounts need re-attestation.",
        counsel_required=missing_consent_records > 0,
        affected_action="Account contracting and privacy notice evidence",
    ))

    renewal_verified = bool(facts.get("georgia_renewal_flow_production_verified"))
    paid_subscribers = int(facts.get("paid_recurring_subscribers") or 0)
    persisted_pro_accounts = int(facts.get("persisted_pro_accounts") or 0)
    gift_enabled = bool(facts.get("temporary_pro_gift_enabled"))
    renewal_status = "pass" if renewal_verified else ("gap" if paid_subscribers > 0 else "needs_evidence")
    findings.append(_finding(
        control_id="BILL-GA-001",
        category="Subscription billing",
        title="Georgia automatic-renewal production proof",
        status=renewal_status,
        severity="high" if paid_subscribers > 0 and not renewal_verified else ("info" if renewal_verified else "medium"),
        summary=(
            "The production renewal-flow verification flag is set."
            if renewal_verified
            else (
                "Active paid recurring subscription records exist, so the live renewal flow still needs production verification."
                if paid_subscribers > 0
                else "No active paid recurring subscription record was detected. Complimentary Pro access is not treated as a paid subscription; verify the renewal flow before re-opening new paid checkout."
            )
        ),
        evidence=[
            f"paid_recurring_subscribers={paid_subscribers}",
            f"persisted_pro_accounts={persisted_pro_accounts}",
            f"temporary_pro_gift_enabled={gift_enabled}",
            f"production_verified={renewal_verified}",
        ],
        next_action="Before offering new recurring paid checkout, verify the live pre-purchase disclosure, affirmative consent, retainable acknowledgement, charge notices, material-change notices, and electronic cancellation path; preserve screenshots/test evidence.",
        source_keys=["ga_renewal"],
        counsel_required=True,
        affected_action="New recurring paid subscriptions",
    ))

    counsel_reviewed = bool(facts.get("customer_legal_package_counsel_reviewed"))
    findings.append(_finding(
        control_id="LEGAL-PACKAGE-001",
        category="Customer legal package",
        title="Terms, Privacy, notices, and product claims reviewed by counsel",
        status="pass" if counsel_reviewed else "counsel_review",
        severity="high",
        summary="Customer-facing legal package is marked counsel-reviewed." if counsel_reviewed else "Customer-facing legal documents remain product drafts until qualified counsel reviews the actual business and flows.",
        evidence=[f"counsel_reviewed={counsel_reviewed}"],
        next_action="Have startup/privacy counsel review entity naming, contact details, eligibility/capacity, privacy, subscription, disputes, refunds/tax, accessibility/e-contracting, AI, and multi-state exposure.",
        counsel_required=not counsel_reviewed,
        affected_action="Legal launch readiness and future paid/commercial expansion",
    ))

    vendor_verified = bool(facts.get("vendor_inventory_verified"))
    findings.append(_finding(
        control_id="PRIV-VENDOR-001",
        category="Vendors and data processing",
        title="Production vendor/subprocessor inventory",
        status="pass" if vendor_verified else "needs_evidence",
        severity="medium",
        summary="Vendor inventory is marked verified." if vendor_verified else "The audit has no verified production vendor/subprocessor inventory snapshot.",
        evidence=[f"vendor_inventory_verified={vendor_verified}"],
        next_action="Inventory hosting, database, auth, email, analytics, AI, payments, observability, and storage providers; reconcile contracts/DPA/security terms with actual data flows.",
        source_keys=["ftc_security"],
        affected_action="Vendor governance and privacy/security evidence",
    ))

    retention_verified = bool(facts.get("retention_jobs_verified"))
    findings.append(_finding(
        control_id="PRIV-RETENTION-001",
        category="Data lifecycle",
        title="Retention/deletion behavior matches policy promises",
        status="pass" if retention_verified else "needs_evidence",
        severity="high",
        summary="Retention jobs are marked production-verified." if retention_verified else "Retention/deletion promises have not been marked verified against production jobs, storage, and relevant backups.",
        evidence=[f"retention_jobs_verified={retention_verified}"],
        next_action="Run evidence tests for verifier contact expiry, account deletion, generated artifacts, logs, and backups; attach the results to the audit receipt.",
        source_keys=["ftc_security"],
        affected_action="Production data lifecycle assurances",
    ))

    drive_verified = bool(facts.get("drive_compliance_evidence_verified"))
    findings.append(_finding(
        control_id="GOV-DRIVE-001",
        category="Governance and evidence",
        title="Controlled legal/compliance data-room evidence",
        status="pass" if drive_verified else "needs_evidence",
        severity="high",
        summary="Drive compliance evidence is marked verified." if drive_verified else "No in-app proof confirms that the controlled Drive compliance folder contains current, versioned evidence.",
        evidence=[f"drive_compliance_evidence_verified={drive_verified}"],
        next_action="Use an explicitly authorized read-only Drive evidence integration or manually attest a reviewed snapshot. Do not grant broad Drive scopes just to make this check green.",
        affected_action="Diligence and governance evidence",
    ))

    email_verified = bool(facts.get("commercial_email_controls_verified"))
    findings.append(_finding(
        control_id="MKT-EMAIL-001",
        category="Marketing communications",
        title="Commercial email controls",
        status="pass" if email_verified else "needs_evidence",
        severity="medium",
        summary="Commercial-email controls are marked verified." if email_verified else "The audit has no evidence that commercial outreach templates and sending workflows were verified end-to-end.",
        evidence=[f"commercial_email_controls_verified={email_verified}"],
        next_action="Verify truthful routing/subject information, required identification/address disclosures, a working opt-out, timely suppression, and vendor compliance for commercial email.",
        source_keys=["ftc_can_spam"],
        affected_action="Commercial outreach campaigns",
    ))

    claims_verified = bool(facts.get("marketing_claim_review_verified"))
    findings.append(_finding(
        control_id="MKT-CLAIMS-001",
        category="Marketing and investor claims",
        title="Claims are supportable and evidence-backed",
        status="pass" if claims_verified else "needs_evidence",
        severity="medium",
        summary="Marketing-claim review is marked verified." if claims_verified else "No current evidence review is recorded for marketing, traction, testimonial, verification, or investor claims.",
        evidence=[f"marketing_claim_review_verified={claims_verified}"],
        next_action="Require evidence for measurable claims, avoid guarantees, and separately review testimonials/reviews and investor statements before publication.",
        source_keys=["ftc_ads"],
        affected_action="Public marketing and investor claims",
    ))

    findings.append(_finding(
        control_id="MINORS-COPPA-001",
        category="Age and younger users",
        title="Younger-user and COPPA applicability assessment",
        status="counsel_review",
        severity="high",
        summary="Account eligibility is not the same thing as a completed minors/privacy applicability analysis. BragStack should not infer COPPA compliance from the absence of a dedicated child experience.",
        evidence=["Requires audience, actual-knowledge, feature, data-flow, and jurisdiction facts."],
        next_action="Before intentionally targeting children/younger teens, have counsel evaluate COPPA plus applicable state minor/student/AI rules and define age-assurance/parental controls where required.",
        source_keys=["ftc_coppa"],
        counsel_required=True,
        affected_action="Intentional child/younger-teen targeting and child-specific experiences",
    ))

    findings.append(_finding(
        control_id="AI-GA-2027-001",
        category="AI governance",
        title="Georgia AI Act 2027 readiness",
        status="upcoming",
        severity="medium",
        summary="Georgia Act 518 / SB 540 has a future effective date and includes requirements relevant to some conversational-AI/minor/privacy/safety uses.",
        evidence=["effective_date=2027-07-01"],
        next_action="Complete an applicability review and implementation plan well before July 1, 2027; do not wait for the effective date.",
        source_keys=["ga_ai"],
        counsel_required=True,
        affected_action="Future Georgia AI feature compliance",
    ))

    employer_ai = bool(facts.get("employer_facing_ai_decisions_enabled"))
    findings.append(_finding(
        control_id="AI-EMPLOYMENT-001",
        category="AI governance",
        title="Employer-facing hiring/decision AI release gate",
        status="gap" if employer_ai else "not_applicable",
        severity="blocker" if employer_ai else "info",
        summary="Employer-facing AI decision functionality is enabled without a recorded employment/AI legal review." if employer_ai else "No employer-facing AI decision functionality is declared enabled in the current audit facts.",
        evidence=[f"employer_facing_ai_decisions_enabled={employer_ai}"],
        next_action="Do not ship candidate screening/ranking/hiring recommendations until a separate employment/AI legal review and bias/governance control set is complete.",
        counsel_required=employer_ai,
        affected_action="Employer-facing candidate screening, ranking, or hiring recommendations",
    ))

    accepting_investment = bool(facts.get("accepting_investment"))
    if accepting_investment and not entity_formed:
        fundraise_status, fundraise_severity = "gap", "blocker"
    else:
        fundraise_status, fundraise_severity = "counsel_review", "high"
    findings.append(_finding(
        control_id="FUND-SEC-001",
        category="Fundraising and securities",
        title="Financing legal gate",
        status=fundraise_status,
        severity=fundraise_severity,
        summary=(
            "Investment acceptance is flagged on while entity formation is not verified."
            if accepting_investment and not entity_formed
            else "Fundraising documents, approvals, securities exemptions/notices, cap table, and investor claims require qualified counsel before accepting funds."
        ),
        evidence=[f"accepting_investment={accepting_investment}", f"legal_entity_formed={entity_formed}"],
        next_action="Before accepting outside investment or issuing securities, complete entity/governance/IP/cap-table cleanup and have counsel approve the financing instrument and required filings/notices.",
        counsel_required=True,
        affected_action="Accepting investment or issuing securities",
    ))

    return findings


def _canonical_hash(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _summary(findings: list[dict[str, Any]]) -> dict[str, Any]:
    by_status: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for finding in findings:
        by_status[finding["status"]] = by_status.get(finding["status"], 0) + 1
        by_severity[finding["severity"]] = by_severity.get(finding["severity"], 0) + 1

    blockers = [
        finding["control_id"]
        for finding in findings
        if finding["severity"] == "blocker" and finding["status"] == "gap"
    ]
    site_pause_controls = [
        finding["control_id"]
        for finding in findings
        if finding.get("site_pause_required") and finding["status"] == "gap"
    ]
    restricted_actions = [
        finding.get("affected_action")
        for finding in findings
        if finding["severity"] == "blocker" and finding["status"] == "gap" and finding.get("affected_action")
    ]
    highest = max(
        findings,
        key=lambda item: (STATUS_ORDER.get(item["status"], 0), SEVERITY_ORDER.get(item["severity"], 0)),
        default=None,
    )
    billing = next((item for item in findings if item["control_id"] == "BILL-GA-001"), None)
    corporate = next((item for item in findings if item["control_id"] == "BUS-CORP-001"), None)
    financing = next((item for item in findings if item["control_id"] == "FUND-SEC-001"), None)

    if billing and billing["status"] == "pass":
        paid_launch_posture = "verified"
    elif billing and "paid_recurring_subscribers=0" in billing.get("evidence", []):
        paid_launch_posture = "verify_before_paid_launch"
    else:
        paid_launch_posture = "pause_new_paid_checkout"

    fundraising_posture = (
        "reviewed"
        if corporate and corporate["status"] == "pass" and financing and financing["status"] == "pass"
        else "hold_until_legal_ready"
    )

    return {
        "by_status": by_status,
        "by_severity": by_severity,
        "blockers": blockers,
        "site_pause_required": bool(site_pause_controls),
        "site_pause_controls": site_pause_controls,
        "restricted_actions": restricted_actions,
        "beta_posture": "pause_site" if site_pause_controls else "continue_beta",
        "beta_posture_reason": (
            "At least one control explicitly requires a site-wide pause."
            if site_pause_controls
            else "No current scanner rule requires taking the public beta offline. Resolve findings according to the specific action each control affects."
        ),
        "paid_launch_posture": paid_launch_posture,
        "fundraising_posture": fundraising_posture,
        "overall": "critical_actions" if blockers else (
            "action_required"
            if any(item["status"] in {"gap", "counsel_review", "needs_evidence"} for item in findings)
            else "ready"
        ),
        "highest_attention_control": highest["control_id"] if highest else None,
    }


def _serialize_run(document: dict[str, Any]) -> dict[str, Any]:
    result = {key: value for key, value in document.items() if key != "_id"}
    if isinstance(result.get("generated_at"), datetime):
        result["generated_at"] = result["generated_at"].isoformat()
    return result


@router.get("/catalog")
def compliance_catalog(current_user: dict = Depends(require_internal_role("ops", "security", "admin"))):
    """Return source metadata and status vocabulary without asserting compliance."""
    del current_user
    return {
        "rule_pack_version": RULE_PACK_VERSION,
        "status_vocabulary": ["pass", "gap", "needs_evidence", "counsel_review", "upcoming", "not_applicable"],
        "disclaimer": "Operational readiness audit only. This is not a legal certification or substitute for qualified legal/tax advice.",
        "sources": list(SOURCES.values()),
    }


@router.post("/audits")
def run_compliance_audit(current_user: dict = Depends(require_internal_role("ops", "security", "admin"))):
    """Run a conservative audit and persist a timestamped, integrity-hashed receipt."""
    generated_at = datetime.now(timezone.utc)
    try:
        facts = _collect_facts()
        findings = evaluate_controls(facts)
        receipt = {
            "receipt_id": f"cmp_{generated_at.strftime('%Y%m%dT%H%M%SZ')}_{uuid.uuid4().hex[:10]}",
            "generated_at": generated_at,
            "rule_pack_version": RULE_PACK_VERSION,
            "environment": os.getenv("ENVIRONMENT") or os.getenv("APP_ENV") or ("production" if os.getenv("RENDER") else "local"),
            "app_version": os.getenv("RENDER_GIT_COMMIT", os.getenv("GIT_SHA", "unknown")),
            "actor_user_id": str(current_user.get("_id", "")),
            "actor_email": (current_user.get("email") or "").strip().lower(),
            "facts": facts,
            "findings": findings,
            "summary": _summary(findings),
            "disclaimer": "Evidence/readiness receipt only. It does not certify legal compliance, determine whether operating the site is lawful, or replace qualified counsel or tax advice.",
        }
        integrity_payload = {key: value for key, value in receipt.items() if key not in {"integrity_sha256"}}
        receipt["integrity_sha256"] = _canonical_hash(integrity_payload)
        compliance_audit_runs_collection.insert_one(dict(receipt))
        actionable = [
            finding for finding in findings
            if finding.get("status") in {"gap", "counsel_review", "needs_evidence"}
        ]
        record_intelligence_outcome(
            feature="compliance_intelligence",
            task="whole_business_audit",
            violations=[f"compliance:{item['control_id']}:{item['status']}" for item in actionable],
            model_id=RULE_PACK_VERSION,
            schema_version=RULE_PACK_VERSION,
            source_count=len(facts),
            generated_item_count=len(findings),
            user_id=str(current_user.get("_id", "")),
        )
        return _serialize_run(receipt)
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="Compliance audit storage is unavailable.") from exc


@router.get("/audits/latest")
def latest_compliance_audit(current_user: dict = Depends(require_internal_role("ops", "security", "admin"))):
    del current_user
    try:
        document = compliance_audit_runs_collection.find_one({}, sort=[("generated_at", -1)])
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="Compliance audit storage is unavailable.") from exc
    return _serialize_run(document) if document else None


@router.get("/audits")
def list_compliance_audits(
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(require_internal_role("ops", "security", "admin")),
):
    del current_user
    try:
        rows = list(compliance_audit_runs_collection.find({}).sort("generated_at", -1).limit(limit))
    except PyMongoError as exc:
        raise HTTPException(status_code=503, detail="Compliance audit storage is unavailable.") from exc
    return {"receipts": [_serialize_run(row) for row in rows]}
