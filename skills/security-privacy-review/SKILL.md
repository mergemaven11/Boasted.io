---
name: bragstack-security-privacy-review
description: Review BragStack changes for application-security, authorization, privacy, evidence-sharing, and data-minimization risks.
---

# BragStack Security & Privacy Review

## Use this skill when

- touching authentication, authorization, sharing, public profiles, exports, billing, integrations, uploads, evidence, admin/team features, or secrets
- reviewing a release candidate or security-sensitive PR

## Workflow

1. Identify assets and trust boundaries: account identity, private accomplishments, evidence metadata, shared credit, confirmations, public profile data, billing state, and organization data.
2. Trace who can create, read, update, delete, export, share, and discover each affected object.
3. Test horizontal access control explicitly: one user must not access another user's private object by changing an ID or slug.
4. Test vertical access control for plan/admin/team/enterprise capabilities. UI hiding is never sufficient authorization.
5. Review input handling, redirects, URLs, uploads, rendered text, and exported documents for injection or unsafe content behavior.
6. Keep secrets out of client bundles, logs, screenshots, fixtures, analytics payloads, and error responses.
7. Apply data minimization: public/share/export surfaces should include only fields required for that purpose. Private evidence stays private unless the user explicitly includes it.
8. Review retention, expiration, revocation, and audit needs for share links and organization workflows.
9. Check dependencies and CI security scans, but do not treat dependency scanning as a substitute for authorization and privacy tests.
10. Document residual risk and block merge for credible cross-user exposure, secret leakage, unsafe sharing defaults, or privilege bypass.

## Required output

- assets/trust boundaries reviewed
- authorization tests performed
- privacy/data-minimization findings
- secret/logging findings
- fixes required before merge
- residual risk

## Final checks

- private by default
- explicit user intent before sharing/importing sensitive evidence
- no cross-user access
- no client-side-only entitlement enforcement
- exports and analytics omit unnecessary sensitive data
