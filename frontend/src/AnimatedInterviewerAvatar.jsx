import bundledAishaJordanInterviewer from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

// Keep the actual portrait as a normal CSS background layer. This is deliberately
// not a canvas: browsers can paint the imported asset directly even if animation
// APIs, image decoding timing, or canvas sizing behave differently.
const AISHA_BACKGROUND = {
  backgroundImage: `url("${bundledAishaJordanInterviewer}"), url("/assets/aisha-interviewer-concept.jpg")`,
};

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";

  return (
    <>
      <div
        className={`aisha-motion-frame state-${safeState} ${reducedMotion ? "reduced-motion" : ""}`}
        role="img"
        aria-label={`${name}, virtual interviewer, ${STATE_COPY[safeState]}`}
      >
        <div className="aisha-photo-layer" style={AISHA_BACKGROUND} />
        <div className="aisha-mouth-window" aria-hidden="true">
          <div className="aisha-mouth-layer" style={AISHA_BACKGROUND} />
        </div>
      </div>

      <div className="aisha-photo-vignette" aria-hidden="true" />
      <div className={`aisha-speaking-glow state-${safeState}`} aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`}>
        <span className="avatar-state-dot" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
    </>
  );
}
