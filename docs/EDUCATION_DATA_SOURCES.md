# Boasted Education public-data sources

This document defines the public/licensed sources Boasted may use to make **Education** more useful without copying a competitor, scraping private student data, or turning aggregate statistics into personal predictions.

The governing rule is simple:

> **The member's personal evidence comes from the member. Public datasets provide taxonomy, context, and opportunity discovery.**

No source below is permission to invent a degree, course, grade, award, skill, project, credential, job result, salary, acceptance probability, graduation probability, or career outcome for a member.

Implementation details: `docs/EDUCATION_OPPORTUNITY_DISCOVERY.md`  
Append-only source decisions: `docs/EDUCATION_SOURCE_AUDIT.md`  
Public transparency page: `/legal/education-data`

## Source registry

### O*NET 31.0 Database

**Publisher:** U.S. Department of Labor, Employment and Training Administration (USDOL/ETA)  
**Reference release:** O*NET 31.0, August 2026  
**Primary use in Boasted:** occupation, skill, knowledge, work-activity, technology, and education/training taxonomy for career exploration and skill-language normalization.  
**Database page:** https://www.onetcenter.org/database.html  
**License:** Creative Commons Attribution 4.0 International for the downloadable O*NET database, subject to O*NET's documented exceptions and trademark guidance.

Boasted must not assume that separate O*NET Career Exploration Tools have the same license as the downloadable database.

### NCES Classification of Instructional Programs (CIP) and CIP-SOC Crosswalk

**Publishers:** National Center for Education Statistics (NCES) and U.S. Bureau of Labor Statistics (BLS)  
**Reference:** 2020 CIP to 2018 SOC crosswalk  
**Primary use in Boasted:** connect a postsecondary field of study to occupations the official crosswalk says it can typically prepare a person for.

The relationship is exploration context, not a guarantee. Phrase results as **"occupations related to this program"** or **"directions to explore"**, never "jobs you will get" or a probability of employment.

### BLS Occupational Employment and Wage Statistics (OEWS)

**Publisher:** U.S. Bureau of Labor Statistics  
**Reference release:** May 2025 estimates, released May 15, 2026  
**Primary use in Boasted:** occupation-level employment and wage context by geography/industry.

OEWS values are labor-market estimates, **not a personal salary prediction**. Any UI that surfaces them must show geography and source period.

### College Scorecard

**Publisher:** U.S. Department of Education  
**Primary use in Boasted:** live Program Finder plus institution/field-of-study context such as credentials, school size, costs, completion, debt/repayment, and aggregate post-completion earnings where appropriate.  
**Dataset:** https://collegescorecard.ed.gov/data/  
**Rights basis:** public federal dataset; Data.gov catalog links College Scorecard to CC BY licensing information.  
**Runtime credential:** `COLLEGE_SCORECARD_API_KEY` (server-side only).

Important limitations:

- many Scorecard earnings measures cover Title IV aid recipients and are not necessarily representative of every graduate;
- earnings calculations can exclude people enrolled at the measurement point;
- field-of-study and institution-level aggregates must not be presented as a member's expected personal salary;
- privacy-suppressed values remain suppressed;
- average net price is aggregate context, not a promise of what a specific member will pay;
- Program Finder search is discovery assistance, not a ranking or admissions recommendation.

### Open Scholarships

**Publisher/maintainer:** Grudged LLC / Open Scholarships  
**Primary use in Boasted:** initial scholarship catalog seed with machine-readable records and provenance.  
**Project:** https://github.com/Grudged/open-scholarships  
**Feed:** https://scholarships.grudged.io/scholarships.json  
**Data license:** Creative Commons Attribution 4.0 International (CC BY 4.0).  
**Required attribution:** stored with imported records and displayed in Scholarship Finder.

Boasted validates the feed's license identity, license URL, and exact required-attribution metadata **before any write**. Drift fails closed and requires manual review.

Open Scholarships is Nevada-first with national opportunities mixed in. It is an approved seed source, not permission to scrape unrelated scholarship sites.

### First-party scholarship provider submissions

**Publisher:** individual scholarship provider.  
**Primary use:** allow organizations/individuals who operate a scholarship to submit their own listing for review.  
**Rights basis:** provider attestation granting Boasted permission to store/display the submitted listing after review.

Provider submissions are saved as `pending_review` and are never auto-published. Provider identity, URLs, award/deadline, eligibility, duplication, suspicious fees, and current application cycle must be reviewed before publication.

### USAJOBS Search API

**Publisher:** U.S. Office of Personnel Management (OPM)  
**Primary use in Boasted:** live federal internship and student-trainee discovery.  
**Developer portal:** https://developer.usajobs.gov/  
**Rights basis:** USAJOBS API Terms of Service; public Job Opportunity Announcement data.  
**Runtime credentials:** `USAJOBS_API_KEY` and `USAJOBS_USER_AGENT` (the email used to request the key), server-side only.

Rules:

- keep source fields distinguishable from Boasted-generated annotations;
- link back to the USAJOBS source listing;
- do not expose or share the API key;
- do not persist a competing bulk job database from live responses;
- only label a result as an internship when the returned listing itself contains an explicit intern/student-trainee signal;
- never predict hiring/selection probability.

### Volunteer.gov

**Publisher:** U.S. Department of the Interior and participating federal agencies.  
**Primary use in Boasted:** official external destination for federal volunteer opportunities.  
**Runtime:** link-only.

Boasted links to Volunteer.gov rather than scraping/copying its opportunity catalog without an approved data-use path.

## Sources not active

### CareerOneStop

CareerOneStop was removed from the planned Program/Internship implementation before production activation after review of its full click-license and Web Service Terms. College Scorecard + USAJOBS were selected as the simpler source architecture.

### Apify Scholarship Finder / CollegeScholarships.org scraper

Not approved. Access to a scraper does not establish rights to republish the original CollegeScholarships.org database or authored descriptions.

### Parse.bot Scholarships.com wrapper

Not approved. A third-party wrapper does not itself grant redistribution rights to the underlying Scholarships.com content.

### ScholarshipAPI

Watch list only. Do not activate until U.S. coverage and binding commercial-use terms are verified for Boasted's intended display/storage behavior.

### NSPA Exchange

Future paid/licensed option after a valid data-client agreement is in place and associated membership/license cost is justified.

## Runtime policy

Education Toolkit v2 uses public taxonomy sources as versioned reference/provenance metadata while personal analysis remains deterministic and based on the member's saved Boasted records and Impact Receipts.

Opportunity discovery is a separate live-data layer:

- Scholarship Finder stores records only from an approved open/licensed source or first-party provider submission with publication rights.
- Program Finder queries College Scorecard live; member evidence is used only to create an editable search direction.
- Internship Finder queries USAJOBS live; only final search term/location inputs are sent.
- O*NET, NCES, BLS, and College Scorecard are never proof of a member's accomplishment.
- An external source outage cannot block access to the member's saved evidence.
- Source registries, rights bases, versions, and attribution can be audited independently.

## Permanent audit policy

`docs/EDUCATION_SOURCE_AUDIT.md` is append-only and preserved through Git history.

Live College Scorecard/USAJOBS access also records a data-minimized event in `education_source_audit_events` containing source, operation, timestamp, outcome, HTTP status, result count, and safeguards. The collection is designed with no TTL and no public delete route.

Do **not** log raw member evidence, raw search query/location, API credentials, or full upstream response records.

## Product rules by feature

### My Education / Coursework / Projects / Certifications / Achievements / Group Contributions / Graduation Progress

Public datasets do not decide whether a personal record is true. These features organize the member's own saved details and surface missing documentation such as contribution, outcome, reflection, skills/tags, or proof.

### Experience Translator / Skills from Education

Skill language may be normalized against an auditable taxonomy, but every displayed personal skill signal must point back to saved records. A keyword match is evidence to inspect, not proof of mastery.

### Career Match & Skill Gaps / Career Path Explorer

Use O*NET and CIP-SOC as exploration references. A "gap" means the saved Boasted record does not clearly demonstrate something; it does **not** establish that the member lacks the skill. No fit percentage, aptitude score, employment probability, or "best career" verdict.

### Scholarships

Show source provenance, lifecycle status, and license/rights basis. Fixed past deadlines are soft-expired and excluded from normal search. Rolling/upcoming cycles are not assigned invented deadlines. Never predict chance of winning.

### Programs

Use College Scorecard with member-controlled city/state and career/subject search direction. Aggregate cost/outcomes are context only. Never label a program "best," guaranteed, affordable for the member, or likely to admit the member.

### Internships

Use USAJOBS for federal internship/student-trainee discovery. Only label a returned item as an internship when the listing itself contains the signal. No hiring probability or "best internship" ranking.

### Education Impact Receipts

Public data is not proof of a member's accomplishment. Receipts remain tied to the member's own contribution, result, supporting evidence, and optional confirmation.

### Résumé Builder / Interview Prep / Academic Portfolio

Generated wording must remain traceable to saved evidence, and the member controls corrections and public visibility.

## Attribution and update checklist

When a public dataset is surfaced in product output:

1. show the source name/publisher;
2. show source version/date when available;
3. follow license/API attribution requirements;
4. distinguish source values from Boasted mappings/annotations;
5. preserve source limitations and privacy suppression;
6. never transform aggregate statistics into personal outcome predictions;
7. keep live API credentials server-side;
8. add regression tests for provenance and no-prediction invariants;
9. store an explicit `rights_basis` for ingested catalog records;
10. fail closed when an approved stored source's license metadata materially changes;
11. append material source decisions to `EDUCATION_SOURCE_AUDIT.md`.

## Explicitly out of scope

Boasted does not use this policy to justify:

- copying another career/education product's UI, copy, proprietary rankings, recommendation logic, or private dataset;
- scraping scholarship/job/program pages merely because they are publicly viewable;
- scraping private student essays, admissions decisions, transcripts, learning-management systems, or protected school records;
- training on a member's private education evidence without separate authorization;
- manufacturing activities to optimize an admissions/hiring score;
- ranking students against each other;
- automated admissions, scholarship, graduation, hiring, licensing, or salary decisions.
