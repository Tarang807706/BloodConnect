import { describe, it, expect } from 'vitest';
import { evaluateNextStage, EvaluatorCaseState, EvaluatorStageRule, EvaluatorDonorResponse } from '../src/modules/orchestrator/evaluateNextStage';
import { CaseStatus, ResponseType, StageActionType } from '@bloodconnect/shared';

describe('evaluateNextStage Pure Function', () => {
  const baseRule: EvaluatorStageRule = {
    stageNumber: 1,
    timeoutMinutes: 10,
    minResponsesFactor: 1.5,
    autoAdvanceOnTimeout: true,
    actionType: StageActionType.NOTIFY_DONORS,
  };

  const now = new Date('2026-09-30T10:00:00Z');

  const baseCaseState: EvaluatorCaseState = {
    id: 'test-case-1',
    status: CaseStatus.ACTIVE_STAGE_1,
    currentStageNumber: 1,
    shortageUnits: 2,
    unitsFulfilled: 0,
    stageStartedAt: new Date('2026-09-30T09:55:00Z'), // 5 min ago (not timed out)
    requiredBy: new Date('2026-09-30T14:00:00Z'),
  };

  it('should return COMPLETE_FULFILLED when centre-recorded units cover shortage', () => {
    const fulfilledState: EvaluatorCaseState = {
      ...baseCaseState,
      unitsFulfilled: 2,
    };
    const decision = evaluateNextStage(fulfilledState, baseRule, [], now);
    expect(decision.type).toBe('COMPLETE_FULFILLED');
    expect((decision as any).nextStatus).toBe(CaseStatus.FULFILLED);
  });

  it('should return EXPIRE_CASE when requiredBy clinical deadline has passed', () => {
    const expiredState: EvaluatorCaseState = {
      ...baseCaseState,
      requiredBy: new Date('2026-09-30T09:50:00Z'), // in the past
    };
    const decision = evaluateNextStage(expiredState, baseRule, [], now);
    expect(decision.type).toBe('EXPIRE_CASE');
    expect((decision as any).nextStatus).toBe(CaseStatus.EXPIRED);
  });

  it('should return COMPLETE_PARTIALLY_FULFILLED when requiredBy passed but some units were collected', () => {
    const partiallyFulfilledState: EvaluatorCaseState = {
      ...baseCaseState,
      unitsFulfilled: 1,
      requiredBy: new Date('2026-09-30T09:50:00Z'), // in the past
    };
    const decision = evaluateNextStage(partiallyFulfilledState, baseRule, [], now);
    expect(decision.type).toBe('COMPLETE_PARTIALLY_FULFILLED');
    expect((decision as any).nextStatus).toBe(CaseStatus.PARTIALLY_FULFILLED);
  });

  it('should return HOLD_STAGE when willing responses meet threshold and not timed out', () => {
    // 2 units * 1.5 = 3 responses needed
    const responses: EvaluatorDonorResponse[] = [
      { response: ResponseType.I_CAN_HELP, respondedAt: now },
      { response: ResponseType.I_CAN_HELP, respondedAt: now },
      { response: ResponseType.I_CAN_HELP, respondedAt: now },
    ];
    const decision = evaluateNextStage(baseCaseState, baseRule, responses, now);
    expect(decision.type).toBe('HOLD_STAGE');
    expect((decision as any).willingResponsesCount).toBe(3);
  });

  it('should return AWAIT_RESPONSES when within timeout window and responses insufficient', () => {
    const responses: EvaluatorDonorResponse[] = [
      { response: ResponseType.I_CAN_HELP, respondedAt: now },
    ];
    const decision = evaluateNextStage(baseCaseState, baseRule, responses, now);
    expect(decision.type).toBe('AWAIT_RESPONSES');
    expect((decision as any).remainingMinutes).toBe(5);
  });

  it('should ADVANCE_STAGE to Stage 2 when Stage 1 times out with insufficient responses', () => {
    const timedOutState: EvaluatorCaseState = {
      ...baseCaseState,
      stageStartedAt: new Date('2026-09-30T09:45:00Z'), // 15 min ago (timeout was 10 min)
    };
    const decision = evaluateNextStage(timedOutState, baseRule, [], now);
    expect(decision.type).toBe('ADVANCE_STAGE');
    expect((decision as any).nextStageNumber).toBe(2);
    expect((decision as any).nextStatus).toBe(CaseStatus.ACTIVE_STAGE_2);
  });

  it('should ADVANCE_STAGE to Stage 3 (NGO) when Stage 2 times out', () => {
    const stage2State: EvaluatorCaseState = {
      ...baseCaseState,
      status: CaseStatus.ACTIVE_STAGE_2,
      currentStageNumber: 2,
      stageStartedAt: new Date('2026-09-30T09:45:00Z'), // timed out
    };
    const stage2Rule: EvaluatorStageRule = {
      ...baseRule,
      stageNumber: 2,
    };
    const decision = evaluateNextStage(stage2State, stage2Rule, [], now);
    expect(decision.type).toBe('ADVANCE_STAGE');
    expect((decision as any).nextStageNumber).toBe(3);
    expect((decision as any).nextStatus).toBe(CaseStatus.NGO_ACTIVATED);
  });

  it('should ADVANCE_STAGE to Stage 4 (Centres) when Stage 3 times out', () => {
    const stage3State: EvaluatorCaseState = {
      ...baseCaseState,
      status: CaseStatus.NGO_ACTIVATED,
      currentStageNumber: 3,
      stageStartedAt: new Date('2026-09-30T09:40:00Z'), // timed out
    };
    const stage3Rule: EvaluatorStageRule = {
      ...baseRule,
      stageNumber: 3,
      timeoutMinutes: 15,
      actionType: StageActionType.ACTIVATE_NGO,
    };
    const decision = evaluateNextStage(stage3State, stage3Rule, [], now);
    expect(decision.type).toBe('ADVANCE_STAGE');
    expect((decision as any).nextStageNumber).toBe(4);
    expect((decision as any).nextStatus).toBe(CaseStatus.ESCALATED);
  });
});
