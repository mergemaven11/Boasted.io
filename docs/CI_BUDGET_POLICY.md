# Shared CI Budget Policy

Boasted and Variant Vault share one GitHub Actions budget.

## Monthly operating target

- Combined target: **1,800 Actions minutes per month** across both repositories.
- Protected reserve: **400–500 minutes** for release blockers, urgent UAT fixes, failed launch validation, and provider/service instability.
- The reserve is not normal development capacity.

GitHub does not expose the account billing counter directly inside ordinary repository workflows, so this is an operational cap enforced through workflow design, review discipline, timeouts, and avoiding duplicate runs rather than a workflow that can hard-stop billing at exactly 1,800 minutes.

## Standard workflow tiers

Both repositories use the same four-tier model:

1. **CI Fast** — manual pre-PR validation. Run backend, frontend, or both when you want a quick local-equivalent confidence check without paying for an automatic branch-push workflow. Superseded manual runs cancel automatically.
2. **CI PR** — pull requests. Medium regression coverage. Expensive browser/container/docs work is excluded. Dependency audits run only when dependency manifests change.
3. **CI Nightly** — scheduled heavy integration/browser/security coverage, but only when `main` changed during the prior 24 hours. A manual dispatch can force it when needed.
4. **CI Full Validation** — manual launch-grade validation. Run this before a major production launch, store release, or other high-risk cut. Do not run it for routine commits.

## Cost-control rules

- Never intentionally rerun a successful job just because another job failed.
- Retry only the failed job or failed workflow jobs when GitHub supports it.
- New commits must cancel obsolete in-progress PR and secret-scan runs.
- Use dependency caches and strict `timeout-minutes` on every paid runner job.
- Do not run container image builds, exhaustive docs, multi-browser device QA, or full release evidence on routine commits.
- Prefer path-aware jobs so backend-only changes do not pay for frontend work and vice versa.
- Keep one workflow architecture in both repositories; repo-specific commands may differ, but trigger tiers and budget rules should not.
- Production smoke tests should fail only for required canonical production endpoints. Legacy or origin probes may remain diagnostic-only so they do not create false production incidents.

## Release rule

Before a major launch, manually run **CI Full Validation** and require it to pass. This is the place for the expensive checks we intentionally avoid on every development push.
