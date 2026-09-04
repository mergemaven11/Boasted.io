export const SEO_SITELINK_META = {
  "/how-it-works": "How BragStack Works | Career Proof System",
  "/pricing": "Pricing | BragStack",
  "/resume-accomplishments": "Resume Builder | BragStack",
  "/career-portfolio": "Career Portfolio | BragStack",
  "/performance-reviews": "Performance Reviews | BragStack",
  "/promotion-packet": "Promotions | BragStack",
  "/interview-preparation": "Interview Preparation | BragStack",
  "/impact-receipts": "Impact Receipts | BragStack",
  "/career-analytics": "Career Analytics | BragStack",
  "/public-proof-profiles": "Proof Profiles | BragStack",
  "/professional-packets": "Professional Packets | BragStack",
  "/open-to-talk": "Open to Talk | BragStack",
  "/freelancers": "BragStack for Freelancers",
  "/teams": "BragStack Teams | Coming Soon",
  "/use-cases": "BragStack Use Cases",
  "/contact": "Contact BragStack",
  "/team-waitlist": "BragStack Team Waitlist",
  "/enterprise": "BragStack Enterprise | Early Conversations",
};

export function getSeoSitelinkTitle(path, fallback) {
  return SEO_SITELINK_META[path] || fallback;
}
