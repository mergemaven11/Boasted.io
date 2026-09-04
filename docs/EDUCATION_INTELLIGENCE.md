# BragStack Education Intelligence v1

Education Intelligence is a deterministic evidence-ranking layer for education and early-career application workflows. It reuses the same user-owned accomplishment and Impact Receipt records as the rest of BragStack.

## Interim age/access rule — September 2026

**BragStack accounts are currently limited to people age 18 or older.** This is an interim product and compliance boundary while BragStack completes legal review for youth/student accounts.

- Do not market, invite, onboard, or knowingly create BragStack accounts for people under 18.
- The product may support adults documenting prior high-school, college, university, certification, internship, or other education experience.
- **Middle School student accounts remain on the roadmap but are disabled and labeled “Coming soon.”** Do not remove the roadmap concept; do not enable it for minors until youth privacy, parental-consent, data-retention, safety, school-data, and applicable state/federal requirements have been reviewed with counsel and implemented.
- If an under-18 person contacts BragStack, do not ask them to submit educational records or other personal information through the product. Direct them to wait for the future student-account release.
- Existing internal/test fixtures that reference Middle School are not authorization to open the feature to minors.

This interim boundary is intentionally conservative. It is risk-reduction documentation, not a legal opinion or a substitute for counsel.

## Product goal

Help an adult user capture education accomplishments while they happen or reconstruct appropriate past accomplishments, then later surface the strongest real material for:

- scholarships and continuing-education opportunities available to adults
- selective or special programs
- internships
- essay planning
- college/university, certification, bootcamp, and professional-development records

The engine does **not** predict admission, scholarship, hiring, or selection outcomes. It does **not** invent activities, awards, roles, metrics, schools, programs, or life stories.

## Application profiles

### Scholarship

Looks for evidence of leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.

### Special program

Looks for subject depth, curiosity, initiative, collaboration, growth, and relevant project/research/competition evidence.

### Internship

Looks for demonstrated skills, responsibility, results, teamwork, initiative, and evidence that can support an application resume.

### Essay prep

Surfaces real stories that contain reflection, growth, curiosity, challenge, identity/values, and contribution. The user remains the author. BragStack should help the user remember and organize a story, not manufacture one.

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

Every application-intelligence response must reconcile to the user's saved records:

- recommended entry IDs must exist in the user's accomplishment set
- recommendation count cannot exceed the available accomplishments or the eight-item workbench limit
- only known fit-strength labels are allowed
- `acceptance_prediction`, `scholarship_prediction`, and `employment_decision` remain false
- recommendation telemetry stores operational verification metadata, not raw private accomplishment content

## Future student-account release gate

Do not enable Middle School or other under-18 account creation until a release review has explicitly covered at least:

1. age-screening and parental/guardian consent requirements;
2. youth privacy and data-minimization requirements;
3. parent/guardian access, correction, deletion, and revocation workflows where required;
4. retention/deletion rules for youth data;
5. school/student-record handling and whether any FERPA/COPPA/state student-privacy obligations apply to the planned use case;
6. AI/safety requirements for youth-facing conversational features;
7. marketing/analytics/cookie restrictions for minors;
8. Terms, Privacy Policy, customer support, incident response, and vendor contracts appropriate for the youth feature;
9. attorney approval for the intended launch jurisdictions.

## Future seed strategy

Prefer small, versioned, auditable reference profiles over large scraped datasets. Useful future additions include:

- program-specific requirement templates supplied from official sources
- scholarship rubric templates when the sponsor publishes them
- internship competency maps derived from a specific posting the user provides
- annual Common App reference updates

Do not scrape or train on private student essays, admissions decisions, or application records by default.
