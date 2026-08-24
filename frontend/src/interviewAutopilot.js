import { useEffect, useRef } from "react";

function playSoftChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const now = context.currentTime;
    [880, 1174.66].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.07, now + index * 0.11 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.11 + 0.24);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.11);
      oscillator.stop(now + index * 0.11 + 0.26);
    });
    window.setTimeout(() => context.close?.(), 700);
  } catch {
    // Audio polish must never block the interview.
  }
}

function speakBrief(text) {
  const synth = window.speechSynthesis;
  if (!synth?.speak || !text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.86;
  utterance.pitch = 1;
  utterance.volume = 0.88;
  synth.speak(utterance);
}

export function useInterviewAutopilot() {
  const handledTimeoutRef = useRef(false);
  const handledFeedbackRef = useRef(null);

  useEffect(() => {
    const sync = () => {
      const room = document.querySelector(".interview-room-page");
      if (!room) {
        handledTimeoutRef.current = false;
        handledFeedbackRef.current = null;
        return;
      }

      const timer = document.querySelector(".response-timer")?.textContent?.trim() || "";
      const feedback = document.querySelector(".answer-feedback-panel");
      const dictationStart = document.querySelector(".dictation-button:not(.active)");
      const dictationStop = document.querySelector(".dictation-button.active");

      // Once Aisha has finished speaking and the response clock is running,
      // start speech capture automatically when the browser supports it.
      if (!feedback && timer && timer !== "0:00" && dictationStart && !handledTimeoutRef.current) {
        const readyState = document.querySelector(".avatar-state-pill strong")?.textContent?.trim();
        if (readyState === "Listening" || readyState === "Ready when you are") {
          dictationStart.click();
        }
      }

      if (!feedback && timer === "0:00" && !handledTimeoutRef.current) {
        handledTimeoutRef.current = true;
        dictationStop?.click();
        playSoftChime();
        window.setTimeout(() => speakBrief("Okay, that’s time. Thank you."), 350);
      }

      if (timer && timer !== "0:00") handledTimeoutRef.current = false;

      // Keep the session moving like a real interview. After feedback has had
      // a few seconds to land, ask a targeted follow-up when one exists;
      // otherwise move to the next question automatically.
      if (feedback && handledFeedbackRef.current !== feedback) {
        handledFeedbackRef.current = feedback;
        const followUpButton = feedback.querySelector(".follow-up-card button");
        const nextButton = [...feedback.querySelectorAll("button")].find((button) => /next question|finish interview/i.test(button.textContent || ""));
        window.setTimeout(() => {
          if (!document.body.contains(feedback)) return;
          if (followUpButton) followUpButton.click();
          else nextButton?.click();
        }, followUpButton ? 4200 : 5200);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["class"] });
    const interval = window.setInterval(sync, 350);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
}
