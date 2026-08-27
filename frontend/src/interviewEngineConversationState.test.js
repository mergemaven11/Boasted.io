import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_INTERVIEW_CONVERSATION,
  INTERVIEW_PHASES,
  avatarStateForInterviewPhase,
  canTransitionInterviewPhase,
  interviewConversationReducer,
} from "./interviewConversationState.js";

test("interview conversation follows the intended turn-taking lifecycle", () => {
  let state = { ...INITIAL_INTERVIEW_CONVERSATION };
  const lifecycle = [
    INTERVIEW_PHASES.GREETING,
    INTERVIEW_PHASES.ASKING,
    INTERVIEW_PHASES.LISTENING,
    INTERVIEW_PHASES.REVIEWING,
    INTERVIEW_PHASES.TRANSITION,
    INTERVIEW_PHASES.ASKING,
    INTERVIEW_PHASES.LISTENING,
  ];

  for (const phase of lifecycle) {
    state = interviewConversationReducer(state, { type: "TRANSITION", phase });
    assert.equal(state.phase, phase);
  }

  assert.equal(state.transitionCount, lifecycle.length);
});

test("invalid phase jumps are rejected instead of desynchronizing the interview", () => {
  const listening = { phase: INTERVIEW_PHASES.LISTENING, transitionCount: 3 };
  const next = interviewConversationReducer(listening, {
    type: "TRANSITION",
    phase: INTERVIEW_PHASES.GREETING,
  });

  assert.deepEqual(next, listening);
  assert.equal(canTransitionInterviewPhase(INTERVIEW_PHASES.LISTENING, INTERVIEW_PHASES.GREETING), false);
});

test("reset always returns the conversation to idle", () => {
  const next = interviewConversationReducer(
    { phase: INTERVIEW_PHASES.REVIEWING, transitionCount: 9 },
    { type: "RESET" },
  );

  assert.deepEqual(next, INITIAL_INTERVIEW_CONVERSATION);
});

test("conversation phases drive intentional avatar motion states", () => {
  assert.equal(avatarStateForInterviewPhase(INTERVIEW_PHASES.GREETING), "greeting");
  assert.equal(avatarStateForInterviewPhase(INTERVIEW_PHASES.ASKING), "asking");
  assert.equal(avatarStateForInterviewPhase(INTERVIEW_PHASES.LISTENING), "listening");
  assert.equal(avatarStateForInterviewPhase(INTERVIEW_PHASES.REVIEWING), "thinking");
  assert.equal(avatarStateForInterviewPhase(INTERVIEW_PHASES.TRANSITION), "encouraging");
  assert.equal(avatarStateForInterviewPhase(INTERVIEW_PHASES.IDLE), "idle");
});
