import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, CheckCircle2, ChevronRight, Mic, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { getImpactReceipts } from "./api.js";
import { EXPERIENCE_LEVELS, INTERVIEW_TYPES } from "./interviewKnowledgeBase.js";
import { analyzeAnswer, buildInterviewPlan, getBrowserInterviewCapabilities, summarizeInterview } from "./interviewEngine.js";
import "./InterviewPracticePage.css";

const HISTORY_KEY = "bragstack_interview_history_v1";

function prettyDimension(value = "") {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function saveHistory(session) {
  try {
    const current = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    localStorage.setItem(HISTORY_KEY, JSON.stringify([session, ...current].slice(0, 5)));
  } catch {
    // Interview practice must keep working even when browser storage is unavailable.
  }
}

export default function InterviewPracticePage() {
  const [stage, setStage] = useState("setup");
  const [setup, setSetup] = useState({ roleTitle: "", careerArea: "", experienceLevel: "experienced", interviewType: "mixed", questionCount: 8, jobDescription: "", useReceipts: true });
  const [receipts, setReceipts] = useState([]);
  const [plan, setPlan] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [responses, setResponses] = useState([]);
  const [followUpActive, setFollowUpActive] = useState(false);
  const [followUpPrompt, setFollowUpPrompt] = useState("");
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [baseAnswer, setBaseAnswer] = useState("");
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [listening, setListening] = useState(false);
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const capabilities = useMemo(() => getBrowserInterviewCapabilities(window), []);

  useEffect(() => {
    let active = true;
    getImpactReceipts().then((data) => { if (active) setReceipts(data.receipts || []); }).catch(() => { if (active) setReceipts([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream, stage]);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    recognitionRef.current?.stop?.();
  }, [cameraStream]);

  const currentQuestion = plan?.questions?.[questionIndex] || null;
  const currentPrompt = followUpActive ? followUpPrompt : currentQuestion?.text || "";

  function updateSetup(event) {
    const { name, value, type, checked } = event.target;
    setSetup((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function startInterview(event) {
    event.preventDefault();
    if (!setup.roleTitle.trim()) return;
    setPlan(buildInterviewPlan({ ...setup, receipts: setup.useReceipts ? receipts : [] }));
    setQuestionIndex(0); setResponses([]); setAnswer(""); setFeedback(null); setFollowUpActive(false); setFollowUpUsed(false);
    setQuestionStartedAt(Date.now()); setStage("interview");
  }

  async function enableCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access was not granted. You can still complete the interview normally.");
    }
  }

  function disableCamera() { cameraStream?.getTracks().forEach((track) => track.stop()); setCameraStream(null); }

  function speakQuestion() {
    if (!capabilities.speechSynthesis || !currentPrompt) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentPrompt); utterance.rate = 0.98; window.speechSynthesis.speak(utterance);
  }

  function dictateAnswer() {
    if (!capabilities.speechRecognition || listening) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-US"; recognition.interimResults = false; recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex).map((result) => result[0]?.transcript || "").join(" ").trim();
      if (transcript) setAnswer((current) => `${current} ${transcript}`.trim());
    };
    recognition.onerror = () => setListening(false); recognition.onend = () => setListening(false); recognitionRef.current = recognition;
    setListening(true); recognition.start();
  }

  function stopDictation() { recognitionRef.current?.stop?.(); setListening(false); }

  function submitAnswer(event) {
    event.preventDefault();
    if (!answer.trim() || !currentQuestion) return;
    stopDictation();
    const durationSeconds = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
    const combinedAnswer = followUpActive ? `${baseAnswer} ${answer}`.trim() : answer.trim();
    const nextFeedback = analyzeAnswer(combinedAnswer, { question: currentQuestion.text, durationSeconds });
    setAnswer(combinedAnswer); setFeedback(nextFeedback);
    if (followUpActive) { setFollowUpActive(false); setBaseAnswer(""); setFollowUpUsed(true); }
  }

  function answerFollowUp() {
    if (!feedback?.followUp) return;
    setBaseAnswer(answer); setAnswer(""); setFollowUpPrompt(feedback.followUp); setFeedback(null); setFollowUpActive(true); setFollowUpUsed(true); setQuestionStartedAt(Date.now());
  }

  function retryAnswer() {
    setAnswer(""); setFeedback(null); setBaseAnswer(""); setFollowUpActive(false); setFollowUpPrompt(""); setFollowUpUsed(false); setQuestionStartedAt(Date.now());
  }

  function nextQuestion() {
    if (!feedback || !currentQuestion) return;
    const nextResponses = [...responses, { question: currentQuestion, answer, analysis: feedback }];
    setResponses(nextResponses); setAnswer(""); setFeedback(null); setBaseAnswer(""); setFollowUpActive(false); setFollowUpPrompt(""); setFollowUpUsed(false);
    if (questionIndex + 1 >= plan.questions.length) {
      const summary = summarizeInterview(nextResponses);
      saveHistory({ id: Date.now(), completedAt: new Date().toISOString(), roleTitle: plan.roleTitle, family: plan.family, interviewType: plan.interviewType, summary });
      setStage("results"); return;
    }
    setQuestionIndex((index) => index + 1); setQuestionStartedAt(Date.now());
  }

  function resetInterview() { disableCamera(); setStage("setup"); setPlan(null); setResponses([]); setQuestionIndex(0); setAnswer(""); setFeedback(null); }

  if (stage === "setup") return (
    <main className="interview-practice-page">
      <header className="interview-page-header"><div><span className="interview-pro-badge"><Sparkles size={14} /> BRAGSTACK PRO</span><h1>Practice Interview</h1><p>Career-aware practice powered by BragStack's own interview intelligence engine. No paid AI call is required to run an interview.</p></div><div className="zero-cost-card"><strong>$0 inference</strong><span>Rules + career knowledge run in the app</span></div></header>
      <section className="interview-setup-grid">
        <form className="interview-setup-card" onSubmit={startInterview}>
          <div className="section-kicker">BUILD YOUR INTERVIEW</div>
          <label>Target role<input name="roleTitle" value={setup.roleTitle} onChange={updateSetup} placeholder="Registered Nurse, Accountant, Mechanic, Product Manager…" required /></label>
          <label>Career area <small>optional</small><input name="careerArea" value={setup.careerArea} onChange={updateSetup} placeholder="Healthcare, finance, skilled trades…" /></label>
          <div className="setup-two-column">
            <label>Experience level<select name="experienceLevel" value={setup.experienceLevel} onChange={updateSetup}>{EXPERIENCE_LEVELS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label>Interview type<select name="interviewType" value={setup.interviewType} onChange={updateSetup}>{INTERVIEW_TYPES.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          </div>
          <label>Questions<select name="questionCount" value={setup.questionCount} onChange={updateSetup}><option value="5">5 · Quick practice</option><option value="8">8 · Standard</option><option value="10">10 · Full interview</option></select></label>
          <label>Job description <small>optional</small><textarea name="jobDescription" value={setup.jobDescription} onChange={updateSetup} rows="5" placeholder="Paste the job description to add a role-alignment question." /></label>
          <label className="receipt-personalization"><input type="checkbox" name="useReceipts" checked={setup.useReceipts} onChange={updateSetup} /><span><strong>Personalize with my career proof</strong><small>{receipts.length ? `${receipts.length} Impact Receipt${receipts.length === 1 ? "" : "s"} available` : "No Impact Receipts loaded yet — the interview still works for any career."}</small></span></label>
          <button className="start-interview-button" type="submit">Start practice interview <ChevronRight size={18} /></button>
        </form>
        <aside className="interview-preview-card"><div className="preview-interviewer-window"><div className="interviewer-avatar">BS</div><div><span>BragStack Interviewer</span><strong>Ready when you are</strong></div></div><div className="preview-question-card"><span>REALISTIC FOLLOW-UP COACHING</span><p>“What did you personally do, and what changed as a result?”</p></div><div className="preview-capabilities"><div><CheckCircle2 size={17} /><span>All-career question engine</span></div><div><CheckCircle2 size={17} /><span>Situation → action → result analysis</span></div><div><CheckCircle2 size={17} /><span>Dynamic follow-up coaching</span></div><div><CheckCircle2 size={17} /><span>Camera + voice where supported</span></div><div><CheckCircle2 size={17} /><span>Final strengths + improvement report</span></div></div><div className="local-capability-row"><span>{capabilities.webGpu ? "WebGPU detected · local-model expansion ready" : "Core interview engine ready"}</span><small>Paid cloud AI required: no</small></div></aside>
      </section>
    </main>
  );

  if (stage === "results") {
    const summary = summarizeInterview(responses); const best = summary.bestAnswerIndex == null ? null : responses[summary.bestAnswerIndex];
    return <main className="interview-practice-page"><header className="interview-results-hero"><span className="interview-pro-badge"><Sparkles size={14} /> INTERVIEW COMPLETE</span><h1>Here’s how your interview went.</h1><p>{plan.roleTitle} · {summary.overallLabel}</p></header><section className="results-grid"><article className="result-card"><span>STRONGEST AREAS</span>{summary.strongestAreas.map((area) => <div className="result-line strong" key={area.name}><strong>{prettyDimension(area.name)}</strong><em>{area.label}</em></div>)}</article><article className="result-card"><span>FOCUS NEXT</span>{summary.improvementAreas.map((area) => <div className="result-line" key={area.name}><strong>{prettyDimension(area.name)}</strong><em>{area.label}</em></div>)}</article><article className="result-card compact-stats"><span>SESSION SIGNALS</span><div><strong>{summary.averageWords}</strong><small>avg. words / answer</small></div><div><strong>{summary.totalFillers}</strong><small>filler phrases detected</small></div></article></section><section className="pattern-card"><span>PATTERNS BRAGSTACK NOTICED</span>{summary.patterns.map((pattern) => <p key={pattern}>{pattern}</p>)}</section>{best && <section className="best-answer-card"><span>YOUR STRONGEST ANSWER</span><h2>{best.question.text}</h2><p>{best.answer}</p><div className="feedback-pill-row">{Object.entries(best.analysis.dimensions).map(([name, value]) => <span key={name}>{prettyDimension(name)} · {value.label}</span>)}</div></section>}<div className="results-actions"><button className="start-interview-button" type="button" onClick={resetInterview}><RefreshCw size={17} /> Practice another interview</button><a className="secondary-interview-button" href="/app/reports?packet=interview#packet-builder">Build my interview packet</a></div></main>;
  }

  return <main className="interview-practice-page interview-room-page"><header className="interview-room-header"><div><span>{plan.roleTitle}</span><strong>Practice Interview</strong></div><div className="question-progress"><span>Question {questionIndex + 1} of {plan.questions.length}</span><div><i style={{ width: `${((questionIndex + 1) / plan.questions.length) * 100}%` }} /></div></div></header><section className="interview-room-grid"><div className="interview-video-stage"><div className="virtual-interviewer"><div className="virtual-interviewer-face">BS</div><div className="virtual-interviewer-status"><span>BragStack Interviewer</span><strong>{followUpActive ? "Follow-up question" : "Listening"}</strong></div></div><div className="candidate-video-tile">{cameraStream ? <video ref={videoRef} autoPlay muted playsInline /> : <div className="camera-placeholder"><CameraOff size={28} /><span>Your camera is off</span></div>}<div className="candidate-video-label">You</div></div><div className="video-controls">{cameraStream ? <button type="button" onClick={disableCamera}><CameraOff size={17} /> Camera off</button> : <button type="button" onClick={enableCamera} disabled={!capabilities.camera}><Camera size={17} /> Enable camera</button>}<button type="button" onClick={speakQuestion} disabled={!capabilities.speechSynthesis}><Volume2 size={17} /> Read question</button></div>{cameraError && <p className="camera-error">{cameraError}</p>}</div><div className="interview-answer-panel"><div className="question-box"><span>{followUpActive ? "INTERVIEWER FOLLOW-UP" : `QUESTION ${questionIndex + 1}`}</span><h1>{currentPrompt}</h1>{currentQuestion?.source === "impact-receipt" && <small>Personalized from your private BragStack career proof.</small>}</div>{!feedback ? <form onSubmit={submitAnswer} className="answer-form"><label htmlFor="practice-answer">Your answer</label><textarea id="practice-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows="9" placeholder="Answer naturally. BragStack will look for context, your personal action, the result, specificity, impact, and communication signals." autoFocus /><div className="answer-tools">{capabilities.speechRecognition && (listening ? <button className="dictation-button active" type="button" onClick={stopDictation}><Mic size={17} /> Stop dictation</button> : <button className="dictation-button" type="button" onClick={dictateAnswer}><Mic size={17} /> Speak answer</button>)}<span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span></div><button className="start-interview-button" type="submit" disabled={!answer.trim()}>Review my answer</button></form> : <section className="answer-feedback-panel"><div className="feedback-heading"><div><span>ANSWER FEEDBACK</span><h2>{feedback.overallLabel}</h2></div><strong>{feedback.signals.wordsPerMinute ? `${feedback.signals.wordsPerMinute} wpm` : `${feedback.signals.wordCount} words`}</strong></div><div className="feedback-dimensions">{Object.entries(feedback.dimensions).map(([name, value]) => <article key={name}><div><strong>{prettyDimension(name)}</strong><span className={value.label === "Strong" ? "strong" : value.label === "Developing" ? "developing" : "needs-detail"}>{value.label}</span></div><p>{value.note}</p></article>)}</div>{feedback.followUp && !followUpUsed && <div className="follow-up-card"><span>INTERVIEWER FOLLOW-UP</span><p>{feedback.followUp}</p><button type="button" onClick={answerFollowUp}>Answer follow-up</button></div>}<div className="feedback-actions"><button className="secondary-interview-button" type="button" onClick={retryAnswer}>Try this answer again</button><button className="start-interview-button" type="button" onClick={nextQuestion}>{questionIndex + 1 >= plan.questions.length ? "Finish interview" : "Next question"} <ChevronRight size={17} /></button></div></section>}</div></section></main>;
}
