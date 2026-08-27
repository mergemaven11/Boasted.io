export const INTERVIEW_PHASES = Object.freeze({
  IDLE: "idle",
  GREETING: "greeting",
  ASKING: "asking",
  LISTENING: "listening",
  REVIEWING: "reviewing",
  TRANSITION: "transition",
});

const VALID_PHASES = new Set(Object.values(INTERVIEW_PHASES));

const ALLOWED_TRANSITIONS = Object.freeze({
  [INTERVIEW_PHASES.IDLE]: new Set([INTERVIEW_PHASES.GREETING, INTERVIEW_PHASES.ASKING]),
  [INTERVIEW_PHASES.GREETING]: new Set([INTERVIEW_PHASES.GREETING, INTERVIEW_PHASES.ASKING, INTERVIEW_PHASES.IDLE]),
  [INTERVIEW_PHASES.ASKING]: new Set([INTERVIEW_PHASES.ASKING, INTERVIEW_PHASES.LISTENING, INTERVIEW_PHASES.IDLE]),
  [INTERVIEW_PHASES.LISTENING]: new Set([INTERVIEW_PHASES.LISTENING, INTERVIEW_PHASES.ASKING, INTERVIEW_PHASES.REVIEWING, INTERVIEW_PHASES.IDLE]),
  [INTERVIEW_PHASES.REVIEWING]: new Set([INTERVIEW_PHASES.REVIEWING, INTERVIEW_PHASES.TRANSITION, INTERVIEW_PHASES.IDLE]),
  [INTERVIEW_PHASES.TRANSITION]: new Set([INTERVIEW_PHASES.TRANSITION, INTERVIEW_PHASES.ASKING, INTERVIEW_PHASES.IDLE]),
});

export const INITIAL_INTERVIEW_CONVERSATION = Object.freeze({
  phase: INTERVIEW_PHASES.IDLE,
  transitionCount: 0,
});

export function canTransitionInterviewPhase(fromPhase, toPhase) {
  if (!VALID_PHASES.has(toPhase)) return false;
  if (fromPhase === toPhase) return true;
  const allowed = ALLOWED_TRANSITIONS[fromPhase];
  return Boolean(allowed?.has(toPhase));
}

export function interviewConversationReducer(state = INITIAL_INTERVIEW_CONVERSATION, action = {}) {
  if (action.type === "RESET") return { ...INITIAL_INTERVIEW_CONVERSATION };
  if (action.type !== "TRANSITION") return state;

  const nextPhase = action.phase;
  if (!canTransitionInterviewPhase(state.phase, nextPhase)) return state;
  if (nextPhase === state.phase) return state;

  return {
    ...state,
    phase: nextPhase,
    transitionCount: state.transitionCount + 1,
  };
}

export function avatarStateForInterviewPhase(phase) {
  if (phase === INTERVIEW_PHASES.GREETING) return "greeting";
  if (phase === INTERVIEW_PHASES.ASKING) return "asking";
  if (phase === INTERVIEW_PHASES.LISTENING) return "listening";
  if (phase === INTERVIEW_PHASES.REVIEWING) return "thinking";
  if (phase === INTERVIEW_PHASES.TRANSITION) return "encouraging";
  return "idle";
}
