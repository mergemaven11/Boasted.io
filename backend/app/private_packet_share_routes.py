from __future__ import annotations

import hmac
import hashlib
import os
import time
from datetime import datetime, timezone
from html import escape

from fastapi import APIRouter, Depends, Form, HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse

from app.auth import get_current_user, verify_password
from app.database import packet_shares_collection
from app.packet_share_routes import (
    PacketShareCreate,
    _aware,
    _build_shared_packet,
    _shared_html,
    _token_hash,
    create_packet_share as _create_packet_share,
    list_packet_shares as _list_packet_shares,
    revoke_packet_share as _revoke_packet_share,
)
from app.packet_platform_pdf import build_platform_packet_pdf, make_platform_packet_filename
from app.packet_audit import record_packet_export


router = APIRouter(tags=["packet-sharing"])
SHARE_GRANT_SECRET = os.getenv("PACKET_SHARE_GRANT_SECRET") or os.getenv("JWT_SECRET") or "bragstack-share-grant"
SHARE_GRANT_TTL_SECONDS = max(300, int(os.getenv("PACKET_SHARE_GRANT_TTL_SECONDS", "3600")))
SHARE_COOKIE_SECURE = os.getenv("PACKET_SHARE_COOKIE_SECURE", "true").strip().lower() in {"1", "true", "yes", "on"}


def _share_or_404(token: str) -> dict:
    item = packet_shares_collection.find_one({"token_hash": _token_hash(token)})
    if not item or item.get("revoked"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared packet not found")
    expires_at = _aware(item.get("expires_at"))
    if expires_at and expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared packet not found")
    return item


def _cookie_name(token: str) -> str:
    return f"bragstack_share_{_token_hash(token)[:16]}"


def _grant_signature(token: str, item: dict, expires_epoch: int) -> str:
    access_hash = str(item.get("access_code_hash") or "open")
    message = f"{_token_hash(token)}:{access_hash}:{expires_epoch}".encode("utf-8")
    return hmac.new(SHARE_GRANT_SECRET.encode("utf-8"), message, hashlib.sha256).hexdigest()


def _grant_value(token: str, item: dict, expires_epoch: int) -> str:
    return f"{expires_epoch}.{_grant_signature(token, item, expires_epoch)}"


def _has_access(request: Request, token: str, item: dict) -> bool:
    if not item.get("access_code_hash"):
        return True
    supplied = request.cookies.get(_cookie_name(token), "")
    if "." not in supplied:
        return False
    expires_text, signature = supplied.split(".", 1)
    try:
        expires_epoch = int(expires_text)
    except ValueError:
        return False
    if expires_epoch <= int(time.time()):
        return False
    expected = _grant_signature(token, item, expires_epoch)
    return hmac.compare_digest(signature, expected)


def _access_form(token: str, *, error: str = "") -> HTMLResponse:
    error_html = f"<p role='alert'>{escape(error)}</p>" if error else ""
    return HTMLResponse(
        f"""<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><meta name='robots' content='noindex,nofollow'><meta name='referrer' content='no-referrer'><title>Protected BragStack packet</title><style>body{{font-family:Inter,system-ui,sans-serif;background:#eef0f1;color:#172126;margin:0}}main{{max-width:480px;margin:10vh auto;background:white;padding:36px;box-shadow:0 18px 60px #0001}}label{{display:block;font-weight:700;margin:18px 0 8px}}input{{box-sizing:border-box;width:100%;padding:12px;border:1px solid #b8c0c2;border-radius:8px}}button{{margin-top:16px;padding:12px 16px;border:0;border-radius:8px;background:#173f43;color:white;font-weight:700}}p{{line-height:1.5;color:#5d686e}}</style></head><body><main><h1>Protected packet</h1><p>Enter the access code shared with you. The code is submitted securely and is not placed in the page URL.</p>{error_html}<form method='post' action='/shared/packets/{escape(token)}/access'><label for='access_code'>Access code</label><input id='access_code' name='access_code' type='password' minlength='4' maxlength='64' required autocomplete='one-time-code'><button type='submit'>Open packet</button></form></main></body></html>""",
        status_code=status.HTTP_401_UNAUTHORIZED if error else status.HTTP_200_OK,
        headers={
            "Cache-Control": "private, no-store",
            "Referrer-Policy": "no-referrer",
            "X-Robots-Tag": "noindex, nofollow",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.post("/packets/shares")
def create_packet_share(payload: PacketShareCreate, current_user: dict = Depends(get_current_user)):
    return _create_packet_share(payload, current_user)


@router.get("/packets/shares")
def list_packet_shares(current_user: dict = Depends(get_current_user)):
    return _list_packet_shares(current_user)


@router.delete("/packets/shares/{share_id}")
def revoke_packet_share(share_id: str, current_user: dict = Depends(get_current_user)):
    return _revoke_packet_share(share_id, current_user)


@router.get("/shared/packets/{token}", response_class=HTMLResponse)
def view_shared_packet(token: str, request: Request):
    item = _share_or_404(token)
    if not _has_access(request, token, item):
        return _access_form(token)
    _, packet = _build_shared_packet(item)
    return HTMLResponse(
        _shared_html(packet, allow_download=bool(item.get("allow_download")), token=token, access_code=None),
        headers={
            "Cache-Control": "private, no-store",
            "Referrer-Policy": "no-referrer",
            "X-Robots-Tag": "noindex, nofollow",
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.post("/shared/packets/{token}/access")
def grant_shared_packet_access(token: str, access_code: str = Form(..., min_length=4, max_length=64)):
    item = _share_or_404(token)
    code_hash = item.get("access_code_hash")
    if not code_hash:
        return RedirectResponse(url=f"/shared/packets/{token}", status_code=status.HTTP_303_SEE_OTHER)
    if not verify_password(access_code, code_hash):
        return _access_form(token, error="That access code is not valid.")

    now_epoch = int(time.time())
    max_age = SHARE_GRANT_TTL_SECONDS
    expires_at = _aware(item.get("expires_at"))
    if expires_at:
        remaining = int((expires_at - datetime.now(timezone.utc)).total_seconds())
        max_age = max(1, min(max_age, remaining))
    grant_expires_epoch = now_epoch + max_age

    response = RedirectResponse(url=f"/shared/packets/{token}", status_code=status.HTTP_303_SEE_OTHER)
    response.set_cookie(
        key=_cookie_name(token),
        value=_grant_value(token, item, grant_expires_epoch),
        max_age=max_age,
        httponly=True,
        secure=SHARE_COOKIE_SECURE,
        samesite="lax",
        path=f"/shared/packets/{token}",
    )
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@router.get("/shared/packets/{token}/download.pdf")
def download_shared_packet(token: str, request: Request):
    item = _share_or_404(token)
    if not _has_access(request, token, item):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access code required")
    if not item.get("allow_download"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Download is disabled for this share")
    owner, packet = _build_shared_packet(item)
    pdf_bytes = build_platform_packet_pdf(packet)
    filename = make_platform_packet_filename(packet)
    audit_packet = dict(packet)
    audit_packet["kind"] = "shared-performance-review"
    record_packet_export(user_id=str(owner["_id"]), packet=audit_packet, filename=filename, pdf_bytes=pdf_bytes)
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-store",
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
        },
    )
