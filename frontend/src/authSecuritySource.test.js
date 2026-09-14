import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("./AuthPage.jsx", import.meta.url), "utf8");

test("new and reset passwords use the 12-character policy", () => {
  assert.match(source, /const PASSWORD_MIN_LENGTH = 12;/);
  assert.match(source, /formData\.password\.length < PASSWORD_MIN_LENGTH/);
  assert.match(source, /newPassword\.length < PASSWORD_MIN_LENGTH/);
  assert.match(source, /minLength=\{PASSWORD_MIN_LENGTH\}/);
});

test("login remains compatible with existing password hashes", () => {
  assert.match(source, /minLength=\{isRegister \? PASSWORD_MIN_LENGTH : 1\}/);
});
