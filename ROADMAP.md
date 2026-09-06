# Boasted — Brand Reshape Sprint Roadmap

**Sprint:** September 3–11, 2026  
**Goal:** Reshape Boasted from a useful career tracker into a clear, trustworthy **career evidence network**: capture the work, prove the impact, package the story, and make it easy for the right people to engage.

## North-star positioning

> **Your work deserves receipts.**

Boasted should own the evidence layer of a person's career. It is not another social feed and it is not an HR surveillance product. It is the portable record of what someone did, what they contributed, what changed, and what supports the claim.

### Product story

**Capture → Prove → Package → Share → Connect**

1. **Capture** accomplishments while they are fresh.
2. **Prove** contribution and results with Impact Receipts, evidence, shared credit, and recognition.
3. **Package** that evidence into review, promotion, interview, résumé, and career artifacts.
4. **Share** selected proof through a professional public profile without exposing private evidence.
5. **Connect** when an interested recruiter, manager, collaborator, or interviewer wants a deeper conversation.

## Sprint guardrails

- Private by default; public sharing is explicit.
- No invented metrics, claims, verification, or employment scores.
- No workplace-surveillance mechanics.
- Shared work preserves shared credit.
- Build on the existing evidence engine instead of rewriting working product foundations.
- Keep expensive infrastructure optional; ship useful first-party foundations before adding paid vendors.
- Every major feature must have a clear Free / Pro / Team / Enterprise entitlement story.

---

## Phase 0 — Today: freeze the story and protect the foundation

**Target: Sep 3**

- [ ] Audit current landing page, navigation, profile, reports, packets, résumé builder, pricing, and onboarding against the new positioning.
- [ ] Inventory open PRs and avoid mixing the rebrand with unrelated unfinished work.
- [ ] Define canonical terminology: **Boasted**, **Impact Receipt**, **Proof Profile**, **Career Evidence**, **Professional Packet**.
- [ ] Define the one-sentence pitch and homepage hierarchy.
- [ ] Capture before screenshots / baseline UX notes for the key public and authenticated flows.
- [ ] Add regression checklist for auth, privacy, packet generation, PDF export, profile visibility, and mobile navigation.

**Exit:** one product story, one vocabulary, no ambiguity about what Boasted is becoming.

---

## Phase 1 — Brand + landing-page reshape

**Target: Sep 3–4**

- [ ] Rework hero around evidence and outcomes rather than generic accomplishment tracking.
- [ ] Explain the Capture → Prove → Package → Share → Connect loop visually.
- [ ] Make Impact Receipts the signature product concept.
- [ ] Add role-neutral examples so the brand works beyond software/office careers.
- [ ] Tighten visual system: typography, spacing, card language, proof/evidence motifs, CTA hierarchy, empty states, and product screenshots.
- [ ] Rewrite feature copy so every feature answers: **what does this help me prove or do next?**
- [ ] Make trust/privacy principles visible instead of burying them.
- [ ] Refresh pricing-page narrative around outcomes and entitlements.

**Exit:** a visitor can understand the product, differentiator, trust model, and next action in under a minute.

---

## Phase 2 — Proof Profile 2.0

**Target: Sep 4–7**

- [ ] Redesign public profiles as professional evidence pages, not mini social profiles.
- [ ] Add profile headline / positioning, selected highlights, featured Impact Receipts, skills, recognition, and selected packets/artifacts.
- [ ] Add pinning/reordering for public accomplishments and receipts.
- [ ] Add explicit profile preview so users see exactly what outsiders will see.
- [ ] Add stronger public/private indicators throughout editing.
- [ ] Add share controls and copyable profile link.
- [ ] Design packet/profile expiration and revocation model; implement the safest achievable slice this sprint.
- [ ] Keep private evidence metadata and sensitive workplace material out of public payloads by default.

**Exit:** a user can confidently send their Boasted profile to a recruiter, hiring manager, interviewer, client, or collaborator.

---

## Phase 3 — Smart Availability / “Open to Talk”

**Target: Sep 7–9**

- [ ] Add an opt-in **Open to Talk** state on Proof Profiles.
- [ ] Support conversation types such as recruiter chat, technical deep dive, mentoring/networking, and consulting where appropriate.
- [ ] Let the profile owner expose only intentional availability—not their private calendar.
- [ ] Collect booking context: what the visitor wants to discuss and which accomplishment/receipt prompted the conversation.
- [ ] Create a calendar-provider abstraction so Google/Outlook integrations can be added without coupling the profile UI to one vendor.
- [ ] Start with a low-cost implementation path: external booking link and/or controlled availability blocks before building full scheduling infrastructure.
- [ ] Add abuse/privacy controls: disable instantly, no private calendar details, bounded visitor inputs, and clear ownership of contact preferences.

**Exit:** interest in someone's proof can turn into a conversation without Boasted becoming a calendar product.

---

## Phase 4 — Packaging + sharing polish

**Target: Sep 8–10**

- [ ] Bring Performance Review, Promotion, Interview, and Résumé surfaces under the same brand language.
- [ ] Add branded packet themes and selective sections where feasible.
- [ ] Improve calls-to-action from accomplishments/receipts into the appropriate packet.
- [ ] Make the Resume Builder flow consistent with the evidence-first story.
- [ ] Add share-ready packet metadata and clear privacy warnings.
- [ ] Ensure PDFs and public views use consistent terminology and visual identity.

**Exit:** Boasted feels like one product rather than a collection of career utilities.

---

## Phase 5 — Team/manager foundation without surveillance

**Target: Sep 9–10**

- [ ] Strengthen recognition/confirmation workflows around specific contributions.
- [ ] Define manager/team review-cycle workflow using user-approved evidence.
- [ ] Keep employee visibility and organization analytics clearly separated.
- [ ] Document what managers can and cannot see.
- [ ] Ensure enterprise analytics remain aggregate, bounded, and non-scoring.

**Exit:** the team story supports bottom-up adoption without weakening user ownership.

---

## Phase 6 — Release hardening

**Target: Sep 10–11**

- [ ] Desktop + mobile walkthrough of landing → signup/login → capture → receipt → profile → packet → share/connect.
- [ ] Accessibility pass: keyboard flow, focus, labels, contrast, reduced motion, responsive layout.
- [ ] Security/privacy regression pass.
- [ ] Backend tests, frontend lint/build, production bundle checks, and CI green on exact release head.
- [ ] Verify public endpoints cannot leak private evidence.
- [ ] Verify packet generators do not invent missing claims or metrics.
- [ ] Update README, screenshots, docs, changelog, and release notes.
- [ ] Remove stale copy and dead navigation from the previous brand story.

**Exit:** release candidate ready by **Friday, September 11, 2026**.

---

## AI / ML Evidence Assistant

AI is an **assistive evidence layer**, never the source of truth. Boasted should remain useful when AI is disabled or unavailable.

### Non-negotiable evidence rule

**AI may extract, organize, classify, summarize, suggest, search, and rewrite. It may not manufacture career evidence.**

AI must never invent metrics, verification, employers, dates, outcomes, credentials, evidence, employment history, customer results, or other career facts. Unsupported fields stay blank or become explicit questions for the user.

### Initial capabilities

1. **Evidence extraction** — turn user-provided notes and artifacts into candidate contribution, result, skills, dates, people, and evidence references.
2. **Impact Receipt drafting** — draft structured receipts using only captured evidence and retain links to supporting evidence IDs.
3. **Evidence quality checks** — flag vague, unsupported, or internally inconsistent claims and ask for stronger support rather than fabricating specificity.
4. **Grounded career writing** — create résumé bullets, review summaries, promotion narratives, and STAR/interview preparation from evidence the user explicitly selects.
5. **Semantic evidence search** — support private queries such as “show examples where I demonstrated leadership” across the user's own evidence record.
6. **Skill/category suggestions** — suggest classifications with transparent provenance; user confirmation is required before they become durable record data.
7. **Optional local/private inference** — provide a path for sensitive evidence to be processed without requiring a paid hosted inference provider.

### Architecture

- Introduce a provider-neutral `AIProvider` / inference adapter; domain logic must not depend on one model vendor.
- Prefer deterministic parsing/validation before invoking a model where rules can solve the task reliably.
- Require structured model outputs and validate schemas server-side.
- Pass evidence IDs/source references into generation and retain provenance with every suggestion.
- Store generated content as **AI suggestion/draft state** until the user accepts it; AI output does not silently become evidence.
- Add deterministic guards for unsupported numeric claims, verification language, credentials, and other high-risk factual fields.
- Keep prompts/schema versions auditable so behavior can be reproduced during evaluation.
- Put AI capabilities behind feature flags and entitlement boundaries for incremental rollout and instant rollback.
- Core capture, receipts, profiles, and packets must have a non-AI path.
- Do not train on user evidence by default. Any future training/feedback use requires an explicit policy, privacy review, and consent design.

### Free/open-weight and licensing strategy

Early development should favor local/self-hostable inference where practical so Boasted does not inherit a mandatory per-request AI bill.

For every model considered for production, record:

- exact model ID and version/revision;
- upstream source/model card;
- exact license and permanent license source where available;
- commercial-use, modification, and redistribution rights;
- attribution/notice requirements;
- runtime requirements and expected hardware envelope;
- intended Boasted task;
- evaluation result and known limitations.

Prefer models with clear commercially usable permissive terms such as Apache-2.0 or MIT **after model-by-model review**. A permissively licensed runtime does not make the model weights permissively licensed; both must pass the licensing gate independently. Models with unclear, research-only, noncommercial, use-restricted, or incompatible terms do not ship.

Paid inference providers may be supported later through the same adapter, but they remain optional rather than architectural dependencies.

### Evaluation gate before customer-facing AI

No AI feature becomes customer-facing merely because its demo looks good. Each task needs a documented evaluation set and release threshold covering, where applicable:

- groundedness / unsupported-claim rate;
- numeric hallucination rate;
- evidence citation/reference correctness;
- structured-output validity;
- extraction precision and recall;
- cross-profession fixtures so behavior is not optimized only for software/office careers;
- privacy/redaction behavior;
- adversarial prompt-injection tests for pasted/uploaded evidence;
- latency and memory/compute envelope;
- model/version regression testing;
- documented limitations;
- kill switch / rollback path.

Use blinded fixtures for release evaluation where practical. Customer-facing proof generated with AI must still be traceable back to user-controlled evidence.

### AI rollout order

**P0 foundation:** architecture contract, evidence-grounding rules, provenance schema, licensing gate, evaluation harness design, feature flags. Do not delay the brand reshape to ship model inference.

**P1:** evidence extraction and evidence-quality suggestions behind an experimental flag, followed by grounded Impact Receipt assistance after evaluation passes.

**P2:** semantic evidence search, grounded résumé/review/interview assistance, and optional local inference packaging.

**Later:** additional providers/models only when measured quality, privacy, cost, or hardware coverage justifies them.

---

## Scope priority

### P0 — Must ship

- Brand/landing-page reshape
- Unified evidence-first terminology
- Proof Profile 2.0 core presentation + privacy clarity
- Open to Talk foundation
- Cross-product navigation/copy consistency
- AI evidence-grounding architecture contract + licensing/evaluation gates (not mandatory model inference)
- Regression, privacy, accessibility, and CI hardening

### P1 — Ship if P0 is stable

- Profile pinning/reordering
- Better share controls
- Branded/selective packet sections
- Recognition workflow polish
- External booking-link / controlled-availability implementation
- Experimental evidence extraction / quality assistance after evaluation gates pass

### P2 — Design now, implement after sprint if needed

- Native Google/Outlook calendar sync
- Full in-product scheduling engine
- Rich packet expiration/revocation infrastructure
- Deeper HRIS integrations
- Advanced organization skill intelligence
- SSO/SCIM/RBAC expansion
- Semantic evidence search and broader local/open-weight AI assistance

---

## Proposed entitlement shape

| Capability | Free | Pro | Team | Enterprise |
| --- | --- | --- | --- | --- |
| Capture accomplishments | ✓ | ✓ | ✓ | ✓ |
| Core Impact Receipts | ✓ | ✓ | ✓ | ✓ |
| Public Proof Profile | ✓ | ✓ | ✓ | ✓ |
| Featured/pinned proof | Limited | ✓ | ✓ | ✓ |
| Advanced packets/PDFs | —/Limited | ✓ | ✓ | ✓ |
| Open to Talk | Basic | Advanced | Advanced | Policy-controlled |
| Recognition workflows | Basic | Basic | ✓ | ✓ |
| Team review workflows | — | — | ✓ | ✓ |
| Aggregate org intelligence | — | — | Limited | ✓ |
| SSO/audit/governance | — | — | — | ✓ |

Exact pricing remains separate from entitlement design.

---

## Definition of done

The sprint is complete when a new visitor can answer these questions without explanation:

1. **What is Boasted?** A career evidence system / network for portable proof of real work.
2. **Why is it different?** It structures accomplishments into evidence-aware Impact Receipts instead of relying on self-promotional posts or annual memory.
3. **What can I do with it?** Capture, prove, package, share, and use that proof to create opportunities.
4. **Can I trust it with workplace information?** Private by default, explicit sharing, no invented verification, and no surveillance model.
5. **What happens when someone likes my work?** They can explore the proof I chose to publish and, if I opt in, request a conversation through Open to Talk.
6. **What does AI do?** It assists with organizing and using my evidence; it does not manufacture my career history or proof.

## After this sprint

Next bets should be selected from observed activation and sharing behavior rather than feature count. The first metrics to watch are: first accomplishment captured, first Impact Receipt created, first packet generated, Proof Profile published, profile/packet shared, and qualified conversation intent generated.