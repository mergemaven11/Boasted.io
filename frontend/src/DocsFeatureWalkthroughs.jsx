import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Mic2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";
import "./DocsFeatureWalkthroughs.css";
import "./DocsCustomerGuide.css";

const featureCards = [
  {
    icon: ReceiptText,
    title: "Impact Receipts",
    color: "purple",
    what: "Save a meaningful win while the details are still fresh.",
    when: "After a project, customer save, launch, fix, improvement, leadership moment, or other work you may want to remember later.",
    result: "A reusable record of what happened, what you did, and what changed.",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    color: "blue",
    what: "Turn relevant career proof into a focused resume draft.",
    when: "When you have a specific job in mind and want your resume to reflect the work you can actually support.",
    result: "A job-focused draft plus clear reminders about gaps you may still need to address.",
  },
  {
    icon: Mic2,
    title: "Practice Interview",
    color: "pink",
    what: "Practice answering real interview-style questions out loud or by text.",
    when: "Before an interview, after a rough practice round, or anytime you want to make your examples clearer.",
    result: "Question-by-question coaching and a summary of what to improve next.",
  },
  {
    icon: BrainCircuit,
    title: "Career Intelligence™",
    color: "indigo",
    what: "Helps you understand whether your career story is clear, relevant, and supported by real examples.",
    when: "While building a resume, practicing interviews, or deciding which accomplishments best fit an opportunity.",
    result: "Plain-language guidance about what is convincing and what still needs detail.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Reviews & promotions",
    color: "green",
    what: "Pull together proof from across the year instead of relying on memory at review time.",
    when: "Before a performance review, promotion conversation, career packet, or manager check-in.",
    result: "A stronger record of growth, ownership, results, and repeated contributions.",
  },
  {
    icon: UserRound,
    title: "Public Proof Profile",
    color: "orange",
    what: "Share selected career proof in a portfolio-style view.",
    when: "When you want recruiters, hiring managers, clients, or collaborators to see a curated version of your work.",
    result: "A shareable career story without exposing everything in your private workspace.",
  },
];

const goalPaths = [
  { title: "I am applying for a job", steps: ["Save your strongest wins", "Paste the target job", "Build and review the resume", "Practice the interview"] },
  { title: "I have an interview", steps: ["Choose the target role", "Practice with Aisha", "Read the coaching", "Retry your weakest answers"] },
  { title: "I have a review or promotion talk", steps: ["Look back at your receipts", "Group repeated impact", "Pull out growth and ownership", "Build your talking points"] },
  { title: "I want a portfolio", steps: ["Choose safe public proof", "Remove confidential details", "Publish only what you mean to share", "Keep private work private"] },
];

const feedbackColors = [
  { label: "Needs detail", tone: "red", detail: "The answer is too thin, vague, or off target to be convincing yet." },
  { label: "Developing", tone: "yellow", detail: "There is something useful here, but the story still needs clearer evidence or structure." },
  { label: "Strong", tone: "green", detail: "The answer clearly shows what you did and why it mattered." },
  { label: "Excellent", tone: "emerald", detail: "The answer is specific, relevant, easy to follow, and backed by a strong example." },
];

const weakInterviewFeedback = [
  ["Relevance", "Needs detail"],
  ["Structure", "Needs detail"],
  ["Ownership", "Needs detail"],
  ["Specificity", "Needs detail"],
  ["Impact", "Needs detail"],
  ["Communication", "Needs detail"],
];

function FeatureGuide() {
  return <section className="docs-feature-guide" aria-labelledby="feature-guide-heading">
    <div className="docs-feature-guide-heading">
      <span>FEATURES IN PLAIN ENGLISH</span>
      <h2 id="feature-guide-heading">What each feature is for.</h2>
      <p>You should not need product jargon to know where to start. Pick the thing you are trying to do, then use the feature that helps with that moment.</p>
    </div>
    <div className="docs-feature-guide-grid">
      {featureCards.map(({ icon: Icon, title, color, what, when, result }) => <article className={`docs-feature-guide-card ${color}`} key={title}>
        <div className="docs-feature-guide-icon"><Icon size={20}/></div>
        <h3>{title}</h3>
        <p>{what}</p>
        <dl>
          <div><dt>Use it when</dt><dd>{when}</dd></div>
          <div><dt>You get</dt><dd>{result}</dd></div>
        </dl>
      </article>)}
    </div>
  </section>;
}

function GoalGuide() {
  return <section className="docs-goal-guide" aria-labelledby="goal-guide-heading">
    <div className="docs-goal-guide-heading"><span>START WITH YOUR GOAL</span><h2 id="goal-guide-heading">Not sure which feature to open first?</h2><p>Follow the path that matches what is happening in your career right now.</p></div>
    <div className="docs-goal-grid">{goalPaths.map((goal) => <article key={goal.title}><strong>{goal.title}</strong><div>{goal.steps.map((step, index) => <span key={step}><b>{index + 1}</b>{step}{index < goal.steps.length - 1 && <ArrowRight size={13}/>}</span>)}</div></article>)}</div>
  </section>;
}

export default function DocsFeatureWalkthroughs() {
  return <section className="docs-feature-walkthroughs" aria-label="How BragStack career tools work">
    <FeatureGuide/>
    <GoalGuide/>

    <div className="docs-walkthrough-heading">
      <span>SEE IT BEFORE YOU TRY IT</span>
      <h2>Simple walkthroughs of the main BragStack features.</h2>
      <p>Each example shows the basic idea: what you put in, what you see, and how the feature can help you move forward.</p>
    </div>

    <article className="docs-feature-demo receipt-demo" id="impact-receipt-demo">
      <div className="docs-feature-copy">
        <span><ReceiptText size={16}/> IMPACT RECEIPTS</span>
        <h3>Turn a work memory into something you can reuse later.</h3>
        <ol>
          <li><b>Write down the win.</b> Start with what happened in normal language.</li>
          <li><b>Say what you personally did.</b> Focus on your decision, action, contribution, or leadership.</li>
          <li><b>Describe what changed.</b> The result can be measurable or simply clear and meaningful.</li>
          <li><b>Add safe proof when you have it.</b> A ticket, approved screenshot, note, metric, link, or sanitized reference can help.</li>
          <li><b>Reuse it later.</b> The same receipt can support a resume, interview answer, review, promotion conversation, or profile.</li>
        </ol>
        <div className="docs-proof-note"><ShieldCheck size={16}/><span>Keep confidential material out. A useful career summary is better than copying sensitive company information into your personal workspace.</span></div>
      </div>

      <div className="docs-receipt-shot" role="img" aria-label="Example BragStack Impact Receipt">
        <div className="receipt-shot-top"><div><ReceiptText size={15}/><span>Impact Receipt</span></div><b>Private</b></div>
        <div className="receipt-shot-body">
          <div className="receipt-field purple"><small>WHAT HAPPENED</small><strong>Reduced repeat deployment failures</strong><p>Production deployments were repeatedly failing and creating support escalations.</p></div>
          <div className="receipt-field blue"><small>WHAT I DID</small><strong>Diagnosed and changed the deployment configuration</strong><p>I reviewed logs, found the problem, tested a safer change, and helped roll it out.</p></div>
          <div className="receipt-field green"><small>WHAT CHANGED</small><strong>Fewer repeat failures</strong><p>Deployments became more reliable and the support team saw fewer repeat escalations.</p></div>
          <div className="receipt-evidence-row"><span><ShieldCheck size={13}/> Safe reference: incident + change record</span><span>Skills: Troubleshooting · Reliability · Ownership</span></div>
        </div>
      </div>
    </article>

    <article className="docs-feature-demo reverse" id="interview-demo">
      <div className="docs-feature-copy">
        <span><Mic2 size={16}/> PRACTICE INTERVIEW</span>
        <h3>Practice the conversation, not a memorized script.</h3>
        <ol>
          <li><b>Choose the role.</b> Add the job you are preparing for and, if you want, the job description.</li>
          <li><b>Answer one question at a time.</b> Speak naturally or type your answer.</li>
          <li><b>Read the feedback.</b> BragStack points out what came across clearly and what still needs work.</li>
          <li><b>Use the follow-up.</b> If your answer is vague, the next prompt helps you add the missing detail.</li>
          <li><b>Try again.</b> The goal is not a perfect script. It is a stronger, clearer version of your real story.</li>
        </ol>
        <div className="docs-proof-note"><Target size={16}/><span>Interview feedback is coaching, not a hiring prediction. Use it to practice and improve, not as a guarantee of what an employer will decide.</span></div>
      </div>

      <div className="docs-interview-shot" role="img" aria-label="Example BragStack practice interview with Aisha">
        <div className="interview-shot-top"><span>Practice Interviewer</span><small>Question 3 of 8</small></div>
        <div className="interview-shot-person"><div className="interviewer-avatar">AJ</div><div><b>Aisha Jordan</b><span>Virtual interviewer</span></div><em>Listening…</em></div>
        <div className="interview-shot-question"><small>BEHAVIORAL · PROBLEM SOLVING</small><strong>Tell me about a time you had to solve a complex problem with incomplete information.</strong><p>Tip: Be specific and show what changed because of your work.</p></div>
        <div className="interview-shot-coaching"><span><BrainCircuit size={15}/> Coaching</span><div><b>Structure</b><i><u style={{width:"76%"}}/></i><small>Strong</small></div><div><b>Specificity</b><i><u style={{width:"88%"}}/></i><small>Strong</small></div><div><b>Impact</b><i><u style={{width:"67%"}}/></i><small>Developing</small></div></div>
      </div>
    </article>

    <section className="docs-scoring-explainer" id="career-intelligence-scoring" aria-labelledby="scoring-heading">
      <div className="docs-scoring-copy">
        <span><BrainCircuit size={16}/> UNDERSTANDING YOUR FEEDBACK</span>
        <h3 id="scoring-heading">What the colors mean.</h3>
        <p>The colors are there to make coaching easier to scan. They help you see which parts of an answer are ready and which parts deserve another try.</p>
        <div className="docs-score-bands">{feedbackColors.map((band)=><article className={`score-band ${band.tone}`} key={band.label}><div><span>{band.label}</span></div><p>{band.detail}</p></article>)}</div>
        <div className="docs-scoring-note"><Target size={17}/><p><b>One simple rule:</b> a weak interview should look weak. BragStack only highlights a strength when the answer actually demonstrates one.</p></div>
      </div>

      <div className="docs-feedback-mockup" role="img" aria-label="Example weak interview feedback showing needs-detail feedback across all dimensions">
        <div className="feedback-mockup-head"><div><small>ANSWER FEEDBACK</small><strong>Needs detail</strong></div><b>Try again</b></div>
        <div className="feedback-mockup-grid">{weakInterviewFeedback.map(([name, status])=><article key={name}><div><strong>{name}</strong><span>{status}</span></div><p>{name === "Relevance" ? "The answer does not yet connect clearly to the question." : name === "Structure" ? "The story is missing a clear beginning, action, or result." : name === "Ownership" ? "It is hard to tell what you personally did." : name === "Specificity" ? "The answer is too general to feel convincing." : name === "Impact" ? "The answer does not explain what changed afterward." : "The answer needs more detail to communicate the story clearly."}</p></article>)}</div>
        <div className="feedback-mockup-followup"><AlertTriangle size={15}/><div><small>NEXT PRACTICE PROMPT</small><p>Name one specific action you took, then explain what changed because of it.</p></div></div>
      </div>
    </section>

    <article className="docs-feature-demo" id="resume-demo">
      <div className="docs-feature-copy">
        <span><FileText size={16}/> RESUME BUILDER</span>
        <h3>Start with your proof. Finish with a focused draft.</h3>
        <ol>
          <li><b>Paste the job you want.</b> This gives the resume a clear target.</li>
          <li><b>Choose the proof that fits.</b> Use accomplishments that genuinely support the role.</li>
          <li><b>Build the draft.</b> Your saved work becomes concise resume language.</li>
          <li><b>Review the gaps.</b> If the job asks for something you have not shown, BragStack calls it out instead of pretending it is there.</li>
          <li><b>Edit before applying.</b> Make sure the final resume is accurate, readable, and sounds like you.</li>
        </ol>
        <div className="docs-proof-note"><ShieldCheck size={16}/><span>A strong match can help you prepare, but it is not a promise that an employer will interview or hire you.</span></div>
      </div>
      <div className="docs-resume-shot" role="img" aria-label="Example BragStack evidence-backed resume builder result">
        <div className="resume-shot-top"><span><Sparkles size={14}/> Resume · Customer Experience</span><b>Strong fit</b></div>
        <div className="resume-shot-body"><div className="resume-shot-paper"><h4>MAYA JOHNSON</h4><small>Senior Customer Experience Specialist</small><hr/><b>EXPERIENCE & IMPACT</b><p>• Resolved <mark>complex billing cases</mark> without escalation by identifying root causes and coordinating corrections.</p><p>• Earned <mark>positive customer feedback</mark> while handling high-friction conversations.</p><p>• Supported <mark>peer coaching</mark>, sharing useful resolution patterns with teammates.</p><b>CORE SKILLS</b><p>Customer retention · De-escalation · Billing resolution · Peer coaching</p></div><aside><strong>Strong</strong><span>role fit</span><p><CheckCircle2 size={13}/> Relevant proof</p><p><CheckCircle2 size={13}/> Clear structure</p><div><b>Evidence gap</b><small>Workforce scheduling</small></div></aside></div>
      </div>
    </article>

    <section className="docs-trust-boundary" aria-label="What BragStack does and does not do">
      <div><ShieldCheck size={19}/><strong>BragStack helps organize and explain your real career proof.</strong></div>
      <p>It should not invent experience, guarantee an interview, guarantee a promotion, or automatically make your private work public. You stay responsible for reviewing what you save, generate, and share.</p>
    </section>
  </section>;
}
