import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, CheckCircle2, Mic, Sparkles } from "lucide-react";
import "./LandingInterviewShowcase.css";

export default function LandingInterviewShowcase() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTarget(document.querySelector(".landing-workflow"));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!target) return null;

  return createPortal(
    <section className="landing-interview-showcase" aria-label="BragStack Pro Practice Interviewer preview">
      <div className="interview-showcase-copy">
        <span className="showcase-pro-label"><Sparkles size={14} /> OPEN ACCESS · BRAGSTACK PRO</span>
        <h2>Practice the interview before it counts.</h2>
        <p>Choose virtually any career and target role. BragStack asks realistic questions, coaches weak answers with follow-ups, and shows where your stories are strong—or missing the result.</p>
        <div className="showcase-benefits">
          <span><CheckCircle2 size={17} /> Career-aware questions for roles across industries</span>
          <span><CheckCircle2 size={17} /> Personalized questions from your Impact Receipts</span>
          <span><CheckCircle2 size={17} /> Camera and voice practice where your browser supports it</span>
          <span><CheckCircle2 size={17} /> Final strengths, improvement areas, pacing, and answer patterns</span>
        </div>
        <a className="landing-btn" href="/register">Try Practice Interview free</a>
        <small>Pro is temporarily open to everyone at no charge. No new paid subscription is required during the open-access period.</small>
      </div>

      <div className="showcase-product-shot" aria-label="Illustrative BragStack interview room">
        <div className="showcase-window-bar"><span /><span /><span /><strong>Practice Interview · Registered Nurse</strong></div>
        <div className="showcase-video-area">
          <div className="showcase-interviewer"><div>BS</div><span>BragStack Interviewer</span><strong>Listening</strong></div>
          <div className="showcase-self-view"><Camera size={20} /><span>You</span></div>
          <div className="showcase-call-controls"><span><Mic size={14} /> Mic</span><span><Camera size={14} /> Camera</span></div>
        </div>
        <div className="showcase-question">
          <small>QUESTION 4 OF 8</small>
          <strong>Tell me about a time you had to make a careful decision under pressure.</strong>
        </div>
        <div className="showcase-feedback">
          <span className="good">Action · Strong</span><span>Specificity · Developing</span><span className="attention">Result · Needs detail</span>
        </div>
        <div className="showcase-followup"><small>INTERVIEWER FOLLOW-UP</small><p>What changed as a result of your actions?</p></div>
      </div>
    </section>,
    target,
  );
}
