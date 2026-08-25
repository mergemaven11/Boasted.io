import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

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
assert.match(interviewSource, /"Continue"/, "Per-question feedback must wait for an explicit Continue action");

assert.match(avatarSource, /data-avatar-engine="bragstack-vector-v1"/, "Aisha must identify the BragStack vector avatar engine");
assert.match(avatarSource, /<svg[\s\S]*viewBox="0 0 816 551"/, "Aisha must render as a resolution-independent SVG stage");
assert.match(avatarSource, /className="aisha-eyelids"/, "Aisha must have natural blink geometry");
assert.match(avatarSource, /className="aisha-mouth-opening"/, "Aisha must have a dedicated speaking mouth shape");
assert.match(avatarSource, /className="aisha-head"/, "Aisha must expose localized head motion");
assert.doesNotMatch(avatarSource, /AISHA_PORTRAIT_DATA_URI|aishaPortraitChunks|aisha-jordan-interviewer\.jpg/, "Live Aisha renderer must not depend on the retired JPEG/chunk pipeline");

assert.match(avatarCss, /@keyframes aisha-blink/, "Aisha must blink naturally");
assert.match(avatarCss, /@keyframes aisha-mouth-opening/, "Aisha must have speaking mouth motion");
assert.match(avatarCss, /@keyframes aisha-listening-presence/, "Aisha must have a restrained listening micro-expression");
assert.match(avatarCss, /@keyframes aisha-thinking-gaze/, "Aisha must have a thinking gaze state");
assert.match(avatarCss, /@keyframes aisha-encouraging-nod/, "Aisha must have an encouraging nod state");
assert.match(avatarCss, /prefers-reduced-motion:reduce/, "Aisha must respect reduced-motion preferences");
assert.match(interviewCss, /answer-feedback-panel\[role="dialog"\]\{position:fixed/, "Feedback dialog must remain centered over the interview");

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
    child.on("error", (error) => { clearTimeout(timeout); reject(error); });
    child.on("close", (code) => { clearTimeout(timeout); resolve({ status: code, stdout, stderr }); });
  });
}

const harnessHtml = path.resolve("scripts/.aisha-browser-harness.html");
const harnessJsx = path.resolve("scripts/.aisha-browser-harness.jsx");
await fs.writeFile(harnessHtml, `<!doctype html><html><body><div id="root"></div><script type="module" src="/scripts/.aisha-browser-harness.jsx"></script></body></html>`);
await fs.writeFile(harnessJsx, `
import React from "react";
import { createRoot } from "react-dom/client";
import AnimatedInterviewerAvatar from "../src/AnimatedInterviewerAvatar.jsx";
import "../src/InterviewPracticePage.css";
import "../src/AnimatedInterviewerAvatar.css";
import "../src/InterviewResponsiveReference.css";
createRoot(document.getElementById("root")).render(<div className="interview-video-stage" style={{width:"816px",height:"551px"}}><div className="virtual-interviewer animated-interviewer-host"><AnimatedInterviewerAvatar state="speaking" /></div></div>);
requestAnimationFrame(()=>requestAnimationFrame(()=>{const stage=document.querySelector(".interview-video-stage");const shell=document.querySelector(".aisha-avatar-shell");const svg=document.querySelector(".aisha-vector-avatar");const mouth=document.querySelector(".aisha-mouth-opening");const eyelids=document.querySelector(".aisha-eyelids");const sr=stage?.getBoundingClientRect();const ar=shell?.getBoundingClientRect();const mouthStyle=mouth?getComputedStyle(mouth):null;const eyelidStyle=eyelids?getComputedStyle(eyelids):null;const ok=Boolean(stage&&shell&&svg&&mouth&&eyelids&&sr&&ar&&ar.width>=sr.width*.99&&ar.height>=sr.height*.99&&svg.getAttribute("data-avatar-engine")==="bragstack-vector-v1"&&svg.getAttribute("data-avatar-state")==="speaking"&&mouthStyle?.animationName.includes("aisha-mouth-opening")&&eyelidStyle?.animationName.includes("aisha-blink")&&!document.querySelector(".aisha-stage-photo,.aisha-mouth-photo"));document.body.dataset.aishaResult=ok?"ok":"fail";document.body.dataset.aishaDetails=[Math.round(sr?.width||0),Math.round(sr?.height||0),Math.round(ar?.width||0),Math.round(ar?.height||0),svg?.getAttribute("data-avatar-state"),mouthStyle?.animationName,eyelidStyle?.animationName].join(":");}));
`);

const server = await createServer({ root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 41739, strictPort: true } });
try {
  await server.listen();
  const run = await runProcess(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=3000", "--dump-dom", "http://127.0.0.1:41739/scripts/.aisha-browser-harness.html"]);
  assert.equal(run.status, 0, `Headless browser failed: ${run.stderr || run.stdout}`);
  assert.match(run.stdout, /data-aisha-result="ok"/, `Aisha vector avatar browser contract failed: ${run.stdout.slice(-1800)}`);
  assert.match(run.stdout, /data-aisha-details="[0-9]+:[0-9]+:[0-9]+:[0-9]+:speaking:aisha-mouth-opening:aisha-blink"/, "Aisha browser contract must report responsive stage geometry, speaking mouth animation, and natural blink animation");
} finally {
  await server.close();
  await Promise.allSettled([fs.unlink(harnessHtml), fs.unlink(harnessJsx)]);
}

console.log("Aisha verified: professional vector avatar, natural blink/mouth micro-motion, interview-state expressions, reduced-motion support, responsive stage fill, and no live JPEG/chunk dependency.");
