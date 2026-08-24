export const SEO_SITELINK_META = {
  "/how-it-works": "How BragStack Works | Career Proof System",
  "/pricing": "Pricing | BragStack",
  "/resume-accomplishments": "Resume Builder | BragStack",
  "/career-portfolio": "Career Portfolio | BragStack",
  "/performance-reviews": "Performance Reviews | BragStack",
  "/promotion-packet": "Promotion Packet | BragStack",
  "/interview-preparation": "Practice Interviewer | BragStack",
  "/impact-receipts": "Impact Receipts | BragStack",
  "/career-analytics": "Career Analytics | BragStack",
  "/public-proof-profiles": "Public Proof Profiles | BragStack",
};

export function getSeoSitelinkTitle(path, fallback) {
  return SEO_SITELINK_META[path] || fallback;
}
