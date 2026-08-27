# BragStack Mobile Testing

BragStack Mobile is pre-release. Use this checklist before treating a build as store-ready.

## Codespaces / local code checks

From the repository root:

```bash
cd mobile
node --version
npm install
npm run doctor
npm run test:ci
npx expo export --platform web --output-dir dist-ci
```

Expo SDK 57 requires Node 22.13 or newer. If `node --version` is older, switch the environment to Node 22 before installing dependencies.

Expected result: Expo Doctor passes, the Jest suites pass with coverage thresholds, and the web bundle export completes without an unhandled error.

## Interactive Codespaces preview

Create `mobile/.env` from `.env.example` and set `EXPO_PUBLIC_API_URL` to a BragStack API URL reachable from the preview/device. Do not commit secrets.

Then:

```bash
npm start
```

For a fast browser smoke test, press `w` in Expo or run `npm run web`. Browser testing is useful for JavaScript/runtime/UI checks but does not validate native SecureStore, iOS/Android lifecycle, signing, or store behavior.

## Manual acceptance checks

- Official BragStack brandmark is visible and not replaced by a placeholder.
- Authenticated UI uses near-black, warm ivory, and BragStack peach.
- Login rejects empty credentials and surfaces backend errors.
- A valid verified BragStack account can sign in.
- Relaunch restores a valid session.
- Expired/invalid sessions return to sign-in instead of trapping the user.
- Sign out clears the local session.
- Tabs navigate without crashes or blank screens.
- Quick Capture cannot preview an empty accomplishment.
- A missing result remains explicitly missing; BragStack does not invent an outcome.
- Draft/proof UI remains private by default.
- No unexpected device permission prompt appears during normal launch/navigation.
- Text remains readable at narrow/mobile widths.
- No passwords, access tokens, or confidential evidence appear in logs/errors.

## Real-device checks required later

Run preview/internal builds on at least one current iPhone and one current Android device. Verify SecureStore persistence, keyboard behavior, safe areas, gestures, app background/foreground lifecycle, network loss/retry behavior, deep links when implemented, accessibility/dynamic text, and account deletion/recovery flows.

## Store gate

Do not submit to App Store Connect or Google Play production until automated checks pass, real-device testing passes, production signing/configuration is complete, privacy/data-safety disclosures match actual behavior, account deletion is verified, Terms/Privacy links work, store metadata/screenshots are final, and the release candidate uses the production API.
