import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const interviewSource = await fs.readFile(path.resolve("src/InterviewPracticePage.jsx"), "utf8");
const avatarSource = await fs.readFile(path.resolve("src/AnimatedInterviewerAvatar.jsx"), "utf8");
const avatarCss = await fs.readFile(path.resolve("src/AnimatedInterviewerAvatar.css"), "utf8");

assert.match(interviewSource, /function scrollInterviewToTop\(\)/, "Interviewer must explicitly reset the viewport to the top");
assert.match(interviewSource, /recognition\.interimResults = true/, "Speech recognition must display interim speech instead of appearing muted");
assert.match(interviewSource, /recognition\.continuous = !appleMobile/, "Apple mobile speech recognition must use restartable short sessions");
assert.match(interviewSource, /primeMicrophonePermission/, "Interviewer must prime microphone permission on mobile");
assert.match(interviewSource, /role="dialog"/, "Per-question feedback must render as a modal dialog");

assert.match(avatarSource, /data-avatar-engine="bragstack-photo-v2"/, "Aisha must identify the photographic interviewer engine");
assert.match(avatarSource, /aisha-jordan-interviewer\.jpg/, "Aisha must render the approved photographic interviewer asset");
assert.match(avatarSource, /className="aisha-photo-avatar"/, "Aisha must expose the photographic stage image");
assert.match(avatarSource, /data-aisha-state=\{safeState\}/, "Aisha must expose interview state to the browser");
assert.doesNotMatch(avatarSource, /<svg|aisha-vector-avatar|aisha-mouth-opening/, "The retired vector/mouth animation renderer must not return");
assert.match(avatarCss, /object-fit:cover/, "Photographic Aisha must fill the interview stage cleanly");
assert.match(avatarCss, /prefers-reduced-motion:reduce/, "Aisha status motion must respect reduced-motion preferences");

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
createRoot(document.getElementById("root")).render(<div className="interview-video-stage" style={{width:"816px"}}><div className="virtual-interviewer animated-interviewer-host"><AnimatedInterviewerAvatar state="speaking" /></div></div>);
const verify=()=>{const stage=document.querySelector(".interview-video-stage");const shell=document.querySelector(".aisha-avatar-shell");const photo=document.querySelector(".aisha-photo-avatar");const sr=stage?.getBoundingClientRect();const ar=shell?.getBoundingClientRect();const src=photo?.getAttribute("src")||"";const ok=Boolean(stage&&shell&&photo&&sr&&ar&&ar.width>=sr.width*.99&&ar.height>=sr.height*.99&&shell.getAttribute("data-avatar-engine")==="bragstack-photo-v2"&&shell.getAttribute("data-aisha-state")==="speaking"&&src.includes("aisha-jordan-interviewer.jpg")&&!document.querySelector(".aisha-vector-avatar,.aisha-mouth-opening"));document.body.dataset.aishaResult=ok?"ok":"fail";document.body.dataset.aishaDetails=[Math.round(sr?.width||0),Math.round(sr?.height||0),Math.round(ar?.width||0),Math.round(ar?.height||0),shell?.getAttribute("data-aisha-state")].join(":");};
requestAnimationFrame(()=>requestAnimationFrame(verify));
`);

const server = await createServer({ root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 41739, strictPort: true } });
try {
  await server.listen();
  const run = await runProcess(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=3000", "--dump-dom", "http://127.0.0.1:41739/scripts/.aisha-browser-harness.html"]);
  assert.equal(run.status, 0, `Headless browser failed: ${run.stderr || run.stdout}`);
  assert.match(run.stdout, /data-aisha-result="ok"/, `Aisha photographic browser contract failed: ${run.stdout.slice(-1800)}`);
  assert.match(run.stdout, /data-aisha-details="[0-9]+:[0-9]+:[0-9]+:[0-9]+:speaking"/, "Aisha browser contract must report stage fill and speaking state");
} finally {
  await server.close();
  await Promise.allSettled([fs.unlink(harnessHtml), fs.unlink(harnessJsx)]);
}

console.log("Aisha verified: approved photographic interviewer, responsive stage fill, interview state, and no retired vector mouth renderer.");
