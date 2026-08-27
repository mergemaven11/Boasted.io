# Verifier contact-data lifecycle

BragStack's receipt-verification workflow accepts limited third-party contact data so a user can ask a collaborator, stakeholder, or organization representative to review an Impact Receipt. This runbook describes how that data is stored, minimized, migrated, and verified operationally.

## Data model

Pending request contact data is stored in MongoDB collection `receipt_verification_requests`, separate from the Impact Receipt itself. A pending request may contain:

- receipt and owner identifiers
- confirmation identifier
- verifier email address
- optional user-authored message to the verifier
- SHA-256 hash of the high-entropy verification token
- request and expiry timestamps

The Impact Receipt's `confirmations` array stores only the fields needed to display and later retain the attestation: confirmation id, verifier name, role, confirmation type, status, request timestamp, expiry while pending, and response timestamps.

When a verifier confirms or declines, the pending request document is deleted. The completed receipt confirmation retains only the minimum attestation fields needed to represent the response; verifier email, request message, token hash, and expiry are not retained on the receipt.

## Retention

Verification links expire after seven days. `receipt_verification_requests.expires_at` is covered by the `receipt_verification_ttl` MongoDB TTL index with `expireAfterSeconds=0`.

MongoDB TTL deletion is asynchronous, so the application also treats expired records as unavailable immediately and proactively deletes expired request records it encounters. Expired pending confirmation shells are removed from the receipt when encountered by the verification workflow.

## Deployment order

For the release that introduces the separate request collection:

1. Back up the production database according to the normal database-change procedure.
2. Deploy or otherwise make the new application code available, but do not remove legacy data before indexes are ready.
3. Run the normal core-index setup and verify all three verifier-request indexes exist:
   - `uniq_receipt_verification_token`
   - `uniq_receipt_verification_pending_email`
   - `receipt_verification_ttl`
4. Run the one-time privacy migration from the backend environment:

   `python scripts/migrate_receipt_verification_privacy.py`

5. Record the JSON migration statistics in the deployment or incident record.
6. Run the verification checks below before considering the migration complete.

The migration is idempotent and may be run again if a deployment is interrupted.

## Migration behavior

`migrate_receipt_verification_privacy` performs the following operations:

- copies still-valid legacy pending verifier email, message, and token hash into `receipt_verification_requests`
- removes those sensitive fields from the corresponding Impact Receipt confirmation
- removes expired pending confirmations instead of preserving obsolete contact records
- removes unusable/orphaned pending confirmations that cannot support a valid link
- strips verifier email, message, token hash, and obsolete expiry from completed confirmations
- leaves completed attestation identity/role/type/status/timestamps intact

A live legacy verification link remains usable because its existing token hash is migrated rather than regenerated.

## Verification after migration

Check a representative non-production or approved test record and confirm:

- a newly requested verification stores no `email`, `message`, or `token_hash` inside `impact_receipts.confirmations`
- the corresponding `receipt_verification_requests` document contains the normalized email and hashed token, never the raw token
- the public verification response does not expose verifier email
- confirming or declining deletes the request document and leaves a minimized attestation
- an expired request is rejected even before MongoDB's TTL monitor physically deletes the document
- duplicate active requests for the same receipt/email are rejected
- `receipt_verification_ttl` has `expireAfterSeconds=0`

## Incident and deletion handling

If a verifier requests deletion or reports an unwanted verification request, locate only the minimum records needed to handle the request. For an unanswered request, delete the `receipt_verification_requests` record and remove the matching pending confirmation shell from the receipt. For a completed attestation, evaluate the applicable privacy request and legal obligations before changing the retained attestation record.

Do not copy verifier contact data into logs, support notes, analytics events, or incident tickets unless it is necessary for the specific case and appropriately protected.

## Rollback considerations

Do not roll back to application code that requires verifier email/message/token hashes to remain embedded in Impact Receipt confirmations after running the migration. If an emergency rollback is required, use a version that can read the separate request collection or disable new verification requests until a compatible version is restored.
