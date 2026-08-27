# Changelog

All notable changes to BragStack are documented here.

This changelog tracks **merged, shipped repository changes only**. Open or draft pull requests are not listed as released work. Entries are grouped by date and by impact using a Keep a Changelog-style structure. The exhaustive event-level history, including the direct-commit era before pull requests, is maintained in the internal **BragStack — Changelog** Google Sheet.

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
- Restored and iterated on the professional Aisha interviewer across mobile/tablet/desktop, improving audio, visual rendering, responsive layout, interview sequencing, evidence-anchored scoring, and interview feedback. (#133, #134, #135, #136, #139, #140, #143)
- Rebuilt Resume Builder around structured import, ATS-safe reconstruction, ATS coaching, editing, mobile support, and evidence-first analysis. (#123, #125, #127, #131, #138, #142)
- Improved customer Docs with visual product guidance and clearer troubleshooting/support separation. (#128, #130, #137)

### Fixed
- Fixed dark-mode contrast and readability on Settings → Plan & billing. (#146)

### Security
- Hardened BragStack application security with API security headers, HSTS on HTTPS, narrower CORS rules, password byte-length protection, JWT lifecycle claims and IDs, dependency vulnerability auditing, safer authenticated search handling, and dedicated Security CI. (#151)

## 2026-08-24

### Added
- Added the Pro Practice Interviewer, a Mongo-backed career/question catalog, question rotation, and meaning-aware Career Intelligence coaching without making the core flow dependent on a paid model API. (#90, #91, #93, #100)
- Added the evidence-backed Pro Resume Builder MVP with job-description analysis, Impact Receipt matching, source-linked bullets, readiness/gap analysis, saved versions, and export paths. (#97)
- Added production health/readiness probes, tested MongoDB indexes, and restore-validation safeguards for operational readiness. (#88, #94, #95, #96)
- Added guided onboarding, Settings organization, profile appearance controls, and expanded Pro career-tool navigation. (#60, #61, #71, #72, #79)

### Changed
- Hardened Resume Builder provenance and ATS claims so manual edits require source review and matching remains evidence-aware rather than overstating parser certainty. (#99)
- Iterated heavily on Aisha’s interview room, browser speech behavior, sequencing, device responsiveness, and catalog-backed question flow. (#104, #110, #111, #112, #114, #115, #116, #117, #118, #119, #120, #122, #124, #126, #129)
- Expanded BragStack customer documentation and searchability. (#121)

### Security
- Hardened auth recovery against account-enumeration side channels. (#92)
- Hardened production OAuth callback URL handling behind Render/proxy infrastructure. (#106)

## 2026-08-23

### Added
- Added Google and GitHub OAuth, Stripe Checkout/subscription lifecycle handling, Free/Pro server-side entitlements, password reset, and email verification for password signups. (#40, #41, #43, #44)
- Added customer-facing Privacy Policy, Terms, NDA/confidential-work guidance, Docs, SEO/search discovery assets, and expanded legal/product documentation. (#45, #46, #49, #55, #56)
- Added profile editing, saved profile images, and career-inspired Proof Profile themes with private appearance settings. (#57, #58, #60, #61)
- Added Google Analytics 4 and role-based BragStack contact routing. (#62, #65)

### Changed
- Redesigned the authenticated dashboard, auth pages, landing experience, mobile navigation, branding, and public profile presentation. (#42, #50, #51, #52, #53, #54, #59, #63, #69, #75, #80)
- Added a one-hour correction window for newly created accomplishments. (#48)

### Security
- Moved JWT secrets and production CORS/OAuth credentials into environment-managed configuration. (#39)

## 2026-08-22

### Added
- Stabilized Impact Receipt core loop v2 with standalone receipt creation, measurable impact, multiple evidence items, skills, privacy controls, CRUD/reopen behavior, evidence-only performance-review output, job-targeted resume material, and beta feedback/pull metrics. (#38)

## 2026-08-20

### Added
- Shipped Packet Platform v1.2 with accomplishment selection/pinning, selective sections, user-authored annotations, packet themes, branding controls, export audit metadata, secure private sharing, and verified-recognition semantics. (#37)

## 2026-08-19

### Added
- Landed the V1.1 product foundation and public career analytics experience. (#32, #10)
- Added persistent app navigation, paginated accomplishment/receipt libraries, and the recruiter-facing Proof Profile. (#11)
- Added the Free/Pro entitlement foundation and premium marketing/pricing experience. (#12)
- Added Performance Review, Promotion, Interview, and Certification/Licensure packets with evidence-backed server-generated PDFs. (#19, #31, #33, #35)
- Added cross-career packet regression coverage to keep packet behavior career-neutral across professions. (#34)

## 2026-08-17

### Changed
- Polished BragStack for the V1 release with portable/searchable reports, cleanup of duplicated models, V1 product documentation, and an explicit separation between shipped product and post-V1 roadmap work. (#9)

## 2026-08-07

### Added
- Added Reports Hub v1, owner-controlled Impact Receipt visibility, public receipts with private evidence filtered out, profile persistence, and report output covering accomplishments, receipts, evidence, confirmations, skills, categories, trust signals, quantified results, highlights, and resume bullets. (#8)

## 2026-08-06

### Added
- Added Impact Receipts v1 with structured accomplishment/contribution/result/evidence/skills/credit/confirmation fields, persistence, ownership checks, duplicate protection, pagination, dashboard cards, and public-profile improvements. (#7)

## 2026-06-09 to 2026-06-30

### Added
- Added JWT authentication and private entry ownership, frontend login/register, protected dashboard behavior, and authenticated API access. (#1)
- Added public BragStack sharing APIs, slug-scoped public profiles, weekly/tag/category summaries, and frontend public-profile integration. (#2, #5, #6)
- Added the initial backend test suite and GitHub Actions CI workflow. (#3, #4)

## 2026-05-26 to 2026-06-09 — repository foundation

Before the pull-request workflow began, the repository established the original BragStack MVP through direct commits: entry update and weekly reporting, skill/category summaries, keyword search, pagination, resume-bullet generation, a React dashboard, entry edit/delete, public brag metadata/page support, and the first JWT/private-ownership and frontend-auth implementation. The repository root commit is dated **2026-05-26**.

---

## Maintenance rules

- Add an entry only after the underlying pull request has merged to `main`.
- Prefer user/product impact over commit-level implementation trivia.
- Include the pull request number for traceability.
- Use `Added`, `Changed`, `Fixed`, `Security`, `Deprecated`, or `Removed` when applicable.
- Do not claim an open PR, draft, planned roadmap item, or unverified deployment as shipped.
- Keep the Google Sheet as the exhaustive event-level ledger; keep this Markdown file focused on notable release/milestone history.
- For customer-facing release notes, summarize this canonical engineering changelog rather than copying internal/security implementation details blindly.
