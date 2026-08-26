import aishaJordanPhoto from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  speaking: "Aisha is speaking",
  listening: "Listening to you",
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
  transform: scale(1.04);
  transform-origin: 50% 45%;
  will-change: transform, filter;
  user-select: none;
  pointer-events: none;
}
.aisha-photo-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(4,8,18,.02) 45%, rgba(4,8,18,.78) 100%),
    radial-gradient(circle at 50% 38%, transparent 48%, rgba(4,8,18,.2) 100%);
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
  background: rgba(7,16,31,.72);
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
.aisha-avatar-shell.state-speaking .aisha-photo-avatar {
  animation: aishaSpeaking 1.6s ease-in-out infinite;
}
.aisha-avatar-shell.state-listening .aisha-photo-avatar {
  animation: aishaListening 2.6s ease-in-out infinite;
}
.aisha-avatar-shell.state-thinking .aisha-photo-avatar {
  animation: aishaThinking 2.2s ease-in-out infinite;
  filter: saturate(.96) brightness(.96);
}
.aisha-avatar-shell.state-encouraging .aisha-photo-avatar {
  animation: aishaEncouraging 1.9s ease-in-out infinite;
}
.aisha-avatar-shell.state-speaking .avatar-state-dot {
  animation: aishaPulse .85s ease-in-out infinite;
  background: #c4b5fd;
}
.aisha-avatar-shell.state-listening .avatar-state-dot {
  animation: aishaPulse 1.1s ease-in-out infinite;
  background: #6ee7b7;
  box-shadow: 0 0 0 4px rgba(110,231,183,.14);
}
.aisha-avatar-shell.state-thinking .avatar-state-dot { background: #fcd34d; }
.aisha-avatar-shell.state-encouraging .avatar-state-dot { background: #f9a8d4; }
@keyframes aishaSpeaking {
  0%,100% { transform: scale(1.045) translate3d(0,0,0) rotate(0deg); }
  30% { transform: scale(1.065) translate3d(.25%, -.35%, 0) rotate(.18deg); }
  60% { transform: scale(1.055) translate3d(-.2%, .2%, 0) rotate(-.14deg); }
}
@keyframes aishaListening {
  0%,100% { transform: scale(1.045) translate3d(0,0,0); }
  50% { transform: scale(1.06) translate3d(-.35%, -.25%, 0); }
}
@keyframes aishaThinking {
  0%,100% { transform: scale(1.045) translate3d(0,0,0); }
  50% { transform: scale(1.055) translate3d(.45%, -.15%, 0); }
}
@keyframes aishaEncouraging {
  0%,100% { transform: scale(1.045) translate3d(0,0,0) rotate(0deg); }
  50% { transform: scale(1.065) translate3d(0,-.35%,0) rotate(.22deg); }
}
@keyframes aishaPulse {
  0%,100% { transform: scale(.9); opacity: .78; }
  50% { transform: scale(1.22); opacity: 1; }
}
@media (max-width: 950px) {
  .aisha-photo-avatar { object-position: center 25%; }
}
@media (max-width: 620px) {
  .aisha-photo-avatar { object-position: center 22%; transform: scale(1.08); }
  .avatar-state-pill { left: 10px; top: 10px; max-width: calc(100% - 20px); padding: 7px 9px; }
}
@media (prefers-reduced-motion: reduce) {
  .aisha-avatar-shell .aisha-photo-avatar,
  .aisha-avatar-shell .avatar-state-dot {
    animation: none !important;
    transition: none !important;
  }
}
`;

export default function AnimatedInterviewerAvatar({ state = "idle", name = "Aisha Jordan" }) {
  const safeState = STATE_COPY[state] ? state : "idle";
  return (
    <div className={`aisha-avatar-shell state-${safeState}`} data-aisha-state={safeState} data-avatar-engine="bragstack-photo-v2">
      <style>{AVATAR_STYLES}</style>
      <img className="aisha-photo-avatar" src={aishaJordanPhoto} alt={`${name}, BragStack virtual interviewer`} draggable="false" />
      <div className="aisha-photo-vignette" aria-hidden="true" />
      <div className={`avatar-state-pill state-${safeState}`} aria-live="polite">
        <span className="avatar-state-dot" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
    </div>
  );
}
