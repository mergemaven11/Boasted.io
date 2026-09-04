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
  "A class project you are proud of",
  "Honor roll, awards, competitions, or recognition",
  "Clubs, sports, arts, performances, and leadership",
  "Community service and volunteering",
  "Research, STEM projects, certifications, and courses",
  "A first job, internship, side project, or skill you worked hard to build",
];

const stages = [
  { title: "Middle school", status: "coming-soon", text: "Younger-student access is under construction and is not currently available." },
  { title: "High school", status: "available", text: "For students 18+: keep a real record of activities, leadership, awards, projects, service, jobs, competitions, and the stories behind them." },
  { title: "College / University", status: "available", text: "For students 18+: track research, internships, campus leadership, projects, certifications, work, service, and the skills you are building." },
  { title: "Career", status: "available", text: "Carry the same evidence forward into resumes, interviews, portfolios, reviews, promotions, and professional opportunities." },
];

const goals = [
  { icon: Award, title: "Scholarships", text: "Find the saved wins that best show leadership, service, academics, initiative, and persistence." },
  { icon: GraduationCap, title: "Programs", text: "Pull together real projects, interests, research, competitions, and growth for programs you want to pursue." },
  { icon: BriefcaseBusiness, title: "Internships", text: "Turn school, projects, service, clubs, and work into examples that show what you can actually do." },
  { icon: FilePenLine, title: "Essay stories", text: "Rediscover real moments about growth, curiosity, challenges, values, and contribution without inventing a story for you." },
];

export default function EducationMarketingPage() {
  useEffect(() => {
    document.title = "BragStack Education | Education proof for students 18+";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "BragStack Education helps students age 18+ capture real school, activity, project, service, work, and learning wins for scholarships, programs, internships, essays, and future careers.");
  }, []);

  return <main className="education-marketing">
    <header className="education-nav">
      <a className="education-brand" href="/">BragStack</a>
      <nav aria-label="Education navigation">
        <a href="#journey">Student journey</a>
        <a href="#goals">What it helps with</a>
        <a href="/docs/education">Education guide</a>
      </nav>
      <div className="education-nav-actions"><a href="/login">Log in</a><a className="education-primary" href="/register">Start my BragStack</a></div>
    </header>

    <section className="education-public-age-alert" role="status">
      <div className="education-public-tape">18+ ONLY · YOUNGER STUDENT EXPERIENCE UNDER CONSTRUCTION · COMING SOON</div>
      <div><LockKeyhole size={19}/><p><strong>BragStack Education currently supports users age 18 and older.</strong><span>Adult high-school and college/university students can use Education now. Middle-school and other under-18 student access is not currently available.</span></p></div>
    </section>

    <section className="education-hero">
      <div>
        <p className="education-eyebrow"><Sparkles size={16}/> BRAGSTACK EDUCATION · 18+</p>
        <h1>Your grades are only part of your story.<span> Keep the wins, too.</span></h1>
        <p className="education-lede">Projects. Awards. Clubs. Sports. Service. Research. First jobs. Skills. Leadership. The things you learn when something is hard. For students 18+, BragStack gives those moments a place to live so your future self does not have to reconstruct years of growth from memory.</p>
        <div className="education-actions"><a className="education-primary" href="/register">Start building my 18+ student record <ArrowRight size={18}/></a><a className="education-secondary" href="/docs/education">See how Education works</a></div>
        <p className="education-note"><LockKeyhole size={15}/> Private by default. Built from your real accomplishments. No admissions score and no invented achievements.</p>
      </div>
      <aside className="education-story-card">
        <span>YOUR JOURNEY</span>
        <h2>One record that can grow with you.</h2>
        <div className="education-story-line education-story-locked"><div className="education-mini-tape">COMING SOON</div><b>Middle school</b><small>Younger-student experience under construction</small><i/></div>
        <div className="education-story-line"><b>High school</b><small>Available for students 18+</small><i/></div>
        <div className="education-story-line"><b>College / University</b><small>Available for students 18+</small><i/></div>
        <div className="education-story-line"><b>Career</b><small>Keep carrying your proof forward</small></div>
      </aside>
    </section>

    <section className="education-section" id="journey">
      <div className="education-heading"><p>THE STUDENT JOURNEY</p><h2>Capture the story while you are living it.</h2><span>BragStack Education is currently for users 18+. Adult students can build a running record of what they are learning, doing, improving, and achieving.</span></div>
      <div className="education-stage-grid">{stages.map((stage, index) => <article key={stage.title} className={stage.status === "coming-soon" ? "education-stage-coming-soon" : ""}>{stage.status === "coming-soon" && <div className="education-card-tape">UNDER CONSTRUCTION · COMING SOON</div>}<span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.text}</p></article>)}</div>
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
      <div><p>BUILT TO SUPPORT STUDENTS, NOT SCORE THEM</p><h2>You are more than a number.</h2><p>BragStack does not calculate admissions odds, scholarship odds, student rankings, or a made-up “potential” score. It organizes the story you actually created and leaves the decisions to the real people and programs involved.</p></div>
      <div className="education-trust-list"><span><LockKeyhole size={17}/> Private by default</span><span><Check size={17}/> Real accomplishments only</span><span><Check size={17}/> Current Education access is 18+</span><span><Check size={17}/> You stay the author of your essays and story</span></div>
    </section>

    <section className="education-cta">
      <GraduationCap size={30}/><h2>Your future self should not have to remember everything.</h2><p>If you are 18 or older, start with one thing you did that you are proud of.</p><div><a className="education-primary" href="/register">Start my BragStack <ArrowRight size={18}/></a><a className="education-secondary" href="/docs/education">Read the student guide</a></div><small>BragStack Education currently supports users age 18+. Younger-student access is under construction and not available today.</small>
    </section>
  </main>;
}
