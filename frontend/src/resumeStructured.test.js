import test from "node:test";
import assert from "node:assert/strict";
import {
  findRequirementEvidence,
  flattenExperienceBullets,
  makeResumeDraft,
  parseGateStatus,
  serializeResumeDraft,
} from "./resumeStructured.js";

test("structured import keeps employers, titles, dates and bullets together", () => {
  const draft = makeResumeDraft({
    contact: { name: "Jordan Lee", email: "jordan@example.com" },
    experience: [
      {
        company: "Example Co",
        title: "Platform Engineer",
        location: "Atlanta, GA",
        dates_raw: "January 2024 – Present",
        current: true,
        confidence: "high",
        bullets: [{ text: "Automated production deployments with Kubernetes and reduced release toil by 35%.", source_kind: "imported" }],
      },
    ],
  });

  assert.equal(draft.experience[0].company, "Example Co");
  assert.equal(draft.experience[0].title, "Platform Engineer");
  assert.equal(flattenExperienceBullets(draft.experience)[0].has_metrics, true);

  const text = serializeResumeDraft({ draft, summary: "Platform engineer.", skills: ["Kubernetes", "Python"] });
  assert.match(text, /Example Co \| Platform Engineer/);
  assert.match(text, /January 2024 – Present/);
  assert.match(text, /35%/);
});

test("requirement evidence points back to the role that contains it", () => {
  const draft = makeResumeDraft({
    experience: [
      {
        company: "Example Co",
        title: "Site Reliability Engineer",
        bullets: [{ text: "Led incident response and improved service recovery." }],
      },
    ],
  });
  assert.equal(findRequirementEvidence("incident", { draft }), "Example Co · Site Reliability Engineer");
});

test("parse gate warns when employer or title is missing", () => {
  const draft = makeResumeDraft({
    experience: [{ company: "", title: "Support Engineer", bullets: [] }],
  });
  assert.equal(parseGateStatus(draft, []).level, "warn");
});
