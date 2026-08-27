# Changelog

All notable BragStack product changes are recorded here.

## Unreleased

### Added
- Started the BragStack mobile initiative for iOS and Android under tracking issue #200.
- Added a React Native / Expo mobile scaffold with BragStack branding and dark theme tokens.
- Added starter Home, Proof, Add, Profile, and Settings navigation.
- Added a polished mobile product preview with Proof Pulse metrics, proof-status badges, recent proof cards, and mobile-first navigation.
- Added an interactive private-by-default Impact Receipt capture preview and public-profile visibility preview.
- Added secure on-device access-token storage and a reusable authenticated API client.
- Added EAS preview/production build profiles and an example mobile API environment configuration.
- Added a mobile roadmap covering product parity, native features, store readiness, security, QA, and release.

### Security / privacy
- Mobile foundation requests no unnecessary native permissions.
- Sensitive session tokens are stored with Expo SecureStore rather than plaintext application storage.
- Mobile product principles preserve BragStack's private-by-default handling of workplace evidence.
- Demo capture explicitly avoids inventing missing result data and keeps draft proof private by default.
