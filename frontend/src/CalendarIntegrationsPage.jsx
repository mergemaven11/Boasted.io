import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Link2,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { getProfileConnection, updateProfileConnection } from "./profileConnectionApi.js";
import "./CalendarIntegrationsPage.css";
import "./CalendarPublicScheduling.css";

const PROVIDERS = [
  {
    id: "google",
    name: "Google Calendar",
    monogram: "G",
    description: "Connect Google Calendar to bring upcoming meetings into your private BragStack workspace.",
  },
  {
    id: "microsoft",
    name: "Microsoft Outlook",
    monogram: "M",
    description: "Connect Microsoft 365 or Outlook Calendar for one private view of your upcoming meetings.",
  },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthLabel(date) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthDays(anchor) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(start);
    value.setDate(start.getDate() + index);
    return value;
  });
}

export default function CalendarIntegrationsPage() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [providerState] = useState({ google: "disconnected", microsoft: "disconnected" });
  const [connectionMessage, setConnectionMessage] = useState("");
  const [calendarView, setCalendarView] = useState("month");
  const [calendly, setCalendly] = useState({ calendly_url: "", calendly_enabled: false });
  const [calendlySaving, setCalendlySaving] = useState(false);
  const [calendlyMessage, setCalendlyMessage] = useState("");
  const [calendlyError, setCalendlyError] = useState("");
  const days = useMemo(() => buildMonthDays(month), [month]);
  const today = dayKey(new Date());
  const selected = dayKey(selectedDay);
  const meetings = [];
  const meetingsByDay = useMemo(() => meetings.reduce((map, meeting) => {
    const key = dayKey(new Date(meeting.starts_at));
    map[key] = [...(map[key] || []), meeting];
    return map;
  }, {}), [meetings]);
  const selectedMeetings = meetingsByDay[selected] || [];
  const connectedProviders = Object.values(providerState).filter((state) => state === "connected").length;

  useEffect(() => {
    let active = true;
    getProfileConnection()
      .then((data) => {
        if (!active) return;
        setCalendly({
          calendly_url: data.calendly_url || "",
          calendly_enabled: Boolean(data.calendly_enabled),
        });
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        setCalendlyError("Calendly settings could not be loaded.");
      });
    return () => { active = false; };
  }, []);

  function moveMonth(offset) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function connectProvider(provider) {
    const providerName = PROVIDERS.find((item) => item.id === provider)?.name || "calendar";
    setConnectionMessage(`${providerName} is ready for OAuth wiring. BragStack has not connected or read any calendar data yet.`);
  }

  async function saveCalendly(event) {
    event.preventDefault();
    setCalendlySaving(true);
    setCalendlyMessage("");
    setCalendlyError("");
    try {
      const updated = await updateProfileConnection(calendly);
      setCalendly({
        calendly_url: updated.calendly_url || "",
        calendly_enabled: Boolean(updated.calendly_enabled),
      });
      setCalendlyMessage(updated.calendly_enabled
        ? "Calendly is now visible as an interactive calendar on your public Proof Profile."
        : "Calendly settings saved. The calendar is hidden from your public Proof Profile.");
    } catch (error) {
      setCalendlyError(error.response?.data?.detail || "Calendly settings could not be saved.");
    } finally {
      setCalendlySaving(false);
    }
  }

  return (
    <main className="calendar-integrations-page">
      <header className="calendar-integrations-header">
        <div>
          <p className="calendar-kicker">INTEGRATIONS · CALENDARS</p>
          <h1>Your schedule, beside your proof.</h1>
          <span>Keep private calendars private, or intentionally publish a Calendly booking calendar on your Proof Profile.</span>
        </div>
        <div className="calendar-privacy-pill"><ShieldCheck size={16}/> You control what becomes public</div>
      </header>

      <section className="calendly-integration-card" aria-labelledby="calendly-heading">
        <div className="calendly-integration-copy">
          <div className="calendly-mark" aria-hidden="true"><CalendarCheck2 size={24}/></div>
          <div>
            <p className="calendar-kicker">PUBLIC SCHEDULING</p>
            <h2 id="calendly-heading">Calendly on your Proof Profile</h2>
            <p>Paste your public Calendly scheduling link. BragStack does not request Calendly OAuth or access your private calendar; it embeds the scheduling experience you choose to publish.</p>
          </div>
        </div>
        <form className="calendly-settings-form" onSubmit={saveCalendly}>
          <label>
            <span>Calendly scheduling link</span>
            <div className="calendly-url-row">
              <input
                type="url"
                value={calendly.calendly_url}
                onChange={(event) => setCalendly((current) => ({ ...current, calendly_url: event.target.value }))}
                placeholder="https://calendly.com/your-name/30min"
                autoComplete="url"
              />
              {calendly.calendly_url && <a href={calendly.calendly_url} target="_blank" rel="noreferrer" aria-label="Open Calendly link"><ExternalLink size={17}/></a>}
            </div>
            <small>Only HTTPS calendly.com scheduling links are accepted.</small>
          </label>
          <label className="calendly-toggle">
            <input
              type="checkbox"
              checked={calendly.calendly_enabled}
              onChange={(event) => setCalendly((current) => ({ ...current, calendly_enabled: event.target.checked }))}
            />
            <span><strong>Show the actual calendar on my public Proof Profile</strong><small>Visitors can select a date and available time without leaving your profile.</small></span>
          </label>
          {calendlyMessage && <div className="calendly-save-message success" role="status">{calendlyMessage}</div>}
          {calendlyError && <div className="calendly-save-message error" role="alert">{calendlyError}</div>}
          <div className="calendly-form-actions">
            <span><ShieldCheck size={15}/> BragStack stores the public link only.</span>
            <button type="submit" disabled={calendlySaving}><Save size={16}/> {calendlySaving ? "Saving…" : "Save Calendly"}</button>
          </div>
        </form>
      </section>

      <section className="calendar-overview" aria-label="Calendar overview">
        <article><span>Connected private calendars</span><strong>{connectedProviders}</strong><small>Google + Microsoft planned</small></article>
        <article><span>Upcoming meetings</span><strong>{meetings.length}</strong><small>Nothing is imported until you authorize it</small></article>
        <article><span>Public scheduling</span><strong>{calendly.calendly_enabled ? "On" : "Off"}</strong><small>Calendly is the only public calendar surface</small></article>
      </section>

      <section className="provider-grid" aria-label="Private calendar providers">
        {PROVIDERS.map((provider) => {
          const state = providerState[provider.id];
          return (
            <article className="provider-card" key={provider.id}>
              <div className={`provider-mark provider-${provider.id}`} aria-hidden="true">{provider.monogram}</div>
              <div className="provider-copy">
                <div className="provider-title-row"><h2>{provider.name}</h2><span className={`connection-state ${state}`}>{state}</span></div>
                <p>{provider.description}</p>
                <button type="button" className="provider-connect" onClick={() => connectProvider(provider.id)}>
                  <Link2 size={16}/> Connect {provider.name}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {connectionMessage && <div className="calendar-connection-notice" role="status"><ShieldCheck size={16}/><span>{connectionMessage}</span></div>}

      <section className="calendar-shell">
        <div className="calendar-main">
          <div className="calendar-toolbar">
            <div>
              <p className="calendar-kicker">PRIVATE WORKSPACE CALENDAR</p>
              <h2>{monthLabel(month)}</h2>
            </div>
            <div className="calendar-toolbar-right">
              <div className="calendar-view-switch" aria-label="Calendar view">
                <button type="button" className={calendarView === "month" ? "active" : ""} onClick={() => setCalendarView("month")}>Month</button>
                <button type="button" className={calendarView === "agenda" ? "active" : ""} onClick={() => setCalendarView("agenda")}>Agenda</button>
              </div>
              <div className="calendar-toolbar-actions">
                <button type="button" onClick={() => { const now = new Date(); setMonth(now); setSelectedDay(now); }}>Today</button>
                <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={18}/></button>
                <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={18}/></button>
              </div>
            </div>
          </div>

          {calendarView === "month" ? (
            <>
              <div className="calendar-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
              <div className="calendar-grid">
                {days.map((date) => {
                  const key = dayKey(date);
                  const inMonth = date.getMonth() === month.getMonth();
                  const hasMeetings = Boolean(meetingsByDay[key]?.length);
                  return (
                    <button
                      type="button"
                      key={key}
                      className={`calendar-day ${inMonth ? "" : "outside"} ${key === today ? "today" : ""} ${key === selected ? "selected" : ""}`}
                      onClick={() => setSelectedDay(date)}
                      aria-label={date.toLocaleDateString()}
                    >
                      <span>{date.getDate()}</span>
                      {hasMeetings && <i aria-label={`${meetingsByDay[key].length} meetings`}>{meetingsByDay[key].length}</i>}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="calendar-agenda-view">
              <div className="agenda-empty-icon"><CalendarDays size={28}/></div>
              <h3>Your agenda will live here</h3>
              <p>Once a private calendar is connected, BragStack can show a clean chronological list of upcoming meetings without exposing that data publicly.</p>
            </div>
          )}
        </div>

        <aside className="agenda-panel">
          <div className="agenda-heading">
            <div>
              <p className="calendar-kicker">SELECTED DAY</p>
              <h2>{selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2>
            </div>
            <button type="button" className="icon-button" aria-label="Refresh calendar"><RefreshCw size={16}/></button>
          </div>

          <div className="calendar-provider-legend" aria-label="Calendar provider legend">
            <span><i className="legend-dot google"/>Google</span>
            <span><i className="legend-dot microsoft"/>Microsoft</span>
          </div>

          {selectedMeetings.length ? (
            <div className="meeting-list">
              {selectedMeetings.map((meeting) => (
                <article className="meeting-card" key={meeting.id}>
                  <span className="meeting-time"><Clock3 size={14}/>{meeting.time_label}</span>
                  <h3>{meeting.title}</h3>
                  <p>{meeting.organizer || meeting.provider}</p>
                  {meeting.join_url && <a href={meeting.join_url} target="_blank" rel="noreferrer"><Video size={15}/> Join meeting</a>}
                </article>
              ))}
            </div>
          ) : (
            <div className="agenda-empty">
              <div className="agenda-empty-icon"><CalendarDays size={28}/></div>
              <h3>No synced meetings yet</h3>
              <p>Google and Outlook OAuth remain private-workspace integrations. They are separate from your public Calendly embed.</p>
              <span><Sparkles size={14}/> Private calendar events never become profile proof.</span>
            </div>
          )}
        </aside>
      </section>

      <section className="calendar-boundary-note">
        <ShieldCheck size={18}/>
        <div><strong>Privacy boundary</strong><p>Calendly publishes only the scheduling experience behind the link you provide. Google/Outlook event titles, attendees, notes, and private calendar data remain separate and are never exposed on your Proof Profile.</p></div>
      </section>
    </main>
  );
}
