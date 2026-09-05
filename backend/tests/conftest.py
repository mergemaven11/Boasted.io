"""Shared pytest policy fixtures.

Most historical entitlement tests intentionally verify the underlying paid-plan
contract. Keep the temporary Pro promotion disabled for those tests so they
continue to protect the base-plan gates. Tests that exercise the promotional
grant explicitly opt back in by monkeypatching ``TEMPORARY_PRO_GIFT_ENABLED``
to ``True`` in their test body.
"""

import pytest

import app.plans as plans


@pytest.fixture(autouse=True)
def base_plan_policy_by_default(monkeypatch):
    """Test underlying plan rules unless a test explicitly enables the gift."""
    monkeypatch.setattr(plans, "TEMPORARY_PRO_GIFT_ENABLED", False)
