import { Activity, ArrowRight, BriefcaseBusiness, Gauge, ReceiptText, Tags, UsersRound } from "lucide-react";
import OpsInviteCard from "./OpsInviteCard.jsx";
import "./FounderAnalyticsPanel.css";

function percent(value) {
  return value == null ? "—" : `${value}%`;
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function currency(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value || 0));
}

function stepConversion(current, previous) {
  if (!previous) return "—";
  return `${Math.round((Number(current || 0) / Number(previous)) * 1000) / 10}%`;
}

function Metric({ label, value, detail }) {
  return <article className="founder-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function Funnel({ funnel = {} }) {
  const steps = [
    ["Signed up", funnel.signed_up],
    ["First accomplishment", funnel.first_accomplishment],
    ["First Impact Receipt", funnel.first_impact_receipt],
    ["Packet generated", funnel.packet_generated],
    ["Public profile", funnel.public_profile_published],
  ];

  return <div className="founder-funnel">
    {steps.map(([label, value], index) => <div className="founder-funnel-step" key={label}>
      <div><span>{label}</span><strong>{number(value)}</strong>{index > 0 && <small>{stepConversion(value, steps[index - 1][1])} from prior step</small>}</div>
      {index < steps.length - 1 && <ArrowRight size={17} aria-hidden="true" />}
    </div>)}
  </div>;
}

function EndpointList({ title, rows = [], mode }) {
  return <article className="founder-list-card">
    <h3>{title}</h3>
    {rows.length === 0 ? <p>No request data yet.</p> : <div className="founder-endpoint-list">{rows.map((row) => <div key={row.endpoint}>
      <code>{row.endpoint}</code>
      <span>{mode === "slow" ? `${row.p95_ms} ms p95` : `${number(row.requests)} requests`}</span>
    </div>)}</div>}
  </article>;
}

function RankedList({ title, rows = [], emptyText }) {
  return <article className="founder-list-card">
    <div className="founder-card-title"><Tags size={18} /><div><h3>{title}</h3><p>Aggregated from user-authored career evidence metadata.</p></div></div>
    {rows.length === 0 ? <p>{emptyText}</p> : <div className="founder-rank-list">{rows.map((item, index) => <div key={item.name}><strong>{index + 1}</strong><span>{item.name}</span><b>{number(item.count)}</b></div>)}</div>}
  </article>;
}

export default function FounderAnalyticsPanel({ analytics = {} }) {
  const users = analytics.users || {};
  const engagement = analytics.engagement || {};
  const profiles = analytics.profiles || {};
  const packets = analytics.packets || {};
  const content = analytics.content || {};
  const business = analytics.business || {};
  const api = analytics.api || {};

  return <section className="ops-panel founder-analytics-panel">
    <div className="founder-analytics-heading">
      <div><p className="ops-kicker">FOUNDER · PRODUCT SIGNALS</p><h2>How BragStack is being used</h2><p>Growth, activation, evidence depth, Proof Profile engagement, packet adoption, content signals, subscriptions, and API health from first-party metadata.</p></div>
      <a href="/ops/users"><UsersRound size={16} /> User-level analysis</a>
    </div>

    <OpsInviteCard compact />

    <div className="founder-kpi-grid">
      <Metric label="Total users" value={number(users.total)} detail={`+${number(users.new_today)} today · +${number(users.new_7d)} last 7d`} />
      <Metric label="Activation rate" value={percent(users.activation_rate)} detail="Signed up → first accomplishment" />
      <Metric label="Active creators · 30d" value={number(users.active_creators_30d)} detail={`${number(users.active_creators_7d)} in 7d · ${number(users.active_creators_1d)} in 24h`} />
      <Metric label="MRR" value={currency(business.mrr)} detail={`${number(business.pro_subscribers)} Pro @ ${currency(business.pro_monthly_price)}/mo`} />
      <Metric label="Public profile rate" value={percent(users.public_profile_rate)} detail="Accounts with a published Proof Profile" />
    </div>

    <div className="founder-section-heading"><div><UsersRound size={18} /><h3>Activation & retention</h3></div><span>Creator activity = accomplishment, receipt, or packet activity</span></div>
    <div className="founder-secondary-grid">
      <Metric label="DAU / MAU stickiness" value={percent(users.stickiness_dau_mau)} detail="Active creators in 24h ÷ active creators in 30d" />
      <Metric label="Receipt adoption" value={percent(users.receipt_adoption_rate)} detail="Activated users who created an Impact Receipt" />
      <Metric label="Packet adoption" value={percent(users.packet_adoption_rate)} detail="Activated users who generated a packet" />
      <Metric label="30d cohort retention" value={users.retention_30d_cohort_rate == null ? "Building cohort" : percent(users.retention_30d_cohort_rate)} detail={users.retention_30d_cohort_rate == null ? "Needs users old enough for a 30–60 day cohort" : `${number(users.retention_30d_cohort_size)} users in measured cohort`} />
    </div>

    <div className="founder-section-heading"><div><Activity size={18} /><h3>Core product funnel</h3></div><span>Landing-page acquisition is intentionally excluded until anonymous acquisition events are instrumented.</span></div>
    <Funnel funnel={analytics.funnel || {}} />

    <div className="founder-two-column">
      <article className="founder-list-card">
        <div className="founder-card-title"><ReceiptText size={18} /><div><h3>Career evidence depth</h3><p>Measures completeness and proof behavior, not user quality.</p></div></div>
        <div className="founder-mini-grid">
          <Metric label="Avg accomplishments / user" value={engagement.average_accomplishments_per_user ?? 0} detail="Across all accounts" />
          <Metric label="Avg receipts / activated user" value={engagement.average_receipts_per_activated_user ?? 0} detail="Receipt depth after first value" />
          <Metric label="Evidence attached" value={percent(engagement.evidence_attachment_rate)} detail="Impact Receipts with supporting evidence" />
          <Metric label="Confirmed proof" value={percent(engagement.confirmation_rate)} detail="Impact Receipts with confirmed credit" />
        </div>
      </article>

      <article className="founder-list-card">
        <div className="founder-card-title"><BriefcaseBusiness size={18} /><div><h3>Proof Profile · 30 days</h3><p>Privacy-minimized first-party engagement events.</p></div></div>
        <div className="founder-mini-grid">
          <Metric label="Views" value={number(profiles.views_30d)} detail={`${number(profiles.unique_visitors_30d)} unique visitors`} />
          <Metric label="Open to Talk clicks" value={number(profiles.open_to_talk_clicks_30d)} detail={`${percent(profiles.open_to_talk_conversion_rate)} of profile views`} />
          <Metric label="All outbound CTA clicks" value={number(profiles.outbound_cta_clicks_30d)} detail="Booking/contact, GitHub, portfolio, résumé" />
          <Metric label="Packets · 30d" value={number(packets.generated_30d)} detail={`${number(packets.generated_all_time)} generated all time`} />
        </div>
      </article>
    </div>

    <div className="founder-two-column">
      <RankedList title="Most common skills" rows={content.top_skills || []} emptyText="No skill metadata yet." />
      <RankedList title="Most common career categories" rows={content.top_categories || []} emptyText="No category metadata yet." />
    </div>

    <div className="founder-two-column">
      <article className="founder-list-card">
        <h3>Popular packet types · 30 days</h3>
        {(packets.popular_types_30d || []).length === 0 ? <p>No packet exports in this window yet.</p> : <div className="founder-rank-list">{packets.popular_types_30d.map((item, index) => <div key={item.packet_kind}><strong>{index + 1}</strong><span>{String(item.packet_kind || "unknown").replace(/-/g, " ")}</span><b>{number(item.count)}</b></div>)}</div>}
        <div className="founder-business-row"><span>Pro subscribers <strong>{number(business.pro_subscribers)}</strong></span><span>Cancellation pending <strong>{number(business.cancellation_pending)} · {percent(business.cancellation_pending_rate)}</strong></span><span>Former subscribers <strong>{number(business.former_subscribers)}</strong></span></div>
        <p className="founder-data-note">MRR uses BragStack's configured Pro monthly price. True churn is intentionally not estimated until subscription-history events can support a time-bounded churn calculation.</p>
      </article>

      <article className="founder-list-card">
        <div className="founder-card-title"><Gauge size={18} /><div><h3>API health</h3><p>Computed from persisted sanitized request telemetry.</p></div></div>
        <div className="founder-api-summary"><span><b>{percent(api.error_rate)}</b> error rate</span><span><b>{percent(api.server_error_rate)}</b> 5xx rate</span><span><b>{api.p50_ms ?? 0} ms</b> p50</span><span><b>{api.p95_ms ?? 0} ms</b> p95</span><span><b>{api.p99_ms ?? 0} ms</b> p99</span></div>
      </article>
    </div>

    <div className="founder-two-column">
      <EndpointList title="Most-used endpoints" rows={api.top_endpoints || []} />
      <EndpointList title="Slowest endpoints" rows={api.slowest_endpoints || []} mode="slow" />
    </div>
  </section>;
}