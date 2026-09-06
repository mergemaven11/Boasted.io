# Boasted Education public-data sources

This document defines the public sources Boasted may use to make **Education** more useful without copying a competitor, scraping private student data, or turning aggregate statistics into personal predictions.

The governing rule is simple:

> **The member's personal evidence comes from the member. Public datasets provide taxonomy, context, and exploration references.**

No source below is permission to invent a degree, course, grade, award, skill, project, credential, job result, salary, acceptance probability, graduation probability, or career outcome for a member.

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

### CareerOneStop Web API

**Publisher:** U.S. Department of Labor  
**Primary use in Boasted:** optional live enrichment for occupation reports, skills gaps between occupations, skills matching, salaries, training, professional associations, and tools/technology.  
**API Explorer:** https://api.careeronestop.org/api-explorer/

CareerOneStop's Web API uses REST and requires an API token. The current Education toolkit treats it as an **optional adapter**, not a required dependency. Boasted must continue to work when no CareerOneStop token is configured.

No API token is stored in the browser or committed to the repository.

## Runtime policy

Education Toolkit v2 currently uses public sources as **versioned reference/provenance metadata** while its personal analysis remains deterministic and based on the member's saved Boasted records and Impact Receipts.

This means:

- no network call to O*NET, NCES, BLS, College Scorecard, or CareerOneStop is required to open an Education tool;
- a source outage cannot block access to a member's own saved evidence;
- the source registry can be audited and versioned independently;
- future live adapters can be added behind clear attribution, caching, source dates, and failure handling.

## Product rules by feature

### My Education / Coursework / Projects / Certifications / Achievements / Group Contributions / Graduation Progress

Public datasets do not decide whether a personal record is true. These features organize the member's own saved details and surface missing documentation such as contribution, outcome, reflection, skills/tags, or proof.

### Experience Translator / Skills from Education

Skill language may be normalized against an auditable taxonomy, but every displayed personal skill signal must point back to one or more saved records. A keyword match is evidence to inspect, not proof of mastery.

### Career Match & Skill Gaps / Career Path Explorer

Use O*NET and CIP-SOC as exploration references. A "gap" means the saved Boasted record does not clearly demonstrate something; it does **not** establish that the member lacks the skill. No fit percentage, aptitude score, employment probability, or "best career" verdict is allowed.

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
8. add regression tests for provenance, bounds, and no-prediction invariants.

## Explicitly out of scope

Boasted does not use this source policy to justify:

- copying another career or education product's UI, copy, proprietary rankings, recommendation logic, or private dataset;
- scraping private student essays, admissions decisions, transcripts, learning-management systems, or protected school records by default;
- training on a member's private education evidence without separate product/legal authorization;
- manufacturing activities to optimize an admissions or hiring score;
- ranking students against each other;
- automated admissions, scholarship, graduation, hiring, licensing, or salary decisions.
