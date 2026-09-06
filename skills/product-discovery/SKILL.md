---
name: bragstack-product-discovery
description: Turn Boasted customer signals, analytics, bugs, and product ideas into evidence-backed improvements and small testable feature bets.
---

# Boasted Product Discovery

## Use this skill when

- considering a new feature
- prioritizing roadmap work
- responding to repeated support/UX problems
- reviewing PostHog or customer feedback

## Workflow

1. State the user problem before proposing a solution. Identify who experiences it, when, and what they are trying to accomplish.
2. Gather evidence from actual signals available: support reports, analytics, user feedback, failed flows, search behavior, drop-off, existing issues, and product constraints.
3. Separate problem evidence from solution enthusiasm. Do not treat a requested feature as proof that the proposed implementation is right.
4. Define the desired outcome and a measurable success signal. Prefer activation, completion, retention, time-to-value, evidence quality, or reduced failure/support burden over vanity metrics.
5. Generate at least two solution shapes: a small/low-cost improvement and a broader bet. Reuse existing Boasted primitives before inventing parallel systems.
6. Check the proposal against Boasted's trust principles: user control, private-by-default evidence, shared credit, explicit verification, no surveillance, and no invented employment claims.
7. Design the smallest reversible experiment that can validate the riskiest assumption.
8. Specify instrumentation before launch: entry point, completion event, failure event, abandonment point, and a privacy-safe property set.
9. Define rollout/rollback criteria and what would cause the idea to be stopped or reshaped.
10. Convert validated work into an implementation issue with problem, scope, acceptance criteria, metrics, risks, and non-goals.

## Required output

- problem statement
- evidence/signals
- target outcome and metric
- smallest viable improvement
- optional larger feature bet
- instrumentation plan
- risks/non-goals
- recommendation: do now, test, later, or reject

## Final checks

- problem is real enough to justify work
- success is measurable
- feature does not duplicate an existing Boasted primitive
- privacy/trust model remains intact
- experiment is reversible where practical
