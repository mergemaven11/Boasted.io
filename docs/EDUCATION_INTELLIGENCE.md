# BragStack Education Intelligence v1

Education Intelligence is the deterministic evidence-ranking layer underneath the student-facing **Education** workspace. The product is intentionally broader than an application tool: students can build a record of real wins over time, understand what their saved record already shows, and later reuse the strongest relevant examples when an opportunity appears.

The current authenticated route remains `/app/applications` for compatibility, but the customer-facing product name is **Education**.

Public surfaces:

- Education marketing: `/education`
- Customer Education guide: `/docs/education`
- Authenticated Education workspace: `/app/applications`

## Product goal

Help a student capture meaningful accomplishments while they happen, from school through university and into early career, instead of reconstructing years of growth from memory later.

The student experience should speak in terms such as:

- your wins
- your journey
- what you are learning
- what you are getting better at
- stories worth remembering
- next steps
- goals you want to pursue

Avoid turning the interface into admissions-office, HR, or counselor language when a clearer student-facing phrase exists.

The current Education Intelligence engine can organize a student's own saved material for:

- scholarships
- selective, enrichment, honors, research, and special programs
- internships
- essay-story preparation

Future Education work can expand the workspace into longer-term journey, growth-map, activity/milestone, brag-sheet, year-in-review, and opportunity-tracking experiences without changing the core evidence-integrity rules.

## Student journey

Education is intended to preserve continuity across stages:

`Middle School → High School → College / University → Career`

The purpose is not to score a student at each stage. It is to keep the student's own record useful as the kinds of opportunities and goals change.

Examples of useful student wins include:

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

Education Intelligence should help a student answer:

> Which real things I already did are useful for this goal?

It should not claim to answer:

> What are my odds of getting in?

or:

> What activity should I manufacture to improve a score?

## Application profiles

### Scholarship

Looks for evidence of leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.

Customer-facing language should frame results as wins that may be useful for the student's goal, not as scholarship likelihood.

### Special program

Looks for subject depth, curiosity, initiative, collaboration, growth, and relevant project/research/competition evidence.

The customer-facing label is currently **Programs**.

### Internship

Looks for demonstrated skills, responsibility, results, teamwork, initiative, and evidence that can support an application resume.

The customer-facing label is currently **Internships**.

### Essay prep

Surfaces real stories that contain reflection, growth, curiosity, challenge, identity/values, and contribution. The student remains the author. BragStack should help the student remember and organize a story, not manufacture one.

The customer-facing label is currently **Essay Stories**.

## Next steps, not admissions optimization

The engine may identify dimensions that the saved record does not clearly show. The UI presents these as **Next steps**.

A gap is a documentation signal, not an instruction to fabricate or strategically manufacture an activity. For example, if research is absent, the product may remind a student to capture real research they already completed or to remember that this dimension is not represented. It must not imply that a specific activity guarantees acceptance or selection.

## Current public reference data

The v1 reference metadata is informed by current public Common App materials for the 2026–2027 application season.

- Common App's first-year preparation materials describe activity details such as years of participation, hours per week, weeks per year, position/leadership, and a brief activity description.
- Academic honors are tracked separately from activities.
- Common App publishes the current first-year essay prompts by season. BragStack stores only a compact theme map (identity, challenge, belief, gratitude, growth, curiosity, open topic), not copies of application essays or student submissions.

References:

- https://www.commonapp.org/apply/first-year-students/
- https://www.commonapp.org/apply/fy-toolkit/
- https://www.commonapp.org/apply/essay-prompts/

Requirements vary by college, scholarship, internship, and special program. Reference metadata must never become a hard eligibility rule unless a specific official program requirement is provided and versioned.

## Age and account-positioning note

Education may describe experiences beginning in middle school, but product marketing and documentation must not imply that every middle-school student is independently eligible to create an account. Account eligibility remains governed by BragStack Terms and applicable age requirements.

Until BragStack ships and documents a guardian-managed child-account experience, public Education copy should remain accurate about that limitation rather than implying unsupported guardian functionality.

## Verification rules

Every Education Intelligence response must reconcile to the user's saved records:

- recommended entry IDs must exist in the user's accomplishment set
- recommendation count cannot exceed the available accomplishments or the eight-item workspace limit
- only known fit-strength labels are allowed
- `acceptance_prediction`, `scholarship_prediction`, and `employment_decision` remain false
- recommendation telemetry stores operational verification metadata, not raw private accomplishment content

## Privacy and confirmation rules

- Student records are private unless the user explicitly makes an accomplishment public.
- Students should not be encouraged to store protected school credentials, secrets, or records they are not permitted to retain.
- Confirmation should come only from someone who genuinely has enough context to confirm the specific accomplishment or contribution.
- Education Intelligence must not turn a lack of third-party confirmation into a negative student score.

## Future seed strategy

Prefer small, versioned, auditable reference profiles over large scraped datasets. Useful future additions include:

- program-specific requirement templates supplied from official sources
- scholarship rubric templates when the sponsor publishes them
- internship competency maps derived from a specific posting the user provides
- annual Common App reference updates
- structured activity-duration and academic-year fields that improve reuse without changing historical evidence

Do not scrape or train on private student essays, admissions decisions, or application records by default.
