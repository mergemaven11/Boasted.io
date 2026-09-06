import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, updateCurrentUserProfile } from "./api";
import { PROFILE_LAYOUTS, PROFILE_THEMES as THEME_OBJECTS } from "./profileThemes";

const PROFILE_THEMES = THEME_OBJECTS.map((theme) => [theme.id, theme.name]);
const THEME_COLORS = Object.fromEntries(THEME_OBJECTS.map((theme) => [theme.id, [theme.primary, theme.secondary, theme.background]]));

function getProfileThemeStyle(profile) {
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
      if (user.public_slug === publicSlug) {
        setOwner(user);
        setForm({ ...user });
      }
    }).catch(() => {});
  }, [publicSlug]);

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
        profile_theme: form.profile_theme, profile_layout: form.profile_layout || "editorial", profile_primary_color: form.profile_primary_color,
        profile_secondary_color: form.profile_secondary_color, profile_background_color: form.profile_background_color,
      });
      setOwner(updated); setForm({ ...updated }); onSaved?.(updated); setOpen(false);
    } finally { setSaving(false); }
  }

  return <div className="theme-owner-tools">
    <button type="button" className="proof-action primary" onClick={() => setOpen(!open)}>🎨 Customize profile</button>
    {open && <div className="theme-customizer" style={previewStyle}>
      <div className="theme-customizer-heading"><div><strong>Make this Proof Profile yours</strong><p>Choose a career-inspired theme, then customize all three colors.</p></div></div>
      <div className="profile-layout-heading"><strong>Choose a profile structure</strong><p>Structure controls the composition. Colors are selected separately below.</p></div>
      <div className="profile-layout-gallery">
        {PROFILE_LAYOUTS.map((layout) => <button type="button" key={layout.id} className={form.profile_layout===layout.id||(!form.profile_layout&&layout.id==="editorial")?"selected":""} onClick={() => setValue("profile_layout",layout.id)}><span className={`layout-thumbnail layout-thumbnail-${layout.id}`} aria-hidden="true"><i/><i/><i/></span><strong>{layout.name}</strong><small>{layout.description}</small></button>)}
      </div>
      <div className="profile-layout-heading"><strong>Choose a color palette</strong><p>Start with a curated palette, then fine-tune all three colors.</p></div>
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

