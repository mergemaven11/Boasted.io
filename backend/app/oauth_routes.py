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
from app.auth_routes import PRIVACY_VERSION, TERMS_VERSION
from app.database import users_collection

router = APIRouter(prefix="/auth", tags=["auth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")
OAUTH_CALLBACK_BASE_URL = os.getenv("OAUTH_CALLBACK_BASE_URL", "").strip().rstrip("/")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "").strip()

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


def _find_or_create_oauth_user(
    provider: str,
    provider_user_id: str,
    email: str,
    name: str,
    *,
    accepted_terms: bool = False,
    accepted_privacy: bool = False,
) -> dict:
    """Link an OAuth identity or create a consented OAuth account.

    Existing users can always sign in or link their provider. A brand-new OAuth
    account is created only when the exact OAuth attempt started after the user
    accepted the current Terms and Privacy Policy on the registration page.
    """
    normalized_email = email.lower().strip()
    provider_field = f"oauth.{provider}_id"
    verified_at = datetime.now(timezone.utc).isoformat()

    user = users_collection.find_one({provider_field: provider_user_id})
    if user:
        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "email_verified_at": user.get("email_verified_at") or verified_at,
                    "email_verification_required": False,
                },
                "$unset": {
                    "email_verification_token_hash": "",
                    "email_verification_expires_at": "",
                },
            },
        )
        return users_collection.find_one({"_id": user["_id"]})

    user = users_collection.find_one({"email": normalized_email})
    if user:
        users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    provider_field: provider_user_id,
                    "email_verified_at": verified_at,
                    "email_verification_required": False,
                },
                "$unset": {
                    "email_verification_token_hash": "",
                    "email_verification_expires_at": "",
                },
            },
        )
        return users_collection.find_one({"_id": user["_id"]})

    if not accepted_terms or not accepted_privacy:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "To create a new BragStack account with Google or GitHub, start from Create Account "
                "and accept the current Terms and Privacy Policy first."
            ),
        )

    accepted_at = datetime.now(timezone.utc).isoformat()
    display_name = name.strip() or normalized_email.split("@", 1)[0] or "User"
    doc = {
        "name": display_name,
        "email": normalized_email,
        "public_slug": _generate_unique_public_slug(display_name),
        "oauth": {f"{provider}_id": provider_user_id},
        "email_verified_at": verified_at,
        "email_verification_required": False,
        "created_at": accepted_at,
        "terms_accepted_at": accepted_at,
        "terms_version": TERMS_VERSION,
        "privacy_accepted_at": accepted_at,
        "privacy_version": PRIVACY_VERSION,
        "legal_acceptance_source": f"{provider}-oauth-registration",
        "consents": {
            "terms": {
                "accepted": True,
                "version": TERMS_VERSION,
                "accepted_at": accepted_at,
            },
            "privacy_policy": {
                "accepted": True,
                "version": PRIVACY_VERSION,
                "accepted_at": accepted_at,
            },
        },
    }
    result = users_collection.insert_one(doc)
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
        max_age=600,
        httponly=True,
        secure=True,
        samesite="lax",
    )


def _set_registration_consent_cookie(
    response: RedirectResponse,
    provider: str,
    state_value: str,
    accepted_terms: bool,
    accepted_privacy: bool,
) -> None:
    """Bind registration consent to this exact OAuth state value."""
    if not accepted_terms or not accepted_privacy:
        return
    response.set_cookie(
        key=f"oauth_registration_consent_{provider}",
        value=state_value,
        max_age=600,
        httponly=True,
        secure=True,
        samesite="lax",
    )


def _registration_consent_matches(request: Request, provider: str, state_value: str | None) -> bool:
    consent_state = request.cookies.get(f"oauth_registration_consent_{provider}")
    return bool(
        consent_state
        and state_value
        and secrets.compare_digest(consent_state, state_value)
    )


def _validate_state(request: Request, provider: str, state_value: str | None) -> None:
    expected = request.cookies.get(f"oauth_state_{provider}")
    if not expected or not state_value or not secrets.compare_digest(expected, state_value):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        )


@router.get("/google/login", name="google_login")
def google_login(
    request: Request,
    accepted_terms: bool = False,
    accepted_privacy: bool = False,
):
    _require_credentials("google")
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
    _set_registration_consent_cookie(
        response,
        "google",
        state_value,
        accepted_terms,
        accepted_privacy,
    )
    return response


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, code: str, state: str | None = None):
    _require_credentials("google")
    _validate_state(request, "google", state)
    registration_consented = _registration_consent_matches(request, "google", state)

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
        accepted_terms=registration_consented,
        accepted_privacy=registration_consented,
    )
    response = _frontend_success_redirect(user)
    response.delete_cookie("oauth_state_google")
    response.delete_cookie("oauth_registration_consent_google")
    return response


@router.get("/github/login", name="github_login")
def github_login(
    request: Request,
    accepted_terms: bool = False,
    accepted_privacy: bool = False,
):
    _require_credentials("github")
    state_value = secrets.token_urlsafe(32)
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": _redirect_uri(request, "github"),
        "scope": "user:email",
        "state": state_value,
    }
    response = RedirectResponse(f"{GITHUB_AUTHORIZE_URL}?{_authorization_query(params)}")
    _set_state_cookie(response, "github", state_value)
    _set_registration_consent_cookie(
        response,
        "github",
        state_value,
        accepted_terms,
        accepted_privacy,
    )
    return response


@router.get("/github/callback", name="github_callback")
async def github_callback(request: Request, code: str, state: str | None = None):
    _require_credentials("github")
    _validate_state(request, "github", state)
    registration_consented = _registration_consent_matches(request, "github", state)

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
        accepted_terms=registration_consented,
        accepted_privacy=registration_consented,
    )
    response = _frontend_success_redirect(user)
    response.delete_cookie("oauth_state_github")
    response.delete_cookie("oauth_registration_consent_github")
    return response