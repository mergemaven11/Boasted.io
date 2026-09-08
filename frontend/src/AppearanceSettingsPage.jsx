import { ArrowLeft, Check, Eye, Palette, RotateCcw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser, updateCurrentUserProfile } from "./api";
import BragStackLoader from "./BragStackLoader.jsx";
import {
  getContrastText,
  getProfileLayout,
  getProfileTheme,
  PROFILE_LAYOUTS,
  PROFILE_THEMES,
} from "./profileThemes";
import "./ProfilePage.css";
import "./FlowerLayoutPreviews.css";

const EMPTY_APPEARANCE = {
  profile_theme: "default",
  profile_layout: "editorial",
  profile_primary_color: "",
  profile_secondary_color: "",
  profile_background_color: "",
};

const SAVE_TIMEOUT_MS = 12000;

function withTimeout(promise, timeoutMs = SAVE_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error("Saving took too long. Please try again."));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function FlowerLayoutMini({ id }) {
  return (
    <span className={`flower-layout-mini flower-layout-mini-${id}`} aria-hidden="true">
      <i className="mini-hero" />
      <i className="mini-side" />
      <i className="mini-main" />
      <i className="mini-card mini-card-one" />
      <i className="mini-card mini-card-two" />
      <i className="mini-card mini-card-three" />
    </span>
  );
}

export default function AppearanceSettingsPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((u) => {
        if (!active) return;
        setUser(u);
        setForm({
          profile_theme: u.profile_theme || "default",
          profile_layout:u.profile_layout||"editorial",
          profile_primary_color: u.profile_primary_color || "",
          profile_secondary_color: u.profile_secondary_color || "",
          profile_background_color: u.profile_background_color || "",
        });
      })
      .catch(() => {
        if (active) setError("Appearance settings could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, []);

  if (!form && !error) {
    return (
      <BragStackLoader
        compact
        message="Loading your appearance…"
        detail="Preparing your flower templates, themes, colors, and public profile preview."
      />
    );
  }

  if (!form) {
    return (
      <main className="profile-settings appearance-settings-page">
        <div className="profile-loading" role="alert">{error}</div>
      </main>
    );
  }

  const theme = getProfileTheme(form.profile_theme);
  const layout = getProfileLayout(form.profile_layout);
  const primary = form.profile_primary_color || theme.primary;
  const secondary = form.profile_secondary_color || theme.secondary;
  const background = form.profile_background_color || theme.background;
  const previewText = getContrastText(background);
  const previewButtonText = getContrastText(primary);
  const previewQuery = new URLSearchParams({
    appearancePreview: "1",
    layout: form.profile_layout,
    theme: form.profile_theme,
    primary,
    secondary,
    background,
  }).toString();
  const previewHref = user?.public_slug ? `/brag/${user.public_slug}?${previewQuery}` : "";

  function chooseTheme(id) {
    setForm((current) => ({
      ...current,
      profile_theme: id,
      profile_primary_color: "",
      profile_secondary_color: "",
      profile_background_color: "",
    }));
  }

  function chooseLayout(id) {
    setForm((current) => ({ ...current, profile_layout:id }));
  }

  function change(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function reset() {
    setForm((current) => ({
      ...current,
      profile_primary_color: "",
      profile_secondary_color: "",
      profile_background_color: "",
    }));
  }

  async function save() {
    setSaving(true);
    setError("");
    let navigating = false;
    try {
      const saved = await withTimeout(updateCurrentUserProfile({ ...EMPTY_APPEARANCE, ...form }));
      if (saved.profile_theme !== form.profile_theme) {
        throw new Error("Saved theme did not match the selected theme.");
      }
      if ((saved.profile_layout || "editorial") !== form.profile_layout) {
        throw new Error("Saved layout did not match the selected profile structure.");
      }
      setUser(saved);
      sessionStorage.setItem("bragstack_settings_notice", "Profile appearance saved.");
      navigating = true;
      window.location.assign("/app/settings?saved=appearance");
    } catch (saveError) {
      const detail = saveError.response?.data?.detail;
      setError(typeof detail === "string" ? detail : saveError.message || "Appearance could not be saved.");
    } finally {
      if (!navigating) setSaving(false);
    }
  }

  return (
    <main className="profile-settings appearance-settings-page">
      <header className="profile-settings-header appearance-settings-header">
        <div>
          <a className="profile-public-link" href="/app/settings">
            <ArrowLeft size={16} /> Back to settings
          </a>
          <p className="profile-settings-eyebrow"><Palette size={14} /> Settings</p>
          <h1>Public profile appearance</h1>
          <p>Choose a flower layout, then apply a color palette. Layout and color stay independent so you can mix any template with any theme.</p>
        </div>
        {previewHref && (
          <a className="appearance-preview-link" href={previewHref}>
            <Eye size={17} /> Preview Public Proof Profile
          </a>
        )}
      </header>

      <section className="profile-settings-card appearance-section standalone">
        {error && <div className="profile-save-error" role="alert">{error}</div>}

        <div className="appearance-heading appearance-audit-heading">
          <p className="appearance-step">01 · Choose a layout</p>
          <h2>Flower profile templates</h2>
          <p>These are full-page layout previews, not decorative icons. Pick the structure that best fits how you want your work to be scanned.</p>
        </div>

        <div className="theme-gallery flower-layout-gallery" data-profile-layout-gallery>
          {PROFILE_LAYOUTS.map((item) => {
            const selected = form.profile_layout === item.id;
            return (
              <button
                type="button"
                key={item.id}
                className={`theme-card flower-layout-card ${selected ? "selected" : ""}`}
                onClick={() => chooseLayout(item.id)}
                aria-pressed={selected}
                aria-label={`${item.name}. ${item.description}${selected ? ". Selected" : ""}`}
                style={{
                  "--preview-primary": primary,
                  "--preview-secondary": secondary,
                  "--preview-background": background,
                }}
              >
                <FlowerLayoutMini id={item.id} />
                <span className="flower-layout-card-copy">
                  <span className="flower-layout-title-row">
                    <strong>{item.name}</strong>
                    {selected && (
                      <span className="flower-layout-selected" aria-hidden="true">
                        <Check size={13} /> Selected
                      </span>
                    )}
                  </span>
                  <small>{item.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="appearance-heading appearance-audit-heading appearance-audit-section">
          <p className="appearance-step">02 · Choose colors</p>
          <h2>Career-inspired color palettes</h2>
          <p>Pick a starting palette, then fine-tune the three colors below.</p>
        </div>

        <div className="theme-gallery appearance-theme-gallery">
          {PROFILE_THEMES.map((item) => {
            const selected = form.profile_theme === item.id;
            return (
              <button
                type="button"
                key={item.id}
                className={`theme-card ${selected ? "selected" : ""}`}
                onClick={() => chooseTheme(item.id)}
                aria-pressed={selected}
              >
                <span
                  className="theme-swatch"
                  style={{ background: `linear-gradient(135deg,${item.primary},${item.secondary} 55%,${item.background} 56%)` }}
                  aria-hidden="true"
                />
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.career}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="appearance-custom">
          <div className="appearance-subhead">
            <div>
              <p className="appearance-step">03 · Fine-tune & preview</p>
              <h3>Your colors</h3>
              <p>Primary, secondary, and background. The preview updates immediately.</p>
            </div>
            <button className="reset-theme" type="button" onClick={reset}>
              <RotateCcw size={15} /> Reset colors
            </button>
          </div>

          <div className="color-grid">
            {[
              ["profile_primary_color", "Primary", primary],
              ["profile_secondary_color", "Secondary", secondary],
              ["profile_background_color", "Background", background],
            ].map(([name, label, value]) => (
              <label className="color-control" key={name}>
                <span>{label}</span>
                <div>
                  <input className="native-color" type="color" name={name} value={value} onChange={change} />
                  <input
                    className="hex-color"
                    name={name}
                    value={form[name] || value}
                    onChange={change}
                    pattern="#[0-9A-Fa-f]{6}"
                    maxLength={7}
                    aria-label={`${label} hex color`}
                  />
                </div>
              </label>
            ))}
          </div>

          <div className="appearance-preview" style={{ background, color: previewText }}>
            <span className="preview-badge" style={{ color: previewText, borderColor: primary }}>
              {layout.name.toUpperCase()} · LIVE PREVIEW
            </span>
            <h3>{user?.name || "Your name"}</h3>
            <p style={{ color: previewText, opacity: 0.78 }}>{user?.headline || "Your professional headline"}</p>
            <div className="preview-gradient" style={{ background: `linear-gradient(90deg,${primary},${secondary})` }} />
            <a
              className="appearance-open-preview"
              href={previewHref || "#"}
              style={{
                background: `linear-gradient(135deg,${primary},${secondary})`,
                color: previewButtonText,
              }}
            >
              <Eye size={16} /> Preview Public Proof Profile
            </a>
          </div>
        </div>

        <div className="profile-settings-actions appearance-save-actions">
          <span>Nothing changes publicly until you save.</span>
          <button type="button" disabled={saving} onClick={save}>
            <Save size={17} /> {saving ? "Saving…" : "Save appearance"}
          </button>
        </div>
      </section>
    </main>
  );
}
