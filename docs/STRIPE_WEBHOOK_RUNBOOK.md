# Stripe webhook operations runbook

This runbook describes safe operational checks for Boasted Stripe webhook delivery. Never paste Stripe secret keys, webhook signing secrets, raw customer payment data, or production credentials into issues, logs, or this repository.

## Normal behavior

- Boasted verifies the Stripe signature before parsing or claiming an event.
- Each Stripe event ID is stored as the MongoDB `_id` in `stripe_webhook_events`.
- A successfully handled event is marked `processed` and a later delivery of the same event returns a safe duplicate success without repeating the billing state change.
- A handler exception releases the processing claim so Stripe can retry the event.
- An abandoned processing claim has a short lease and may be reclaimed after the lease expires.
- User billing documents track `billing_last_stripe_event_created`; an older webhook event must not regress state established by a newer event.

## Georgia automatic-renewal compliance gate

Boasted Pro is a recurring online subscription. The webhook state machine is only one part of the billing flow; it does **not** by itself satisfy customer disclosure/notice duties.

Before recurring billing is treated as production-ready for Georgia consumers, verify the complete flow against `docs/GEORGIA_INTERIM_LEGAL_COMPLIANCE_BASELINE.md`, including:

- clear automatic-renewal terms before purchase and close to the consent action;
- affirmative consent before charging;
- a retainable acknowledgment containing renewal terms, cancellation policy, and cancellation instructions;
- a simple, working electronic cancellation path;
- a notice before or within three days after a recurring charge (where required and not opted out as permitted) stating that the subscription renews unless canceled, the renewal period/additional terms, an electronic cancellation method/link, and Boasted contact information;
- a retainable notice of material subscription-term changes with cancellation instructions.

**Important:** Do not assume Stripe's default receipt/invoice emails satisfy every Georgia requirement. Inspect the actual production messages. If a required element is missing, Boasted must send its own compliant notice or configure Stripe so the required information is present.

Operationally retain enough non-sensitive evidence to show the subscription state, cancellation state, relevant billing event, and delivery of any Boasted-controlled legal notice. Do not retain full payment-card data.

Primary Georgia reference: O.C.G.A. § 10-1-439.9. Federal online negative-option requirements under ROSCA also require clear material terms, express informed consent, and a simple cancellation mechanism.

## Investigating a webhook

1. Identify the Stripe event ID in the Stripe dashboard or approved operational tooling.
2. Check the corresponding `stripe_webhook_events` document by `_id` using authorized internal tooling. Do not copy customer payloads into tickets.
3. If the ledger status is `processed`, treat another delivery as a duplicate and do not manually repeat side effects.
4. If the event is currently `processing`, allow the active request/lease to finish before intervening.
5. If application processing failed, confirm the event claim was released and inspect sanitized application/request logs using the request ID.
6. Compare the Stripe event `created` timestamp with the user's `billing_last_stripe_event_created` before diagnosing an apparent state mismatch. Older events are intentionally prevented from overwriting newer state.

## Safe replay procedure

Use Stripe's supported event resend/replay mechanism rather than crafting an unsigned HTTP request. Replays must still pass webhook signature verification. After replay:

- a previously processed event should return success as a duplicate and create no second state change;
- a previously failed event should be claimable again and may complete normally;
- an older event should not overwrite billing state produced by a newer event.

Do not delete a `processed` ledger record merely to force a replay. If reconciliation is genuinely required, use a purpose-built, audited reconciliation path or make a code change with review and tests.

## Incident checks

If billing state appears wrong:

- verify the customer/subscription IDs map to the intended Boasted user;
- compare the relevant Stripe event timestamps and types;
- confirm webhook signature failures are not occurring;
- confirm the event ledger is writable and MongoDB is healthy;
- review sanitized request/error telemetry;
- verify a customer who canceled is not being incorrectly treated as renewing;
- if a charge occurred, verify any legally required renewal notice was sent with the required cancellation/contact information;
- avoid editing production MongoDB documents by hand unless the documented emergency procedure explicitly requires it.

Any manual production correction should record who performed it, why it was necessary, the affected event/user identifiers, and the final verified subscription state without including secrets or payment details.
