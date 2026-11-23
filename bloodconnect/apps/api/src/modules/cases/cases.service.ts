import { dbStore, EmergencyCaseRecord } from '../../data/dbStore';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { AppError } from '../../common/errors/AppError';
import {
  UserRole,
  CaseStatus,
  ResponseType,
  DonationOutcomeType,
  DonorResponseInput,
  RecordDonationOutcomeInput,
  HospitalCaseView,
} from '@bloodconnect/shared';

export class CasesService {
  static async activateCase(requestId: string, centreOrgId: string, actorUserId: string, notes?: string) {
    return OrchestratorService.activateCase({
      requestId,
      bloodCentreOrgId: centreOrgId,
      actorUserId,
      notes,
    });
  }

  static async listCases(user: { role: UserRole; organizationId?: string | null; donorProfileId?: string | null }) {
    let cases = await dbStore.emergencyCases.findMany();

    if (user.role === UserRole.BLOOD_CENTRE) {
      cases = cases.filter(c => c.bloodCentreId === user.organizationId);
    } else if (user.role === UserRole.HOSPITAL) {
      const requests = await dbStore.emergencyRequests.findMany(r => r.hospitalId === user.organizationId);
      const reqIds = new Set(requests.map(r => r.id));
      cases = cases.filter(c => reqIds.has(c.requestId));
    } else if (user.role === UserRole.NGO) {
      const activations = await dbStore.ngoActivations.findByNgoId(user.organizationId!);
      const activatedCaseIds = new Set(activations.map(a => a.caseId));
      cases = cases.filter(c => activatedCaseIds.has(c.id));
    } else if (user.role === UserRole.DONOR) {
      const notifs = await dbStore.donorNotifications.findByDonorProfileId(user.donorProfileId!);
      const notifiedCaseIds = new Set(notifs.map(n => n.caseId));
      cases = cases.filter(c => notifiedCaseIds.has(c.id));
    }

    // Attach request metadata to each case
    const enriched = [];
    for (const c of cases) {
      const req = await dbStore.emergencyRequests.findUnique(c.requestId);
      const currentStage = await dbStore.caseStages.getCurrentStage(c.id);
      const responses = await dbStore.donorResponses.findByCaseId(c.id);
      const notifs = await dbStore.donorNotifications.findByCaseId(c.id);
      const willingCount = responses.filter(r => r.response === ResponseType.I_CAN_HELP).length;

      // Safe Hospital View: aggregates only
      if (user.role === UserRole.HOSPITAL) {
        enriched.push({
          id: c.id,
          requestId: c.requestId,
          status: c.status,
          currentStageNumber: c.currentStageNumber,
          shortageUnits: c.shortageUnits,
          unitsFulfilled: c.unitsFulfilled,
          nextStageDueAt: c.nextStageDueAt,
          bloodGroup: req?.bloodGroup,
          component: req?.component,
          urgency: req?.urgency,
          requiredBy: req?.requiredBy,
          potentialDonorsMobilizedCount: notifs.length,
          willingResponsesCount: willingCount,
          createdAt: c.createdAt,
        });
      } else {
        enriched.push({
          ...c,
          bloodGroup: req?.bloodGroup,
          component: req?.component,
          urgency: req?.urgency,
          requiredBy: req?.requiredBy,
          stageActionType: currentStage?.actionType,
          potentialDonorsMobilizedCount: notifs.length,
          willingResponsesCount: willingCount,
        });
      }
    }

    return enriched;
  }

  static async getCaseDetail(caseId: string, user: { role: UserRole; organizationId?: string | null; donorProfileId?: string | null }) {
    const theCase = await dbStore.emergencyCases.findUnique(caseId);
    if (!theCase) throw AppError.notFound('Emergency case not found');

    const request = await dbStore.emergencyRequests.findUnique(theCase.requestId);
    const stages = await dbStore.caseStages.findByCaseId(caseId);
    const currentStage = await dbStore.caseStages.getCurrentStage(caseId);
    const history = await dbStore.caseStatusHistory.findByCaseId(caseId);
    const notifs = await dbStore.donorNotifications.findByCaseId(caseId);
    const responses = await dbStore.donorResponses.findByCaseId(caseId);
    const outcomes = await dbStore.donationOutcomes.findByCaseId(caseId);
    const willingResponses = responses.filter(r => r.response === ResponseType.I_CAN_HELP);

    // 1. HOSPITAL VIEW: Strictly aggregate counts, zero donor identities!
    if (user.role === UserRole.HOSPITAL) {
      if (request?.hospitalId !== user.organizationId) {
        throw AppError.forbidden('Cannot view case belonging to another hospital');
      }

      return {
        id: theCase.id,
        requestId: theCase.requestId,
        status: theCase.status,
        currentStageNumber: theCase.currentStageNumber,
        shortageUnits: theCase.shortageUnits,
        unitsFulfilled: theCase.unitsFulfilled,
        nextStageDueAt: theCase.nextStageDueAt,
        bloodGroup: request?.bloodGroup,
        component: request?.component,
        urgency: request?.urgency,
        requiredBy: request?.requiredBy,
        potentialDonorsMobilizedCount: notifs.length,
        willingResponsesCount: willingResponses.length,
        statusHistory: history,
        disclaimer: 'Requests are verified, screened and fulfilled exclusively by authorized blood centres.',
      };
    }

    // 2. DONOR VIEW: Scoped to their own notification and response only
    if (user.role === UserRole.DONOR) {
      const myNotif = notifs.find(n => n.donorProfileId === user.donorProfileId);
      if (!myNotif) {
        throw AppError.forbidden('You were not targeted for this coordination case');
      }

      const myResponse = responses.find(r => r.donorProfileId === user.donorProfileId);
      const bloodCentre = await dbStore.organizations.findUnique(theCase.bloodCentreId);

      return {
        id: theCase.id,
        bloodGroup: request?.bloodGroup,
        component: request?.component,
        urgency: request?.urgency,
        requiredBy: request?.requiredBy,
        caseStatus: theCase.status,
        bloodCentreName: bloodCentre?.name,
        bloodCentreCity: bloodCentre?.city,
        bloodCentreArea: bloodCentre?.area,
        bloodCentrePhone: bloodCentre?.contactPhone,
        approxDistanceKm: myNotif.distanceKm,
        myResponse: myResponse ? {
          response: myResponse.response,
          estimatedArrivalMinutes: myResponse.estimatedArrivalMinutes,
          respondedAt: myResponse.respondedAt,
        } : null,
        safetyDisclaimer: 'Your response expresses willingness only. The authorized blood centre performs clinical screening and determines final eligibility.',
      };
    }

    // 3. BLOOD CENTRE & ADMIN VIEW: Full Command Center view
    const willingDonorsList = [];
    for (const res of willingResponses) {
      const donor = await dbStore.donorProfiles.findUnique(res.donorProfileId);
      const notif = notifs.find(n => n.donorProfileId === res.donorProfileId);
      const donorUser = donor ? await dbStore.users.findUnique({ where: { id: donor.userId } }) : null;

      willingDonorsList.push({
        donorProfileId: res.donorProfileId,
        fullName: donorUser?.fullName || 'Potential Donor',
        phone: donor?.phone || 'Confidential',
        bloodGroup: donor?.bloodGroup,
        approxDistanceKm: notif?.distanceKm || 0,
        city: donor?.city,
        area: donor?.area,
        estimatedArrivalMinutes: res.estimatedArrivalMinutes,
        respondedAt: res.respondedAt,
        statusLabel: 'Willing to help, pending screening',
      });
    }

    return {
      ...theCase,
      request,
      stages,
      currentStage,
      statusHistory: history,
      outcomes,
      stats: {
        totalMobilizedCount: notifs.length,
        willingResponsesCount: willingResponses.length,
        cannotHelpCount: responses.length - willingResponses.length,
        unitsFulfilled: theCase.unitsFulfilled,
        shortageUnits: theCase.shortageUnits,
      },
      willingDonors: willingDonorsList,
      safetyDisclaimer: 'All donors are listed as potential donors pending physical blood centre screening and testing.',
    };
  }

  static async submitDonorResponse(caseId: string, donorUserId: string, input: DonorResponseInput) {
    const donor = await dbStore.donorProfiles.findUniqueByUserId(donorUserId);
    if (!donor) throw AppError.notFound('Donor profile not found');

    await OrchestratorService.handleDonorResponse({
      caseId,
      donorProfileId: donor.id,
      response: input.response,
      estimatedArrivalMinutes: input.estimatedArrivalMinutes,
      notes: input.notes,
    });

    return {
      message: 'Response recorded successfully. The blood centre determines final eligibility.',
    };
  }

  static async manualEscalate(caseId: string, actorUserId: string, reason: string) {
    return OrchestratorService.manualEscalate({
      caseId,
      reason,
      actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
    });
  }

  static async pauseCase(caseId: string, actorUserId: string, reason: string) {
    return OrchestratorService.pauseCase({
      caseId,
      reason,
      actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
    });
  }

  static async resumeCase(caseId: string, actorUserId: string) {
    return OrchestratorService.resumeCase({
      caseId,
      actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
    });
  }

  static async cancelCase(caseId: string, actorUserId: string, reason: string) {
    return OrchestratorService.cancelCase({
      caseId,
      reason,
      actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
    });
  }

  static async closeCase(caseId: string, actorUserId: string, closingNotes: string) {
    return OrchestratorService.closeCase({
      caseId,
      closingNotes,
      actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
    });
  }

  static async recordDonationOutcome(caseId: string, actorUserId: string, input: RecordDonationOutcomeInput) {
    await OrchestratorService.recordDonationOutcome({
      caseId,
      donorProfileId: input.donorProfileId,
      outcome: input.outcome,
      unitsCollected: input.unitsCollected,
      deferralReason: input.deferralReason,
      clinicalNotes: input.clinicalNotes,
      recordedByUserId: actorUserId,
    });

    return {
      message: 'Donation outcome recorded in official blood centre ledger.',
    };
  }

  static async getOutcomes(caseId: string) {
    return dbStore.donationOutcomes.findByCaseId(caseId);
  }
}
