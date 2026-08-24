import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AnimatedInterviewerAvatar from "./AnimatedInterviewerAvatar.jsx";
import InterviewPracticePage from "./InterviewPracticePage.jsx";
import "./AnimatedInterviewerAvatar.css";
import "./InterviewPracticeZoomLayout.css";

function inferAvatarState() {
  if (window.speechSynthesis?.speaking) return "speaking";
  if (document.querySelector(".dictation-button.active")) return "listening";
  if (document.querySelector(".follow-up-card")) return "encouraging";
  if (document.querySelector(".answer-feedback-panel")) return "thinking";
  return "idle";
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
  return <><InterviewPracticePage /><AvatarPortal /></>;
}
