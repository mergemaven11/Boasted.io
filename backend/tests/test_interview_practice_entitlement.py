"""Document this first-party Python module."""
from app.plans import get_entitlements_for_user


def test_interview_practice_is_pro_only():
    """Verify interview practice is pro only."""
    assert get_entitlements_for_user({"plan": "free", "email": "free@example.com"})["interview_practice"] is False
    assert get_entitlements_for_user({"plan": "pro", "email": "pro@example.com"})["interview_practice"] is True
    assert get_entitlements_for_user({"plan": "team", "email": "team@example.com"})["interview_practice"] is True
    assert get_entitlements_for_user({"plan": "enterprise", "email": "enterprise@example.com"})["interview_practice"] is True


def test_internal_users_keep_interview_practice_access():
    """Verify internal users keep interview practice access."""
    user = {
        "plan": "free",
        "email": "staff@usebragstack.com",
        "email_verification_required": False,
    }
    assert get_entitlements_for_user(user)["interview_practice"] is True
