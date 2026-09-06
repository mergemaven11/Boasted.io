const HEX = /^#[0-9a-fA-F]{6}$/;
const LAYOUTS = new Set([
  "editorial",
  "executive-sidebar",
  "career-timeline",
  "studio-split",
  "minimal-column",
  "portfolio-grid",
  "case-study",
  "modern-resume",
  "command-center",
  "academic",
  "founder",
  "compact",
]);

function setIfDifferent(element, name, value) {
  if (!value) return;
  if (element.style.getPropertyValue(name) !== value) element.style.setProperty(name, value);
}

export function installProfileAppearancePreview() {
  if (!/^\/brag\/[^/]+/.test(window.location.pathname)) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("appearancePreview") !== "1") return;

  const layout = params.get("layout");
  const primary = params.get("primary");
  const secondary = params.get("secondary");
  const background = params.get("background");

  function apply() {
    const root = document.querySelector(".proof-portfolio");
    if (!root) return;

    if (LAYOUTS.has(layout) && root.dataset.layout !== layout) root.dataset.layout = layout;
    if (HEX.test(primary || "")) setIfDifferent(root, "--theme-accent", primary);
    if (HEX.test(secondary || "")) setIfDifferent(root, "--theme-accent-2", secondary);
    if (HEX.test(background || "")) setIfDifferent(root, "--theme-bg", background);

    const topbar = root.querySelector(".portfolio-topbar");
    if (topbar && !topbar.querySelector(".appearance-preview-back")) {
      const link = document.createElement("a");
      link.className = "appearance-preview-back";
      link.href = "/app/settings/appearance";
      link.setAttribute("aria-label", "Back to profile appearance settings");
      link.innerHTML = '<span aria-hidden="true">←</span><span>Back to appearance</span>';
      topbar.prepend(link);
    }

    if (!root.querySelector(".appearance-preview-mode")) {
      const badge = document.createElement("div");
      badge.className = "appearance-preview-mode";
      badge.textContent = "Preview mode · changes are not saved yet";
      root.prepend(badge);
    }
  }

  apply();
  const observer = new MutationObserver(() => window.requestAnimationFrame(apply));
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-layout", "style"],
  });
}
