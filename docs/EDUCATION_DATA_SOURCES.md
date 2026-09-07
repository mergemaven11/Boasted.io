# Boasted Education public-data sources

This document defines the public sources Boasted may use to make **Education** more useful without copying a competitor, scraping private student data, or turning aggregate statistics into personal predictions.

The governing rule is simple:

> **The member's personal evidence comes from the member. Public datasets provide taxonomy, context, and opportunity discovery.**

No source below is permission to invent a degree, course, grade, award, skill, project, credential, job result, salary, acceptance probability, graduation probability, or career outcome for a member.

For scholarship/program/internship implementation details, see `docs/EDUCATION_OPPORTUNITY_DISCOVERY.md`.

## Source registry

### O*NET 31.0 Database

**Publisher:** U.S. Department of Labor, Employment and Training Administration (USDOL/ETA)  
**Current production release used for reference:** O*NET 31.0, August 2026  
**Primary use in Boasted:** occupation, skill, knowledge, work-activity, technology, and education/training taxonomy for career exploration and skill-language normalization.  
**Database page:** https://www.onetcenter.org/database.html  
**Release archive:** https://www.onetcenter.org/db_releases.html  
**License:** Creative Commons Attribution 4.0 International for the downloadable O*NET database, subject to the exceptions described by O*NET.  
**License page:** https://www.onetcenter.org/license_db.html

Required attribution when O*NET database content is displayed or adapted must identify the **O*NET 31.0 Database**, USDOL/ETA, the CC BY 4.0 license, and indicate modifications where applicable. O*NET's trademark guidance must also be followed.

Boasted must not assume that the separate O*NET Career Exploration Tools have the same license as the downloadable database. The O*NET license page explicitly treats those tools separately.

### NCES Classification of Instructional Programs (CIP) and CIP-SOC Crosswalk

**Publishers:** National Center for Education Statistics (NCES) and U.S. Bureau of Labor Statistics (BLS)  
**Reference:** 2020 CIP to 2018 SOC crosswalk  
**Primary use in Boasted:** connect a postsecondary field of study to occupations that the official crosswalk says the program can typically prepare a person for.  
**Crosswalk page:** https://nces.ed.gov/ipeds/cipcode/post3.aspx?y=56  
**Guidelines:** https://nces.ed.gov/ipeds/cipcode/Files/IES2020_CIP_SOC_Crosswalk_508C.pdf

The crosswalk is useful for broad education/career exploration, but the relationship is not an empirical guarantee that a graduate will enter a listed occupation. A CIP can map to multiple SOC occupations and an occupation can be reachable through multiple programs.

Boasted should phrase this as **"occupations related to this program"** or **"directions to explore"**, never "jobs you will get" or "your probability of getting this job."

### BLS Occupational Employment and Wage Statistics (OEWS)

**Publisher:** U.S. Bureau of Labor Statistics  
**Current reference release:** May 2025 estimates, released May 15, 2026  
**Primary use in Boasted:** occupation-level employment and wage context at national, state, metropolitan, nonmetropolitan, or industry level.  
**Tables:** https://www.bls.gov/oes/tables.htm  
**Release:** https://www.bls.gov/news.release/ocwage.htm

The May 2025 OEWS program provides estimates for roughly 830 occupations across the nation, states, and hundreds of areas. These values are labor-market estimates, **not a personal salary prediction**. Any Boasted UI that displays OEWS values must show the geography and data period.

### College Scorecard

**Publisher:** U.S. Department of Education  
**Primary use in Boasted:** optional institution and field-of-study context such as credentials conferred, completion, debt/repayment, and aggregate post-completion earnings.  
**Dataset catalog:** https://catalog.data.gov/dataset/college-scorecard  
**Technical documentation:** https://collegescorecard.ed.gov/files/InstitutionDataDocumentation.pdf

The Data.gov catalog marks the College Scorecard dataset as public and links a CC-BY license. The data must be presented with the Department of Education's documented cohort limitations.

Important limitations include:

- many Scorecard earnings measures cover undergraduate students who received Title IV federal aid, so they are not necessarily representative of every graduate;
- earnings calculations can exclude people who are enrolled at the measurement point;
- field-of-study and institution-level aggregates must not be presented as a member's expected personal salary;
- privacy-suppressed values stay suppressed.

### Open Scholarships

**Publisher/maintainer:** Grudged LLC / Open Scholarships  
**Primary use in Boasted:** initial scholarship search seed with machine-readable scholarship records and source provenance.  
**Project:** https://github.com/Grudged/open-scholarships  
**Feed:** https://scholarships.grudged.io/scholarships.json  
**Data license:** Creative Commons Attribution 4.0 International (CC BY 4.0).  
**Required attribution:** stored with imported records and displayed in the Scholarship Finder.

Boasted validates the feed's license metadata **before any write**. If the upstream license identity, license URL, or required-attribution field changes/disappears, the importer fails closed and requires manual review.

Open Scholarships is currently Nevada-first with national opportunities mixed in. It is an approved seed source, not permission to scrape unrelated scholarship sites. Boasted prefers a smaller catalog with a documented storage/display right over a larger unlicensed catalog.

### First-party scholarship provider submissions

**Publisher:** individual scholarship provider.  
**Primary use in Boasted:** allow organizations or individuals who operate a scholarship to submit their own listing for review.  
**Rights basis:** provider attestation granting Boasted permission to store/display the submitted listing after review.

Provider submissions are saved as `pending_review` and are never auto-published. Provider identity, URLs, award/deadline, eligibility, duplication, suspicious fees, and the current application cycle must be reviewed before publication.

### CareerOneStop Web API

**Publisher:** U.S. Department of Labor  
**Primary use in Boasted:** live local program/training discovery, Youth Program Finder results, and internship/job discovery, with additional occupation/skills context available for future enrichment.  
**Web API:** https://www.careeronestop.org/Developers/WebAPI/web-api.aspx  
**API Explorer:** https://api.careeronestop.org/api-explorer/  
**Rights basis:** CareerOneStop's API documentation identifies API datasets as open data under USDOL's Open Data Policy and expressly supports publishing career, employment, and education data through third-party sites.

CareerOneStop uses REST and requires a registered API user ID and token. Production configuration is server-side only:

```text
CAREERONESTOP_USER_ID=<registered API user id>
CAREERONESTOP_API_TOKEN=<server-side token>
```

The browser never receives this token. The Education evidence toolkit still works when the token is absent; only live opportunity discovery is unavailable until the server is configured.

### Volunteer.gov

**Publisher:** U.S. Department of the Interior and participating federal agencies.  
**Primary use in Boasted:** official external destination for federal volunteer opportunities.  
**Portal:** https://www.volunteer.gov/  
**Runtime:** link-only.

The current implementation did not identify an approved public opportunity API/data-use path for ingesting Volunteer.gov listings, so Boasted links to the official service rather than scraping or copying its opportunity catalog.

## Runtime policy

Education Toolkit v2 uses public taxonomy sources as **versioned reference/provenance metadata** while its personal analysis remains deterministic and based on the member's saved Boasted records and Impact Receipts.

Opportunity discovery is a separate live-data layer:

- Scholarship Finder may store records only from an approved open/licensed source or a first-party provider submission with publication rights.
- Program Finder and Internship Finder send only the final search term/location needed for the public CareerOneStop query; they do not send private accomplishments or Impact Receipts to CareerOneStop.
- O*NET, NCES, BLS, and College Scorecard are not required to open the member's own Education evidence tools.
- A source outage cannot block access to a member's saved evidence.
- Source registries, rights bases, versions, and attribution can be audited independently.

## Product rules by feature

### My Education / Coursework / Projects / Certifications / Achievements / Group Contributions / Graduation Progress

Public datasets do not decide whether a personal record is true. These features organize the member's own saved details and surface missing documentation such as contribution, outcome, reflection, skills/tags, or proof.

### Experience Translator / Skills from Education

Skill language may be normalized against an auditable taxonomy, but every displayed personal skill signal must point back to one or more saved records. A keyword match is evidence to inspect, not proof of mastery.

### Career Match & Skill Gaps / Career Path Explorer

Use O*NET and CIP-SOC as exploration references. A "gap" means the saved Boasted record does not clearly demonstrate something; it does **not** establish that the member lacks the skill. No fit percentage, aptitude score, employment probability, or "best career" verdict is allowed.

### Scholarships

Scholarship search must show source provenance, current lifecycle status, and license/rights basis. Fixed past deadlines are soft-expired and excluded from normal search. Rolling/upcoming cycles are not assigned an invented deadline. Scholarship search never predicts the member's chance of winning.

### Programs

CareerOneStop training and youth-program data may be searched by member-controlled location and a career/skill phrase suggested from saved evidence. Training price is not inferred. A WIOA/Eligible Training Provider signal may be displayed as **funding may be available**, not as "free" unless the source actually describes the service that way.

### Internships

CareerOneStop Job Search may be queried using a member-controlled career/skill direction plus an internship term. Boasted only labels a returned item an internship when the returned title/snippet itself contains an explicit intern/internship signal. No hiring probability or "best internship" ranking is allowed.

### Education Impact Receipts

Public data is not proof of a member's accomplishment. Receipts remain tied to the member's own contribution, result, supporting evidence, and optional confirmation.

### Résumé Builder / Interview Prep / Academic Portfolio

The Education toolkit may prioritize strong saved examples and pass the member into the canonical Boasted workflow. Generated wording must remain traceable to saved evidence, and the member controls corrections and public visibility.

## Attribution and update checklist

When a public dataset is actually surfaced in product output rather than merely listed as a source:

1. show the source name and publisher;
2. show the source version/date when available;
3. follow the source's license and attribution requirements;
4. indicate when Boasted has modified or mapped source information;
5. preserve source limitations and privacy suppression;
6. never transform aggregate statistics into personal outcome predictions;
7. keep live API credentials server-side;
8. add regression tests for provenance, bounds, and no-prediction invariants;
9. store an explicit `rights_basis` for ingested catalog records;
10. fail closed when an upstream source's approved license/rights metadata changes.

## Explicitly out of scope

Boasted does not use this source policy to justify:

- copying another career or education product's UI, copy, proprietary rankings, recommendation logic, or private dataset;
- scraping scholarship/job/program pages merely because they are publicly viewable;
- scraping private student essays, admissions decisions, transcripts, learning-management systems, or protected school records by default;
- training on a member's private education evidence without separate product/legal authorization;
- manufacturing activities to optimize an admissions or hiring score;
- ranking students against each other;
- automated admissions, scholarship, graduation, hiring, licensing, or salary decisions.
