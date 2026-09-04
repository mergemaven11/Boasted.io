"""Regression coverage for Proof Profile Open to Talk settings."""

import pytest
from pydantic import ValidationError

from app.profile_connection_routes import ProfileConnectionUpdate, serialize_connection_settings


def test_disabled_public_connection_hides_stored_contact_data():
    """Disabled Open to Talk must not leak contact details publicly."""
    user = {
        "open_to_talk": False,
        "open_to_talk_url": "https://example.com/private-booking",
        "open_to_talk_note": "Stored but disabled",
        "open_to_talk_types": ["recruiter-chat"],
    }

    assert serialize_connection_settings(user, public=True) == {
        "open_to_talk": False,
        "open_to_talk_url": "",
        "open_to_talk_note": "",
        "open_to_talk_types": [],
        "calendly_enabled": False,
        "calendly_url": "",
    }


def test_enabled_public_connection_exposes_only_connection_settings():
    """Enabled settings expose only the explicit connection payload."""
    user = {
        "open_to_talk": True,
        "open_to_talk_url": "https://cal.example.com/tee",
        "open_to_talk_note": "Open to platform engineering conversations.",
        "open_to_talk_types": ["technical-deep-dive", "networking"],
        "email": "must-not-leak@example.com",
    }

    assert serialize_connection_settings(user, public=True) == {
        "open_to_talk": True,
        "open_to_talk_url": "https://cal.example.com/tee",
        "open_to_talk_note": "Open to platform engineering conversations.",
        "open_to_talk_types": ["technical-deep-dive", "networking"],
        "calendly_enabled": False,
        "calendly_url": "",
    }


def test_connection_update_rejects_unknown_conversation_type():
    """Only the allow-listed conversation types may be persisted."""
    with pytest.raises(ValidationError):
        ProfileConnectionUpdate(
            open_to_talk=True,
            open_to_talk_url="https://example.com/contact",
            open_to_talk_types=["anything-goes"],
        )


def test_connection_update_rejects_non_web_url():
    """Contact destinations must use normal HTTP(S) URLs."""
    with pytest.raises(ValidationError):
        ProfileConnectionUpdate(
            open_to_talk=True,
            open_to_talk_url="javascript:alert(1)",
        )
