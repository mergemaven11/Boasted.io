# BragStack interim legal review handoff

**Status:** Internal working notes for counsel review. This is not legal advice and does not establish compliance, certification, or immunity from claims.

**Last updated:** September 4, 2026

## Why this file exists

BragStack now spans career evidence, public Proof Profiles, Impact Receipts and third-party confirmation, AI-assisted career material, subscriptions, and education/application workflows. The public Privacy Policy, Terms, NDA/confidential-work guidance, Security page, customer Docs, registration flow, and product claims should stay aligned with what the product actually does.

## Interim product guardrails

Until qualified counsel reviews the product and dedicated minor-consent/compliance workflows exist:

- BragStack's self-service product is intended for users 18 years of age or older.
- Do not intentionally collect personal information from minors through self-service accounts.
- Education/Application tools are informational organization and drafting aids, not admissions, scholarship, academic, employment, legal, financial, medical, mental-health, immigration, HR, or licensed counseling services.
- Do not predict admissions, scholarship, hiring, promotion, compensation, or selection outcomes.
- Do not invent activities, awards, schools, roles, credentials, employers, metrics, dates, or life stories.
- Do not represent BragStack as affiliated with, endorsed by, or acting for a school, employer, scholarship provider, admissions organization, Common App, LinkedIn, certification body, or another third party unless a written relationship exists.
- Users remain responsible for official requirements, eligibility rules, deadlines, prompts, application content, submissions, academic-integrity rules, and the accuracy and legality of information they provide.
- BragStack is not a system of record for regulated or highly sensitive data and should not be marketed as HIPAA, FERPA, COPPA, PCI DSS, SOC 2, ISO 27001, or otherwise certified/compliant unless that status is actually established, documented, and approved for public use.
- Private-by-default controls reduce accidental disclosure but do not override NDAs, contracts, employer policy, school policy, intellectual-property restrictions, law, or a user's duty to obtain permission.
- Impact Receipt confirmation is a verifier's statement about a specific claim, not an independent audit, background check, employment reference, notarization, credential verification, or legal certification by BragStack.
- Enterprise features must not silently evolve into employee surveillance, applicant scoring, or high-impact decision automation.

## Counsel review priorities

1. **Legal entity and notices** — legal operator name, entity formation, business address, agent/service information, and legal/privacy contact details.
2. **Contract formation** — enforceable clickwrap acceptance, versioned Terms/Privacy acknowledgment, acceptance timestamp/evidence, OAuth signup, material-term updates, and record retention.
3. **Age eligibility** — whether BragStack will serve minors; if yes, parental/guardian consent, age assurance, child/student privacy, school contracting, and deletion/parent rights.
4. **Privacy laws** — applicable U.S. state privacy laws, GDPR/UK GDPR or other international requirements, controller/processor roles, data-subject request workflows, transfer mechanisms, and DPAs.
5. **Education-specific obligations** — whether any school, district, university, scholarship, or institutional use could implicate FERPA, COPPA, state student-privacy laws, school contracts, or institutional AI policies.
6. **AI and automated systems** — provider contracts, prompt/output handling, retention/training settings, automated-decision restrictions, bias/discrimination risks, transparency, and recordkeeping.
7. **Subscriptions and consumers** — auto-renewal/cancellation disclosures, refunds, taxes, free trials, state/federal consumer-protection rules, and payment-processor terms.
8. **Verification and communications** — verifier contact data, lawful basis/consent, anti-spam rules, harassment controls, false-claim/defamation risk, and retention of attestations.
9. **User-generated/public content** — copyright/trademark complaints, takedown process, repeat-infringer policy if appropriate, public-profile moderation, impersonation, and defamation.
10. **Risk allocation** — warranty disclaimers, limitation of liability, indemnification, governing law/forum, arbitration/class-action provisions if appropriate, and consumer-law carveouts.
11. **Security and incidents** — security claims, vendor security, incident response, breach notification, retention schedules, backups/deletion, access logging, and security contact process.
12. **B2B / Team / Enterprise** — administrator permissions, workforce privacy, discrimination/employment-law use, monitoring guardrails, DPAs, subprocessors, security addenda, SLAs, and organization-owned data.
13. **Career-development services** — scope of any human services marketed through LinkedIn or other marketplaces, coaching/counseling licensing questions, professional-liability risk, and service-specific engagement terms.

## Product behaviors counsel should know

- Accomplishments and Impact Receipts are private by default unless a user intentionally shares them.
- Public profiles and shareable links can be copied, indexed, screenshotted, downloaded, or reshared by recipients after publication.
- Impact Receipt verification can involve a verifier's name, email, role, verification type, optional message, and response status.
- Pending verifier contact data is designed to be short-lived and separated from the long-lived attestation.
- Education Intelligence ranks a user's own saved evidence for scholarship, special-program, internship, and essay-prep workflows.
- Education Intelligence is designed to be deterministic and explicitly not to generate admissions odds, scholarship odds, or invented activities.
- Essay Prep surfaces story candidates; it should not fabricate a personal history, achievement, or life story.
- BragStack may use third-party providers for hosting, authentication, payments, email, analytics/reliability, calendars/integrations, and AI-assisted functionality.
- BragStack currently supports Google/GitHub OAuth and email/password authentication; new-account contract acceptance should be technically recorded, not merely stated in footer copy.

## Pre-launch legal engineering checklist

- [ ] Registration requires affirmative agreement to current Terms and acknowledgment of Privacy Policy.
- [ ] Store Terms version, Privacy version, acceptance timestamp, and acceptance method for new accounts.
- [ ] Close OAuth account-creation paths that bypass legal acceptance.
- [ ] Provide a process for material Terms updates that require re-acceptance when appropriate.
- [ ] Keep dated copies/version history of public Terms and Privacy Policy.
- [ ] Confirm all marketing/security/compliance claims are evidence-backed.
- [ ] Confirm analytics/cookie behavior matches Privacy Policy and consent requirements in target markets.
- [ ] Confirm deletion/export flows work as described.
- [ ] Confirm verifier-contact deletion and retention behavior matches documentation.
- [ ] Confirm payment cancellation/refund UX matches Terms and checkout copy.
- [ ] Keep the 18+ self-service gate until a reviewed minor workflow exists.
- [ ] Review every new education, hiring, scoring, verification, or enterprise feature for high-impact-decision risk before release.

## Do not convert these notes into marketing claims

This file is a risk-control checklist. It does **not** establish legal compliance, certification, attorney approval, or a guarantee against lawsuits. Public copy should describe only controls and behaviors that are actually implemented and verified.
