import assert from "node:assert/strict";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { AISHA_PORTRAIT_DATA_URI } from "../src/aishaPortraitData.js";

const EXPECTED_SHA256 = "a4f88a5fc2bcd437256ca848f1529b120b6dc0af6df2937a552915fa877181a0";
const EXPECTED_BYTES = 14219;
const EXPECTED_WIDTH = 640;
const EXPECTED_HEIGHT = 431;

assert.ok(AISHA_PORTRAIT_DATA_URI.startsWith("data:image/jpeg;base64,"), "Aisha source must be an inline JPEG data URI");
const encoded = AISHA_PORTRAIT_DATA_URI.slice("data:image/jpeg;base64,".length);
const decoded = Buffer.from(encoded, "base64");
assert.equal(decoded.length, EXPECTED_BYTES, "Aisha data URI byte length changed or was truncated");
assert.equal(crypto.createHash("sha256").update(decoded).digest("hex"), EXPECTED_SHA256, "Aisha data URI does not decode to the verified portrait bytes");
assert.equal(decoded[0], 0xff, "Aisha JPEG SOI marker missing");
assert.equal(decoded[1], 0xd8, "Aisha JPEG SOI marker missing");
assert.equal(decoded.at(-2), 0xff, "Aisha JPEG EOI marker missing");
assert.equal(decoded.at(-1), 0xd9, "Aisha JPEG EOI marker missing");

const chromeCandidates = ["google-chrome", "chromium", "chromium-browser"];
const chrome = chromeCandidates.find((name) => spawnSync("which", [name], { encoding: "utf8" }).status === 0);
assert.ok(chrome, "A Chromium/Chrome binary is required for the Aisha browser verification");

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
  <div className="interview-video-stage" style={{ width: "640px", height: "400px" }}>
    <div className="virtual-interviewer animated-interviewer-host">
      <AnimatedInterviewerAvatar state="speaking" />
    </div>
  </div>
);

(async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const stage = document.querySelector(".interview-video-stage");
    const image = document.querySelector(".aisha-stage-photo");
    if (stage && image) {
      try {
        await image.decode();
        const stageRect = stage.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        const fullStage = imageRect.width >= stageRect.width * 0.95 && imageRect.height >= stageRect.height * 0.95;
        const visible = style.display !== "none" && style.visibility === "visible" && Number(style.opacity) > 0.99;
        const inlineSource = image.currentSrc.startsWith("data:image/jpeg;base64,");
        const dimensions = image.naturalWidth === ${EXPECTED_WIDTH} && image.naturalHeight === ${EXPECTED_HEIGHT};
        const ok = fullStage && visible && inlineSource && dimensions;
        document.body.dataset.aishaResult = ok ? "ok" : "fail";
        document.body.dataset.aishaDetails = [image.naturalWidth, image.naturalHeight, Math.round(imageRect.width), Math.round(imageRect.height), style.display, style.visibility, style.opacity, inlineSource].join(":");
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
  const run = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--virtual-time-budget=6000",
    "--dump-dom",
    "http://127.0.0.1:41739/scripts/.aisha-browser-harness.html",
  ], { encoding: "utf8", timeout: 30000 });
  assert.equal(run.status, 0, `Headless browser failed: ${run.stderr || run.stdout}`);
  assert.match(run.stdout, /data-aisha-result="ok"/, `Aisha did not render correctly in the real browser harness: ${run.stdout.slice(-2000)}`);
  assert.match(run.stdout, new RegExp(`data-aisha-details="${EXPECTED_WIDTH}:${EXPECTED_HEIGHT}:`), "Browser did not decode the verified full portrait dimensions");
} finally {
  await server.close();
  await Promise.allSettled([fs.unlink(harnessHtml), fs.unlink(harnessJsx)]);
}

console.log(`Aisha source verified: ${decoded.length} bytes, SHA-256 ${EXPECTED_SHA256}, ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}, real-browser full-stage render OK.`);
