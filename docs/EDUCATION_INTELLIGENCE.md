# BragStack Education Intelligence v1

Education Intelligence is the deterministic evidence-ranking layer underneath the customer-facing **Education** workspace. The product is intentionally broader than an application tool: adults can build a record of real education and career wins over time, understand what their saved record already shows, and later reuse the strongest relevant examples when an opportunity appears.

The current authenticated route remains `/app/applications` for compatibility, but the customer-facing product name is **Education**.

Public surfaces:

- Education marketing: `/education`
- Customer Education guide: `/docs/education`
- Authenticated Education workspace: `/app/applications`

## Interim age/access rule — September 2026

**BragStack accounts are currently limited to people age 18 or older.** This is an interim product and compliance boundary while BragStack completes legal review for youth/student accounts.

- Do not market, invite, onboard, or knowingly create BragStack accounts for people under 18.
- Adults may document current or prior education, including high-school history, college/university, certifications, internships, research, programs, projects, work, and professional development.
- **Middle School student accounts remain on the roadmap but are disabled and labeled “Coming soon.”** Keep the product direction visible, but do not enable it for minors until youth privacy, parental-consent, data-retention, safety, school-data, and applicable state/federal requirements have been reviewed with counsel and implemented.
- If an under-18 person contacts BragStack, do not ask them to submit educational records or other personal information through the product. Direct them to wait for the future student-account release.
- Existing internal/test fixtures that reference Middle School are not authorization to open the feature to minors.

This interim boundary is intentionally conservative. It is risk-reduction documentation, not a legal opinion, legal certification, or substitute for counsel.

## Product goal

Help an adult user capture meaningful education and early-career accomplishments while they happen, or reconstruct appropriate past accomplishments, instead of rebuilding years of growth from memory later.

The Education experience should speak in terms such as:

- your wins
- your journey
- what you are learning
- what you are getting better at
- stories worth remembering
- next steps
- goals you want to pursue

Avoid turning the interface into admissions-office, HR, or counselor language when a clearer user-facing phrase exists.

The current Education Intelligence engine can organize a user's own saved material for:

- scholarships or continuing-education opportunities appropriate to the adult user
- selective, enrichment, honors, research, and special programs
- internships
- essay-story preparation

Future Education work can expand the workspace into longer-term journey, growth-map, activity/milestone, brag-sheet, year-in-review, and opportunity-tracking experiences without changing the core evidence-integrity rules.

## Long-term education journey

The product vision is continuity across stages:

`Middle School student accounts — Coming soon → High School history → College / University → Career`

The live product is 18+ today. The journey above describes the roadmap and continuity model, not current eligibility for minors.

The purpose is not to score a person at each stage. It is to keep the user's own record useful as opportunities and goals change.

Examples of useful education wins include:

- academic achievements and strong class projects
- awards, honors, and competitions
- leadership and mentoring
- clubs and extracurricular activities
- community service
- research and STEM work
- arts and performance
- athletics
- internships and first jobs
- special programs
- certifications and courses
- meaningful growth, persistence, and lessons learned

## Core trust rule

The engine does **not** predict admission, scholarship, hiring, or selection outcomes. It does **not** invent activities, awards, roles, metrics, schools, programs, grades, credentials, or life stories.

Education Intelligence should help a user answer:

> Which real things I already did are useful for this goal?

It should not claim to answer:

> What are my odds of getting in?

or:

> What activity should I manufacture to improve a score?

## Application profiles

### Scholarship

Looks for evidence of leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.

Customer-facing language should frame results as wins that may be useful for the user's goal, not as scholarship likelihood.

### Special program

Looks for subject depth, curiosity, initiative, collaboration, growth, and relevant project/research/competition evidence.

The customer-facing label is currently **Programs**.

### Internship

Looks for demonstrated skills, responsibility, results, teamwork, initiative, and evidence that can support an application resume.

The customer-facing label is currently **Internships**.

### Essay prep

Surfaces real stories that contain reflection, growth, curiosity, challenge, identity/values, and contribution. The user remains the author. BragStack should help the user remember and organize a story, not manufacture one.

The customer-facing label is currently **Essay Stories**.

## Next steps, not admissions optimization

The engine may identify dimensions that the saved record does not clearly show. The UI presents these as **Next steps**.

A gap is a documentation signal, not an instruction to fabricate or strategically manufacture an activity. For example, if research is absent, the product may remind the user to capture real research they already completed or to remember that this dimension is not represented. It must not imply that a specific activity guarantees acceptance or selection.

## Current public reference data

The v1 reference metadata is informed by current public Common App materials for the 2026–2027 application season for product research and future planning. **Those references do not mean BragStack currently permits accounts for minors.**

- Common App's first-year preparation materials describe activity details such as years of participation, hours per week, weeks per year, position/leadership, and a brief activity description.
- Academic honors are tracked separately from activities.
- Common App publishes the current first-year essay prompts by season. BragStack stores only a compact theme map (identity, challenge, belief, gratitude, growth, curiosity, open topic), not copies of application essays or student submissions.

References:

- https://www.commonapp.org/apply/first-year-students/
- https://www.commonapp.org/apply/fy-toolkit/
- https://www.commonapp.org/apply/essay-prompts/

Requirements vary by college, scholarship, internship, and special program. Reference metadata must never become a hard eligibility rule unless a specific official program requirement is provided and versioned.

## Verification rules

Every Education Intelligence response must reconcile to the user's saved records:

- recommended entry IDs must exist in the user's accomplishment set
- recommendation count cannot exceed the available accomplishments or the eight-item workspace limit
- only known fit-strength labels are allowed
- `acceptance_prediction`, `scholarship_prediction`, and `employment_decision` remain false
- recommendation telemetry stores operational verification metadata, not raw private accomplishment content

## Privacy and confirmation rules

- Education records are private unless the user explicitly makes an accomplishment public.
- Users should not be encouraged to store protected school credentials, secrets, or records they are not permitted to retain.
- Confirmation should come only from someone who genuinely has enough context to confirm the specific accomplishment or contribution.
- Education Intelligence must not turn a lack of third-party confirmation into a negative score.
- Do not collect youth data merely because Middle School remains visible as a roadmap item.

## Future student-account release gate

Do not enable Middle School or other under-18 account creation until a release review has explicitly covered at least:

1. age-screening and age-assurance design;
2. parental/guardian notice and consent requirements where applicable;
3. parent/guardian access, correction, deletion, and revocation workflows where applicable;
4. youth privacy and data-minimization requirements;
5. retention/deletion rules for youth data;
6. school/student-record handling and whether FERPA, COPPA, state student-privacy laws, school contracts, or other requirements apply to the intended model;
7. AI/safety requirements for youth-facing conversational features;
8. marketing, analytics, cookie, and tracking restrictions for minors;
9. verifier/contact-data collection involving students;
10. vendor/subprocessor agreements for youth data;
11. Terms, Privacy Policy, customer support, incident response, and accessibility appropriate to the youth feature;
12. attorney approval for the intended launch jurisdictions.

## Future seed strategy

Prefer small, versioned, auditable reference profiles over large scraped datasets. Useful future additions include:

- program-specific requirement templates supplied from official sources
- scholarship rubric templates when the sponsor publishes them
- internship competency maps derived from a specific posting the user provides
- annual Common App reference updates
- structured activity-duration and academic-year fields that improve reuse without changing historical evidence

Do not scrape or train on private student essays, admissions decisions, or application records by default.
