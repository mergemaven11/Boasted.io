# BragStack account eligibility and Education policy

**Effective:** September 5, 2026  
**Status:** Product-policy baseline pending qualified legal review.

BragStack no longer uses a product-specific **18+ confirmation checkbox** or an age-specific Education mode. Account eligibility is governed by the current Terms and applicable law.

This change does **not** mean BragStack has completed every legal, privacy, safety, student-data, or jurisdiction-specific review that could apply to younger users. Do not treat removal of the old age gate as a legal conclusion or certification.

## Registration controls

New email/password registrations must:

1. affirmatively accept the current Terms and Conditions; and
2. affirmatively acknowledge the current Privacy Policy.

The backend, not the browser, assigns and records:

- Terms version;
- Terms acceptance timestamp;
- Privacy Policy version;
- Privacy Policy acceptance timestamp; and
- legal-acceptance source.

The same information is also stored in the structured `consents` object on the user record. New Google/GitHub account creation remains temporarily paused so OAuth cannot bypass the required legal-consent step. Existing users who already linked OAuth may continue to sign in.

## Education product focus

The current Education product is designed around education and early-career evidence such as:

- college and university coursework, projects, research, awards, and milestones;
- trade and technical education;
- certifications, licenses, bootcamps, professional training, and continuing education;
- internships, service, leadership, organizations, and practical projects;
- group-project contribution tracking;
- graduation and program milestones;
- turning education evidence into Impact Receipts, skills, career matching, resume material, interview preparation, portfolio proof, and career planning.

There is no dedicated Middle School product mode, route, entry type, signup branch, or coming-soon banner in the current Education experience.

## Data-minimization and safety rules

- Do not request a birth date merely to reproduce the removed age-confirmation gate.
- Do not encourage users to upload protected student records, school-system credentials, passwords, confidential documents, or information they are not permitted to retain.
- Keep education evidence private by default unless the user intentionally makes a supported item public.
- AI-assisted education and career features must remain grounded in user-provided evidence and must not invent schools, grades, awards, credentials, projects, dates, metrics, or experiences.
- Verification requests should collect only the contact information reasonably needed for the specific request.
- Public sharing should clearly warn users to review content for confidential, personal, restricted, or protected information.

## Legal-review items that remain open

Before BragStack intentionally markets to, designs specifically for, or creates dedicated experiences for children or younger teens, require documented review of at least:

- age and contractual-capacity requirements by launch jurisdiction;
- parental/guardian notice and consent where applicable;
- data minimization, retention, deletion, and access rights;
- COPPA, FERPA, state student-privacy rules, school contracts, and similar requirements where applicable;
- AI and conversational-safety requirements for minors;
- advertising, analytics, cookie, and tracking restrictions;
- verifier/contact-data collection involving students;
- vendor agreements and subprocessors that may receive student data;
- incident-response procedures for youth/student data;
- updated Terms, Privacy Policy, support procedures, accessibility review, and qualified legal approval.

## Ownership

Questions about account eligibility, student-data handling, parental requests, school requests, or a proposal to build a dedicated child/youth experience should be escalated internally for privacy and legal review rather than answered by inventing a new age rule in product code.
