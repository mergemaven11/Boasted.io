# BragStack — interim legal/compliance gaps

**Reviewed:** September 4, 2026  
**Purpose:** Keep us from confusing good documentation with proven legal/operational compliance while we wait for attorney review.

> A green checkbox here means the control was verified in the real product/operations, not merely written into a policy.

## 🔴 High priority before scaling paid Georgia subscriptions

### 1. Prove the full automatic-renewal flow

**Status: NOT YET PROVEN**

The current code creates a recurring Stripe Checkout subscription and provides first-party cancellation/resume endpoints. However, the legal review must verify the real customer journey, not just the code.

Before calling Georgia recurring billing compliant, verify in production:

- [ ] recurring price/billing interval/renewal behavior is clear before completion and close to consent;
- [ ] consent occurs before charge;
- [ ] the customer receives a retainable acknowledgment with renewal terms, cancellation policy, and cancellation instructions;
- [ ] the cancellation UI is easy to find and successfully schedules cancellation;
- [ ] each recurring charge gets the Georgia-required notice before or within three days when applicable, including renewal statement, renewal period/additional terms, electronic cancellation path, and BragStack contact information;
- [ ] material subscription changes produce a retainable change notice and cancellation information;
- [ ] BragStack can demonstrate what terms were in effect for a given subscription.

**Do not assume a Stripe receipt or invoice contains every element until someone checks the actual production email/template.**

### 2. Paid checkout disclosure screen

**Status: NEEDS PRODUCT REVIEW**

`frontend/src/UpgradePage.jsx` currently begins opening Stripe Checkout automatically for an authenticated user. Stripe Checkout may itself present legally sufficient subscription terms, but we have not proven that in this review.

Conservative follow-up: add a BragStack pre-checkout screen/consent step showing the current recurring price, billing interval, auto-renewal, cancellation method, refund policy, Terms, and Privacy links, then continue to Stripe only after affirmative user action. If implemented, record/retain a reasonable consent/version signal.

## 🟠 Important operational verification

### 3. Customer-facing legal pages need counsel review

**Status: STRONG DRAFT, NOT LAWYER-APPROVED**

Existing Privacy, Terms, and NDA guidance already cover many sensible areas. This PR adds an interim Georgia customer notice. Counsel should still review the whole package, especially:

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

**Status: DECISION NEEDED**

Current legal copy uses general eligibility language. A conservative interim business choice would be to limit BragStack accounts to adults until counsel reviews minors requirements, but that policy should only be published if the product can reasonably enforce it.

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
- first-party subscription cancellation/resume endpoints exist;
- Stripe webhook signatures are verified and webhook processing includes idempotency/replay protections;
- billing docs tell operators not to put secrets or raw payment data into logs/issues;
- verifier data has a documented lifecycle and minimum-data approach.

## Rule until lawyer review

When uncertain, choose the behavior that is clearer to the customer, collects less data, makes cancellation easier, avoids outcome guarantees, and preserves a record of consent/notice without retaining sensitive data.
