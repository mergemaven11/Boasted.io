"""Document this first-party Python module."""
from app.email_templates import (
    build_email_verification_html,
    build_password_reset_html,
    build_receipt_verification_html,
)


def test_account_verification_email_is_branded_and_has_secure_cta():
    """Verify account verification email is branded and has secure cta."""
    html = build_email_verification_html("https://boasted.io/login#verify_token=abc123")

    assert "Boasted" in html
    assert "Career proof, organized" in html
    assert "Verify email" in html
    assert "24 hours" in html
    assert "https://boasted.io/login#verify_token=abc123" in html
    assert "boasted.io" in html
    assert "BragStack" not in html
    assert "Boasted · Career proof, organized" in html
    assert "@media only screen and (max-width: 640px)" in html
    assert 'class="boasted-cta"' in html


def test_password_reset_email_is_branded_and_has_expiry_guidance():
    """Verify password reset email is branded and has expiry guidance."""
    html = build_password_reset_html("https://boasted.io/login#reset_token=abc123")

    assert "Boasted" in html
    assert "Choose a new password" in html
    assert "30 minutes" in html
    assert "current password remains unchanged" in html


def test_receipt_verification_email_is_branded_escapes_content_and_discloses_privacy_lifecycle():
    """Verify receipt verification email is branded escapes content and discloses privacy lifecycle."""
    html = build_receipt_verification_html(
        owner_name='Tee <script>alert("owner")</script>',
        verifier_name="Manager <b>Jane</b>",
        accomplishment="Reduced <unsafe> incidents by 30%",
        message="Please confirm <img src=x onerror=alert(1)>",
        url="https://boasted.io/verify-receipt?token=abc&next=<bad>",
    )

    assert "Impact Receipt" in html
    assert "Review &amp; respond" in html
    assert "No Boasted account" in html
    assert "7 days" in html
    assert "provided your contact details" in html
    assert "scheduled for automatic deletion" in html
    assert "minimum attestation details" in html
    assert "https://boasted.io/privacy" in html
    assert "<script>" not in html
    assert "<unsafe>" not in html
    assert "<img src=x" not in html
    assert "&lt;script&gt;" in html
    assert "&lt;unsafe&gt;" in html
    assert "&lt;img src=x onerror=alert(1)&gt;" in html
    assert "token=abc&amp;next=&lt;bad&gt;" in html
