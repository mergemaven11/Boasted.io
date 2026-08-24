import { CheckCircle2, FileText, ShieldCheck, Sparkles, Target } from "lucide-react";
import "./LandingResumeShowcase.css";

export default function LandingResumeShowcase() {
  return <section className="landing-resume-showcase">
    <div className="landing-resume-copy">
      <span>BRAGSTACK PRO · RESUME BUILDER</span>
      <h2>Your work already happened. Your resume should prove it.</h2>
      <p>Paste the job description and BragStack turns your saved Impact Receipts into evidence-backed, ATS-friendly resume content — while showing what the job asks for that your proof does not cover yet.</p>
      <div className="landing-resume-points"><div><ShieldCheck size={18} />Built from career proof you recorded</div><div><Target size={18} />Matched to the job you actually want</div><div><FileText size={18} />ATS-friendly, editable resume draft</div></div>
      <a href="/register">Build my evidence-backed resume</a>
    </div>

    <div className="landing-resume-window">
      <div className="landing-resume-window-top"><span><Sparkles size={14}/> Evidence-backed resume preview</span><em>ATS Readiness · 92%</em></div>
      <div className="landing-resume-demo">
        <article className="resume-paper">
          <header><div><h3>MAYA JOHNSON</h3><small>Senior Customer Experience Specialist</small></div><span>Atlanta, GA · maya@email.com</span></header>
          <div className="resume-rule" />
          <section><h4>PROFESSIONAL SUMMARY</h4><p>Customer experience professional known for resolving complex account issues, preventing escalations, and turning difficult interactions into retained relationships.</p></section>
          <section><h4>EXPERIENCE</h4>
            <div className="resume-job"><div><strong>Senior Customer Experience Specialist</strong><span className="company-redacted">████████ SERVICES</span></div><small>2023 — Present</small></div>
            <ul><li><b>Resolved 18 complex billing cases</b> without escalation in one month by identifying root causes, coordinating corrections, and clearly guiding customers through next steps.</li><li>Earned <b>7 positive customer mentions</b> while supporting high-friction account and billing conversations.</li><li>Supported <b>5 peer coaching assists</b>, sharing de-escalation techniques and resolution patterns with teammates.</li></ul>
            <div className="resume-job second"><div><strong>Customer Support Specialist</strong><span className="company-redacted short">██████ INC.</span></div><small>2021 — 2023</small></div>
            <ul><li>Handled a high-volume customer queue while documenting recurring issues and surfacing patterns to team leads.</li></ul>
          </section>
          <section><h4>CORE SKILLS</h4><div className="resume-skills"><span>De-escalation</span><span>Customer retention</span><span>Billing resolution</span><span>Peer coaching</span></div></section>
        </article>

        <aside className="resume-score-card">
          <div className="score-ring"><strong>92%</strong><span>job match</span></div>
          <div className="score-check"><CheckCircle2 size={15}/><span><b>Evidence strength</b><small>Strong</small></span></div>
          <div className="score-check"><CheckCircle2 size={15}/><span><b>Impact language</b><small>Strong</small></span></div>
          <div className="score-check"><CheckCircle2 size={15}/><span><b>ATS structure</b><small>Ready</small></span></div>
          <div className="score-gap"><b>Evidence gap</b><span>Workforce scheduling</span><small>Don’t invent it. Add proof if you have it.</small></div>
        </aside>
      </div>
      <div className="resume-proof-strip"><ShieldCheck size={15}/><span><b>Source linked</b> · Every highlighted claim traces back to saved career proof.</span></div>
    </div>
  </section>;
}
