# BragStack Mobile — Customer Guide

> **Status: pre-release.** BragStack Mobile is in active development for iOS and Android and is not yet publicly available in the Apple App Store or Google Play.

## What BragStack Mobile is for

BragStack Mobile is designed to help you capture meaningful work while the details are still fresh, then use the same professional proof across BragStack on web and mobile.

The first public release is intended to support:

- signing in with an existing BragStack account
- restoring a secure signed-in session on your device
- viewing a mobile dashboard and proof library
- quickly capturing a new accomplishment
- working with Impact Receipts using the same trust model as the web product
- accessing profile and account settings
- keeping private workplace evidence private unless you intentionally share it

## What is already built into the mobile foundation

The current mobile foundation includes the native iOS/Android app structure, official BragStack branding, the authenticated BragStack theme, real account sign-in, encrypted on-device session storage, session restore, sign out, mobile navigation, and internal preview/release build configuration.

Some screens still use preview data while live mobile data flows are completed.

## What is still being completed before launch

Before public release, BragStack is completing and validating:

- live accomplishment and Impact Receipt persistence across mobile screens
- registration, email verification, password reset, and recovery flows
- loading, retry, offline, expired-session, and API error states
- accessibility and dynamic-text behavior
- device and operating-system compatibility
- account-deletion behavior and privacy/support links
- Apple privacy disclosures and Google Play Data safety disclosures
- production signing, TestFlight, Google Play internal testing, store assets, and final security/release review

## Privacy and permissions

BragStack Mobile follows the same private-first approach as the web product. Sensitive workplace evidence should not become public automatically.

The app should ask for a device permission only when a feature genuinely needs it and, where possible, only after you start that action. A missing result, metric, or piece of evidence stays missing; BragStack should not invent professional outcomes to make a record look more complete.

## Your account and data

BragStack Mobile is being built to use the same BragStack account and backend as the web product rather than creating a separate mobile-only account system.

At launch, supported mobile data should sync through the same BragStack record so you can move between devices without maintaining two separate career histories.

## Support

During pre-release testing, include the following when reporting a mobile problem when available:

- device type
- operating-system version
- BragStack app/build version
- the exact non-sensitive error message or behavior

Never send BragStack passwords, access tokens, confidential employer evidence, or full payment information to support.

## Store availability

Installation links and supported OS versions will be added only after BragStack has completed internal testing and the production listings are live.
