import aishaJordanPhoto from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Aisha is speaking",
  listening: "Your turn — listening",
  thinking: "Reviewing your answer",
  encouraging: "Follow-up coaching",
};

const AVATAR_STYLES = `
.aisha-avatar-shell {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #08101f;
  isolation: isolate;
}
.aisha-photo-avatar {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 28%;
  transform: none;
  filter: none;
  image-rendering: auto;
  user-select: none;
  pointer-events: none;
}
.aisha-photo-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(4,8,18,.01) 48%, rgba(4,8,18,.76) 100%),
    radial-gradient(circle at 50% 38%, transparent 52%, rgba(4,8,18,.16) 100%);
}
.aisha-avatar-shell::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: inset 0 0 0 1px rgba(165,180,252,.04);
  transition: box-shadow .2s ease, border-color .2s ease;
}
.aisha-avatar-shell.state-speaking::after {
  border-color: rgba(196,181,253,.24);
  box-shadow: inset 0 0 34px rgba(139,92,246,.08);
}
.aisha-avatar-shell.state-listening::after {
  border-color: rgba(110,231,183,.28);
  box-shadow: inset 0 0 34px rgba(16,185,129,.08);
}
.aisha-avatar-shell.state-thinking::after {
  border-color: rgba(252,211,77,.22);
  box-shadow: inset 0 0 30px rgba(245,158,11,.06);
}
.aisha-avatar-shell.state-encouraging::after {
  border-color: rgba(249,168,212,.22);
  box-shadow: inset 0 0 30px rgba(236,72,153,.06);
}
.avatar-state-pill {
  position: absolute;
  left: 14px;
  top: 14px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 28px);
  padding: 8px 11px;
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 999px;
  color: #eef2ff;
  background: rgba(7,16,31,.78);
  backdrop-filter: blur(9px);
  font-size: clamp(.72rem, 1.7vw, .82rem);
  line-height: 1;
  box-shadow: 0 8px 22px rgba(0,0,0,.25);
}
.avatar-state-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #a5b4fc;
  box-shadow: 0 0 0 4px rgba(165,180,252,.12);
}
.aisha-avatar-shell.state-speaking .avatar-state-dot {
  animation: aishaPulse .9s ease-in-out infinite;
  background: #c4b5fd;
}
.aisha-avatar-shell.state-listening .avatar-state-dot {
  animation: aishaPulse 1.1s ease-in-out infinite;
  background: #6ee7b7;
  box-shadow: 0 0 0 4px rgba(110,231,183,.14);
}
.aisha-avatar-shell.state-thinking .avatar-state-dot { background: #fcd34d; }
.aisha-avatar-shell.state-encouraging .avatar-state-dot { background: #f9a8d4; }
@keyframes aishaPulse {
  0%,100% { transform: scale(.9); opacity: .78; }
  50% { transform: scale(1.22); opacity: 1; }
}
@media (max-width: 950px) {
  .aisha-photo-avatar { object-position: center 25%; }
}
@media (max-width: 620px) {
  .aisha-photo-avatar { object-position: center 22%; }
  .avatar-state-pill { left: 10px; top: 10px; max-width: calc(100% - 20px); padding: 7px 9px; }
}
@media (prefers-reduced-motion: reduce) {
  .aisha-avatar-shell .avatar-state-dot {
    animation: none !important;
    transition: none !important;
  }
  .aisha-avatar-shell::after {
    transition: none !important;
  }
}
`;

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan" }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  return (
    <div className={`aisha-avatar-shell state-${safeState}`} data-aisha-state={safeState} data-avatar-engine="bragstack-photo-v3-stable">
      <style>{AVATAR_STYLES}</style>
      <img className="aisha-photo-avatar" src={aishaJordanPhoto} alt={`${name}, BragStack virtual interviewer`} draggable="false" />
      <div className="aisha-photo-vignette" aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`} aria-live="polite">
        <span className="avatar-state-dot" aria-hidden="true" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
    </div>
  );
}
