# BragStack Release Status — September 2026

BragStack is being shaped as a **career evidence network** built around one product loop:

**Capture → Prove → Package → Share → Connect**

The purpose of this document is to distinguish what is available now from what is temporary, what is coming next, and what remains gated. Roadmap direction can change as BragStack learns from real usage. A roadmap item is not a guaranteed ship date.

## Current product model

| Stage | Purpose | Status |
| --- | --- | --- |
| Capture | Save real accomplishments while the details are fresh. | Live |
| Prove | Add contribution, result, evidence, skills, shared credit, and optional confirmation. | Live |
| Package | Reuse proof for resumes, interviews, reviews, promotions, and career packets. | Live |
| Share | Publish only selected proof through a public Proof Profile. | Live |
| Connect | Turn interest in selected proof into a useful professional conversation. | Next |

## Available now

Current customer-facing product surfaces include:

- Career Dashboard
- Accomplishments Library
- Impact Receipts
- Receipt Verification
- BragStack Career Intelligence
- Resume Builder
- Practice Interview with Aisha
- Career Analytics and career packets
- Public Proof Profile
- Education workspace for adult users
- categorized authenticated Support Center
- privacy, NDA-safety, account, and security guidance

### Education

Education is broader than a one-time applications tool. Adults can capture education and early-career wins and reuse the strongest relevant evidence for scholarships, programs, internships, and essay-story preparation.

The current authenticated route remains `/app/applications` for compatibility, while the customer-facing product name is **Education**.

BragStack accounts are currently limited to people age 18 or older. Middle School and other under-18 student accounts remain **Coming Soon** and must not be enabled until the documented youth privacy, parental/guardian consent, retention, safety, school-data, vendor, and legal release gates are complete.

## Temporary individual Pro open access

BragStack is temporarily granting the ordinary **Pro** feature set to individual customer accounts at no charge.

- No card is required.
- No new paid subscription is required.
- New Stripe Checkout sessions are paused while this mode is enabled.
- Team and Enterprise features are **not** included.
- Existing billing state is preserved so an existing subscriber can still manage future renewal.
- Future paid checkout must show clear pricing and require an affirmative purchase step.

This is a temporary launch mode, not a promise that Pro will remain free permanently.

## Coming next

### Proof Profile 2.0 and Open to Talk

- stronger featured proof and profile presentation
- safer sharing controls
- pinning/reordering where appropriate
- an opt-in path for recruiters, managers, collaborators, or interviewers to request a conversation
- no exposure of a user's private calendar or private evidence

### Packaging and recognition polish

- branded packet themes
- selective packet sections
- stronger share-ready metadata
- improved contribution, recognition, and confirmation workflows
- consistent terminology and visual identity across resume, review, promotion, interview, and profile surfaces

### Controlled availability

- bounded booking links and/or controlled availability blocks first
- calendar-provider abstraction
- native Google/Outlook synchronization later rather than as a launch dependency

## Later / gated

### Team and Enterprise

Team and Enterprise remain separate product tiers. Planned areas include team review workflows, aggregate organization intelligence, SSO, SCIM, audit, retention, RBAC, and deeper enterprise integrations. Temporary individual Pro access must never unlock these capabilities.

### Under-18 student accounts

Middle School and other minor accounts remain roadmap-only until the release gate in `docs/EDUCATION_INTELLIGENCE.md` and `docs/AGE_AND_STUDENT_ACCESS.md` is completed with qualified legal review.

### Deeper integrations and infrastructure

Later work may include native calendar sync, HRIS integrations, richer packet expiration/revocation, broader organization intelligence, and additional AI providers or local inference options when quality, privacy, cost, and licensing justify them.

## Evidence integrity rules

BragStack can organize, rank, summarize, coach, search, extract, or rewrite material a user provides. It must not manufacture career or education evidence.

Do not invent:

- metrics or results
- employers or employment history
- credentials or grades
- awards or activities
- verification or confirmation
- admissions or scholarship probabilities
- hiring or promotion predictions
- evidence that the user did not provide

Unsupported facts remain blank, become questions for the user, or are clearly described as missing.

## Release checklist

Before a feature moves from roadmap to available-now documentation:

1. the customer-facing route and intended workflow exist;
2. privacy and entitlement boundaries are verified;
3. generated outputs do not invent claims or evidence;
4. tests and CI are green on the exact release head;
5. Help Center copy matches actual behavior;
6. Terms, Privacy, Security, billing, age/access, and support implications have been reviewed where relevant;
7. anything requiring legal, security, or vendor approval remains visibly gated until that review is complete.

Last updated: September 2026.
