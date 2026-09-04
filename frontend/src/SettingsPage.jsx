import { CalendarDays, Palette, UserRound, ShieldCheck, CreditCard, ChevronRight, GraduationCap } from "lucide-react";
import CalendarIntegrationsPage from "./CalendarIntegrationsPage.jsx";
import { startProductTour } from "./productTourActions.js";
import "./SettingsPage.css";

const SETTINGS=[
  {href:"/app/profile",icon:UserRound,title:"Profile",description:"Name, location, headline, bio, career details, and public profile information."},
  {href:"/app/settings?section=integrations",icon:CalendarDays,title:"Integrations",description:"Add Calendly to your public Proof Profile, and manage private Google or Microsoft calendar connections."},
  {href:"/app/settings/appearance",icon:Palette,title:"Profile appearance",description:"Public-page themes, career-inspired styles, and your custom profile colors."},
  {href:"/app/settings/privacy",icon:ShieldCheck,title:"Privacy & sharing",description:"Control what stays private and what can appear on your public proof profile.",comingSoon:true},
  {href:"/app/settings/billing",icon:CreditCard,title:"Plan & billing",description:"View your BragStack plan and manage subscription details."},
];

export default function SettingsPage(){
  const section=new URLSearchParams(window.location.search).get("section");
  if(section==="integrations")return <CalendarIntegrationsPage/>;
  return <main className="settings-page"><header className="settings-header"><p>ACCOUNT</p><h1>Settings</h1><span>Manage your profile, integrations, public appearance, privacy, and BragStack account.</span></header><section className="settings-grid">{SETTINGS.map(({href,icon:Icon,title,description,comingSoon})=>comingSoon?<div className="settings-card settings-card-disabled" key={title}><div className="settings-card-icon"><Icon size={22}/></div><div><div className="settings-card-title"><h2>{title}</h2><small>Coming soon</small></div><p>{description}</p></div></div>:<a className="settings-card" href={href} key={title}><div className="settings-card-icon"><Icon size={22}/></div><div><div className="settings-card-title"><h2>{title}</h2><ChevronRight size={19}/></div><p>{description}</p></div></a>)}<button className="settings-card" type="button" onClick={startProductTour}><div className="settings-card-icon"><GraduationCap size={22}/></div><div><div className="settings-card-title"><h2>Help & tutorial</h2><ChevronRight size={19}/></div><p>Restart the guided BragStack tour whenever you want a refresher.</p></div></button></section></main>;
}
