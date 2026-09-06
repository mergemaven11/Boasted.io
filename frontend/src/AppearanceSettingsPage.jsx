import { ArrowLeft, Palette, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, updateCurrentUserProfile } from "./api";
import BragStackLoader from "./BragStackLoader.jsx";
import { getProfileTheme, PROFILE_LAYOUTS, PROFILE_THEMES } from "./profileThemes";
import "./ProfilePage.css";
import "./ProofProfileThemes.css";

const EMPTY_APPEARANCE = {
  profile_theme: "default",
  profile_layout: "editorial",
  profile_primary_color: "",
  profile_secondary_color: "",
  profile_background_color: "",
};

export default function AppearanceSettingsPage(){
  const[user,setUser]=useState(null),[form,setForm]=useState(null),[saving,setSaving]=useState(false),[error,setError]=useState("");
  useEffect(()=>{let active=true;getCurrentUser().then(u=>{if(!active)return;setUser(u);setForm({
    profile_theme:u.profile_theme||"default",
    profile_layout:u.profile_layout||"editorial",
    profile_primary_color:u.profile_primary_color||"",
    profile_secondary_color:u.profile_secondary_color||"",
    profile_background_color:u.profile_background_color||"",
  });}).catch(()=>{if(active)setError("Appearance settings could not be loaded.");});return()=>{active=false};},[]);
  if(!form&&!error)return <BragStackLoader compact message="Loading your appearance…" detail="Preparing your profile structures, themes, colors, and public profile preview."/>;
  if(!form)return <main className="profile-settings"><div className="profile-loading">{error}</div></main>;
  const theme=getProfileTheme(form.profile_theme),primary=form.profile_primary_color||theme.primary,secondary=form.profile_secondary_color||theme.secondary,background=form.profile_background_color||theme.background;
  function choose(id){setForm(c=>({...c,profile_theme:id,profile_primary_color:"",profile_secondary_color:"",profile_background_color:""}));}
  function chooseLayout(id){setForm(c=>({...c,profile_layout:id}));}
  function change(e){setForm(c=>({...c,[e.target.name]:e.target.value}));}
  function reset(){setForm(c=>({...c,profile_primary_color:"",profile_secondary_color:"",profile_background_color:""}));}
  async function save(){
    setSaving(true);setError("");
    try{
      const saved=await updateCurrentUserProfile({...EMPTY_APPEARANCE,...form});
      if(saved.profile_theme!==form.profile_theme){throw new Error("Saved theme did not match the selected theme.");}
      if((saved.profile_layout||"editorial")!==form.profile_layout){throw new Error("Saved profile structure did not match the selected structure.");}
      sessionStorage.setItem("bragstack_settings_notice","Profile appearance saved.");
      window.location.assign("/app/settings?saved=appearance");
    }catch(e){
      const detail=e.response?.data?.detail;
      setError(typeof detail==="string"?detail:e.message||"Appearance could not be saved.");
      setSaving(false);
    }
  }
  return <main className="profile-settings"><header className="profile-settings-header"><div><a className="profile-public-link" href="/app/settings"><ArrowLeft size={16}/> Back to settings</a><p className="profile-settings-eyebrow"><Palette size={14}/> Settings</p><h1>Profile appearance</h1><p>Choose the structure, visual theme, and colors for your public Proof Profile.</p></div>{user?.public_slug&&<a className="profile-public-link" href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer">Preview public profile</a>}</header><section className="profile-settings-card appearance-section standalone">{error&&<div className="profile-save-error">{error}</div>}<div className="appearance-heading"><h2>Profile structure</h2><p>Choose one of 12 distinct professional layouts. Structure controls composition; colors are selected separately below.</p></div><div className="profile-layout-gallery">{PROFILE_LAYOUTS.map(layout=><button type="button" key={layout.id} className={form.profile_layout===layout.id?"selected":""} onClick={()=>chooseLayout(layout.id)} aria-pressed={form.profile_layout===layout.id}><span className={`layout-thumbnail layout-thumbnail-${layout.id}`} aria-hidden="true"><i/><i/><i/></span><strong>{layout.name}</strong><small>{layout.description}</small></button>)}</div><div className="appearance-heading"><h2>Career-inspired themes</h2><p>Pick a color starting style, then make it yours.</p></div><div className="theme-gallery">{PROFILE_THEMES.map(t=><button type="button" key={t.id} className={`theme-card ${form.profile_theme===t.id?"selected":""}`} onClick={()=>choose(t.id)}><span className="theme-swatch" style={{background:`linear-gradient(135deg,${t.primary},${t.secondary} 55%,${t.background} 56%)`}}/><span><strong>{t.name}</strong><small>{t.career}</small></span></button>)}</div><div className="appearance-custom"><div className="appearance-subhead"><div><h3>Your colors</h3><p>Primary, secondary, and background.</p></div><button className="reset-theme" type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></div><div className="color-grid">{[["profile_primary_color","Primary",primary],["profile_secondary_color","Secondary",secondary],["profile_background_color","Background",background]].map(([name,label,value])=><label className="color-control" key={name}><span>{label}</span><div><input className="native-color" type="color" name={name} value={value} onChange={change}/><input className="hex-color" name={name} value={form[name]||value} onChange={change} pattern="#[0-9A-Fa-f]{6}" maxLength={7}/></div></label>)}</div><div className="appearance-preview" style={{background}}><span className="preview-badge" style={{color:primary,borderColor:primary}}>PROOF PROFILE</span><h3>{user?.name||"Your name"}</h3><p>{user?.headline||"Your professional headline"}</p><div className="preview-gradient" style={{background:`linear-gradient(90deg,${primary},${secondary})`}}/><button type="button" style={{background:`linear-gradient(135deg,${primary},${secondary})`}}>View proof</button></div></div><div className="profile-settings-actions"><span>Saving here updates the public Proof Profile structure, theme, and colors, then returns you to Settings.</span><button type="button" disabled={saving} onClick={save}><Save size={17}/>{saving?"Saving…":"Save appearance"}</button></div></section></main>}
