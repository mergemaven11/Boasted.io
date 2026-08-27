import aishaJordanPhoto from "./assets/aisha-jordan-interviewer.jpg";

const STATE_COPY = {
  idle: "Ready when you are",
  greeting: "Aisha is introducing the interview",
  asking: "Aisha is asking the question",
  speaking: "Aisha is speaking",
  listening: "Your turn — listening",
  thinking: "Reviewing your answer",
  encouraging: "Preparing the next step",
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
.aisha-avatar-shell.state-speaking::after,
.aisha-avatar-shell.state-greeting::after,
.aisha-avatar-shell.state-asking::after {
  border-color: rgba(196,181,253,.28);
  box-shadow: inset 0 0 38px rgba(139,92,246,.10);
  animation: aishaFrameBreathe 1.8s ease-in-out infinite;
}
.aisha-avatar-shell.state-listening::after {
  border-color: rgba(110,231,183,.32);
  box-shadow: inset 0 0 38px rgba(16,185,129,.10);
  animation: aishaFrameBreathe 2.2s ease-in-out infinite;
}
.aisha-avatar-shell.state-thinking::after {
  border-color: rgba(252,211,77,.24);
  box-shadow: inset 0 0 32px rgba(245,158,11,.07);
}
.aisha-avatar-shell.state-encouraging::after {
  border-color: rgba(249,168,212,.24);
  box-shadow: inset 0 0 32px rgba(236,72,153,.07);
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
.aisha-avatar-shell.state-speaking .avatar-state-dot,
.aisha-avatar-shell.state-greeting .avatar-state-dot,
.aisha-avatar-shell.state-asking .avatar-state-dot {
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

.avatar-motion-field {
  position: absolute;
  right: 16px;
  bottom: 18px;
  z-index: 4;
  width: 54px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 999px;
  background: rgba(7,16,31,.62);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 22px rgba(0,0,0,.22);
}
.avatar-motion-field span {
  display: block;
  width: 4px;
  height: 6px;
  border-radius: 999px;
  background: rgba(199,210,254,.78);
  transform-origin: center;
}
.aisha-avatar-shell.state-speaking .avatar-motion-field span,
.aisha-avatar-shell.state-greeting .avatar-motion-field span,
.aisha-avatar-shell.state-asking .avatar-motion-field span {
  background: #c4b5fd;
  animation: aishaSpeechBar .72s ease-in-out infinite;
}
.aisha-avatar-shell.state-speaking .avatar-motion-field span:nth-child(2),
.aisha-avatar-shell.state-greeting .avatar-motion-field span:nth-child(2),
.aisha-avatar-shell.state-asking .avatar-motion-field span:nth-child(2) { animation-delay: -.48s; }
.aisha-avatar-shell.state-speaking .avatar-motion-field span:nth-child(3),
.aisha-avatar-shell.state-greeting .avatar-motion-field span:nth-child(3),
.aisha-avatar-shell.state-asking .avatar-motion-field span:nth-child(3) { animation-delay: -.26s; }
.aisha-avatar-shell.state-speaking .avatar-motion-field span:nth-child(4),
.aisha-avatar-shell.state-greeting .avatar-motion-field span:nth-child(4),
.aisha-avatar-shell.state-asking .avatar-motion-field span:nth-child(4) { animation-delay: -.58s; }
.aisha-avatar-shell.state-listening .avatar-motion-field {
  border-color: rgba(110,231,183,.24);
  animation: aishaListeningHalo 1.65s ease-out infinite;
}
.aisha-avatar-shell.state-listening .avatar-motion-field span {
  width: 5px;
  height: 5px;
  background: #6ee7b7;
  animation: aishaListeningDot 1.35s ease-in-out infinite;
}
.aisha-avatar-shell.state-listening .avatar-motion-field span:nth-child(2) { animation-delay: -.9s; }
.aisha-avatar-shell.state-listening .avatar-motion-field span:nth-child(3) { animation-delay: -.45s; }
.aisha-avatar-shell.state-listening .avatar-motion-field span:nth-child(4) { display: none; }
.aisha-avatar-shell.state-thinking .avatar-motion-field span {
  width: 5px;
  height: 5px;
  background: #fcd34d;
  animation: aishaThinkingDot 1.25s ease-in-out infinite;
}
.aisha-avatar-shell.state-thinking .avatar-motion-field span:nth-child(2) { animation-delay: .16s; }
.aisha-avatar-shell.state-thinking .avatar-motion-field span:nth-child(3) { animation-delay: .32s; }
.aisha-avatar-shell.state-thinking .avatar-motion-field span:nth-child(4) { display: none; }
.aisha-avatar-shell.state-encouraging .avatar-motion-field span {
  background: #f9a8d4;
  animation: aishaEncourageBar 1.5s ease-in-out infinite;
}
.aisha-avatar-shell.state-encouraging .avatar-motion-field span:nth-child(2) { animation-delay: -.5s; }
.aisha-avatar-shell.state-encouraging .avatar-motion-field span:nth-child(3) { animation-delay: -.9s; }

@keyframes aishaPulse {
  0%,100% { transform: scale(.9); opacity: .78; }
  50% { transform: scale(1.22); opacity: 1; }
}
@keyframes aishaFrameBreathe {
  0%,100% { opacity: .82; }
  50% { opacity: 1; }
}
@keyframes aishaSpeechBar {
  0%,100% { transform: scaleY(.65); opacity: .7; }
  50% { transform: scaleY(3.1); opacity: 1; }
}
@keyframes aishaListeningHalo {
  0% { box-shadow: 0 0 0 0 rgba(110,231,183,.18), 0 8px 22px rgba(0,0,0,.22); }
  70% { box-shadow: 0 0 0 8px rgba(110,231,183,0), 0 8px 22px rgba(0,0,0,.22); }
  100% { box-shadow: 0 0 0 0 rgba(110,231,183,0), 0 8px 22px rgba(0,0,0,.22); }
}
@keyframes aishaListeningDot {
  0%,100% { transform: scale(.72); opacity: .55; }
  50% { transform: scale(1.05); opacity: 1; }
}
@keyframes aishaThinkingDot {
  0%,60%,100% { transform: translateY(0); opacity: .48; }
  30% { transform: translateY(-4px); opacity: 1; }
}
@keyframes aishaEncourageBar {
  0%,100% { transform: scaleY(.8); opacity: .65; }
  50% { transform: scaleY(1.8); opacity: 1; }
}
@media (max-width: 950px) {
  .aisha-photo-avatar { object-position: center 25%; }
}
@media (max-width: 620px) {
  .aisha-photo-avatar { object-position: center 22%; }
  .avatar-state-pill { left: 10px; top: 10px; max-width: calc(100% - 20px); padding: 7px 9px; }
  .avatar-motion-field { right: 10px; bottom: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .aisha-avatar-shell .avatar-state-dot,
  .aisha-avatar-shell .avatar-motion-field,
  .aisha-avatar-shell .avatar-motion-field span,
  .aisha-avatar-shell::after {
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
        <span className="avatar-state-dot" aria-hidden="true" />
        <strong>{STATE_COPY[safeState]}</strong>
      </div>
      <div className="avatar-motion-field" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
    </div>
  );
}
