import { useEffect, useState } from "react";
import { ExternalLink, ImagePlus, MessageSquare, Palette, RotateCcw, Save, UserRound } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import { getCurrentUser, updateCurrentUserProfile } from "./api";
import { getProfileConnection, updateProfileConnection } from "./profileConnectionApi";
import { updateProfileAvatar } from "./profileApi";
import { getProfileTheme, PROFILE_THEMES } from "./profileThemes";
import "./ProfilePage.css";

const EMPTY_PROFILE = { name:"",headline:"",bio:"",location:"",avatar_url:"",github_url:"",portfolio_url:"",resume_url:"",profile_theme:"default",profile_primary_color:"",profile_secondary_color:"",profile_background_color:"" };
const EMPTY_CONNECTION = { open_to_talk:false,open_to_talk_url:"",open_to_talk_note:"",open_to_talk_types:[] };
const CONVERSATION_TYPES = [
  ["general-chat","General chat","Open conversation"],
  ["virtual-coffee","Virtual coffee","Casual introduction"],
  ["recruiter-chat","Recruiter chat","Career opportunities"],
  ["technical-deep-dive","Technical deep dive","Technical discussion"],
  ["networking","Networking","Professional connection"],
  ["mentoring","Mentoring","Advice and guidance"],
  ["consulting","Consulting","Project or advisory work"],
];

function ProfilePage() {
  const [form,setForm]=useState(EMPTY_PROFILE); const [connection,setConnection]=useState(EMPTY_CONNECTION); const [user,setUser]=useState(null); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [error,setError]=useState("");
  useEffect(()=>{let active=true; async function load(){try{const[data,connectionData]=await Promise.all([getCurrentUser(),getProfileConnection()]);if(!active)return;setUser(data);setForm({...EMPTY_PROFILE,...data,profile_theme:data.profile_theme||"default"});setConnection({...EMPTY_CONNECTION,...connectionData});}catch(e){if(e.response?.status===401){localStorage.removeItem("bragstack_token");window.location.assign("/login");return;}if(active)setError("Your profile could not be loaded.");}finally{if(active)setLoading(false);}}void load();return()=>{active=false}},[]);
  function handleChange(e){const{name,value}=e.target;setForm(c=>({...c,[name]:value}));}
  function handleConnectionChange(e){const{name,value,type,checked}=e.target;setConnection(c=>({...c,[name]:type==="checkbox"?checked:value}));}
  function toggleConversationType(value){setConnection(c=>({...c,open_to_talk_types:c.open_to_talk_types.includes(value)?c.open_to_talk_types.filter(item=>item!==value):[...c.open_to_talk_types,value]}));}
  function selectTheme(id){setForm(c=>({...c,profile_theme:id,profile_primary_color:"",profile_secondary_color:"",profile_background_color:""}));}
  function resetColors(){setForm(c=>({...c,profile_primary_color:"",profile_secondary_color:"",profile_background_color:""}));}
  async function handleSubmit(e){
    e.preventDefault();setSaving(true);setMessage("");setError("");
    try{
      const avatarUrl=form.avatar_url;
      const profileFields={
        name:form.name,headline:form.headline,bio:form.bio,location:form.location,
        github_url:form.github_url,portfolio_url:form.portfolio_url,resume_url:form.resume_url,
        profile_theme:form.profile_theme,profile_primary_color:form.profile_primary_color,
        profile_secondary_color:form.profile_secondary_color,profile_background_color:form.profile_background_color,
      };
      await updateCurrentUserProfile(profileFields);
      await updateProfileConnection(connection);
      await updateProfileAvatar(avatarUrl);
      sessionStorage.setItem("bragstack_settings_notice","Profile, bio, appearance, and Open to Talk settings saved.");
      window.location.assign("/app/settings?saved=profile");
    }catch(err){setError(err.response?.data?.detail||"Your profile could not be saved.");setSaving(false);}
  }
  if(loading)return <BragStackLoader compact message="Loading your profile…" detail="Bringing in your career identity and appearance settings." />;
  const avatarLetter=form.name?.charAt(0).toUpperCase()||"B"; const theme=getProfileTheme(form.profile_theme); const primary=form.profile_primary_color||theme.primary; const secondary=form.profile_secondary_color||theme.secondary; const background=form.profile_background_color||theme.background;
  return <main className="profile-settings">
    <header className="profile-settings-header"><div><p className="profile-settings-eyebrow">Account</p><h1>Edit profile</h1><p>Keep your private career profile current. You choose what gets shared publicly.</p></div>{user?.public_slug&&<a className="profile-public-link" href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer">Preview Proof Profile <ExternalLink size={16}/></a>}</header>
    <form className="profile-settings-card" onSubmit={handleSubmit}>
      <div className="profile-avatar-row"><div className="profile-settings-avatar">{form.avatar_url?<img src={form.avatar_url} alt="Profile preview"/>:(avatarLetter||<UserRound size={26}/>)}</div><div><strong>{form.name||"Your profile"}</strong><span>{form.headline||"Add a headline that explains what you do."}</span></div></div>
      {message&&<div className="profile-save-success">{message}</div>}{error&&<div className="profile-save-error">{error}</div>}
      <div className="profile-form-grid">
        <label>Name<input name="name" value={form.name} onChange={handleChange} placeholder="Your name"/></label><label>Location<input name="location" value={form.location} onChange={handleChange} placeholder="Atlanta, GA"/></label>
        <label className="profile-wide">Professional headline<input name="headline" value={form.headline} onChange={handleChange} placeholder="Platform Support Engineer · Docker · Cloud"/></label>
        <label className="profile-wide">Bio<textarea name="bio" value={form.bio} onChange={handleChange} rows={5} placeholder="A short professional introduction."/></label>
        <label className="profile-wide profile-image-field"><span><ImagePlus size={16}/> Profile image URL</span><input type="url" name="avatar_url" value={form.avatar_url} onChange={handleChange} placeholder="https://.../profile-photo.jpg"/><small>Use a direct HTTPS image URL. Clear this field to return to your initial avatar.</small></label>
        <label>GitHub URL<input type="url" name="github_url" value={form.github_url} onChange={handleChange} placeholder="https://github.com/..."/></label><label>Portfolio URL<input type="url" name="portfolio_url" value={form.portfolio_url} onChange={handleChange} placeholder="https://..."/></label><label className="profile-wide">Resume URL<input type="url" name="resume_url" value={form.resume_url} onChange={handleChange} placeholder="https://..."/></label>
      </div>
      <section className="appearance-section"><div className="appearance-heading"><div><p className="profile-settings-eyebrow"><MessageSquare size={14}/> Connection</p><h2>Open to Talk</h2><p>Turn this on only when you want visitors to have a path to contact or book time with you. BragStack never exposes your private calendar.</p></div></div>
        <div className="profile-form-grid">
          <label className="profile-wide"><span><input type="checkbox" name="open_to_talk" checked={connection.open_to_talk} onChange={handleConnectionChange}/> Show Open to Talk on my Proof Profile</span></label>
          <label className="profile-wide">Contact or booking URL<input type="url" name="open_to_talk_url" value={connection.open_to_talk_url} onChange={handleConnectionChange} placeholder="https://cal.com/you or another contact page"/><small>This is the only destination BragStack exposes when Open to Talk is enabled.</small></label>
          <label className="profile-wide">Short note<textarea name="open_to_talk_note" value={connection.open_to_talk_note} onChange={handleConnectionChange} rows={3} maxLength={240} placeholder="Happy to discuss platform engineering, Docker troubleshooting, or support tooling."/></label>
        </div>
        <div className="theme-gallery conversation-type-gallery">{CONVERSATION_TYPES.map(([value,label,description])=><button type="button" key={value} className={`theme-card ${connection.open_to_talk_types.includes(value)?"selected":""}`} onClick={()=>toggleConversationType(value)} aria-pressed={connection.open_to_talk_types.includes(value)}><span><strong>{label}</strong><small>{connection.open_to_talk_types.includes(value)?"Visible on profile":description}</small></span></button>)}</div>
      </section>
      <section className="appearance-section"><div className="appearance-heading"><div><p className="profile-settings-eyebrow"><Palette size={14}/> Public profile appearance</p><h2>Make your Proof Profile yours</h2><p>Start with a career-inspired theme, then customize the colors if you want.</p></div></div>
        <div className="theme-gallery">{PROFILE_THEMES.map(t=><button type="button" key={t.id} className={`theme-card ${form.profile_theme===t.id?"selected":""}`} onClick={()=>selectTheme(t.id)} aria-pressed={form.profile_theme===t.id}><span className="theme-swatch" style={{background:`linear-gradient(135deg,${t.primary},${t.secondary} 55%,${t.background} 56%)`}}/><span><strong>{t.name}</strong><small>{t.career}</small></span></button>)}</div>
        <div className="appearance-custom"><div className="appearance-subhead"><div><h3>Custom colors</h3><p>Optional — override any theme with your own three-color palette.</p></div><button type="button" className="reset-theme" onClick={resetColors}><RotateCcw size={15}/> Reset</button></div>
          <div className="color-grid">{[["profile_primary_color","Primary",primary],["profile_secondary_color","Secondary",secondary],["profile_background_color","Background",background]].map(([name,label,value])=><label className="color-control" key={name}><span>{label}</span><div><input className="native-color" type="color" name={name} value={value} onChange={handleChange}/><input className="hex-color" name={name} value={form[name]||value} onChange={handleChange} pattern="#[0-9A-Fa-f]{6}" maxLength={7}/></div></label>)}</div>
          <div className="appearance-preview" style={{background}}><span className="preview-badge" style={{color:primary,borderColor:primary}}>PROOF PROFILE</span><h3>{form.name||"Your name"}</h3><p>{form.headline||"Your professional headline"}</p><div className="preview-gradient" style={{background:`linear-gradient(90deg,${primary},${secondary})`}}/><button type="button" style={{background:`linear-gradient(135deg,${primary},${secondary})`}}>View proof</button></div>
        </div>
      </section>
      <div className="profile-settings-actions"><span>Public proof and Open to Talk are controlled separately. Turning off Open to Talk hides its contact data from the public API.</span><button type="submit" disabled={saving}><Save size={17}/> {saving?"Saving…":"Save profile"}</button></div>
    </form>
  </main>;
}
export default ProfilePage;
