# Boasted — Georgia data-breach response runbook

**Working version:** September 4, 2026  
**Status:** Interim runbook pending attorney review.

> This is an operational response checklist, not legal advice. A suspected breach can create obligations in multiple states and under federal/contractual rules. Get qualified counsel involved as soon as practical for any real incident.

## Trigger

Open this runbook immediately when there is a credible report or technical signal of unauthorized acquisition or exposure of customer personal information, including account credentials, protected billing/account data, government identifiers, or other data potentially covered by O.C.G.A. § 10-1-911 et seq.

Do not wait for a completed forensic investigation to start the incident record.

## First hour

1. **Preserve evidence.** Save relevant timestamps, request IDs, authentication/security logs, deployment history, affected resource identifiers, and provider incident notices. Do not alter logs merely to make the incident look cleaner.
2. **Contain safely.** Revoke compromised credentials/tokens, disable abused access paths, rotate secrets where justified, and isolate affected systems without destroying evidence.
3. **Limit access.** Only people needed for investigation should access affected customer data.
4. **Open an incident record.** Record discovery time, who discovered it, affected systems, known/suspected data types, containment actions, and decision owners.
5. **Notify the founder/incident owner immediately.** A potential legal-notification event is not a routine support ticket.

## Determine which role Boasted had for the data

Georgia's breach statute distinguishes an owner/data collector from a business maintaining computerized personal information for another owner.

- If Boasted owns/controls the covered data as the relevant data collector, assess resident notification duties under O.C.G.A. § 10-1-912(a).
- If Boasted maintains covered computerized personal information for another information broker/data collector and the statutory conditions are met, O.C.G.A. § 10-1-912(b) requires notice to that owner **within 24 hours following discovery**.

Treat the 24-hour service-provider deadline as an immediate escalation deadline. Do not assume a customer contract allows more time than the statute.

## Scope the incident

Document, without copying more personal data than necessary:

- earliest known unauthorized access/acquisition time;
- discovery time;
- affected production/database/storage/provider systems;
- number of potentially affected accounts;
- states/countries of affected users if known;
- whether data was encrypted and whether encryption keys/credentials were also compromised;
- categories of personal information involved;
- whether credentials can be reset/revoked;
- whether a third-party processor/provider is involved;
- whether law enforcement has requested a notification delay.

## Georgia resident notice rule

O.C.G.A. § 10-1-912(a) generally requires covered data collectors/information brokers to notify a Georgia resident when the resident's **unencrypted personal information** was, or is reasonably believed to have been, acquired by an unauthorized person.

The statute requires notice in the **most expedient time possible and without unreasonable delay**, consistent with:

- legitimate law-enforcement needs under the statute; and
- measures necessary to determine the scope of the breach and restore reasonable integrity, security, and confidentiality of the system.

Do not create a made-up fixed Georgia deadline in customer copy. Use the statutory standard and obtain counsel for an actual incident.

## More than 10,000 Georgia residents

If circumstances require notice to more than 10,000 Georgia residents at one time, O.C.G.A. § 10-1-912(d) also requires notice, without unreasonable delay, to nationwide consumer reporting agencies described by the statute regarding the timing, distribution, and content of the resident notices.

Escalate to counsel immediately before sending mass notices.

## Multi-state check

Boasted may have users outside Georgia. For any incident:

- identify every affected user's state/country where reasonably possible;
- do not assume Georgia law is the only notification law;
- check contractual notice requirements owed to vendors, enterprise customers, insurers, or partners;
- involve counsel before finalizing notification content/timing for a multi-state event.

## Customer notice preparation

Where notice is legally required, prepare a truthful notice based on confirmed facts. Avoid speculation and avoid minimizing the event.

At a minimum, the incident owner should be able to explain:

- what happened in plain language;
- when it happened / when Boasted discovered it, if appropriate;
- what information was involved;
- what Boasted has done to contain/remediate it;
- what the customer should do, if anything;
- how to contact Boasted with questions.

Counsel should review actual breach notices when available.

## Security remediation

Before closing the incident:

- rotate/revoke affected secrets and credentials;
- patch the root cause;
- verify access controls;
- verify session/token invalidation where relevant;
- verify backups/logs were not silently compromised;
- add regression tests/detection for the exploited path where feasible;
- verify affected third-party providers completed their remediation;
- document any longer-term follow-up work.

## Records

Keep an internal incident record containing:

- discovery and containment timeline;
- affected systems/data categories;
- forensic findings;
- notification decisions and legal basis;
- notices sent and dates;
- remediation actions;
- post-incident review.

Do not store unnecessary raw customer data, passwords, tokens, payment-card details, or secrets in the incident record.

## Authority / references checked September 4, 2026

- O.C.G.A. § 10-1-912: https://law.justia.com/codes/georgia/title-10/chapter-1/article-34/section-10-1-912/
- Georgia Attorney General — Cybersecurity in Georgia (small-business guidance): https://consumer.georgia.gov/consumer-topics/cybersecurity-georgia
- Georgia Attorney General — Data breach consumer guidance: https://consumer.georgia.gov/data-breaches-how-protect-your-information

## Emergency principle

If there is doubt whether an event is serious enough to trigger this runbook, open the incident anyway. Closing a false alarm is cheaper than losing time on a real notification clock.
