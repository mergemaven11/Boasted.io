import { PrivacyPolicyPage, TermsPage } from "./LegalPages.jsx";

function LegalPageRouter({ page }) {
  return page === "terms" ? <TermsPage /> : <PrivacyPolicyPage />;
}

export default LegalPageRouter;
