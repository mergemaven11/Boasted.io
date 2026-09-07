export const INTERVIEW_VOICE_STYLES = {
  warm: {
    label: "Warm & professional",
    preferredNames: ["Samantha", "Ava", "Serena", "Microsoft Aria"],
    rate: 0.92,
    pitch: 0.99,
  },
  bright: {
    label: "Bright & friendly",
    preferredNames: ["Ava", "Samantha", "Tessa", "Nicky"],
    rate: 0.96,
    pitch: 1.08,
  },
  calm: {
    label: "Calm & steady",
    preferredNames: ["Serena", "Moira", "Karen", "Google US English"],
    rate: 0.87,
    pitch: 0.96,
  },
};

export function getInterviewVoiceStyle(style = "warm") {
  return INTERVIEW_VOICE_STYLES[style] || INTERVIEW_VOICE_STYLES.warm;
}

export function chooseInterviewVoice(voices = [], style = "warm") {
  const englishVoices = voices.filter((voice) => String(voice?.lang || "").toLowerCase().startsWith("en"));
  const settings = getInterviewVoiceStyle(style);
  return settings.preferredNames
    .map((name) => englishVoices.find((voice) => String(voice.name || "").includes(name)))
    .find(Boolean)
    || englishVoices.find((voice) => /^en-us\b/i.test(voice.lang) && /premium|enhanced|natural|neural/i.test(voice.name))
    || englishVoices.find((voice) => /^en-us\b/i.test(voice.lang))
    || englishVoices[0]
    || null;
}
