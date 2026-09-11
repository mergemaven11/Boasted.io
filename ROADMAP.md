# Boasted Product Roadmap

**Status:** Living roadmap  
**Last refreshed:** September 11, 2026  
**Current product question:** Can a technical or support engineer turn one real accomplishment into structured proof, complete an Impact Receipt, and produce one immediately useful career output without founder coaching?

> **Your work deserves receipts.**

Boasted is a **career evidence system**: capture what happened, preserve what proves it, and reuse that evidence when a review, promotion, interview, résumé, profile, or other opportunity appears.

This file is intentionally not a date-by-date feature wishlist. The previous September brand sprint has largely been overtaken by shipped work. This roadmap now separates:

1. what is already on `main`;
2. what must be finished or hardened now;
3. what must be validated with users before more expansion;
4. what becomes eligible only after the core loop is proven.

---

## North star

### Core loop

**Capture → Prove → Reuse → Share when useful**

1. **Capture** a real accomplishment while it is still fresh.
2. **Prove** the contribution and result with an Impact Receipt, evidence, skills, shared credit, and recognition where appropriate.
3. **Reuse** the same saved proof in a résumé, interview, review, promotion case, packet, or other career artifact.
4. **Share** only the proof the user intentionally chooses to publish or send.

The activation test is not “did the user explore features?” It is:

> **Did the user turn one real accomplishment into trusted proof and get something immediately useful back from it?**

### Product principles

- Private by default; sharing is explicit.
- No invented metrics, outcomes, verification, credentials, employers, or career facts.
- Evidence remains user-controlled and traceable to its source.
- Shared work preserves shared credit.
- Boasted must not become workplace surveillance or opaque employment scoring.
- Career-neutral data structures stay broad even while early validation begins with a narrow technical/support-engineering ICP.
- Deterministic product behavior should solve a problem before expensive infrastructure or model inference is introduced.
- AI may assist with evidence; it may never become the source of truth.

---

# Shipped baseline

The items below are **already part of the repository baseline** and should not remain in the roadmap as unchecked future work.

## Career evidence foundation

- Accomplishment capture, editing, search, pagination, categories, skills, dates, and public/private state.
- Impact Receipts with contribution, result, measurable impact, evidence, skills, shared credit, recognition/confirmation, trust signals, and private-by-default evidence behavior.
- Reports Hub with weekly, all-time, and custom-range career reporting.
- Public Proof Profiles scoped to intentionally published user content.
- Career-neutral packet regression coverage across professions.

## Professional outputs

- Performance Review Packet.
- Promotion Packet.
- Interview Packet.
- Certification / Licensure Packet.
- Server-generated PDF export.
- Packet Platform features including accomplishment selection/pinning, selective sections, user-authored annotations, themes, branding controls, export metadata, secure private sharing, and verified-recognition semantics.

## Pro career tools

- Resume Builder with structured import, evidence-backed matching, ATS-safe reconstruction/coaching, editing, saved versions, and export paths.
- Practice Interviewer with catalog-backed questions, evidence-aware coaching, browser speech/device handling, and mobile support.
- Career Intelligence v1 with deterministic skill evidence, quantified outcomes, proof-gap analysis, evidence/confirmation signals, and recommended actions without opaque readiness scoring.

## Account, billing, and customer experience

- Password authentication plus Google and GitHub OAuth.
- Email verification and password reset.
- Stripe Checkout/subscription lifecycle for Free/Pro entitlements.
- Cancellation-at-period-end, paid-through access, and resume-subscription behavior.
- Guided onboarding, settings organization, appearance controls, docs, legal pages, SEO/search assets, and analytics foundation.

## Production, security, and operations

- Health/readiness probes, tested database indexes, and restore-validation safeguards.
- Security headers, HSTS on HTTPS, tighter CORS, JWT lifecycle hardening, dependency/security CI, and auth recovery protections.
- Production rate limiting and abuse protection.
- Idempotent Stripe webhook processing.
- Sanitized persistent operational observability with TTL retention and restricted Ops access.
- Ops Console with backend-enforced RBAC, diagnostics, account lookup, and audited role management.
- Route-level code splitting, production bundle budgets, branded loading states, SEO regression gates, and real-browser click audits.
- Server-managed authentication sessions with revocation, inactivity timeout, absolute lifetime, logout revocation, and password-reset session revocation.
- AI foundation modules for evidence-grounded contracts, feature flags, licensing gates, deterministic guards, and release evaluation.

---

# NOW — Launch hygiene and production trust

**Goal:** remove avoidable operational/security risk and make the current product dependable enough for observed beta use.

## Repository and release hygiene

- [ ] Resolve and merge the CI-noise cleanup without weakening required pull-request, secret-scan, nightly, or canonical production checks.
- [ ] Merge pre-public repository hardening before changing repository visibility, including history-aware secret scanning and security-reporting guidance.
- [ ] Keep canonical Boasted production smoke tests blocking; treat legacy-origin probes as diagnostics only where appropriate.
- [ ] Bring `CHANGELOG.md`, `README.md`, repository description, and this roadmap back into agreement after the current open hardening work lands.
- [ ] Audit remaining legacy **BragStack** names, domains, copy, environment examples, and stale internal references so Boasted has one canonical identity.

## Authentication follow-through

Server-managed idle sessions are the correct first production step, but bearer tokens still live in browser storage.

- [ ] Move the production API to a same-site Boasted hostname such as `api.boasted.io`.
- [ ] After same-site hosting is stable, migrate toward short-lived access tokens plus Secure/HttpOnly refresh cookies.
- [ ] Preserve server-side revocation, inactivity limits, password-reset revocation, and OAuth session behavior during that migration.
- [ ] Add rollout/regression coverage so auth changes do not break mobile browsers, OAuth callbacks, or cold-start flows.

## Operational readiness

- [ ] Keep production health/readiness, billing, auth, email, PDF generation, and core evidence flows covered by smoke tests.
- [ ] Confirm backup/restore procedures with a repeatable operator checklist.
- [ ] Keep observability privacy-safe: no auth secrets, raw evidence, employer-confidential content, or sensitive request bodies in telemetry.
- [ ] Maintain a small incident/runbook set for auth, billing, database connectivity, email delivery, and production cold starts.

**Exit condition:** beta participants can use the production product without founder workarounds, avoidable CI/release noise, or known high-priority security gaps interfering with the session.

---

# NOW — Founder beta validation

**Goal:** validate the core Boasted loop before expanding the surface area.

The canonical research protocol is `docs/FOUNDER_BETA_OBSERVATION_PROTOCOL.md`.

## Round 1: five observed sessions

- [ ] Recruit **five qualifying technical/support engineers** with one recent accomplishment they can safely sanitize.
- [ ] Observe the marketing page first impression without explaining the product.
- [ ] Observe signup/onboarding without coaching the next step.
- [ ] Have each participant create one real accomplishment from memory.
- [ ] Have each participant complete an Impact Receipt.
- [ ] Have each participant reuse that same saved proof for one useful output: résumé, interview, performance review, or shareable proof.
- [ ] Record intervention points, confusion, abandonment, privacy concerns, and time-to-value.
- [ ] Conduct the seven-day follow-up for each participant or explicitly mark it unavailable.

## What to measure

- Product understood from the marketing page without founder explanation.
- Signup completed.
- First proof created.
- First Impact Receipt completed.
- One useful output produced from existing proof.
- Private/public state understood.
- “Capture once, reuse later” understood afterward.
- Whether the participant independently wants to save a second accomplishment.
- Founder interventions and exact abandonment points.

Do **not** send accomplishment text, employer information, evidence content, or sensitive URLs into analytics.

## Synthesis order

Repeated problems are prioritized in this order:

1. blocks signup or first proof;
2. blocks Impact Receipt completion;
3. hides or weakens immediate reuse/output;
4. creates privacy or trust confusion;
5. prevents a second proof or later reuse;
6. everything else.

**Exit condition:** five end-to-end sessions are complete, D7 follow-up is complete or marked unavailable, repeated friction is separated from one-off preference, and the next changes can be tied to observed behavior.

---

# NEXT — Core-loop activation and retention

**This section becomes active after Round 1 synthesis.** Do not pre-build every item below. Pull forward only the work supported by repeated beta behavior.

## Reduce time-to-value

- [ ] Make the shortest path from **accomplishment → Impact Receipt → useful output** obvious without founder coaching.
- [ ] Remove fields, copy, or navigation decisions that repeatedly block first proof or first receipt completion.
- [ ] Keep contribution vs. result language understandable to people who do not already think in résumé/STAR terminology.
- [ ] Make evidence optional enough to begin quickly but valuable enough that users understand why stronger proof matters.
- [ ] Preserve a visible connection between generated career material and the source evidence that supports it.

## Measure activation safely

- [ ] Add privacy-safe product events for milestone completion, not evidence content.
- [ ] Measure first proof, first receipt, first reused output, second proof, export/share, and return behavior.
- [ ] Separate “visited feature” from “completed useful outcome.”
- [ ] Establish a small founder dashboard for core-loop conversion and return behavior without exposing private career data.

## Earn the second accomplishment

Potential retention work is eligible only if it addresses an observed return barrier:

- [ ] clearer post-output next action;
- [ ] lightweight reminder or weekly capture prompt;
- [ ] faster repeat-entry flow;
- [ ] safe import/capture assistance from user-controlled notes or artifacts;
- [ ] proof-gap prompts that ask for missing support instead of inventing it.

**Exit condition:** the core loop is understandable, repeatable, and measurably useful without founder coaching for the initial ICP.

---

# NEXT — Sharing and opportunity conversion

Sharing is valuable only after users trust the evidence model and understand privacy.

- [ ] Improve Proof Profile selection, preview, ordering, and privacy clarity based on beta behavior.
- [ ] Make packet/profile sharing revocable and understandable.
- [ ] Measure intentional shares and downstream engagement without turning public profiles into a social feed.
- [ ] Re-test whether profile visitors understand what is verified, self-reported, private, or intentionally public.

## Open to Talk — gated hypothesis

The old roadmap treated **Open to Talk** as a scheduled sprint feature. It should now be treated as a hypothesis.

Build it only if observed sharing behavior shows that users want a low-friction path from proof to conversation.

Possible first slice:

- opt-in availability state;
- explicit conversation intent;
- external booking link or controlled availability block;
- no exposure of private calendar details;
- instant disable/revocation;
- bounded visitor input and abuse controls.

Native Google/Outlook scheduling stays later unless the simpler path proves demand.

---

# LATER — Team and enterprise workflows

Do not let enterprise surface area outrun individual product-market evidence.

Eligible later work includes:

- manager recognition around a specific contribution;
- user-approved review-cycle workflows;
- team evidence workflows without surveillance;
- aggregate organization skill intelligence with bounded privacy rules;
- HRIS integrations;
- SSO, SCIM, audit, retention, and expanded RBAC;
- policy controls for enterprise sharing and AI use.

Non-negotiable rule: organization features must not silently expose private employee evidence or turn Boasted into an employee scoring system.

---

# LATER — AI evidence assistance

The AI architecture foundation exists. Customer-facing AI expansion remains gated by measured quality and a clear user problem.

## AI evidence rule

**AI may extract, organize, classify, summarize, suggest, search, and rewrite. It may not manufacture career evidence.**

Unsupported metrics, dates, employers, outcomes, credentials, verification, or other career facts remain blank or become explicit questions.

## Eligible capabilities

- evidence extraction from user-provided notes/artifacts;
- Impact Receipt drafting from known evidence;
- evidence-quality checks and contradiction flags;
- grounded résumé/review/interview writing from user-selected sources;
- semantic search across the user’s own evidence;
- skill/category suggestions with user confirmation;
- optional local/private inference where practical.

## Release gates

Every model/task must pass documented gates for:

- groundedness and unsupported-claim rate;
- numeric hallucination behavior;
- evidence-reference correctness;
- structured-output validity;
- privacy/redaction behavior;
- prompt-injection/adversarial evidence tests;
- cross-profession fixtures;
- latency/runtime envelope;
- exact model/license review;
- rollback/kill-switch behavior.

Boasted must remain useful when AI is disabled or unavailable.

---

# PARKED — Expansion that should not distract from core validation

These ideas may be valuable, but they should not become the near-term roadmap simply because implementation has started somewhere.

- Education/student/application expansion beyond the current validated career core.
- Large new profession-specific workflows that bypass the universal evidence model.
- Native calendar infrastructure before simple conversation/booking demand is proven.
- Deep enterprise integrations before individual activation/retention is understood.
- Paid model dependencies before a deterministic or lower-cost approach has been exhausted.
- New “score” products that imply employment, promotion, or hiring predictions.

Any education/application expansion also requires explicit privacy, consent, age/safety, and legal review appropriate to the final product design before public claims are made.

---

# Roadmap decision rules

A new major feature should enter **NOW** or **NEXT** only when at least one of these is true:

1. it fixes a repeated core-loop blocker observed in real users;
2. it closes a concrete security, privacy, reliability, billing, or operational risk;
3. it materially improves activation, repeat use, or trusted sharing and can be measured;
4. it is required to support an already-validated workflow without creating a larger unrelated product surface.

A feature should stay **LATER** or **PARKED** when it is primarily driven by novelty, competitor parity, implementation momentum, or founder enthusiasm without user evidence.

---

# Current success signals

The most important product signals are:

1. first accomplishment saved;
2. first Impact Receipt completed;
3. first useful output generated from existing proof;
4. second accomplishment saved;
5. D7 return / reuse behavior;
6. intentional export or share;
7. qualified downstream engagement from shared proof.

The first three measure activation. The next two measure whether Boasted becomes a habit instead of a one-time generator. The last two measure whether portable proof creates real-world utility.

---

# Definition of progress

Boasted is moving in the right direction when a target user can say, without founder explanation:

1. **What is Boasted?** A place to keep trustworthy proof of the work I have done.
2. **Why would I save something here?** Because I can reuse the same evidence later instead of reconstructing my career from memory.
3. **What is an Impact Receipt?** A structured record connecting what happened, what I contributed, what changed, and what supports the claim.
4. **Can I trust it with workplace information?** My data is private by default, sharing is intentional, and Boasted does not invent verification or expose private evidence publicly.
5. **What do I get back?** Career-ready outputs built from proof I already saved.
6. **What does AI do?** It may help organize or write from my evidence, but it does not create facts about my career.

---

# Maintenance rule

Refresh this roadmap after each meaningful validation round or strategic change, not after every pull request.

- `CHANGELOG.md` records **what shipped**.
- GitHub issues/PRs record **implementation work**.
- This roadmap records **what problem Boasted is solving next and why**.

When an item ships, move the capability into the shipped baseline or changelog instead of leaving it as a permanently checked roadmap task.