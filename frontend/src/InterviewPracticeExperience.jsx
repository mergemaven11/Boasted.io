import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, CheckCircle2, LogOut, Mic, X } from "lucide-react";
import InterviewPracticePage from "./InterviewPracticePage.jsx";
import "./AnimatedInterviewerAvatar.css";
import "./InterviewPracticeZoomLayout.css";
import "./InterviewExperienceV3.css";
import "./InterviewResponsiveReference.css";
import "./InterviewReferenceLayout.css";
import "./InterviewHandoffBridge.css";

const RESUME_CONTEXT_KEY = "bragstack_resume_interview_context_v1";
const MEDIA_PRIMED_KEY = "bragstack_interview_media_primed_v1";
const INTERVIEW_PATH = "/app/interview-practice";
const INTERVIEWER_NAME = "Aisha Jordan";

function isInterviewPath() {
  return (window.location.pathname.replace(/\/$/, "") || "/") === INTERVIEW_PATH;
}

function brandInterviewerCopy(value = "") {
  return String(value).replace(/\bAJ\b/g, INTERVIEWER_NAME);
}

function brandInterviewDom(root = document) {
  const candidates = [];
  if (root?.matches?.(".interview-practice-page")) candidates.push(root);
  root?.querySelectorAll?.(".interview-practice-page").forEach((node) => candidates.push(node));
  if (root === document) document.querySelectorAll(".interview-practice-page").forEach((node) => candidates.push(node));

  [...new Set(candidates)].forEach((container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const current = node.nodeValue || "";
      const next = brandInterviewerCopy(current);
      if (next !== current) node.nodeValue = next;
      node = walker.nextNode();
    }
  });
}

function InterviewRuntimeSafetyBridge() {
  useEffect(() => {
    const synth = window.speechSynthesis;
    const previousSpeak = synth?.speak;
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const stopInterviewSpeech = () => {
      window.__bragstackInterviewActive = false;
      try { synth?.cancel?.(); } catch { /* ignore */ }
    };

    if (synth?.speak) {
      const brandedSpeak = function brandedSpeak(utterance) {
        if (!isInterviewPath() || !window.__bragstackInterviewActive) {
          try { synth.cancel?.(); } catch { /* ignore */ }
          return;
        }
        try {
          if (utterance?.text) utterance.text = brandInterviewerCopy(utterance.text);
        } catch {
          // Browser speech objects can expose read-only text in some implementations.
        }
        previousSpeak.call(synth, utterance);
      };
      synth.speak = brandedSpeak;
    }

    const stopForAnchorNavigation = (event) => {
      const anchor = event.target.closest?.("a[href]");
      if (!anchor) return;
      const rawHref = anchor.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if ((destination.pathname.replace(/\/$/, "") || "/") !== INTERVIEW_PATH) stopInterviewSpeech();
    };

    const stopForHistoryNavigation = (method, args) => {
      const target = args[2];
      if (target === undefined || target === null) return;
      try {
        const destination = new URL(String(target), window.location.href);
        if ((destination.pathname.replace(/\/$/, "") || "/") !== INTERVIEW_PATH) stopInterviewSpeech();
      } catch {
        stopInterviewSpeech();
      }
    };

    window.history.pushState = function pushState(...args) {
      stopForHistoryNavigation("pushState", args);
      return originalPushState.apply(this, args);
    };
    window.history.replaceState = function replaceState(...args) {
      stopForHistoryNavigation("replaceState", args);
      return originalReplaceState.apply(this, args);
    };

    const stopForRouteEvent = () => stopInterviewSpeech();
    const keepActiveWhileHere = () => {
      if (isInterviewPath()) window.__bragstackInterviewActive = true;
      else stopInterviewSpeech();
    };

    document.addEventListener("click", stopForAnchorNavigation, true);
    window.addEventListener("pagehide", stopForRouteEvent);
    window.addEventListener("beforeunload", stopForRouteEvent);
    window.addEventListener("popstate", stopForRouteEvent);
    window.addEventListener("bragstack:interview-teardown", stopForRouteEvent);

    brandInterviewDom(document);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) brandInterviewDom(node);
      }));
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const routeInterval = window.setInterval(keepActiveWhileHere, 120);

    return () => {
      observer.disconnect();
      window.clearInterval(routeInterval);
      document.removeEventListener("click", stopForAnchorNavigation, true);
      window.removeEventListener("pagehide", stopForRouteEvent);
      window.removeEventListener("beforeunload", stopForRouteEvent);
      window.removeEventListener("popstate", stopForRouteEvent);
      window.removeEventListener("bragstack:interview-teardown", stopForRouteEvent);
      if (synth?.speak && previousSpeak && synth.speak !== previousSpeak) synth.speak = previousSpeak;
      if (window.history.pushState !== originalPushState) window.history.pushState = originalPushState;
      if (window.history.replaceState !== originalReplaceState) window.history.replaceState = originalReplaceState;
      stopInterviewSpeech();
    };
  }, []);

  return null;
}

function setControlledValue(element, value) {
  if (!element || value === undefined || value === null) return;
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  if (setter) setter.call(element, String(value));
  else element.value = String(value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function ResumeInterviewHandoff() {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "resume") return undefined;

    let context;
    try {
      context = JSON.parse(localStorage.getItem(RESUME_CONTEXT_KEY) || "null");
    } catch {
      context = null;
    }
    if (!context || typeof context !== "object") return undefined;

    let applied = false;
    const apply = () => {
      if (applied) return true;
      const roleInput = document.querySelector('.interview-setup-card input[name="roleTitle"]');
      const jobDescription = document.querySelector('.interview-setup-card textarea[name="jobDescription"]');
      if (!roleInput || !jobDescription) return false;

      if (context.targetRole) setControlledValue(roleInput, context.targetRole);
      if (context.jobDescription) setControlledValue(jobDescription, context.jobDescription);
      applied = true;
      localStorage.removeItem(RESUME_CONTEXT_KEY);
      setNotice(
        context.targetRole || context.jobDescription
          ? "Resume details loaded into your interview setup. Review them, then start when you're ready."
          : "Resume context received. Add a target role to begin your interview."
      );
      return true;
    };

    if (apply()) return undefined;
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 4000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, []);

  if (!notice) return null;
  return <div className="interview-handoff-notice" role="status"><CheckCircle2 size={17} /><span>{notice}</span></div>;
}

function InterviewMediaPermissionBridge() {
  const [notice, setNotice] = useState("");
  const requestingRef = useRef(false);

  useEffect(() => {
    const requestMediaFromStartGesture = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !form.classList.contains("interview-setup-card")) return;
      if (!navigator.mediaDevices?.getUserMedia || requestingRef.current) return;
      if (sessionStorage.getItem(MEDIA_PRIMED_KEY) === "granted") return;

      requestingRef.current = true;
      setNotice("Requesting camera and microphone access…");
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
          sessionStorage.setItem(MEDIA_PRIMED_KEY, "granted");
          setNotice("Camera and microphone access allowed. You can control your camera during the interview.");
          window.setTimeout(() => setNotice(""), 5500);
        })
        .catch(() => {
          setNotice("Camera or microphone access was not allowed. You can still type answers; use your browser's site permissions to enable media and retry.");
        })
        .finally(() => { requestingRef.current = false; });
    };

    document.addEventListener("submit", requestMediaFromStartGesture, true);
    return () => document.removeEventListener("submit", requestMediaFromStartGesture, true);
  }, []);

  if (!notice) return null;
  return <div className="interview-media-notice" role="status"><span><Mic size={16} /><Camera size={16} /></span><p>{notice}</p></div>;
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
  const keepInterview = () => {
    window.__bragstackInterviewActive = true;
    setPendingHref("");
  };
  const confirmEnd = () => {
    bypassRef.current = true;
    window.__bragstackInterviewActive = false;
    window.speechSynthesis?.cancel?.();
    window.dispatchEvent(new CustomEvent("bragstack:interview-teardown"));
    window.location.assign(pendingHref || "/app");
  };

  if (!active) return null;
  return <>
    {headerHost && createPortal(<button className="interview-end-button" type="button" onClick={requestEnd}><LogOut size={17} /> End Interview</button>, headerHost)}
    {pendingHref && createPortal(
      <div className="interview-exit-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) keepInterview(); }}>
        <section className="interview-exit-modal" role="dialog" aria-modal="true" aria-labelledby="interview-exit-title">
          <button className="interview-exit-close" type="button" onClick={keepInterview} aria-label="Keep interview open"><X size={18} /></button>
          <div className="interview-exit-icon"><LogOut size={24} /></div>
          <span>INTERVIEW IN PROGRESS</span>
          <h2 id="interview-exit-title">End this interview?</h2>
          <p>Your current answer and remaining questions will be abandoned. You can stay and finish, or end the session now.</p>
          <div className="interview-exit-actions">
            <button className="secondary-interview-button" type="button" onClick={keepInterview}>Keep Interview</button>
            <button className="interview-end-confirm" type="button" onClick={confirmEnd}>End Interview</button>
          </div>
        </section>
      </div>, document.body)}
  </>;
}

export default function InterviewPracticeExperience() {
  return <><InterviewRuntimeSafetyBridge /><ResumeInterviewHandoff /><InterviewMediaPermissionBridge /><InterviewPracticePage /><InterviewExitGuard /></>;
}
