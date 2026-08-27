# Changelog

All notable changes to BragStack are documented here.

This changelog tracks **merged, shipped repository changes only**. Open or draft pull requests are not listed as released work. Entries are grouped by date and by impact using a Keep a Changelog-style structure.

## [Unreleased]

No merged changes have been recorded here yet.

## 2026-08-27

### Fixed
- Stabilized Aisha interview audio, microphone permission, and avatar behavior. Microphone access is now primed directly from the user start gesture on supported browsers, temporary permission streams are released immediately, typed-answer fallbacks remain intact, and the interviewer image no longer uses fake zoom/pan/rotate motion that reduced sharpness. (#196)

## 2026-08-26

### Added
- Added Career Intelligence v1 with deterministic skill evidence, quantified outcomes, evidence/confirmation signals, proof-gap analysis, recommended actions, authenticated intelligence endpoints, and a dedicated dashboard. The feature intentionally avoids opaque hiring or promotion-readiness scoring. (#177)
- Added an internal user accounts directory to the Ops Console with safe account search/filtering, plan and verification visibility, public profile links, audited resend-verification support actions, and no exposure of passwords, auth tokens, payment details, or private accomplishment content. (#173)
- Added persistent operational observability with sanitized Mongo-backed request traces, 14-day TTL retention, exception grouping, slow/failure views, and restricted Ops access. Request bodies, auth headers, query strings, tokens, exception messages, and raw user content are intentionally excluded. (#167)
- Added audited Ops team and role management with backend-enforced `support`, `ops`, `security`, and `admin` roles, last-admin protection, bootstrap-admin support, and persistent role-change audit records. (#165)
- Added the first usable BragStack Ops Console with backend-enforced RBAC, safe request telemetry, service/database diagnostics, bounded user lookup, and explicit redaction of sensitive authentication and career data. (#163)
- Added a reusable branded BragStack loading system with reduced-motion support and route/app initialization coverage. (#162)
- Added production bundle-budget regression checks so code-splitting and startup bundle size are continuously guarded in CI. (#157)
- Added production SEO/search quality gates covering sitemap consistency, canonical URLs, site navigation signals, metadata, private-route noindex behavior, and regression checks. (#155)

### Changed
- Improved Aisha interview presentation and ATS Scan behavior: route-level speech teardown, responsive interviewer states, evidence-first resume parsing, a BragStack-specific ATS compatibility score with explainable breakdown, and stronger parser fallbacks. ATS Scan remains explicitly non-predictive. (#176)
- Finished the branded loading rollout across Pro Career, Appearance Settings, and Ops initial-load states while preserving action-specific progress states. (#175)
- Modernized public product/SEO landing pages with clearer hierarchy, responsive navigation, stronger internal linking, canonical metadata, and accessible navigation semantics. (#154)
- Expanded branded loading states across Dashboard, Accomplishments, Impact Receipts, Profile, Billing, Upgrade, and public receipt-verification flows. (#166, #168, #164)
- Improved login and account-flow cold-start handling so users remain on BragStack’s branded auth UI while the Render API wakes, with readiness checks shared across password, OAuth, email-verification, and reset flows. (#172)
- Improved authentication UX and transactional email branding for account verification, password reset, and Impact Receipt verification, including safer HTML escaping and clearer expiry/security copy. (#171)
- Moved product CSS and analytics work off the public critical startup path to improve first-load performance while keeping functionality intact. (#161, #159)
- Added route-level code splitting so authenticated/heavy product surfaces no longer inflate public-page startup unnecessarily. (#156)

### Fixed
- Fixed Proof Profile accessibility semantics by adding an explicit accessible search label and current-page pagination state. (#185)
- Disabled legacy global public brag aggregation endpoints so public proof remains scoped to intentionally published user profile slugs. (#183)
- Fixed duplicate proof counting in Career Intelligence when an Impact Receipt enriches an accomplishment already linked by `source_entry_id`. (#179)
- Fixed the SEO landing-page navbar style regression by restoring the shared landing navigation styles. (#174)
- Fixed the Dashboard tag-summary React crash by normalizing current and legacy API response shapes at the frontend boundary. (#160)

### Security
- Added production API rate limiting and abuse protection backed by MongoDB fixed windows, HMAC-hashed client-address bucket keys, generic 429 responses, targeted auth/OAuth/public policies, TTL cleanup, and fail-open storage behavior to avoid turning limiter storage failures into an auth outage. (#191)
- Made Stripe webhook processing idempotent with an atomic event ledger, safe retry/reclaim behavior, signature verification preservation, and event-order protection that prevents older billing events from regressing newer subscription state. (#189)
- Added a full real-browser click audit in Frontend CI covering public/authenticated routes, nested and revealed controls, navigation safety, browser errors, and unhandled promise rejections. (#192)

## 2026-08-25

### Added
- Added cancellation-at-period-end billing controls, paid-through date visibility, resume-subscription support, and Stripe-aligned entitlement behavior that preserves Pro access through the already-paid billing period. (#144)
- Strengthened Google sitelink/search signals with crawlable public auth pages, route-aware robots metadata, structured navigation, sitemap alignment, and regression coverage. (#145, #148)

### Changed
- Restored the professional photographic Aisha interviewer and improved the interview room’s mobile/iPhone layout, safe areas, camera placement, touch targets, answer controls, and microphone status presentation. (#143)

### Fixed
- Fixed dark-mode contrast and readability on Settings → Plan & billing. (#146)

### Security
- Hardened BragStack application security with API security headers, HSTS on HTTPS, narrower CORS rules, password byte-length protection, JWT lifecycle claims and IDs, dependency vulnerability auditing, safer authenticated search handling, and dedicated Security CI. (#151)

---

## Maintenance rules

- Add an entry only after the underlying pull request has merged to `main`.
- Prefer user/product impact over commit-level implementation trivia.
- Include the pull request number for traceability.
- Use `Added`, `Changed`, `Fixed`, `Security`, `Deprecated`, or `Removed` when applicable.
- Do not claim an open PR, draft, planned roadmap item, or unverified deployment as shipped.
- For customer-facing release notes, summarize this canonical engineering changelog rather than copying internal/security implementation details blindly.
