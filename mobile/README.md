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

## Foundation included

- Official BragStack vector brandmark based on `frontend/public/brandmark.svg`
- Official authenticated-app palette from the BragStack Brand Guide: `#090909`, `#F7F4EE`, and `#FFB184`
- Home, Proof, Add, Profile, and Settings navigation
- Real sign-in through `/auth/login`
- Encrypted access-token storage through Expo SecureStore
- Session restore through `/auth/me`
- Sign out that clears the local token
- Axios API client for the existing FastAPI backend
- Interactive private-by-default Impact Receipt preview
- EAS preview and production build profiles
- No unnecessary native permissions

## Auth behavior

BragStack's backend requires verified email before password login. The mobile client surfaces backend auth errors directly, stores successful JWT sessions securely, restores sessions on launch, and clears expired or invalid sessions.

Registration, email verification, password reset, recovery deep links, and account deletion UX remain required store-readiness work. The existing backend already exposes the relevant account/session APIs.

## Data status

Authentication is connected to the real backend. Some product screens still use preview proof data while live accomplishment and Impact Receipt reads/writes are completed. Customer-facing documentation must distinguish preview behavior from persisted production behavior.

## Next implementation slices

1. Connect Impact Receipts and accomplishments to live API data.
2. Add registration, verification, reset, and recovery flows appropriate for mobile.
3. Implement quick-add persistence, validation, and editing.
4. Add public-profile controls and deep links.
5. Add accessibility, offline/error states, automated tests, and release QA.
6. Complete App Store / Google Play metadata, privacy disclosures, screenshots, signing, internal testing, and mobile CI.

## Documentation

- `../docs/MOBILE_APP.md` — architecture, auth, brand, privacy, and store-readiness gates
- `../docs/MOBILE_CUSTOMER_GUIDE.md` — customer-facing mobile guidance source
- `../docs/ROADMAP.md` — phased delivery plan and success criteria
- issue #200 — mobile program epic
- PR #201 — initial mobile foundation
