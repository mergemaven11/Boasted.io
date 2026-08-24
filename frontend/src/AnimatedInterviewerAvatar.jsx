import { useState } from "react";
import bundledAishaJordanInterviewer from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false, onReady }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  const [photoSrc, setPhotoSrc] = useState(bundledAishaJordanInterviewer);

  const handlePhotoError = () => {
    if (photoSrc !== "/assets/aisha-interviewer-concept.jpg") {
      setPhotoSrc("/assets/aisha-interviewer-concept.jpg");
    }
  };

  return (
    <div className={`animated-interviewer-avatar photo-interviewer state-${safeState} ${reducedMotion ? "reduced-motion" : ""}`} role="img" aria-label={`${name}, virtual interviewer, ${STATE_COPY[safeState]}`}>
      <img
        className="aisha-interviewer-photo"
        src={photoSrc}
        onLoad={() => onReady?.()}
        onError={handlePhotoError}
        alt="Aisha Jordan, BragStack virtual interviewer"
      />
      <img
        className="aisha-mouth-motion"
        src={photoSrc}
        onError={handlePhotoError}
        alt=""
        aria-hidden="true"
      />
      <div className="aisha-photo-vignette" />
      <div className="aisha-speaking-glow" aria-hidden="true" />
      <div className="avatar-state-pill"><span className="avatar-state-dot" /><strong>{STATE_COPY[safeState]}</strong></div>
    </div>
  );
}
