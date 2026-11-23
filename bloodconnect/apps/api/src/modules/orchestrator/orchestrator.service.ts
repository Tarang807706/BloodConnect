import { dbStore, EmergencyCaseRecord } from '../../data/dbStore';
import { assertValidTransition } from './stateMachine';
import { evaluateNextStage } from './evaluateNextStage';
import { StageRunner } from './stageRunner';
import { scheduler } from '../../jobs/pgBossScheduler';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { AppError } from '../../common/errors/AppError';
import { logger } from '../../common/logger/pino';
import {
  CaseStatus,
  RequestStatus,
  ResponseType,
  DonationOutcomeType,
  UserRole,
} from '@bloodconnect/shared';

export class OrchestratorService {
  /**
   * Initializes background scheduler hook.
   */
  static initScheduler() {
    scheduler.setHandler(async (caseId: string, stageNumber: number) => {
      await OrchestratorService.handleStageTimeout(caseId, stageNumber);
    });
  }

  /**
   * Activate Emergency Case from verified request
   */
  static async activateCase(params: {
    requestId: string;
    bloodCentreOrgId: string;
    actorUserId: string;
    customStage1RadiusKm?: number;
    notes?: string;
  }): Promise<EmergencyCaseRecord> {
    const request = await dbStore.emergencyRequests.findUnique(params.requestId);
    if (!request) {
      throw AppError.notFound('Emergency request not found');
    }

    if (request.status !== RequestStatus.VERIFIED) {
      throw AppError.badRequest(`Cannot activate case: Request is in status '${request.status}', expected 'VERIFIED'`);
    }

    if (request.bloodCentreId !== params.bloodCentreOrgId) {
      throw AppError.forbidden('Only the assigned regional blood centre can activate coordination for this request');
    }

    // Check if case already exists
    const existingCase = await dbStore.emergencyCases.findByRequestId(params.requestId);
    if (existingCase) {
      throw AppError.conflict('An emergency case has already been activated for this request');
    }

    // Fetch verification details to determine confirmed shortage
    const verification = await dbStore.requestVerifications.findUniqueByRequestId(params.requestId);
    const shortageUnits = verification ? verification.shortageUnits : request.unitsNeeded;

    if (shortageUnits <= 0) {
      throw AppError.badRequest('Cannot activate coordination case when shortage is zero');
    }

    // Create Emergency Case
    const theCase = await dbStore.emergencyCases.create({
      requestId: request.id,
      bloodCentreId: params.bloodCentreOrgId,
      shortageUnits,
      unitsFulfilled: 0,
      status: CaseStatus.ACTIVE_STAGE_1,
      currentStageNumber: 1,
    });

    // Record Case Status History
    await dbStore.caseStatusHistory.create({
      caseId: theCase.id,
      fromStatus: null,
      toStatus: CaseStatus.ACTIVE_STAGE_1,
      reason: params.notes || 'Emergency coordination activated by blood centre',
      actorUserId: params.actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
    });

    // Audit Log
    await AuditService.log({
      actorUserId: params.actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
      action: 'CASE_ACTIVATED',
      targetEntity: 'emergency_cases',
      targetId: theCase.id,
      details: { requestId: request.id, shortageUnits },
    });

    // Run Stage 1 side effects (donor matching + timer scheduling)
    await StageRunner.runStage(theCase, 1);

    return theCase;
  }

  /**
   * Process a Donor Response ("I Can Help" / "Cannot Help")
   */
  static async handleDonorResponse(params: {
    caseId: string;
    donorProfileId: string;
    response: ResponseType;
    estimatedArrivalMinutes?: number | null;
    notes?: string;
  }): Promise<void> {
    const theCase = await dbStore.emergencyCases.findUnique(params.caseId);
    if (!theCase) {
      throw AppError.notFound('Emergency case not found');
    }

    // Response is only permitted on open active cases
    const openStatuses = [
      CaseStatus.ACTIVE_STAGE_1,
      CaseStatus.ACTIVE_STAGE_2,
      CaseStatus.NGO_ACTIVATED,
      CaseStatus.ESCALATED,
    ];
    if (!openStatuses.includes(theCase.status)) {
      throw AppError.badRequest(`Cannot submit response: Case is currently in status '${theCase.status}'`);
    }

    // Upsert donor response (idempotent)
    await dbStore.donorResponses.upsertResponse({
      caseId: params.caseId,
      donorProfileId: params.donorProfileId,
      response: params.response,
      estimatedArrivalMinutes: params.estimatedArrivalMinutes,
      notes: params.notes,
      acknowledgedDisclaimer: true,
    });

    // Audit Log
    const donor = await dbStore.donorProfiles.findUnique(params.donorProfileId);
    if (donor) {
      await AuditService.log({
        actorUserId: donor.userId,
        actorRole: UserRole.DONOR,
        action: 'DONOR_RESPONDED',
        targetEntity: 'emergency_cases',
        targetId: theCase.id,
        details: { response: params.response },
      });

      // Send Acknowledgement
      const donorUser = await dbStore.users.findUnique({ where: { id: donor.userId } });
      if (donorUser) {
        await NotificationService.sendResponseAcknowledgement({
          userId: donorUser.id,
          email: donorUser.email,
          caseId: theCase.id,
          canHelp: params.response === ResponseType.I_CAN_HELP,
        });
      }
    }

    // Evaluate progression after response
    await OrchestratorService.evaluateAndProgress(theCase.id);
  }

  /**
   * Stage Timeout Handler (Triggered by Timer or Sweeper)
   */
  static async handleStageTimeout(caseId: string, stageNumber: number): Promise<void> {
    const theCase = await dbStore.emergencyCases.findUnique(caseId);
    if (!theCase) return;

    // Concurrency check: Ensure case is still on the same stage and active
    if (theCase.currentStageNumber !== stageNumber) {
      logger.info({ caseId, currentStage: theCase.currentStageNumber, timeoutStage: stageNumber }, 'Stage timeout ignored: Case already advanced');
      return;
    }

    const activeStatuses = [
      CaseStatus.ACTIVE_STAGE_1,
      CaseStatus.ACTIVE_STAGE_2,
      CaseStatus.NGO_ACTIVATED,
    ];
    if (!activeStatuses.includes(theCase.status)) {
      logger.info({ caseId, status: theCase.status }, 'Stage timeout ignored: Case not in active state');
      return;
    }

    logger.info({ caseId, stageNumber }, 'Processing stage timeout evaluation');
    await OrchestratorService.evaluateAndProgress(caseId);
  }

  /**
   * Core Transition Evaluator: Runs pure evaluateNextStage and executes DB state transitions
   */
  static async evaluateAndProgress(caseId: string): Promise<void> {
    const theCase = await dbStore.emergencyCases.findUnique(caseId);
    if (!theCase) return;

    const request = await dbStore.emergencyRequests.findUnique(theCase.requestId);
    if (!request) return;

    const currentStage = await dbStore.caseStages.getCurrentStage(caseId);
    const rule = await dbStore.caseStageRules.findByStageNumber(theCase.currentStageNumber) || {
      id: `rule-${theCase.currentStageNumber}`,
      stageNumber: theCase.currentStageNumber,
      actionType: theCase.currentStageNumber === 3 ? 'ACTIVATE_NGO' as any : 'NOTIFY_DONORS' as any,
      radiusKm: theCase.currentStageNumber === 1 ? 5 : 15,
      timeoutMinutes: 10,
      minResponsesFactor: 1.5,
      autoAdvanceOnTimeout: true,
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    const responses = await dbStore.donorResponses.findByCaseId(caseId);

    // Call pure function evaluateNextStage
    const decision = evaluateNextStage(
      {
        id: theCase.id,
        status: theCase.status,
        currentStageNumber: theCase.currentStageNumber,
        shortageUnits: theCase.shortageUnits,
        unitsFulfilled: theCase.unitsFulfilled,
        stageStartedAt: currentStage ? currentStage.startedAt : theCase.createdAt,
        requiredBy: request.requiredBy,
      },
      rule,
      responses.map(r => ({ response: r.response, respondedAt: r.respondedAt }))
    );

    logger.info({ caseId, decisionType: decision.type, reason: (decision as any).reason }, 'Orchestrator decision');

    if (decision.type === 'ADVANCE_STAGE') {
      assertValidTransition(theCase.status, decision.nextStatus);

      // Execute transition
      const previousStatus = theCase.status;
      await dbStore.emergencyCases.update(caseId, {
        status: decision.nextStatus,
        currentStageNumber: decision.nextStageNumber,
      });

      await dbStore.caseStatusHistory.create({
        caseId,
        fromStatus: previousStatus,
        toStatus: decision.nextStatus,
        reason: decision.reason,
        actorRole: 'SYSTEM_ORCHESTRATOR',
      });

      await AuditService.log({
        action: 'STAGE_ADVANCED',
        targetEntity: 'emergency_cases',
        targetId: caseId,
        details: {
          fromStage: theCase.currentStageNumber,
          toStage: decision.nextStageNumber,
          status: decision.nextStatus,
          reason: decision.reason,
        },
      });

      // Execute side-effects of new stage
      const updatedCase = await dbStore.emergencyCases.findUnique(caseId);
      if (updatedCase) {
        await StageRunner.runStage(updatedCase, decision.nextStageNumber);
      }
    } else if (decision.type === 'COMPLETE_FULFILLED' || decision.type === 'COMPLETE_PARTIALLY_FULFILLED') {
      assertValidTransition(theCase.status, decision.nextStatus);

      scheduler.cancelCaseTimers(caseId);

      await dbStore.emergencyCases.update(caseId, {
        status: decision.nextStatus,
      });

      await dbStore.caseStatusHistory.create({
        caseId,
        fromStatus: theCase.status,
        toStatus: decision.nextStatus,
        reason: decision.reason,
        actorRole: 'SYSTEM_ORCHESTRATOR',
      });

      await AuditService.log({
        action: 'CASE_FULFILLED',
        targetEntity: 'emergency_cases',
        targetId: caseId,
        details: { status: decision.nextStatus, unitsFulfilled: theCase.unitsFulfilled },
      });
    } else if (decision.type === 'EXPIRE_CASE') {
      assertValidTransition(theCase.status, decision.nextStatus);

      scheduler.cancelCaseTimers(caseId);

      await dbStore.emergencyCases.update(caseId, {
        status: decision.nextStatus,
      });

      await dbStore.caseStatusHistory.create({
        caseId,
        fromStatus: theCase.status,
        toStatus: decision.nextStatus,
        reason: decision.reason,
        actorRole: 'SYSTEM_ORCHESTRATOR',
      });

      await AuditService.log({
        action: 'CASE_EXPIRED',
        targetEntity: 'emergency_cases',
        targetId: caseId,
        details: { reason: decision.reason },
      });
    }
  }

  /**
   * Manual Pause
   */
  static async pauseCase(params: {
    caseId: string;
    reason: string;
    actorUserId: string;
    actorRole: UserRole;
  }): Promise<EmergencyCaseRecord> {
    const theCase = await dbStore.emergencyCases.findUnique(params.caseId);
    if (!theCase) throw AppError.notFound('Case not found');

    assertValidTransition(theCase.status, CaseStatus.PAUSED);

    scheduler.cancelCaseTimers(theCase.id);

    const updated = await dbStore.emergencyCases.update(theCase.id, {
      status: CaseStatus.PAUSED,
      pausedFromStatus: theCase.status,
      pauseReason: params.reason,
    });

    await dbStore.caseStatusHistory.create({
      caseId: theCase.id,
      fromStatus: theCase.status,
      toStatus: CaseStatus.PAUSED,
      reason: params.reason,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
    });

    await AuditService.log({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: 'CASE_PAUSED',
      targetEntity: 'emergency_cases',
      targetId: theCase.id,
      details: { reason: params.reason, pausedFromStatus: theCase.status },
    });

    return updated;
  }

  /**
   * Manual Resume
   */
  static async resumeCase(params: {
    caseId: string;
    actorUserId: string;
    actorRole: UserRole;
  }): Promise<EmergencyCaseRecord> {
    const theCase = await dbStore.emergencyCases.findUnique(params.caseId);
    if (!theCase) throw AppError.notFound('Case not found');

    if (theCase.status !== CaseStatus.PAUSED || !theCase.pausedFromStatus) {
      throw AppError.badRequest('Case is not currently paused');
    }

    const resumeTo = theCase.pausedFromStatus;
    assertValidTransition(CaseStatus.PAUSED, resumeTo);

    const updated = await dbStore.emergencyCases.update(theCase.id, {
      status: resumeTo,
      pausedFromStatus: null,
      pauseReason: null,
    });

    await dbStore.caseStatusHistory.create({
      caseId: theCase.id,
      fromStatus: CaseStatus.PAUSED,
      toStatus: resumeTo,
      reason: 'Resumed by authorized operator',
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
    });

    await AuditService.log({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: 'CASE_RESUMED',
      targetEntity: 'emergency_cases',
      targetId: theCase.id,
      details: { resumedToStatus: resumeTo },
    });

    // Re-schedule current stage timer
    await StageRunner.runStage(updated, updated.currentStageNumber);

    return updated;
  }

  /**
   * Manual Immediate Escalation
   */
  static async manualEscalate(params: {
    caseId: string;
    reason: string;
    actorUserId: string;
    actorRole: UserRole;
  }): Promise<EmergencyCaseRecord> {
    const theCase = await dbStore.emergencyCases.findUnique(params.caseId);
    if (!theCase) throw AppError.notFound('Case not found');

    let nextStage = theCase.currentStageNumber + 1;
    let nextStatus: CaseStatus = CaseStatus.ACTIVE_STAGE_2;

    if (nextStage === 2) nextStatus = CaseStatus.ACTIVE_STAGE_2;
    else if (nextStage === 3) nextStatus = CaseStatus.NGO_ACTIVATED;
    else if (nextStage >= 4) {
      nextStage = 4;
      nextStatus = CaseStatus.ESCALATED;
    }

    assertValidTransition(theCase.status, nextStatus);

    scheduler.cancelCaseTimers(theCase.id);

    const updated = await dbStore.emergencyCases.update(theCase.id, {
      status: nextStatus,
      currentStageNumber: nextStage,
    });

    await dbStore.caseStatusHistory.create({
      caseId: theCase.id,
      fromStatus: theCase.status,
      toStatus: nextStatus,
      reason: `Manual escalation: ${params.reason}`,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
    });

    await AuditService.log({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: 'MANUAL_ESCALATION',
      targetEntity: 'emergency_cases',
      targetId: theCase.id,
      details: { reason: params.reason, fromStage: theCase.currentStageNumber, toStage: nextStage },
    });

    await StageRunner.runStage(updated, nextStage);

    return updated;
  }

  /**
   * Record Donation Outcome (Screening & Physical Donation)
   * Safety Rule: Only the authorized blood centre can record clinical donation outcomes!
   */
  static async recordDonationOutcome(params: {
    caseId: string;
    donorProfileId: string;
    outcome: DonationOutcomeType;
    unitsCollected: number;
    deferralReason?: string;
    clinicalNotes?: string;
    recordedByUserId: string;
  }): Promise<void> {
    const theCase = await dbStore.emergencyCases.findUnique(params.caseId);
    if (!theCase) throw AppError.notFound('Emergency case not found');

    // Terminal guard
    if ([CaseStatus.CLOSED, CaseStatus.CANCELLED, CaseStatus.EXPIRED].includes(theCase.status)) {
      throw AppError.badRequest(`Cannot record donation outcome on terminal case '${theCase.status}'`);
    }

    // Record outcome
    await dbStore.donationOutcomes.create({
      caseId: params.caseId,
      donorProfileId: params.donorProfileId,
      recordedByUserId: params.recordedByUserId,
      outcome: params.outcome,
      unitsCollected: params.outcome === DonationOutcomeType.DONATED ? params.unitsCollected : 0,
      deferralReason: params.deferralReason,
      clinicalNotes: params.clinicalNotes,
    });

    // Update units fulfilled
    if (params.outcome === DonationOutcomeType.DONATED && params.unitsCollected > 0) {
      const newFulfilledTotal = theCase.unitsFulfilled + params.unitsCollected;
      await dbStore.emergencyCases.update(theCase.id, {
        unitsFulfilled: newFulfilledTotal,
      });

      logger.info({
        caseId: theCase.id,
        newFulfilledTotal,
        shortageUnits: theCase.shortageUnits,
      }, 'Donation units added to case');
    }

    await AuditService.log({
      actorUserId: params.recordedByUserId,
      actorRole: UserRole.BLOOD_CENTRE,
      action: 'DONATION_OUTCOME_RECORDED',
      targetEntity: 'emergency_cases',
      targetId: theCase.id,
      details: {
        outcome: params.outcome,
        unitsCollected: params.unitsCollected,
        deferralReason: params.deferralReason,
      },
    });

    // Check if case is now fulfilled
    await OrchestratorService.evaluateAndProgress(theCase.id);
  }

  /**
   * Cancel Case
   */
  static async cancelCase(params: {
    caseId: string;
    reason: string;
    actorUserId: string;
    actorRole: UserRole;
  }): Promise<EmergencyCaseRecord> {
    const theCase = await dbStore.emergencyCases.findUnique(params.caseId);
    if (!theCase) throw AppError.notFound('Case not found');

    assertValidTransition(theCase.status, CaseStatus.CANCELLED);

    scheduler.cancelCaseTimers(theCase.id);

    const updated = await dbStore.emergencyCases.update(theCase.id, {
      status: CaseStatus.CANCELLED,
      cancelReason: params.reason,
    });

    await dbStore.caseStatusHistory.create({
      caseId: theCase.id,
      fromStatus: theCase.status,
      toStatus: CaseStatus.CANCELLED,
      reason: params.reason,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
    });

    await AuditService.log({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: 'CASE_CANCELLED',
      targetEntity: 'emergency_cases',
      targetId: theCase.id,
      details: { reason: params.reason },
    });

    return updated;
  }

  /**
   * Close Case
   */
  static async closeCase(params: {
    caseId: string;
    closingNotes: string;
    actorUserId: string;
    actorRole: UserRole;
  }): Promise<EmergencyCaseRecord> {
    const theCase = await dbStore.emergencyCases.findUnique(params.caseId);
    if (!theCase) throw AppError.notFound('Case not found');

    assertValidTransition(theCase.status, CaseStatus.CLOSED);

    scheduler.cancelCaseTimers(theCase.id);

    const updated = await dbStore.emergencyCases.update(theCase.id, {
      status: CaseStatus.CLOSED,
      closingNotes: params.closingNotes,
    });

    await dbStore.caseStatusHistory.create({
      caseId: theCase.id,
      fromStatus: theCase.status,
      toStatus: CaseStatus.CLOSED,
      reason: params.closingNotes,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
    });

    await AuditService.log({
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: 'CASE_CLOSED',
      targetEntity: 'emergency_cases',
      targetId: theCase.id,
      details: { closingNotes: params.closingNotes },
    });

    return updated;
  }
}
