import { CaseStatus, RequestStatus, StageActionType } from '@bloodconnect/shared';
import { AppError } from '../../common/errors/AppError';

export const VALID_CASE_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  [CaseStatus.ACTIVE_STAGE_1]: [
    CaseStatus.ACTIVE_STAGE_2,
    CaseStatus.PAUSED,
    CaseStatus.FULFILLED,
    CaseStatus.PARTIALLY_FULFILLED,
    CaseStatus.EXPIRED,
    CaseStatus.CANCELLED,
  ],
  [CaseStatus.ACTIVE_STAGE_2]: [
    CaseStatus.NGO_ACTIVATED,
    CaseStatus.PAUSED,
    CaseStatus.FULFILLED,
    CaseStatus.PARTIALLY_FULFILLED,
    CaseStatus.EXPIRED,
    CaseStatus.CANCELLED,
  ],
  [CaseStatus.NGO_ACTIVATED]: [
    CaseStatus.ESCALATED,
    CaseStatus.PAUSED,
    CaseStatus.FULFILLED,
    CaseStatus.PARTIALLY_FULFILLED,
    CaseStatus.EXPIRED,
    CaseStatus.CANCELLED,
  ],
  [CaseStatus.ESCALATED]: [
    CaseStatus.PAUSED,
    CaseStatus.FULFILLED,
    CaseStatus.PARTIALLY_FULFILLED,
    CaseStatus.EXPIRED,
    CaseStatus.CANCELLED,
  ],
  [CaseStatus.PAUSED]: [
    CaseStatus.ACTIVE_STAGE_1,
    CaseStatus.ACTIVE_STAGE_2,
    CaseStatus.NGO_ACTIVATED,
    CaseStatus.ESCALATED,
    CaseStatus.CANCELLED,
    CaseStatus.CLOSED,
  ],
  [CaseStatus.FULFILLED]: [CaseStatus.CLOSED],
  [CaseStatus.PARTIALLY_FULFILLED]: [CaseStatus.CLOSED],
  [CaseStatus.EXPIRED]: [CaseStatus.CLOSED],
  [CaseStatus.CANCELLED]: [CaseStatus.CLOSED],
  [CaseStatus.CLOSED]: [], // Terminal
};

export function assertValidTransition(currentStatus: CaseStatus, nextStatus: CaseStatus): void {
  const allowed = VALID_CASE_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw AppError.badRequest(
      `Invalid case status transition from '${currentStatus}' to '${nextStatus}'.`
    );
  }
}

export function isTerminalStatus(status: CaseStatus): boolean {
  return [CaseStatus.CLOSED, CaseStatus.CANCELLED, CaseStatus.EXPIRED].includes(status);
}

export function isActiveStatus(status: CaseStatus): boolean {
  return [
    CaseStatus.ACTIVE_STAGE_1,
    CaseStatus.ACTIVE_STAGE_2,
    CaseStatus.NGO_ACTIVATED,
    CaseStatus.ESCALATED,
  ].includes(status);
}
