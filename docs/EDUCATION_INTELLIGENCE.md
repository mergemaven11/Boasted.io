# Boasted Education Intelligence v2

Education Intelligence is the deterministic, evidence-backed layer underneath the customer-facing **Education** workspace. In v2, Education is no longer just a launcher into unrelated pages: each feature card opens a dedicated working view built from the member's saved education evidence, with the canonical Boasted workflow available as the next action when appropriate.

The authenticated route remains `/app/applications` for compatibility, but the customer-facing product name is **Education**.

Public surfaces:

- Education marketing: `/education`
- Customer Education guide: `/docs/education`
- Authenticated Education workspace: `/app/applications`

## Core architecture

Education v2 has three cooperating engines/surfaces:

1. **Education Toolkit v2** — dedicated tools for the feature cards shown in the Education hub.
2. **Major Explorer** — evidence-alignment exploration for possible majors, with its own strict no-prediction safeguards.
3. **Application Intelligence** — evidence shortlisting for Scholarships, Programs, Internships, and Essay Stories.

All three use the same underlying member-owned accomplishment and Impact Receipt records. Education does not create a second hidden student database.

## Account eligibility

Boasted does not use an Education-specific 18+ gate or age-confirmation checkbox. Account eligibility is governed by the current Terms and applicable law. Registration requires affirmative Terms and Privacy Policy acceptance, and the backend records the applicable versions and server-side acceptance timestamps.

This product behavior is not a legal conclusion that every youth-facing requirement has been completed. See `ACCOUNT_ELIGIBILITY_AND_EDUCATION.md` for the current product-policy baseline and unresolved legal-review items.

## Education Toolkit v2

### Build your education record

These cards now open a dedicated analysis/capture view before sending the member to the canonical accomplishment editor:

- **My Education** — reviews education/program milestones and prompts for the school/program context, what was completed or learned, and useful dates/scope/proof.
- **Coursework** — prioritizes saved course/lab/assignment evidence and asks what the member personally created, analyzed, solved, presented, or learned.
- **Academic Projects** — highlights capstones, research, labs, presentations, builds, and projects, including contribution boundaries and artifact/proof readiness.
- **Certifications & Training** — organizes credentials and training while prompting for issuer, date/renewal context, and what knowledge or hands-on skill was actually demonstrated.
- **Academic Achievements** — captures awards, honors, scholarships, competitions, and recognition with emphasis on what the member did to earn the result.
- **Group Project Contributions** — separates the team deliverable from the member's personal ownership, decisions, research, build work, organization, or presentation.
- **Graduation Progress** — records meaningful requirements, practicums, capstones, and milestones without predicting graduation.
- **Experience Translator** — translates real class, research, club, service, training, and project work into transferable career language without inventing a job title or responsibility.

### Turn education into career proof

- **Major Explorer** — remains its own evidence-backed tool and deliberately avoids a fake "best major" score.
- **Education Impact Receipts** — identifies which education records are already supported and which would benefit from safe evidence, measurable scope, or legitimate confirmation.
- **Skills from Education** — extracts skill signals only when saved education records contain supporting evidence and returns the IDs/titles of the supporting records.
- **Career Match & Skill Gaps** — connects demonstrated skill signals to broad work directions and treats gaps as documentation gaps, never proof that a member lacks a skill.
- **Résumé Builder** — identifies education records best prepared for résumé reuse, then opens the canonical Résumé Builder for reconstruction/editing/export.
- **Interview Prep** — surfaces records with the context/action/result/learning detail needed for truthful interview stories, then opens the canonical practice experience.
- **Academic Portfolio** — shows portfolio-ready education records and their current public/private state without changing visibility automatically.
- **Career Path Explorer** — presents broad directions supported by demonstrated skill signals, with official public-data provenance and no fit percentage, aptitude claim, or employment prediction.

## Toolkit API

Authenticated endpoint:

`GET /career-intelligence/education-toolkit/{tool_id}`

Supported `tool_id` values:

- `education-profile`
- `coursework`
- `academic-projects`
- `certifications`
- `academic-achievements`
- `group-projects`
- `graduation-progress`
- `experience-translator`
- `impact-receipts`
- `education-skills`
- `career-match`
- `resume-builder`
- `interview-prep`
- `academic-portfolio`
- `career-paths`

Major Explorer intentionally remains at `GET /career-intelligence/major-explorer` because it has a separate recommendation schema and verification gate.

## Toolkit response contract

A verified Education Toolkit response contains:

- `tool` — tool ID, title, mode, smart prompts, and next actions;
- `summary` — bounded counts derived from the member's records;
- `recommended_evidence` — at most eight member-owned education records, each with support/missing-detail flags;
- `gaps` — documentation-strengthening prompts, not student deficits;
- `skill_signals` — demonstrated skills with supporting entry IDs when the selected tool needs them;
- `career_directions` — broad evidence-connected directions for career tools only;
- `sources` — official public reference/provenance metadata;
- `methodology` — version and non-prediction invariants;
- `intelligence_runtime` — shared verification-runtime metadata added only after the response passes reconciliation checks.

## Verification rules

Education Toolkit v2 fails closed when its output does not reconcile to saved proof. The verifier requires that:

- every recommended `entry_id` belongs to the authenticated member's loaded records;
- every skill signal points only to known member entries;
- recommendation counts stay within the eight-record workspace limit and the available record count;
- support levels come only from the known `saved-record`, `supported`, and `well-supported` vocabulary;
- the methodology version and evidence mode are exact and auditable;
- `fit_percentage`, `best_major_claim`, `best_career_claim`, `admissions_prediction`, `scholarship_prediction`, `graduation_prediction`, `employment_prediction`, `salary_prediction`, and `employment_decision` all remain false.

If those invariants fail, the shared intelligence runtime records privacy-safe verification metadata and withholds the result instead of displaying questionable guidance.

## Skill-signal semantics

Education Toolkit v2 uses a small, auditable internal alias taxonomy to find skills demonstrated in the member's saved text/tags. Examples include research, data analysis, programming, communication, collaboration, leadership, project management, design, teaching/mentoring, service/support, technical problem solving, and documentation.

A skill signal means:

> One or more saved education records contain evidence that is relevant to this skill label.

It does **not** mean:

- the member has mastered the skill;
- the member holds a professional credential;
- the member is qualified for every job that mentions the skill;
- an employer would rate the member at a particular level.

The UI therefore shows the supporting records and uses `emerging`/`supported` evidence language rather than a personal proficiency percentage.

## Career-direction semantics

Career directions are broad internal exploration groupings such as Technology & data, Research & engineering, Business & operations, Education & community impact, Health & human services, and Communication & design.

They appear only when at least one demonstrated skill signal overlaps the grouping. Ordering is based on the count of distinct demonstrated skill signals, not on a hidden aptitude score.

Every career direction is labeled as an exploration aid. It is not a "best career" verdict, employment probability, salary estimate, licensing conclusion, or professional advice.

## Official public reference sources

Education v2 maintains an explicit source registry rather than quietly scraping third-party sites. Current approved source families are:

- **O*NET 31.0 Database** — occupation/skill/knowledge/work-activity and education/training taxonomy; the downloadable database is CC BY 4.0 with O*NET's stated attribution/trademark requirements.
- **NCES 2020 CIP-SOC Crosswalk** — official relationship between instructional programs and occupations for education/career exploration.
- **BLS OEWS May 2025** — occupation-level employment and wage estimates for labor-market context, never personal salary prediction.
- **U.S. Department of Education College Scorecard** — optional institution/field-of-study aggregate context with required cohort/representation caveats.
- **CareerOneStop Web API** — optional future live enrichment for skills gaps, occupations, training, salaries, and tools/technology; token required.

See `EDUCATION_DATA_SOURCES.md` for source URLs, licensing notes, limitations, attribution rules, and runtime policy.

The v2 runtime does **not** require a live call to any of these public sources in order to analyze the member's private evidence. This keeps the Education workspace available during external outages and makes personal recommendations reproducible/auditable.

## Application tools

Application Intelligence continues to organize saved material for:

- scholarships;
- selective, enrichment, honors, research, and special programs;
- internships;
- essay-story preparation.

### Scholarship

Looks for evidence of leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.

### Programs

Looks for subject depth, curiosity, initiative, collaboration, growth, and relevant project/research/competition evidence.

### Internships

Looks for demonstrated skills, responsibility, results, teamwork, initiative, and evidence that can support an application or résumé.

### Essay Stories

Surfaces real stories containing reflection, growth, curiosity, challenge, identity/values, and contribution. The member remains the author. Boasted helps the member remember and organize a story; it does not manufacture one.

## Major Explorer

Major Explorer remains deliberately non-predictive. It can rank evidence-aligned majors for **exploration only** and must always expose what it does not know plus concrete low-risk next experiments. It cannot expose fit percentages, admissions odds, a "best major" claim, graduation predictions, salary predictions, or career-success predictions.

See `MAJOR_EXPLORER.md` for its separate methodology and safeguards.

## Privacy and evidence rules

- Education records are private unless the member explicitly makes an accomplishment public.
- Academic Portfolio analysis may report visibility state but never changes it.
- Users should not be encouraged to store protected student records, school-system credentials, secrets, or information they are not permitted to retain.
- Confirmation should come only from someone who genuinely has enough context to confirm the specific accomplishment or contribution.
- A lack of third-party confirmation is not a negative student score.
- Generated education/career wording must remain grounded in saved evidence and must not invent grades, credentials, dates, projects, achievements, responsibilities, or metrics.
- Public datasets are context, not proof of a member's personal history.

## Future adapters

Preferred future additions are server-side, source-versioned adapters rather than browser scraping:

- O*NET occupation detail and task/skill enrichment;
- CareerOneStop role-to-role skills gaps and training options when a server-side token is configured;
- BLS OEWS geography-aware wage/employment context with source period shown;
- College Scorecard institution/program context with cohort limitations surfaced alongside the data;
- annual/versioned CIP-SOC and Common App reference updates;
- user-provided job postings mapped against demonstrated evidence rather than generic hiring predictions.

Any live adapter must degrade safely when unavailable and must never be allowed to overwrite the member's saved proof.
