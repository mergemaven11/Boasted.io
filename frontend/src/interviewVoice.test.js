import test from "node:test";
import assert from "node:assert/strict";
import { chooseInterviewVoice, getInterviewVoiceStyle } from "./interviewVoice.js";

test("uses warm voice settings by default and falls back for unknown styles", () => {
  assert.deepEqual(getInterviewVoiceStyle("missing"), getInterviewVoiceStyle("warm"));
});

test("keeps the three styles distinct", () => {
  assert.notEqual(getInterviewVoiceStyle("bright").pitch, getInterviewVoiceStyle("warm").pitch);
  assert.notEqual(getInterviewVoiceStyle("calm").rate, getInterviewVoiceStyle("warm").rate);
});

test("selects a preferred English voice and never falls back to non-English", () => {
  const voices = [
    { name: "Ava", lang: "fr-FR" },
    { name: "Generic English", lang: "en-US" },
    { name: "Samantha", lang: "en-US" },
  ];
  assert.equal(chooseInterviewVoice(voices, "bright").name, "Samantha");
  assert.equal(chooseInterviewVoice([{ name: "Ava", lang: "fr-FR" }], "bright"), null);
});
