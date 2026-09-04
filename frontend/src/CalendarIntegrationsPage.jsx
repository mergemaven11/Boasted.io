import { useEffect, useMemo, useState } from "react";
import {
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

const PROVIDERS = [
  { id: "google", name: "Google Calendar", monogram: "G", description: "Connect Google Calendar to bring upcoming meetings into your private BragStack workspace." },
  { id: "microsoft", name: "Microsoft Outlook", monogram: "M", description: "Connect Microsoft 365 or Outlook Calendar for one private view of your upcoming meetings." },
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthLabel(date) { return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date); }
function dayKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function buildMonthDays(anchor) { const year=anchor.getFullYear(),month=anchor.getMonth(),first=new Date(year,month,1),start=new Date(year,month,1-first.getDay());return Array.from({length:42},(_,index)=>{const value=new Date(start);value.setDate(start.getDate()+index);return value;}); }
function isCalendlyUrl(value="") { try { const url=new URL(value); return url.protocol === "https:" && (url.hostname === "calendly.com" || url.hostname.endsWith(".calendly.com")); } catch { return false; } }

export default function CalendarIntegrationsPage() {
  const [month,setMonth]=useState(()=>new Date());
  const [selectedDay,setSelectedDay]=useState(()=>new Date());
  const [providerState]=useState({google:"disconnected",microsoft:"disconnected"});
  const [connectionMessage,setConnectionMessage]=useState("");
  const [calendarView,setCalendarView]=useState("month");
  const [profileConnection,setProfileConnection]=useState(null);
  const [calendlyUrl,setCalendlyUrl]=useState("");
  const [showOnProfile,setShowOnProfile]=useState(false);
  const [savingCalendly,setSavingCalendly]=useState(false);
  const [calendlyMessage,setCalendlyMessage]=useState("");
  const [calendlyError,setCalendlyError]=useState("");

  useEffect(()=>{let active=true;getProfileConnection().then(data=>{if(!active)return;setProfileConnection(data);setCalendlyUrl(data.open_to_talk_url||"");setShowOnProfile(Boolean(data.open_to_talk));}).catch(()=>{if(active)setCalendlyError("Booking settings could not be loaded.");});return()=>{active=false};},[]);

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
    if(trimmed && !isCalendlyUrl(trimmed)){setCalendlyError("Paste a valid https://calendly.com/... booking link so BragStack can safely embed the scheduler.");return;}
    setSavingCalendly(true);
    try{
      const current=profileConnection||{};
      const updated=await updateProfileConnection({
        open_to_talk:Boolean(showOnProfile && trimmed),
        open_to_talk_url:trimmed,
        open_to_talk_note:current.open_to_talk_note||"Book a time directly from my BragStack Proof Profile.",
        open_to_talk_types:current.open_to_talk_types||[],
      });
      setProfileConnection(updated);setShowOnProfile(Boolean(updated.open_to_talk));setCalendlyUrl(updated.open_to_talk_url||"");setCalendlyMessage(trimmed?"Calendly saved. Your scheduler is ready for your public Proof Profile.":"Booking link removed.");
    }catch(error){setCalendlyError(error.response?.data?.detail||"Calendly settings could not be saved.");}finally{setSavingCalendly(false);}
  }

  return (
    <main className="calendar-integrations-page">
      <header className="calendar-integrations-header"><div><p className="calendar-kicker">INTEGRATIONS · CALENDARS</p><h1>Your schedule, beside your proof.</h1><span>Add a booking scheduler to your public Proof Profile, and keep private calendar sync separate from what visitors can see.</span></div><div className="calendar-privacy-pill"><ShieldCheck size={16}/> You control public booking</div></header>

      <section className="calendly-integration-card" aria-labelledby="calendly-heading">
        <div className="calendly-integration-copy"><p className="calendar-kicker">PUBLIC PROFILE · CALENDLY</p><h2 id="calendly-heading">Embed your actual booking calendar</h2><p>Paste your Calendly event or scheduling link. BragStack stores the URL and embeds the scheduler on your public Proof Profile—no Calendly OAuth required.</p></div>
        <div className="calendly-controls"><label><span>Calendly booking URL</span><div className="calendly-url-row"><Link2 size={17}/><input type="url" value={calendlyUrl} onChange={(e)=>{setCalendlyUrl(e.target.value);setCalendlyMessage("");setCalendlyError("");}} placeholder="https://calendly.com/your-name/30min" /></div></label><label className="calendly-profile-toggle"><input type="checkbox" checked={showOnProfile} onChange={(e)=>setShowOnProfile(e.target.checked)} disabled={!calendlyUrl.trim()}/><span><strong>Show scheduler on my public Proof Profile</strong><small>Visitors will see the actual calendar and available times, not just a plain link.</small></span></label><button type="button" className="calendly-save" onClick={()=>void saveCalendly()} disabled={savingCalendly}><Save size={16}/>{savingCalendly?"Saving…":"Save Calendly"}</button>{calendlyMessage&&<div className="calendly-success" role="status">{calendlyMessage}</div>}{calendlyError&&<div className="calendly-error" role="alert">{calendlyError}</div>}</div>
        {validCalendly&&<div className="calendly-preview"><div className="calendly-preview-heading"><div><span>LIVE PREVIEW</span><strong>Your embedded scheduler</strong></div><a href={calendlyUrl} target="_blank" rel="noreferrer">Open Calendly <ExternalLink size={14}/></a></div><iframe title="Calendly scheduler preview" src={calendlyUrl} loading="lazy" allow="payment" /></div>}
      </section>

      <section className="calendar-overview" aria-label="Calendar overview"><article><span>Private calendar connections</span><strong>{connectedProviders}</strong><small>Google + Microsoft sync remains private</small></article><article><span>Upcoming meetings</span><strong>{meetings.length}</strong><small>Nothing is imported until you authorize it</small></article><article><span>Public scheduler</span><strong>{showOnProfile&&validCalendly?"On":"Off"}</strong><small>Calendly availability only—never your private event titles</small></article></section>

      <section className="provider-grid" aria-label="Calendar providers">{PROVIDERS.map((provider)=>{const state=providerState[provider.id];return <article className="provider-card" key={provider.id}><div className={`provider-mark provider-${provider.id}`} aria-hidden="true">{provider.monogram}</div><div className="provider-copy"><div className="provider-title-row"><h2>{provider.name}</h2><span className={`connection-state ${state}`}>{state}</span></div><p>{provider.description}</p><button type="button" className="provider-connect" onClick={()=>connectProvider(provider.id)}><Link2 size={16}/> Connect {provider.name}</button></div></article>;})}</section>
      {connectionMessage&&<div className="calendar-connection-notice" role="status"><ShieldCheck size={16}/><span>{connectionMessage}</span></div>}

      <section className="calendar-shell"><div className="calendar-main"><div className="calendar-toolbar"><div><p className="calendar-kicker">UPCOMING MEETINGS</p><h2>{monthLabel(month)}</h2></div><div className="calendar-toolbar-right"><div className="calendar-view-switch" aria-label="Calendar view"><button type="button" className={calendarView==="month"?"active":""} onClick={()=>setCalendarView("month")}>Month</button><button type="button" className={calendarView==="agenda"?"active":""} onClick={()=>setCalendarView("agenda")}>Agenda</button></div><div className="calendar-toolbar-actions"><button type="button" onClick={()=>{const now=new Date();setMonth(now);setSelectedDay(now);}}>Today</button><button type="button" aria-label="Previous month" onClick={()=>moveMonth(-1)}><ChevronLeft size={18}/></button><button type="button" aria-label="Next month" onClick={()=>moveMonth(1)}><ChevronRight size={18}/></button></div></div></div>{calendarView==="month"?<><div className="calendar-weekdays">{WEEKDAYS.map((day)=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{days.map((date)=>{const key=dayKey(date),inMonth=date.getMonth()===month.getMonth(),hasMeetings=Boolean(meetingsByDay[key]?.length);return <button type="button" key={key} className={`calendar-day ${inMonth?"":"outside"} ${key===today?"today":""} ${key===selected?"selected":""}`} onClick={()=>setSelectedDay(date)} aria-label={date.toLocaleDateString()}><span>{date.getDate()}</span>{hasMeetings&&<i aria-label={`${meetingsByDay[key].length} meetings`}>{meetingsByDay[key].length}</i>}</button>;})}</div></>:<div className="calendar-agenda-view"><div className="agenda-empty-icon"><CalendarDays size={28}/></div><h3>Your agenda will live here</h3><p>Once a calendar is connected, BragStack can show a clean chronological list of upcoming meetings without exposing private calendar data publicly.</p></div>}</div><aside className="agenda-panel"><div className="agenda-heading"><div><p className="calendar-kicker">SELECTED DAY</p><h2>{selectedDay.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"})}</h2></div><button type="button" className="icon-button" aria-label="Refresh calendar"><RefreshCw size={16}/></button></div><div className="calendar-provider-legend" aria-label="Calendar provider legend"><span><i className="legend-dot google"/>Google</span><span><i className="legend-dot microsoft"/>Microsoft</span></div>{selectedMeetings.length?<div className="meeting-list">{selectedMeetings.map((meeting)=><article className="meeting-card" key={meeting.id}><span className="meeting-time"><Clock3 size={14}/>{meeting.time_label}</span><h3>{meeting.title}</h3><p>{meeting.organizer||meeting.provider}</p>{meeting.join_url&&<a href={meeting.join_url} target="_blank" rel="noreferrer"><Video size={15}/> Join meeting</a>}</article>)}</div>:<div className="agenda-empty"><div className="agenda-empty-icon"><CalendarDays size={28}/></div><h3>No synced meetings yet</h3><p>Private Google or Microsoft calendar sync will appear here once OAuth is wired. Calendly booking works separately above.</p><span><Sparkles size={14}/> Your private schedule never becomes Proof Profile content.</span></div>}</aside></section>
      <section className="calendar-boundary-note"><ShieldCheck size={18}/><div><strong>Privacy boundary</strong><p>The Calendly scheduler can be public when you enable it. Google/Microsoft event titles, attendees, notes, and private availability remain authenticated workspace data only.</p></div></section>
    </main>
  );
}
