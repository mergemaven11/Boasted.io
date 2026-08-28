---
name: bragstack-release-readiness
description: Verify BragStack changes are safe to merge and release across CI, UX, security, observability, documentation, and rollback concerns.
---

# BragStack Release Readiness

## Use this skill when

- preparing a PR for merge
- releasing user-facing, security, reliability, billing, auth, or operational changes
- deciding whether a fix is actually done

## Workflow

1. Confirm the exact PR head SHA and ensure reviews/tests refer to that revision.
2. Verify required CI on that head: backend, frontend, security, and any feature-specific workflow.
3. Apply the relevant BragStack skills for the changed area: UI regression, API contract, security/privacy, and career-proof integrity.
4. Test the changed user journey end-to-end, including loading, empty, error, retry, and success states.
5. Check responsive behavior for user-facing UI and verify no known high-severity accessibility regression.
6. Confirm migrations/index changes are safe and backward-compatible where applicable. Avoid deployments that require fragile manual ordering unless documented.
7. Verify observability exists for meaningful new failure modes: structured logs, analytics events, health checks, or alerts as appropriate, without logging sensitive evidence.
8. Confirm rollout and rollback paths. Feature flags or staged rollout are preferred for higher-risk behavior.
9. Update user-facing/repository documentation and changelog when the change is notable.
10. Merge only when the branch is current, mergeable, required checks are green, and no unresolved blocker remains.

## Required output

- PR/head SHA
- CI status
- journey/viewport checks
- security/privacy status
- observability/rollback status
- docs/changelog status
- merge recommendation with blockers, if any

## Final checks

- exact head is green
- no known blocker hidden behind "works on my machine"
- production failure states are intentional
- rollback is understood
- notable changes are documented
