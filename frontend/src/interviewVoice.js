const FEMININE_VOICE_NAMES = [
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Ava",
  "Microsoft Emma",
  "Microsoft Michelle",
  "Microsoft Zira",
  "Microsoft Sonia",
  "Microsoft Libby",
  "Microsoft Clara",
  "Microsoft Natasha",
  "Microsoft Ana",
  "Samantha",
  "Ava",
  "Serena",
  "Allison",
  "Susan",
  "Victoria",
  "Tessa",
  "Moira",
  "Karen",
  "Fiona",
  "Nicky",
  "Google US English",
];

export const INTERVIEW_VOICE_STYLES = {
  warm: {
    label: "Warm & professional",
    preferredNames: ["Microsoft Aria", "Microsoft Jenny", "Samantha", "Ava", "Microsoft Emma", "Serena"],
    rate: 0.92,
    pitch: 0.99,
  },
  bright: {
    label: "Bright & friendly",
    preferredNames: ["Microsoft Ava", "Microsoft Jenny", "Ava", "Samantha", "Tessa", "Nicky", "Microsoft Ana"],
    rate: 0.96,
    pitch: 1.08,
  },
  calm: {
    label: "Calm & steady",
    preferredNames: ["Serena", "Samantha", "Microsoft Aria", "Moira", "Karen", "Susan", "Google US English"],
    rate: 0.87,
    pitch: 0.96,
  },
};

export function getInterviewVoiceStyle(style = "warm") {
  return INTERVIEW_VOICE_STYLES[style] || INTERVIEW_VOICE_STYLES.warm;
}

function findNamedVoice(voices, names) {
  return names
    .map((name) => voices.find((voice) => String(voice.name || "").toLowerCase().includes(name.toLowerCase())))
    .find(Boolean);
}

export function chooseInterviewVoice(voices = [], style = "warm") {
  const englishVoices = voices.filter((voice) => String(voice?.lang || "").toLowerCase().startsWith("en"));
  const settings = getInterviewVoiceStyle(style);
  return findNamedVoice(englishVoices, settings.preferredNames)
    || findNamedVoice(englishVoices, FEMININE_VOICE_NAMES)
    || null;
}
