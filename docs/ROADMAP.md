# BragStack Roadmap

## Mobile initiative — iOS + Android

### Phase 1: Foundation — in progress
- Expo / React Native application scaffold
- Shared BragStack theme tokens
- Navigation shell for Home, Accomplishments, Add, Profile, and Settings
- Secure on-device token storage
- Authenticated API client configuration
- Store-safe default permission posture

### Phase 2: Core product parity
- Login, logout, and session restore
- Dashboard backed by live API data
- Accomplishments / Impact Receipts list and detail views
- Quick-add accomplishment flow
- Edit and delete flows with confirmation
- Profile editing and public-profile controls
- Loading, empty, offline, retry, and API error states

### Phase 3: Mobile-native value
- Camera/file evidence capture with explicit privacy controls
- Native share sheet for public profile and selected proof
- Deep links into public profiles and selected mobile screens
- Optional biometric re-entry protection where appropriate
- Carefully scoped, opt-in notifications only when they provide clear user value

### Phase 4: Store readiness
- Accessibility and dynamic-text review
- App icon, splash screen, screenshots, and store copy
- Apple privacy disclosures / required reasons review
- Google Play Data safety disclosure
- Account deletion flow validation
- Terms and Privacy Policy links
- Production API configuration
- iOS signing / TestFlight
- Android signing / Play internal testing
- Crash reporting decision, implementation, and disclosure if adopted

### Phase 5: Release and hardening
- Beta feedback pass
- Device / OS compatibility matrix
- Performance and crash-free-session targets
- Security review of token lifecycle, deep links, logs, and evidence handling
- App Store and Google Play production submission

## Mobile product principles
1. Keep private workplace evidence private by default.
2. Reuse BragStack's existing backend and trust model instead of duplicating business logic in the client.
3. Ask for device permissions only at the moment a feature genuinely needs them.
4. Keep core accomplishment capture fast enough to use immediately after a win.
5. Preserve user control over what becomes public, exported, or shared.

Tracking epic: #200
