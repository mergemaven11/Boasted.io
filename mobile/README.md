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

- BragStack dark brand theme with sky-blue and violet accents
- iOS and Android application identifiers
- Bottom-tab navigation
- Starter Home, Accomplishments, Add, Profile, and Settings screens
- Axios API client
- Encrypted access-token storage through Expo SecureStore
- No unnecessary native permissions

## Next implementation slices

1. Connect login/session bootstrap to the existing FastAPI auth endpoints.
2. Connect accomplishments and Impact Receipts to real API data.
3. Implement quick-add validation and editing.
4. Add profile controls and public-profile deep links.
5. Add accessibility, offline/error states, automated tests, and release QA.
6. Complete App Store / Google Play metadata, privacy disclosures, screenshots, signing, and internal testing.
