# Boasted Education Source Audit

This file is the append-only source-decision history for Boasted Education. **Do not rewrite or remove historical entries to make an old decision look different.** When a source changes, append a new dated entry and let Git preserve the prior state.

The public rendering of this policy is `/legal/education-data`.

## Audit rules

1. `Publicly viewable` is not a rights basis.
2. A scraper or proxy subscription does not automatically grant rights to republish the underlying source database.
3. Stored catalog data requires an explicit storage/display rights basis.
4. Live APIs require a documented API-use basis and source-specific attribution/usage compliance.
5. Member evidence is not copied into public opportunity datasets.
6. Source data stays distinguishable from Boasted-generated search suggestions, labels, or explanations.
7. No source may be used to create admissions odds, scholarship odds, hiring predictions, student rankings, or personal salary predictions.
8. Runtime source-access receipts are data-minimized: no raw member evidence, search query/location, API credentials, or full upstream result records.
9. `education_source_audit_events` is intended as an append-only/no-TTL collection. There is no product delete route for those events.
10. If a source's material terms, license, attribution, or interface changes, re-review before expanding use.

## Current approved sources

### Open Scholarships

- **Decision:** Approved for stored scholarship catalog seed.
- **Publisher:** Grudged LLC / Open Scholarships.
- **Rights basis:** CC BY 4.0.
- **Commercial use:** Permitted by CC BY 4.0 with required attribution.
- **Safeguard:** Importer fails closed when license identity, license URL, or required-attribution metadata drifts.
- **Use:** Scholarship search, filters, source provenance, weekly refresh, soft expiration.

### College Scorecard

- **Decision:** Approved for live Program Finder.
- **Publisher:** U.S. Department of Education.
- **Rights basis:** Data.gov currently lists the College Scorecard dataset as public and links it to CC BY licensing information.
- **Commercial use:** CC BY permits commercial reuse subject to attribution and other license conditions.
- **Use:** Institution and field-of-study/program discovery by city/state plus aggregate cost/size context.
- **Safeguard:** Aggregate values are context only; no personal cost, salary, admission, or graduation predictions.
- **Credential:** `COLLEGE_SCORECARD_API_KEY` remains server-side.

### USAJOBS

- **Decision:** Approved for live federal internship discovery.
- **Publisher:** U.S. Office of Personnel Management.
- **Rights basis:** USAJOBS API Terms of Service and public Job Opportunity Announcement data.
- **Commercial use:** Current USAJOBS Job Search API documentation expressly anticipates use by commercial job boards, mobile applications, and social media sites. Current API Terms permit storing/reformatting data for internal application purposes when displayed source values are not altered, USAJOBS is credited, and users are directed to USAJOBS to view/apply. Standalone resale/redistribution is not permitted.
- **Use:** Live federal internship/student-trainee search with direct source links.
- **Safeguard:** Boasted filters to an explicit intern/student-trainee signal and does not persist a competing job database.
- **Credentials:** `USAJOBS_API_KEY` and the registered `USAJOBS_USER_AGENT` email remain server-side.

### O*NET 31.0 Database

- **Decision:** Approved reference source.
- **Publisher:** U.S. Department of Labor / ETA.
- **Rights basis:** CC BY 4.0 for the downloadable database, subject to O*NET exceptions and trademark guidance.
- **Use:** Occupation and skill taxonomy/reference context.

### NCES CIP-SOC Crosswalk

- **Decision:** Approved reference source.
- **Publisher:** National Center for Education Statistics / U.S. Bureau of Labor Statistics.
- **Use:** Broad education-to-occupation exploration only; never an employment guarantee.

### BLS OEWS

- **Decision:** Approved reference source.
- **Publisher:** U.S. Bureau of Labor Statistics.
- **Use:** Aggregate geography-aware employment/wage context only; never a personal salary prediction.

## Not active / blocked sources

### CareerOneStop Web API

- **Decision:** Removed from the planned Program/Internship implementation before production activation.
- **Reason:** Full click-license and Web Service Terms introduced public-access/icon/site-registration/geocoding/license-duration obligations that were disproportionate for this feature. Boasted selected College Scorecard + USAJOBS instead.
- **Production status:** Not active.

### Apify Scholarship Finder / CollegeScholarships.org scraper

- **Decision:** Blocked pending explicit permission from the original data owner.
- **Reason:** Buying/using a scraper does not establish rights to republish CollegeScholarships.org's underlying scholarship database or authored descriptions.

### Parse.bot Scholarships.com wrapper

- **Decision:** Blocked.
- **Reason:** A third-party wrapper does not itself establish commercial redistribution rights to the underlying Scholarships.com content.

### ScholarshipAPI

- **Decision:** Watch list; not active.
- **Reason:** Promising developer product, but Boasted will not activate it until U.S. coverage and final binding commercial-use terms are verified for Boasted's intended display/storage behavior.

### NSPA Exchange

- **Decision:** Future licensed option.
- **Reason:** Strong large-scale U.S. scholarship path once Boasted has a valid data-client agreement and the related membership/license cost is justified.

## Change history

### 2026-09-07 — Commercial-use rights re-verified

- College Scorecard was re-checked against the current Data.gov catalog record showing the dataset as public with CC BY licensing metadata. CC BY permits commercial reuse with attribution.
- USAJOBS was re-checked against the current API Terms and Job Search documentation. The endpoint expressly anticipates commercial job-board use; Boasted's implementation credits USAJOBS, links users back to USAJOBS, keeps source values separate from Boasted annotations, and does not build a standalone redistribution feed.
- This audit entry records the source review and is not a legal opinion or guarantee that third-party terms will never change.

### 2026-09-07 — Permanent source audit policy adopted

Education source decisions become append-only in this document and Git history. Runtime College Scorecard/USAJOBS access receipts use `education_source_audit_events` with no TTL and data-minimized payloads.

### 2026-09-07 — CareerOneStop removed

After review of the complete click license and Web Service Terms, Boasted chose not to activate CareerOneStop and replaced the planned integration with College Scorecard for Programs and USAJOBS for federal internships.

### 2026-09-07 — College Scorecard approved

College Scorecard selected as the U.S. Department of Education source for live program/institution discovery. Program search keeps aggregate source fields separate from Boasted evidence suggestions.

### 2026-09-07 — USAJOBS approved

USAJOBS selected for live federal internship/student-trainee discovery using server-side API authentication, direct links back to USAJOBS, and no hiring prediction.

### 2026-09-07 — Scraper-based scholarship feeds rejected

Apify/CollegeScholarships.org and Parse.bot/Scholarships.com were not approved because scraper availability does not establish rights to build a commercial derivative scholarship database.

### 2026-09-07 — Open Scholarships license gate hardened

Open Scholarships remains the initial stored scholarship seed. Import fails closed when its CC BY 4.0 license identity, license URL, or exact required-attribution metadata changes.
