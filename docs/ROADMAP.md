# BragStack Roadmap

## Mobile initiative — iOS + Android

BragStack Mobile is an active pre-release initiative tracked by issue #200. It is intended to extend the same BragStack account, proof record, trust model, and privacy defaults to a native cross-platform client rather than create a separate mobile product.

### Phase 1: Foundation — substantially complete
- Expo / React Native application scaffold
- canonical BragStack brandmark
- authenticated-app theme tokens from the BragStack Brand Guide
- navigation shell for Home, Proof, Add, Profile, and Settings
- real sign-in against the existing `/auth/login` endpoint
- verified-email behavior inherited from the backend
- secure on-device token storage with Expo SecureStore
- session restore through `/auth/me`
- sign out that clears the local mobile session
- authenticated API client configuration
- EAS preview / production build profiles
- store-safe default permission posture
- mobile engineering and customer documentation foundation

### Phase 2: Core product parity — next
- Dashboard backed by live API data
- Accomplishments / Impact Receipts list and detail views backed by live data
- Quick-add accomplishment persistence
- Edit and delete flows with confirmation
- Registration and email verification UX
- Password reset / recovery deep-link flow
- Profile editing and public-profile controls
- Loading, empty, expired-session, offline, retry, and API error states
- Automated tests for auth/session/data flows

### Phase 3: Mobile-native value
- Camera/file evidence capture with explicit privacy controls
- Native share sheet for public profile and selected proof
- Deep links into public profiles and selected mobile screens
- Optional biometric re-entry protection where appropriate
- Carefully scoped, opt-in notifications only when they provide clear user value
- Mobile analytics focused on activation/friction without sending sensitive proof content

### Phase 4: Store readiness
- Accessibility and dynamic-text review
- App icon, splash screen, screenshots, and store copy
- Apple privacy disclosures / required-reason review
- Google Play Data safety disclosure
- Account deletion flow validation
- Terms, Privacy Policy, and support links
- Production API configuration
- iOS signing / TestFlight
- Android signing / Play internal testing
- Crash reporting decision, implementation, and disclosure if adopted
- Device / OS compatibility matrix
- Third-party SDK and mobile dependency review
- Mobile CI and production-build verification

### Phase 5: Release and hardening
- Beta feedback pass
- Performance and crash-free-session targets
- Security review of token lifecycle, deep links, logs, analytics, and evidence handling
- App Store and Google Play production submission
- Store-review issue handling
- Support playbooks and customer-facing known limitations
- Post-launch crash/auth/API/error monitoring

## Mobile success criteria
1. Reduce time from a real-world win to a useful BragStack record.
2. Preserve reliable session behavior without weakening account security.
3. Keep private workplace evidence private by default.
4. Make web ↔ mobile movement feel like one BragStack account and record.
5. Drive useful repeat capture/review behavior rather than notification spam.
6. Ship only when store disclosures and customer documentation match actual production behavior.

## Mobile product principles
1. Keep private workplace evidence private by default.
2. Reuse BragStack's existing backend and trust model instead of duplicating business logic in the client.
3. Ask for device permissions only at the moment a feature genuinely needs them.
4. Keep core accomplishment capture fast enough to use immediately after a win.
5. Preserve user control over what becomes public, exported, or shared.
6. Never invent missing professional results, evidence, verification, or metrics.
7. Distinguish pre-release capability from publicly shipped store availability.

## Documentation
- `docs/MOBILE_APP.md` — architecture, auth, brand, privacy, and release gates
- `docs/MOBILE_CUSTOMER_GUIDE.md` — source for customer-facing mobile guidance
- `mobile/README.md` — local setup and implementation status

Tracking epic: #200
Foundation PR: #201
