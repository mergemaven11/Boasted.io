# Boasted Education Intelligence v1

Education Intelligence is the deterministic evidence-ranking layer underneath the customer-facing **Education** workspace. Education is broader than an application tool: users can build a record of real learning and early-career wins over time, understand what their saved record already shows, and reuse the strongest relevant examples when an opportunity appears.

The authenticated route remains `/app/applications` for compatibility, but the customer-facing product name is **Education**.

Public surfaces:

- Education marketing: `/education`
- Customer Education guide: `/docs/education`
- Authenticated Education workspace: `/app/applications`

## Account eligibility

Boasted no longer uses an Education-specific 18+ gate or age-confirmation checkbox. Account eligibility is governed by the current Terms and applicable law. Registration requires affirmative Terms and Privacy Policy acceptance, and the backend records the applicable versions and server-side acceptance timestamps.

This product change is not a legal conclusion that every youth-facing requirement has been completed. See `ACCOUNT_ELIGIBILITY_AND_EDUCATION.md` for the current product-policy baseline and unresolved legal-review items.

## Product focus

The current Education experience is designed around evidence from:

- college and university learning;
- trade and technical education;
- certifications, licenses, bootcamps, and continuing education;
- coursework, labs, capstones, research, and academic projects;
- scholarships, honors, awards, and meaningful academic milestones;
- internships, service, leadership, organizations, and practical experience;
- group projects where the user's own contribution should be clear;
- career-transition learning and professional development.

There is no dedicated Middle School product mode, route, entry type, or coming-soon banner in the current Education experience.

## Education feature hub

The Education route is a launcher into the rest of Boasted rather than a disconnected data silo.

### Build your education record

- My Education
- Coursework
- Academic Projects
- Certifications & Training
- Academic Achievements
- Group Project Contributions
- Graduation Progress
- Experience Translator

These capture buttons reuse the existing accomplishment evidence model with education-specific presets.

### Turn education into career proof

- Education Impact Receipts
- Skills from Education
- Career Match & Skill Gaps
- Résumé Builder
- Interview Prep
- Academic Portfolio
- Career Path Explorer

These buttons route into existing Boasted tools so the same underlying evidence can be reused instead of copied into a second education-only database.

## Application tools

The current Education Intelligence engine can organize a user's saved material for:

- scholarships;
- selective, enrichment, honors, research, and special programs;
- internships;
- essay-story preparation.

### Scholarship

Looks for evidence of leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.

### Special program

Looks for subject depth, curiosity, initiative, collaboration, growth, and relevant project/research/competition evidence. The customer-facing label is **Programs**.

### Internship

Looks for demonstrated skills, responsibility, results, teamwork, initiative, and evidence that can support an application or résumé. The customer-facing label is **Internships**.

### Essay prep

Surfaces real stories containing reflection, growth, curiosity, challenge, identity/values, and contribution. The user remains the author. Boasted should help the user remember and organize a story, not manufacture one. The customer-facing label is **Essay Stories**.

## Core trust rule

The engine does **not** predict admission, scholarship, hiring, or selection outcomes. It does **not** invent activities, awards, roles, metrics, schools, programs, grades, credentials, projects, dates, or life stories.

Education Intelligence should help a user answer:

> Which real things I already did are useful for this goal?

It should not claim to answer:

> What are my odds of getting in?

or:

> What activity should I manufacture to improve a score?

## Next steps, not admissions optimization

The engine may identify dimensions that the saved record does not clearly show. The UI presents these as **Next steps**.

A gap is a documentation signal, not an instruction to fabricate an activity. If research is absent, for example, the product may remind the user to capture real research already completed or simply note that the dimension is not represented. It must not imply that a specific activity guarantees acceptance or selection.

## Current public reference data

The v1 reference metadata is informed by current public Common App materials for the 2026–2027 application season for product research and future planning.

- Common App first-year preparation materials describe activity details such as years of participation, hours per week, weeks per year, position/leadership, and a brief activity description.
- Academic honors are tracked separately from activities.
- Common App publishes first-year essay prompts by season. Boasted stores only a compact theme map (identity, challenge, belief, gratitude, growth, curiosity, open topic), not copies of application essays or student submissions.

References:

- https://www.commonapp.org/apply/first-year-students/
- https://www.commonapp.org/apply/fy-toolkit/
- https://www.commonapp.org/apply/essay-prompts/

Requirements vary by college, scholarship, internship, and special program. Reference metadata must never become a hard eligibility rule unless a specific official program requirement is provided and versioned.

## Verification rules

Every Education Intelligence response must reconcile to the user's saved records:

- recommended entry IDs must exist in the user's accomplishment set;
- recommendation count cannot exceed the available accomplishments or the eight-item workspace limit;
- only known fit-strength labels are allowed;
- `acceptance_prediction`, `scholarship_prediction`, and `employment_decision` remain false;
- recommendation telemetry stores operational verification metadata, not raw private accomplishment content.

## Privacy and evidence rules

- Education records are private unless the user explicitly makes an accomplishment public.
- Users should not be encouraged to store protected student records, school-system credentials, secrets, or information they are not permitted to retain.
- Confirmation should come only from someone who genuinely has enough context to confirm the specific accomplishment or contribution.
- Education Intelligence must not turn a lack of third-party confirmation into a negative score.
- Generated education or career wording must remain grounded in saved evidence and must not invent grades, credentials, dates, projects, achievements, or metrics.

## Future strategy

Prefer small, versioned, auditable reference profiles over large scraped datasets. Useful future additions include:

- program-specific requirement templates supplied from official sources;
- scholarship rubric templates when the sponsor publishes them;
- internship competency maps derived from a specific posting the user provides;
- annual Common App reference updates;
- structured activity-duration and academic-year fields that improve reuse without changing historical evidence.

Do not scrape or train on private student essays, admissions decisions, or application records by default.
