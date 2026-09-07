import { useEffect } from "react";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  Database,
  FilePenLine,
  GraduationCap,
  Landmark,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import "./EducationMarketingPage.css";

const studentWins = [
  "Coursework, labs, and class projects you are proud of",
  "Academic honors, scholarships, competitions, or recognition",
  "Research, capstones, presentations, and group-project contributions",
  "Campus leadership, service, clubs, and community work",
  "Certifications, licenses, bootcamps, and professional training",
  "Internships, first jobs, side projects, and skills you worked hard to build",
];

const stages = [
  { title: "College / University", text: "Track coursework, research, internships, campus leadership, projects, awards, service, and the skills you are building." },
  { title: "Trade / Technical", text: "Document hands-on training, apprenticeships, practical projects, licenses, certifications, and demonstrated technical skills." },
  { title: "Continuing Education", text: "Keep proof from bootcamps, certifications, professional development, online learning, and career-transition programs." },
  { title: "Career", text: "Carry the same evidence forward into resumes, interviews, portfolios, reviews, promotions, and professional opportunities." },
];

const opportunityTools = [
  {
    icon: Search,
    eyebrow: "LICENSED CATALOG",
    title: "Scholarship Finder",
    text: "Search current scholarships with natural-language query understanding, filters, deadlines, award amounts, provenance, and 20/40-result pagination.",
    detail: "The seed catalog is accepted only from an explicitly licensed CC BY source. Scholarship providers can submit their own listings for review; submissions never auto-publish.",
  },
  {
    icon: MapPin,
    eyebrow: "U.S. DEPARTMENT OF EDUCATION",
    title: "Program Finder",
    text: "Turn your demonstrated interests and skills into editable search ideas, then explore College Scorecard programs by city or state.",
    detail: "School/program data stays separate from your private evidence. Aggregate cost and outcome fields are context—not personal predictions.",
  },
  {
    icon: BriefcaseBusiness,
    eyebrow: "USAJOBS",
    title: "Federal Internship Finder",
    text: "Use career directions already showing up in your record to search current federal internship and student-trainee opportunities near you.",
    detail: "Boasted only displays listings with an explicit intern or student-trainee signal and never predicts hiring or selection.",
  },
  {
    icon: FilePenLine,
    eyebrow: "YOUR EVIDENCE",
    title: "Essay Story Prep",
    text: "Rediscover real moments involving growth, curiosity, challenge, values, leadership, service, and contribution when an application asks for a story.",
    detail: "Boasted helps you find your own material. It does not invent a life experience or turn an essay into a fabricated admissions narrative.",
  },
];

const proofTools = [
  { icon: GraduationCap, title: "Major Explorer", text: "Explore broad academic directions from the skills and interests actually demonstrated in your saved record—without a fake aptitude score." },
  { icon: TrendingUp, title: "Skills from Education", text: "See the skill signals that recur across coursework, projects, service, certifications, and practical work, with links back to evidence." },
  { icon: Target, title: "Career directions", text: "Translate education evidence into career directions worth exploring, then reuse those directions as search ideas for programs and internships." },
  { icon: Award, title: "Application evidence", text: "Surface the saved examples most useful for scholarships, programs, internships, résumés, interviews, and portfolios without inventing achievements." },
];

export default function EducationMarketingPage() {
  useEffect(() => {
    document.title = "Boasted Education | Scholarships, programs, internships & career proof";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "Boasted Education helps learners save real education evidence, search licensed scholarships, explore College Scorecard programs, find USAJOBS federal internships, and reuse the same proof for careers.");
  }, []);

  return <main className="education-marketing">
    <header className="education-nav">
      <a className="education-brand" href="/">Boasted</a>
      <nav aria-label="Education navigation">
        <a className="active" href="/education">Education</a>
        <a href="#opportunities">Opportunity tools</a>
        <a href="#proof">Evidence intelligence</a>
        <a href="/docs/education">Education guide</a>
        <a href="/legal/education-data">Sources & audit</a>
      </nav>
      <div className="education-nav-actions"><a href="/login">Log in</a><a className="education-primary" href="/register">Start free</a></div>
    </header>

    <section className="education-hero">
      <div>
        <p className="education-eyebrow"><Sparkles size={16}/> BOASTED EDUCATION</p>
        <h1>Turn what you learn into <span>proof—and your next opportunity.</span></h1>
        <p className="education-lede">Save coursework, projects, research, certifications, service, leadership, training, and internships once. Then use the same real evidence to explore scholarships, programs, federal internships, majors, careers, résumés, interviews, and application stories.</p>
        <div className="education-actions"><a className="education-primary" href="/register">Start building my record <ArrowRight size={18}/></a><a className="education-secondary" href="/docs/education">Explore the Education guide</a></div>
        <p className="education-note"><LockKeyhole size={15}/> Private by default · no admissions odds · no scholarship odds · no invented achievements.</p>
        <div className="education-hero-badges">
          <span><ShieldCheck size={15}/> Licensed scholarship source</span>
          <span><Landmark size={15}/> Official public data</span>
          <span><Database size={15}/> Permanent source audit</span>
        </div>
      </div>
      <aside className="education-story-card education-command-card">
        <span>ONE RECORD → MANY NEXT MOVES</span>
        <h2>Your evidence becomes the starting point.</h2>
        <div className="education-command-row"><b>Saved proof</b><small>Coursework · projects · service · training · work</small></div>
        <div className="education-command-arrow">↓</div>
        <div className="education-command-row"><b>Education Intelligence</b><small>Skills · themes · directions · evidence gaps</small></div>
        <div className="education-command-arrow">↓</div>
        <div className="education-command-grid"><span>Scholarships</span><span>Programs</span><span>Internships</span><span>Essays</span></div>
        <p>Suggestions help you search. They never become a prediction that you will be admitted, selected, hired, funded, or successful.</p>
      </aside>
    </section>

    <section className="education-source-strip" aria-label="Education source trust">
      <span><ShieldCheck size={17}/> Source rights checked before use</span>
      <span><Database size={17}/> Provenance stays visible</span>
      <span><LockKeyhole size={17}/> Private evidence is not copied into public source databases</span>
      <a href="/legal/education-data">View source & licensing audit <ArrowRight size={15}/></a>
    </section>

    <section className="education-section" id="opportunities">
      <div className="education-heading"><p>NEW OPPORTUNITY DISCOVERY</p><h2>Search with context instead of starting from a blank box.</h2><span>Boasted can use the themes already supported by your saved evidence as editable search ideas. You stay in control of the query, location, and final decision.</span></div>
      <div className="education-opportunity-grid">{opportunityTools.map(({ icon: Icon, eyebrow, title, text, detail }) => <article key={title}><div className="education-feature-icon"><Icon size={22}/></div><small>{eyebrow}</small><h3>{title}</h3><p>{text}</p><div className="education-feature-detail"><ShieldCheck size={15}/><span>{detail}</span></div></article>)}</div>
    </section>

    <section className="education-section education-alt" id="proof">
      <div className="education-heading"><p>EVIDENCE INTELLIGENCE</p><h2>Your search starts with what you actually did.</h2><span>Education Intelligence reviews the accomplishments and Impact Receipts you saved, then surfaces useful themes, skills, and directions without pretending it can measure your potential.</span></div>
      <div className="education-proof-grid">{proofTools.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={22}/><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="education-section" id="journey">
      <div className="education-heading"><p>THE EDUCATION JOURNEY</p><h2>Capture the story while you are living it.</h2><span>Boasted Education is a running record of what you are learning, doing, improving, and achieving across college, technical training, certifications, continuing education, and the transition into work.</span></div>
      <div className="education-stage-grid">{stages.map((stage, index) => <article key={stage.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.text}</p></article>)}</div>
    </section>

    <section className="education-section education-alt">
      <div className="education-heading"><p>WHAT COUNTS AS A WIN?</p><h2>More than trophies and perfect grades.</h2><span>If it helped you learn, contribute, lead, create, improve, solve, perform, serve, or grow, it may be worth remembering.</span></div>
      <div className="education-win-grid">{studentWins.map((win) => <div key={win}><Check size={17}/><span>{win}</span></div>)}</div>
    </section>

    <section className="education-section education-how">
      <div className="education-heading"><p>HOW IT WORKS</p><h2>Save it now. Understand your growth. Use it later.</h2></div>
      <div className="education-how-grid">
        <article><BookOpenCheck size={22}/><h3>Capture a win</h3><p>Write down what happened, what you personally did, what changed, and what you learned while the details are fresh.</p></article>
        <article><TrendingUp size={22}/><h3>See your growth</h3><p>Notice skills, leadership, service, curiosity, responsibility, and results that recur across your actual record.</p></article>
        <article><Target size={22}/><h3>Choose your next move</h3><p>Use the same evidence to prepare for a scholarship, program, internship, essay, résumé, interview, portfolio, or career direction.</p></article>
      </div>
    </section>

    <section className="education-trust">
      <div><p>BUILT TO SUPPORT YOUR STORY, NOT SCORE IT</p><h2>Useful intelligence without pretending to know your future.</h2><p>Boasted does not calculate admissions odds, scholarship odds, hiring odds, student rankings, or a made-up “potential” score. Public datasets add transparent context; your personal claims still come from evidence you saved.</p></div>
      <div className="education-trust-list"><span><LockKeyhole size={17}/> Private by default</span><span><Check size={17}/> Real accomplishments only</span><span><Check size={17}/> Source and rights provenance documented</span><span><Check size={17}/> You stay the author of your applications and essays</span></div>
    </section>

    <section className="education-legal-card">
      <div><ShieldCheck size={24}/><span><small>TRANSPARENCY</small><h2>See what data Boasted uses—and what we deliberately refuse to copy.</h2><p>Our public Education Data & Source Audit records approved sources, rights basis, attribution rules, blocked sources, and important source changes. Git history preserves the audit trail over time.</p></span></div>
      <a className="education-secondary" href="/legal/education-data">Open Education Data & Source Audit <ArrowRight size={17}/></a>
    </section>

    <section className="education-cta">
      <GraduationCap size={30}/><h2>Your future self should not have to remember everything.</h2><p>Start with one thing you learned, built, completed, or contributed that you are proud of.</p><div><a className="education-primary" href="/register">Start free <ArrowRight size={18}/></a><a className="education-secondary" href="/docs/education">Read the Education guide</a></div><small>Account eligibility is governed by the Boasted Terms and applicable law.</small>
    </section>
  </main>;
}
