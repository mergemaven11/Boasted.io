import { PrivacyPolicyPage, TermsPage } from "./LegalPages.jsx";
import { InterimPrivacyNotice, InterimTermsNotice } from "./InterimLegalNotice.jsx";

function LegalPageRouter({ page }) {
  if (page === "terms") {
    return <><InterimTermsNotice /><TermsPage /></>;
  }
  return <><InterimPrivacyNotice /><PrivacyPolicyPage /></>;
}

export default LegalPageRouter;
