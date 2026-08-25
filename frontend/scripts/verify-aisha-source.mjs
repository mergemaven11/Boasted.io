import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import {
  AISHA_PORTRAIT_DATA_URI,
  AISHA_PORTRAIT_HEIGHT,
  AISHA_PORTRAIT_WIDTH,
} from "../src/aishaPortraitData.js";
import hq1 from "../src/aishaPortraitChunks/hq1.js";
import hq2 from "../src/aishaPortraitChunks/hq2.js";
import hq3 from "../src/aishaPortraitChunks/hq3.js";
import hq4 from "../src/aishaPortraitChunks/hq4.js";
import hq5 from "../src/aishaPortraitChunks/hq5.js";

const EXPECTED_SHA256 = "c2bc5cb794c7c541a98bde54465c85e1a8070b3cc4cdea70323cee2d77cc5479";
const EXPECTED_BYTES = 68923;
const EXPECTED_WIDTH = 816;
const EXPECTED_HEIGHT = 551;
const PREFIX = "data:image/jpeg;base64,";

// Diagnostic only: inspect preserved pre-split HQ candidates without changing acceptance criteria.
for (const [name, candidate] of Object.entries({ hq1, hq2, hq3, hq4, hq5 })) {
  const bytes = Buffer.from(candidate, "base64");
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");
  console.log(`Aisha candidate ${name}: base64=${candidate.length} chars bytes=${bytes.length} sha256=${hash}`);
}
const preservedCombined = `${hq1}${hq2}${hq3}${hq4}${hq5}`;
const preservedCombinedBytes = Buffer.from(preservedCombined, "base64");
console.log(`Aisha candidate hq1..hq5 combined: base64=${preservedCombined.length} chars bytes=${preservedCombinedBytes.length} sha256=${crypto.createHash("sha256").update(preservedCombinedBytes).digest("hex")}`);

assert.equal(AISHA_PORTRAIT_WIDTH, EXPECTED_WIDTH, "Approved Aisha width contract changed");
assert.equal(AISHA_PORTRAIT_HEIGHT, EXPECTED_HEIGHT, "Approved Aisha height contract changed");
assert.ok(AISHA_PORTRAIT_DATA_URI.startsWith(PREFIX), "Aisha must remain an inline JPEG so deploy compression/path changes cannot substitute the image");
const decoded = Buffer.from(AISHA_PORTRAIT_DATA_URI.slice(PREFIX.length), "base64");
assert.equal(decoded.length, EXPECTED_BYTES, "Approved Aisha portrait was truncated or recompressed");
assert.ok(decoded.length >= 60000, "Aisha source is too aggressively compressed for the interview stage");
assert.equal(crypto.createHash("sha256").update(decoded).digest("hex"), EXPECTED_SHA256, "Aisha no longer matches the user-approved visual master");
assert.equal(decoded[0], 0xff, "Aisha JPEG SOI marker missing");
assert.equal(decoded[1], 0xd8, "Aisha JPEG SOI marker missing");
assert.equal(decoded.at(-2), 0xff, "Aisha JPEG EOI marker missing");
assert.equal(decoded.at(-1), 0xd9, "Aisha JPEG EOI marker missing");

const interviewSource = await fs.readFile(path.resolve("src/InterviewPracticePage.jsx"), "utf8");
const avatarSource = await fs.readFile(path.resolve("src/AnimatedInterviewerAvatar.jsx"), "utf8");
const avatarCss = await fs.readFile(path.resolve("src/AnimatedInterviewerAvatar.css"), "utf8");
const responsiveCss = await fs.readFile(path.resolve("src/InterviewResponsiveReference.css"), "utf8");
const interviewCss = await fs.readFile(path.resolve("src/InterviewPracticePage.css"), "utf8");

assert.match(interviewSource, /function scrollInterviewToTop\(\)/, "Interviewer must explicitly reset the viewport to the top");
assert.match(interviewSource, /\[stage, questionIndex\]/, "Viewport reset must run when interview stage/question changes");
assert.match(interviewSource, /recognition\.interimResults = true/, "Speech recognition must display interim speech instead of appearing muted");
assert.match(interviewSource, /recognition\.continuous = !appleMobile/, "Apple mobile speech recognition must use restartable short sessions");
assert.match(interviewSource, /primeMicrophonePermission/, "Interviewer must prime microphone permission on mobile");
assert.match(interviewSource, /role="dialog"/, "Per-question feedback must render as a modal dialog");
assert.match(interviewSource, /"Continue"/, "Per-question feedback must wait for an explicit Continue action");
assert.match(avatarSource, /src=\{AISHA_PORTRAIT_DATA_URI\}/, "Both Aisha paint layers must use the approved portrait source");
assert.doesNotMatch(avatarSource, /aisha-jordan-interviewer\.jpg/, "Compressed legacy JPEG must not be the live Aisha source");
assert.match(avatarCss, /\.aisha-stage-photo\{[^}]*transform:none!important;[^}]*filter:none!important;/, "Base portrait must stay static to avoid Safari transform softening");
assert.doesNotMatch(avatarCss, /\.aisha-stage-photo\.state-(speaking|listening|encouraging)[^{]*\{[^}]*animation:/, "Whole Aisha portrait must never animate; only the mouth region may move");
assert.match(avatarCss, /clip-path:ellipse\(5\.8% 3\.3% at 51\.4% 44\.7%\)/, "Speaking overlay must remain tightly isolated to Aisha's mouth");
assert.doesNotMatch(responsiveCss, /background-image\s*:\s*url\([^)]*aisha-jordan-interviewer/i, "Low-quality Aisha background duplicates must not be painted behind the master portrait");
assert.match(responsiveCss, /aspect-ratio:\s*816\s*\/\s*551/, "Desktop/tablet stage should preserve the approved portrait composition");
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
createRoot(document.getElementById("root")).render(<div className="interview-video-stage" style={{width:"816px"}}><div className="virtual-interviewer animated-interviewer-host"><AnimatedInterviewerAvatar state="speaking" /></div></div>);
(async()=>{for(let i=0;i<80;i++){const stage=document.querySelector(".interview-video-stage");const image=document.querySelector(".aisha-stage-photo");const mouth=document.querySelector(".aisha-mouth-open-shape");if(stage&&image&&mouth){try{await image.decode();const sr=stage.getBoundingClientRect();const ir=image.getBoundingClientRect();const style=getComputedStyle(image);const mouthStyle=getComputedStyle(mouth);const bg=getComputedStyle(stage).backgroundImage;const ok=image.naturalWidth===816&&image.naturalHeight===551&&ir.width>=sr.width*.99&&ir.height>=sr.height*.99&&style.transform==="none"&&style.filter==="none"&&style.visibility==="visible"&&Number(style.opacity)>.99&&image.currentSrc.startsWith("data:image/jpeg;base64,")&&mouthStyle.animationName.includes("aisha-mouth-open")&&bg==="none";document.body.dataset.aishaResult=ok?"ok":"fail";document.body.dataset.aishaDetails=[image.naturalWidth,image.naturalHeight,Math.round(sr.width),Math.round(sr.height),style.transform,style.filter,bg,mouthStyle.animationName].join(":");return;}catch(e){document.body.dataset.aishaResult="decode-error";return;}}await new Promise(r=>setTimeout(r,50));}document.body.dataset.aishaResult="missing";})();
`);

const server = await createServer({ root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 41739, strictPort: true } });
try {
  await server.listen();
  const run = await runProcess(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=6000", "--dump-dom", "http://127.0.0.1:41739/scripts/.aisha-browser-harness.html"]);
  assert.equal(run.status, 0, `Headless browser failed: ${run.stderr || run.stdout}`);
  assert.match(run.stdout, /data-aisha-result="ok"/, `Aisha browser quality contract failed: ${run.stdout.slice(-1800)}`);
  assert.match(run.stdout, /data-aisha-details="816:551:/, "Browser did not decode the approved 816x551 Aisha master");
} finally {
  await server.close();
  await Promise.allSettled([fs.unlink(harnessHtml), fs.unlink(harnessJsx)]);
}

console.log(`Aisha verified: approved ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}, ${EXPECTED_BYTES} bytes, static full portrait, isolated mouth motion, no compressed background duplicates.`);
