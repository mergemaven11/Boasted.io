import { ArrowLeft, ShieldCheck } from "lucide-react";
import ComplianceAuditPanel from "./ComplianceAuditPanel.jsx";
import "./OpsConsolePage.css";
import "./ComplianceAuditPanel.css";

export default function ComplianceAuditPage() {
  return <main className="ops-page">
    <header className="ops-header">
      <div>
        <a className="compliance-back" href="/ops"><ArrowLeft size={16} /> Ops Console</a>
        <p className="ops-kicker">INTERNAL · CONTROLLED ACCESS</p>
        <h1>Compliance & Business Readiness</h1>
        <p>Evidence-driven operational checks for BragStack's business, SaaS product, privacy, billing, governance, AI, marketing, and financing readiness.</p>
      </div>
      <div className="ops-env nonprod"><ShieldCheck size={15} /> AUDIT</div>
    </header>
    <ComplianceAuditPanel />
  </main>;
}
