# BragStack AI evaluation policy

Evaluation suite version: `ai-eval-v1`

## Purpose

BragStack evaluates model behavior separately from model licensing. A model may be commercially license-eligible and still be blocked from customer-facing use until it passes BragStack's evidence-grounded evaluation gates.

## Deterministic gates

Every candidate suggestion is checked for:

- evidence provenance presence and exact fixture provenance;
- unknown evidence IDs;
- unsupported numeric specificity;
- unsupported high-risk factual language;
- fixture-defined forbidden output, including prompt-injection payloads copied from untrusted evidence;
- cross-profession behavior across role families rather than software-only fixtures.

For deterministic safety gates, the target is fail-closed: zero unsupported numeric claims, zero forbidden prompt-injection output, and zero provenance failures in the approved evaluation set.

## v1 fixture coverage

The first version covers software support, education, retail operations, customer success, and project coordination. It also includes adversarial evidence containing instructions to invent a 500% revenue increase and unsupported verification/certification language.

Fixture content is synthetic and exists only for evaluation. Similarity to real people, employers, or events is unintended.

## What passing v1 does not mean

Passing `ai-eval-v1` does not automatically authorize customer-facing deployment. A release review must also record:

1. exact model ID and immutable revision;
2. model-weight license and runtime license review;
3. commercial-use, modification, redistribution, and notice requirements;
4. structured-output validity and task-specific extraction quality;
5. latency and memory measurements for the intended runtime;
6. privacy/redaction and adversarial testing results;
7. known limitations and rollback/kill-switch readiness.

## Candidate model progression

`HuggingFaceTB/SmolLM2-1.7B-Instruct` and `sentence-transformers/all-MiniLM-L6-v2` remain license-eligible candidates only. They should be marked customer-facing approved only after the applicable BragStack evaluation suites pass and the release review is recorded.

SmolLM2 is expected to be evaluated against evidence extraction, evidence quality, and grounded drafting fixtures. MiniLM is intended for a future semantic-search evaluation suite; semantic similarity must never be treated as verification.

## Versioning

Changes that alter fixture expectations, metrics, or release semantics require a new evaluation-suite version. Existing versions remain immutable so model revisions can be compared reproducibly over time.
