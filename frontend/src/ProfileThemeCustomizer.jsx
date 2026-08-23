import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, updateCurrentUserProfile } from "./api";

export const PROFILE_THEMES = [
  ["default", "BragStack Default"], ["clinical", "Clinical"], ["educator", "Educator"],
  ["engineer", "Engineer"], ["designer", "Designer"], ["executive", "Executive"],
  ["trades", "Trades"], ["creator", "Creator"], ["hospitality", "Hospitality"],
  ["finance", "Finance"], ["legal", "Legal"], ["public-service", "Public Service"],
];

const THEME_COLORS = {
  default:["#7dd3fc","#c4b5fd","#050816"], clinical:["#5eead4","#67e8f9","#06151a"],
  educator:["#fbbf24","#fb7185","#181006"], engineer:["#60a5fa","#94a3b8","#07111f"],
  designer:["#f472b6","#c084fc","#17091a"], executive:["#d4af37","#e2e8f0","#090b10"],
  trades:["#fb923c","#facc15","#171008"], creator:["#a78bfa","#22d3ee","#10091c"],
  hospitality:["#fb7185","#fda4af","#190b10"], finance:["#34d399","#93c5fd","#07150f"],
  legal:["#c4b5fd","#e5e7eb","#0d0b16"], "public-service":["#38bdf8","#f8fafc","#07121b"],
};

export function getProfileThemeStyle(profile) {
  const defaults = THEME_COLORS[profile?.profile_theme] || THEME_COLORS.default;
  return {
    "--theme-accent": profile?.profile_primary_color || defaults[0],
    "--theme-accent-2": profile?.profile_secondary_color || defaults[1],
    "--theme-bg": profile?.profile_background_color || defaults[2],
  };
}

export default function ProfileThemeCustomizer({ publicSlug, profile, onSaved }) {
  const [owner, setOwner] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("bragstack_token")) return;
    getCurrentUser().then((user) => {
      if (user.public_slug === publicSlug) setOwner(user);
    }).catch(() => {});
  }, [publicSlug]);

  useEffect(() => {
    if (!owner) return;
    setForm({ ...owner });
  }, [owner]);

  const previewStyle = useMemo(() => getProfileThemeStyle(form || profile), [form, profile]);
  if (!owner || !form) return null;

  function setValue(name, value) { setForm((current) => ({ ...current, [name]: value })); }
  function chooseTheme(theme) {
    const colors = THEME_COLORS[theme] || THEME_COLORS.default;
    setForm((current) => ({ ...current, profile_theme: theme, profile_primary_color: colors[0], profile_secondary_color: colors[1], profile_background_color: colors[2] }));
  }
  function resetColors() {
    const colors = THEME_COLORS[form.profile_theme] || THEME_COLORS.default;
    setForm((current) => ({ ...current, profile_primary_color: colors[0], profile_secondary_color: colors[1], profile_background_color: colors[2] }));
  }
  async function save() {
    setSaving(true);
    try {
      const updated = await updateCurrentUserProfile({
        name: form.name, headline: form.headline || "", bio: form.bio || "", location: form.location || "",
        github_url: form.github_url || "", portfolio_url: form.portfolio_url || "", resume_url: form.resume_url || "",
        profile_theme: form.profile_theme, profile_primary_color: form.profile_primary_color,
        profile_secondary_color: form.profile_secondary_color, profile_background_color: form.profile_background_color,
      });
      setOwner(updated); onSaved?.(updated); setOpen(false);
    } finally { setSaving(false); }
  }

  return <div className="theme-owner-tools">
    <button type="button" className="proof-action primary" onClick={() => setOpen(!open)}>🎨 Customize profile</button>
    {open && <div className="theme-customizer" style={previewStyle}>
      <div className="theme-customizer-heading"><div><strong>Make this Proof Profile yours</strong><p>Choose a career-inspired theme, then customize all three colors.</p></div></div>
      <div className="theme-gallery">
        {PROFILE_THEMES.map(([id,label]) => <button type="button" key={id} className={form.profile_theme===id?"selected":""} onClick={() => chooseTheme(id)}>{label}</button>)}
      </div>
      <div className="theme-color-grid">
        {[["profile_primary_color","Primary"],["profile_secondary_color","Secondary"],["profile_background_color","Background"]].map(([name,label]) => <label key={name}>{label}<span><input type="color" value={form[name]} onChange={(e)=>setValue(name,e.target.value)} /><input type="text" value={form[name]} pattern="#[0-9a-fA-F]{6}" onChange={(e)=>setValue(name,e.target.value)} /></span></label>)}
      </div>
      <div className="theme-preview" style={previewStyle}><span>Live preview</span><strong>{form.name || "Your name"}</strong><p>{form.headline || "Your career story, in your colors."}</p></div>
      <div className="theme-actions"><button type="button" className="proof-action" onClick={resetColors}>Reset theme colors</button><button type="button" className="proof-action primary" disabled={saving} onClick={save}>{saving?"Saving…":"Save appearance"}</button></div>
    </div>}
  </div>;
}
