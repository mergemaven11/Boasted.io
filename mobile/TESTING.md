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

For the quickest end-to-end UI test in Codespaces, use the deployed BragStack API rather than `localhost`:

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://bragstack-api-bxf3.onrender.com npm run web
```

Open the forwarded Expo web port shown by Codespaces (normally 8081). If the Ports panel does not open it automatically, open the forwarded port from the Codespaces **Ports** tab.

Do not copy `.env.example` unchanged for a browser preview in Codespaces because `http://localhost:8000` would refer to the computer running the browser rather than the Codespace. If you intentionally run the backend inside the Codespace, either leave `EXPO_PUBLIC_API_URL` unset so the app can derive the forwarded `-8000.app.github.dev` host, or set it to the exact forwarded backend URL.

Browser testing is useful for JavaScript/runtime/UI checks but does not validate native SecureStore, native rotation callbacks, iOS/Android lifecycle, signing, or store behavior.

## Test phones and tablets in Chrome DevTools

In the Expo web preview:

1. Open Chrome DevTools.
2. Toggle the device toolbar (`Ctrl+Shift+M`).
3. Test each size in portrait.
4. Rotate the device toolbar and repeat in landscape.
5. Keep zoom at 100% while checking layout; use browser zoom separately only for accessibility checks.

Minimum viewport matrix:

| Device class | Portrait | Landscape |
| --- | ---: | ---: |
| Small phone / iPhone SE class | 375 × 667 | 667 × 375 |
| Standard Android phone | 412 × 915 | 915 × 412 |
| Large iPhone / Pro Max class | 440 × 956 | 956 × 440 |
| Small tablet / iPad mini class | 744 × 1133 | 1133 × 744 |
| Standard tablet / iPad class | 820 × 1180 | 1180 × 820 |
| Large tablet / iPad Pro class | 1032 × 1376 | 1376 × 1032 |
| Android tablet baseline | 800 × 1280 | 1280 × 800 |

For every viewport, verify there is **no horizontal clipping**, no unreachable action, no content hidden behind the tab bar or safe area, and forms remain usable when the on-screen keyboard would reduce vertical space.

## Landscape and tablet acceptance checks

- The app can rotate between portrait and landscape; Expo configuration uses `orientation: default`.
- iOS tablet support remains enabled with `supportsTablet: true`.
- Login/register/reset content stays centered and scrollable on short landscape screens.
- Home, Proof, Add, Profile, and Settings remain usable in both orientations.
- Cards never extend beyond the visible viewport.
- Long titles, email addresses, API URLs, tags, and proof text wrap instead of causing horizontal overflow.
- Bottom navigation remains reachable on phones and does not cover page content.
- Tablet layouts use the available width without stretching form controls to an unreadable line length.
- Landscape phone layouts prioritize vertical space and remain scrollable.
- Rotation does not discard unsaved form values.

## Manual product acceptance checks

- Official BragStack brandmark is visible and not replaced by a placeholder.
- Authenticated UI uses the approved BragStack mobile visual system.
- Login rejects empty credentials and surfaces backend errors.
- A valid verified BragStack account can sign in.
- Registration reaches the real backend and communicates verification state.
- Password reset request reaches the real backend.
- Relaunch restores a valid session on native builds.
- Expired/invalid sessions return to sign-in instead of trapping the user.
- Sign out clears the local session.
- Tabs navigate without crashes or blank screens.
- Home and Proof show real synced data rather than demo metrics/cards.
- Quick Capture writes a real private accomplishment.
- Missing professional results are never fabricated.
- New proof remains private by default.
- Profile edits persist through the production API.
- Pull-to-refresh works on data screens.
- Loading, empty, and API-error states remain legible at all target sizes.
- No unexpected device permission prompt appears during normal launch/navigation.
- No passwords, access tokens, or confidential evidence appear in logs/errors.

## Real-device checks required before store release

Codespaces responsive preview is not enough to certify device support. Run preview/internal builds on at least:

- one smaller iPhone
- one current large iPhone
- one current Android phone
- one iPad or iPad mini
- one larger iPad/iPad Pro class device or simulator
- one Android tablet class device or emulator

Test both portrait and landscape where the OS/device supports rotation. Verify SecureStore persistence, keyboard behavior, safe areas, gestures, background/foreground lifecycle, network loss/retry behavior, deep links when implemented, accessibility/dynamic text, account deletion/recovery flows, and native rotation behavior.

## Store gate

Do not submit to App Store Connect or Google Play production until automated checks pass, the phone/tablet orientation matrix passes, real-device testing passes, production signing/configuration is complete, privacy/data-safety disclosures match actual behavior, account deletion is verified, Terms/Privacy links work, store metadata/screenshots are final, and the release candidate uses the production API.
