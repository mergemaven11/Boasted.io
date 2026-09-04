"""Entitlement coverage for the temporary open-Pro access window."""
import app.plans as plans


def test_open_access_grants_ordinary_pro_interview_tools(monkeypatch):
    """All customer plans receive ordinary Pro tools while open access is enabled."""
    monkeypatch.setattr(plans, "OPEN_PRO_ACCESS", True)
    assert plans.get_entitlements_for_user({"plan": "free", "email": "free@example.com"})["interview_practice"] is True
    assert plans.get_entitlements_for_user({"plan": "pro", "email": "pro@example.com"})["interview_practice"] is True
    assert plans.get_entitlements_for_user({"plan": "team", "email": "team@example.com"})["interview_practice"] is True
    assert plans.get_entitlements_for_user({"plan": "enterprise", "email": "enterprise@example.com"})["interview_practice"] is True


def test_open_access_does_not_grant_enterprise_or_founder_features(monkeypatch):
    """Public users get Pro, never Enterprise/internal entitlements."""
    monkeypatch.setattr(plans, "OPEN_PRO_ACCESS", True)
    entitlements = plans.get_entitlements_for_user({"plan": "free", "email": "person@example.com"})
    assert entitlements["advanced_reports"] is True
    assert entitlements["resume_builder"] is True
    assert entitlements["executive_command_center"] is False
    assert entitlements["audit_logs"] is False
    assert entitlements["sso"] is False


def test_plan_gating_can_be_restored_with_the_flag(monkeypatch):
    """Turning open access off restores the persisted plan rules."""
    monkeypatch.setattr(plans, "OPEN_PRO_ACCESS", False)
    assert plans.get_entitlements_for_user({"plan": "free", "email": "free@example.com"})["interview_practice"] is False
    assert plans.get_entitlements_for_user({"plan": "pro", "email": "pro@example.com"})["interview_practice"] is True


def test_internal_users_keep_interview_practice_access(monkeypatch):
    """Internal users keep their separately gated staff access."""
    monkeypatch.setattr(plans, "OPEN_PRO_ACCESS", True)
    user = {
        "plan": "free",
        "email": "staff@usebragstack.com",
        "email_verification_required": False,
    }
    entitlements = plans.get_entitlements_for_user(user)
    assert entitlements["interview_practice"] is True
    assert entitlements["executive_command_center"] is True
