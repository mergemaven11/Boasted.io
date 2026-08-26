from html import escape


BRAND_NAME = "BragStack"
BRAND_URL = "https://usebragstack.com"


def _safe(value: str | None) -> str:
    return escape(str(value or ""), quote=True)


def _shell(*, preheader: str, eyebrow: str, title: str, intro: str, content_html: str, cta_label: str, cta_url: str, footnote: str) -> str:
    safe_preheader = _safe(preheader)
    safe_eyebrow = _safe(eyebrow)
    safe_title = _safe(title)
    safe_intro = _safe(intro)
    safe_cta_label = _safe(cta_label)
    safe_cta_url = _safe(cta_url)
    safe_footnote = _safe(footnote)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark light">
    <meta name="supported-color-schemes" content="dark light">
    <title>{safe_title}</title>
  </head>
  <body style="margin:0;padding:0;background:#020617;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e2e8f0;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{safe_preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#020617;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:34px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;">
            <tr>
              <td style="padding:0 4px 18px;text-align:left;">
                <div style="font-size:21px;line-height:1;font-weight:900;letter-spacing:-0.04em;color:#f8fafc;">Brag<span style="color:#93c5fd;">Stack</span></div>
                <div style="margin-top:7px;font-size:11px;line-height:1.4;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;">Career proof, organized</div>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #1e293b;border-radius:24px;background:#0f172a;padding:34px 32px;box-shadow:0 24px 80px rgba(0,0,0,.28);">
                <div style="display:inline-block;margin-bottom:16px;padding:7px 10px;border-radius:999px;background:#172554;color:#bfdbfe;font-size:11px;line-height:1;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;">{safe_eyebrow}</div>
                <h1 style="margin:0 0 14px;font-size:30px;line-height:1.12;letter-spacing:-0.045em;color:#f8fafc;font-weight:900;">{safe_title}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:#cbd5e1;">{safe_intro}</p>
                {content_html}
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 22px;">
                  <tr>
                    <td bgcolor="#2563eb" style="border-radius:14px;">
                      <a href="{safe_cta_url}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;line-height:1;font-weight:900;">{safe_cta_label}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.55;color:#64748b;">{safe_footnote}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 4px 0;text-align:center;font-size:11px;line-height:1.6;color:#475569;">
                <div>BragStack helps you turn real work into reusable career proof.</div>
                <div style="margin-top:4px;"><a href="{BRAND_URL}" style="color:#64748b;text-decoration:none;">usebragstack.com</a></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def build_email_verification_html(url: str) -> str:
    content = """
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 4px;width:100%;">
        <tr>
          <td style="padding:15px 16px;border:1px solid #1e3a5f;border-radius:16px;background:#0b1f33;color:#bfdbfe;font-size:13px;line-height:1.55;">
            This link expires in <strong style="color:#dbeafe;">24 hours</strong>. Verifying confirms that this email address belongs to you and unlocks password sign-in.
          </td>
        </tr>
      </table>
    """
    return _shell(
        preheader="Verify your BragStack email and open your career-proof workspace.",
        eyebrow="Secure account setup",
        title="Verify your BragStack email",
        intro="You’re one click away from opening your private workspace for accomplishments, Impact Receipts, and career proof.",
        content_html=content,
        cta_label="Verify email",
        cta_url=url,
        footnote="If you didn’t create a BragStack account, you can safely ignore this message.",
    )


def build_password_reset_html(url: str) -> str:
    content = """
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 4px;width:100%;">
        <tr>
          <td style="padding:15px 16px;border:1px solid #3f3f46;border-radius:16px;background:#18181b;color:#d4d4d8;font-size:13px;line-height:1.55;">
            For your security, this reset link is single-purpose and expires in <strong style="color:#fafafa;">30 minutes</strong>.
          </td>
        </tr>
      </table>
    """
    return _shell(
        preheader="Reset your BragStack password securely.",
        eyebrow="Account security",
        title="Reset your password",
        intro="We received a request to choose a new password for your BragStack account.",
        content_html=content,
        cta_label="Choose a new password",
        cta_url=url,
        footnote="If you didn’t request a password reset, no action is needed and your current password remains unchanged.",
    )


def build_receipt_verification_html(*, owner_name: str, verifier_name: str, accomplishment: str, message: str, url: str) -> str:
    safe_owner = _safe(owner_name)
    safe_verifier = _safe(verifier_name)
    safe_accomplishment = _safe(accomplishment)
    safe_message = _safe(message)
    message_block = ""
    if safe_message:
        message_block = f"""
          <div style="margin-top:14px;padding:14px 16px;border-left:3px solid #60a5fa;background:#111c33;border-radius:0 12px 12px 0;">
            <div style="margin-bottom:5px;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#60a5fa;">Message from {safe_owner}</div>
            <div style="font-size:14px;line-height:1.55;color:#cbd5e1;">{safe_message}</div>
          </div>
        """

    content = f"""
      <p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#94a3b8;">Hi {safe_verifier},</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
        <tr>
          <td style="padding:18px;border:1px solid #24324a;border-radius:18px;background:#0b1220;">
            <div style="margin-bottom:8px;font-size:11px;line-height:1;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#a78bfa;">Impact Receipt</div>
            <div style="font-size:18px;line-height:1.4;font-weight:850;color:#f8fafc;">{safe_accomplishment}</div>
          </td>
        </tr>
      </table>
      {message_block}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">Your response records your attestation. BragStack does not independently verify the underlying claim, and no BragStack account is required to respond.</p>
    """
    return _shell(
        preheader=f"{owner_name} asked you to review an Impact Receipt on BragStack.",
        eyebrow="Career proof verification",
        title=f"{owner_name} asked you to confirm career proof",
        intro="Review the Impact Receipt below and confirm whether it accurately represents the work and result described.",
        content_html=content,
        cta_label="Review & respond",
        cta_url=url,
        footnote="This secure verification link expires in 7 days. Please don’t forward it to someone else.",
    )
