import test from "node:test";
import assert from "node:assert/strict";

import { PROFESSION_BANK_METADATA, PROFESSION_SPECIALTIES } from "./professionInterviewBank.js";

test("Aisha profession bank covers a broad cross-section of careers", () => {
  const entries = Object.entries(PROFESSION_SPECIALTIES);
  assert.ok(entries.length >= 40);

  const representedFamilies = new Set(entries.map(([, config]) => config.family));
  for (const family of ["healthcare", "technology", "education", "finance", "sales", "operations", "trades", "hospitality", "legal", "creative", "management", "public_service"]) {
    assert.ok(representedFamilies.has(family), family);
  }
});

test("every profession specialty has usable competency-based questions", () => {
  for (const [key, config] of Object.entries(PROFESSION_SPECIALTIES)) {
    assert.ok(Array.isArray(config.keywords) && config.keywords.length > 0, `${key}: keywords`);
    assert.ok(Array.isArray(config.competencies) && config.competencies.length >= 3, `${key}: competencies`);
    assert.ok(Array.isArray(config.questions) && config.questions.length >= 3, `${key}: questions`);
    assert.equal(new Set(config.questions).size, config.questions.length, `${key}: duplicate questions`);
    assert.ok(config.questions.every((question) => question.length >= 45), `${key}: question quality`);
  }
});

test("profession bank documents its structured-interview methodology", () => {
  assert.match(PROFESSION_BANK_METADATA.methodology, /competency-based/i);
  assert.match(PROFESSION_BANK_METADATA.coverage_strategy, /job description/i);
  assert.ok(PROFESSION_BANK_METADATA.source_frameworks.some((item) => /O\*NET/i.test(item)));
  assert.ok(PROFESSION_BANK_METADATA.source_frameworks.some((item) => /Office of Personnel Management/i.test(item)));
});
