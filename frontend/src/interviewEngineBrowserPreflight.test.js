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
    speechRecognitionAvailable: true,
  });

  assert.equal(allowed, true);
  assert.equal(resumed, 1);
  assert.deepEqual(requestedConstraints, { audio: true, video: false });
  assert.equal(stopped, 1);
});

test("starts the microphone preflight from the validated interview submit", async () => {
  __resetInterviewBrowserPreflightForTests();
  let submitHandler = null;
  let requested = 0;
  const documentObject = {
    addEventListener: (name, handler, capture) => {
      assert.equal(name, "submit");
      assert.equal(capture, true);
      submitHandler = handler;
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
    speechRecognitionAvailable: true,
  });

  assert.equal(typeof submitHandler, "function");
  submitHandler({ target: { matches: () => true } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(requested, 1);
  cleanup();
});

test("does not ask for microphone access when speech recognition is unavailable", async () => {
  __resetInterviewBrowserPreflightForTests();
  let requested = 0;
  let resumed = 0;

  const allowed = await primeInterviewBrowserAudio({
    navigatorObject: {
      mediaDevices: {
        getUserMedia: async () => {
          requested += 1;
          return { getTracks: () => [] };
        },
      },
    },
    speechSynthesisObject: { resume: () => { resumed += 1; } },
    speechRecognitionAvailable: false,
  });

  assert.equal(allowed, false);
  assert.equal(resumed, 1);
  assert.equal(requested, 0);
});

test("ignores unrelated form submits", async () => {
  __resetInterviewBrowserPreflightForTests();
  let submitHandler = null;
  let requested = 0;

  installInterviewBrowserPreflight({
    documentObject: {
      addEventListener: (_name, handler) => { submitHandler = handler; },
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
    speechRecognitionAvailable: true,
  });

  submitHandler({ target: { matches: () => false, closest: () => null } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(requested, 0);
});
