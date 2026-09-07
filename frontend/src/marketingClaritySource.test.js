import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("landing page explains Boasted immediately in plain language", () => {
  const source = read("./LandingPage.jsx");

  assert.match(source, /Remember what you did/);
  assert.match(source, /Save your wins, results, skills, and proof in one private place/);
  assert.match(source, /Save it → Prove it → Use it/);
  assert.match(source, /ATS-friendly résumés/);
  assert.match(source, /Performance reviews/);
  assert.match(source, /Promotion packets/);
  assert.match(source, /Interview practice/);

  assert.doesNotMatch(source, /Capture → Prove → Package → Share → Connect/);
  assert.doesNotMatch(source, /WHY IT EXISTS/);
  assert.doesNotMatch(source, /BUILT FOR REAL CAREER MOMENTS/);
  assert.doesNotMatch(source, /<p>SOLUTIONS<\/p>/);
});

test("pricing always shows Free Pro Team and Enterprise together", () => {
  const source = read("./LandingPage.jsx");

  assert.match(source, /const plans = \[/);
  assert.match(source, /name: "Free"/);
  assert.match(source, /name: "Pro"/);
  assert.match(source, /name: "Team"/);
  assert.match(source, /name: "Enterprise"/);
  assert.match(source, /pricing-grid pricing-grid-four/);
  assert.match(source, /All four plans stay visible/);
  assert.doesNotMatch(source, /const plans = isCompany/);
  assert.doesNotMatch(source, /landing-individual-pricing/);
  assert.doesNotMatch(source, /landing-business-pricing/);
});

test("organization section uses separate Team Enterprise and Education tabs", () => {
  const source = read("./LandingPage.jsx");
  const css = read("./LandingPageSimple.css");

  assert.match(source, /useState\("team"\)/);
  assert.match(source, /label: "Teams"/);
  assert.match(source, /label: "Enterprise"/);
  assert.match(source, /label: "Education"/);
  assert.match(source, /Team review dashboard/);
  assert.match(source, /Enterprise admin dashboard/);
  assert.match(source, /Major Explorer/);
  assert.match(source, /Academic Portfolio/);
  assert.match(source, /scholarships, programs, internships/);
  assert.match(source, /private career record/);
  assert.match(source, /not a manager feed/);
  assert.match(css, /landing-org-tabs/);
  assert.match(css, /landing-org-dashboard/);
});

test("Education marketing keeps Education in the header and gives students clear steps", () => {
  const source = read("./EducationMarketingPage.jsx");
  const css = read("./EducationMarketingPage.css");

  assert.match(source, /className="active" href="\/education">Education/);
  assert.match(source, /href="#how-to-use">How to use/);
  assert.match(source, /How a student actually uses Boasted Education/);
  assert.match(source, /Create your Education record/);
  assert.match(source, /Save what you actually did/);
  assert.match(source, /Strengthen important wins/);
  assert.match(source, /Open an opportunity tool/);
  assert.match(source, /Search, verify, and apply/);
  assert.match(source, /href="\/app\/applications">Open my Education workspace/);
  assert.match(css, /education-student-step-grid/);
});

test("landing page stays compact instead of using oversized section gaps", () => {
  const css = read("./LandingPageSimple.css");

  assert.match(css, /min-height:600px/);
  assert.match(css, /padding-top:3\.25rem/);
  assert.match(css, /landing-org-section/);
  assert.doesNotMatch(css, /padding-top:84px/);
});

test("career intelligence uses empty hero space for non-repeating next actions", () => {
  const source = read("./CareerIntelligencePage.jsx");

  assert.match(source, /Use your proof/);
  assert.match(source, /href: "\/app\/resume-builder"/);
  assert.match(source, /href: "\/app\/reports\?packet=performance-review"/);
  assert.match(source, /href: "\/app\/interview-practice"/);
  assert.match(source, /See what your work proves you&apos;re good at/);
  assert.doesNotMatch(source, /Recommended actions/);
  assert.doesNotMatch(source, /saved proof record.*distinct demonstration/);
});
