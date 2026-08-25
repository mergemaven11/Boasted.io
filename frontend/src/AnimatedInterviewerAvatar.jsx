import { useEffect, useState } from "react";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

function installReliableSpeechRecognition(onBlockingError) {
  const NativeRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!NativeRecognition || window.__bragstackNativeSpeechRecognition) return () => {};

  const transientErrors = new Set(["no-speech", "aborted"]);
  const WrappedRecognition = new Proxy(NativeRecognition, {
    construct(Target, args) {
      const native = Reflect.construct(Target, args);
      return new Proxy(native, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
        set(target, property, value) {
          if (property === "continuous") return Reflect.set(target, property, false, target);
          if (property === "onerror" && typeof value === "function") {
            return Reflect.set(target, property, (event) => {
              if (transientErrors.has(event?.error)) return;
              if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event?.error)) {
                onBlockingError(event.error);
              }
              value(event);
            }, target);
          }
          return Reflect.set(target, property, value, target);
        },
      });
    },
  });

  window.__bragstackNativeSpeechRecognition = NativeRecognition;
  if (window.SpeechRecognition) window.SpeechRecognition = WrappedRecognition;
  if (window.webkitSpeechRecognition) window.webkitSpeechRecognition = WrappedRecognition;

  return () => {
    const original = window.__bragstackNativeSpeechRecognition;
    if (!original) return;
    if (window.SpeechRecognition === WrappedRecognition) window.SpeechRecognition = original;
    if (window.webkitSpeechRecognition === WrappedRecognition) window.webkitSpeechRecognition = original;
    delete window.__bragstackNativeSpeechRecognition;
  };
}

function AishaPortrait({ state, reducedMotion }) {
  const motionClass = reducedMotion ? "reduced-motion" : "";
  return (
    <svg
      className={`aisha-vector-avatar state-${state} ${motionClass}`}
      viewBox="0 0 816 551"
      role="img"
      aria-label="Aisha Jordan, BragStack virtual interviewer"
      preserveAspectRatio="xMidYMid slice"
      data-avatar-engine="bragstack-vector-v1"
      data-avatar-state={state}
    >
      <defs>
        <linearGradient id="officeBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#172033" />
          <stop offset="55%" stopColor="#0e1628" />
          <stop offset="100%" stopColor="#09101d" />
        </linearGradient>
        <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b9d5ff" stopOpacity=".44" />
          <stop offset="100%" stopColor="#6f8fc9" stopOpacity=".07" />
        </linearGradient>
        <linearGradient id="skin" x1="0.12" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#9c633f" />
          <stop offset="45%" stopColor="#855033" />
          <stop offset="100%" stopColor="#6a3c28" />
        </linearGradient>
        <linearGradient id="skinLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b77a52" />
          <stop offset="100%" stopColor="#8a5538" />
        </linearGradient>
        <linearGradient id="blazer" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d3ad83" />
          <stop offset="52%" stopColor="#b98c63" />
          <stop offset="100%" stopColor="#916845" />
        </linearGradient>
        <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#261914" />
          <stop offset="55%" stopColor="#17100e" />
          <stop offset="100%" stopColor="#090706" />
        </linearGradient>
        <radialGradient id="faceLight" cx="38%" cy="22%" r="75%">
          <stop offset="0%" stopColor="#dca37c" stopOpacity=".24" />
          <stop offset="100%" stopColor="#9c633f" stopOpacity="0" />
        </radialGradient>
        <filter id="avatarShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#020617" floodOpacity=".5" />
        </filter>
        <filter id="softBlur"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>

      <rect width="816" height="551" fill="url(#officeBg)" />
      <rect x="42" y="44" width="218" height="278" rx="18" fill="url(#windowGlow)" opacity=".5" />
      <path d="M151 44v278M42 152h218" stroke="#d9e8ff" strokeOpacity=".12" strokeWidth="2" />
      <rect x="592" y="66" width="150" height="224" rx="12" fill="#182641" opacity=".72" />
      <rect x="612" y="91" width="110" height="12" rx="6" fill="#86a5dc" opacity=".2" />
      <rect x="612" y="118" width="78" height="9" rx="4" fill="#86a5dc" opacity=".12" />
      <circle cx="696" cy="364" r="90" fill="#8b5cf6" opacity=".08" filter="url(#softBlur)" />
      <circle cx="106" cy="435" r="112" fill="#2dd4bf" opacity=".05" filter="url(#softBlur)" />

      <g className="aisha-body" filter="url(#avatarShadow)">
        <path d="M212 551c13-103 60-172 139-197 33-10 79-10 113 0 79 25 125 94 139 197H212Z" fill="url(#blazer)" />
        <path d="M346 349h124l54 202H293l53-202Z" fill="#111827" />
        <path d="M346 350 293 551h-81c11-86 51-148 118-181l16-20Z" fill="#c49a72" />
        <path d="m470 350 54 201h79c-11-86-51-148-118-181l-15-20Z" fill="#a77a56" />
        <path d="m340 357 68 92-106 102h-10l49-194Z" fill="#d8b48d" opacity=".74" />
        <path d="m476 357-68 92 107 102h10l-49-194Z" fill="#a77a56" opacity=".72" />
        <path d="M394 350h28v56h-28z" fill="#70442f" />

        <g className="aisha-head">
          <g className="aisha-hair-back" fill="url(#hair)">
            <ellipse cx="408" cy="220" rx="121" ry="146" />
            <circle cx="305" cy="188" r="52" /><circle cx="318" cy="132" r="49" />
            <circle cx="359" cy="101" r="47" /><circle cx="407" cy="91" r="48" />
            <circle cx="458" cy="101" r="49" /><circle cx="502" cy="135" r="50" />
            <circle cx="518" cy="190" r="50" /><circle cx="300" cy="242" r="44" />
            <circle cx="516" cy="246" r="45" />
          </g>

          <path d="M324 183c0-73 35-116 84-116s84 43 84 116v62c0 78-36 127-84 127s-84-49-84-127v-62Z" fill="url(#skin)" />
          <path d="M324 187c3-67 37-106 84-106 31 0 58 17 73 49-50-16-111-9-157 57Z" fill="url(#faceLight)" />
          <ellipse cx="329" cy="239" rx="17" ry="27" fill="url(#skinLight)" />
          <ellipse cx="487" cy="239" rx="17" ry="27" fill="#784832" />

          <g className="aisha-brows" fill="none" stroke="#3a241b" strokeWidth="7" strokeLinecap="round">
            <path d="M350 202c14-9 30-10 45-3" />
            <path d="M422 199c15-7 31-6 44 3" />
          </g>

          <g className="aisha-eye-whites" fill="#f8efe7">
            <ellipse cx="374" cy="222" rx="19" ry="9" />
            <ellipse cx="445" cy="222" rx="19" ry="9" />
          </g>
          <g className="aisha-irises" fill="#2f211d">
            <circle cx="376" cy="222" r="7" /><circle cx="443" cy="222" r="7" />
          </g>
          <g className="aisha-pupils" fill="#080706">
            <circle cx="376" cy="222" r="3.3" /><circle cx="443" cy="222" r="3.3" />
          </g>
          <g className="aisha-eye-glints" fill="#ffffff" opacity=".86">
            <circle cx="378" cy="219" r="1.7" /><circle cx="445" cy="219" r="1.7" />
          </g>
          <g className="aisha-eyelids" fill="url(#skinLight)">
            <ellipse cx="374" cy="222" rx="22" ry="12" /><ellipse cx="445" cy="222" rx="22" ry="12" />
          </g>

          <path d="M408 226c-2 20-5 35-12 48 7 5 16 7 25 2" fill="none" stroke="#6b3d2c" strokeWidth="4" strokeLinecap="round" opacity=".8" />
          <ellipse cx="366" cy="268" rx="28" ry="14" fill="#c47a69" opacity=".08" />
          <ellipse cx="454" cy="268" rx="28" ry="14" fill="#c47a69" opacity=".06" />

          <g className="aisha-mouth-stack">
            <path className="aisha-lip-top" d="M376 302c11-9 22-11 32-3 10-8 22-6 34 3-12 5-23 7-34 7-11 0-22-2-32-7Z" fill="#6f2f35" />
            <path className="aisha-lip-bottom" d="M377 303c10 7 20 11 31 11s22-4 34-11c-8 18-20 27-34 27s-24-9-31-27Z" fill="#96515a" />
            <ellipse className="aisha-mouth-opening" cx="409" cy="307" rx="23" ry="5" fill="#2a1115" />
            <path className="aisha-smile-line" d="M380 303c18 8 38 8 58 0" fill="none" stroke="#4d2026" strokeWidth="2.6" strokeLinecap="round" />
          </g>

          <g className="aisha-earrings" fill="#e3c17d">
            <circle cx="326" cy="257" r="4" /><circle cx="490" cy="257" r="4" />
          </g>

          <g className="aisha-hair-front" fill="url(#hair)">
            <path d="M311 183c-4-74 41-129 99-129 56 0 100 52 99 123-16-50-49-78-97-83-48 4-82 34-101 89Z" />
            <circle cx="343" cy="117" r="29" /><circle cx="377" cy="91" r="27" />
            <circle cx="418" cy="83" r="28" /><circle cx="458" cy="97" r="28" />
            <circle cx="487" cy="126" r="28" />
          </g>
        </g>
      </g>

      <g className="aisha-desk-accent" opacity=".84">
        <rect x="58" y="424" width="150" height="84" rx="16" fill="#0b1424" stroke="#ffffff" strokeOpacity=".07" />
        <rect x="78" y="445" width="76" height="9" rx="4" fill="#cbd5e1" opacity=".22" />
        <rect x="78" y="466" width="108" height="7" rx="4" fill="#cbd5e1" opacity=".12" />
        <rect x="78" y="484" width="89" height="7" rx="4" fill="#cbd5e1" opacity=".1" />
      </g>
    </svg>
  );
}

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  const [microphoneIssue, setMicrophoneIssue] = useState("");

  useEffect(() => {
    const resetViewport = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    resetViewport();
    const frame = window.requestAnimationFrame(resetViewport);
    const uninstallRecognition = installReliableSpeechRecognition((error) => {
      setMicrophoneIssue(error === "audio-capture"
        ? "BragStack cannot access a microphone. Check that a microphone is available, then tap Speak answer."
        : "Microphone permission is blocked. Allow microphone access for BragStack in your browser settings, then tap Speak answer.");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      uninstallRecognition();
    };
  }, []);

  return (
    <div className={`aisha-avatar-shell state-${safeState} ${reducedMotion ? "reduced-motion" : ""}`} data-aisha-state={safeState} data-avatar-engine="bragstack-vector-v1">
      <AishaPortrait state={safeState} reducedMotion={reducedMotion} />
      <div className="aisha-avatar-depth" aria-hidden="true" />
      <div className={`aisha-speaking-glow state-${safeState}`} aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`} aria-live="polite">
        <span className="avatar-state-dot" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
      <span className="sr-only">{name}, BragStack virtual interviewer</span>
      {microphoneIssue && <div role="alert" className="aisha-microphone-alert">{microphoneIssue}</div>}
    </div>
  );
}
