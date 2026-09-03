# BragStack — Brand Reshape Sprint Roadmap

**Sprint:** September 3–11, 2026  
**Goal:** Reshape BragStack from a useful career tracker into a clear, trustworthy **career evidence network**: capture the work, prove the impact, package the story, and make it easy for the right people to engage.

## North-star positioning

> **Your work deserves receipts.**

BragStack should own the evidence layer of a person's career. It is not another social feed and it is not an HR surveillance product. It is the portable record of what someone did, what they contributed, what changed, and what supports the claim.

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
- [ ] Define canonical terminology: **BragStack**, **Impact Receipt**, **Proof Profile**, **Career Evidence**, **Professional Packet**.
- [ ] Define the one-sentence pitch and homepage hierarchy.
- [ ] Capture before screenshots / baseline UX notes for the key public and authenticated flows.
- [ ] Add regression checklist for auth, privacy, packet generation, PDF export, profile visibility, and mobile navigation.

**Exit:** one product story, one vocabulary, no ambiguity about what BragStack is becoming.

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

**Exit:** a user can confidently send their BragStack profile to a recruiter, hiring manager, interviewer, client, or collaborator.

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

**Exit:** interest in someone's proof can turn into a conversation without BragStack becoming a calendar product.

---

## Phase 4 — Packaging + sharing polish

**Target: Sep 8–10**

- [ ] Bring Performance Review, Promotion, Interview, and Résumé surfaces under the same brand language.
- [ ] Add branded packet themes and selective sections where feasible.
- [ ] Improve calls-to-action from accomplishments/receipts into the appropriate packet.
- [ ] Make the Resume Builder flow consistent with the evidence-first story.
- [ ] Add share-ready packet metadata and clear privacy warnings.
- [ ] Ensure PDFs and public views use consistent terminology and visual identity.

**Exit:** BragStack feels like one product rather than a collection of career utilities.

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

## Scope priority

### P0 — Must ship

- Brand/landing-page reshape
- Unified evidence-first terminology
- Proof Profile 2.0 core presentation + privacy clarity
- Open to Talk foundation
- Cross-product navigation/copy consistency
- Regression, privacy, accessibility, and CI hardening

### P1 — Ship if P0 is stable

- Profile pinning/reordering
- Better share controls
- Branded/selective packet sections
- Recognition workflow polish
- External booking-link / controlled-availability implementation

### P2 — Design now, implement after sprint if needed

- Native Google/Outlook calendar sync
- Full in-product scheduling engine
- Rich packet expiration/revocation infrastructure
- Deeper HRIS integrations
- Advanced organization skill intelligence
- SSO/SCIM/RBAC expansion

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

1. **What is BragStack?** A career evidence system / network for portable proof of real work.
2. **Why is it different?** It structures accomplishments into evidence-aware Impact Receipts instead of relying on self-promotional posts or annual memory.
3. **What can I do with it?** Capture, prove, package, share, and use that proof to create opportunities.
4. **Can I trust it with workplace information?** Private by default, explicit sharing, no invented verification, and no surveillance model.
5. **What happens when someone likes my work?** They can explore the proof I chose to publish and, if I opt in, request a conversation through Open to Talk.

## After this sprint

Next bets should be selected from observed activation and sharing behavior rather than feature count. The first metrics to watch are: first accomplishment captured, first Impact Receipt created, first packet generated, Proof Profile published, profile/packet shared, and qualified conversation intent generated.