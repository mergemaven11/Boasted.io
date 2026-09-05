from app.compliance_routes import _canonical_hash, _summary, evaluate_controls


def baseline_facts(**overrides):
    facts = {
        "total_users": 0,
        "users_with_terms_acceptance": 0,
        "users_with_privacy_acknowledgement": 0,
        "pro_subscribers": 0,
        "legal_entity_formed": False,
        "ein_obtained": False,
        "customer_legal_package_counsel_reviewed": False,
        "georgia_renewal_flow_production_verified": False,
        "vendor_inventory_verified": False,
        "retention_jobs_verified": False,
        "drive_compliance_evidence_verified": False,
        "commercial_email_controls_verified": False,
        "marketing_claim_review_verified": False,
        "accepting_investment": False,
        "employer_facing_ai_decisions_enabled": False,
    }
    facts.update(overrides)
    return facts


def finding(findings, control_id):
    return next(item for item in findings if item["control_id"] == control_id)


def test_unformed_entity_is_a_blocking_gap():
    findings = evaluate_controls(baseline_facts())
    corporate = finding(findings, "BUS-CORP-001")
    assert corporate["status"] == "gap"
    assert corporate["severity"] == "blocker"
    assert "BUS-CORP-001" in _summary(findings)["blockers"]
    assert _summary(findings)["overall"] == "blocked"


def test_paid_subscription_without_production_verification_is_gap():
    findings = evaluate_controls(baseline_facts(pro_subscribers=3))
    billing = finding(findings, "BILL-GA-001")
    assert billing["status"] == "gap"
    assert billing["severity"] == "high"
    assert "pro_subscribers=3" in billing["evidence"]


def test_verified_consent_timestamps_can_pass_simple_audit():
    findings = evaluate_controls(baseline_facts(
        total_users=12,
        users_with_terms_acceptance=12,
        users_with_privacy_acknowledgement=12,
    ))
    consent = finding(findings, "PRIV-CONSENT-001")
    assert consent["status"] == "pass"


def test_employer_ai_is_not_applicable_until_enabled():
    findings = evaluate_controls(baseline_facts())
    employer_ai = finding(findings, "AI-EMPLOYMENT-001")
    assert employer_ai["status"] == "not_applicable"
    assert employer_ai["severity"] == "info"


def test_employer_ai_becomes_blocker_when_enabled():
    findings = evaluate_controls(baseline_facts(employer_facing_ai_decisions_enabled=True))
    employer_ai = finding(findings, "AI-EMPLOYMENT-001")
    assert employer_ai["status"] == "gap"
    assert employer_ai["severity"] == "blocker"


def test_receipt_integrity_hash_is_stable_for_same_payload():
    payload = {"rule_pack_version": "test", "facts": {"a": 1}, "findings": [{"control_id": "X"}]}
    assert _canonical_hash(payload) == _canonical_hash(payload)
    assert len(_canonical_hash(payload)) == 64
