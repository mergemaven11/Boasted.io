import { useEffect } from "react";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CheckCircle2,
  Database,
  GraduationCap,
  Lightbulb,
  LockKeyhole,
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
  { title: "1. Choose an Education tool", text: "Open Education and choose the tool that fits what you want to do. The card now opens a working evidence view instead of simply dropping you on a generic page." },
  { title: "2. Review what Boasted already knows", text: "The tool reviews your saved education records, supporting Impact Receipts, demonstrated skill signals, and missing documentation details without inventing experience." },
  { title: "3. Capture or strengthen the real win", text: "Describe the situation, what you personally did, what changed afterward, and what you learned. Add numbers only when you genuinely know them." },
  { title: "4. Reuse the evidence", text: "When the record is ready, move into the canonical Impact Receipt, résumé, interview, profile, or Career Intelligence workflow without retyping your story from scratch." },
  { title: "5. Prepare for opportunities", text: "Choose Scholarships, Programs, Internships, or Essay Stories when you want Application Intelligence to surface useful examples from your own saved record." },
  { title: "6. Keep the final story accurate", text: "Compare Boasted suggestions with real requirements and keep every application, résumé, essay, interview answer, portfolio claim, and career decision accurate and in your own voice." },
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

const sources = [
  ["O*NET 31.0 Database", "Official U.S. Department of Labor occupation and skill reference data. The downloadable database is available under CC BY 4.0 with attribution requirements."],
  ["NCES CIP-SOC Crosswalk", "Official education-to-occupation crosswalk for exploring how postsecondary programs can relate to occupations; it is not a guarantee of a job outcome."],
  ["BLS OEWS", "Official occupational employment and wage estimates for labor-market context. Boasted does not turn aggregate wages into a personal salary prediction."],
  ["College Scorecard", "Optional U.S. Department of Education institution and field-of-study context. Aggregate outcomes have cohort and representation limitations."],
  ["CareerOneStop", "Optional U.S. Department of Labor API source for future live skills-gap, training, occupation, salary, and tools/technology enrichment."],
];

export default function EducationGuidePage() {
  useEffect(() => {
    document.title = "Boasted Education Guide";
  }, []);

  return <main className="education-guide">
    <header className="education-guide-topbar">
      <a href="/docs"><ArrowLeft size={16}/> All guides</a>
      <a className="education-guide-brand" href="/">Boasted</a>
      <a href="/education">Education overview</a>
    </header>

    <section className="education-guide-hero">
      <p><Sparkles size={16}/> BOASTED EDUCATION GUIDE</p>
      <h1>Build your education story one real win at a time.</h1>
      <span>Use Boasted to remember what you learned, built, researched, completed, contributed, and achieved, then bring those real examples forward when an opportunity matters.</span>
    </section>

    <section className="education-guide-callout">
      <GraduationCap size={26}/>
      <div><strong>Education is a working proof toolkit, not just a school field or link directory.</strong><p>Each Education card opens a focused view of your own saved records first, then gives you the right next action when you need to capture, prove, reuse, practice, or share that evidence.</p></div>
    </section>

    <section className="education-guide-callout">
      <ShieldCheck size={26}/>
      <div><strong>Your learning can become career evidence without being exaggerated.</strong><p>Coursework, research, projects, service, training, and group work can demonstrate real skills and contribution. Boasted is designed to reuse what you actually saved rather than invent experience you do not have.</p></div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><BookOpenCheck size={22}/><div><span>FEATURES</span><h2>Education is a hub of focused tools.</h2></div></div>
      <p>Use the feature buttons to start with what you are trying to capture or do next. With the exception of Major Explorer, which keeps its own specialized recommendation panel, the cards share the verified Education Toolkit v2 engine.</p>
      <div className="education-guide-grid">
        {featureGroups.map((group) => <article key={group.title}><strong>{group.title}</strong><p>{group.items.join(" · ")}</p></article>)}
      </div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><Target size={22}/><div><span>WHAT THE TOOLKIT DOES</span><h2>Every card answers a concrete evidence question.</h2></div></div>
      <div className="education-guide-grid">
        <article><strong>Capture tools</strong><p>Show matching records, missing contribution/result/reflection details, and smart prompts before opening the accomplishment editor.</p></article>
        <article><strong>Proof tools</strong><p>Show which records already have Impact Receipt support and where safe evidence or legitimate confirmation could strengthen a claim.</p></article>
        <article><strong>Skills & career tools</strong><p>Show skill signals only when saved evidence supports them, then connect those signals to broad directions for exploration without a fake fit score.</p></article>
        <article><strong>Reuse tools</strong><p>Prioritize strong education examples for résumé, interview, and portfolio workflows while preserving traceability and visibility control.</p></article>
      </div>
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

    <section className="education-guide-section">
      <div className="education-guide-heading"><Award size={22}/><div><span>APPLICATION TOOLS</span><h2>Use your saved evidence when an opportunity appears.</h2></div></div>
      <div className="education-guide-grid">
        <article><strong>Scholarships</strong><p>Surfaces saved examples that show areas such as leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.</p></article>
        <article><strong>Programs</strong><p>Looks for real subject interest, projects, research, competitions, collaboration, curiosity, initiative, and growth.</p></article>
        <article><strong>Internships</strong><p>Helps identify examples showing skills, responsibility, teamwork, initiative, and results that may be useful when preparing an internship application or résumé.</p></article>
        <article><strong>Essay Stories</strong><p>Helps you remember real moments involving growth, curiosity, challenge, values, or contribution. Boasted does not write a life story for you or invent experiences.</p></article>
      </div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><Database size={22}/><div><span>PUBLIC DATA</span><h2>Official sources add context, not a made-up personal score.</h2></div></div>
      <p>Career and education exploration is stronger when it can point to transparent public sources. Boasted keeps those references separate from your private evidence and documents the source/version rather than copying another product's rankings.</p>
      <div className="education-guide-grid">{sources.map(([name, text]) => <article key={name}><strong>{name}</strong><p>{text}</p></article>)}</div>
      <p>Public-source details, licensing notes, and limitations are maintained in the product's Education data-source documentation. Live external APIs are optional: your own Education tools still work from saved evidence if an external source is unavailable.</p>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><Lightbulb size={22}/><div><span>NEXT STEPS</span><h2>What “evidence gap” means</h2></div></div>
      <p>Education Intelligence can point out areas your saved record does not clearly show yet. That is a documentation prompt—not proof that you lack a skill and not a command to manufacture an activity or chase an admissions formula.</p>
      <div className="education-guide-example"><small>Example</small><strong>Your record does not clearly show research yet.</strong><p>If you already completed a research, lab, science, independent-study, or investigation project, capture it. If you have not, nothing needs to be invented just to fill a box.</p></div>
    </section>

    <section className="education-guide-section education-guide-trust">
      <div className="education-guide-heading"><ShieldCheck size={22}/><div><span>TRUST & PRIVACY</span><h2>Your story stays under your control.</h2></div></div>
      <div className="education-guide-list">
        <div><LockKeyhole size={18}/><span>Education accomplishments are private unless you explicitly choose to make something public. Portfolio analysis never flips that setting for you.</span></div>
        <div><CheckCircle2 size={18}/><span>Education Intelligence uses your saved record; it does not invent activities, schools, awards, grades, roles, metrics, credentials, or life experiences.</span></div>
        <div><CheckCircle2 size={18}/><span>Boasted does not provide admissions odds, scholarship odds, career-fit percentages, personal salary predictions, or a student ranking score.</span></div>
        <div><CheckCircle2 size={18}/><span>If you ask a teacher, professor, coach, mentor, collaborator, or other person to confirm something, choose only someone who genuinely knows the work.</span></div>
        <div><CheckCircle2 size={18}/><span>Avoid entering sensitive personal information, school credentials, protected records, confidential documents, or information you are not permitted to store.</span></div>
      </div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><GraduationCap size={22}/><div><span>ACCOUNT ELIGIBILITY</span><h2>Use Boasted only when you are legally permitted to do so.</h2></div></div>
      <p>Account eligibility is governed by the Boasted Terms and applicable law. Registration also requires affirmative acceptance of the current Terms and acknowledgment of the current Privacy Policy.</p>
      <p>Boasted records the policy versions and acceptance time on the account so the legal-consent history is not reduced to a disappearing front-end checkbox.</p>
    </section>

    <section className="education-guide-cta">
      <h2>Start with one thing you are proud of.</h2>
      <p>You do not need your whole education history on day one.</p>
      <div><a href="/register">Create my Boasted</a><a href="/education">Back to Education overview</a></div>
      <small>Private by default. Built from your real evidence.</small>
    </section>
  </main>;
}
