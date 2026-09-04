# Shared GitHub Actions budget

BragStack and Variant Vault use one shared monthly GitHub Actions operating budget.

## Budget

- Combined monthly cap: **1,800 Actions minutes**.
- Normal planned usage target: **1,300–1,400 minutes** across both repositories.
- Reserve: **400–500 minutes** for launch validation, emergency fixes, production incidents, and unexpected reruns.

This is an operating target, not a reason to remove important safety or release gates. Expensive validation belongs at a less frequent cadence instead of being deleted.

## Standard workflow tiers

Both repositories use the same four CI surfaces:

1. **Fast CI — commit feedback**
   - compilation/static checks
   - lint/typecheck
   - small cheap validation
   - cancelled when superseded by a newer commit on the same ref

2. **PR CI — merge confidence**
   - broader regression tests
   - database/migration checks where applicable
   - docs/build validation
   - release-oriented checks that are reasonable on every PR

3. **Nightly CI — deep regression**
   - expensive browser/device QA
   - deeper dependency/security checks
   - integration/provider checks
   - skips heavy work when the default branch has been quiet

4. **Full Validation — launch confidence**
   - `workflow_dispatch` only
   - complete production/release validation suite
   - run manually before launches, production cutovers, store submissions, large migrations, and other high-risk releases

## Shared operating principle

**Commit = fast feedback**  
**PR = merge confidence**  
**Nightly = deep regression**  
**Manual Full Validation = launch confidence**

## Cost controls

- Standard workflow names and trigger philosophy are shared across BragStack and Variant Vault.
- Concurrency cancellation prevents obsolete commit/PR runs from finishing at full cost.
- Dependency caching is used where supported.
- Failure artifacts are normally retained for 3 days; manual launch-validation evidence for 7 days.
- Expensive browser, device, container, provider, and deep-security checks should not run on every ordinary commit.
