# BragStack Mobile

Cross-platform iOS and Android client for BragStack, built with React Native and Expo.

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

BragStack's backend requires verified email before login. The mobile client surfaces backend auth errors directly, stores successful JWT sessions securely, restores sessions on launch, and clears expired or invalid sessions.

Registration, email verification, password reset, and account deletion UX remain tracked store-readiness work. The existing backend already exposes registration, verification, password-reset, profile, and session APIs.

## Next implementation slices

1. Connect Impact Receipts to live API data.
2. Add registration, verification, and reset flows appropriate for mobile.
3. Implement quick-add persistence, validation, and editing.
4. Add public-profile controls and deep links.
5. Add accessibility, offline/error states, automated tests, and release QA.
6. Complete App Store / Google Play metadata, privacy disclosures, screenshots, signing, and internal testing.
