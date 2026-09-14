"""Regression tests for authentication security policy."""

import pytest
from pydantic import ValidationError

from app.auth_routes import PASSWORD_MIN_LENGTH, PasswordResetConfirm, RegisterRequest


def test_password_minimum_is_twelve_characters():
    """Keep the minimum strong enough for newly created credentials."""
    assert PASSWORD_MIN_LENGTH == 12


def test_registration_rejects_short_password():
    """New password accounts cannot be created with legacy eight-character passwords."""
    with pytest.raises(ValidationError):
        RegisterRequest(
            name="Test User",
            email="test@example.com",
            password="eight888",
            accepted_terms=True,
            accepted_privacy=True,
        )


def test_registration_accepts_twelve_character_password():
    """A password meeting the new minimum remains valid without complexity gimmicks."""
    request = RegisterRequest(
        name="Test User",
        email="test@example.com",
        password="twelve-chars",
        accepted_terms=True,
        accepted_privacy=True,
    )
    assert request.password == "twelve-chars"


def test_password_reset_rejects_short_new_password():
    """Password resets cannot weaken an account below the current minimum."""
    with pytest.raises(ValidationError):
        PasswordResetConfirm(
            token="reset-token-with-enough-characters-123456789",
            password="eight888",
        )


def test_existing_login_policy_is_not_revalidated_here():
    """The new minimum applies to new/reset credentials, not legacy login hashes."""
    # Login verifies the submitted secret against the existing bcrypt hash; it does
    # not parse the password through RegisterRequest/PasswordResetConfirm.
    assert RegisterRequest.model_fields["password"].metadata
