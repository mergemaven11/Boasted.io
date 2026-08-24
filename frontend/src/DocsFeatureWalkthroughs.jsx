import { BrainCircuit, CheckCircle2, FileText, Mic2, ShieldCheck, Sparkles } from "lucide-react";
import "./DocsFeatureWalkthroughs.css";

export default function DocsFeatureWalkthroughs() {
  return <section className="docs-feature-walkthroughs" aria-label="How BragStack career tools work">
    <div className="docs-walkthrough-heading"><span>SEE IT BEFORE YOU TRY IT</span><h2>What happens when you use BragStack?</h2><p>Two quick visual examples — no technical language required.</p></div>

    <article className="docs-feature-demo" id="interview-demo">
      <div className="docs-feature-copy"><span><Mic2 size={16}/> PRACTICE INTERVIEW</span><h3>Practice the conversation, not a script.</h3><ol><li><b>Tell BragStack the job.</b> Choose your role, level, interview type, and optionally paste the job description.</li><li><b>Meet your interviewer.</b> Aisha asks one question at a time so the session feels like a real interview.</li><li><b>Answer naturally.</b> Speak or type. BragStack listens for evidence, ownership, specificity, impact, and relevance.</li><li><b>Get coached.</b> Career Intelligence™ can ask a follow-up when the answer needs stronger proof, then shows what to improve.</li></ol></div>
      <div className="docs-interview-shot" role="img" aria-label="Example BragStack practice interview with Aisha">
        <div className="interview-shot-top"><span>Practice Interviewer</span><small>Question 3 of 8</small></div>
        <div className="interview-shot-person"><div className="interviewer-avatar">AJ</div><div><b>Aisha Jordan</b><span>Senior Technical Recruiter</span></div><em>Listening…</em></div>
        <div className="interview-shot-question"><small>BEHAVIORAL · PROBLEM SOLVING</small><strong>Tell me about a time you had to solve a complex problem with incomplete information.</strong><p>Tip: Be specific and show what changed because of your work.</p></div>
        <div className="interview-shot-coaching"><span><BrainCircuit size={15}/> Live coaching</span><div><b>Structure</b><i><u style={{width:"76%"}}/></i><small>Good</small></div><div><b>Specificity</b><i><u style={{width:"88%"}}/></i><small>Great</small></div><div><b>Impact</b><i><u style={{width:"67%"}}/></i><small>Build it</small></div></div>
      </div>
    </article>

    <article className="docs-feature-demo reverse" id="resume-demo">
      <div className="docs-feature-copy"><span><FileText size={16}/> RESUME BUILDER</span><h3>Start with proof. Finish with a job-ready draft.</h3><ol><li><b>Paste the target job.</b> BragStack reads what the employer is asking for.</li><li><b>Match your proof.</b> Relevant Impact Receipts are used to support the strongest claims.</li><li><b>Build the draft.</b> Your real accomplishments become concise, ATS-friendly bullets.</li><li><b>See the gaps.</b> Missing requirements are shown as gaps — BragStack does not invent experience to fill them.</li></ol><div className="docs-proof-note"><ShieldCheck size={16}/><span>Your final resume should sound like you. Review and edit before applying.</span></div></div>
      <div className="docs-resume-shot" role="img" aria-label="Example BragStack evidence-backed resume builder result">
        <div className="resume-shot-top"><span><Sparkles size={14}/> Resume · Customer Experience</span><b>92% match</b></div>
        <div className="resume-shot-body"><div className="resume-shot-paper"><h4>MAYA JOHNSON</h4><small>Senior Customer Experience Specialist</small><hr/><b>EXPERIENCE & IMPACT</b><p>• Resolved <mark>18 complex billing cases</mark> without escalation by identifying root causes and coordinating corrections.</p><p>• Earned <mark>7 positive customer mentions</mark> while supporting high-friction customer conversations.</p><p>• Completed <mark>5 peer coaching assists</mark>, sharing resolution patterns with teammates.</p><b>CORE SKILLS</b><p>Customer retention · De-escalation · Billing resolution · Peer coaching</p></div><aside><strong>92%</strong><span>job match</span><p><CheckCircle2 size={13}/> Evidence strength</p><p><CheckCircle2 size={13}/> ATS structure</p><div><b>Evidence gap</b><small>Workforce scheduling</small></div></aside></div>
      </div>
    </article>
  </section>;
}
