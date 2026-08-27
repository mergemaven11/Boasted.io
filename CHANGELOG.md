# Changelog

All notable BragStack product changes are recorded here.

## Unreleased

### Added
- Started the BragStack mobile initiative for iOS and Android under tracking issue #200.
- Added a React Native / Expo mobile scaffold with BragStack branding and dark theme tokens.
- Added starter Home, Accomplishments, Add, Profile, and Settings navigation.
- Added secure on-device access-token storage and a reusable authenticated API client.
- Added a mobile roadmap covering product parity, native features, store readiness, security, QA, and release.

### Security / privacy
- Mobile foundation requests no unnecessary native permissions.
- Sensitive session tokens are stored with Expo SecureStore rather than plaintext application storage.
- Mobile product principles preserve BragStack's private-by-default handling of workplace evidence.
