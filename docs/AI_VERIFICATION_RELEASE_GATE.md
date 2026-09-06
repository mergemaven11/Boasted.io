# Boasted AI / Smart-Feature Verification Release Gate

**Status:** Required before open sign-ups  
**Owner:** Boasted Engineering / Operations  
**Policy version:** `open-signup-ai-gate-v1`

## Purpose

Boasted uses deterministic analysis today and may add model-backed assistance over time. No smart feature is allowed to manufacture career facts, and a feature is not considered verified merely because its UI looks good or its happy-path demo works.

The internal **Ops → AI Verification** dashboard is the operational source for measured verification status. A feature with no verification samples is displayed as **NOT VERIFIED**, never as passing.

## Non-negotiable evidence rule

AI and smart features may organize, classify, summarize, suggest, search, coach, and rewrite user-controlled evidence. They may not invent:

- employers, job titles, dates, education, credentials, or employment history;
- metrics, percentages, money, time savings, scale, or other numeric outcomes;
- verification, confirmation, customer results, or evidence that does not exist;
- skills that appear only in a target job description and are not supported by the user's own resume or selected proof.

Unsupported fields must stay blank, be withheld, or become a question for the user.

## Resume Builder gate

Resume polish and grounded suggestions are a **must-have before open sign-ups**.

The customer resume build path is fail-closed. Generated suggestions are withheld if verification cannot reconcile them to user-controlled source material.

### Required checks

1. **Generated bullet provenance** — every generated Impact Receipt bullet must identify a selected receipt that belongs to the current user.
2. **Numeric groundedness** — every generated number must appear in the selected source evidence.
3. **High-risk factual language** — generated claims about verification, credentials, employers, dates, or other career facts require source support.
4. **Skill provenance** — a suggested skill must exist in the imported resume or selected Impact Receipts. Job-description terms alone are not proof.
5. **Target-role truthfulness** — a target role is intent, not employment history. Generated copy uses language such as `Targeting <role> roles` rather than claiming the user already holds that title.
6. **Summary evidence** — Boasted does not generate a professional summary when it has no user-controlled source evidence.
7. **Company and education fields** — current resume generation does not synthesize employer or education records.

### Open-signup threshold

For the rolling verification window used by Ops:

- minimum verified resume samples: **20**;
- required pass rate: **100%**;
- unsupported numeric claims allowed: **0**;
- provenance failures allowed: **0**;
- fabrication/high-risk failures allowed: **0**.

A single recorded fabrication/provenance failure returns the resume release gate to **BLOCKED** until the issue is fixed and the verification window satisfies policy again.

## Other smart features

### Career Intelligence

Career Intelligence is deterministic and verifies its own invariants before returning results. Counts must reconcile to the user's saved accomplishments and Impact Receipts. Impossible over-counts are withheld and recorded as verification failures.

### Aisha / Interview Practice

Aisha's scoring engine has deterministic calibration and guardrail tests. Runtime verification instrumentation must be present before the dashboard may call Aisha verified. Until then the dashboard displays **NOT VERIFIED** rather than inferring quality from unrelated tests.

### Evidence Assistant / model-backed AI

Experimental model-backed AI remains disabled by default. It cannot become customer-facing until its task-specific evaluation thresholds pass, including groundedness, numeric hallucination rate, provenance correctness, prompt-injection resistance, cross-profession fixtures, privacy behavior, and rollback controls.

## Verification telemetry privacy

The `ai_verification_events` collection stores only quality/operations metadata:

- feature and task name;
- pass/fail;
- machine-readable violation codes;
- provider/model/version identifiers;
- source and generated-item counts;
- timestamp and limited user identifier for deduplication/diagnostics.

It does **not** store:

- resume text;
- job descriptions;
- private evidence bodies;
- model prompts;
- generated suggestion/output bodies.

Verification telemetry is best-effort. A telemetry database write failure must not break a customer's otherwise-safe workflow.

## Release procedure

Before enabling open sign-ups:

1. Backend, Frontend, and Security CI pass on the exact release head.
2. Resume UI/responsive quality is manually UAT-approved.
3. Ops → AI Verification shows the Resume Builder gate as **READY**.
4. There are no unresolved fabrication, unsupported-number, or provenance failures.
5. Experimental model-backed AI remains off unless its separate evaluation gate is explicitly green.
6. Any smart feature without runtime verification coverage is labeled **NOT VERIFIED** and cannot be represented as verified in product/release notes.
