import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  FileSearch,
  GraduationCap,
  Landmark,
  Lightbulb,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import "./EducationGuidePage.css";

const captureIdeas = [
  "Coursework, labs, academic projects, capstones, research, and presentations",
  "Awards, honors, scholarships, recognition, certificates, or completed learning programs",
  "Campus organizations, leadership, mentoring, organizing, teamwork, and responsibilities you took on",
  "Community service, volunteering, fundraising, and ways you helped other people",
  "Certifications, licenses, bootcamps, technical training, and professional development",
  "Internships, first jobs, side projects, portfolios, open-source work, and practical experience",
  "Challenges you worked through, lessons you learned, and moments that changed how you think",
];

const workflow = [
  { title: "1. Save the real win", text: "Capture what happened, what you personally did, what changed, what you learned, and any evidence you are allowed to keep." },
  { title: "2. Strengthen the proof", text: "Use Impact Receipts to connect contribution, result, evidence, skills, credit, and optional confirmation without exaggerating the claim." },
  { title: "3. Let Education Intelligence organize it", text: "Boasted can surface recurring skills, themes, directions, and documentation gaps from the records you actually saved." },
  { title: "4. Search opportunities", text: "Use those evidence-connected directions as editable starting points for scholarships, College Scorecard programs, and USAJOBS federal internships." },
  { title: "5. Reuse the evidence", text: "Move into résumé, interview, portfolio, essay-story, scholarship, or career workflows without rebuilding the same story from memory." },
  { title: "6. Keep the final story accurate", text: "Compare suggestions with the real opportunity requirements and keep every application, résumé, essay, interview answer, and public claim accurate." },
];

const featureGroups = [
  {
    title: "Build your education record",
    items: ["My Education", "Coursework", "Academic Projects", "Certifications & Training", "Academic Achievements", "Group Project Contributions", "Graduation Progress", "Experience Translator"],
  },
  {
    title: "Turn education into career proof",
    items: ["Major Explorer", "Education Impact Receipts", "Skills from Education", "Career Match & Skill Gaps", "Résumé Builder", "Interview Prep", "Academic Portfolio", "Career Path Explorer"],
  },
];

const opportunityTools = [
  {
    icon: Search,
    title: "Scholarship Finder",
    source: "Licensed scholarship catalog",
    text: "Natural-language search, query-understanding chips, filters, deadline/award sorting, 20/40-result pagination, visible provenance, and direct provider submissions.",
    guardrail: "Boasted only stores scholarship records when a documented rights basis permits storage/display. Provider submissions remain pending review until approved.",
  },
  {
    icon: MapPin,
    title: "Program Finder",
    source: "College Scorecard · U.S. Department of Education",
    text: "Use an editable career/subject direction plus a city/state to explore programs returned through official College Scorecard data.",
    guardrail: "Aggregate cost and outcome fields are context only—not your personal cost, salary, admission probability, or graduation probability.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Federal Internship Finder",
    source: "USAJOBS · U.S. Office of Personnel Management",
    text: "Search live federal listings using an editable career direction and location. Boasted keeps only records with an explicit intern or student-trainee signal.",
    guardrail: "The listing stays source data. Boasted does not predict hiring, qualification, selection, or likelihood of success.",
  },
  {
    icon: FileSearch,
    title: "Essay Story Prep",
    source: "Your saved Boasted evidence",
    text: "Rediscover real moments involving growth, curiosity, challenge, values, service, leadership, or contribution when an application asks for a story.",
    guardrail: "Boasted helps you find your material; it does not invent a life experience or fabricate an admissions narrative.",
  },
];

const sources = [
  ["Open Scholarships", "CC BY 4.0 licensed scholarship seed. The importer validates the license identity, license URL, and required attribution before writing records."],
  ["College Scorecard", "U.S. Department of Education institution and field-of-study data. Used for live program discovery and transparent aggregate context."],
  ["USAJOBS", "U.S. Office of Personnel Management public job opportunity data. Used for live federal internship discovery with server-side API credentials and source links."],
  ["O*NET 31.0 Database", "Official U.S. Department of Labor occupation and skill reference data. The downloadable database is available under CC BY 4.0 with attribution requirements."],
  ["NCES CIP-SOC Crosswalk", "Official education-to-occupation crosswalk for broad exploration. It is not a guarantee that a person with a particular field of study will enter a specific job."],
  ["BLS OEWS", "Official occupational employment and wage estimates used only as aggregate labor-market context, never a personal salary prediction."],
];

export default function EducationGuidePage() {
  useEffect(() => {
    document.title = "Boasted Education Guide | Features, sources & safeguards";
  }, []);

  return <main className="education-guide">
    <header className="education-guide-topbar">
      <a href="/docs"><ArrowLeft size={16}/> All guides</a>
      <a className="education-guide-brand" href="/">Boasted</a>
      <nav aria-label="Education guide links"><a href="/education">Education</a><a href="/legal/education-data">Sources & audit</a></nav>
    </header>

    <section className="education-guide-hero">
      <p><Sparkles size={16}/> BOASTED EDUCATION GUIDE</p>
      <h1>Save the proof. Understand the pattern. <span>Use it when the opportunity arrives.</span></h1>
      <p className="education-guide-intro">Boasted Education combines a private evidence record with transparent opportunity discovery. Your personal claims come from what you saved; public sources add searchable context without becoming a score about your future.</p>
      <div className="education-guide-hero-actions"><a href="/register">Start free <ArrowRight size={16}/></a><a href="#opportunities">See the opportunity tools</a></div>
      <div className="education-guide-stat-row"><div><strong>4</strong><span>application tools</span></div><div><strong>3</strong><span>live/licensed discovery paths</span></div><div><strong>0</strong><span>fake fit scores</span></div><div><strong>1</strong><span>public source audit</span></div></div>
    </section>

    <section className="education-guide-callout education-guide-callout-primary">
      <GraduationCap size={26}/>
      <div><strong>Education is a working proof toolkit—not just a school profile.</strong><p>Coursework, research, projects, training, service, leadership, and practical work can become reusable evidence for scholarships, programs, internships, résumés, interviews, portfolios, and career exploration.</p></div>
    </section>

    <section className="education-guide-section" id="features">
      <div className="education-guide-heading"><BookOpenCheck size={22}/><div><span>FEATURE MAP</span><h2>Start with the thing you are trying to do.</h2></div></div>
      <p>Most Education tools share the deterministic Education Toolkit v2 evidence engine. Major Explorer keeps its own specialized panel while following the same no-invention and no-prediction rules.</p>
      <div className="education-guide-grid">
        {featureGroups.map((group) => <article key={group.title}><strong>{group.title}</strong><p>{group.items.join(" · ")}</p></article>)}
      </div>
    </section>

    <section className="education-guide-section" id="opportunities">
      <div className="education-guide-heading"><Target size={22}/><div><span>APPLICATION TOOLS</span><h2>Opportunity discovery now has real source data behind it.</h2></div></div>
      <p>Boasted can turn evidence-backed career or subject directions into editable search ideas. The search source stays visibly separate from the member evidence that suggested the direction.</p>
      <div className="education-guide-opportunity-grid">
        {opportunityTools.map(({ icon: Icon, title, source, text, guardrail }) => <article key={title}><div className="education-guide-source-icon"><Icon size={21}/></div><small>{source}</small><h3>{title}</h3><p>{text}</p><div><ShieldCheck size={15}/><span>{guardrail}</span></div></article>)}
      </div>
    </section>

    <section className="education-guide-section education-guide-dark-band">
      <div className="education-guide-heading"><Database size={22}/><div><span>HOW SEARCH INTELLIGENCE WORKS</span><h2>Evidence suggests the query. It does not decide your future.</h2></div></div>
      <div className="education-guide-flow">
        <div><b>1</b><strong>Your saved evidence</strong><span>Accomplishments + Impact Receipts</span></div><i>→</i><div><b>2</b><strong>Demonstrated signals</strong><span>Skills + recurring themes</span></div><i>→</i><div><b>3</b><strong>Editable search idea</strong><span>You can change it</span></div><i>→</i><div><b>4</b><strong>Official/licensed source</strong><span>Scholarships · Scorecard · USAJOBS</span></div>
      </div>
      <p>Private accomplishment text and Impact Receipts are not copied into public source databases. Where a live API needs a query/location, Boasted sends only the final search inputs required for that request.</p>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><BookOpenCheck size={22}/><div><span>WHAT TO SAVE</span><h2>A win does not have to be a trophy.</h2></div></div>
      <p>If future-you might wish you remembered the details, it may be worth capturing.</p>
      <div className="education-guide-list">{captureIdeas.map((item) => <div key={item}><CheckCircle2 size={18}/><span>{item}</span></div>)}</div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><Target size={22}/><div><span>STEP BY STEP</span><h2>How to use Education</h2></div></div>
      <div className="education-guide-steps">{workflow.map((step) => <article key={step.title}><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
    </section>

    <section className="education-guide-section" id="sources">
      <div className="education-guide-heading"><Landmark size={22}/><div><span>PUBLIC & LICENSED DATA</span><h2>Sources are documented instead of hidden.</h2></div></div>
      <p>Boasted keeps a source registry and an append-only audit history for Education data decisions. “Publicly viewable” is never treated as automatic permission to copy a database.</p>
      <div className="education-guide-source-grid">{sources.map(([name, text]) => <article key={name}><div><Database size={17}/><strong>{name}</strong></div><p>{text}</p></article>)}</div>
      <div className="education-guide-audit-link"><ShieldCheck size={20}/><div><strong>Education Data & Source Audit</strong><span>See approved sources, blocked sources, rights basis, attribution obligations, and change history.</span></div><a href="/legal/education-data">Open audit <ArrowRight size={16}/></a></div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><Lightbulb size={22}/><div><span>EVIDENCE GAPS</span><h2>“Not shown yet” is not the same thing as “you cannot do it.”</h2></div></div>
      <p>Education Intelligence can point out areas your saved record does not clearly demonstrate. That is a documentation prompt—not proof that you lack a skill and not a command to manufacture an activity.</p>
      <div className="education-guide-example"><small>Example</small><strong>Your record does not clearly show research yet.</strong><p>If you already completed a research, lab, science, independent-study, or investigation project, capture it. If you have not, nothing needs to be invented just to fill a box.</p></div>
    </section>

    <section className="education-guide-section education-guide-trust">
      <div className="education-guide-heading"><ShieldCheck size={22}/><div><span>TRUST & PRIVACY</span><h2>Your story stays under your control.</h2></div></div>
      <div className="education-guide-list">
        <div><LockKeyhole size={18}/><span>Education accomplishments are private unless you explicitly choose to make something public. Opportunity discovery never flips that setting for you.</span></div>
        <div><CheckCircle2 size={18}/><span>Education Intelligence uses your saved record; it does not invent schools, awards, grades, roles, metrics, credentials, projects, or life experiences.</span></div>
        <div><CheckCircle2 size={18}/><span>Boasted does not provide admissions odds, scholarship odds, career-fit percentages, hiring probabilities, personal salary predictions, or a student ranking score.</span></div>
        <div><CheckCircle2 size={18}/><span>External source records stay distinguishable from Boasted annotations and evidence-connected search suggestions.</span></div>
        <div><CheckCircle2 size={18}/><span>Avoid entering sensitive personal information, school credentials, protected records, confidential documents, or information you are not permitted to store.</span></div>
      </div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><GraduationCap size={22}/><div><span>ACCOUNT & LEGAL</span><h2>Transparent consent and transparent data sources.</h2></div></div>
      <p>Account eligibility is governed by the Boasted Terms and applicable law. Registration requires affirmative acceptance of the current Terms and acknowledgment of the current Privacy Policy.</p>
      <p>Education source decisions are documented separately in the <a href="/legal/education-data">Education Data & Source Audit</a>, including sources Boasted intentionally does not ingest because reuse rights are unclear.</p>
    </section>

    <section className="education-guide-cta">
      <h2>Start with one thing you are proud of.</h2>
      <p>You do not need your whole education history on day one.</p>
      <div><a href="/register">Create my Boasted</a><a href="/education">Back to Education</a></div>
      <small>Private by default · real evidence only · source rights documented.</small>
    </section>
  </main>;
}
