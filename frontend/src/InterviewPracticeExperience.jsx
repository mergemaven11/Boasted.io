import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AnimatedInterviewerAvatar from "./AnimatedInterviewerAvatar.jsx";
import InterviewPracticePage from "./InterviewPracticePage.jsx";
import "./AnimatedInterviewerAvatar.css";
import "./InterviewPracticeZoomLayout.css";
import "./InterviewExperienceV3.css";

function inferAvatarState() {
  if (window.speechSynthesis?.speaking) return "speaking";
  if (document.querySelector(".dictation-button.active")) return "listening";
  if (document.querySelector(".follow-up-card")) return "encouraging";
  if (document.querySelector(".answer-feedback-panel")) return "thinking";
  return "idle";
}

function pickSofterVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const preferred = ["Samantha", "Ava", "Serena", "Karen", "Moira", "Tessa", "Microsoft Aria", "Google US English"];
  return preferred.map((name) => voices.find((voice) => voice.name.includes(name) && voice.lang?.startsWith("en"))).find(Boolean)
    || voices.find((voice) => voice.lang?.startsWith("en-US") && /female|natural|enhanced|premium/i.test(voice.name))
    || voices.find((voice) => voice.lang?.startsWith("en"))
    || null;
}

function useGreetingAndVoicePolish() {
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth?.speak) return undefined;
    const originalSpeak = synth.speak.bind(synth);
    let greeted = false;

    const tune = (utterance) => {
      const voice = pickSofterVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      utterance.pitch = 1.02;
      utterance.volume = 0.92;
      return utterance;
    };

    const wrappedSpeak = (utterance) => {
      const inInterview = Boolean(document.querySelector(".interview-room-page"));
      if (inInterview && !greeted) {
        greeted = true;
        const greeting = tune(new SpeechSynthesisUtterance("Hi, I’m Aisha Jordan, your BragStack interviewer. I’ll ask one question at a time. Take a moment to think, answer naturally, and I’ll give you specific coaching after each response. Let’s get started."));
        greeting.onend = () => originalSpeak(tune(utterance));
        greeting.onerror = () => originalSpeak(tune(utterance));
        originalSpeak(greeting);
        return;
      }
      originalSpeak(tune(utterance));
    };

    try {
      synth.speak = wrappedSpeak;
    } catch {
      return undefined;
    }
    return () => {
      try { synth.speak = originalSpeak; } catch { /* browser owns this method */ }
    };
  }, []);
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
      <div className="animated-avatar-caption" aria-hidden="true"><strong>Aisha Jordan</strong><span>Senior Technical Recruiter</span></div>
    </>,
    host,
  );
}

function InterviewSidebarPortal() {
  const [host, setHost] = useState(null);
  const [snapshot, setSnapshot] = useState({ role: "Target role", progress: "Question 1", timer: "", feedback: [] });

  useEffect(() => {
    const sync = () => {
      const nextHost = document.querySelector(".interview-room-grid");
      setHost((current) => current === nextHost ? current : nextHost);
      const role = document.querySelector(".interview-room-header span")?.textContent?.trim() || "Target role";
      const progress = document.querySelector(".question-progress span")?.textContent?.trim() || "Question 1";
      const timer = document.querySelector(".response-timer")?.textContent?.trim() || "";
      const feedback = [...document.querySelectorAll(".feedback-dimensions article")].slice(0, 4).map((node) => ({
        name: node.querySelector("strong")?.textContent?.trim() || "Coaching",
        score: node.querySelector("span")?.textContent?.trim() || "Live",
      }));
      setSnapshot({ role, progress, timer, feedback });
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const interval = window.setInterval(sync, 500);
    return () => { observer.disconnect(); window.clearInterval(interval); };
  }, []);

  if (!host) return null;
  return createPortal(
    <aside className="interview-right-sidebar" aria-label="Interview context and coaching">
      <section className="interview-side-card"><div className="interview-side-heading"><strong>Interview Context</strong><span>Live</span></div><small>Target Role</small><b>{snapshot.role}</b><small>Response Time</small><b>{snapshot.timer || "Starts after Aisha finishes speaking"}</b></section>
      <section className="interview-side-card interviewer-profile-card"><div className="interview-side-heading"><strong>Interviewer</strong><span>●</span></div><b>Aisha Jordan</b><small>Senior Technical Recruiter</small><p>“I’m looking for clear examples, your personal contribution, and the result.”</p></section>
      <section className="interview-side-card"><div className="interview-side-heading"><strong>Real-time Coaching</strong><span className="live-dot">● Live</span></div>{snapshot.feedback.length ? snapshot.feedback.map((item) => <div className="side-coaching-row" key={item.name}><span>{item.name}</span><b>{item.score}</b></div>) : <><div className="side-coaching-row"><span>Structure (STAR)</span><b>Listening</b></div><div className="side-coaching-row"><span>Specificity</span><b>Listening</b></div><div className="side-coaching-row"><span>Impact</span><b>Listening</b></div><div className="side-coaching-row"><span>Confidence</span><b>Listening</b></div></>}</section>
      <section className="interview-side-card"><div className="interview-side-heading"><strong>Session Progress</strong></div><b>{snapshot.progress}</b><div className="sidebar-progress-track"><i /></div></section>
    </aside>,
    host,
  );
}

export default function InterviewPracticeExperience() {
  useGreetingAndVoicePolish();
  return <><InterviewPracticePage /><AvatarPortal /><InterviewSidebarPortal /></>;
}
