# Boasted AI evaluation policy

Evaluation suite version: `ai-eval-v1`

## Purpose

Boasted evaluates model behavior separately from model licensing. A model may be commercially license-eligible and still be blocked from customer-facing use until it passes Boasted's evidence-grounded evaluation gates.

## Zero-dollar commercial-use requirement

Boasted's AI stack must use software, model weights, and runtimes that can be legally used for commercial purposes without a required license fee or paid subscription. This is a hard product constraint, not a preference.

A production candidate must therefore satisfy all of the following before approval:

- the exact model weights are available for commercial use without a required license fee;
- the selected inference/runtime software is available for commercial use without a required license fee;
- required modification, redistribution, attribution, and notice obligations are documented and acceptable;
- no research-only, noncommercial, evaluation-only, source-available-with-commercial-restrictions, or otherwise ambiguous license is accepted;
- no paid hosted inference API is required for core Boasted AI behavior;
- model and runtime licenses are reviewed separately because a permissive model license does not make the runtime permissive, and vice versa.

Infrastructure is a separate cost category. Boasted may still incur ordinary compute, storage, bandwidth, or hosting costs when operating freely licensed software. The requirement is zero-dollar software licensing for commercial use, not a claim that production infrastructure itself will cost nothing.

If any license or commercial-use term is unclear, the candidate fails closed until the uncertainty is resolved from authoritative license material.

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
3. confirmation that both model and runtime meet the zero-dollar commercial-use requirement;
4. commercial-use, modification, redistribution, attribution, and notice requirements;
5. structured-output validity and task-specific extraction quality;
6. latency and memory measurements for the intended runtime;
7. privacy/redaction and adversarial testing results;
8. known limitations and rollback/kill-switch readiness.

## Candidate model progression

`HuggingFaceTB/SmolLM2-1.7B-Instruct` and `sentence-transformers/all-MiniLM-L6-v2` remain license-eligible candidates only. They should be marked customer-facing approved only after the applicable Boasted evaluation suites pass, their exact model/runtime licenses satisfy the zero-dollar commercial-use requirement, and the release review is recorded.

SmolLM2 is expected to be evaluated against evidence extraction, evidence quality, and grounded drafting fixtures. MiniLM is intended for a future semantic-search evaluation suite; semantic similarity must never be treated as verification.

## Versioning

Changes that alter fixture expectations, metrics, or release semantics require a new evaluation-suite version. Existing versions remain immutable so model revisions can be compared reproducibly over time.
