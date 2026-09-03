export const PROFILE_THEMES = [
  { id: "default", name: "BragStack", career: "Signature", primary: "#7dd3fc", secondary: "#c4b5fd", background: "#050816" },
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
