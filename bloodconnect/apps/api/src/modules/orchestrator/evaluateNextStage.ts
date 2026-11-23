import { CaseStatus, ResponseType, StageActionType } from '@bloodconnect/shared';

export interface EvaluatorCaseState {
  id: string;
  status: CaseStatus;
  currentStageNumber: number;
  shortageUnits: number;
  unitsFulfilled: number;
  stageStartedAt: Date | string;
  requiredBy: Date | string;
}

export interface EvaluatorStageRule {
  stageNumber: number;
  timeoutMinutes: number;
  minResponsesFactor: number;
  autoAdvanceOnTimeout: boolean;
  actionType: StageActionType;
}

export interface EvaluatorDonorResponse {
  response: ResponseType;
  respondedAt: Date | string;
}

export type NextStageDecisionAction =
  | { type: 'NO_OP'; reason: string }
  | { type: 'COMPLETE_FULFILLED'; nextStatus: CaseStatus.FULFILLED; reason: string }
  | { type: 'COMPLETE_PARTIALLY_FULFILLED'; nextStatus: CaseStatus.PARTIALLY_FULFILLED; reason: string }
  | { type: 'EXPIRE_CASE'; nextStatus: CaseStatus.EXPIRED; reason: string }
  | { type: 'ADVANCE_STAGE'; nextStageNumber: number; nextStatus: CaseStatus; reason: string }
  | { type: 'HOLD_STAGE'; reason: string; willingResponsesCount: number; neededCount: number }
  | { type: 'AWAIT_RESPONSES'; remainingMinutes: number; willingResponsesCount: number; neededCount: number };

/**
 * Pure function: evaluateNextStage
 * Contains ZERO I/O, ZERO database access.
 * Deterministic and 100% unit-testable.
 */
export function evaluateNextStage(
  caseState: EvaluatorCaseState,
  rule: EvaluatorStageRule,
  responses: EvaluatorDonorResponse[],
  currentTime: Date = new Date()
): NextStageDecisionAction {
  // 1. Fulfilled check: Blood centre recorded donations cover shortage
  if (caseState.unitsFulfilled >= caseState.shortageUnits && caseState.shortageUnits > 0) {
    return {
      type: 'COMPLETE_FULFILLED',
      nextStatus: CaseStatus.FULFILLED,
      reason: `Case shortage of ${caseState.shortageUnits} units fully fulfilled (${caseState.unitsFulfilled} recorded).`,
    };
  }

  const nowMs = currentTime.getTime();
  const requiredByMs = new Date(caseState.requiredBy).getTime();

  // 2. Expiry check: Required time has passed
  if (nowMs >= requiredByMs) {
    if (caseState.unitsFulfilled > 0) {
      return {
        type: 'COMPLETE_PARTIALLY_FULFILLED',
        nextStatus: CaseStatus.PARTIALLY_FULFILLED,
        reason: `Required time elapsed. Partially fulfilled with ${caseState.unitsFulfilled}/${caseState.shortageUnits} units.`,
      };
    }
    return {
      type: 'EXPIRE_CASE',
      nextStatus: CaseStatus.EXPIRED,
      reason: `Required clinical deadline passed (${new Date(caseState.requiredBy).toISOString()}) without fulfillment.`,
    };
  }

  // 3. Status guard: only active cases evaluate progression
  const activeStatuses = [
    CaseStatus.ACTIVE_STAGE_1,
    CaseStatus.ACTIVE_STAGE_2,
    CaseStatus.NGO_ACTIVATED,
    CaseStatus.ESCALATED,
  ];

  if (!activeStatuses.includes(caseState.status)) {
    return {
      type: 'NO_OP',
      reason: `Case is in inactive status '${caseState.status}'. No progression evaluated.`,
    };
  }

  // 4. Willing response count calculation
  const willingResponsesCount = responses.filter(r => r.response === ResponseType.I_CAN_HELP).length;
  const neededCount = Math.ceil(caseState.shortageUnits * rule.minResponsesFactor);

  const stageStartedMs = new Date(caseState.stageStartedAt).getTime();
  const elapsedMinutes = (nowMs - stageStartedMs) / (60 * 1000);
  const remainingMinutes = Math.max(0, Math.round(rule.timeoutMinutes - elapsedMinutes));
  const isTimedOut = elapsedMinutes >= rule.timeoutMinutes;

  // 5. If sufficient willing donors responded and we are within timeout window
  if (willingResponsesCount >= neededCount && !isTimedOut) {
    return {
      type: 'HOLD_STAGE',
      reason: `Adequate potential donor responses received (${willingResponsesCount}/${neededCount} needed). Waiting for physical blood centre screening and donations.`,
      willingResponsesCount,
      neededCount,
    };
  }

  // 6. Timeout escalation: If stage timeout exceeded and auto-advance is enabled
  if (isTimedOut && rule.autoAdvanceOnTimeout) {
    if (caseState.currentStageNumber === 1) {
      return {
        type: 'ADVANCE_STAGE',
        nextStageNumber: 2,
        nextStatus: CaseStatus.ACTIVE_STAGE_2,
        reason: `Stage 1 timeout (${rule.timeoutMinutes} min) reached with insufficient willing responses (${willingResponsesCount}/${neededCount}). Escalating to Stage 2 (expanded radius).`,
      };
    }

    if (caseState.currentStageNumber === 2) {
      return {
        type: 'ADVANCE_STAGE',
        nextStageNumber: 3,
        nextStatus: CaseStatus.NGO_ACTIVATED,
        reason: `Stage 2 timeout (${rule.timeoutMinutes} min) reached with insufficient willing responses (${willingResponsesCount}/${neededCount}). Activating emergency NGO volunteer network.`,
      };
    }

    if (caseState.currentStageNumber === 3) {
      return {
        type: 'ADVANCE_STAGE',
        nextStageNumber: 4,
        nextStatus: CaseStatus.ESCALATED,
        reason: `Stage 3 NGO network timeout (${rule.timeoutMinutes} min) reached. Escalating case to secondary regional blood centres.`,
      };
    }

    return {
      type: 'HOLD_STAGE',
      reason: `Case has already reached highest escalation stage (${caseState.currentStageNumber}). Continues active monitoring.`,
      willingResponsesCount,
      neededCount,
    };
  }

  // 7. Waiting for responses
  return {
    type: 'AWAIT_RESPONSES',
    remainingMinutes,
    willingResponsesCount,
    neededCount,
  };
}
