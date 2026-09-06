---
name: bragstack-api-contract-quality
description: Keep Boasted FastAPI endpoints, schemas, authorization boundaries, persistence behavior, and tests aligned as the API evolves.
---

# Boasted API Contract Quality

## Use this skill when

- adding or changing FastAPI routes, Pydantic models, MongoDB persistence, auth, exports, or integrations
- fixing backend bugs
- reviewing a backend PR

## Workflow

1. Define the user-visible contract first: request shape, response shape, status codes, auth requirement, ownership rule, privacy behavior, and failure modes.
2. Trace the route through validation, authorization, persistence, serialization, and side effects. Do not validate only the happy path.
3. Keep authentication and authorization distinct. A valid token does not imply access to another user's record.
4. Make ownership/tenant checks explicit for every read, update, delete, export, and share operation involving private data.
5. Use typed request/response models and avoid leaking internal MongoDB fields or implementation details.
6. Check pagination, filtering, sorting, date boundaries, empty collections, malformed IDs, duplicates, retries, and idempotency where relevant.
7. Add focused tests for success, validation failure, unauthenticated access, unauthorized cross-user access, missing records, and regression cases.
8. For important APIs, consider schema/property-based tests (for example Hypothesis/Schemathesis patterns) to discover combinations hand-written tests miss.
9. Verify OpenAPI remains coherent and that frontend assumptions still match the backend contract.
10. Run backend CI/tests on the exact branch head before recommending merge.

## Required output

- contract summary
- authorization/privacy rules checked
- edge cases covered
- tests added or updated
- compatibility concerns
- CI/test result

## Final checks

- no cross-user data exposure
- no invented/default values that alter user evidence
- consistent error semantics
- stable response shapes
- tests reproduce the bug or contract change
