import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Link2,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import CalendlyEmbed from "./CalendlyEmbed.jsx";
import { getProfileConnection, updateProfileConnection } from "./profileConnectionApi.js";
import "./CalendarIntegrationsPage.css";

const PROVIDERS = [
  { id: "google", name: "Google Calendar", monogram: "G", description: "Connect Google Calendar to bring upcoming meetings into your private BragStack workspace." },
  { id: "microsoft", name: "Microsoft Outlook", monogram: "M", description: "Connect Microsoft 365 or Outlook Calendar for one private view of your upcoming meetings." },
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthLabel(date) { return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date); }
function dayKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function buildMonthDays(anchor) { const year=anchor.getFullYear(),month=anchor.getMonth(),first=new Date(year,month,1),start=new Date(year,month,1-first.getDay());return Array.from({length:42},(_,index)=>{const value=new Date(start);value.setDate(start.getDate()+index);return value;}); }
function isCalendlyUrl(value="") { try { const url=new URL(value); return url.protocol === "https:" && (url.hostname === "calendly.com" || url.hostname.endsWith(".calendly.com")) && url.pathname !== "/"; } catch { return false; } }

export default function CalendarIntegrationsPage() {
  const [month,setMonth]=useState(()=>new Date());
  const [selectedDay,setSelectedDay]=useState(()=>new Date());
  const [providerState]=useState({google:"disconnected",microsoft:"disconnected"});
  const [connectionMessage,setConnectionMessage]=useState("");
  const [calendarView,setCalendarView]=useState("month");
  const [calendlyUrl,setCalendlyUrl]=useState("");
  const [showOnProfile,setShowOnProfile]=useState(false);
  const [savingCalendly,setSavingCalendly]=useState(false);
  const [calendlyMessage,setCalendlyMessage]=useState("");
  const [calendlyError,setCalendlyError]=useState("");

  useEffect(()=>{let active=true;getProfileConnection().then(data=>{if(!active)return;setCalendlyUrl(data.calendly_url||"");setShowOnProfile(Boolean(data.calendly_enabled));}).catch((error)=>{if(!active)return;if(error.response?.status===401){localStorage.removeItem("bragstack_token");window.location.assign("/login");return;}setCalendlyError("Booking settings could not be loaded.");});return()=>{active=false};},[]);

  const days=useMemo(()=>buildMonthDays(month),[month]);
  const today=dayKey(new Date());
  const selected=dayKey(selectedDay);
  const meetings=useMemo(()=>[],[]);
  const meetingsByDay=useMemo(()=>meetings.reduce((map,meeting)=>{const key=dayKey(new Date(meeting.starts_at));map[key]=[...(map[key]||[]),meeting];return map;},{}),[meetings]);
  const selectedMeetings=meetingsByDay[selected]||[];
  const connectedProviders=Object.values(providerState).filter((state)=>state==="connected").length;
  const validCalendly=isCalendlyUrl(calendlyUrl);

  function moveMonth(offset){setMonth((current)=>new Date(current.getFullYear(),current.getMonth()+offset,1));}
  function connectProvider(provider){const providerName=PROVIDERS.find((item)=>item.id===provider)?.name||"calendar";setConnectionMessage(`${providerName} is ready for OAuth wiring. BragStack has not connected or read any calendar data yet.`);}

  async function saveCalendly(){
    setCalendlyError("");setCalendlyMessage("");
    const trimmed=calendlyUrl.trim();
    if(trimmed && !isCalendlyUrl(trimmed)){setCalendlyError("Paste a valid https://calendly.com/... scheduling URL so BragStack can render the calendar.");return;}
    setSavingCalendly(true);
    try{
      const updated=await updateProfileConnection({
        calendly_url:trimmed,
        calendly_enabled:Boolean(showOnProfile && trimmed),
      });
      setShowOnProfile(Boolean(updated.calendly_enabled));
      setCalendlyUrl(updated.calendly_url||"");
      setCalendlyMessage(trimmed
        ? (updated.calendly_enabled ? "Saved — the interactive Calendly calendar is live on your public Proof Portfolio." : "Saved — enable public display when you want the calendar visible.")
        : "Calendly scheduling removed.");
    }catch(error){setCalendlyError(error.response?.data?.detail||"Calendly settings could not be saved.");}finally{setSavingCalendly(false);}
  }

  return (
    <main className="calendar-integrations-page">
      <header className="calendar-integrations-header"><div><p className="calendar-kicker">INTEGRATIONS · CALENDARS</p><h1>Your schedule, beside your proof.</h1><span>Add your Calendly schedule once, then show the actual interactive calendar inside your public Proof Portfolio.</span></div><div className="calendar-privacy-pill"><ShieldCheck size={16}/> You control public booking</div></header>

      <section className="calendly-integration-card" aria-labelledby="calendly-heading">
        <div className="calendly-integration-copy"><p className="calendar-kicker">PUBLIC PROOF PORTFOLIO · CALENDLY</p><h2 id="calendly-heading">Show the real calendar, not a booking button</h2><p>The scheduling URL is only configuration. Visitors see Calendly's interactive date-and-time picker embedded directly in the portfolio.</p></div>
        <div className="calendly-controls"><label><span>Your Calendly scheduling page</span><div className="calendly-url-row"><Link2 size={17}/><input type="url" value={calendlyUrl} onChange={(e)=>{setCalendlyUrl(e.target.value);setCalendlyMessage("");setCalendlyError("");}} placeholder="https://calendly.com/your-name/30min" /></div></label><label className="calendly-profile-toggle"><input type="checkbox" checked={showOnProfile} onChange={(e)=>setShowOnProfile(e.target.checked)} disabled={!calendlyUrl.trim()}/><span><strong>Show the interactive calendar on my public Proof Portfolio</strong><small>Visitors choose the day and available time right on your portfolio page.</small></span></label><button type="button" className="calendly-save" onClick={()=>void saveCalendly()} disabled={savingCalendly}><Save size={16}/>{savingCalendly?"Saving…":"Save Calendly"}</button>{calendlyMessage&&<div className="calendly-success" role="status">{calendlyMessage}</div>}{calendlyError&&<div className="calendly-error" role="alert">{calendlyError}</div>}</div>
        {validCalendly&&<div className="calendly-preview"><div className="calendly-preview-heading"><div><span>LIVE PREVIEW</span><strong>This is the calendar visitors will see</strong></div></div><CalendlyEmbed url={calendlyUrl} title="Preview your scheduling calendar" compact /></div>}
      </section>

      <section className="calendar-overview" aria-label="Calendar overview"><article><span>Private calendar connections</span><strong>{connectedProviders}</strong><small>Google + Microsoft sync remains private</small></article><article><span>Upcoming meetings</span><strong>{meetings.length}</strong><small>Nothing is imported until you authorize it</small></article><article><span>Public calendar</span><strong>{showOnProfile&&validCalendly?"On":"Off"}</strong><small>Interactive Calendly calendar on the Proof Portfolio</small></article></section>

      <section className="provider-grid" aria-label="Calendar providers">{PROVIDERS.map((provider)=>{const state=providerState[provider.id];return <article className="provider-card" key={provider.id}><div className={`provider-mark provider-${provider.id}`} aria-hidden="true">{provider.monogram}</div><div className="provider-copy"><div className="provider-title-row"><h2>{provider.name}</h2><span className={`connection-state ${state}`}>{state}</span></div><p>{provider.description}</p><button type="button" className="provider-connect" onClick={()=>connectProvider(provider.id)}><Link2 size={16}/> Connect {provider.name}</button></div></article>;})}</section>
      {connectionMessage&&<div className="calendar-connection-notice" role="status"><ShieldCheck size={16}/><span>{connectionMessage}</span></div>}

      <section className="calendar-shell"><div className="calendar-main"><div className="calendar-toolbar"><div><p className="calendar-kicker">UPCOMING MEETINGS</p><h2>{monthLabel(month)}</h2></div><div className="calendar-toolbar-right"><div className="calendar-view-switch" aria-label="Calendar view"><button type="button" className={calendarView==="month"?"active":""} onClick={()=>setCalendarView("month")}>Month</button><button type="button" className={calendarView==="agenda"?"active":""} onClick={()=>setCalendarView("agenda")}>Agenda</button></div><div className="calendar-toolbar-actions"><button type="button" onClick={()=>{const now=new Date();setMonth(now);setSelectedDay(now);}}>Today</button><button type="button" aria-label="Previous month" onClick={()=>moveMonth(-1)}><ChevronLeft size={18}/></button><button type="button" aria-label="Next month" onClick={()=>moveMonth(1)}><ChevronRight size={18}/></button></div></div></div>{calendarView==="month"?<><div className="calendar-weekdays">{WEEKDAYS.map((day)=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((date)=>{const key=dayKey(date),inMonth=date.getMonth()===month.getMonth(),hasMeetings=Boolean(meetingsByDay[key]?.length);return <button type="button" key={key} className={`calendar-day ${inMonth?"":"outside"} ${key===today?"today":""} ${key===selected?"selected":""}`} onClick={()=>setSelectedDay(date)} aria-label={date.toLocaleDateString()}><span>{date.getDate()}</span>{hasMeetings&&<i aria-label={`${meetingsByDay[key].length} meetings`}>{meetingsByDay[key].length}</i>}</button>;})}</div></>:<div className="calendar-agenda-view"><div className="agenda-empty-icon"><CalendarDays size={28}/></div><h3>Your agenda will live here</h3><p>Once a calendar is connected, BragStack can show a clean chronological list of upcoming meetings without exposing private calendar data publicly.</p></div>}</div><aside className="agenda-panel"><div className="agenda-heading"><div><p className="calendar-kicker">SELECTED DAY</p><h2>{selectedDay.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"})}</h2></div><button type="button" className="icon-button" aria-label="Refresh calendar"><RefreshCw size={16}/></button></div><div className="calendar-provider-legend" aria-label="Calendar provider legend"><span><i className="legend-dot google"/>Google</span><span><i className="legend-dot microsoft"/>Microsoft</span></div>{selectedMeetings.length?<div className="meeting-list">{selectedMeetings.map((meeting)=><article className="meeting-card" key={meeting.id}><span className="meeting-time"><Clock3 size={14}/>{meeting.time_label}</span><h3>{meeting.title}</h3><p>{meeting.organizer||meeting.provider}</p>{meeting.join_url&&<a href={meeting.join_url} target="_blank" rel="noreferrer"><Video size={15}/> Join meeting</a>}</article>)}</div>:<div className="agenda-empty"><div className="agenda-empty-icon"><CalendarDays size={28}/></div><h3>No synced meetings yet</h3><p>Private Google or Microsoft calendar sync will appear here once OAuth is wired. Calendly public booking works separately above.</p><span><Sparkles size={14}/> Your private schedule never becomes Proof Portfolio content.</span></div>}</aside></section>
      <section className="calendar-boundary-note"><ShieldCheck size={18}/><div><strong>Privacy boundary</strong><p>The Calendly calendar can be public when you enable it. Google/Microsoft event titles, attendees, notes, and private availability remain authenticated workspace data only.</p></div></section>
    </main>
  );
}
