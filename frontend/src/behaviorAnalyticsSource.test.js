import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const publicProfile = readFileSync(new URL("./PublicBragPage.jsx", import.meta.url), "utf8");
const packetPreview = readFileSync(new URL("./PerformancePacketPreview.jsx", import.meta.url), "utf8");

function position(source, needle) {
  const index = source.indexOf(needle);
  assert.ok(index >= 0, `Expected source to contain: ${needle}`);
  return index;
}

test("public profile sharing is recorded only after a successful native share or clipboard copy", () => {
  const nativeSuccess = position(publicProfile, "await navigator.share(shareData);");
  const nativeEvent = position(publicProfile, 'trackAnalyticsEvent(ANALYTICS_EVENTS.PROFILE_SHARED, { share_method: "native" });');
  const clipboardSuccess = position(publicProfile, "await navigator.clipboard.writeText(url);");
  const clipboardEvent = position(publicProfile, 'trackAnalyticsEvent(ANALYTICS_EVENTS.PROFILE_SHARED, { share_method: "clipboard" });');
  const promptFallback = position(publicProfile, 'window.prompt("Copy this Proof Portfolio share link:", url);');

  assert.ok(nativeEvent > nativeSuccess, "native sharing must resolve before analytics is emitted");
  assert.ok(clipboardEvent > clipboardSuccess, "clipboard writing must resolve before analytics is emitted");
  assert.ok(promptFallback > clipboardEvent, "the unverified prompt fallback must not be counted as a successful share");
  assert.match(publicProfile, /if \(error\?\.name !== "AbortError"\)/, "cancelled native shares must remain non-events");
});

test("career packet export and proof reuse are recorded only after a successful non-empty export", () => {
  const download = position(packetPreview, "await downloadCareerPacket(packet, format);");
  const nonEmptyGuard = position(packetPreview, 'if (!blob || Number(blob.size || 0) === 0) throw new Error("The generated file was empty.");');
  const exportEvent = position(packetPreview, "ANALYTICS_EVENTS.CAREER_PACKET_EXPORTED");
  const reuseGuard = position(packetPreview, "if (savedProofCount > 0)");
  const reuseEvent = position(packetPreview, "ANALYTICS_EVENTS.EXISTING_PROOF_REUSED");

  assert.ok(nonEmptyGuard > download, "empty packet responses must fail before analytics");
  assert.ok(exportEvent > nonEmptyGuard, "packet export analytics must follow the non-empty response guard");
  assert.ok(reuseGuard > exportEvent, "proof reuse must be evaluated after a successful export");
  assert.ok(reuseEvent > reuseGuard, "reuse analytics must remain inside the saved-proof guard");
});

test("behavior analytics sends structural metadata rather than career content", () => {
  assert.match(publicProfile, /PROFILE_SHARED, \{ share_method: "native" \}/);
  assert.match(publicProfile, /PROFILE_SHARED, \{ share_method: "clipboard" \}/);
  assert.match(packetPreview, /CAREER_PACKET_EXPORTED, \{ packet_kind: packetKind, format \}/);
  assert.match(packetPreview, /EXISTING_PROOF_REUSED, \{ reuse_type: "career_packet", packet_kind: packetKind, format \}/);

  const expectedEventCalls = [
    '{ share_method: "native" }',
    '{ share_method: "clipboard" }',
    '{ packet_kind: packetKind, format }',
    '{ reuse_type: "career_packet", packet_kind: packetKind, format }',
  ];
  for (const call of expectedEventCalls) {
    assert.doesNotMatch(call, /(slug|url|filename|title|employer|organization|evidence|accomplishment|subject)/i);
  }
});
