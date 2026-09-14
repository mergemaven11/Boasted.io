(() => {
  const patchEducationNav = () => {
    const actions = document.querySelector(".landing-nav-actions");
    if (!actions || actions.querySelector('a[href="/education"].landing-education-mobile-link')) return;

    const education = document.createElement("a");
    education.href = "/education";
    education.className = "landing-login-link landing-education-mobile-link";
    education.textContent = "Education";

    const login = actions.querySelector('a[href="/login"]');
    actions.insertBefore(education, login || actions.firstChild);
  };

  patchEducationNav();
  const observer = new MutationObserver(patchEducationNav);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
