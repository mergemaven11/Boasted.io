"""Transactional email helpers for organization and team invitations."""

from html import escape
from urllib.parse import quote

from app.auth_routes import EMAIL_VERIFICATION_FROM, FRONTEND_URL, _send_email


def build_team_invitation_html(*, inviter_name: str, organization_name: str, role: str, accept_url: str) -> str:
    """Build a minimal BragStack organization invitation email."""
    inviter = escape(inviter_name or "A BragStack administrator")
    organization = escape(organization_name)
    safe_role = escape(role.replace("_", " ").title())
    url = escape(accept_url, quote=True)
    return f"""<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px;background:#020617;color:#e2e8f0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#0f172a;border:1px solid #1e293b;border-radius:22px;">
        <tr><td style="padding:32px;">
          <div style="font-weight:900;font-size:20px;color:#f8fafc;">Brag<span style="color:#93c5fd;">Stack</span></div>
          <div style="margin-top:24px;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#60a5fa;">Team invitation</div>
          <h1 style="margin:10px 0 12px;font-size:28px;color:#f8fafc;">Join {organization}</h1>
          <p style="font-size:15px;line-height:1.7;color:#cbd5e1;">{inviter} invited you to join the organization as <strong>{safe_role}</strong>.</p>
          <p style="font-size:14px;line-height:1.7;color:#94a3b8;">Joining a BragStack organization does <strong>not</strong> expose your private career evidence. Managers can review only proof you intentionally share into a review workflow.</p>
          <a href="{url}" style="display:inline-block;margin-top:20px;padding:14px 20px;border-radius:12px;background:#2563eb;color:white;text-decoration:none;font-weight:900;">Review invitation</a>
          <p style="margin-top:24px;font-size:12px;line-height:1.6;color:#64748b;">If you were not expecting this invitation, you can ignore this email.</p>
        </td></tr>
      </table>
    </td></tr></table>
  </body>
</html>"""


async def send_team_invitation(*, email: str, inviter_name: str, organization_name: str, role: str, token: str) -> None:
    """Send an organization invitation through BragStack's configured mail delivery."""
    accept_url = f"{FRONTEND_URL}/app/team/invitations?token={quote(token)}"
    html = build_team_invitation_html(
        inviter_name=inviter_name,
        organization_name=organization_name,
        role=role,
        accept_url=accept_url,
    )
    await _send_email(
        email,
        f"Join {organization_name} on BragStack",
        html,
        EMAIL_VERIFICATION_FROM,
    )
