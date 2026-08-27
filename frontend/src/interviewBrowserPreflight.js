const START_BUTTON_SELECTOR = "form.interview-setup-card .start-interview-button";

let installed = false;
let microphonePreflightPromise = null;

function isInterviewStartClick(target) {
  return Boolean(target?.closest?.(START_BUTTON_SELECTOR));
}

function stopStream(stream) {
  try {
    stream?.getTracks?.().forEach((track) => track.stop?.());
  } catch {
    // Permission priming must never block the interview.
  }
}

export function primeInterviewBrowserAudio({ navigatorObject, speechSynthesisObject, speechRecognitionAvailable = true } = {}) {
  try {
    speechSynthesisObject?.resume?.();
  } catch {
    // The interview page already owns spoken-audio fallback messaging.
  }

  if (!speechRecognitionAvailable) return Promise.resolve(false);

  const getUserMedia = navigatorObject?.mediaDevices?.getUserMedia;
  if (typeof getUserMedia !== "function") return Promise.resolve(false);

  if (!microphonePreflightPromise) {
    try {
      const request = getUserMedia.call(navigatorObject.mediaDevices, { audio: true, video: false });
      microphonePreflightPromise = Promise.resolve(request)
        .then((stream) => {
          stopStream(stream);
          return true;
        })
        .catch(() => false)
        .finally(() => {
          microphonePreflightPromise = null;
        });
    } catch {
      return Promise.resolve(false);
    }
  }

  return microphonePreflightPromise;
}

export function installInterviewBrowserPreflight({
  documentObject = typeof document !== "undefined" ? document : null,
  navigatorObject = typeof navigator !== "undefined" ? navigator : null,
  speechSynthesisObject = typeof window !== "undefined" ? window.speechSynthesis : null,
  speechRecognitionAvailable = typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
} = {}) {
  if (!documentObject?.addEventListener || installed) return () => {};

  const handleStartGesture = (event) => {
    if (!isInterviewStartClick(event?.target)) return;
    void primeInterviewBrowserAudio({ navigatorObject, speechSynthesisObject, speechRecognitionAvailable });
  };

  documentObject.addEventListener("click", handleStartGesture, true);
  installed = true;

  return () => {
    documentObject.removeEventListener?.("click", handleStartGesture, true);
    installed = false;
  };
}

export function __resetInterviewBrowserPreflightForTests() {
  installed = false;
  microphonePreflightPromise = null;
}
