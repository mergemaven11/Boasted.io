# NDA safety and account closure integration

BragStack's self-service account-closure flow removes the user's account and user-owned career workspace data. The confidentiality system's `confidentiality_attestations` collection is intentionally treated as narrowly scoped security/compliance control metadata rather than career content.

Confidentiality attestation receipts may therefore remain for their bounded retention period when required for legitimate security, legal, compliance, fraud-prevention, or dispute-resolution purposes. Those receipts must continue to contain only control metadata such as the user identifier, action class, attestation version, token hash, status, timestamps, and request ID. They must not contain the career draft, NDA text, uploaded evidence, or plaintext attestation token.

This retention boundary does not change the account-closure promise for the user's profile, accomplishments, Impact Receipts, resumes, shares, and other user-owned product data. It also does not authorize indefinite retention: the confidentiality receipt TTL remains the controlling retention mechanism unless a documented legal hold or other lawful retention requirement applies.

If either account deletion or confidentiality receipt storage changes, review both controls together so deletion does not accidentally erase required security evidence or retain user-authored career content that should have been deleted.
