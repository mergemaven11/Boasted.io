import { useEffect, useState } from "react";
import {
  AISHA_PORTRAIT_DATA_URI,
  AISHA_PORTRAIT_HEIGHT,
  AISHA_PORTRAIT_WIDTH,
} from "./aishaPortraitData.js";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

const BASE_PHOTO_STYLE = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center 42%",
  opacity: 1,
  visibility: "visible",
  pointerEvents: "none",
  imageRendering: "auto",
  backfaceVisibility: "hidden",
};

function installReliableSpeechRecognition(onBlockingError) {
  const NativeRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!NativeRecognition || window.__bragstackNativeSpeechRecognition) return () => {};

  const transientErrors = new Set(["no-speech", "aborted"]);
  const WrappedRecognition = new Proxy(NativeRecognition, {
    construct(Target, args) {
      const native = Reflect.construct(Target, args);
      return new Proxy(native, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
        set(target, property, value) {
          // iOS/WebKit is substantially more reliable with short recognition
          // sessions. InterviewPracticePage already restarts sessions on end.
          if (property === "continuous") return Reflect.set(target, property, false, target);
          if (property === "onerror" && typeof value === "function") {
            return Reflect.set(target, property, (event) => {
              if (transientErrors.has(event?.error)) return;
              if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event?.error)) {
                onBlockingError(event.error);
              }
              value(event);
            }, target);
          }
          return Reflect.set(target, property, value, target);
        },
      });
    },
  });

  window.__bragstackNativeSpeechRecognition = NativeRecognition;
  if (window.SpeechRecognition) window.SpeechRecognition = WrappedRecognition;
  if (window.webkitSpeechRecognition) window.webkitSpeechRecognition = WrappedRecognition;

  return () => {
    const original = window.__bragstackNativeSpeechRecognition;
    if (!original) return;
    if (window.SpeechRecognition === WrappedRecognition) window.SpeechRecognition = original;
    if (window.webkitSpeechRecognition === WrappedRecognition) window.webkitSpeechRecognition = original;
    delete window.__bragstackNativeSpeechRecognition;
  };
}

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  const motionClass = reducedMotion ? "reduced-motion" : "";
  const [microphoneIssue, setMicrophoneIssue] = useState("");

  useEffect(() => {
    const resetViewport = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    resetViewport();
    const frame = window.requestAnimationFrame(resetViewport);
    const uninstallRecognition = installReliableSpeechRecognition((error) => {
      setMicrophoneIssue(error === "audio-capture"
        ? "BragStack cannot access a microphone. Check that a microphone is available, then tap Speak answer."
        : "Microphone permission is blocked. Allow microphone access for BragStack in your browser settings, then tap Speak answer.");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      uninstallRecognition();
    };
  }, []);

  return (
    <>
      <img
        className={`aisha-stage-photo state-${safeState} ${motionClass}`}
        src={AISHA_PORTRAIT_DATA_URI}
        width={AISHA_PORTRAIT_WIDTH}
        height={AISHA_PORTRAIT_HEIGHT}
        alt={`${name}, BragStack virtual interviewer`}
        draggable="false"
        decoding="async"
        fetchPriority="high"
        style={{ ...BASE_PHOTO_STYLE, zIndex: 1 }}
      />

      <span className={`aisha-mouth-open-shape state-${safeState} ${motionClass}`} aria-hidden="true" />
      <img
        className={`aisha-mouth-photo state-${safeState} ${motionClass}`}
        src={AISHA_PORTRAIT_DATA_URI}
        width={AISHA_PORTRAIT_WIDTH}
        height={AISHA_PORTRAIT_HEIGHT}
        alt=""
        aria-hidden="true"
        draggable="false"
        decoding="async"
        style={{ ...BASE_PHOTO_STYLE, zIndex: 3 }}
      />

      <div className="aisha-photo-vignette" aria-hidden="true" />
      <div className={`aisha-speaking-glow state-${safeState}`} aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`}>
        <span className="avatar-state-dot" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
      {microphoneIssue && <div role="alert" style={{ position: "absolute", zIndex: 20, left: 16, right: 16, top: 16, padding: "10px 12px", borderRadius: 10, background: "rgba(127,29,29,.94)", color: "#fee2e2", fontSize: ".78rem", lineHeight: 1.45 }}>{microphoneIssue}</div>}
    </>
  );
}
