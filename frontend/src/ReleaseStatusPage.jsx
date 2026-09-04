import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  LifeBuoy,
  LockKeyhole,
  Network,
  ReceiptText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import "./ReleaseStatusPage.css";

const model = [
  { name: "Capture", detail: "Save real accomplishments while the details are fresh.", status: "Live" },
  { name: "Prove", detail: "Add contribution, result, evidence, skills, shared credit, and confirmation.", status: "Live" },
  { name: "Package", detail: "Reuse proof for resumes, interviews, reviews, promotions, and packets.", status: "Live" },
  { name: "Share", detail: "Publish only the selected proof you intentionally want others to see.", status: "Live" },
  { name: "Connect", detail: "Turn interest in selected proof into a useful professional conversation.", status: "Next" },
];

const liveFeatures = [
  [BriefcaseBusiness, "Career Dashboard", "A quick view of accomplishments, skills, evidence, and Impact Receipts."],
  [ReceiptText, "Impact Receipts", "Structured career evidence built from the user's real work, contribution, and result."],
  [ShieldCheck, "Receipt Verification", "Optional confirmation from someone who genuinely knows the specific work."],
  [Sparkles, "Career Intelligence", "Evidence-grounded guidance that helps organize and strengthen real career stories."],
  [BookOpen, "Resume + Interview", "Resume Builder and Aisha practice interviews use the user's actual saved proof and inputs."],
  [BriefcaseBusiness, "Career Analytics + Packets", "Performance review, promotion, interview, and other career packaging workflows."],
  [Network, "Public Proof Profile", "A curated public career-evidence view without exposing the private workspace."],
  [GraduationCap, "Education", "An 18+ education workspace for scholarships, programs, internships, essay stories, and saved education wins."],
  [LifeBuoy, "Support Center", "Authenticated, categorized support intake for bugs, accounts, billing, education, accessibility, privacy/security, and requests."],
  [LockKeyhole, "Privacy-first controls", "Private by default, explicit sharing, NDA guidance, and no invented evidence or outcome predictions."],
];

const nextItems = [
  {
    icon: Network,
    title: "Proof Profile 2.0 + Open to Talk",
    copy: "Stronger featured proof, safer sharing controls, and an opt-in way for recruiters, managers, collaborators, or interviewers to request a conversation.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Packaging + recognition polish",
    copy: "Branded packet themes, selective sections, better share metadata, and stronger contribution/recognition workflows without turning BragStack into workplace surveillance.",
  },
  {
    icon: CalendarDays,
    title: "Controlled availability",
    copy: "Start with bounded booking links or availability blocks. Native Google/Outlook calendar integrations remain a later step rather than a launch dependency.",
  },
];

const laterItems = [
  [Users, "Team and Enterprise", "Team review workflows, aggregate organization intelligence, SSO, SCIM, audit, retention, RBAC, and deeper integrations stay separate from individual Pro."],
  [GraduationCap, "Under-18 student accounts", "Middle School and other minor accounts remain Coming Soon until youth privacy, parental/guardian consent, retention, safety, school-data, vendor, and legal release gates are completed."],
  [Rocket, "Deeper integrations", "Native calendar sync, HRIS connections, richer packet expiration/revocation, and broader organization intelligence come after the individual evidence network is stable."],
];

function StatusPill({ children, tone = "live" }) {
  return <span className={`release-status-pill ${tone}`}>{children}</span>;
}

export default function ReleaseStatusPage() {
  return <main className="release-page">
    <header className="release-topbar">
      <a className="release-brand" href="/docs"><img src="/brandmark.svg" alt=""/><span><strong>BragStack</strong><small>Release status</small></span></a>
      <nav aria-label="Release documentation"><a href="/docs">Help Center</a><a href="/docs/education">Education</a><a href="/security">Security</a><a href="/privacy">Privacy</a><a href="/login">Sign in</a></nav>
    </header>

    <article className="release-shell">
      <section className="release-hero">
        <StatusPill tone="temporary">TEMPORARY OPEN ACCESS</StatusPill>
        <h1>BragStack is becoming a career evidence network.</h1>
        <p>The model is simple: capture real work, prove what happened, package the evidence, share only what you choose, and create a path to the right professional conversation.</p>
        <div className="release-open-access">
          <Sparkles size={22}/>
          <div><strong>Individual BragStack Pro is temporarily available at no charge.</strong><span>No card and no new subscription are required during this temporary open-access period. Team and Enterprise features are not included.</span></div>
        </div>
      </section>

      <section className="release-section" aria-labelledby="model-heading">
        <div className="release-heading"><span>THE BRAGSTACK MODEL</span><h2 id="model-heading">Capture → Prove → Package → Share → Connect</h2><p>The product is one evidence loop, not a pile of disconnected career tools.</p></div>
        <div className="release-model-flow">
          {model.map((step, index) => <article className={`release-model-card ${step.status === "Next" ? "next" : "live"}`} key={step.name}>
            <div className="release-model-number">{index + 1}</div>
            <div><div className="release-card-top"><h3>{step.name}</h3><StatusPill tone={step.status === "Next" ? "next" : "live"}>{step.status}</StatusPill></div><p>{step.detail}</p></div>
            {index < model.length - 1 && <ArrowRight className="release-model-arrow" size={18}/>} 
          </article>)}
        </div>
      </section>

      <section className="release-section" aria-labelledby="live-heading">
        <div className="release-heading"><span>AVAILABLE NOW</span><h2 id="live-heading">What customers can use today</h2><p>These are current product surfaces, not speculative roadmap promises.</p></div>
        <div className="release-feature-grid">
          {liveFeatures.map(([Icon, title, copy]) => <article className="release-feature-card" key={title}><div className="release-feature-icon"><Icon size={20}/></div><div><div className="release-card-top"><h3>{title}</h3><StatusPill>Live</StatusPill></div><p>{copy}</p></div></article>)}
        </div>
      </section>

      <section className="release-section release-next" aria-labelledby="next-heading">
        <div className="release-heading"><span>COMING NEXT</span><h2 id="next-heading">What we are building toward</h2><p>Roadmap direction can change as BragStack learns from real usage. “Coming next” describes priority, not a guaranteed ship date.</p></div>
        <div className="release-next-grid">
          {nextItems.map(({ icon: Icon, title, copy }, index) => <article key={title}><div className="release-next-step"><span>0{index + 1}</span><Icon size={21}/></div><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="release-section" aria-labelledby="later-heading">
        <div className="release-heading"><span>LATER / GATED</span><h2 id="later-heading">Important things we are deliberately not pretending are ready</h2><p>These areas need more product, privacy, security, operational, or legal work before broad release.</p></div>
        <div className="release-later-grid">
          {laterItems.map(([Icon, title, copy]) => <article key={title}><Icon size={21}/><div><h3>{title}</h3><p>{copy}</p></div></article>)}
        </div>
      </section>

      <section className="release-trust">
        <ShieldCheck size={24}/>
        <div><strong>Evidence integrity stays the rule.</strong><p>BragStack may organize, rank, summarize, coach, or rewrite material a user provides. It should not manufacture metrics, credentials, employment history, admissions odds, scholarship odds, hiring predictions, verification, or other unsupported claims.</p></div>
      </section>

      <footer className="release-footer"><p>Updated September 2026. For detailed product guidance, use the <a href="/docs">Help Center</a>. Education-specific guidance lives at <a href="/docs/education">Education</a>.</p></footer>
    </article>
  </main>;
}
