const STATE_COPY = {
  idle: "Ready",
  greeting: "Introducing interview",
  asking: "Asking question",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing answer",
  encouraging: "Preparing next step",
};

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan" }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  const displayName = name === "AJ" ? "Aisha Jordan" : name;

  return (
    <div
      className={`aisha-avatar-shell state-${safeState}`}
      data-avatar-engine="bragstack-static-aj-v1"
      data-interviewer-state={safeState}
      aria-label={`${displayName}, BragStack Interviewer — ${STATE_COPY[safeState]}`}
    >
      <div className="aj-avatar-content">
        <div className="aj-avatar-monogram" aria-hidden="true">AJ</div>
        <div className="aj-avatar-identity">
          <span>Aisha Jordan · BragStack Interviewer</span>
        </div>
        <div className={`aj-avatar-state state-${safeState}`} aria-live="polite">
          <span className="aj-avatar-state-dot" aria-hidden="true" />
          <strong>{STATE_COPY[safeState]}</strong>
        </div>
      </div>
    </div>
  );
}
