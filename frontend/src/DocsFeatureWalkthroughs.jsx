import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Mic2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import "./DocsFeatureWalkthroughs.css";

const scoreBands = [
  { label: "Needs detail", range: "0–54", tone: "red", detail: "The answer is missing important evidence." },
  { label: "Developing", range: "55–69", tone: "yellow", detail: "Useful evidence is present, but the story still needs work." },
  { label: "Strong", range: "70–84", tone: "green", detail: "The answer clearly demonstrates the competency." },
  { label: "Excellent", range: "85–100", tone: "emerald", detail: "Specific, relevant, well-structured evidence with clear impact." },
];

const weakInterviewScores = [
  ["Relevance", 22],
  ["Structure", 18],
  ["Ownership", 28],
  ["Specificity", 25],
  ["Impact", 20],
  ["Communication", 34],
];

export default function DocsFeatureWalkthroughs() {
  return <section className="docs-feature-walkthroughs" aria-label="How BragStack career tools work">
    <div className="docs-walkthrough-heading">
      <span>SEE IT BEFORE YOU TRY IT</span>
      <h2>Visual walkthroughs of the BragStack workflow.</h2>
      <p>See what you enter, what BragStack evaluates, and what comes back — with realistic examples instead of abstract feature descriptions.</p>
    </div>

    <article className="docs-feature-demo receipt-demo" id="impact-receipt-demo">
      <div className="docs-feature-copy">
        <span><ReceiptText size={16}/> IMPACT RECEIPTS</span>
        <h3>Turn a work memory into reusable career proof.</h3>
        <ol>
          <li><b>Capture the accomplishment.</b> Start with what happened in plain language.</li>
          <li><b>Separate your contribution.</b> Say what you personally decided, built, fixed, changed, led, or influenced.</li>
          <li><b>Add the result.</b> Record what became better, faster, safer, clearer, cheaper, more reliable, or less risky.</li>
          <li><b>Attach safe evidence.</b> Add an approved link, ticket, metric, screenshot, note, or sanitized reference when available.</li>
          <li><b>Tag skills and credit.</b> Capture what the work demonstrates and who else deserves recognition.</li>
        </ol>
        <div className="docs-proof-note"><ShieldCheck size={16}/><span>Proof does not mean oversharing. Keep confidential material, credentials, customer secrets, and restricted code out of BragStack.</span></div>
      </div>

      <div className="docs-receipt-shot" role="img" aria-label="Example BragStack Impact Receipt">
        <div className="receipt-shot-top"><div><ReceiptText size={15}/><span>Impact Receipt</span></div><b>Private</b></div>
        <div className="receipt-shot-body">
          <div className="receipt-field purple"><small>ACCOMPLISHMENT</small><strong>Reduced repeat deployment failures</strong><p>Production deployments were repeatedly failing and creating support escalations.</p></div>
          <div className="receipt-field blue"><small>MY CONTRIBUTION</small><strong>Diagnosed and changed the deployment configuration</strong><p>I reviewed container logs, isolated a memory-limit issue, tested a safer configuration, and coordinated the rollout.</p></div>
          <div className="receipt-field green"><small>RESULT</small><strong>30% fewer repeat failures</strong><p>Over the next month, repeat deployment failures dropped and the support team saw fewer escalations.</p></div>
          <div className="receipt-evidence-row"><span><ShieldCheck size={13}/> Evidence: incident report + change record</span><span>Skills: Kubernetes · Troubleshooting · Reliability</span></div>
        </div>
      </div>
    </article>

    <article className="docs-feature-demo reverse" id="interview-demo">
      <div className="docs-feature-copy">
        <span><Mic2 size={16}/> PRACTICE INTERVIEW</span>
        <h3>Practice the conversation, not a script.</h3>
        <ol>
          <li><b>Tell BragStack the job.</b> Choose your role, level, interview type, and optionally paste the job description.</li>
          <li><b>Meet your interviewer.</b> Aisha asks one question at a time so the session feels like a real interview.</li>
          <li><b>Answer naturally.</b> Speak or type. Career Intelligence™ looks for evidence, ownership, specificity, impact, relevance, and communication.</li>
          <li><b>Get coached honestly.</b> Weak evidence stays weak. BragStack does not turn the “least bad” category green just because it is your highest score.</li>
          <li><b>Try again with a targeted follow-up.</b> Coaching points to the missing evidence instead of handing you a canned answer.</li>
        </ol>
      </div>

      <div className="docs-interview-shot" role="img" aria-label="Example BragStack practice interview with Aisha">
        <div className="interview-shot-top"><span>Practice Interviewer</span><small>Question 3 of 8</small></div>
        <div className="interview-shot-person"><div className="interviewer-avatar">AJ</div><div><b>Aisha Jordan</b><span>Senior Technical Recruiter</span></div><em>Listening…</em></div>
        <div className="interview-shot-question"><small>BEHAVIORAL · PROBLEM SOLVING</small><strong>Tell me about a time you had to solve a complex problem with incomplete information.</strong><p>Tip: Be specific and show what changed because of your work.</p></div>
        <div className="interview-shot-coaching"><span><BrainCircuit size={15}/> Live coaching</span><div><b>Structure</b><i><u style={{width:"76%"}}/></i><small>Good</small></div><div><b>Specificity</b><i><u style={{width:"88%"}}/></i><small>Great</small></div><div><b>Impact</b><i><u style={{width:"67%"}}/></i><small>Build it</small></div></div>
      </div>
    </article>

    <section className="docs-scoring-explainer" id="career-intelligence-scoring" aria-labelledby="scoring-heading">
      <div className="docs-scoring-copy">
        <span><BrainCircuit size={16}/> CAREER INTELLIGENCE™ SCORING</span>
        <h3 id="scoring-heading">Green is earned — not relative.</h3>
        <p>Interview feedback is evidence-anchored. A polished answer can still score poorly if it does not prove the competency being tested, and a bad session can legitimately be red across every dimension.</p>
        <div className="docs-score-bands">{scoreBands.map((band)=><article className={`score-band ${band.tone}`} key={band.label}><div><strong>{band.range}</strong><span>{band.label}</span></div><p>{band.detail}</p></article>)}</div>
        <div className="docs-scoring-note"><Target size={17}/><p><b>Important:</b> “Strongest area” means a score actually reached the Strong threshold. A 56/100 does not become green merely because it was the highest score in a weak interview.</p></div>
      </div>

      <div className="docs-feedback-mockup" role="img" aria-label="Example weak interview feedback showing red scores across all dimensions">
        <div className="feedback-mockup-head"><div><small>ANSWER FEEDBACK</small><strong>Needs detail</strong></div><b>25/100</b></div>
        <div className="feedback-mockup-grid">{weakInterviewScores.map(([name,score])=><article key={name}><div><strong>{name}</strong><span>{score}/100 · Needs detail</span></div><p>{name === "Relevance" ? "The answer does not yet prove the requested competency." : name === "Structure" ? "One or more STAR pieces are missing." : name === "Ownership" ? "It is unclear what you personally owned." : name === "Specificity" ? "The answer relies on broad statements instead of evidence." : name === "Impact" ? "The answer stops before showing what changed." : "The answer is too thin to communicate convincing evidence."}</p></article>)}</div>
        <div className="feedback-mockup-followup"><AlertTriangle size={15}/><div><small>TARGETED FOLLOW-UP</small><p>Name one specific decision or action you personally took, then explain what changed because of it.</p></div></div>
      </div>
    </section>

    <article className="docs-feature-demo" id="resume-demo">
      <div className="docs-feature-copy"><span><FileText size={16}/> RESUME BUILDER</span><h3>Start with proof. Finish with a job-ready draft.</h3><ol><li><b>Paste the target job.</b> BragStack reads what the employer is asking for.</li><li><b>Match your proof.</b> Relevant Impact Receipts are used to support the strongest claims.</li><li><b>Build the draft.</b> Your real accomplishments become concise, ATS-friendly bullets.</li><li><b>See the gaps.</b> Missing requirements are shown as gaps — BragStack does not invent experience to fill them.</li><li><b>Review before using it.</b> The finished document should stay truthful, readable, and sound like you.</li></ol><div className="docs-proof-note"><ShieldCheck size={16}/><span>An ATS match is a preparation signal, not a promise that an employer will interview or hire you.</span></div></div>
      <div className="docs-resume-shot" role="img" aria-label="Example BragStack evidence-backed resume builder result">
        <div className="resume-shot-top"><span><Sparkles size={14}/> Resume · Customer Experience</span><b>92% match</b></div>
        <div className="resume-shot-body"><div className="resume-shot-paper"><h4>MAYA JOHNSON</h4><small>Senior Customer Experience Specialist</small><hr/><b>EXPERIENCE & IMPACT</b><p>• Resolved <mark>18 complex billing cases</mark> without escalation by identifying root causes and coordinating corrections.</p><p>• Earned <mark>7 positive customer mentions</mark> while supporting high-friction customer conversations.</p><p>• Completed <mark>5 peer coaching assists</mark>, sharing resolution patterns with teammates.</p><b>CORE SKILLS</b><p>Customer retention · De-escalation · Billing resolution · Peer coaching</p></div><aside><strong>92%</strong><span>job match</span><p><CheckCircle2 size={13}/> Evidence strength</p><p><CheckCircle2 size={13}/> ATS structure</p><div><b>Evidence gap</b><small>Workforce scheduling</small></div></aside></div>
      </div>
    </article>
  </section>;
}
