import { useEffect, useState } from "react";
import { ExternalLink, ImagePlus, Save, UserRound } from "lucide-react";

import { getCurrentUser, updateCurrentUserProfile } from "./api";
import { updateProfileAvatar } from "./profileApi";
import "./ProfilePage.css";

const EMPTY_PROFILE = {
  name: "",
  headline: "",
  bio: "",
  location: "",
  avatar_url: "",
  github_url: "",
  portfolio_url: "",
  resume_url: "",
};

function ProfilePage() {
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const data = await getCurrentUser();
        if (!active) return;
        setUser(data);
        setForm({
          name: data.name ?? "",
          headline: data.headline ?? "",
          bio: data.bio ?? "",
          location: data.location ?? "",
          avatar_url: data.avatar_url ?? "",
          github_url: data.github_url ?? "",
          portfolio_url: data.portfolio_url ?? "",
          resume_url: data.resume_url ?? "",
        });
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("bragstack_token");
          window.location.assign("/login");
          return;
        }
        if (active) setError("Your profile could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const { avatar_url: avatarUrl, ...profileFields } = form;
      await updateCurrentUserProfile(profileFields);
      const updated = await updateProfileAvatar(avatarUrl);
      setUser(updated);
      setMessage("Profile saved.");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="profile-settings"><div className="profile-loading">Loading profile…</div></main>;

  const avatarLetter = form.name?.charAt(0).toUpperCase() || "B";

  return (
    <main className="profile-settings">
      <header className="profile-settings-header">
        <div>
          <p className="profile-settings-eyebrow">Account</p>
          <h1>Edit profile</h1>
          <p>Keep your private career profile current. You choose what gets shared publicly.</p>
        </div>
        {user?.public_slug && (
          <a className="profile-public-link" href={`/brag/${user.public_slug}`} target="_blank" rel="noreferrer">
            View public profile <ExternalLink size={16} />
          </a>
        )}
      </header>

      <form className="profile-settings-card" onSubmit={handleSubmit}>
        <div className="profile-avatar-row">
          <div className="profile-settings-avatar">
            {form.avatar_url ? <img src={form.avatar_url} alt="Profile preview" /> : (avatarLetter || <UserRound size={26} />)}
          </div>
          <div>
            <strong>{form.name || "Your profile"}</strong>
            <span>{form.headline || "Add a headline that explains what you do."}</span>
          </div>
        </div>

        {message && <div className="profile-save-success">{message}</div>}
        {error && <div className="profile-save-error">{error}</div>}

        <div className="profile-form-grid">
          <label>Name<input name="name" value={form.name} onChange={handleChange} placeholder="Your name" /></label>
          <label>Location<input name="location" value={form.location} onChange={handleChange} placeholder="Atlanta, GA" /></label>
          <label className="profile-wide">Professional headline<input name="headline" value={form.headline} onChange={handleChange} placeholder="Platform Support Engineer · Docker · Cloud" /></label>
          <label className="profile-wide">Bio<textarea name="bio" value={form.bio} onChange={handleChange} rows={5} placeholder="A short professional introduction." /></label>

          <label className="profile-wide profile-image-field">
            <span><ImagePlus size={16} /> Profile image URL</span>
            <input type="url" name="avatar_url" value={form.avatar_url} onChange={handleChange} placeholder="https://.../profile-photo.jpg" />
            <small>Use a direct HTTPS image URL. Clear this field to return to your initial avatar.</small>
          </label>

          <label>GitHub URL<input type="url" name="github_url" value={form.github_url} onChange={handleChange} placeholder="https://github.com/..." /></label>
          <label>Portfolio URL<input type="url" name="portfolio_url" value={form.portfolio_url} onChange={handleChange} placeholder="https://..." /></label>
          <label className="profile-wide">Resume URL<input type="url" name="resume_url" value={form.resume_url} onChange={handleChange} placeholder="https://..." /></label>
        </div>

        <div className="profile-settings-actions">
          <span>Profile details remain private unless you explicitly share public proof.</span>
          <button type="submit" disabled={saving}><Save size={17} /> {saving ? "Saving…" : "Save profile"}</button>
        </div>
      </form>
    </main>
  );
}

export default ProfilePage;
