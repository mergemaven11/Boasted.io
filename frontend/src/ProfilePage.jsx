import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, ExternalLink, FolderKanban, ImagePlus, MessageSquare, Plus, Save, Trash2, UserRound } from "lucide-react";
import BragStackLoader from "./BragStackLoader.jsx";
import { getCurrentUser, updateCurrentUserProfile } from "./api";
import { getProfileConnection, updateProfileConnection } from "./profileConnectionApi";
import { updateProfileAvatar } from "./profileApi";
import "./ProfilePage.css";

const EMPTY_PROFILE = { name:"",headline:"",bio:"",location:"",avatar_url:"",github_url:"",portfolio_url:"",resume_url:"",work_history:[],profile_projects:[] };
const NEW_ROLE = () => ({role:"",company:"",location:"",start_date:"",end_date:"",summary:""});
const NEW_PROJECT = () => ({name:"",role:"",url:"",summary:"",skills:[]});
const EMPTY_CONNECTION = { open_to_talk:false,open_to_talk_note:"",open_to_talk_types:[] };
const CONVERSATION_TYPES = [
  ["general-chat","General chat","Open conversation"],
  ["virtual-coffee","Virtual coffee","Casual introduction"],
  ["recruiter-chat","Recruiter chat","Career opportunities"],
  ["technical-deep-dive","Technical deep dive","Technical discussion"],
  ["networking","Networking","Professional connection"],
  ["mentoring","Mentoring","Advice and guidance"],
  ["consulting","Consulting","Project or advisory work"],
];

function fileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("Choose an image file."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("Choose an image smaller than 10 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("That image could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("That image could not be opened."));
      image.onload = () => {
        const size = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = Math.max(0, (image.naturalWidth - size) / 2);
        const sourceY = Math.max(0, (image.naturalHeight - size) / 2);
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d");
        context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 512, 512);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePage() {
  const [form,setForm]=useState(EMPTY_PROFILE);
  const [connection,setConnection]=useState(EMPTY_CONNECTION);
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [photoBusy,setPhotoBusy]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{let active=true; async function load(){try{const[data,connectionData]=await Promise.all([getCurrentUser(),getProfileConnection()]);if(!active)return;setUser(data);setForm({...EMPTY_PROFILE,...data});setConnection({...EMPTY_CONNECTION,...connectionData});}catch(e){if(e.response?.status===401){localStorage.removeItem("bragstack_token");window.location.assign("/login");return;}if(active)setError("Your profile could not be loaded.");}finally{if(active)setLoading(false);}}void load();return()=>{active=false}},[]);

  function handleChange(e){const{name,value}=e.target;setForm(c=>({...c,[name]:value}));}
  function handleConnectionChange(e){const{name,type,checked}=e.target;setConnection(c=>({...c,[name]:type==="checkbox"?checked:e.target.value}));}
  function updateList(listName,index,field,value){setForm(current=>({...current,[listName]:current[listName].map((item,itemIndex)=>itemIndex===index?{...item,[field]:value}:item)}));}
  function addListItem(listName,item){setForm(current=>({...current,[listName]:[...current[listName],item]}));}
  function removeListItem(listName,index){setForm(current=>({...current,[listName]:current[listName].filter((_,itemIndex)=>itemIndex!==index)}));}
  function toggleConversationType(value){setConnection(c=>({...c,open_to_talk_types:c.open_to_talk_types.includes(value)?c.open_to_talk_types.filter(item=>item!==value):[...c.open_to_talk_types,value]}));}

  async function handlePhotoFile(event){
    const file=event.target.files?.[0];
    if(!file)return;
    setPhotoBusy(true);setError("");
    try{const avatarUrl=await fileToAvatarDataUrl(file);setForm(c=>({...c,avatar_url:avatarUrl}));}
    catch(err){setError(err.message||"That profile photo could not be prepared.");}
    finally{setPhotoBusy(false);event.target.value="";}
  }

  function removePhoto(){setForm(c=>({...c,avatar_url:""}));}

  async function handleSubmit(e){
    e.preventDefault();setSaving(true);setError("");
    try{
      const profileFields={
        name:form.name,headline:form.headline,bio:form.bio,location:form.location,
        github_url:form.github_url,portfolio_url:form.portfolio_url,resume_url:form.resume_url,
        work_history:form.work_history.filter(item=>item.role.trim()),
        profile_projects:form.profile_projects.filter(item=>item.name.trim()).map(item=>({...item,skills:Array.isArray(item.skills)?item.skills:String(item.skills||"").split(",").map(skill=>skill.trim()).filter(Boolean)})),
      };
      const savedProfile=await updateCurrentUserProfile(profileFields);
      const savedConnection=await updateProfileConnection({
        open_to_talk:connection.open_to_talk,
        open_to_talk_note:connection.open_to_talk_note,
        open_to_talk_types:connection.open_to_talk_types,
      });
      const savedAvatar=await updateProfileAvatar(form.avatar_url);
      setForm(c=>({...c,...savedProfile,avatar_url:savedAvatar.avatar_url??c.avatar_url}));
      setConnection(c=>({...c,...savedConnection}));
      sessionStorage.setItem("bragstack_settings_notice","Profile, bio, photo, and Open to Talk settings saved.");
      window.location.assign("/app/settings?saved=profile");
    }catch(err){setError(err.response?.data?.detail||"Your profile could not be saved.");setSaving(false);}
  }

  if(loading)return <BragStackLoader compact message="Loading your profile…" detail="Bringing in your saved career identity and connection settings." />;
  const avatarLetter=form.name?.charAt(0).toUpperCase()||"B";

  return <main className="profile-settings">
    <header className="profile-settings-header"><div><a className="profile-public-link" href="/app/settings"><ArrowLeft size={16}/> Back to settings</a><p className="profile-settings-eyebrow">Account</p><h1>Edit profile</h1><p>Everything you save here persists on your BragStack account. Public colors and themes are managed separately under Profile appearance.</p></div><div className="profile-header-actions"><a className="profile-public-link" href="/app/settings/appearance">Profile appearance</a>{user?.public_slug&&<a className="profile-public-link" href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer">Preview Proof Profile <ExternalLink size={16}/></a>}</div></header>
    <form className="profile-settings-card" onSubmit={handleSubmit}>
      <div className="profile-avatar-row">
        <div className="profile-settings-avatar">{form.avatar_url?<img src={form.avatar_url} alt="Profile preview"/>:(avatarLetter||<UserRound size={26}/>)}</div>
        <div className="profile-avatar-copy"><strong>{form.name||"Your profile"}</strong><span>{form.headline||"Add a headline that explains what you do."}</span><div className="profile-avatar-actions"><label className="profile-photo-upload"><ImagePlus size={15}/>{photoBusy?"Preparing…":"Upload photo"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoFile} disabled={photoBusy}/></label>{form.avatar_url&&<button type="button" className="profile-photo-remove" onClick={removePhoto}><Trash2 size={14}/> Remove</button>}</div><small>JPG, PNG, or WebP. BragStack crops and compresses the photo before saving it.</small></div>
      </div>
      {error&&<div className="profile-save-error">{error}</div>}
      <div className="profile-form-grid">
        <label>Name<input name="name" value={form.name} onChange={handleChange} placeholder="Your name"/></label>
        <label>Location<input name="location" value={form.location} onChange={handleChange} placeholder="Atlanta, GA"/></label>
        <label className="profile-wide">Professional headline<input name="headline" value={form.headline} onChange={handleChange} placeholder="Platform Support Engineer · Docker · Cloud"/></label>
        <label className="profile-wide">Bio<textarea name="bio" value={form.bio} onChange={handleChange} rows={5} placeholder="A short professional introduction."/></label>
        <label>GitHub URL<input type="url" name="github_url" value={form.github_url} onChange={handleChange} placeholder="https://github.com/..."/></label>
        <label>Portfolio URL<input type="url" name="portfolio_url" value={form.portfolio_url} onChange={handleChange} placeholder="https://..."/></label>
        <label className="profile-wide profile-resume-field"><span>Resume URL</span><small className="profile-share-note">Before saving: make sure this résumé link is viewable by anyone with the link. Private Google Docs/Drive links can show visitors a permission error.</small><input type="url" name="resume_url" value={form.resume_url} onChange={handleChange} placeholder="https://..."/></label>
      </div>

      <section className="profile-career-editor">
        <div className="appearance-heading"><div><p className="profile-settings-eyebrow"><BriefcaseBusiness size={14}/> Career story</p><h2>Work history</h2><p>Add the roles that give context to your accomplishments. Only completed entries are shown publicly.</p></div><button type="button" className="profile-add-button" onClick={()=>addListItem("work_history",NEW_ROLE())}><Plus size={15}/> Add position</button></div>
        {form.work_history.length===0?<div className="profile-editor-empty">No positions added yet.</div>:<div className="profile-repeat-list">{form.work_history.map((item,index)=><article className="profile-repeat-card" key={`role-${index}`}><div className="profile-repeat-head"><strong>Position {index+1}</strong><button type="button" onClick={()=>removeListItem("work_history",index)} aria-label={`Remove position ${index+1}`}><Trash2 size={14}/></button></div><div className="profile-form-grid"><label>Role<input value={item.role} onChange={e=>updateList("work_history",index,"role",e.target.value)} placeholder="Platform Support Engineer"/></label><label>Company<input value={item.company} onChange={e=>updateList("work_history",index,"company",e.target.value)} placeholder="Company name"/></label><label>Start<input value={item.start_date} onChange={e=>updateList("work_history",index,"start_date",e.target.value)} placeholder="May 2024"/></label><label>End<input value={item.end_date} onChange={e=>updateList("work_history",index,"end_date",e.target.value)} placeholder="Present"/></label><label className="profile-wide">Location<input value={item.location} onChange={e=>updateList("work_history",index,"location",e.target.value)} placeholder="Remote or Atlanta, GA"/></label><label className="profile-wide">Role summary<textarea value={item.summary} onChange={e=>updateList("work_history",index,"summary",e.target.value)} rows={4} placeholder="Scope, responsibilities, and the kind of problems you owned."/></label></div></article>)}</div>}
      </section>

      <section className="profile-career-editor">
        <div className="appearance-heading"><div><p className="profile-settings-eyebrow"><FolderKanban size={14}/> Selected work</p><h2>Projects</h2><p>Add projects that deserve their own context alongside your searchable proof.</p></div><button type="button" className="profile-add-button" onClick={()=>addListItem("profile_projects",NEW_PROJECT())}><Plus size={15}/> Add project</button></div>
        {form.profile_projects.length===0?<div className="profile-editor-empty">No projects added yet.</div>:<div className="profile-repeat-list">{form.profile_projects.map((item,index)=><article className="profile-repeat-card" key={`project-${index}`}><div className="profile-repeat-head"><strong>Project {index+1}</strong><button type="button" onClick={()=>removeListItem("profile_projects",index)} aria-label={`Remove project ${index+1}`}><Trash2 size={14}/></button></div><div className="profile-form-grid"><label>Project name<input value={item.name} onChange={e=>updateList("profile_projects",index,"name",e.target.value)} placeholder="BragStack"/></label><label>Your role<input value={item.role} onChange={e=>updateList("profile_projects",index,"role",e.target.value)} placeholder="Founder · Engineer"/></label><label className="profile-wide">Project URL<input type="url" value={item.url} onChange={e=>updateList("profile_projects",index,"url",e.target.value)} placeholder="https://..."/></label><label className="profile-wide">Summary<textarea value={item.summary} onChange={e=>updateList("profile_projects",index,"summary",e.target.value)} rows={4} placeholder="What you built, why it mattered, and your contribution."/></label><label className="profile-wide">Skills<input value={Array.isArray(item.skills)?item.skills.join(", "):item.skills} onChange={e=>updateList("profile_projects",index,"skills",e.target.value)} placeholder="React, FastAPI, Docker"/></label></div></article>)}</div>}
      </section>

      <section className="appearance-section"><div className="appearance-heading"><div><p className="profile-settings-eyebrow"><MessageSquare size={14}/> Connection</p><h2>Open to Talk</h2><p>Choose the kinds of conversations you welcome. Calendly scheduling is configured once under <strong>Settings → Integrations</strong>.</p></div></div>
        <div className="profile-form-grid">
          <label className="profile-wide"><span><input type="checkbox" name="open_to_talk" checked={connection.open_to_talk} onChange={handleConnectionChange}/> Show Open to Talk on my Proof Profile</span></label>
          <label className="profile-wide">Short note<textarea name="open_to_talk_note" value={connection.open_to_talk_note} onChange={handleConnectionChange} rows={3} maxLength={240} placeholder="Happy to discuss BragStack, platform engineering, virtual coffee, or mentoring."/></label>
        </div>
        <div className="theme-gallery conversation-type-gallery">{CONVERSATION_TYPES.map(([value,label,description])=><button type="button" key={value} className={`theme-card ${connection.open_to_talk_types.includes(value)?"selected":""}`} onClick={()=>toggleConversationType(value)} aria-pressed={connection.open_to_talk_types.includes(value)}><span><strong>{label}</strong><small>{connection.open_to_talk_types.includes(value)?"Visible on profile":description}</small></span></button>)}</div>
      </section>

      <div className="profile-settings-actions"><span>Appearance is saved separately so profile edits can never overwrite your theme.</span><button type="submit" disabled={saving||photoBusy}><Save size={17}/> {saving?"Saving…":"Save profile"}</button></div>
    </form>
  </main>;
}
export default ProfilePage;
