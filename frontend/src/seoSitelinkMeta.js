export const SEO_SITELINK_META = {
  "/how-it-works": "How BragStack Works | Build Career Proof",
  "/pricing": "BragStack Pricing | Start Free, Upgrade to Pro",
  "/resume-accomplishments": "Resume Accomplishments | Evidence-Backed Career Proof",
  "/career-portfolio": "Career Portfolio | BragStack",
  "/performance-reviews": "Performance Reviews | BragStack",
  "/promotion-packet": "Promotion Packet | Build a Stronger Promotion Case",
  "/interview-preparation": "Interview Preparation | BragStack",
  "/impact-receipts": "Impact Receipts | BragStack",
  "/career-analytics": "Career Analytics | BragStack",
  "/public-proof-profiles": "Public Proof Profiles | BragStack",
};

export function getSeoSitelinkTitle(path, fallback) {
  return SEO_SITELINK_META[path] || fallback;
}
