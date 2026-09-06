export const SEO_SITELINK_META = {
  "/how-it-works": "How Boasted Works | Career Proof System",
  "/pricing": "Pricing | Boasted",
  "/resume-accomplishments": "Resume Builder | Boasted",
  "/career-portfolio": "Career Portfolio | Boasted",
  "/performance-reviews": "Performance Reviews | Boasted",
  "/promotion-packet": "Promotion Packet | Boasted",
  "/interview-preparation": "Practice Interviewer | Boasted",
  "/impact-receipts": "Impact Receipts | Boasted",
  "/career-analytics": "Career Analytics | Boasted",
  "/public-proof-profiles": "Public Proof Profiles | Boasted",
};

export function getSeoSitelinkTitle(path, fallback) {
  return SEO_SITELINK_META[path] || fallback;
}
