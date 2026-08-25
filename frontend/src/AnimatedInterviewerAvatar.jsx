import aishaJordanPhoto from "./assets/aisha-jordan-interviewer.jpg";
import { AISHA_PORTRAIT_DATA_URI } from "./aishaPortraitData.js";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

const FALLBACK_AISHA = AISHA_PORTRAIT_DATA_URI;

const BASE_PHOTO_STYLE = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  minWidth: "100%",
  minHeight: "100%",
  display: "block",
  objectFit: "cover",
  objectPosition: "center 42%",
  opacity: 1,
  visibility: "visible",
  pointerEvents: "none",
};

function useFallbackImage(event) {
  const image = event.currentTarget;
  if (image.dataset.aishaFallback === "true") return;
  image.dataset.aishaFallback = "true";
  image.src = FALLBACK_AISHA;
}

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  const motionClass = reducedMotion ? "reduced-motion" : "";

  return (
    <>
      <img
        className={`aisha-stage-photo state-${safeState} ${motionClass}`}
        src={aishaJordanPhoto}
        onError={useFallbackImage}
        alt={`${name}, BragStack virtual interviewer`}
        draggable="false"
        decoding="async"
        fetchPriority="high"
        style={{ ...BASE_PHOTO_STYLE, zIndex: 1 }}
      />

      <span className={`aisha-mouth-open-shape state-${safeState} ${motionClass}`} aria-hidden="true" />
      <img
        className={`aisha-mouth-photo state-${safeState} ${motionClass}`}
        src={aishaJordanPhoto}
        onError={useFallbackImage}
        alt=""
        aria-hidden="true"
        draggable="false"
        decoding="async"
        style={{ ...BASE_PHOTO_STYLE, zIndex: 3 }}
      />

      <div className="aisha-photo-vignette" aria-hidden="true" />
      <div className={`aisha-speaking-glow state-${safeState}`} aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`}>
        <span className="avatar-state-dot" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
    </>
  );
}
