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
  "/guides": "Career Accomplishment Guides | Boasted",
  "/guides/brag-document": "What Is a Brag Document? Work Accomplishment Guide | Boasted",
  "/guides/track-work-accomplishments": "How to Track Work Accomplishments | Boasted",
  "/guides/performance-review-accomplishments": "Performance Review Accomplishments Guide | Boasted",
  "/guides/star-interview-stories": "STAR Interview Stories: Method & Examples | Boasted",
  "/guides/resume-accomplishment-examples": "Resume Accomplishment Examples & Writing Guide | Boasted",
  "/guides/promotion-packet": "Promotion Packet Guide: Evidence & Impact | Boasted",
};

export function getSeoSitelinkTitle(path, fallback) {
  return SEO_SITELINK_META[path] || fallback;
}
