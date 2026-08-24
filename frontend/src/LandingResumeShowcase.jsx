import { CheckCircle2, FileText, ShieldCheck, Target } from "lucide-react";
import "./LandingResumeShowcase.css";

export default function LandingResumeShowcase() {
  return <section className="landing-resume-showcase">
    <div className="landing-resume-copy"><span>BRAGSTACK PRO · RESUME BUILDER</span><h2>Don’t write a resume from scratch. Build it from proof.</h2><p>Paste a job. BragStack matches its requirements against your Impact Receipts, builds source-linked bullets, flags evidence gaps, and gives you an ATS-friendly plain-text preview.</p><div className="landing-resume-points"><div><ShieldCheck size={18} />Source-linked generated claims</div><div><Target size={18} />Job requirement coverage</div><div><FileText size={18} />ATS-friendly single-column preview</div></div><a href="/register">Start building career proof</a></div>
    <div className="landing-resume-window"><div className="landing-resume-window-top"><span>Resume · Senior Data Analyst</span><em>ATS Readiness</em></div><div className="landing-resume-demo"><article><h3>TOBIAS SCOTT</h3><small>Senior Data Analyst</small><hr/><h4>PROFESSIONAL SUMMARY</h4><p>Evidence-backed candidate with documented impact across SQL, Python, dashboards, and stakeholder communication.</p><h4>EXPERIENCE & IMPACT</h4><p>• Reconciled conflicting data sources and improved reporting reliability.</p><p>• Automated recurring analysis workflows with Python and SQL.</p></article><aside><strong>82%</strong><span>requirement coverage</span><div><CheckCircle2 size={15}/> Format readiness · Strong</div><div><CheckCircle2 size={15}/> Evidence strength · Strong</div><b>Evidence gaps</b><small>SAS · Snowflake</small></aside></div></div>
  </section>;
}
