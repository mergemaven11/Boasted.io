import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";
import InterviewPracticePage from "./InterviewPracticePage.jsx";
import "./AnimatedInterviewerAvatar.css";
import "./InterviewPracticeZoomLayout.css";
import "./InterviewExperienceV3.css";
import "./InterviewResponsiveReference.css";

function getInterviewerTitle(roleTitle = "", careerArea = "") {
  const value = ` ${roleTitle} ${careerArea} `.toLowerCase();
  const has = (...terms) => terms.some((term) => value.includes(term));

  if (has("nurse", "nursing", "registered nurse", "nurse practitioner", " lpn ", " rn ")) return "Senior Nursing Recruiter";
  if (has("physician", "doctor", "medical", "clinical", "healthcare", "health care", "pharmacy", "therapist", "radiology", "allied health")) return "Senior Healthcare Recruiter";
  if (has("software", "developer", "engineer", "engineering", "devops", "platform", "cloud", "sre", "site reliability", "cyber", "security", "data", "database", "network", "systems", "technical", "information technology", "support engineer")) return "Senior Technical Recruiter";
  if (has("finance", "financial", "accounting", "accountant", "banking", "investment", "audit")) return "Senior Finance Recruiter";
  if (has("product manager", "product management", "product owner", "product design")) return "Senior Product Recruiter";
  if (has("project manager", "program manager", "program management", "pmo")) return "Senior Program Recruiter";
  if (has("marketing", "brand", "content strategist", "seo", "communications")) return "Senior Marketing Recruiter";
  if (has("sales", "account executive", "business development", "customer success")) return "Senior Sales Recruiter";
  if (has("legal", "attorney", "lawyer", "paralegal", "compliance")) return "Senior Legal Recruiter";
  if (has("teacher", "education", "educator", "professor", "school", "instructional")) return "Senior Education Recruiter";
  if (has("operations", "supply chain", "logistics", "warehouse", "procurement")) return "Senior Operations Recruiter";
  if (has("electrician", "plumber", "mechanic", "welder", "construction", "hvac", "technician")) return "Senior Skilled Trades Recruiter";
  if (has("human resources", " hr ", "recruiter", "talent", "people operations")) return "Senior People & Talent Recruiter";
  return "Senior Career Recruiter";
}

function parseProgress(progressText = "") {
  const match = String(progressText).match(/Question\s+(\d+)\s+of\s+(\d+)/i);
  if (!match) return { current: 1, total: 1, percent: 0 };
  const current = Math.max(1, Number(match[1]) || 1);
  const total = Math.max(current, Number(match[2]) || current);
  return { current, total, percent: Math.min(100, Math.round((current / total) * 100)) };
}

function InterviewSidebarPortal() {
  const [host, setHost] = useState(null);
  const [snapshot, setSnapshot] = useState({
    role: "Target role",
    interviewerTitle: "Senior Career Recruiter",
    progress: "Question 1 of 1",
    progressPercent: 0,
    timer: "",
    feedback: [],
  });

  useEffect(() => {
    const sync = () => {
      const nextHost = document.querySelector(".interview-room-grid");
      setHost((current) => current === nextHost ? current : nextHost);

      const setupRole = document.querySelector('input[name="roleTitle"]')?.value?.trim() || "";
      const setupCareerArea = document.querySelector('input[name="careerArea"]')?.value?.trim() || "";
      const role = document.querySelector(".interview-room-header span")?.textContent?.trim() || setupRole || "Target role";
      const interviewerTitle = getInterviewerTitle(role === "Target role" ? setupRole : role, setupCareerArea);
      const progress = document.querySelector(".question-progress span")?.textContent?.trim() || "Question 1 of 1";
      const progressInfo = parseProgress(progress);
      const timer = document.querySelector(".response-timer")?.textContent?.trim() || "";
      const feedback = [...document.querySelectorAll(".feedback-dimensions article")].slice(0, 4).map((node) => ({
        name: node.querySelector("strong")?.textContent?.trim() || "Coaching",
        score: node.querySelector("span")?.textContent?.trim() || "Live",
      }));

      document.querySelectorAll(".animated-avatar-caption span, .preview-interviewer-window strong").forEach((node) => {
        if (node.textContent !== interviewerTitle) node.textContent = interviewerTitle;
      });

      setSnapshot({
        role,
        interviewerTitle,
        progress,
        progressPercent: progressInfo.percent,
        timer,
        feedback,
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value"] });
    const interval = window.setInterval(sync, 300);
    return () => { observer.disconnect(); window.clearInterval(interval); };
  }, []);

  if (!host) return null;
  return createPortal(
    <aside className="interview-right-sidebar" aria-label="Interview context and coaching">
      <section className="interview-side-card"><div className="interview-side-heading"><strong>Interview Context</strong><span>Live</span></div><small>Target Role</small><b>{snapshot.role}</b><small>Response Time</small><b>{snapshot.timer || "Starts after AJ finishes speaking"}</b></section>
      <section className="interview-side-card interviewer-profile-card"><div className="interview-side-heading"><strong>Interviewer</strong><span>●</span></div><b>AJ</b><small>{snapshot.interviewerTitle}</small><p>“I’m looking for clear examples, your personal contribution, and the result.”</p></section>
      <section className="interview-side-card"><div className="interview-side-heading"><strong>Real-time Coaching</strong><span className="live-dot">● Live</span></div>{snapshot.feedback.length ? snapshot.feedback.map((item) => <div className="side-coaching-row" key={item.name}><span>{item.name}</span><b>{item.score}</b></div>) : <><div className="side-coaching-row"><span>Structure (STAR)</span><b>Listening</b></div><div className="side-coaching-row"><span>Specificity</span><b>Listening</b></div><div className="side-coaching-row"><span>Impact</span><b>Listening</b></div><div className="side-coaching-row"><span>Confidence</span><b>Listening</b></div></>}</section>
      <section className="interview-side-card"><div className="interview-side-heading"><strong>Session Progress</strong><span>{snapshot.progressPercent}%</span></div><b>{snapshot.progress}</b><div className="sidebar-progress-track"><i style={{ width: `${snapshot.progressPercent}%` }} /></div></section>
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
