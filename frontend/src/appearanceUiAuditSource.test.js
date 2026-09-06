import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appearance = readFileSync(new URL("./AppearanceSettingsPage.jsx", import.meta.url), "utf8");
const previews = readFileSync(new URL("./FlowerLayoutPreviews.css", import.meta.url), "utf8");

test("flower previews are full-page landscape previews, not narrow device icons", () => {
  assert.match(previews, /aspect-ratio:16\/9/);
  assert.match(previews, /flower-layout-gallery\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(previews, /@media\(max-width:1024px\)/);
  assert.match(previews, /@media\(max-width:768px\)/);
  assert.match(previews, /@media\(max-width:600px\)/);
});

test("appearance controls expose keyboard focus and reduced-motion behavior", () => {
  assert.match(previews, /:focus-visible/);
  assert.match(previews, /prefers-reduced-motion:reduce/);
});

test("template and theme selection expose pressed state and visible feedback", () => {
  assert.match(appearance, /aria-pressed=\{selected\}/);
  assert.match(appearance, /flower-layout-selected/);
  assert.match(appearance, /Selected/);
});

test("appearance preview uses contrast-aware foreground colors", () => {
  assert.match(appearance, /getContrastText/);
  assert.match(appearance, /previewText/);
  assert.match(appearance, /previewButtonText/);
});

test("flower cards keep full names and descriptions readable", () => {
  assert.match(previews, /flower-layout-card strong\{[^}]*white-space:normal/);
  assert.match(previews, /flower-layout-card small\{[^}]*white-space:normal/);
  assert.doesNotMatch(previews, /flower-layout-card small\{[^}]*text-overflow:ellipsis/);
});
