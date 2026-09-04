function apiBase() {
  if (window.location.hostname.endsWith(".app.github.dev")) return "/api";
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";
}

function applyAvatar(avatarUrl) {
  const host = document.querySelector(".proof-portfolio .portfolio-avatar");
  if (!host || !avatarUrl) return false;

  const image = document.createElement("img");
  image.src = avatarUrl;
  image.alt = "Profile photo";
  image.decoding = "async";
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
    });
    if (!response.ok) return;
    const data = await response.json();
    const avatarUrl = String(data?.avatar_url || "").trim();
    if (!avatarUrl || applyAvatar(avatarUrl)) return;

    const observer = new MutationObserver(() => {
      if (applyAvatar(avatarUrl)) observer.disconnect();
    });
    observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  } catch {
    // Keep the initial-letter fallback if the public avatar cannot be loaded.
  }
}
