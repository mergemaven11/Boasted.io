# BragStack — Georgia interim legal/compliance baseline

**Effective working date:** September 4, 2026  
**Owner:** BragStack  
**Status:** Temporary operating baseline pending review by a licensed attorney.

> This document is an engineering/operations risk-reduction checklist, not legal advice and not a substitute for counsel. It is deliberately conservative. If this document conflicts with advice from qualified counsel, a court order, a regulator, or a newer law, follow the controlling authority and update this file.

## 1. Operating rule: product behavior must match what we tell customers

Do not publish a legal, privacy, security, billing, AI, verification, or marketing statement unless the product actually behaves that way. Georgia's Fair Business Practices Act makes unfair or deceptive acts or practices in consumer transactions unlawful. For BragStack this means, at minimum:

- do not promise jobs, interviews, promotions, compensation, accuracy, verification, security, uptime, or other outcomes we cannot guarantee;
- do not describe an AI output as verified fact merely because it was generated from user data;
- do not describe a verifier response as an independent audit, certification, background check, or employer endorsement unless that is literally what occurred;
- show current plan price, billing interval, renewal behavior, feature limits, and cancellation terms accurately;
- keep screenshots, pricing copy, product docs, Terms, Privacy Policy, checkout copy, and actual product behavior aligned.

**Primary Georgia authority:** O.C.G.A. § 10-1-393 (Fair Business Practices Act).

## 2. Online subscriptions / automatic renewal — immediate production checklist

BragStack Pro is currently marketed as a recurring online subscription. Georgia's Online Automatic Renewal Transparency law, O.C.G.A. §§ 10-1-439.5 through 10-1-439.13, applies to online automatic-renewal and continuous-service offers covered by the statute.

Before allowing a Georgia consumer to complete a recurring subscription, verify all of the following in the actual purchase flow:

- [ ] Automatic-renewal terms are clear and conspicuous before the subscription is completed.
- [ ] The renewal terms are visually close to the place where the consumer gives consent.
- [ ] The consumer affirmatively consents before the payment method is charged.
- [ ] The customer receives a retainable acknowledgment containing the renewal terms, cancellation policy, and how to cancel.
- [ ] Cancellation is reasonably accessible and actually works; BragStack currently has a first-party cancellation endpoint and should keep the UI path easy to find.
- [ ] Before or within three days after a recurring charge, unless the customer opted out of that notice where the statute allows, the customer receives a clear notice stating that the subscription renews automatically unless canceled, the renewal period/additional terms, an electronic cancellation link or accessible electronic cancellation method, and BragStack contact information.
- [ ] A material subscription-term change is accompanied by clear notice and cancellation information in a form the customer can retain.
- [ ] We retain operational evidence sufficient to show what subscription terms were presented and that the customer consented.

**Do not assume Stripe alone satisfies every Georgia notice requirement.** Confirm the exact production Checkout page, Stripe/customer emails, and BragStack cancellation flow. If Stripe's post-charge/renewal communications do not contain all required content, BragStack must send its own compliant notice.

**Primary Georgia authority:** O.C.G.A. § 10-1-439.9. Good-faith compliance is specifically addressed in O.C.G.A. § 10-1-439.13.

### Federal baseline for online negative-option subscriptions

The federal Restore Online Shoppers' Confidence Act (ROSCA), 15 U.S.C. §§ 8401–8405, requires online negative-option sellers to clearly disclose material terms before obtaining billing information, obtain express informed consent before charging, and provide simple mechanisms to stop recurring charges. FTC enforcement also treats misleading billing/cancellation practices as a serious consumer-protection risk.

**Do not rely on old summaries of the FTC's 2024 Click-to-Cancel rule as the sole current authority.** The safer operating baseline is the underlying FTC Act/ROSCA principles plus applicable state law and current FTC guidance/enforcement.

### Longer-term contracts

BragStack's current monthly plan is different from a service contract of 12 months or longer. If BragStack later sells annual, multi-year, enterprise, or other long-duration automatically renewing contracts, counsel must review O.C.G.A. Title 13, Chapter 12 and any additional notice requirements before launch.

## 3. Billing records to keep

Keep a limited, secure compliance record without storing full card numbers or unnecessary payment data:

- Stripe customer and subscription identifiers;
- plan and price identifier/version;
- date/time subscription was created;
- the checkout/legal-copy version presented at purchase where technically feasible;
- the event proving successful payment/activation;
- renewal-notice delivery record where BragStack sends the notice;
- cancellation request timestamp and effective cancellation state;
- material plan-change notices;
- refund/chargeback support records needed to resolve the matter.

Do not place payment secrets or raw Stripe payloads containing unnecessary customer data in GitHub, tickets, chat, or logs.

## 4. Privacy: Georgia does not currently have the comprehensive SB 111 privacy regime that many trackers still describe

A major research trap exists here. SB 111 was introduced under the title **"Georgia Consumer Privacy Protection Act,"** but the final enacted 2026 legislation was substituted and became a rural-hospital tax-credit measure. Official 2026 Georgia legislative summaries describe final SB 111 / Act 462 as changing rural hospital eligibility, not enacting the introduced comprehensive consumer-privacy framework.

Therefore:

- **Do not tell customers that SB 111 created current Georgia access/deletion/opt-out rights.**
- Continue honoring the access, correction, export, and deletion choices BragStack voluntarily offers and any rights required by other applicable jurisdictions.
- Counsel must later perform a multi-state privacy analysis based on where BragStack users live, not only where BragStack operates.

This point should be re-checked at lawyer review because privacy laws change quickly.

## 5. Data minimization and third-party data

BragStack stores career evidence and can receive third-party verifier contact information. Use the smallest amount of data needed for the feature.

- Keep private career workspace content private by default.
- Do not use verifier contact data for marketing, unrelated outreach, retaliation, or enrichment.
- Keep pending verifier contact data separate from the public/portable Impact Receipt record where feasible.
- Follow the existing seven-day pending-verification lifecycle only if production behavior continues to match that documented promise.
- Do not store customer secrets, passwords, access tokens, restricted source code, regulated health/financial data, or confidential employer/client documents merely because a user wants career evidence.
- When safer, store a generalized summary/reference instead of the confidential source material.

## 6. Secure disposal of records

Georgia requires businesses disposing of records containing covered personal information to make the information unreadable or otherwise reasonably prevent unauthorized access between disposal and destruction.

Operationally:

- use deletion APIs/storage lifecycle rules rather than copying personal data into unmanaged local files;
- sanitize exported support artifacts before disposal;
- securely erase local temporary files containing personal information;
- make sure retired databases/backups/storage volumes follow an actual destruction/lifecycle process;
- never dispose of printed or exported customer records intact.

**Primary Georgia authority:** O.C.G.A. § 10-15-2.

## 7. Georgia data-breach response

If BragStack discovers unauthorized acquisition of unencrypted personal information covered by Georgia's breach law, escalate immediately. Do not wait for perfect certainty before opening the incident process.

Georgia's O.C.G.A. § 10-1-912 generally requires covered data collectors/information brokers to notify affected Georgia residents in the most expedient time possible and without unreasonable delay, subject to permitted law-enforcement delay and time needed to determine scope and restore integrity. A business maintaining computerized personal information for another owner must notify that owner within **24 hours after discovery** when the statute's conditions are met. If a breach requires notice to more than 10,000 Georgia residents at one time, additional consumer-reporting-agency notice is required.

Use `docs/DATA_BREACH_RESPONSE_GEORGIA.md` for the response procedure.

## 8. Security minimums

These controls are operational expectations, not marketing promises:

- unique production secrets; never commit secrets;
- least-privilege access to production data;
- verified webhook signatures and replay/idempotency protection;
- HTTPS/TLS for production traffic;
- secure authentication/session handling;
- dependency/security update process;
- backups appropriate to the data we promise to preserve;
- sanitized logs and support tickets;
- documented incident ownership and escalation;
- periodic access review as soon as more people receive production access.

Georgia's Attorney General publishes a small-business cybersecurity guide encouraging organizations to protect data and networks, train personnel, and plan for/respond to breaches. Treat that as a practical floor, not a certification.

## 9. Computer misuse / unauthorized access

The acceptable-use policy should continue prohibiting unauthorized access, credential misuse, interference, malware, scraping that bypasses controls, and attempts to access another user's private data. Georgia's Computer Systems Protection Act, including O.C.G.A. § 16-9-93, addresses several forms of unauthorized computer use and access.

## 10. Confidential employer/client information and trade secrets

BragStack must not imply that using the product overrides an NDA, employer policy, confidentiality clause, client agreement, export-control obligation, or other legal duty.

Customer-facing guidance should consistently say:

- save only information the user is allowed to retain;
- remove secrets and restricted details;
- use generalized descriptions and approved references where necessary;
- review public profiles and share links before publishing;
- anything intentionally made public may be copied by others.

## 11. AI and career guidance

For current AI-assisted features:

- present AI as drafting/coaching/organization assistance, not legal, HR, financial, medical, or guaranteed employment advice;
- require users to review generated resumes, interview answers, claims, metrics, credentials, dates, and employer names;
- never fabricate missing career facts;
- do not use an AI-generated score or recommendation as an employer's hiring decision unless counsel has separately reviewed that use case;
- document the providers and data sent to them in the internal model registry and keep customer privacy statements accurate.

## 12. Georgia conversational-AI law — future deadline to track

Georgia SB 540 became Act 518 on May 11, 2026 and has an **effective date of July 1, 2027**. It concerns disclosures and protections for conversational AI services, including provisions involving minors, privacy tools, and self-harm protocols.

It is not yet effective as of this document's date, but BragStack has conversational career/interview AI features. Before July 1, 2027:

- [ ] have counsel determine whether each BragStack AI surface falls within the statute's definitions/exceptions;
- [ ] decide and technically enforce an age policy rather than relying only on vague eligibility language;
- [ ] implement any required AI disclosure, privacy-tool, minor-protection, and safety-protocol controls that apply;
- [ ] update Terms, Privacy, UI, and model governance documentation together.

**Primary source:** Georgia General Assembly SB 540 / Act 518.

## 13. Customer privacy requests — interim operating procedure

Even when a specific Georgia comprehensive privacy right is not the source of the request, BragStack's existing public Privacy Policy offers access/export/correction/deletion request channels. Honor those published commitments consistently.

For every request:

1. record request date and request type without unnecessarily copying the customer's private content;
2. verify identity proportionately before disclosing or deleting account data;
3. identify the systems/vendors in scope;
4. complete the request or document the lawful/operational reason a portion is retained;
5. record completion date and what category of action was taken;
6. do not reveal another person's data while fulfilling the request.

## 14. Customer support / complaints

Consumer complaints about billing, privacy, account access, public sharing, verification, or security should be treated as potential compliance signals, not merely support tickets. Preserve enough information to investigate, but avoid copying sensitive content into tickets.

Escalate immediately if a complaint alleges:

- unauthorized charge or inability to cancel;
- deceptive plan/feature statement;
- unauthorized disclosure of private workspace data;
- account takeover;
- security breach;
- misuse of verifier contact data;
- publication of information the customer did not intentionally make public.

## 15. Records and versioning

Maintain versions/dates for:

- Terms and Conditions;
- Privacy Policy;
- customer legal/billing notice;
- pricing and checkout disclosure copy;
- major consent-flow changes;
- processor/vendor inventory;
- incident log;
- privacy request log;
- subscription/cancellation notice templates.

When legal copy changes materially, retain the old version internally so we can determine what customers were shown at a given time.

## 16. Lawyer-review punch list for the next few weeks

Take this list and the current production app to counsel:

1. Confirm the correct legal entity/trade name, business address, registered agent, and contact information to use in contracts/notices.
2. Review Georgia automatic-renewal implementation and actual Stripe emails/Checkout screens.
3. Review Terms: governing law, venue, dispute resolution, arbitration/class waiver (if desired), indemnity, disclaimers, liability cap, termination, refunds, taxes, and electronic contracting.
4. Review Privacy Policy against the real data map and every production processor.
5. Run a multi-state privacy/consumer-law analysis based on actual user locations (for example CA, CO, CT, DE, FL, IA, IN, KY, MD, MN, MT, NE, NH, NJ, OR, RI, TN, TX, UT, VA and newer state regimes as applicable at that time).
6. Review children/minors policy and Georgia Act 518 / SB 540 before its July 1, 2027 effective date.
7. Review AI features for employment/hiring-law risk if BragStack later sells evaluation, screening, ranking, or decision tools to employers.
8. Review data-processing/vendor agreements, breach clauses, cross-border transfers, and DPA needs.
9. Review open-source/software licenses, BragStack trademarks/branding, user-content license, and third-party content/evidence handling.
10. Review tax nexus/sales tax, entity/DBA registrations, accessibility, insurance, and B2B enterprise contract needs.

## 17. Sources checked for this interim baseline

Re-check before relying on this document after material product changes or at lawyer review.

- Georgia Fair Business Practices Act — O.C.G.A. § 10-1-393: https://law.justia.com/codes/georgia/title-10/chapter-1/article-15/part-2/section-10-1-393/
- Georgia Online Automatic Renewal Transparency — O.C.G.A. § 10-1-439.9: https://law.justia.com/codes/georgia/title-10/chapter-1/article-15/part-8/section-10-1-439-9/
- Automatic-renewal enforcement/good-faith provision — O.C.G.A. § 10-1-439.13: https://law.justia.com/codes/georgia/title-10/chapter-1/article-15/part-8/section-10-1-439-13/
- Georgia breach notification — O.C.G.A. § 10-1-912: https://law.justia.com/codes/georgia/title-10/chapter-1/article-34/section-10-1-912/
- Georgia secure record disposal — O.C.G.A. § 10-15-2: https://law.justia.com/codes/georgia/title-10/chapter-15/section-10-15-2/
- Georgia Computer Systems Protection Act — O.C.G.A. § 16-9-93: https://law.justia.com/codes/georgia/title-16/chapter-9/article-6/part-1/section-16-9-93/
- Georgia General Assembly 2026 End of Session Report (final SB 111 summary): https://www.legis.ga.gov/api/document/docs/default-source/house-budget-and-research-office-document-library/session-reports/2026_end_of_session_report_by_committee-pdf.pdf
- Governor of Georgia, May 11, 2026 signing summary (SB 111 rural-hospital measure): https://gov.georgia.gov/press-releases/2026-05-11/gov-kemp-signs-legislation-lowering-taxes-and-supporting-economic-growth
- Georgia General Assembly SB 540 / Act 518: https://www.legis.ga.gov/legislation/73452
- FTC negative-option / ROSCA guidance: https://www.ftc.gov/business-guidance/blog/2016/09/negative-options-make-them-positive
- Georgia Attorney General small-business cybersecurity guidance: https://consumer.georgia.gov/consumer-topics/cybersecurity-georgia

## 18. Change control

Any feature that materially changes billing, advertising claims, public sharing, verifier workflows, data collection, AI providers, minors access, or retention must trigger a documentation/compliance review before release.
