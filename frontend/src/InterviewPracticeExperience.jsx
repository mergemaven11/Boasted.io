import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AnimatedInterviewerAvatar from "./AnimatedInterviewerAvatar.jsx";
import InterviewPracticePage from "./InterviewPracticePage.jsx";
import "./AnimatedInterviewerAvatar.css";
import "./InterviewPracticeZoomLayout.css";
import "./InterviewExperienceV3.css";

const SOFT_VOICE_HINTS = ["samantha", "ava", "aria", "serena", "moira", "tessa", "karen", "susan", "zira", "google us english"];

function chooseSoftEnglishVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const english = voices.filter((voice) => /^en[-_]/i.test(voice.lang || ""));
  return SOFT_VOICE_HINTS.map((hint) => english.find((voice) => voice.name.toLowerCase().includes(hint))).find(Boolean) || english.find((voice) => voice.localService) || english[0] || null;
}

function inferAvatarState() {
  if (window.speechSynthesis?.speaking) return "speaking";
  if (document.querySelector(".dictation-button.active")) return "listening";
  if (document.querySelector(".follow-up-card")) return "encouraging";
  if (document.querySelector(".answer-feedback-panel")) return "thinking";
  return "idle";
}

function NaturalVoiceTuning() {
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth?.speak) return undefined;
    const originalSpeak = synth.speak.bind(synth);
    const tunedSpeak = (utterance) => {
      if (utterance instanceof SpeechSynthesisUtterance) {
        const voice = chooseSoftEnglishVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 0.9;
        utterance.pitch = 0.96;
        utterance.volume = 0.9;
      }
      return originalSpeak(utterance);
    };
    try { synth.speak = tunedSpeak; } catch { return undefined; }
    return () => { try { synth.speak = originalSpeak; } catch { /* browser may lock this property */ } };
  }, []);
  return null;
}

function AvatarPortal() {
  const [host, setHost] = useState(null);
  const [state, setState] = useState("idle");
  const reducedMotion = useMemo(() => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false, []);

  useEffect(() => {
    document.body.classList.add("animated-interviewer-enabled");
    const sync = () => {
      const nextHost = document.querySelector(".virtual-interviewer");
      setHost((current) => current === nextHost ? current : nextHost);
      setState(inferAvatarState());
    };
    sync();
    const interval = window.setInterval(sync, 180);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      window.clearInterval(interval);
      observer.disconnect();
      document.body.classList.remove("animated-interviewer-enabled");
    };
  }, []);

  if (!host) return null;
  return createPortal(
    <>
      <AnimatedInterviewerAvatar state={state} reducedMotion={reducedMotion} />
      <div className="animated-avatar-caption" aria-hidden="true"><strong>Aisha Jordan</strong><span>BragStack virtual interviewer</span></div>
    </>,
    host,
  );
}

export default function InterviewPracticeExperience() {
  return <><NaturalVoiceTuning /><InterviewPracticePage /><AvatarPortal /></>;
}
