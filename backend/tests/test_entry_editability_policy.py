"""Regression tests for accomplishment editability policy."""

from types import SimpleNamespace

import app.main as main


def test_put_entry_is_not_blocked_by_usage_dependency():
    """Existing accomplishments remain editable regardless of age."""
    request = SimpleNamespace(
        method="PUT",
        url=SimpleNamespace(path="/entries/64f000000000000000000001"),
    )
    current_user = {"_id": "64f000000000000000000000"}

    assert main.enforce_entry_usage(request, current_user) is None
