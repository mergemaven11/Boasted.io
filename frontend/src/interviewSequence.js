import { useEffect, useRef } from "react";

const INTRO_SEGMENTS = [
  "Hi, I’m Aisha Jordan. Welcome to your BragStack practice interview.",
  "Here’s how this works. I’ll ask one question at a time. After I finish speaking, your response timer will begin and I’ll start listening.",
  "Answer naturally, just like you would in a real interview. I’ll evaluate what you said, and if an important detail is missing, I may ask one short follow-up.",
  "When your time ends, you’ll hear a soft chime and I’ll let you know. At the end, you’ll get your score, strengths, and specific ways to improve.",
  "Take your time and be yourself. Ready? Let’s begin.",
];

function pickSoftVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const preferred = ["Ava (Premium)", "Samantha (Enhanced)", "Ava", "Samantha", "Serena", "Tessa", "Moira", "Microsoft Aria Online", "Microsoft Aria", "Google US English"];
  return preferred.map((name) => voices.find((voice) => voice.name.includes(name) && voice.lang?.startsWith("en"))).find(Boolean)
    || voices.find((voice) => voice.lang?.startsWith("en-US") && /premium|enhanced|natural|neural/i.test(voice.name))
    || voices.find((voice) => voice.lang?.startsWith("en-US"))
    || voices.find((voice) => voice.lang?.startsWith("en"))
    || null;
}

function tune(utterance) {
  const voice = pickSoftVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.volume = 0.9;
  return utterance;
}

function waitForAisha(callback, attempts = 0) {
  const image = document.querySelector(".aisha-interviewer-photo");
  if (image?.complete && image.naturalWidth > 0) {
    callback();
    return;
  }
  if (attempts >= 30) {
    callback();
    return;
  }
  window.setTimeout(() => waitForAisha(callback, attempts + 1), 100);
}

function playSoftChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const now = context.currentTime;
    [783.99, 987.77].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.055, now + index * 0.12 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.28);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.12);
      oscillator.stop(now + index * 0.12 + 0.3);
    });
    window.setTimeout(() => context.close?.(), 800);
  } catch {
    // Audio polish must never block the interview.
  }
}

export function useInterviewSequence() {
  const greetedRef = useRef(false);
  const lastTimerRef = useRef("");
  const handledFeedbackRef = useRef(null);
  const micStartedRef = useRef(false);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth?.speak) return undefined;

    const originalSpeak = synth.speak.bind(synth);
    let disposed = false;

    const speakOriginal = (utterance) => originalSpeak(tune(utterance));

    function speakIntroThen(firstQuestionUtterance) {
      let index = 0;
      const next = () => {
        if (disposed || !document.querySelector(".interview-room-page")) return;
        if (index >= INTRO_SEGMENTS.length) {
          window.setTimeout(() => speakOriginal(firstQuestionUtterance), 5000);
          return;
        }
        const intro = tune(new SpeechSynthesisUtterance(INTRO_SEGMENTS[index]));
        index += 1;
        intro.onend = () => window.setTimeout(next, 5000);
        intro.onerror = () => window.setTimeout(next, 5000);
        originalSpeak(intro);
      };
      next();
    }

    const wrappedSpeak = (utterance) => {
      const inInterview = Boolean(document.querySelector(".interview-room-page"));
      if (!inInterview || greetedRef.current) {
        speakOriginal(utterance);
        return;
      }
      greetedRef.current = true;
      waitForAisha(() => speakIntroThen(utterance));
    };

    try {
      synth.speak = wrappedSpeak;
    } catch {
      return undefined;
    }

    const sync = () => {
      const room = document.querySelector(".interview-room-page");
      if (!room) {
        greetedRef.current = false;
        lastTimerRef.current = "";
        handledFeedbackRef.current = null;
        micStartedRef.current = false;
        return;
      }

      const timer = document.querySelector(".response-timer")?.textContent?.replace(/\s+/g, " ").trim() || "";
      const status = document.querySelector(".virtual-interviewer-status strong")?.textContent?.trim() || "";
      const feedback = document.querySelector(".answer-feedback-panel");
      const startMic = document.querySelector(".dictation-button:not(.active)");
      const stopMic = document.querySelector(".dictation-button.active");

      if (!feedback && status === "Listening" && !synth.speaking && startMic && !micStartedRef.current) {
        micStartedRef.current = true;
        window.setTimeout(() => {
          const stillListening = document.querySelector(".virtual-interviewer-status strong")?.textContent?.trim() === "Listening";
          if (!disposed && stillListening && !synth.speaking) startMic.click();
        }, 250);
      }

      if (status === "Asking your question" || status === "Follow-up question") micStartedRef.current = false;

      if (timer && /0:00\s*$/.test(timer) && lastTimerRef.current && !/0:00\s*$/.test(lastTimerRef.current)) {
        stopMic?.click();
        playSoftChime();
        window.setTimeout(() => {
          if (!disposed) speakOriginal(new SpeechSynthesisUtterance("Okay, that’s time. Thank you."));
        }, 350);
      }
      lastTimerRef.current = timer;

      if (feedback && handledFeedbackRef.current !== feedback) {
        handledFeedbackRef.current = feedback;
        const followUpButton = feedback.querySelector(".follow-up-card button");
        const nextButton = [...feedback.querySelectorAll("button")].find((button) => /next question|finish interview/i.test(button.textContent || ""));
        window.setTimeout(() => {
          if (disposed || !document.body.contains(feedback)) return;
          if (followUpButton) followUpButton.click();
          else nextButton?.click();
        }, followUpButton ? 6500 : 7500);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] });
    const interval = window.setInterval(sync, 300);

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearInterval(interval);
      try { synth.speak = originalSpeak; } catch { /* browser owns this method */ }
    };
  }, []);
}
