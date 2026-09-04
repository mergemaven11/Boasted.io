# BragStack Education Intelligence v1

Education Intelligence is a deterministic evidence-ranking layer for student and early-career application workflows. It reuses the same user-owned accomplishment and Impact Receipt records as the rest of BragStack.

## Product goal

Help a student capture accomplishments while they happen, then later surface the strongest real material for:

- scholarships
- selective or special programs
- internships
- essay planning

The engine does **not** predict admission, scholarship, hiring, or selection outcomes. It does **not** invent activities, awards, roles, metrics, schools, programs, or life stories.

## Application profiles

### Scholarship

Looks for evidence of leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.

### Special program

Looks for subject depth, curiosity, initiative, collaboration, growth, and relevant project/research/competition evidence.

### Internship

Looks for demonstrated skills, responsibility, results, teamwork, initiative, and evidence that can support an application resume.

### Essay prep

Surfaces real stories that contain reflection, growth, curiosity, challenge, identity/values, and contribution. The student remains the author. BragStack should help the student remember and organize a story, not manufacture one.

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

## Verification rules

Every application-intelligence response must reconcile to the user's saved records:

- recommended entry IDs must exist in the user's accomplishment set
- recommendation count cannot exceed the available accomplishments or the eight-item workbench limit
- only known fit-strength labels are allowed
- `acceptance_prediction`, `scholarship_prediction`, and `employment_decision` remain false
- recommendation telemetry stores operational verification metadata, not raw private accomplishment content

## Future seed strategy

Prefer small, versioned, auditable reference profiles over large scraped datasets. Useful future additions include:

- program-specific requirement templates supplied from official sources
- scholarship rubric templates when the sponsor publishes them
- internship competency maps derived from a specific posting the user provides
- annual Common App reference updates

Do not scrape or train on private student essays, admissions decisions, or application records by default.
