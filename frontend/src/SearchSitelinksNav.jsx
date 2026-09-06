import "./SearchSitelinksNav.css";
import { PRIMARY_SITELINKS } from "./primarySitelinks.js";

export default function SearchSitelinksNav() {
  return (
    <section className="search-sitelinks" aria-labelledby="search-sitelinks-title">
      <div className="search-sitelinks-heading">
        <img className="search-sitelinks-logo" src="/bragstack-logo-192.png" alt="Boasted" width="48" height="48" />
        <div>
          <p>EXPLORE BOASTED</p>
          <h2 id="search-sitelinks-title">Career proof, resume building, and interview practice in one place.</h2>
        </div>
      </div>
      <nav className="search-sitelinks-grid" aria-label="Popular Boasted pages">
        {PRIMARY_SITELINKS.map(([label, href, description]) => (
          <a href={href} key={href}>
            <strong>{label}</strong>
            <span>{description}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
