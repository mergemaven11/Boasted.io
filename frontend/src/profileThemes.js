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
];

export function getProfileTheme(id = "default") {
  return PROFILE_THEMES.find((theme) => theme.id === id) || PROFILE_THEMES[0];
}
