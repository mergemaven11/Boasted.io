import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";
import InterviewPracticePage from "./InterviewPracticePage.jsx";
import "./AnimatedInterviewerAvatar.css";
import "./InterviewPracticeZoomLayout.css";
import "./InterviewExperienceV3.css";
import "./InterviewResponsiveReference.css";

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

function InterviewExitGuard() {
  const [active, setActive] = useState(false);
  const [headerHost, setHeaderHost] = useState(null);
  const [pendingHref, setPendingHref] = useState("");
  const bypassRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      const nextActive = Boolean(document.querySelector(".interview-room-page"));
      setActive(nextActive);
      setHeaderHost(nextActive ? document.querySelector(".interview-room-header") : null);
      if (!nextActive) setPendingHref("");
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(sync, 300);
    return () => { observer.disconnect(); window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const beforeUnload = (event) => {
      if (bypassRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const interceptNavigation = (event) => {
      if (bypassRef.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      const rawHref = anchor.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(destination.href);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", interceptNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", interceptNavigation, true);
    };
  }, [active]);

  const requestEnd = () => setPendingHref(`${window.location.origin}/app`);
  const keepInterview = () => setPendingHref("");
  const confirmEnd = () => {
    bypassRef.current = true;
    window.speechSynthesis?.cancel?.();
    window.location.assign(pendingHref || "/app");
  };

  if (!active) return null;
  return <>
    {headerHost && createPortal(<button className="interview-end-button" type="button" onClick={requestEnd}><LogOut size={17} /> End Interview</button>, headerHost)}
    {pendingHref && createPortal(
      <div className="interview-exit-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) keepInterview(); }}>
        <section className="interview-exit-modal" role="dialog" aria-modal="true" aria-labelledby="interview-exit-title">
          <button className="interview-exit-close" type="button" onClick={keepInterview} aria-label="Keep interview open"><X size={18} /></button>
          <div className="interview-exit-icon"><LogOut size={24} /></div><span>INTERVIEW IN PROGRESS</span><h2 id="interview-exit-title">End this interview?</h2><p>Your current answer and remaining questions will be abandoned. You can stay and finish, or end the session now.</p>
          <div className="interview-exit-actions"><button className="secondary-interview-button" type="button" onClick={keepInterview}>Keep Interview</button><button className="interview-end-confirm" type="button" onClick={confirmEnd}>End Interview</button></div>
        </section>
      </div>, document.body)}
  </>;
}

export default function InterviewPracticeExperience() {
  return <><InterviewPracticePage /><InterviewSidebarPortal /><InterviewExitGuard /></>;
}
