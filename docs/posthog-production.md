# PostHog production setup

Boasted uses PostHog in production for product analytics, web analytics, privacy-safe session replay, and client-side error tracking. GA4 remains enabled alongside PostHog.

This setup is intentionally configured to get strong value from PostHog's free allowances without exposing the private career evidence users store in Boasted.

## Production project

- Project: `Boasted.io`
- Cloud: PostHog US
- API host: `https://us.i.posthog.com`
- Frontend env vars:
  - `VITE_POSTHOG_KEY`
  - `VITE_POSTHOG_HOST`
- PostHog is disabled on `localhost` and `127.0.0.1`.

Do not commit the project key to the repository. Keep it in the production environment configuration.

## What is captured

### Product and web analytics

The frontend initializes PostHog once in production and keeps GA4 running in parallel.

Boasted's existing privacy-filtered GA4 product events are forwarded to PostHog through the shared `dataLayer` bridge. PostHog also provides page/session analytics from its browser SDK.

Every PostHog event is registered with:

```text
app=boasted
environment=production
```

Authenticated users are identified with the application's internal user ID only. Names and email addresses are not sent by the identity bridge.

When a signed-in session ends, PostHog identity is reset so the next anonymous visitor does not inherit the previous user's identity.

## Session replay

Session replay is enabled for production debugging and UX analysis.

In the PostHog project UI, keep:

- **Record user sessions:** ON
- **Sampling:** 100% while traffic is comfortably inside the free allowance
- **Minimum duration:** none / 0 unless quota pressure requires filtering later
- **Performance capture:** ON
- **Console logs:** ON when available in replay settings
- **Network request/response bodies:** OFF unless a specific sanitized use case is reviewed first

The browser SDK applies privacy-first replay masking:

```js
session_recording: {
  maskAllInputs: true,
  maskTextSelector: "*",
  blockSelector: "[data-posthog-block], [data-private], [data-confidential]",
}
```

This means replay should preserve layout, navigation, clicks, timing, and UI behavior while hiding typed values and rendered text. Any especially sensitive surface should also use `data-posthog-block`, `data-private`, or `data-confidential`.

Do not weaken these masking defaults just to make recordings easier to read. Boasted can contain private career evidence, workplace details, and supporting proof.

## Error tracking

Client-side exception capture is enabled for:

- unhandled JavaScript errors
- unhandled promise rejections

Console-error ingestion is deliberately disabled in the SDK configuration to reduce noisy duplicate exceptions.

Current configuration:

```js
capture_exceptions: {
  capture_unhandled_errors: true,
  capture_unhandled_rejections: true,
  capture_console_errors: false,
}
```

When source maps are available through the GitHub/build integration, use them so production stack traces resolve to source files and lines.

## Free-max posture

The goal is **maximum useful coverage at $0**, not maximum event volume for its own sake.

As of September 2026, PostHog advertises these monthly free allowances for several core products:

| Product | Free allowance |
| --- | ---: |
| Product Analytics | 1,000,000 events/month |
| Session Replay | 5,000 recordings/month |
| Feature Flags | 1,000,000 requests/month |
| Managed warehouse | 1,000,000 rows/month |

PostHog pricing and limits can change, so the project's Billing/Usage page is the source of truth before changing sampling or enabling additional paid usage.

Recommended early-stage posture:

1. Keep session replay at 100% while usage is well below the replay allowance.
2. Keep privacy masking strict even when quota is plentiful.
3. Capture meaningful product events instead of duplicating low-value telemetry.
4. Keep network bodies off by default.
5. Review PostHog usage before enabling pay-as-you-go or adding a payment method.
6. Reduce replay sampling only when actual usage approaches the free limit.

## Core Boasted events

PostHog receives the same privacy-filtered product events already emitted through Boasted's analytics layer, including core funnel and proof-building behavior such as signup, proof/accomplishment creation, Impact Receipt activity, sharing, exports, and activation milestones when those events are emitted by the application.

Do not add raw accomplishment text, evidence text, resume content, notes, document contents, access tokens, authentication headers, or other sensitive user payloads as event properties.

## Verification checklist

After a production deployment:

1. Open Boasted production in a fresh browser session.
2. Navigate across several pages and perform a harmless test flow.
3. Confirm new events appear in PostHog Activity/Product Analytics.
4. Confirm a session appears under Session Replay.
5. Open the replay and verify typed inputs and rendered text are masked.
6. Confirm performance data is present for the replay.
7. Trigger only a controlled test exception if needed and confirm it appears under Error Tracking.
8. Verify GA4 still receives its normal events.
9. Confirm no email address, name, proof text, or evidence body appears in PostHog event properties or replay content.

## Dashboards

Use `Boasted Product Overview` as the primary product dashboard. Founder/growth and product-health dashboards should contain real Boasted event-backed insights rather than legacy BragStack placeholders.

Useful dashboard groups include:

- acquisition and signup conversion
- first proof/accomplishment creation
- Impact Receipt adoption
- activation and time-to-value
- retention
- sharing/export behavior
- errors and affected sessions
- replay-assisted UX issues

## Deployment status

The production integration is tracked in PR #397 (`chore/posthog-production-boasted`). Keep the PR in draft until the repository's GitHub Actions runner outage tracked in issue #386 is resolved and the normal validation suite can run.

Do not bypass CI to ship analytics changes just because they are observability-only changes.
