import "./SearchSitelinksNav.css";

const LINKS = [
  ["Resume Builder", "/resume-accomplishments", "Build evidence-backed resume material"],
  ["Practice Interviewer", "/interview-preparation", "Practice role-specific interview stories"],
  ["Pricing", "/pricing", "Compare Free and Pro"],
  ["Docs", "/docs", "Learn the BragStack workflow"],
  ["Log in", "/login", "Open your BragStack account"],
  ["Sign up", "/register", "Start free"],
];

export default function SearchSitelinksNav() {
  return (
    <section className="search-sitelinks" aria-labelledby="search-sitelinks-title">
      <div className="search-sitelinks-heading">
        <img className="search-sitelinks-logo" src="/bragstack-logo-192.png" alt="BragStack" width="48" height="48" />
        <div>
          <p>EXPLORE BRAGSTACK</p>
          <h2 id="search-sitelinks-title">Career proof, resume building, and interview practice in one place.</h2>
        </div>
      </div>
      <nav className="search-sitelinks-grid" aria-label="Popular BragStack pages">
        {LINKS.map(([label, href, description]) => (
          <a href={href} key={href}>
            <strong>{label}</strong>
            <span>{description}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
