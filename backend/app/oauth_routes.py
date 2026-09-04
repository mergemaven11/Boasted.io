"""OAuth sign-in routes for Google and GitHub."""
import os
import re
import secrets
from datetime import datetime, timezone
from urllib.parse import quote, urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from app.auth import create_access_token
from app.database import users_collection

router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")
OAUTH_CALLBACK_BASE_URL = os.getenv("OAUTH_CALLBACK_BASE_URL", "").strip().rstrip("/")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "").strip()
CURRENT_TERMS_VERSION = "2026-09-04"
CURRENT_PRIVACY_VERSION = "2026-09-04"
OAUTH_COOKIE_MAX_AGE_SECONDS = 600

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def _slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "user"


def _generate_unique_public_slug(name: str) -> str:
    base_slug = _slugify(name)
    while True:
        slug = f"{base_slug}-{secrets.token_hex(3)}"
        if not users_collection.find_one({"public_slug": slug}):
            return slug


def _require_credentials(provider: str) -> None:
    configured = {
        "google": GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET,
        "github": GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET,
    }
    if not configured.get(provider):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{provider.title()} OAuth is not configured",
        )
    if provider == "google" and not GOOGLE_CLIENT_ID.endswith(".apps.googleusercontent.com"):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth client ID is malformed in the production configuration.",
        )


def _redirect_uri(request: Request, provider: str) -> str:
    if OAUTH_CALLBACK_BASE_URL:
        return f"{OAUTH_CALLBACK_BASE_URL}/auth/{provider}/callback"

    # Render and other reverse proxies terminate TLS before the FastAPI process.
    # Build the public callback from the forwarded host/scheme so the redirect URI
    # sent to OAuth providers is the same HTTPS URI registered with the provider.
    forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",", 1)[0].strip()
    forwarded_host = request.headers.get("x-forwarded-host", "").split(",", 1)[0].strip()
    host = forwarded_host or request.headers.get("host", "").strip()
    scheme = forwarded_proto or request.url.scheme
    if host:
        return f"{scheme}://{host}/auth/{provider}/callback"
    return str(request.url_for(f"{provider}_callback"))


def _authorization_query(params: dict[str, str]) -> str:
    """Encode an OAuth query with RFC3986 spaces instead of form-style `+`."""
    return urlencode(params, quote_via=quote, safe="")


def _legal_acceptance_record(method: str) -> dict:
    accepted_at = datetime.now(timezone.utc).isoformat()
    return {
        "terms_version": CURRENT_TERMS_VERSION,
        "privacy_version": CURRENT_PRIVACY_VERSION,
        "terms_accepted_at": accepted_at,
        "privacy_acknowledged_at": accepted_at,
        "age_18_or_older_attested": True,
        "method": method,
    }


def _find_or_create_oauth_user(
    provider: str,
    provider_user_id: str,
    email: str,
    name: str,
    legal_acceptance: dict | None = None,
) -> dict:
    """Link OAuth identity without replacing user-authored profile fields.

    Existing accounts may sign in without creating a new acceptance record.
    Creating a brand-new OAuth account requires an affirmative legal-acceptance
    signal from the registration flow so OAuth cannot bypass clickwrap.
    """
    normalized_email = email.lower().strip()
    provider_field = f"oauth.{provider}_id"
    verified_at = datetime.now(timezone.utc).isoformat()

    user = users_collection.find_one({provider_field: provider_user_id})
    if user:
        update_fields = {
            "email_verified_at": user.get("email_verified_at") or verified_at,
            "email_verification_required": False,
        }
        if legal_acceptance:
            update_fields["legal_acceptance"] = legal_acceptance
        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": update_fields,
                "$unset": {
                    "email_verification_token_hash": "",
                    "email_verification_expires_at": "",
                },
            },
        )
        return users_collection.find_one({"_id": user["_id"]})

    user = users_collection.find_one({"email": normalized_email})
    if user:
        # Only link the provider, verification state, and an affirmative current
        # legal acceptance when present. Never replace user-authored profile fields.
        update_fields = {
            provider_field: provider_user_id,
            "email_verified_at": verified_at,
            "email_verification_required": False,
        }
        if legal_acceptance:
            update_fields["legal_acceptance"] = legal_acceptance
        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": update_fields,
                "$unset": {
                    "email_verification_token_hash": "",
                    "email_verification_expires_at": "",
                },
            },
        )
        return users_collection.find_one({"_id": user["_id"]})

    if not legal_acceptance:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="New BragStack accounts require agreement to the current Terms, acknowledgment of the Privacy Policy, and confirmation that the user is at least 18. Start from the registration page.",
        )

    user_doc = {
        "name": (name or normalized_email.split("@", 1)[0]).strip(),
        "email": normalized_email,
        "public_slug": _generate_unique_public_slug(name or "user"),
        "oauth": {f"{provider}_id": provider_user_id},
        "email_verified_at": verified_at,
        "email_verification_required": False,
        "legal_acceptance": legal_acceptance,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = users_collection.insert_one(user_doc)
    return users_collection.find_one({"_id": result.inserted_id})


def _frontend_success_redirect(user: dict) -> RedirectResponse:
    token = create_access_token({"sub": str(user["_id"])})
    return RedirectResponse(
        url=f"{FRONTEND_URL}/login#oauth_token={token}",
        status_code=status.HTTP_302_FOUND,
    )


def _set_state_cookie(response: RedirectResponse, provider: str, state_value: str) -> None:
    response.set_cookie(
        key=f"oauth_state_{provider}",
        value=state_value,
        max_age=OAUTH_COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        secure=True,
        samesite="lax",
    )


def _validate_state(request: Request, provider: str, state_value: str | None) -> None:
    expected = request.cookies.get(f"oauth_state_{provider}")
    if not expected or not state_value or not secrets.compare_digest(expected, state_value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        )


def _validated_legal_query(
    terms_accepted: bool,
    privacy_acknowledged: bool,
    age_18_or_older: bool,
    terms_version: str,
    privacy_version: str,
) -> bool:
    """Return whether this OAuth launch carries current affirmative clickwrap."""
    any_legal_signal = any(
        [terms_accepted, privacy_acknowledged, age_18_or_older, bool(terms_version), bool(privacy_version)]
    )
    if not any_legal_signal:
        return False
    if not terms_accepted or not privacy_acknowledged or not age_18_or_older:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete the age, Terms, and Privacy acknowledgment before creating an account.",
        )
    if terms_version != CURRENT_TERMS_VERSION or privacy_version != CURRENT_PRIVACY_VERSION:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="BragStack's legal terms changed. Refresh the registration page before continuing.",
        )
    return True


def _set_legal_cookie(response: RedirectResponse, provider: str, accepted: bool) -> None:
    if not accepted:
        response.delete_cookie(f"oauth_legal_{provider}")
        return
    response.set_cookie(
        key=f"oauth_legal_{provider}",
        value=f"{CURRENT_TERMS_VERSION}|{CURRENT_PRIVACY_VERSION}|adult",
        max_age=OAUTH_COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        secure=True,
        samesite="lax",
    )


def _legal_acceptance_from_cookie(request: Request, provider: str) -> dict | None:
    expected = f"{CURRENT_TERMS_VERSION}|{CURRENT_PRIVACY_VERSION}|adult"
    value = request.cookies.get(f"oauth_legal_{provider}")
    if not value or not secrets.compare_digest(value, expected):
        return None
    return _legal_acceptance_record(f"{provider}_oauth_registration")


def _clear_oauth_cookies(response: RedirectResponse, provider: str) -> None:
    response.delete_cookie(f"oauth_state_{provider}")
    response.delete_cookie(f"oauth_legal_{provider}")


@router.get("/google/login", name="google_login")
def google_login(
    request: Request,
    terms_accepted: bool = False,
    privacy_acknowledged: bool = False,
    age_18_or_older: bool = False,
    terms_version: str = "",
    privacy_version: str = "",
):
    _require_credentials("google")
    legal_accepted = _validated_legal_query(
        terms_accepted,
        privacy_acknowledged,
        age_18_or_older,
        terms_version,
        privacy_version,
    )
    state_value = secrets.token_urlsafe(32)
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": _redirect_uri(request, "google"),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state_value,
        "prompt": "select_account",
    }
    response = RedirectResponse(f"{GOOGLE_AUTHORIZE_URL}?{_authorization_query(params)}")
    _set_state_cookie(response, "google", state_value)
    _set_legal_cookie(response, "google", legal_accepted)
    return response


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, code: str, state: str | None = None):
    _require_credentials("google")
    _validate_state(request, "google", state)

    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": _redirect_uri(request, "google"),
            },
        )
        token_response.raise_for_status()
        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Google did not return an access token")

        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        userinfo_response.raise_for_status()
        profile = userinfo_response.json()

    if not profile.get("email") or profile.get("email_verified") is not True:
        raise HTTPException(status_code=400, detail="Google account must have a verified email")

    user = _find_or_create_oauth_user(
        "google",
        str(profile.get("sub")),
        profile["email"],
        profile.get("name") or "",
        _legal_acceptance_from_cookie(request, "google"),
    )
    response = _frontend_success_redirect(user)
    _clear_oauth_cookies(response, "google")
    return response


@router.get("/github/login", name="github_login")
def github_login(
    request: Request,
    terms_accepted: bool = False,
    privacy_acknowledged: bool = False,
    age_18_or_older: bool = False,
    terms_version: str = "",
    privacy_version: str = "",
):
    _require_credentials("github")
    legal_accepted = _validated_legal_query(
        terms_accepted,
        privacy_acknowledged,
        age_18_or_older,
        terms_version,
        privacy_version,
    )
    state_value = secrets.token_urlsafe(32)
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": _redirect_uri(request, "github"),
        "scope": "user:email",
        "state": state_value,
    }
    response = RedirectResponse(f"{GITHUB_AUTHORIZE_URL}?{_authorization_query(params)}")
    _set_state_cookie(response, "github", state_value)
    _set_legal_cookie(response, "github", legal_accepted)
    return response


@router.get("/github/callback", name="github_callback")
async def github_callback(request: Request, code: str, state: str | None = None):
    _require_credentials("github")
    _validate_state(request, "github", state)

    headers = {"Accept": "application/json", "User-Agent": "BragStack"}
    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        token_response = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": _redirect_uri(request, "github"),
            },
        )
        token_response.raise_for_status()
        access_token = token_response.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub did not return an access token")

        auth_headers = {"Authorization": f"Bearer {access_token}"}
        user_response = await client.get(GITHUB_USER_URL, headers=auth_headers)
        user_response.raise_for_status()
        profile = user_response.json()

        emails_response = await client.get(GITHUB_EMAILS_URL, headers=auth_headers)
        emails_response.raise_for_status()
        emails = emails_response.json()

    verified_emails = [item for item in emails if item.get("verified") and item.get("email")]
    primary = next((item for item in verified_emails if item.get("primary")), None)
    selected_email = primary or (verified_emails[0] if verified_emails else None)
    if not selected_email:
        raise HTTPException(status_code=400, detail="GitHub account must have a verified email")

    user = _find_or_create_oauth_user(
        "github",
        str(profile.get("id")),
        selected_email["email"],
        profile.get("name") or profile.get("login") or "",
        _legal_acceptance_from_cookie(request, "github"),
    )
    response = _frontend_success_redirect(user)
    _clear_oauth_cookies(response, "github")
    return response
