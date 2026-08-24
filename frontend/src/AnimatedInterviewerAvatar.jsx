const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Asking your question",
  listening: "Listening",
  thinking: "Thinking about your answer",
  encouraging: "You’ve got this",
};

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  return (
    <div className={`animated-interviewer-avatar state-${safeState} ${reducedMotion ? "reduced-motion" : ""}`} role="img" aria-label={`${name}, virtual interviewer, ${STATE_COPY[safeState]}`}>
      <div className="interviewer-office-glow" />
      <div className="interviewer-office-shelf shelf-left"><i /><i /><i /></div>
      <div className="interviewer-office-lamp"><span /></div>
      <svg className="interviewer-person" viewBox="0 0 420 520" aria-hidden="true">
        <defs>
          <linearGradient id="blazer" x1="0" x2="1"><stop offset="0" stopColor="#b87848"/><stop offset="1" stopColor="#d79a67"/></linearGradient>
          <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6f3823"/><stop offset=".55" stopColor="#8b4a2f"/><stop offset="1" stopColor="#a55f3f"/></linearGradient>
          <radialGradient id="hair" cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#2a1715"/><stop offset="1" stopColor="#100b0c"/></radialGradient>
          <filter id="avatarShadow"><feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#000" floodOpacity=".32"/></filter>
        </defs>
        <g filter="url(#avatarShadow)" className="avatar-body">
          <path d="M88 505c7-110 31-170 84-194h76c54 25 78 84 85 194z" fill="url(#blazer)"/>
          <path d="M171 310h78l-13 78h-50z" fill="url(#skin)"/>
          <path d="M182 334l27 37 28-37 18 171h-94z" fill="#111318"/>
          <ellipse cx="210" cy="219" rx="89" ry="116" fill="url(#skin)"/>
          <g className="avatar-hair" fill="url(#hair)">
            <ellipse cx="208" cy="125" rx="112" ry="91"/>
            <circle cx="116" cy="154" r="45"/><circle cx="300" cy="150" r="48"/>
            <circle cx="110" cy="200" r="38"/><circle cx="305" cy="198" r="41"/>
            <circle cx="137" cy="94" r="39"/><circle cx="177" cy="68" r="40"/><circle cx="224" cy="65" r="42"/><circle cx="270" cy="84" r="41"/>
          </g>
          <path d="M141 163c20-16 40-27 61-31 15-3 42-2 72 7" fill="none" stroke="#2c1814" strokeWidth="14" strokeLinecap="round"/>
          <g className="avatar-brows" fill="none" stroke="#2a1714" strokeWidth="8" strokeLinecap="round"><path d="M153 195q29-17 51-2"/><path d="M226 193q25-15 47 1"/></g>
          <g className="avatar-eyes"><ellipse cx="178" cy="215" rx="20" ry="10" fill="#fff5eb"/><ellipse cx="248" cy="214" rx="20" ry="10" fill="#fff5eb"/><circle cx="179" cy="215" r="7.5" fill="#251816"/><circle cx="248" cy="214" r="7.5" fill="#251816"/><circle cx="181" cy="212" r="2.3" fill="#fff"/><circle cx="250" cy="211" r="2.3" fill="#fff"/></g>
          <path d="M213 217c-2 16-4 28-1 39 5 3 10 3 16 0" fill="none" stroke="#713d2d" strokeWidth="4" strokeLinecap="round"/>
          <g className="avatar-mouth"><path className="mouth-closed" d="M179 279q34 23 69 0-35 11-69 0z" fill="#8d2e3d"/><path className="mouth-open" d="M180 278q34 29 69 0-4 36-35 36-29 0-34-36z" fill="#5b1723"/><path className="mouth-smile" d="M177 276q37 31 75 0-11 39-39 39-27 0-36-39z" fill="#8d2e3d"/><path className="teeth" d="M187 282q27 14 54 0-23 16-54 0z" fill="#fff8f1"/></g>
          <circle cx="135" cy="236" r="13" fill="none" stroke="#d8a445" strokeWidth="5"/><circle cx="289" cy="236" r="13" fill="none" stroke="#d8a445" strokeWidth="5"/>
          <path d="M199 323q12 10 25 0" fill="none" stroke="#d7aa62" strokeWidth="3"/><circle cx="212" cy="354" r="5" fill="#d7aa62"/><path d="M212 354v23" stroke="#d7aa62" strokeWidth="2"/>
        </g>
      </svg>
      <div className="avatar-desk" />
      <div className="avatar-state-pill"><span className="avatar-state-dot" /><strong>{STATE_COPY[safeState]}</strong></div>
    </div>
  );
}
