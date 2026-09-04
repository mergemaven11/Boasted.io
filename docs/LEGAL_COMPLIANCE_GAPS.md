# BragStack — interim legal/compliance gaps

**Reviewed:** September 4, 2026  
**Purpose:** Keep us from confusing good documentation with proven legal/operational compliance while we wait for attorney review.

> A green checkbox here means the control was verified in the real product/operations, not merely written into a policy.

## 🔴 High priority before scaling paid Georgia subscriptions

### 1. Prove the full automatic-renewal flow

**Status: NOT YET PROVEN**

The current code creates a recurring Stripe Checkout subscription and provides first-party cancellation/resume endpoints. The Upgrade page now adds a BragStack pre-checkout consent screen with the $9/month price, monthly automatic renewal, cancellation method, refund-policy summary, and Terms/Privacy/legal-notice links. However, the legal review must still verify the real customer journey, not just the code.

Before calling Georgia recurring billing compliant, verify in production:

- [x] BragStack pre-checkout UI clearly states $9/month and monthly auto-renewal before the user continues to Stripe;
- [x] BragStack requires an affirmative recurring-billing acknowledgement before opening Stripe Checkout;
- [ ] Stripe's production checkout and post-purchase customer records provide a retainable acknowledgment with all required renewal terms, cancellation policy, and cancellation instructions;
- [ ] the cancellation UI is easy to find and successfully schedules cancellation in production;
- [ ] each recurring charge gets the Georgia-required notice before or within three days when applicable, including renewal statement, renewal period/additional terms, electronic cancellation path, and BragStack contact information;
- [ ] material subscription changes produce a retainable change notice and cancellation information;
- [ ] BragStack can demonstrate what billing terms were in effect for a given subscription and, if counsel recommends it, retain a server-side billing-consent/version record.

**Do not assume a Stripe receipt or invoice contains every element until someone checks the actual production email/template.**

### 2. Paid checkout disclosure screen

**Status: IMPLEMENTED IN CODE — PRODUCTION/UAT VERIFICATION REQUIRED**

`frontend/src/UpgradePage.jsx` no longer automatically opens Stripe Checkout. It now requires the user to review a recurring-subscription disclosure and affirmatively acknowledge the $9/month automatic-renewal terms before continuing.

Before marking this fully green:

- [ ] verify the deployed page renders the complete disclosure on desktop/mobile;
- [ ] verify the Continue button cannot open checkout until the acknowledgement is checked;
- [ ] verify Terms, Privacy, and Georgia notice links resolve correctly;
- [ ] confirm with counsel whether a server-side billing-consent/version record should be retained in addition to Stripe's own records.

## 🟠 Important operational verification

### 3. Customer-facing legal pages need counsel review

**Status: STRONG DRAFT, NOT LAWYER-APPROVED**

Existing Privacy, Terms, and NDA guidance already cover many sensible areas. This PR adds an interim Georgia customer notice and an explicit 18+ account boundary. Counsel should still review the whole package, especially:

- legal entity/trade name and business contact/address;
- governing law/venue/dispute terms;
- arbitration/class waiver decision, if any;
- liability/disclaimer/indemnity language;
- refund/tax language;
- accessibility and electronic-contract formation;
- multi-state privacy obligations.

### 4. Multi-state privacy analysis

**Status: NOT COMPLETE**

Georgia does not currently have the comprehensive SB 111 privacy law that some stale trackers describe; final SB 111 / Act 462 became rural-hospital legislation. That does **not** mean BragStack has no privacy-law obligations. User residence can trigger other state laws.

Before meaningful growth or paid acquisition outside Georgia, counsel should map actual user states against then-current state privacy laws and thresholds.

### 5. Processor/vendor inventory

**Status: NEEDS PERIODIC VERIFICATION**

Maintain an internal list of production providers that may process customer data (hosting, database, auth/OAuth, email, analytics, AI, payments, observability, file/storage providers). Public policy language must match the real list and data flows.

### 6. Data retention promises

**Status: VERIFY AGAINST JOBS/STORAGE**

Any specific retention promise — especially the documented seven-day pending-verifier contact lifecycle — must be backed by production behavior, including error paths and backups where relevant.

## 🟡 Near-term policy choices for counsel

### 7. Age/minors policy

**Status: INTERIM 18+ BOUNDARY IMPLEMENTED — COUNSEL REVIEW STILL REQUIRED**

BragStack now uses a conservative interim adults-only boundary:

- [x] registration shows a blocking 18+ modal;
- [x] email/password registration requires 18+ confirmation plus Terms and Privacy acceptance;
- [x] the backend rejects new email/password accounts without those confirmations and records acceptance timestamps/versions;
- [x] new OAuth account creation is temporarily blocked so it cannot bypass the registration gate, while existing OAuth users can continue signing in;
- [x] Middle School student accounts remain visible as “Coming soon” but are not selectable for new records;
- [x] internal Education Intelligence documentation and the Georgia customer notice state the 18+ boundary;
- [ ] review any pre-existing/legacy customer accounts that predate the new age attestation and decide whether re-attestation is appropriate before broad public launch;
- [ ] obtain counsel approval before opening under-18/student accounts.

Georgia SB 540 / Act 518 becomes effective July 1, 2027 and includes requirements related to conversational AI, minors, privacy tools, and safety protocols. BragStack must review applicability before that date.

### 8. B2B / employer-facing AI

**Status: DO NOT EXPAND WITHOUT REVIEW**

Current career AI should remain user-directed drafting/coaching. If BragStack later sells employer-facing candidate scoring, screening, ranking, hiring recommendations, or employment decision tools, stop and run a separate employment/AI legal review before release.

## ✅ Existing strengths observed in the repo

These are useful risk-reduction controls, but they do not equal a legal certification:

- customer-facing Privacy Policy, Terms, NDA/confidential-work guidance, and Docs exist;
- private workspace/public-sharing distinction is documented;
- terms warn against fabricated career evidence and misuse of verifier contact information;
- AI outputs are described as drafting/coaching aids that users must review;
- new email/password registration records 18+ and legal-policy acceptance metadata;
- first-party subscription cancellation/resume endpoints exist;
- Stripe webhook signatures are verified and webhook processing includes idempotency/replay protections;
- BragStack now places a recurring-billing disclosure/acknowledgement before Stripe Checkout;
- billing docs tell operators not to put secrets or raw payment data into logs/issues;
- verifier data has a documented lifecycle and minimum-data approach.

## Rule until lawyer review

When uncertain, choose the behavior that is clearer to the customer, collects less data, makes cancellation easier, avoids outcome guarantees, and preserves a record of consent/notice without retaining sensitive data.
