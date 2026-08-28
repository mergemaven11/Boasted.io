# BragStack ChatGPT Skills

Reusable workflows for ChatGPT/Codex work on BragStack. These skills follow the SKILL.md pattern described by OpenAI and the Agent Skills open standard.

## Skills

- `ui-regression-guard` — prevents mobile/tablet/desktop layout regressions and loading-state leaks.
- `api-contract-quality` — keeps FastAPI behavior, schemas, auth boundaries, and tests aligned.
- `security-privacy-review` — reviews changes against BragStack's privacy, evidence, and authorization rules.
- `product-discovery` — converts customer/product signals into evidence-backed feature decisions.
- `career-proof-integrity` — prevents invented career claims, opaque employment scoring, and unsafe evidence exposure.
- `release-readiness` — verifies CI, UX, observability, docs, and rollout safety before merge/release.

## Usage

Each skill lives in its own directory with a `SKILL.md` playbook. Install or copy the relevant skill into a ChatGPT/Codex skill surface, or use the files directly as the source of truth when working in this repository.

## Design principle

Keep skills small and composable. A feature PR may use several skills together: for example, `ui-regression-guard` + `security-privacy-review` + `release-readiness`.