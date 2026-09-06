import { PROFESSION_SPECIALTIES } from "./professionInterviewBank.js";

const UNIVERSAL_ROLE_PROMPTS = [
  "What is one strength you would bring to a {role} position, and what real example best proves it?",
  "Tell me about something that did not go as planned. What did you learn, and what did you change afterward?",
];

const SPECIALTY_KEYWORD_BOOSTS = {
  cybersecurity: ["cyber"],
  ux_design: ["ux", "user experience", "product design"],
};

// The current matcher uses substring containment. Filter short/broad aliases that
// can collide with unrelated titles (for example CTO inside direCTOr, or generic
// therapist before the more specific physical/occupational therapist entries).
const SPECIALTY_KEYWORD_REMOVALS = {
  executive_leadership: new Set(["cto"]),
  mental_health: new Set(["therapist"]),
};

export const PROFESSION_FAMILIES = Object.fromEntries(
  Object.entries(PROFESSION_SPECIALTIES).map(([key, config]) => [
    key,
    {
      keywords: [
        ...config.keywords.filter((keyword) => !SPECIALTY_KEYWORD_REMOVALS[key]?.has(keyword)),
        ...(SPECIALTY_KEYWORD_BOOSTS[key] || []),
      ],
      competencies: [
        config.competencies[0] || "role_knowledge",
        "role_alignment",
        config.competencies[1] || config.competencies[0] || "problem_solving",
        "learning",
        ...config.competencies.slice(2),
      ],
      roleQuestions: [
        config.questions[0],
        UNIVERSAL_ROLE_PROMPTS[0],
        config.questions[1],
        UNIVERSAL_ROLE_PROMPTS[1],
        config.questions[2],
      ].filter(Boolean),
      professionFamily: config.family,
      professionSpecific: true,
    },
  ]),
);
