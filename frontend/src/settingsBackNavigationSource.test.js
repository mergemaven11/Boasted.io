import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const SETTINGS_DESTINATIONS = [
  ["Profile", "./ProfilePage.jsx"],
  ["Integrations", "./CalendarIntegrationsPage.jsx"],
  ["Profile appearance", "./AppearanceSettingsPage.jsx"],
  ["Plan & billing", "./BillingSettingsPage.jsx"],
];

test("every active Settings destination offers a direct way back to Settings", () => {
  for (const [label, path] of SETTINGS_DESTINATIONS) {
    const source = read(path);
    assert.match(source, /href="\/app\/settings"/, `${label} must link directly back to Settings`);
    assert.match(source, /ArrowLeft/, `${label} must show a visible back affordance`);
  }
});
