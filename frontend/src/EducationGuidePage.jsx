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
  "Coursework, labs, academic projects, capstones, research, and presentations",
  "Awards, honors, scholarships, recognition, certificates, or completed learning programs",
  "Campus organizations, leadership, mentoring, organizing, teamwork, and responsibilities you took on",
  "Community service, volunteering, fundraising, and ways you helped other people",
  "Certifications, licenses, bootcamps, technical training, and professional development",
  "Internships, first jobs, side projects, portfolios, open-source work, and practical experience",
  "Challenges you worked through, lessons you learned, and moments that changed how you think",
];

const workflow = [
  { title: "1. Choose an Education feature", text: "Open Education and choose the button that fits what you want to capture: coursework, an academic project, certification, achievement, group contribution, graduation milestone, or another education experience." },
  { title: "2. Capture the real win", text: "Describe the situation, what you personally did, what changed afterward, and what you learned. Numbers and specific details help when you genuinely know them." },
  { title: "3. Keep useful proof", text: "Add safe evidence, tags, or confirmation when available. Do not upload secrets, protected student records, passwords, restricted school systems, or anything you are not allowed to keep." },
  { title: "4. Reuse the evidence", text: "Education connects your saved record to Impact Receipts, skills, career matching, résumé building, interview preparation, your portfolio, and career planning." },
  { title: "5. Prepare for opportunities", text: "Choose Scholarships, Programs, Internships, or Essay Stories when you want Education Intelligence to surface useful examples from your own saved record." },
  { title: "6. Keep the final story accurate", text: "Compare Boasted suggestions with the real requirements and keep every application, résumé, essay, interview answer, or portfolio claim accurate and in your own voice." },
];

const featureGroups = [
  {
    title: "Build your education record",
    items: ["My Education", "Coursework", "Academic Projects", "Certifications & Training", "Academic Achievements", "Group Project Contributions", "Graduation Progress", "Experience Translator"],
  },
  {
    title: "Turn education into career proof",
    items: ["Education Impact Receipts", "Skills from Education", "Career Match & Skill Gaps", "Résumé Builder", "Interview Prep", "Academic Portfolio", "Career Path Explorer"],
  },
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
      <div><strong>Education is a proof workspace, not just a school field on a profile.</strong><p>College, university, trade, technical, certification, bootcamp, professional-training, and continuing-education experiences can become reusable evidence for applications and career tools.</p></div>
    </section>

    <section className="education-guide-callout">
      <GraduationCap size={26}/>
      <div><strong>Your learning can become career evidence without being exaggerated.</strong><p>Coursework, research, projects, service, training, and group work can demonstrate real skills and contribution. Boasted is designed to reuse what you actually saved rather than invent experience you do not have.</p></div>
    </section>

    <section className="education-guide-section">
      <div className="education-guide-heading"><BookOpenCheck size={22}/><div><span>FEATURES</span><h2>Education is now a hub of focused tools.</h2></div></div>
      <p>Use the feature buttons to start with what you are trying to capture or do next.</p>
      <div className="education-guide-grid">
        {featureGroups.map((group) => <article key={group.title}><strong>{group.title}</strong><p>{group.items.join(" · ")}</p></article>)}
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
      <div className="education-guide-heading"><Lightbulb size={22}/><div><span>NEXT STEPS</span><h2>What “next steps” means</h2></div></div>
      <p>Education Intelligence can point out areas your saved record does not clearly show yet. That is a documentation prompt—not a command to manufacture an activity or chase an admissions formula.</p>
      <div className="education-guide-example"><small>Example</small><strong>Your record does not clearly show research yet.</strong><p>If you already completed a research, lab, science, independent-study, or investigation project, capture it. If you have not, nothing needs to be invented just to fill a box.</p></div>
    </section>

    <section className="education-guide-section education-guide-trust">
      <div className="education-guide-heading"><ShieldCheck size={22}/><div><span>TRUST & PRIVACY</span><h2>Your story stays under your control.</h2></div></div>
      <div className="education-guide-list">
        <div><LockKeyhole size={18}/><span>Education accomplishments are private unless you explicitly choose to make something public.</span></div>
        <div><CheckCircle2 size={18}/><span>Education Intelligence uses your saved record; it does not invent activities, schools, awards, grades, roles, metrics, credentials, or life experiences.</span></div>
        <div><CheckCircle2 size={18}/><span>Boasted does not provide admissions odds, scholarship odds, or a student ranking score.</span></div>
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
