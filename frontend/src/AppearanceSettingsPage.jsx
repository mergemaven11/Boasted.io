import { ArrowLeft, Palette, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, updateCurrentUserProfile } from "./api";
import BragStackLoader from "./BragStackLoader.jsx";
import { getProfileLayout, getProfileTheme, PROFILE_LAYOUTS, PROFILE_THEMES } from "./profileThemes";
import "./ProfilePage.css";
import "./FlowerLayoutPreviews.css";

const EMPTY_APPEARANCE = {
  profile_theme: "default",
  profile_layout: "editorial",
  profile_primary_color: "",
  profile_secondary_color: "",
  profile_background_color: "",
};

function FlowerLayoutMini({ id, primary, secondary, background }) {
  return (
    <span
      className={`flower-layout-mini flower-layout-mini-${id}`}
      style={{
        "--preview-primary": primary,
        "--preview-secondary": secondary,
        "--preview-background": background,
      }}
      aria-hidden="true"
    >
      <i className="mini-hero" />
      <i className="mini-side" />
      <i className="mini-main" />
      <i className="mini-card mini-card-one" />
      <i className="mini-card mini-card-two" />
      <i className="mini-card mini-card-three" />
    </span>
  );
}

export default function AppearanceSettingsPage(){
  const[user,setUser]=useState(null),[form,setForm]=useState(null),[saving,setSaving]=useState(false),[error,setError]=useState("");
  useEffect(()=>{let active=true;getCurrentUser().then(u=>{if(!active)return;setUser(u);setForm({
    profile_theme:u.profile_theme||"default",
    profile_layout:u.profile_layout||"editorial",
    profile_primary_color:u.profile_primary_color||"",
    profile_secondary_color:u.profile_secondary_color||"",
    profile_background_color:u.profile_background_color||"",
  });}).catch(()=>{if(active)setError("Appearance settings could not be loaded.");});return()=>{active=false};},[]);
  if(!form&&!error)return <BragStackLoader compact message="Loading your appearance…" detail="Preparing your flower templates, themes, colors, and public profile preview."/>;
  if(!form)return <main className="profile-settings"><div className="profile-loading">{error}</div></main>;
  const theme=getProfileTheme(form.profile_theme),layout=getProfileLayout(form.profile_layout),primary=form.profile_primary_color||theme.primary,secondary=form.profile_secondary_color||theme.secondary,background=form.profile_background_color||theme.background;
  const previewQuery=new URLSearchParams({appearancePreview:"1",layout:form.profile_layout,theme:form.profile_theme,primary,secondary,background}).toString();
  const previewHref=user?.public_slug?`/brag/${user.public_slug}?${previewQuery}`:"";
  function chooseTheme(id){setForm(c=>({...c,profile_theme:id,profile_primary_color:"",profile_secondary_color:"",profile_background_color:""}));}
  function chooseLayout(id){setForm(c=>({...c,profile_layout:id}));}
  function change(e){setForm(c=>({...c,[e.target.name]:e.target.value}));}
  function reset(){setForm(c=>({...c,profile_primary_color:"",profile_secondary_color:"",profile_background_color:""}));}
  async function save(){
    setSaving(true);setError("");
    try{
      const saved=await updateCurrentUserProfile({...EMPTY_APPEARANCE,...form});
      if(saved.profile_theme!==form.profile_theme){throw new Error("Saved theme did not match the selected theme.");}
      if((saved.profile_layout||"editorial")!==form.profile_layout){throw new Error("Saved layout did not match the selected profile structure.");}
      sessionStorage.setItem("bragstack_settings_notice","Profile appearance saved.");
      window.location.assign("/app/settings?saved=appearance");
    }catch(e){
      const detail=e.response?.data?.detail;
      setError(typeof detail==="string"?detail:e.message||"Appearance could not be saved.");
      setSaving(false);
    }
  }
  return <main className="profile-settings"><header className="profile-settings-header"><div><a className="profile-public-link" href="/app/settings"><ArrowLeft size={16}/> Back to settings</a><p className="profile-settings-eyebrow"><Palette size={14}/> Settings</p><h1>Profile appearance</h1><p>Choose one of 12 distinct flower templates, then customize its color palette for your public Proof Profile.</p></div>{previewHref&&<a className="profile-public-link" href={previewHref}>Preview selected design</a>}</header><section className="profile-settings-card appearance-section standalone">{error&&<div className="profile-save-error">{error}</div>}
    <div className="appearance-heading"><h2>Flower profile templates</h2><p>Each flower changes the actual composition, hierarchy, spacing, card treatment, and responsive behavior. Your selected theme colors flow into every template preview.</p></div>
    <div className="theme-gallery flower-layout-gallery" data-profile-layout-gallery>{PROFILE_LAYOUTS.map(item=><button type="button" key={item.id} className={`theme-card flower-layout-card ${form.profile_layout===item.id?"selected":""}`} onClick={()=>chooseLayout(item.id)} aria-pressed={form.profile_layout===item.id}><FlowerLayoutMini id={item.id} primary={primary} secondary={secondary} background={background}/><span><strong>{item.name}</strong><small>{item.description}</small></span></button>)}</div>
    <div className="appearance-heading" style={{marginTop:28}}><h2>Career-inspired color palettes</h2><p>Pick a starting palette, then make it yours.</p></div><div className="theme-gallery">{PROFILE_THEMES.map(t=><button type="button" key={t.id} className={`theme-card ${form.profile_theme===t.id?"selected":""}`} onClick={()=>chooseTheme(t.id)}><span className="theme-swatch" style={{background:`linear-gradient(135deg,${t.primary},${t.secondary} 55%,${t.background} 56%)`}}/><span><strong>{t.name}</strong><small>{t.career}</small></span></button>)}</div><div className="appearance-custom"><div className="appearance-subhead"><div><h3>Your colors</h3><p>Primary, secondary, and background.</p></div><button className="reset-theme" type="button" onClick={reset}><RotateCcw size={15}/> Reset</button></div><div className="color-grid">{[["profile_primary_color","Primary",primary],["profile_secondary_color","Secondary",secondary],["profile_background_color","Background",background]].map(([name,label,value])=><label className="color-control" key={name}><span>{label}</span><div><input className="native-color" type="color" name={name} value={value} onChange={change}/><input className="hex-color" name={name} value={form[name]||value} onChange={change} pattern="#[0-9A-Fa-f]{6}" maxLength={7}/></div></label>)}</div><div className="appearance-preview" style={{background}}><span className="preview-badge" style={{color:primary,borderColor:primary}}>FLOWER TEMPLATE · {layout.name.toUpperCase()}</span><h3>{user?.name||"Your name"}</h3><p>{user?.headline||"Your professional headline"}</p><div className="preview-gradient" style={{background:`linear-gradient(90deg,${primary},${secondary})`}}/><a href={previewHref||"#"} style={{display:"inline-flex",alignItems:"center",minHeight:40,padding:"0 14px",borderRadius:10,background:`linear-gradient(135deg,${primary},${secondary})`,color:"white",fontWeight:900,textDecoration:"none"}}>Open full preview</a></div></div><div className="profile-settings-actions"><span>Saving here updates both the flower template and color theme, then returns you to Settings.</span><button type="button" disabled={saving} onClick={save}><Save size={17}/>{saving?"Saving…":"Save appearance"}</button></div></section></main>}
