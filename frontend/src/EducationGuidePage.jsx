import { useEffect } from "react";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import "./EducationGuidePage.css";

const captureIdeas = [
  "Academic achievements, strong projects, competitions, research, or a class you worked especially hard in",
  "Awards, honors, recognition, certificates, or completed learning programs",
  "Clubs, sports, arts, performances, student organizations, and extracurricular activities",
  "Leadership, mentoring, organizing, teamwork, and responsibilities you took on",
  "Community service, volunteering, fundraising, and ways you helped other people",
  "Internships, first jobs, side projects, portfolios, open-source work, and practical experience",
  "Challenges you worked through, lessons you learned, and moments that changed how you think",
];

const workflow = [
  { title: "1. Capture the win", text: "Open Accomplishments and save the moment while you still remember the details. BragStack accounts are currently 18+, and Middle School student accounts are not open yet." },
  { title: "2. Tell what happened", text: "Describe the situation, what you personally did, what changed afterward, and what you learned. Numbers and specific details help when you genuinely know them." },
  { title: "3. Keep useful proof", text: "Add safe evidence, tags, or confirmation when available. Do not upload secrets, protected student records, passwords, restricted school systems, or anything you are not allowed to keep." },
  { title: "4. Open Education", text: "Your Education workspace reviews the accomplishments you actually saved and helps organize them around a goal." },
  { title: "5. Pick a goal", text: "Choose Scholarships, Programs, Internships, or Essay Stories to see which of your real wins may be worth reviewing first." },
  { title: "6. Use the shortlist", text: "Copy the wins you want to work with, compare them with the real requirements, and keep the final application, essay, or submission accurate and in your own voice." },
];

export default function EducationGuidePage() {
  useEffect(() => {
    document.title = "BragStack Education Guide";
  }, []);

  return <main className="education-guide">
    <header className="education-guide-topbar">
      <a href="/docs"><ArrowLeft size={16}/> All guides</a>
      <a className="education-guide-brand" href="/">BragStack</a>
      <a href="/education">Education overview</a>
    </header>

    <section className="education-guide-hero">
      <p><Sparkles size={16}/> BRAGSTACK EDUCATION GUIDE · CURRENTLY 18+</p>
      <h1>Build your education story one real win at a time.</h1>
      <span>Adults can use BragStack to remember what they did, what they learned, how they grew, and the evidence behind it—then bring those real examples forward when an opportunity matters.</span>
    </section>

    <section className="education-guide-callout">
      <GraduationCap size={26}/>
      <div><strong><s>Middle School student accounts</s> — Coming soon.</strong><p>BragStack accounts are currently limited to people age 18 or older. The younger-student experience remains on the roadmap while we complete youth privacy, parental-consent, safety, retention, and legal review. Do not create an account or upload school information if you are under 18.</p></div>
    </section>

    <section className="education-guide-callout">
      <GraduationCap size={26}/>
      <div><strong>Education is a long-term proof workspace, not an admissions score.</strong><p>Adults can organize real accomplishments from college/university, certifications, work, activities, projects, service, and earlier education history where supported. The longer-term vision extends the same proof model from school into a career record.</p></div>
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
      <div className="education-guide-heading"><Award size={22}/><div><span>GOALS</span><h2>What the current Education workspace can help with</h2></div></div>
      <div className="education-guide-grid">
        <article><strong>Scholarships</strong><p>Surfaces saved examples that show areas such as leadership, service, academics, initiative, persistence, measurable contribution, and supporting proof.</p></article>
        <article><strong>Programs</strong><p>Looks for real subject interest, projects, research, competitions, collaboration, curiosity, initiative, and growth.</p></article>
        <article><strong>Internships</strong><p>Helps identify examples showing skills, responsibility, teamwork, initiative, and results that may be useful when preparing an internship application or resume.</p></article>
        <article><strong>Essay Stories</strong><p>Helps you remember real moments involving growth, curiosity, challenge, values, or contribution. BragStack does not write a life story for you or invent experiences.</p></article>
      </div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><Lightbulb size={22}/><div><span>NEXT STEPS</span><h2>What “next steps” means</h2></div></div>
      <p>Education Intelligence can point out areas your saved record does not clearly show yet. That is a documentation prompt—not a command to manufacture an activity or chase an admissions formula.</p>
      <div className="education-guide-example"><small>Example</small><strong>Your record does not clearly show research yet.</strong><p>If you already completed a research, lab, science, independent-study, or investigation project, capture it. If you have not, nothing needs to be invented just to fill a box.</p></div>
    </section>

    <section className="education-guide-section education-guide-trust">
      <div className="education-guide-heading"><ShieldCheck size={22}/><div><span>TRUST & PRIVACY</span><h2>Your story stays under your control.</h2></div></div>
      <div className="education-guide-list">
        <div><LockKeyhole size={18}/><span>Education accomplishments are private unless you explicitly choose to make something public.</span></div>
        <div><CheckCircle2 size={18}/><span>Education Intelligence uses your saved record; it does not invent activities, schools, awards, grades, roles, metrics, or life experiences.</span></div>
        <div><CheckCircle2 size={18}/><span>BragStack does not provide admissions odds, scholarship odds, or a student ranking score.</span></div>
        <div><CheckCircle2 size={18}/><span>If you ask a teacher, coach, mentor, or other person to confirm something, choose only someone who genuinely knows the work.</span></div>
        <div><CheckCircle2 size={18}/><span>Avoid entering sensitive personal information, school credentials, protected records, confidential documents, or information you are not permitted to store.</span></div>
      </div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><GraduationCap size={22}/><div><span>AGE REQUIREMENTS</span><h2>BragStack is 18+ for now.</h2></div></div>
      <p>New account registration requires confirmation that you are at least 18 years old plus acceptance of the current Terms and Privacy Policy. This is an interim boundary while BragStack completes the work needed for younger-student accounts.</p>
      <p>Middle School remains visible as a Coming Soon product direction. It is not currently an invitation for a minor to register, and BragStack does not currently offer a guardian-managed child account experience.</p>
    </section>

    <section className="education-guide-cta">
      <h2>Start with one thing you are proud of.</h2>
      <p>You do not need your whole education history on day one.</p>
      <div><a href="/register">Create my BragStack</a><a href="/education">Back to Education overview</a></div>
      <small>Current account access: adults age 18 and older.</small>
    </section>
  </main>;
}
