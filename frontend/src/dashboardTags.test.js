import assert from "node:assert/strict";
import test from "node:test";

import { normalizeDashboardTags } from "./dashboardTags.js";

test("normalizes API tag summary objects without rendering objects as React children", () => {
  const apiShape = [
    { tag: "Docker", count: 4 },
    { tag: "FastAPI", count: 2 },
  ];

  assert.deepEqual(normalizeDashboardTags(apiShape), [
    ["Docker", 4],
    ["FastAPI", 2],
  ]);
});

test("preserves legacy tag-count maps for backward compatibility", () => {
  assert.deepEqual(normalizeDashboardTags({ Docker: 4, FastAPI: 2 }), [
    ["Docker", 4],
    ["FastAPI", 2],
  ]);
});

test("rejects malformed tag summary values safely", () => {
  assert.deepEqual(normalizeDashboardTags(null), []);
  assert.deepEqual(normalizeDashboardTags([null, { count: 2 }, "Docker"]), []);
});
