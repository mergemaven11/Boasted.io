import bundledAishaJordanInterviewer from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

const rootStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  minWidth: "100%",
  minHeight: "100%",
  display: "block",
  overflow: "hidden",
  backgroundImage: `url(${bundledAishaJordanInterviewer})`,
  backgroundSize: "cover",
  backgroundPosition: "center 42%",
  backgroundRepeat: "no-repeat",
};

const photoStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  display: "block",
  opacity: 1,
  visibility: "visible",
  objectFit: "cover",
  objectPosition: "center 42%",
};

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";

  return (
    <div
      className={`animated-interviewer-avatar photo-interviewer state-${safeState} ${reducedMotion ? "reduced-motion" : ""}`}
      role="img"
      aria-label={`${name}, virtual interviewer, ${STATE_COPY[safeState]}`}
      style={rootStyle}
    >
      <img
        className="aisha-interviewer-photo"
        src={bundledAishaJordanInterviewer}
        alt="Aisha Jordan, BragStack virtual interviewer"
        draggable="false"
        style={photoStyle}
      />
      <img
        className="aisha-mouth-motion"
        src={bundledAishaJordanInterviewer}
        alt=""
        aria-hidden="true"
        draggable="false"
        style={{ ...photoStyle, opacity: safeState === "speaking" && !reducedMotion ? undefined : 0 }}
      />
      <div className="aisha-photo-vignette" />
      <div className="aisha-speaking-glow" aria-hidden="true" />
      <div className="avatar-state-pill"><span className="avatar-state-dot" /><strong>{STATE_COPY[safeState]}</strong></div>
    </div>
  );
}
