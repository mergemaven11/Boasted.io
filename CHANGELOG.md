# Changelog

All notable BragStack product changes are recorded here.

## Unreleased

### Added
- Started the BragStack mobile initiative for iOS and Android under tracking issue #200.
- Added a React Native / Expo mobile scaffold for iOS and Android.
- Added starter Home, Proof, Add, Profile, and Settings navigation.
- Added a polished mobile product preview with Proof Pulse metrics, proof-status badges, recent proof cards, and mobile-first navigation.
- Added an interactive private-by-default Impact Receipt capture preview.
- Added real mobile sign-in against the existing `/auth/login` API, encrypted token storage, `/auth/me` session restore, and sign out.
- Added the canonical BragStack vector brandmark from `frontend/public/brandmark.svg` to the native mobile UI.
- Aligned mobile UI tokens with the official authenticated-app palette from the BragStack Brand Guide: near-black, warm ivory, and BragStack peach, while preserving blue/purple/cyan as brand identity accents.
- Added EAS preview/production build profiles and an example mobile API environment configuration.
- Added a mobile roadmap covering product parity, native features, store readiness, security, QA, and release.

### Security / privacy
- Mobile foundation requests no unnecessary native permissions.
- Sensitive session tokens are stored with Expo SecureStore rather than plaintext application storage.
- Mobile product principles preserve BragStack's private-by-default handling of workplace evidence.
- Demo capture explicitly avoids inventing missing result data and keeps draft proof private by default.
