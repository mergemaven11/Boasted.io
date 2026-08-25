import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { AISHA_PORTRAIT_DATA_URI } from "../src/aishaPortraitData.js";

const EXPECTED_SHA256 = "a4f88a5fc2bcd437256ca848f1529b120b6dc0af6df2937a552915fa877181a0";
const EXPECTED_BYTES = 14219;
const EXPECTED_WIDTH = 640;
const EXPECTED_HEIGHT = 431;

assert.ok(AISHA_PORTRAIT_DATA_URI.startsWith("data:image/jpeg;base64,"), "Aisha fallback source must remain a valid inline JPEG data URI");
const encoded = AISHA_PORTRAIT_DATA_URI.slice("data:image/jpeg;base64,".length);
const decoded = Buffer.from(encoded, "base64");
assert.equal(decoded.length, EXPECTED_BYTES, "Aisha fallback byte length changed or was truncated");
assert.equal(crypto.createHash("sha256").update(decoded).digest("hex"), EXPECTED_SHA256, "Aisha fallback does not decode to the verified portrait bytes");
assert.equal(decoded[0], 0xff, "Aisha JPEG SOI marker missing");
assert.equal(decoded[1], 0xd8, "Aisha JPEG SOI marker missing");
assert.equal(decoded.at(-2), 0xff, "Aisha JPEG EOI marker missing");
assert.equal(decoded.at(-1), 0xd9, "Aisha JPEG EOI marker missing");

const interviewSource = await fs.readFile(path.resolve("src/InterviewPracticePage.jsx"), "utf8");
const avatarSource = await fs.readFile(path.resolve("src/AnimatedInterviewerAvatar.jsx"), "utf8");
const avatarCss = await fs.readFile(path.resolve("src/AnimatedInterviewerAvatar.css"), "utf8");
const interviewCss = await fs.readFile(path.resolve("src/InterviewPracticePage.css"), "utf8");

assert.match(interviewSource, /function scrollInterviewToTop\(\)/, "Interviewer must explicitly reset the viewport to the top");
assert.match(interviewSource, /\[stage, questionIndex\]/, "Viewport reset must run when interview stage/question changes");
assert.match(interviewSource, /recognition\.interimResults = true/, "Speech recognition must display interim speech instead of appearing muted");
assert.match(interviewSource, /recognition\.continuous = !appleMobile/, "Apple mobile speech recognition must use restartable short sessions");
assert.match(interviewSource, /primeMicrophonePermission/, "Interviewer must prime microphone permission on mobile");
assert.match(interviewSource, /role="dialog"/, "Per-question feedback must render as a modal dialog");
assert.match(interviewSource, />Continue</, "Per-question feedback must wait for an explicit Continue action");
assert.match(avatarSource, /aishaJordanPhoto/, "Aisha should render from the bundled JPEG asset first");
assert.match(avatarSource, /aisha-mouth-open-shape/, "Aisha speaking state must include a visible mouth-opening layer");
assert.match(avatarCss, /@keyframes aisha-mouth-open/, "Aisha must have visible mouth-opening animation keyframes");
assert.match(interviewCss, /height:431px/, "Aisha stage should stay at native portrait height on desktop to avoid upscaling blur");
assert.match(interviewCss, /answer-feedback-panel\[role="dialog"\]\{position:fixed/, "Feedback dialog must be centered over the interview instead of appearing at page bottom");

const chromeCandidates = ["google-chrome", "chromium", "chromium-browser"];
const chrome = chromeCandidates.find((name) => spawnSync("which", [name], { encoding: "utf8" }).status === 0);
assert.ok(chrome, "A Chromium/Chrome binary is required for the Aisha browser verification");

function runProcess(command, args, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`Timed out after ${timeoutMs}ms: ${command}`));
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ status: code, stdout, stderr });
    });
  });
}

const harnessHtml = path.resolve("scripts/.aisha-browser-harness.html");
const harnessJsx = path.resolve("scripts/.aisha-browser-harness.jsx");

await fs.writeFile(harnessHtml, `<!doctype html><html><head><meta charset="utf-8"><title>Aisha verification</title></head><body><div id="root"></div><script type="module" src="/scripts/.aisha-browser-harness.jsx"></script></body></html>`);
await fs.writeFile(harnessJsx, `
import React from "react";
import { createRoot } from "react-dom/client";
import AnimatedInterviewerAvatar from "../src/AnimatedInterviewerAvatar.jsx";
import "../src/InterviewPracticePage.css";
import "../src/AnimatedInterviewerAvatar.css";
import "../src/InterviewResponsiveReference.css";

createRoot(document.getElementById("root")).render(
  <div className="interview-video-stage" style={{ width: "640px" }}>
    <div className="virtual-interviewer animated-interviewer-host">
      <AnimatedInterviewerAvatar state="speaking" />
    </div>
  </div>
);

(async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const stage = document.querySelector(".interview-video-stage");
    const image = document.querySelector(".aisha-stage-photo");
    const mouth = document.querySelector(".aisha-mouth-open-shape");
    if (stage && image && mouth) {
      try {
        await image.decode();
        const stageRect = stage.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const imageStyle = getComputedStyle(image);
        const mouthStyle = getComputedStyle(mouth);
        const fullStage = imageRect.width >= stageRect.width * 0.95 && imageRect.height >= stageRect.height * 0.95;
        const visible = imageStyle.display !== "none" && imageStyle.visibility === "visible" && Number(imageStyle.opacity) > 0.99;
        const bundledOrFallback = image.currentSrc.includes("aisha-jordan-interviewer") || image.currentSrc.startsWith("data:image/jpeg;base64,");
        const dimensions = image.naturalWidth === ${EXPECTED_WIDTH} && image.naturalHeight === ${EXPECTED_HEIGHT};
        const mouthAnimated = mouthStyle.animationName.includes("aisha-mouth-open");
        const nativeHeight = Math.round(stageRect.height) === ${EXPECTED_HEIGHT};
        const ok = fullStage && visible && bundledOrFallback && dimensions && mouthAnimated && nativeHeight;
        document.body.dataset.aishaResult = ok ? "ok" : "fail";
        document.body.dataset.aishaDetails = [image.naturalWidth, image.naturalHeight, Math.round(imageRect.width), Math.round(imageRect.height), Math.round(stageRect.height), imageStyle.display, imageStyle.visibility, imageStyle.opacity, bundledOrFallback, mouthAnimated].join(":");
        document.querySelectorAll(".aisha-stage-photo,.aisha-mouth-photo").forEach((node) => node.removeAttribute("src"));
        return;
      } catch (error) {
        document.body.dataset.aishaResult = "decode-error";
        document.body.dataset.aishaDetails = String(error);
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  document.body.dataset.aishaResult = "missing";
})();
`);

const server = await createServer({
  root: process.cwd(),
  logLevel: "error",
  server: { host: "127.0.0.1", port: 41739, strictPort: true },
});

try {
  await server.listen();
  const run = await runProcess(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--virtual-time-budget=6000",
    "--dump-dom",
    "http://127.0.0.1:41739/scripts/.aisha-browser-harness.html",
  ]);
  assert.equal(run.status, 0, `Headless browser failed: ${run.stderr || run.stdout}`);
  assert.match(run.stdout, /data-aisha-result="ok"/, `Aisha did not render correctly in the real browser harness: ${run.stdout.slice(-2000)}`);
  assert.match(run.stdout, new RegExp(`data-aisha-details="${EXPECTED_WIDTH}:${EXPECTED_HEIGHT}:`), "Browser did not decode the verified full portrait dimensions");
} finally {
  await server.close();
  await Promise.allSettled([fs.unlink(harnessHtml), fs.unlink(harnessJsx)]);
}

console.log(`Aisha/interviewer verified: ${decoded.length} fallback bytes, ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}, native-scale stage, visible mouth motion, mobile dictation safeguards, modal feedback, and top-of-page contract OK.`);
