function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function applyAvatar(avatarUrl) {
  const host = document.querySelector(".proof-portfolio .portfolio-avatar");
  if (!host || !avatarUrl) return false;

  const existing = host.querySelector("img[data-bragstack-profile-avatar]");
  if (existing?.dataset.source === avatarUrl) return true;

  const image = document.createElement("img");
  image.src = avatarUrl;
  image.alt = "Profile photo";
  image.decoding = "async";
  image.dataset.bragstackProfileAvatar = "true";
  image.dataset.source = avatarUrl;
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = "cover";
  image.style.borderRadius = "inherit";
  image.style.display = "block";
  host.replaceChildren(image);
  host.dataset.hasPhoto = "true";
  host.style.overflow = "hidden";
  return true;
}

export async function installPublicPortfolioAvatar() {
  const match = window.location.pathname.match(/^\/brag\/([^/]+)\/?$/);
  if (!match) return;

  const slug = decodeURIComponent(match[1]);
  try {
    const response = await fetch(`${apiBase()}/public/brag/${encodeURIComponent(slug)}/avatar`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return;
    const data = await response.json();
    const avatarUrl = String(data?.avatar_url || "").trim();
    if (!avatarUrl) return;

    // React first renders the letter avatar, then re-renders when public profile
    // data arrives. A one-time DOM replacement gets overwritten by that second
    // render, which made saved photos appear briefly and then disappear. Keep a
    // short-lived observer active long enough to restore the persisted photo
    // after any profile-data re-render.
    applyAvatar(avatarUrl);
    const root = document.getElementById("root") || document.body;
    const observer = new MutationObserver(() => {
      applyAvatar(avatarUrl);
    });
    observer.observe(root, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 60000);
  } catch {
    // Keep the initial-letter fallback if the public avatar cannot be loaded.
  }
}
