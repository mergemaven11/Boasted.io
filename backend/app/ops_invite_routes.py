"""Safe, audited invitations sent by authorized BragStack operators."""
from __future__ import annotations

from datetime import datetime, timezone
from html import escape
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.auth_routes import EMAIL_VERIFICATION_FROM, FRONTEND_URL, _send_email
from app.database import ops_audit_collection, users_collection
from app.ops_routes import require_internal_role

router = APIRouter(prefix="/ops/user-invites", tags=["ops"])


class UserInviteRequest(BaseModel):
    """A human-approved invitation to create a normal BragStack account."""

    email: EmailStr
    name: str = Field(default="", max_length=80)


def _invitation_html(*, name: str, register_url: str) -> str:
    safe_name = escape(name.strip() or "there")
    safe_url = escape(register_url, quote=True)
    return f"""<!doctype html>
<html lang="en"><body style="margin:0;background:#020617;color:#e2e8f0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020617;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;"><tr><td style="padding:30px;border:1px solid #1e293b;border-radius:24px;background:#0f172a;">
<div style="font-weight:900;font-size:22px;color:#f8fafc;">Brag<span style="color:#93c5fd;">Stack</span></div>
<div style="margin:24px 0 10px;color:#93c5fd;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;">Invitation</div>
<h1 style="margin:0 0 14px;color:#f8fafc;font-size:30px;line-height:1.15;">Build your career proof.</h1>
<p style="margin:0 0 18px;color:#cbd5e1;font-size:16px;line-height:1.65;">Hi {safe_name}, you’ve been invited to BragStack — a workspace for capturing accomplishments, Impact Receipts, and evidence-backed career proof.</p>
<p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">This invitation does not create an account or password for you. You choose your own credentials during normal registration.</p>
<a href="{safe_url}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#2563eb;color:white;text-decoration:none;font-weight:900;">Create your BragStack account</a>
<p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.55;">If you weren’t expecting this invitation, you can ignore it. No account has been created for you.</p>
</td></tr></table></td></tr></table></body></html>"""


@router.post("", status_code=status.HTTP_202_ACCEPTED)
async def send_user_invite(
    payload: UserInviteRequest,
    current_user: dict = Depends(require_internal_role("support", "ops", "admin")),
):
    """Send a registration invitation without pre-creating or impersonating a user."""
    email = str(payload.email).strip().lower()
    existing = users_collection.find_one({"email": email}, {"_id": 1, "email_verified_at": 1, "email_verification_required": 1})
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for this email. Use User Accounts for verification or support actions instead.",
        )

    register_url = f"{FRONTEND_URL}/register?email={quote(email)}"
    await _send_email(
        email,
        "You’re invited to BragStack",
        _invitation_html(name=payload.name, register_url=register_url),
        EMAIL_VERIFICATION_FROM,
    )

    sent_at = datetime.now(timezone.utc)
    ops_audit_collection.insert_one(
        {
            "event": "user_invite_sent",
            "actor_user_id": str(current_user.get("_id", "")),
            "actor_email": (current_user.get("email") or "").strip().lower(),
            "target_email": email,
            "target_name": payload.name.strip(),
            "created_at": sent_at,
        }
    )
    return {
        "message": "Invitation sent.",
        "email": email,
        "sent_at": sent_at.isoformat(),
    }
