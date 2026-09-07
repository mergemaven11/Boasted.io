import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAnswer } from "./interviewEngine.js";
import { buildTranscriptContext, correctTranscript, resolveTranscriptAlternatives } from "./interviewTranscript.js";

const software = buildTranscriptContext({ roleTitle: "Software Engineer", question: "How do you work in Agile teams?" });

test("corrects only known substitutions in trusted software context", () => {
  assert.equal(correctTranscript("I joined the spirit meetings and planned the next sprint", software), "I joined the sprint meetings and planned the next sprint");
  assert.equal(correctTranscript("I opened a pool request after testing", software), "I opened a pull request after testing");
});

test("preserves genuine phrases outside technical context", () => {
  const context = buildTranscriptContext({ roleTitle: "Community Chaplain", question: "How do you organize gatherings?" });
  assert.equal(correctTranscript("I attended a spirit meeting by the pool", context), "I attended a spirit meeting by the pool");
});

test("prefers a matching domain alternative without combining alternatives", () => {
  const result = resolveTranscriptAlternatives([
    { transcript: "I opened a pool request", confidence: 0.8 },
    { transcript: "I opened a pull request", confidence: 0.7 },
  ], software);
  assert.deepEqual(result, { raw: "I opened a pool request", selected: "I opened a pull request", display: "I opened a pull request" });
});

test("falls back to the first result and preserves unrelated wording", () => {
  const result = resolveTranscriptAlternatives([{ transcript: "I reduced errors by 30 percent" }], software);
  assert.equal(result.raw, result.display);
  assert.equal(result.display, "I reduced errors by 30 percent");
});

test("restores intended terminology without changing scoring behavior", () => {
  const raw = "I joined the spirit meetings, reviewed the logs, fixed the defect, and reduced failures by 30 percent.";
  const intended = "I joined the sprint meetings, reviewed the logs, fixed the defect, and reduced failures by 30 percent.";
  const corrected = correctTranscript(raw, software);
  const options = {
    roleTitle: "Software Engineer",
    question: "Tell me about a technical problem you solved during a sprint.",
    competency: "problem_solving",
  };
  assert.equal(corrected, intended);
  assert.deepEqual(analyzeAnswer(corrected, options), analyzeAnswer(intended, options));
});

test("does not change meaning or scoring outside an applicable context", () => {
  const answer = "I organized a spirit meeting for our community.";
  const context = buildTranscriptContext({ roleTitle: "Community Chaplain" });
  const display = correctTranscript(answer, context);
  const options = { roleTitle: "Community Chaplain", question: "How did you organize the gathering?" };
  assert.equal(display, answer);
  assert.deepEqual(analyzeAnswer(display, options), analyzeAnswer(answer, options));
});
