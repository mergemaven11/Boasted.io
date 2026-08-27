import assert from "node:assert/strict";
import test from "node:test";

import {
  __resetInterviewBrowserPreflightForTests,
  installInterviewBrowserPreflight,
  primeInterviewBrowserAudio,
} from "./interviewBrowserPreflight.js";

test("primes speech and microphone, then releases the temporary stream", async () => {
  __resetInterviewBrowserPreflightForTests();
  let resumed = 0;
  let requestedConstraints = null;
  let stopped = 0;

  const allowed = await primeInterviewBrowserAudio({
    navigatorObject: {
      mediaDevices: {
        getUserMedia: async (constraints) => {
          requestedConstraints = constraints;
          return { getTracks: () => [{ stop: () => { stopped += 1; } }] };
        },
      },
    },
    speechSynthesisObject: { resume: () => { resumed += 1; } },
  });

  assert.equal(allowed, true);
  assert.equal(resumed, 1);
  assert.deepEqual(requestedConstraints, { audio: true, video: false });
  assert.equal(stopped, 1);
});

test("starts the microphone preflight from the interview start click", async () => {
  __resetInterviewBrowserPreflightForTests();
  let clickHandler = null;
  let requested = 0;
  const documentObject = {
    addEventListener: (name, handler, capture) => {
      assert.equal(name, "click");
      assert.equal(capture, true);
      clickHandler = handler;
    },
    removeEventListener: () => {},
  };

  const cleanup = installInterviewBrowserPreflight({
    documentObject,
    navigatorObject: {
      mediaDevices: {
        getUserMedia: async () => {
          requested += 1;
          return { getTracks: () => [] };
        },
      },
    },
    speechSynthesisObject: { resume: () => {} },
  });

  assert.equal(typeof clickHandler, "function");
  clickHandler({ target: { closest: () => ({}) } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(requested, 1);
  cleanup();
});

test("ignores unrelated clicks", async () => {
  __resetInterviewBrowserPreflightForTests();
  let clickHandler = null;
  let requested = 0;

  installInterviewBrowserPreflight({
    documentObject: {
      addEventListener: (_name, handler) => { clickHandler = handler; },
      removeEventListener: () => {},
    },
    navigatorObject: {
      mediaDevices: {
        getUserMedia: async () => {
          requested += 1;
          return { getTracks: () => [] };
        },
      },
    },
  });

  clickHandler({ target: { closest: () => null } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(requested, 0);
});
