from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import hmac
import logging
import os
import re
import time

from fastapi import Request
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.database import rate_limits_collection

logger = logging.getLogger(__name__)


def _env_int(name: str, default: int) -> int:
    try:
        return max(1, int(os.getenv(name, str(default))))
    except (TypeError, ValueError):
        return default


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


RATE_LIMIT_ENABLED = _env_bool("RATE_LIMIT_ENABLED", True)
RATE_LIMIT_FAIL_OPEN = _env_bool("RATE_LIMIT_FAIL_OPEN", True)
TRUST_PROXY_HEADERS = _env_bool("RATE_LIMIT_TRUST_PROXY_HEADERS", False)
RATE_LIMIT_HASH_KEY = os.getenv("RATE_LIMIT_HASH_KEY") or os.getenv("JWT_SECRET") or "bragstack-rate-limit"


@dataclass(frozen=True)
class RateLimitPolicy:
    name: str
    limit: int
    window_seconds: int


@dataclass(frozen=True)
class RateLimitDecision:
    policy: str
    retry_after: int
    limit: int


POLICIES = {
    "auth_login": RateLimitPolicy("auth_login", _env_int("RATE_LIMIT_AUTH_LOGIN", 10), 10 * 60),
    "auth_register": RateLimitPolicy("auth_register", _env_int("RATE_LIMIT_AUTH_REGISTER", 5), 60 * 60),
    "auth_email": RateLimitPolicy("auth_email", _env_int("RATE_LIMIT_AUTH_EMAIL", 5), 60 * 60),
    "auth_confirm": RateLimitPolicy("auth_confirm", _env_int("RATE_LIMIT_AUTH_CONFIRM", 20), 60 * 60),
    "oauth": RateLimitPolicy("oauth", _env_int("RATE_LIMIT_OAUTH", 30), 10 * 60),
    "receipt_verification_send": RateLimitPolicy(
        "receipt_verification_send",
        _env_int("RATE_LIMIT_RECEIPT_VERIFICATION_SEND", 10),
        60 * 60,
    ),
    "receipt_verification_public": RateLimitPolicy(
        "receipt_verification_public",
        _env_int("RATE_LIMIT_RECEIPT_VERIFICATION_PUBLIC", 60),
        60,
    ),
    "public_profile": RateLimitPolicy("public_profile", _env_int("RATE_LIMIT_PUBLIC_PROFILE", 180), 60),
}

_RECEIPT_SEND_RE = re.compile(r"^/impact-receipts/[^/]+/verification-requests/?$")
_RECEIPT_PUBLIC_RE = re.compile(r"^/receipt-verifications/[^/]+(?:/decision)?/?$")


def policy_for_request(request: Request) -> RateLimitPolicy | None:
    if not RATE_LIMIT_ENABLED:
        return None

    method = request.method.upper()
    path = request.url.path.rstrip("/") or "/"
    if method in {"OPTIONS", "HEAD"} or path in {"/", "/health", "/ready"}:
        return None

    if method == "POST":
        if path == "/auth/login":
            return POLICIES["auth_login"]
        if path == "/auth/register":
            return POLICIES["auth_register"]
        if path in {"/auth/email-verification/resend", "/auth/password-reset/request"}:
            return POLICIES["auth_email"]
        if path in {"/auth/email-verification/confirm", "/auth/password-reset/confirm"}:
            return POLICIES["auth_confirm"]
        if _RECEIPT_SEND_RE.fullmatch(path):
            return POLICIES["receipt_verification_send"]
        if _RECEIPT_PUBLIC_RE.fullmatch(path):
            return POLICIES["receipt_verification_public"]

    if method == "GET":
        if path in {
            "/auth/google/login",
            "/auth/google/callback",
            "/auth/github/login",
            "/auth/github/callback",
        }:
            return POLICIES["oauth"]
        if _RECEIPT_PUBLIC_RE.fullmatch(path):
            return POLICIES["receipt_verification_public"]
        if path.startswith("/public/brag/"):
            return POLICIES["public_profile"]

    return None


def _client_address(request: Request) -> str:
    if TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            candidate = forwarded.split(",", 1)[0].strip()
            if candidate:
                return candidate
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _identity_digest(request: Request) -> str:
    value = _client_address(request).encode("utf-8")
    return hmac.new(RATE_LIMIT_HASH_KEY.encode("utf-8"), value, hashlib.sha256).hexdigest()


def _increment_bucket(policy: RateLimitPolicy, identity: str, now_epoch: int) -> dict:
    window_start = (now_epoch // policy.window_seconds) * policy.window_seconds
    window_end = window_start + policy.window_seconds
    bucket_id = f"{policy.name}:{identity}:{window_start}"
    expires_at = datetime.fromtimestamp(window_end + 300, tz=timezone.utc)
    update = {
        "$inc": {"count": 1},
        "$setOnInsert": {
            "policy": policy.name,
            "window_start": datetime.fromtimestamp(window_start, tz=timezone.utc),
            "window_end": datetime.fromtimestamp(window_end, tz=timezone.utc),
            "expires_at": expires_at,
        },
    }
    try:
        return rate_limits_collection.find_one_and_update(
            {"_id": bucket_id},
            update,
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
    except DuplicateKeyError:
        return rate_limits_collection.find_one_and_update(
            {"_id": bucket_id},
            {"$inc": {"count": 1}},
            return_document=ReturnDocument.AFTER,
        )


def check_rate_limit(request: Request, *, now_epoch: int | None = None) -> RateLimitDecision | None:
    policy = policy_for_request(request)
    if policy is None:
        return None

    now_epoch = int(time.time()) if now_epoch is None else int(now_epoch)
    identity = _identity_digest(request)
    try:
        bucket = _increment_bucket(policy, identity, now_epoch)
    except PyMongoError:
        logger.exception("Rate limiter database operation failed for policy %s", policy.name)
        if RATE_LIMIT_FAIL_OPEN:
            return None
        return RateLimitDecision(policy=policy.name, retry_after=1, limit=policy.limit)

    count = int((bucket or {}).get("count", 0))
    if count <= policy.limit:
        return None

    window_start = (now_epoch // policy.window_seconds) * policy.window_seconds
    retry_after = max(1, window_start + policy.window_seconds - now_epoch)
    return RateLimitDecision(policy=policy.name, retry_after=retry_after, limit=policy.limit)
