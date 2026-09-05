# BragStack Major Explorer v1

Major Explorer is an Education Intelligence feature that uses a user's own BragStack evidence to surface academic directions worth **exploring**. It is not an aptitude test, admissions predictor, career-success predictor, or automated academic decision-maker.

## Product purpose

Major Explorer answers a narrow question:

> Based on the real experiences and skills currently documented in BragStack, which majors may be worth investigating next, and what small experiments could reduce uncertainty?

It does **not** answer:

> What is the objectively best major for this person?

The feature is built on Career Intelligence v5 canonical skills and evidence domains, then applies deterministic major-profile mappings. It does not use fuzzy matching, embeddings, hidden psychometric scoring, or an LLM to invent a major recommendation.

## Required customer-facing disclaimer

The Major Explorer UI must display a visible disclaimer before or alongside recommendations. The API also returns the disclaimer as structured fields so clients cannot silently omit the product boundary.

Required meaning:

- Major Explorer is an educational exploration and decision-support tool, not academic, career, financial, legal, licensing, or professional advice.
- Recommendations reflect only the information and evidence currently available in BragStack and may be incomplete.
- Major Explorer does not predict or guarantee admission, scholarships, academic performance, graduation, employment, salary, licensing, or career success.
- Users must verify prerequisites, accreditation, transfer rules, program availability, costs, graduation requirements, and licensing requirements with the relevant institution or authority.
- The user remains responsible for education decisions and should consider a qualified academic or career advisor for consequential choices.

These disclaimers are risk-reduction controls. They do not guarantee legal compliance or immunity from claims, and final public language should be reviewed by qualified counsel as part of BragStack's legal process.

## No fake precision

Major Explorer must not expose:

- a fit percentage;
- admissions odds;
- scholarship odds;
- salary odds;
- a success probability;
- a readiness score;
- a claim that a major is the user's "best" major.

Customer-facing recommendation labels are qualitative:

- **Strong exploration candidate**
- **Worth exploring**
- **Possible direction**

Those labels describe evidence alignment only. They are not predictions of aptitude or future outcomes.

## Evidence vs. interest

Major Explorer v1 uses saved BragStack proof only. It does not currently mix self-reported interests into demonstrated evidence.

This distinction is intentional:

- **Demonstrated evidence** means the user documented an experience, accomplishment, project, skill, or other proof record.
- **Self-reported interest** would mean the user says they are curious about or enjoy something.

If a future guided-interest flow is added, self-reported interests should remain explicitly labeled and should not silently become demonstrated proof.

## Uncertainty is a first-class output

Every recommendation should explain:

1. why it appeared;
2. what Major Explorer still does not know; and
3. one or more low-stakes experiments the user can try before making a major decision.

Examples include comparing two introductory courses, trying a small project, previewing prerequisite math or science, or reviewing the actual curriculum of a real program.

Major Explorer should prefer **"not enough information"** over manufacturing certainty.

## Verification gate

The API route fail-closes if the payload violates Major Explorer safeguards. Verification checks include:

- evidence counts reconcile to saved proof;
- recommendation counts stay bounded;
- major IDs come from the deterministic profile registry;
- qualitative labels use the allowed vocabulary;
- exposed recommendations do not contain score/probability/odds fields;
- all outcome-prediction and professional-advice flags remain false;
- the disclaimer fields are present;
- the engine reports `saved-proof-only` evidence mode;
- Career Intelligence v5 remains the declared underlying evidence engine.

A failed verification returns an error instead of serving potentially misleading guidance.

## Major Explorer v1 methodology metadata

- Major Explorer: `major-explorer-v1`
- Underlying evidence engine: `career-intelligence-v5`
- Ranking meaning: `evidence-alignment-for-exploration-only`
- Fit percentage: disabled
- Best-major claim: disabled
- Decision-maker: disabled
- Professional advice: disabled
- Admission prediction: disabled
- Scholarship prediction: disabled
- Graduation prediction: disabled
- Employment prediction: disabled
- Salary prediction: disabled
- Licensing prediction: disabled
- Career-success prediction: disabled

## Legal review follow-up

Before BragStack relies on Major Explorer as a broadly marketed education-decision product, qualified counsel should review at least:

- the final disclaimer and Terms language;
- consumer-protection and advertising claims;
- education/student privacy obligations that may apply to the actual user population and data flows;
- state, federal, and international rules applicable to recommendations or profiling;
- accessibility and nondiscrimination implications;
- data-retention/vendor practices; and
- any future school, counselor, parent/guardian, or institutional integrations.

Major Explorer's engineering safeguards are designed to keep the product conservative while that legal work is completed; they are not a substitute for legal review.
