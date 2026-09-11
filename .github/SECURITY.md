# Security Policy

Boasted takes reports about account security, authentication, privacy, data exposure, and credential leaks seriously.

## Reporting a vulnerability

Please do **not** open a public GitHub issue for a vulnerability, exposed credential, or suspected private-data leak.

Email **support@boasted.io** with the subject **Boasted security report** and include only the minimum detail needed to reproduce the issue safely. Do not send passwords, access tokens, full payment-card data, employer-confidential evidence, or other unnecessary sensitive information.

## Secrets and credentials

Production credentials must never be committed to this repository. Local environment files and common credential formats are ignored by Git, and pull requests are checked by the repository secret-scan workflow. If a real credential is ever committed, treat it as compromised: revoke or rotate it first, then remove it from the repository and history as appropriate.

## Supported code

Security fixes are prioritized for the current production branch and actively maintained release paths. Experimental, archived, or draft branches may contain incomplete product work and should not be treated as production-ready.
