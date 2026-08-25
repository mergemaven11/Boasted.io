import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, ChevronRight, Clock3, Mic, RefreshCw, Sparkles, Star, Volume2 } from "lucide-react";
import AnimatedInterviewerAvatar from "./AnimatedInterviewerAvatar.jsx";
import aishaJordanPhoto from "./assets/aisha-jordan-interviewer.jpg";
import { getImpactReceipts } from "./api.js";
import { EXPERIENCE_LEVELS, INTERVIEW_TYPES } from "./interviewKnowledgeBase.js";
import { analyzeAnswer, buildInterviewPlan, getBrowserInterviewCapabilities, summarizeInterview } from "./interviewEngine.js";
import "./InterviewPracticePage.css";

const HISTORY_KEY = "bragstack_interview_history_v1";
const INTRO_SEGMENTS = [
  "Hi, I’m Aisha Jordan. Welcome to your BragStack practice interview.",
  "Here’s how this works. I’ll ask one question at a time. After I finish speaking, your response timer will begin and I’ll start listening.",
  "Answer naturally, just like you would in a real interview. I’ll evaluate what you said, and if an important detail is missing, I may ask one short follow-up.",
  "When your time ends, you’ll hear a soft chime and I’ll let you know. At the end, you’ll get your score, strengths, and specific ways to improve.",
  "Take your time and be yourself. Ready? Let’s begin.",
];
const INTRO_PAUSE_MS = 2000;
const CATALOG_TIMEOUT_MS = 5500;

let cachedSoftVoice = null;

function prettyDimension(value = "") {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function saveHistory(session) {
  try {
    const current = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    localStorage.setItem(HISTORY_KEY, JSON.stringify([session, ...current].slice(0, 8)));
  } catch {
    // Storage should never block interview practice.
  }
}

function recentQuestionIds(roleTitle) {
  try {
    const normalized = roleTitle.trim().toLowerCase();
    const current = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return current
      .filter((session) => String(session?.roleTitle || "").trim().toLowerCase() === normalized)
      .flatMap((session) => Array.isArray(session?.questionIds) ? session.questionIds : [])
      .filter(Boolean);
  } catch {
    return [];
  }
}

function slugifyRole(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function interviewApiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

async function getRotatedCatalogQuestions(roleTitle, count, excludeIds = [], signal) {
  const slug = slugifyRole(roleTitle);
  if (!slug) throw new Error("Missing role slug");
  const params = new URLSearchParams({ count: String(count), seed: `${Date.now()}` });
  if (excludeIds.length) params.set("exclude", [...new Set(excludeIds)].join(","));
  const token = localStorage.getItem("bragstack_token");
  const response = await fetch(`${interviewApiBase()}/interview-catalog/careers/${encodeURIComponent(slug)}/questions?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  });
  if (!response.ok) throw new Error(`Interview catalog returned ${response.status}`);
  return response.json();
}

async function enrichInterviewPlanWithCatalog(fallbackPlan, setup) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
  try {
    const desiredCount = Math.max(3, Math.min(15, Number(setup.questionCount) || 8));
    const catalog = await getRotatedCatalogQuestions(setup.roleTitle, desiredCount, recentQuestionIds(setup.roleTitle), controller.signal);
    const catalogQuestions = (catalog.questions || []).map((question) => ({
      ...question,
      id: question.question_id,
      competency: String(question.competency || question.competencies?.[0] || question.category || "role_alignment").replaceAll("-", "_"),
      source: "mongo-catalog",
    }));
    const personalized = fallbackPlan.questions.filter((question) => question.source === "impact-receipt" || question.source === "job-description");
    const seen = new Set();
    const questions = [...personalized, ...catalogQuestions, ...fallbackPlan.questions].filter((question) => {
      const key = question.id || question.question_id || question.text;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, desiredCount);
    if (!questions.length) return fallbackPlan;
    return {
      ...fallbackPlan,
      family: catalog.family || fallbackPlan.family,
      catalogVersion: catalog.catalog_version,
      questionCount: questions.length,
      questions,
    };
  } catch {
    return fallbackPlan;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function formatTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function chooseSoftVoice(voices = []) {
  const preferred = ["Samantha", "Ava", "Serena", "Tessa", "Moira", "Nicky", "Karen", "Microsoft Aria", "Google US English"];
  return preferred.map((name) => voices.find((voice) => voice.lang?.startsWith("en") && voice.name.includes(name))).find(Boolean)
    || voices.find((voice) => voice.lang?.startsWith("en-US") && /premium|enhanced|natural|neural/i.test(voice.name))
    || voices.find((voice) => voice.lang?.startsWith("en-US"))
    || voices.find((voice) => voice.lang?.startsWith("en"))
    || null;
}

function warmSpeechVoices() {
  const synth = window.speechSynthesis;
  if (!synth?.getVoices) return () => {};
  const refresh = () => {
    const next = chooseSoftVoice(synth.getVoices());
    if (next) cachedSoftVoice = next;
  };
  refresh();
  synth.addEventListener?.("voiceschanged", refresh);
  return () => synth.removeEventListener?.("voiceschanged", refresh);
}

function speakSoftText(text, { cancelFirst = false } = {}) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth?.speak || !text) {
      resolve(false);
      return;
    }
    if (cancelFirst) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = cachedSoftVoice || chooseSoftVoice(synth.getVoices?.() || []);
    if (voice) {
      cachedSoftVoice = voice;
      utterance.voice = voice;
    }
    utterance.rate = 0.92;
    utterance.pitch = 0.99;
    utterance.volume = 0.86;
    let settled = false;
    let timeoutId = null;
    let resumeId = null;
    const finish = (spoken) => {
      if (settled) return;
      settled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (resumeId) window.clearInterval(resumeId);
      resolve(spoken);
    };
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    utterance.onstart = () => synth.resume?.();
    synth.speak(utterance);
    synth.resume?.();
    resumeId = window.setInterval(() => {
      if (synth.speaking && synth.paused) synth.resume?.();
    }, 3500);
    timeoutId = window.setTimeout(() => finish(false), Math.max(12000, text.length * 125));
  });
}

function playSoftChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    void context.resume?.();
    const now = context.currentTime;
    [783.99, 987.77].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.05, now + index * 0.12 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.28);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.3);
    });
    window.setTimeout(() => context.close?.(), 800);
  } catch {
    // Chime polish must never block the interview.
  }
}

export default function InterviewPracticePage() {
  const [stage, setStage] = useState("setup");
  const [setup, setSetup] = useState({ roleTitle: "", careerArea: "", experienceLevel: "experienced", interviewType: "mixed", questionCount: 8, responseMinutes: 3, jobDescription: "", useReceipts: true });
  const [receipts, setReceipts] = useState([]);
  const [plan, setPlan] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [responses, setResponses] = useState([]);
  const [fatalResponse, setFatalResponse] = useState(null);
  const [followUpActive, setFollowUpActive] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState("");
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [baseAnswer, setBaseAnswer] = useState("");
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [listening, setListening] = useState(false);
  const [interviewPhase, setInterviewPhaseState] = useState("idle");
  const [audioError, setAudioError] = useState("");

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const answerRef = useRef("");
  const phaseRef = useRef("idle");
  const timerRunningRef = useRef(false);
  const sequenceBusyRef = useRef(false);
  const timeoutHandledRef = useRef(false);
  const autoListenRef = useRef(false);

  const capabilities = useMemo(() => getBrowserInterviewCapabilities(window), []);
  const currentQuestion = plan?.questions?.[questionIndex] || null;
  const currentPrompt = followUpActive ? followUpPrompt : currentQuestion?.text || "";
  const responseSeconds = Math.max(60, Number(setup.responseMinutes) * 60 || 180);
  const avatarState = interviewPhase === "listening" ? "listening" : interviewPhase === "reviewing" ? "thinking" : interviewPhase === "transition" ? "encouraging" : interviewPhase === "speaking" ? "speaking" : "idle";

  function setInterviewPhase(value) {
    phaseRef.current = value;
    setInterviewPhaseState(value);
  }

  useEffect(() => {
    const preload = new Image();
    preload.src = aishaJordanPhoto;
    const cleanupVoices = warmSpeechVoices();
    const resumeSpeechWhenVisible = () => {
      if (document.visibilityState === "visible") window.speechSynthesis?.resume?.();
    };
    document.addEventListener("visibilitychange", resumeSpeechWhenVisible);
    return () => {
      cleanupVoices();
      document.removeEventListener("visibilitychange", resumeSpeechWhenVisible);
      try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  useEffect(() => {
    timerRunningRef.current = timerRunning;
  }, [timerRunning]);

  useEffect(() => {
    let active = true;
    getImpactReceipts().then((data) => { if (active) setReceipts(data.receipts || []); }).catch(() => { if (active) setReceipts([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream, stage]);

  useEffect(() => {
    if (!timerRunning || stage !== "interview" || feedback) return undefined;
    const id = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, stage, feedback]);

  useEffect(() => {
    if (stage !== "interview" || secondsLeft > 0 || feedback || timeoutHandledRef.current) return;
    const id = window.setTimeout(() => { void handleTimeout(); }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, stage, feedback]);

  function updateSetup(event) {
    const { name, value, type, checked } = event.target;
    setSetup((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function stopDictation({ disableAuto = true } = {}) {
    if (disableAuto) autoListenRef.current = false;
    try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setListening(false);
  }

  function startDictation() {
    if (!capabilities.speechRecognition || phaseRef.current !== "listening" || !timerRunningRef.current) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || recognitionRef.current) return;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex).map((result) => result[0]?.transcript || "").join(" ").trim();
      if (transcript) setAnswer((current) => `${current} ${transcript}`.trim());
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
      autoListenRef.current = false;
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      if (autoListenRef.current && phaseRef.current === "listening" && timerRunningRef.current) {
        window.setTimeout(() => startDictation(), 250);
      }
    };
    recognitionRef.current = recognition;
    try {
      setListening(true);
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setListening(false);
      autoListenRef.current = false;
    }
  }

  function beginResponseClock() {
    timeoutHandledRef.current = false;
    setSecondsLeft(responseSeconds);
    setQuestionStartedAt(Date.now());
    timerRunningRef.current = true;
    setTimerRunning(true);
    autoListenRef.current = capabilities.speechRecognition;
    setInterviewPhase("listening");
    if (capabilities.speechRecognition) {
      window.setTimeout(() => {
        if (phaseRef.current === "listening" && timerRunningRef.current) startDictation();
      }, 250);
    }
  }

  async function speakQuestion(prompt) {
    if (!prompt) return false;
    stopDictation();
    timerRunningRef.current = false;
    setTimerRunning(false);
    setAudioError("");
    setInterviewPhase("speaking");

    if (!capabilities.speechSynthesis || !window.speechSynthesis?.speak) {
      setAudioError("Spoken audio is not available in this browser, so the interview is continuing in text mode.");
      beginResponseClock();
      return true;
    }

    let spoken = await speakSoftText(prompt);
    if (!spoken) {
      await wait(250);
      spoken = await speakSoftText(prompt, { cancelFirst: true });
    }
    if (!spoken) {
      setAudioError("Aisha’s audio was blocked or interrupted. The interview is continuing in text mode; Replay question can retry the audio.");
      beginResponseClock();
      return true;
    }
    beginResponseClock();
    return true;
  }

  async function continueGreeting(firstSegmentPromise, fallbackPlan, catalogPromise) {
    sequenceBusyRef.current = true;
    setInterviewPhase("speaking");
    let spoken = await firstSegmentPromise;

    if (!spoken && capabilities.speechSynthesis) {
      await wait(200);
      spoken = await speakSoftText(INTRO_SEGMENTS[0], { cancelFirst: true });
    }

    if (spoken) {
      for (let index = 1; index < INTRO_SEGMENTS.length; index += 1) {
        await wait(INTRO_PAUSE_MS);
        const ok = await speakSoftText(INTRO_SEGMENTS[index]);
        if (!ok) {
          setAudioError("Aisha’s intro was interrupted. The interview will continue with the first question.");
          break;
        }
      }
    } else {
      setAudioError("Spoken audio is unavailable or blocked here. Aisha is still visible and the interview will continue in text mode.");
    }

    const enrichedPlan = await catalogPromise;
    setPlan(enrichedPlan);
    const firstQuestionPrompt = enrichedPlan.questions?.[0]?.text
      || fallbackPlan.questions?.[0]?.text
      || `Tell me about your background and what interests you in this ${setup.roleTitle} opportunity.`;

    if (spoken) await wait(INTRO_PAUSE_MS);
    await speakQuestion(firstQuestionPrompt);
    sequenceBusyRef.current = false;
  }

  function startInterview(event) {
    event.preventDefault();
    if (!setup.roleTitle.trim()) return;
    const fallbackPlan = buildInterviewPlan({ ...setup, receipts: setup.useReceipts ? receipts : [] });

    window.speechSynthesis?.cancel?.();
    stopDictation();
    sequenceBusyRef.current = true;
    setAudioError("");

    flushSync(() => {
      setPlan(fallbackPlan);
      setQuestionIndex(0);
      setResponses([]);
      setAnswer("");
      setFeedback(null);
      setFatalResponse(null);
      setFollowUpActive(false);
      setFollowUpPrompt("");
      setFollowUpUsed(false);
      setBaseAnswer("");
      setSecondsLeft(responseSeconds);
      setTimerRunning(false);
      setListening(false);
      setInterviewPhase("speaking");
      setStage("interview");
    });

    const firstSegmentPromise = speakSoftText(INTRO_SEGMENTS[0]);
    const catalogPromise = enrichInterviewPlanWithCatalog(fallbackPlan, setup);
    void continueGreeting(firstSegmentPromise, fallbackPlan, catalogPromise);
  }

  async function replayQuestion() {
    if (!currentPrompt || sequenceBusyRef.current) return;
    sequenceBusyRef.current = true;
    window.speechSynthesis?.cancel?.();
    await speakQuestion(currentPrompt);
    sequenceBusyRef.current = false;
  }

  async function handleTimeout() {
    if (timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    stopDictation();
    timerRunningRef.current = false;
    setTimerRunning(false);
    setInterviewPhase("speaking");
    playSoftChime();
    await wait(450);
    await speakSoftText("Okay, that’s time. Thank you.");
    evaluateAnswer(answerRef.current, { timedOut: true });
  }

  function evaluateAnswer(rawAnswer, { timedOut = false } = {}) {
    if (!currentQuestion) return;
    stopDictation();
    timerRunningRef.current = false;
    setTimerRunning(false);
    setInterviewPhase("reviewing");
    const responseText = String(rawAnswer || "").trim();
    const combinedAnswer = followUpActive ? `${baseAnswer} ${responseText}`.trim() : responseText;
    const nextFeedback = analyzeAnswer(combinedAnswer, {
      question: currentQuestion.text,
      competency: currentQuestion.competency,
      roleTitle: plan?.roleTitle || setup.roleTitle,
      jobDescription: plan?.jobDescription || setup.jobDescription,
      durationSeconds: Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000)),
    });
    if (timedOut) nextFeedback.timedOut = true;
    const response = { question: currentQuestion, answer: combinedAnswer, analysis: nextFeedback };
    setAnswer(combinedAnswer);
    setFeedback(nextFeedback);
    if (followUpActive) {
      setFollowUpActive(false);
      setBaseAnswer("");
      setFollowUpUsed(true);
    }
    if (nextFeedback.instantFail) {
      setFatalResponse(response);
      setResponses((current) => [...current, response]);
      setStage("failed");
    }
  }

  function submitAnswer(event) {
    event.preventDefault();
    if (!answer.trim() || !currentQuestion) return;
    evaluateAnswer(answer);
  }

  function beginFollowUp() {
    if (!feedback?.followUp) return;
    const prompt = feedback.followUp;
    setBaseAnswer(answer);
    setAnswer("");
    setFollowUpPrompt(prompt);
    setFeedback(null);
    setFollowUpActive(true);
    setFollowUpUsed(true);
    setSecondsLeft(responseSeconds);
    setInterviewPhase("transition");
    window.setTimeout(() => { void speakQuestion(prompt); }, 350);
  }

  function retryAnswer() {
    setAnswer("");
    setFeedback(null);
    setBaseAnswer("");
    setFollowUpActive(false);
    setFollowUpPrompt("");
    setFollowUpUsed(false);
    setSecondsLeft(responseSeconds);
    const prompt = currentQuestion?.text || "";
    setInterviewPhase("transition");
    window.setTimeout(() => { void speakQuestion(prompt); }, 350);
  }

  function nextQuestion() {
    if (!feedback || !currentQuestion) return;
    const nextResponses = [...responses, { question: currentQuestion, answer, analysis: feedback }];
    setResponses(nextResponses);
    setAnswer("");
    setFeedback(null);
    setBaseAnswer("");
    setFollowUpActive(false);
    setFollowUpPrompt("");
    setFollowUpUsed(false);

    if (questionIndex + 1 >= plan.questions.length) {
      const summary = summarizeInterview(nextResponses);
      saveHistory({
        id: Date.now(),
        completedAt: new Date().toISOString(),
        roleTitle: plan.roleTitle,
        family: plan.family,
        interviewType: plan.interviewType,
        questionIds: plan.questions.filter((question) => question.source === "mongo-catalog").map((question) => question.id),
        summary,
      });
      setStage("results");
      return;
    }

    const nextIndex = questionIndex + 1;
    const prompt = plan.questions[nextIndex]?.text || "";
    setQuestionIndex(nextIndex);
    setSecondsLeft(responseSeconds);
    setInterviewPhase("transition");
    window.setTimeout(() => { void speakQuestion(prompt); }, 350);
  }

  async function enableCamera() {
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available in this browser. You can still complete the interview normally.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = stream;
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access was not granted. You can still complete the interview normally.");
    }
  }

  function disableCamera() {
    const stream = cameraStreamRef.current || cameraStream;
    stream?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setCameraStream(null);
  }

  function resetInterview() {
    disableCamera();
    stopDictation();
    window.speechSynthesis?.cancel?.();
    sequenceBusyRef.current = false;
    setStage("setup");
    setPlan(null);
    setResponses([]);
    setQuestionIndex(0);
    setAnswer("");
    setFeedback(null);
    setFatalResponse(null);
    setTimerRunning(false);
    setListening(false);
    setAudioError("");
    setInterviewPhase("idle");
  }

  if (stage === "setup") return (
    <main className="interview-practice-page">
      <img src={aishaJordanPhoto} alt="" aria-hidden="true" decoding="sync" fetchPriority="high" style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
      <header className="interview-page-header"><div><span className="interview-pro-badge"><Sparkles size={14} /> BRAGSTACK CAREER INTELLIGENCE™</span><h1>Practice Interview</h1><p>Aisha greets you, asks each question out loud, starts your timer only after she finishes, listens to your response, and gives specific coaching.</p></div><div className="zero-cost-card"><strong>BragStack Intelligence</strong><span>Evidence-aware coaching personalized to your target role</span></div></header>
      <section className="interview-setup-grid">
        <form className="interview-setup-card" onSubmit={startInterview}>
          <div className="section-kicker">BUILD YOUR INTERVIEW</div>
          <label>Target role<input name="roleTitle" value={setup.roleTitle} onChange={updateSetup} placeholder="Senior Software Engineer, Registered Nurse, Product Manager…" required /></label>
          <label>Career area <small>optional</small><input name="careerArea" value={setup.careerArea} onChange={updateSetup} placeholder="Technology, healthcare, finance…" /></label>
          <div className="setup-two-column">
            <label>Experience level<select name="experienceLevel" value={setup.experienceLevel} onChange={updateSetup}>{EXPERIENCE_LEVELS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label>Interview type<select name="interviewType" value={setup.interviewType} onChange={updateSetup}>{INTERVIEW_TYPES.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          </div>
          <div className="setup-two-column">
            <label>Questions<select name="questionCount" value={setup.questionCount} onChange={updateSetup}><option value="5">5 · Quick practice</option><option value="8">8 · Standard</option><option value="10">10 · Full interview</option></select></label>
            <label>Response time<select name="responseMinutes" value={setup.responseMinutes} onChange={updateSetup}><option value="1">1 minute</option><option value="3">3 minutes</option><option value="5">5 minutes</option></select></label>
          </div>
          <label>Job description <small>optional</small><textarea name="jobDescription" value={setup.jobDescription} onChange={updateSetup} rows="5" placeholder="Paste the job description for more targeted questions." /></label>
          <label className="receipt-personalization"><input type="checkbox" name="useReceipts" checked={setup.useReceipts} onChange={updateSetup} /><span><strong>Personalize with my career proof</strong><small>{receipts.length ? `${receipts.length} Impact Receipt${receipts.length === 1 ? "" : "s"} available` : "No Impact Receipts loaded yet — the interview still works normally."}</small></span></label>
          <button className="start-interview-button" type="submit">Start practice interview <ChevronRight size={18} /></button>
        </form>
        <aside className="interview-preview-card"><div className="preview-interviewer-window"><div className="interviewer-avatar">AJ</div><div><span>Aisha Jordan</span><strong>Senior Technical Recruiter</strong></div></div><div className="preview-question-card"><span>REAL INTERVIEW COACHING</span><p>Follow-ups target the missing part of your answer instead of simply repeating the original question.</p></div><div className="preview-capabilities"><div><CheckCircle2 size={17} /><span>Automatic greeting + spoken questions</span></div><div><CheckCircle2 size={17} /><span>1, 3, or 5 minute response timer</span></div><div><CheckCircle2 size={17} /><span>Specific strengths + improvements</span></div><div><CheckCircle2 size={17} /><span>Professional-language red flag warnings</span></div><div><CheckCircle2 size={17} /><span>1–5 star final interview rating</span></div></div></aside>
      </section>
    </main>
  );

  if (stage === "failed") {
    const summary = summarizeInterview(responses);
    return <main className="interview-practice-page"><section className="interview-fail-screen" role="alert"><AlertTriangle size={48} /><span>‼️ CRITICAL INTERVIEW WARNING</span><h1>Interview failed</h1><p>{fatalResponse?.analysis?.warning?.message || "A critical professional-language red flag was detected."}</p><div className="interview-fail-term">Flagged: {fatalResponse?.analysis?.warning?.terms?.join(", ")}</div><div className="interview-fail-coaching"><strong>How to fix it</strong><p>{fatalResponse?.analysis?.warning?.coaching}</p></div><div className="final-stars" aria-label={`${summary.stars} out of 5 stars`}>{[1,2,3,4,5].map((star) => <Star key={star} size={28} fill={star <= summary.stars ? "currentColor" : "none"} />)}</div><button className="start-interview-button" type="button" onClick={resetInterview}><RefreshCw size={17} /> Restart interview</button></section></main>;
  }

  if (stage === "results") {
    const summary = summarizeInterview(responses);
    return <main className="interview-practice-page"><header className="interview-results-hero"><span className="interview-pro-badge"><Sparkles size={14} /> INTERVIEW COMPLETE</span><h1>Your interview feedback</h1><div className="final-score-row"><div className="final-stars" aria-label={`${summary.stars} out of 5 stars`}>{[1,2,3,4,5].map((star) => <Star key={star} size={27} fill={star <= summary.stars ? "currentColor" : "none"} />)}</div><strong>{summary.overallScore}/100</strong></div><h2 className="final-verdict">{summary.verdict}</h2></header><section className="results-grid"><article className="result-card"><span>STRONGEST AREAS</span>{summary.strongestAreas.map((area) => <div className="result-line strong" key={area.name}><strong>{prettyDimension(area.name)}</strong><em>{area.score}/100 · {area.label}</em></div>)}</article><article className="result-card"><span>FOCUS NEXT</span>{summary.improvementAreas.map((area) => <div className="result-line" key={area.name}><strong>{prettyDimension(area.name)}</strong><em>{area.score}/100 · {area.label}</em></div>)}</article><article className="result-card compact-stats"><span>SESSION SIGNALS</span><div><strong>{summary.averageWords}</strong><small>avg. words / answer</small></div><div><strong>{summary.totalFillers}</strong><small>filler phrases detected</small></div></article></section><section className="pattern-card recommendations-card"><span>EXACTLY WHAT TO IMPROVE NEXT</span>{summary.recommendations.map((recommendation) => <p key={recommendation}>→ {recommendation}</p>)}</section><div className="results-actions"><button className="start-interview-button" type="button" onClick={resetInterview}><RefreshCw size={17} /> Practice another interview</button></div></main>;
  }

  return <main className="interview-practice-page interview-room-page">
    <header className="interview-room-header"><div><span>{plan.roleTitle}</span><strong>Practice Interview with Aisha</strong></div><div className="question-progress"><span>Question {questionIndex + 1} of {plan.questions.length}</span><div><i style={{ width: `${((questionIndex + 1) / plan.questions.length) * 100}%` }} /></div></div></header>
    <section className="interview-room-grid">
      <div className="interview-video-stage">
        <div className="virtual-interviewer animated-interviewer-host"><AnimatedInterviewerAvatar state={avatarState} /><div className="animated-avatar-caption" aria-hidden="true"><strong>Aisha Jordan</strong><span>Senior Technical Recruiter</span></div></div>
        <div className="candidate-video-tile">{cameraStream ? <video ref={videoRef} autoPlay muted playsInline /> : <div className="camera-placeholder"><CameraOff size={28} /><span>Your camera is off</span></div>}<div className="candidate-video-label">You</div></div>
        <div className="video-controls">{cameraStream ? <button type="button" onClick={disableCamera}><CameraOff size={17} /> Camera off</button> : <button type="button" onClick={enableCamera} disabled={!capabilities.camera}><Camera size={17} /> Enable camera</button>}<button type="button" onClick={() => { void replayQuestion(); }} disabled={!capabilities.speechSynthesis || sequenceBusyRef.current}><Volume2 size={17} /> Replay question</button></div>
        {cameraError && <p className="camera-error">{cameraError}</p>}
      </div>
      <div className="interview-answer-panel">
        <div className="question-box"><div className="question-meta-row"><span>{followUpActive ? "TARGETED FOLLOW-UP" : `QUESTION ${questionIndex + 1}`}</span><strong className={`response-timer ${secondsLeft <= 20 && timerRunning ? "urgent" : ""}`}><Clock3 size={16} /> {formatTime(secondsLeft)}</strong></div><h1>{currentPrompt}</h1>{followUpActive && <small>This follow-up targets the missing part of your previous answer. You do not need to repeat the whole story.</small>}{audioError && <small>{audioError}</small>}</div>
        {!feedback ? <form onSubmit={submitAnswer} className="answer-form"><label htmlFor="practice-answer">Your answer</label><textarea id="practice-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows="9" placeholder="Answer naturally. Focus on the exact question, what YOU did, and what changed as a result." /><div className="answer-tools">{capabilities.speechRecognition ? (listening ? <button className="dictation-button active" type="button" onClick={() => stopDictation()}><Mic size={17} /> Stop dictation</button> : <button className="dictation-button" type="button" onClick={() => { autoListenRef.current = true; startDictation(); }} disabled={interviewPhase !== "listening"}><Mic size={17} /> Speak answer</button>) : <span>Voice dictation is unavailable here — typing still works.</span>}<span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span></div><button className="start-interview-button" type="submit" disabled={!answer.trim()}>Review my answer</button></form> : <section className="answer-feedback-panel" role="dialog" aria-modal="true" aria-label={`Feedback for question ${questionIndex + 1}`}>{feedback.timedOut && <div className="timeout-warning"><Clock3 size={18} /><span>Time expired. This answer was scored as submitted.</span></div>}<div className="feedback-heading"><div><span>ANSWER FEEDBACK</span><h2>{feedback.overallLabel}</h2></div><strong>{feedback.overallScore}/100</strong></div><div className="answer-coaching-grid"><article className="answer-strengths"><span>WHAT WORKED</span>{feedback.strengths.map((item) => <p key={item}>✓ {item}</p>)}</article><article className="answer-improvements"><span>HOW TO IMPROVE</span>{feedback.improvements.map((item) => <p key={item}>→ {item}</p>)}</article></div><div className="feedback-dimensions">{Object.entries(feedback.dimensions).map(([name, value]) => <article key={name}><div><strong>{prettyDimension(name)}</strong><span className={value.label === "Excellent" || value.label === "Strong" ? "strong" : value.label === "Developing" ? "developing" : "needs-detail"}>{value.score}/100 · {value.label}</span></div><p>{value.note}</p><small><b>Improve:</b> {value.improve}</small></article>)}</div>{feedback.followUp && !followUpUsed && <div className="follow-up-card"><span>TARGETED INTERVIEWER FOLLOW-UP</span><p>{feedback.followUp}</p><button type="button" onClick={beginFollowUp}>Answer targeted follow-up</button></div>}<div className="feedback-actions"><button className="secondary-interview-button" type="button" onClick={retryAnswer}>Try this answer again</button><button className="start-interview-button" type="button" onClick={nextQuestion}>{questionIndex + 1 >= plan.questions.length ? "Finish interview" : "Continue"} <ChevronRight size={17} /></button></div></section>}
      </div>
    </section>
  </main>;
}
