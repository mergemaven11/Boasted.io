import aishaJordanPhoto from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Aisha is speaking",
  listening: "Listening to you",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan" }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  return (
    <div className={`aisha-avatar-shell state-${safeState}`} data-aisha-state={safeState} data-avatar-engine="bragstack-photo-v2">
      <img className="aisha-photo-avatar" src={aishaJordanPhoto} alt={`${name}, BragStack virtual interviewer`} draggable="false" />
      <div className="aisha-photo-vignette" aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`} aria-live="polite">
        <span className="avatar-state-dot" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
    </div>
  );
}
