import { useEffect } from "react";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  FilePenLine,
  GraduationCap,
  LockKeyhole,
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

const goals = [
  { icon: Award, title: "Scholarships", text: "Find the saved wins that best show leadership, service, academics, initiative, and persistence." },
  { icon: GraduationCap, title: "Programs", text: "Pull together real projects, interests, research, competitions, and growth for programs you want to pursue." },
  { icon: BriefcaseBusiness, title: "Internships", text: "Turn coursework, projects, service, organizations, and work into examples that show what you can actually do." },
  { icon: FilePenLine, title: "Essay stories", text: "Rediscover real moments about growth, curiosity, challenges, values, and contribution without inventing a story for you." },
];

export default function EducationMarketingPage() {
  useEffect(() => {
    document.title = "Boasted Education | Turn learning into career proof";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "Boasted Education helps college, university, trade, technical, certification, bootcamp, and continuing-education learners turn real coursework, projects, training, and achievements into reusable career proof.");
  }, []);

  return <main className="education-marketing">
    <header className="education-nav">
      <a className="education-brand" href="/">Boasted</a>
      <nav aria-label="Education navigation">
        <a href="#journey">Education journey</a>
        <a href="#goals">What it helps with</a>
        <a href="/docs/education">Education guide</a>
      </nav>
      <div className="education-nav-actions"><a href="/login">Log in</a><a className="education-primary" href="/register">Start my Boasted</a></div>
    </header>

    <section className="education-hero">
      <div>
        <p className="education-eyebrow"><Sparkles size={16}/> BOASTED EDUCATION</p>
        <h1>Your grades are only part of your story.<span> Keep the proof, too.</span></h1>
        <p className="education-lede">Coursework. Projects. Research. Certifications. Service. Internships. Training. Leadership. The things you learn when something is hard. Give those moments a place to live so future-you does not have to reconstruct years of growth from memory.</p>
        <div className="education-actions"><a className="education-primary" href="/register">Start building my story <ArrowRight size={18}/></a><a className="education-secondary" href="/docs/education">See how Education works</a></div>
        <p className="education-note"><LockKeyhole size={15}/> Private by default. Built from your real accomplishments. No admissions score and no invented achievements.</p>
      </div>
      <aside className="education-story-card">
        <span>A RECORD THAT GROWS WITH YOU</span>
        <h2>Learning should turn into reusable evidence.</h2>
        <div className="education-story-line"><b>College / University</b><small>Coursework, research, projects, awards, service</small><i/></div>
        <div className="education-story-line"><b>Trade / Technical</b><small>Hands-on training, apprenticeships, skills, licenses</small><i/></div>
        <div className="education-story-line"><b>Continuing Education</b><small>Certifications, bootcamps, professional learning</small><i/></div>
        <div className="education-story-line"><b>Career</b><small>Keep carrying your proof forward</small></div>
      </aside>
    </section>

    <section className="education-section" id="journey">
      <div className="education-heading"><p>THE EDUCATION JOURNEY</p><h2>Capture the story while you are living it.</h2><span>Boasted Education is a running record of what you are learning, doing, improving, and achieving across college, technical training, certifications, continuing education, and the transition into work.</span></div>
      <div className="education-stage-grid">{stages.map((stage, index) => <article key={stage.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.text}</p></article>)}</div>
    </section>

    <section className="education-section education-alt">
      <div className="education-heading"><p>WHAT COUNTS AS A WIN?</p><h2>More than trophies and perfect grades.</h2><span>If it helped you learn, contribute, lead, create, improve, solve, perform, serve, or grow, it may be worth remembering.</span></div>
      <div className="education-win-grid">{studentWins.map((win) => <div key={win}><Check size={17}/><span>{win}</span></div>)}</div>
    </section>

    <section className="education-section" id="goals">
      <div className="education-heading"><p>WHEN AN OPPORTUNITY SHOWS UP</p><h2>Your best examples are already waiting.</h2><span>Education Intelligence reviews only the accomplishments you saved and helps you find useful starting points for the goal in front of you.</span></div>
      <div className="education-goal-grid">{goals.map(({ icon: Icon, title, text }) => <article key={title}><Icon size={23}/><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>

    <section className="education-section education-how">
      <div className="education-heading"><p>HOW IT WORKS</p><h2>Save it now. Understand your growth. Use it later.</h2></div>
      <div className="education-how-grid">
        <article><BookOpenCheck size={22}/><h3>Capture a win</h3><p>Write down what happened, what you did, what changed, and what you learned while the details are fresh.</p></article>
        <article><TrendingUp size={22}/><h3>See your growth</h3><p>Notice the skills, leadership, service, curiosity, responsibility, and results showing up across your record.</p></article>
        <article><Target size={22}/><h3>Choose your next move</h3><p>Use your real record to prepare for a scholarship, program, internship, essay, resume, interview, or the next goal you care about.</p></article>
      </div>
    </section>

    <section className="education-trust">
      <div><p>BUILT TO SUPPORT YOUR STORY, NOT SCORE IT</p><h2>You are more than a number.</h2><p>Boasted does not calculate admissions odds, scholarship odds, rankings, or a made-up “potential” score. It organizes the story you actually created and leaves decisions to the real people and programs involved.</p></div>
      <div className="education-trust-list"><span><LockKeyhole size={17}/> Private by default</span><span><Check size={17}/> Real accomplishments only</span><span><Check size={17}/> Evidence can follow you into your career</span><span><Check size={17}/> You stay the author of your essays and story</span></div>
    </section>

    <section className="education-cta">
      <GraduationCap size={30}/><h2>Your future self should not have to remember everything.</h2><p>Start with one thing you learned, built, completed, or contributed that you are proud of.</p><div><a className="education-primary" href="/register">Start my Boasted <ArrowRight size={18}/></a><a className="education-secondary" href="/docs/education">Read the Education guide</a></div><small>Account eligibility is governed by the Boasted Terms and applicable law.</small>
    </section>
  </main>;
}
