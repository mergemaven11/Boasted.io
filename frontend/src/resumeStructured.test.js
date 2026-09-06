import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTING_SECTION_ORDER,
  findRequirementEvidence,
  findRequirementEvidenceDetail,
  flattenExperienceBullets,
  makeResumeDraft,
  makeSavedResumeDraft,
  parseGateStatus,
  recruiterGateStatus,
  serializeResumeDraft,
} from "./resumeStructured.js";
import { RESUME_TEMPLATES, getResumeTemplate } from "./resumeTemplates.js";

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

test("saved structured versions restore role boundaries and bullet provenance", () => {
  const draft = makeSavedResumeDraft({
    contact: { name: "Jordan Lee", location: "Atlanta, GA" },
    experience: [
      {
        company: "Example Co",
        title: "Platform Engineer",
        start_date: "Jan 2024",
        end_date: "present",
        current: true,
        bullets: [{ text: "Reduced deployment toil by 35%.", source_kind: "impact-receipt", source_receipt_id: "507f1f77bcf86cd799439011" }],
      },
    ],
  });
  assert.equal(draft.experience.length, 1);
  assert.equal(draft.experience[0].company, "Example Co");
  assert.equal(draft.experience[0].bullets[0].source_kind, "impact-receipt");
  assert.equal(makeSavedResumeDraft({ bullets: [{ text: "Legacy bullet" }] }), null);
});

test("starter resumes can be structured and reopened without work history", () => {
  const draft = makeSavedResumeDraft({
    contact: { name: "Jordan Lee" },
    experience: [],
    schema_version: 5,
  });
  assert.ok(draft);
  assert.equal(draft.experience.length, 0);

  const content = {
    skills: ["Python", "Linux"],
    sections: { education: ["Example University — Computer Science"], projects: ["Built a deployment lab"] },
  };
  assert.equal(parseGateStatus(draft, [], content).level, "good");
  assert.equal(recruiterGateStatus(draft, content).level, "warn");

  const text = serializeResumeDraft({ draft, skills: content.skills, sections: content.sections });
  assert.doesNotMatch(text, /PROFESSIONAL EXPERIENCE/);
  assert.match(text, /EDUCATION/);
  assert.match(text, /PROJECTS/);
});

test("requirement evidence points back to the exact role and source", () => {
  const draft = makeResumeDraft({
    experience: [
      {
        company: "Example Co",
        title: "Site Reliability Engineer",
        bullets: [{ text: "Led incident response and improved service recovery.", source_kind: "impact-receipt" }],
      },
    ],
  });
  assert.equal(findRequirementEvidence("incident", { draft }), "Example Co · Site Reliability Engineer");
  const detail = findRequirementEvidenceDetail("incident", { draft });
  assert.equal(detail.sourceKind, "impact-receipt");
  assert.match(detail.excerpt, /incident response/i);
});

test("requirement matching avoids substring false positives", () => {
  const draft = makeResumeDraft({
    experience: [{ company: "Example Co", title: "Support Engineer", bullets: [{ text: "Worked with Google Cloud and MongoDB." }] }],
  });
  assert.equal(findRequirementEvidence("Go", { draft }), "");
  assert.equal(findRequirementEvidence("SQL", { draft }), "");
  assert.equal(findRequirementEvidence("Google", { draft }), "Example Co · Support Engineer");
});

test("parse gate warns when employer or title is missing", () => {
  const draft = makeResumeDraft({
    experience: [{ company: "", title: "Support Engineer", bullets: [] }],
  });
  assert.equal(parseGateStatus(draft, []).level, "warn");
});

test("confidence metadata survives reconstruction for field-level review", () => {
  const draft = makeResumeDraft({
    contact: { name: "Jordan Lee", email: "jordan@example.com" },
    field_confidence: {
      contact: { name: "high", email: "high", phone: "missing" },
      experience: [{ company: "medium", title: "high", dates: "high" }],
    },
    experience: [{ company: "Example Co", title: "Support Engineer", dates_raw: "2022 – Present", confidence: "medium", bullets: [] }],
  });

  assert.equal(draft.contact_confidence.email, "high");
  assert.equal(draft.contact_confidence.phone, "missing");
  assert.equal(draft.experience[0].field_confidence.company, "medium");
});

test("ATS text serializer keeps optional sections in a stable single-column order", () => {
  const draft = makeResumeDraft({ contact: { name: "Jordan Lee" }, experience: [] });
  const sections = {
    education: ["State University — B.S. Computer Science"],
    projects: ["Incident Tracker — React, FastAPI"],
    certifications: ["AWS Certified Cloud Practitioner"],
    leadership: ["President, Computing Club"],
    volunteer: ["Volunteer Mentor, Code Club"],
    awards: ["Customer Hero Award"],
    publications: ["Presented accessibility research"],
    languages: ["English, Spanish"],
  };
  const text = serializeResumeDraft({ draft, skills: ["Python"], sections });

  let previous = -1;
  for (const key of SUPPORTING_SECTION_ORDER) {
    const heading = key === "volunteer" ? "VOLUNTEER EXPERIENCE" : key === "leadership" ? "LEADERSHIP & ACTIVITIES" : key === "awards" ? "AWARDS & HONORS" : key === "publications" ? "PUBLICATIONS & PRESENTATIONS" : key.toUpperCase();
    const index = text.indexOf(heading);
    assert.ok(index > previous, `${heading} should preserve the configured reading order`);
    previous = index;
  }
});

test("template library exposes exactly twelve unique ATS-safe presentation choices", () => {
  assert.equal(RESUME_TEMPLATES.length, 12);
  assert.equal(new Set(RESUME_TEMPLATES.map((template) => template.id)).size, 12);
  assert.equal(new Set(RESUME_TEMPLATES.map((template) => template.className)).size, 12);
  assert.equal(getResumeTemplate("technical-blue").audience, "Engineering & IT");
  assert.equal(getResumeTemplate("does-not-exist").id, RESUME_TEMPLATES[0].id);
});
