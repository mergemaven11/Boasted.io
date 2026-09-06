import { Award, BadgeCheck, FileCheck2, Sparkles, Target } from "lucide-react";
import "./GenericPacketPages.css";

function themeClass(packet) {
  return `packet-theme-${packet?.render_config?.theme || "modern-minimal"}`;
}

function PacketFooter({ page }) {
  return <footer className="packet-page-footer"><span>BragStack · Career Evidence System</span><span>Page {page}</span></footer>;
}

function PacketHeader({ index, eyebrow, title }) {
  return <header className="packet-page-header"><div><p>{String(index).padStart(2, "0")} · {eyebrow}</p><h2>{title}</h2></div><div className="packet-page-header-mark">BRAGSTACK</div></header>;
}

function EmptyState({ children }) {
  return <div className="generic-packet-empty"><FileCheck2 size={21} /><p>{children}</p></div>;
}

function GenericPacketPages({ packet }) {
  const items = packet?.signature_accomplishments ?? [];
  const skills = packet?.skill_details ?? [];
  const receipts = packet?.receipt_records ?? [];
  const focus = packet?.focus_fields ?? [];
  const qualityMessage = packet?.quality_message;
  const usageExample = packet?.usage_example;
  const presentation = packet?.presentation ?? {};

  return <>
    <section className={`packet-sheet packet-document-page generic-packet-page ${themeClass(packet)}`}>
      <PacketHeader index={2} eyebrow="Packet Purpose" title="What this document is for" />
      <div className="generic-purpose-grid">
        <article className="generic-purpose-card"><Sparkles size={20} /><span>USE THIS PACKET</span><p>{usageExample || "Use this packet to organize documented career proof for a specific professional or education moment."}</p></article>
        <article className="generic-purpose-card"><Target size={20} /><span>FOCUS</span>{focus.length ? <dl>{focus.map((item) => <div key={`${item.label}-${item.value}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl> : <p>Add target details in the form to make this packet more specific.</p>}</article>
      </div>
      <section className="generic-summary-block"><span>EVIDENCE-BACKED SUMMARY</span><p>{packet?.review_summary || "This packet organizes the career proof currently saved in BragStack."}</p></section>
      {qualityMessage && <aside className="generic-strength-note"><strong>More proof makes this better.</strong><p>{qualityMessage}</p></aside>}
      <PacketFooter page={3} />
    </section>

    <section className={`packet-sheet packet-document-page generic-packet-page ${themeClass(packet)}`}>
      <PacketHeader index={3} eyebrow={presentation.highlight_label || "Featured Proof"} title="Accomplishments selected for this packet" />
      {items.length ? <div className="generic-accomplishment-list">{items.slice(0, 8).map((item, index) => <article key={item.entry_id || `${item.title}-${index}`}><div className="generic-accomplishment-number">{String(index + 1).padStart(2, "0")}</div><div><div className="generic-record-meta"><span>{item.category || "Accomplishment"}</span>{item.verified && <span><BadgeCheck size={12} /> Recognized</span>}</div><h3>{item.title}</h3>{item.result && <p>{item.result}</p>}{item.skills?.length > 0 && <div className="generic-skill-tags">{item.skills.slice(0, 6).map((skill) => <span key={skill}>{skill}</span>)}</div>}</div><div className="generic-proof-count"><strong>{item.evidence_count ?? 0}</strong><span>evidence</span></div></article>)}</div> : <EmptyState>Add accomplishments and Impact Receipts to populate the packet with documented examples.</EmptyState>}
      <PacketFooter page={4} />
    </section>

    <section className={`packet-sheet packet-document-page generic-packet-page ${themeClass(packet)}`}>
      <PacketHeader index={4} eyebrow="Skills, Results & Proof" title="The evidence behind the story" />
      <div className="generic-evidence-columns">
        <section><div className="generic-section-heading"><Sparkles size={18} /><div><span>DEMONSTRATED SKILLS</span><h3>Capabilities in your record</h3></div></div>{skills.length ? <div className="generic-skill-list">{skills.slice(0, 12).map((item) => <div key={item.skill}><span>{item.skill}</span><strong>{item.count}</strong></div>)}</div> : <EmptyState>Add skills to your accomplishments or Impact Receipts.</EmptyState>}</section>
        <section><div className="generic-section-heading"><Award size={18} /><div><span>IMPACT RECEIPTS</span><h3>Structured proof</h3></div></div>{receipts.length ? <div className="generic-receipt-list">{receipts.slice(0, 8).map((receipt) => <article key={receipt.id || receipt.reference}><strong>{receipt.accomplishment}</strong>{receipt.result && <p>{receipt.result}</p>}<small>{receipt.reference}{receipt.verified ? " · Verified Recognition attached" : ""}</small></article>)}</div> : <EmptyState>Create Impact Receipts to add contribution, result, skills, evidence, and recognition.</EmptyState>}</section>
      </div>
      <div className="generic-export-note"><FileCheck2 size={18} /><p>This packet is generated from user-saved BragStack data. Review it before submitting it to an employer, school, licensing body, scholarship committee, client, or other third party.</p></div>
      <PacketFooter page={5} />
    </section>
  </>;
}

export default GenericPacketPages;
