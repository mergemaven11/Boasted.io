export const PROFILE_THEMES = [
  { id: "default", name: "Boasted", career: "Signature", primary: "#7dd3fc", secondary: "#c4b5fd", background: "#050816" },
  { id: "clinical", name: "Clinical", career: "Healthcare", primary: "#5eead4", secondary: "#67e8f9", background: "#06151a" },
  { id: "educator", name: "Educator", career: "Education", primary: "#fbbf24", secondary: "#fb7185", background: "#181006" },
  { id: "engineer", name: "Engineer", career: "Engineering & Tech", primary: "#60a5fa", secondary: "#94a3b8", background: "#07111f" },
  { id: "designer", name: "Designer", career: "Design", primary: "#f472b6", secondary: "#c084fc", background: "#17091a" },
  { id: "executive", name: "Executive", career: "Leadership", primary: "#d4af37", secondary: "#e2e8f0", background: "#090b10" },
  { id: "trades", name: "Trades", career: "Skilled Trades", primary: "#fb923c", secondary: "#facc15", background: "#171008" },
  { id: "creator", name: "Creator", career: "Creative", primary: "#a78bfa", secondary: "#22d3ee", background: "#10091c" },
  { id: "hospitality", name: "Hospitality", career: "Hospitality", primary: "#fb7185", secondary: "#fda4af", background: "#190b10" },
  { id: "finance", name: "Finance", career: "Finance", primary: "#34d399", secondary: "#93c5fd", background: "#07150f" },
  { id: "legal", name: "Legal", career: "Legal", primary: "#c4b5fd", secondary: "#e5e7eb", background: "#0d0b16" },
  { id: "public-service", name: "Public Service", career: "Government & Nonprofit", primary: "#38bdf8", secondary: "#f8fafc", background: "#07121b" },
  { id: "midnight", name: "Midnight", career: "Modern Dark", primary: "#818cf8", secondary: "#22d3ee", background: "#030712" },
  { id: "aurora", name: "Aurora", career: "Bold & Modern", primary: "#34d399", secondary: "#a78bfa", background: "#07130f" },
  { id: "ember", name: "Ember", career: "Warm & Confident", primary: "#fb7185", secondary: "#fb923c", background: "#190b08" },
  { id: "monochrome", name: "Monochrome", career: "Minimal", primary: "#f8fafc", secondary: "#94a3b8", background: "#09090b" },
  { id: "ocean", name: "Ocean", career: "Calm & Professional", primary: "#38bdf8", secondary: "#2dd4bf", background: "#04131b" },
  { id: "orchid", name: "Orchid", career: "Expressive", primary: "#e879f9", secondary: "#818cf8", background: "#17091d" },
  { id: "forest", name: "Forest", career: "Grounded", primary: "#4ade80", secondary: "#a3e635", background: "#07140b" },
  { id: "copper", name: "Copper", career: "Craft & Operations", primary: "#fb923c", secondary: "#d6d3d1", background: "#160d08" },
  { id: "rose-gold", name: "Rose Gold", career: "Polished", primary: "#fda4af", secondary: "#e9d5ff", background: "#180d12" },
  { id: "blueprint", name: "Blueprint", career: "Architecture & Systems", primary: "#60a5fa", secondary: "#bfdbfe", background: "#061120" },
  { id: "studio", name: "Studio", career: "Media & Production", primary: "#f97316", secondary: "#c084fc", background: "#140b0c" },
  { id: "research", name: "Research", career: "Science & Research", primary: "#2dd4bf", secondary: "#a5b4fc", background: "#061314" },
];

export function getProfileTheme(id = "default") {
  return PROFILE_THEMES.find((theme) => theme.id === id) || PROFILE_THEMES[0];
}

export function getContrastText(hex = "#050816") {
  const value = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return "#f8fafc";
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const channel = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  return luminance > 0.42 ? "#0f172a" : "#f8fafc";
}

export const PROFILE_LAYOUTS = [
  { id: "editorial", name: "Dahlia", description: "Editorial storytelling with dramatic type, whitespace, and elegant proof sections." },
  { id: "executive-sidebar", name: "Magnolia", description: "Executive résumé with a true professional sidebar and focused main column." },
  { id: "career-timeline", name: "Iris", description: "Career progression built around a strong visual timeline and milestone proof." },
  { id: "studio-split", name: "Peony", description: "Creative split-screen portfolio with bold asymmetry and showcase-style work." },
  { id: "minimal-column", name: "Camellia", description: "Minimal single-column profile with calm spacing and maximum readability." },
  { id: "portfolio-grid", name: "Lotus", description: "Project-first modular grid for makers, creators, and multidisciplinary work." },
  { id: "case-study", name: "Hibiscus", description: "Outcome-led case studies with oversized metrics and narrative proof." },
  { id: "modern-resume", name: "Poppy", description: "Modern two-column résumé designed for fast recruiter scanning." },
  { id: "command-center", name: "Protea", description: "Dense technical command center for engineering, infrastructure, and operations." },
  { id: "academic", name: "Jasmine", description: "Scholarly CV-inspired layout for research, teaching, publications, and expertise." },
  { id: "founder", name: "Marigold", description: "Founder and leadership profile that puts traction, vision, and impact up front." },
  { id: "compact", name: "Lavender", description: "Compact professional profile optimized for quick sharing and mobile viewing." },
];

export function getProfileLayout(id = "editorial") {
  return PROFILE_LAYOUTS.find((layout) => layout.id === id) || PROFILE_LAYOUTS[0];
}
