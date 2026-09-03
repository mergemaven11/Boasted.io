import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Link2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import "./CalendarIntegrationsPage.css";

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

  function moveMonth(offset) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function connectProvider(provider) {
    const params = new URLSearchParams({ provider });
    window.location.assign(`/app/settings/integrations/calendar/connect?${params.toString()}`);
  }

  return (
    <main className="calendar-integrations-page">
      <header className="calendar-integrations-header">
        <div>
          <p className="calendar-kicker">INTEGRATIONS · CALENDARS</p>
          <h1>Your schedule, beside your proof.</h1>
          <span>Connect calendars to see upcoming meetings in BragStack without making your private schedule part of your public Proof Profile.</span>
        </div>
        <div className="calendar-privacy-pill"><ShieldCheck size={16}/> Private workspace only</div>
      </header>

      <section className="provider-grid" aria-label="Calendar providers">
        {PROVIDERS.map((provider) => {
          const state = providerState[provider.id];
          return (
            <article className="provider-card" key={provider.id}>
              <div className={`provider-mark provider-${provider.id}`} aria-hidden="true">{provider.monogram}</div>
              <div className="provider-copy">
                <div className="provider-title-row"><h2>{provider.name}</h2><span className={`connection-state ${state}`}>{state}</span></div>
                <p>{provider.description}</p>
                <button type="button" className="provider-connect" onClick={() => connectProvider(provider.id)}>
                  <Link2 size={16}/> Connect {provider.name} <ExternalLink size={14}/>
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="calendar-shell">
        <div className="calendar-main">
          <div className="calendar-toolbar">
            <div>
              <p className="calendar-kicker">UPCOMING MEETINGS</p>
              <h2>{monthLabel(month)}</h2>
            </div>
            <div className="calendar-toolbar-actions">
              <button type="button" onClick={() => { const now = new Date(); setMonth(now); setSelectedDay(now); }}>Today</button>
              <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={18}/></button>
              <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={18}/></button>
            </div>
          </div>

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
        </div>

        <aside className="agenda-panel">
          <div className="agenda-heading">
            <div>
              <p className="calendar-kicker">AGENDA</p>
              <h2>{selectedDay.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</h2>
            </div>
            <button type="button" className="icon-button" aria-label="Refresh calendar"><RefreshCw size={16}/></button>
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
              <p>Connect Google Calendar or Microsoft Outlook above. BragStack will show upcoming meetings here once calendar sync is authorized.</p>
              <span><Sparkles size={14}/> We will never publish your calendar to your Proof Profile.</span>
            </div>
          )}
        </aside>
      </section>

      <section className="calendar-boundary-note">
        <ShieldCheck size={18}/>
        <div><strong>Privacy boundary</strong><p>Calendar data is for your authenticated workspace and meeting preparation. Public Proof Profiles and Open to Talk do not expose event titles, attendees, notes, or private availability.</p></div>
      </section>
    </main>
  );
}
