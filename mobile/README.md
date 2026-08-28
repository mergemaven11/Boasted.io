# BragStack Mobile

Cross-platform iOS and Android client for BragStack, built with React Native and Expo.

> **Status:** active pre-release development. The app is not yet publicly available in the Apple App Store or Google Play.

## Run locally

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:8000 npm start
```

For a physical device, set `EXPO_PUBLIC_API_URL` to an address the device can reach rather than `localhost`.

Preview and production EAS profiles are configured to use the canonical BragStack production API at `https://api.usebragstack.com`.

## Current implementation

- React Native / Expo app for iOS and Android
- Official BragStack vector brandmark and authenticated-app theme
- Responsive phone/tablet layout with safe-area handling
- Home, Proof, Add, Profile, and Settings navigation
- Real password sign-in through `/auth/login`
- In-app account registration through `/auth/register`
- Verification-email resend support
- Password-reset request support
- Encrypted access-token storage through Expo SecureStore
- Session restore through `/auth/me`
- Sign out that clears the local token
- Live accomplishments and Impact Receipts loaded from the production APIs
- Pull-to-refresh, loading, empty, retry/error presentation
- Real private-by-default accomplishment capture through `/entries`
- Profile editing through `/auth/me/profile`
- EAS preview and production build profiles
- Mobile CI with Expo Doctor, unit/coverage tests, and bundle export smoke testing
- No unnecessary native permissions

## Authentication behavior

BragStack Mobile shares the same identity system as the web app. Password login requires a verified email. Registration and reset requests use the existing BragStack email flows.

Verification and password-reset emails currently finish in the BragStack web experience. Native deep-link completion remains a release-hardening task.

Google and GitHub sign-in are intentionally not exposed in the native app yet. The current backend OAuth callback returns to the web app, and an iOS release that exposes third-party social login must also satisfy Apple's sign-in requirements. Web preview may continue to expose those providers.

## Data behavior

Home and Proof use live authenticated BragStack data. Quick Capture writes a real accomplishment to the signed-in account and always creates it as private. The capture form requires context, contribution, and impact instead of inventing missing career evidence.

Impact Receipts are read live. Full receipt creation/editing, evidence attachment, and verification workflows remain later mobile slices.

## Public-store blockers

Do not call the app store-ready until these gates are complete:

- in-app account deletion and end-to-end deletion verification
- native verification/reset deep links or an explicitly validated web-return flow
- full accessibility and dynamic-text review
- app icon, splash, screenshots, store copy, and support metadata
- Apple privacy disclosures / required-reason review
- Google Play Data safety disclosure
- iOS signing and TestFlight validation
- Android signing and Play internal testing
- device/OS compatibility matrix and release QA
- security review of tokens, deep links, logs, analytics, and evidence handling
- native social sign-in only after the callback flow and Apple requirements are satisfied

## Documentation

- `../docs/MOBILE_APP.md` — architecture, auth, brand, privacy, and store-readiness gates
- `../docs/MOBILE_CUSTOMER_GUIDE.md` — customer-facing mobile guidance source
- `../docs/ROADMAP.md` — phased delivery plan and success criteria
- issue #200 — mobile program epic
- PR #201 — mobile foundation and store-readiness work
