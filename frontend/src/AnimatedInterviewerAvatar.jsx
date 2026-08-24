import { useState } from "react";
import bundledAishaJordanInterviewer from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Asking your question",
  listening: "Listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan", reducedMotion = false }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  const [photoSrc, setPhotoSrc] = useState("/assets/aisha-interviewer-concept.jpg");
  return (
    <div className={`animated-interviewer-avatar photo-interviewer state-${safeState} ${reducedMotion ? "reduced-motion" : ""}`} role="img" aria-label={`${name}, virtual interviewer, ${STATE_COPY[safeState]}`}>
      <img
        className="aisha-interviewer-photo"
        src={photoSrc}
        onError={() => { if (photoSrc !== bundledAishaJordanInterviewer) setPhotoSrc(bundledAishaJordanInterviewer); }}
        alt="Aisha Jordan, BragStack virtual interviewer"
      />
      <div className="aisha-photo-vignette" />
      <div className="aisha-speaking-glow" aria-hidden="true" />
      <div className="avatar-state-pill"><span className="avatar-state-dot" /><strong>{STATE_COPY[safeState]}</strong></div>
    </div>
  );
}
