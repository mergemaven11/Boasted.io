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

test("selects an expanded feminine English voice across major platforms", () => {
  const voices = [
    { name: "Microsoft David Online (Natural)", lang: "en-US" },
    { name: "Microsoft Jenny Online (Natural)", lang: "en-US" },
    { name: "Samantha", lang: "en-US" },
  ];
  assert.equal(chooseInterviewVoice(voices, "warm").name, "Microsoft Jenny Online (Natural)");
  assert.equal(chooseInterviewVoice([{ name: "Samantha", lang: "en-US" }], "bright").name, "Samantha");
});

test("never selects a non-English or arbitrary male-sounding fallback", () => {
  const unsupported = [
    { name: "Microsoft Ava", lang: "fr-FR" },
    { name: "Microsoft David Online (Natural)", lang: "en-US" },
    { name: "Generic English", lang: "en-US" },
  ];
  assert.equal(chooseInterviewVoice(unsupported, "bright"), null);
});

test("falls back to another recognized feminine voice when a style preference is unavailable", () => {
  const voices = [{ name: "Microsoft Zira Desktop", lang: "en-US" }];
  assert.equal(chooseInterviewVoice(voices, "calm").name, "Microsoft Zira Desktop");
});
