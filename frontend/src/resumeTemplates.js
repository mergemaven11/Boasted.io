export const RESUME_TEMPLATE_SECTION_ORDER = [
  "summary",
  "skills",
  "experience",
  "education",
  "projects",
  "certifications",
  "leadership",
  "volunteer",
  "awards",
  "publications",
  "languages",
];

export const RESUME_TEMPLATES = [
  {
    id: "classic-navy",
    name: "Classic Navy",
    audience: "Universal",
    description: "Traditional, crisp, and easy to scan.",
    accent: "navy",
    className: "resume-template-classic-navy",
  },
  {
    id: "minimal-teal",
    name: "Minimal Teal",
    audience: "Universal",
    description: "Lightweight modern layout with quiet dividers.",
    accent: "teal",
    className: "resume-template-minimal-teal",
  },
  {
    id: "modern-blue",
    name: "Modern Blue",
    audience: "Business & marketing",
    description: "A soft header band with a clean text-first body.",
    accent: "sky",
    className: "resume-template-modern-blue",
  },
  {
    id: "student-plum",
    name: "Student Plum",
    audience: "Students & early career",
    description: "Education and projects can lead when experience is light.",
    accent: "plum",
    className: "resume-template-student-plum",
  },
  {
    id: "technical-blue",
    name: "Technical Blue",
    audience: "Engineering & IT",
    description: "Dense enough for technical depth without parser-hostile columns.",
    accent: "electric",
    className: "resume-template-technical-blue",
  },
  {
    id: "healthcare-green",
    name: "Healthcare Green",
    audience: "Healthcare & operations",
    description: "Calm hierarchy for credentials, compliance, and service work.",
    accent: "green",
    className: "resume-template-healthcare-green",
  },
  {
    id: "academic-burgundy",
    name: "Academic Burgundy",
    audience: "Research & education",
    description: "Elegant academic tone for research, teaching, and publications.",
    accent: "burgundy",
    className: "resume-template-academic-burgundy",
  },
  {
    id: "customer-cobalt",
    name: "Customer Cobalt",
    audience: "Customer success & sales",
    description: "Outcome-forward presentation for relationship and revenue roles.",
    accent: "cobalt",
    className: "resume-template-customer-cobalt",
  },
  {
    id: "executive-gold",
    name: "Executive Gold",
    audience: "Leadership",
    description: "Premium restraint for senior leadership and advisory experience.",
    accent: "gold",
    className: "resume-template-executive-gold",
  },
  {
    id: "creative-lavender",
    name: "Creative Lavender",
    audience: "Creative professionals",
    description: "More personality while keeping a strict single reading order.",
    accent: "lavender",
    className: "resume-template-creative-lavender",
  },
  {
    id: "monochrome",
    name: "Monochrome",
    audience: "Finance, legal & conservative",
    description: "No-color print-safe structure with strong typographic hierarchy.",
    accent: "mono",
    className: "resume-template-monochrome",
  },
  {
    id: "compact-slate",
    name: "Compact Slate",
    audience: "Experienced professionals",
    description: "Space-efficient formatting for deeper work histories.",
    accent: "slate",
    className: "resume-template-compact-slate",
  },
];

export const DEFAULT_RESUME_TEMPLATE_ID = RESUME_TEMPLATES[0].id;

export function getResumeTemplate(templateId) {
  return RESUME_TEMPLATES.find((template) => template.id === templateId) || RESUME_TEMPLATES[0];
}
