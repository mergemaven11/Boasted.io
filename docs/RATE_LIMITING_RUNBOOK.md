# Boasted API rate limiting runbook

Boasted uses MongoDB-backed fixed-window counters so abuse limits are shared across API instances. Client addresses are HMAC-hashed before they are stored. Raw client IP addresses are not written to the rate-limit collection.

## Default limits

| Policy | Requests | Window | Applies to |
| --- | ---: | ---: | --- |
| `auth_login` | 10 | 10 minutes | `POST /auth/login` |
| `auth_register` | 5 | 1 hour | `POST /auth/register` |
| `auth_email` | 5 | 1 hour | verification resend and password-reset request |
| `auth_confirm` | 20 | 1 hour | verification/reset confirmation |
| `oauth` | 30 | 10 minutes | Google/GitHub OAuth login and callback |
| `receipt_verification_send` | 10 | 1 hour | authenticated verifier email requests |
| `receipt_verification_public` | 60 | 1 minute | anonymous verifier-token view/decision endpoints |
| `public_profile` | 180 | 1 minute | slug-scoped public Proof Profile reads |

A blocked request returns HTTP `429` with a generic response body and `Retry-After`, `RateLimit-Limit`, and `RateLimit-Reset` headers. The limiter runs before account lookup, so its response does not disclose whether an email address has an account.

## Configuration

Limits can be overridden with the `RATE_LIMIT_*` environment variables documented in `.env.example`. `RATE_LIMIT_HASH_KEY` should be a dedicated long random value in production. If it is absent, the backend falls back to `JWT_SECRET` for the HMAC key.

`RATE_LIMIT_TRUST_PROXY_HEADERS` is disabled by default. Enable it only when the deployment proxy is trusted to sanitize `X-Forwarded-For`; otherwise Boasted uses the ASGI client address and ignores the header.

## Storage and cleanup

Counters live in the MongoDB `rate_limits` collection. Every bucket has an `expires_at` timestamp. Deployment/maintenance must run the normal core-index setup so `rate_limits_ttl` exists with `expireAfterSeconds=0`. MongoDB then removes expired buckets automatically.

## Failure behavior

`RATE_LIMIT_FAIL_OPEN=true` is the default. If MongoDB raises an error specifically while updating an abuse counter, Boasted logs the limiter error and continues the request. This prevents the abuse-control layer from becoming an authentication outage. The main readiness check should still surface broader MongoDB failures.

Set `RATE_LIMIT_FAIL_OPEN=false` only for an incident where fail-closed abuse protection is explicitly preferred. In that mode a limiter storage failure is treated as a temporary block.

## Incident override procedure

1. Identify the affected policy from the endpoint and logs.
2. Prefer increasing only that policy's environment limit rather than disabling rate limiting globally.
3. Redeploy/restart the API so environment overrides are loaded.
4. If a false-positive incident is severe, temporarily set `RATE_LIMIT_ENABLED=false` and redeploy, then restore protection after the underlying cause is fixed.
5. Record the reason, start/end time, old/new values, and operator in the incident record.
6. Never delete or modify user data to work around a rate-limit incident.

## Verification after changes

- Confirm login/register/reset and verifier-email endpoints return their normal response below the threshold.
- Confirm anonymous verification-token view/decision traffic is limited independently from verifier-email sends.
- Confirm the next request above the threshold returns `429` and a positive `Retry-After`.
- Confirm a new time window accepts requests again.
- Confirm `/health` and `/ready` are never rate limited.
- Confirm public Proof Profile reads remain usable under normal browsing traffic.
- Confirm `rate_limits_ttl` exists in the production database after index maintenance.
