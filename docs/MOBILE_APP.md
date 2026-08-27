# BragStack Mobile App

BragStack Mobile is the native iOS and Android client for the BragStack career-evidence platform. It is under active pre-release development and is tracked by issue #200.

## Product goal

Mobile should make it easier to capture meaningful work while the details are still fresh without creating a separate account system, separate career history, or weaker privacy model.

The mobile client reuses the existing FastAPI backend, authentication model, Impact Receipt semantics, profile model, and private-by-default trust principles.

## Current foundation

- React Native / Expo cross-platform application under `mobile/`
- iOS bundle identifier and Android package: `com.bragstack.app`
- canonical BragStack vector brandmark from `frontend/public/brandmark.svg`
- authenticated-app palette from the BragStack Brand Guide
- Home, Proof, Add, Profile, and Settings navigation
- real password sign-in against `POST /auth/login`
- verified-email enforcement inherited from the backend
- encrypted access-token storage with Expo SecureStore
- session restore through `GET /auth/me`
- sign out that clears the local mobile token
- shared authenticated Axios client
- interactive private-by-default Impact Receipt preview
- EAS preview and production build profiles
- no unnecessary native permissions in the foundation

## Authentication model

Mobile does not maintain a separate identity system.

1. The user signs in using the existing BragStack account.
2. `/auth/login` returns the normal BragStack bearer token and serialized user.
3. The token is stored through Expo SecureStore rather than plaintext application storage.
4. On app launch, the client attempts `/auth/me` to restore the session.
5. Invalid or expired sessions are cleared and the user returns to sign-in.
6. Sign out removes the stored token.

Registration, email verification, password reset, recovery deep links, and account-deletion UX must be completed and tested before store release.

## Brand system

The mobile product follows the authenticated BragStack app context rather than using the marketing palette as its primary UI.

- app background: `#090909`
- primary text: `#F7F4EE`
- secondary text: `#AAA39A`
- primary action / accent: `#FFB184`
- canonical logo/brandmark retains the approved blue-purple-cyan gradient identity

The mobile app must not substitute a generic lettermark or create a separate mobile-only visual identity.

## Data and privacy model

Mobile should remain another client for the same BragStack record.

- private workplace evidence stays private by default
- sharing is intentional and separate from capture
- missing results, metrics, evidence, or confirmation are not invented
- evidence permissions are requested only when a user initiates a feature that needs them
- auth tokens and sensitive proof must not be written to logs, URLs, analytics payloads, or crash breadcrumbs
- public profile behavior must preserve the same publication boundaries as web

## Store-readiness gate

Before the PR or later release work can be called store-ready, BragStack must complete:

- live accomplishment and Impact Receipt reads/writes
- registration, verification, reset, recovery, and deletion flows
- loading, empty, retry, offline, and expired-session states
- accessibility and dynamic-text validation
- device/OS compatibility testing
- production API configuration
- app icon, splash, screenshots, and store metadata
- Apple privacy disclosures and required-reason review
- Google Play Data safety disclosure
- Terms, Privacy, support, and account-deletion links
- signing and release credentials
- TestFlight and Play internal testing
- mobile CI, dependency/security validation, and production build verification
- security review of token lifecycle, deep links, logs, evidence handling, and third-party SDKs

## Release truth

The mobile app is **pre-release** until production listings are actually live. Documentation, marketing, support, and investor materials should distinguish between:

- implemented mobile foundation
- functionality still under development
- internal/beta availability
- public App Store / Google Play availability

Do not describe the app as publicly downloadable before the applicable production listing is live.

## Related documentation

- `mobile/README.md` — local development and current implementation status
- `docs/ROADMAP.md` — phased mobile delivery plan
- `docs/MOBILE_CUSTOMER_GUIDE.md` — customer-facing mobile copy source
- issue #200 — mobile program epic
- PR #201 — initial mobile foundation
