import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import axios from "axios";
import { ANALYTICS_EVENTS } from "./analytics.js";
import { trackPublicProfileEvent } from "./publicAnalytics.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

const originalPost = axios.post;

function installBrowserFakes() {
  globalThis.window = {
    location: new URL("https://boasted.io/brag/private-profile-slug"),
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
  };
  globalThis.document = {
    referrer: "https://www.linkedin.com/feed/",
    createElement() {
      return { async: false, src: "", dataset: {} };
    },
    head: {
      appendChild(node) {
        return node;
      },
    },
  };
}

function productEvents() {
  return (window.dataLayer || []).filter((entry) => entry[0] === "event");
}

describe("public profile analytics", () => {
  beforeEach(() => {
    installBrowserFakes();
  });

  afterEach(() => {
    axios.post = originalPost;
    delete globalThis.window;
    delete globalThis.document;
  });

  it("emits the product profile-view event only after first-party tracking succeeds", async () => {
    const requests = [];
    axios.post = async (...args) => {
      requests.push(args);
      return { data: {} };
    };

    await trackPublicProfileEvent("private-profile-slug", "profile_view");

    assert.equal(requests.length, 1);
    assert.match(requests[0][0], /\/public\/brag\/private-profile-slug\/analytics$/);
    assert.equal(requests[0][1].event_type, "profile_view");

    const event = productEvents().find((entry) => entry[1] === ANALYTICS_EVENTS.PUBLIC_PROFILE_VIEWED);
    assert.ok(event);
    assert.doesNotMatch(JSON.stringify(event[2]), /private-profile-slug/);
    assert.doesNotMatch(JSON.stringify(event[2]), /linkedin\.com/);
  });

  it("does not translate unrelated public-profile interaction events into GA product events", async () => {
    axios.post = async () => ({ data: {} });

    await trackPublicProfileEvent("private-profile-slug", "github_click");

    assert.equal(productEvents().length, 0);
  });

  it("does not count a product profile view when first-party tracking fails", async () => {
    axios.post = async () => {
      throw new Error("analytics endpoint unavailable");
    };

    await trackPublicProfileEvent("private-profile-slug", "profile_view");

    assert.equal(productEvents().length, 0);
  });
});
