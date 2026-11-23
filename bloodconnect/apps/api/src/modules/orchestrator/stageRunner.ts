import { dbStore, EmergencyCaseRecord } from '../../data/dbStore';
import { MatchingService } from '../matching/matching.service';
import { NotificationService } from '../notifications/notification.service';
import { scheduler } from '../../jobs/pgBossScheduler';
import { StageActionType, CaseStatus, UserRole, OrganizationType, OrganizationStatus } from '@bloodconnect/shared';
import { logger } from '../../common/logger/pino';

export class StageRunner {
  static async runStage(theCase: EmergencyCaseRecord, stageNumber: number): Promise<void> {
    const request = await dbStore.emergencyRequests.findUnique(theCase.requestId);
    if (!request) {
      throw new Error(`Request ${theCase.requestId} not found for case ${theCase.id}`);
    }

    // 1. Fetch stage rule
    let rule = await dbStore.caseStageRules.findByStageNumber(stageNumber);
    if (!rule) {
      // Default fallback rule if not present in DB
      rule = {
        id: `default-rule-${stageNumber}`,
        stageNumber,
        actionType:
          stageNumber === 1
            ? StageActionType.NOTIFY_DONORS
            : stageNumber === 2
            ? StageActionType.NOTIFY_DONORS
            : stageNumber === 3
            ? StageActionType.ACTIVATE_NGO
            : StageActionType.ESCALATE_CENTRES,
        radiusKm: stageNumber === 1 ? 5 : stageNumber === 2 ? 15 : 30,
        timeoutMinutes: stageNumber === 3 ? 15 : 10,
        minResponsesFactor: 1.5,
        autoAdvanceOnTimeout: true,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
    }

    const now = new Date();
    const dueAt = new Date(now.getTime() + rule.timeoutMinutes * 60 * 1000);

    // 2. Create or record CaseStage snapshot row
    await dbStore.caseStages.create({
      caseId: theCase.id,
      stageNumber,
      actionType: rule.actionType,
      radiusKm: rule.radiusKm,
      timeoutMinutes: rule.timeoutMinutes,
      minResponsesFactor: rule.minResponsesFactor,
      startedAt: now.toISOString(),
      dueAt: dueAt.toISOString(),
      isCurrent: true,
    });

    // 3. Update case's nextStageDueAt
    await dbStore.emergencyCases.update(theCase.id, {
      currentStageNumber: stageNumber,
      nextStageDueAt: dueAt.toISOString(),
    });

    // 4. Execute stage action
    if (rule.actionType === StageActionType.NOTIFY_DONORS) {
      // Match registered potential donors within radius
      const potentialDonors = await MatchingService.findPotentialDonors({
        caseId: theCase.id,
        bloodGroup: request.bloodGroup,
        component: request.component,
        centerLat: request.approxLat,
        centerLng: request.approxLng,
        radiusKm: rule.radiusKm,
      });

      if (potentialDonors.length > 0) {
        // Record notifications
        await dbStore.donorNotifications.createBatch(
          potentialDonors.map(d => ({
            caseId: theCase.id,
            stageNumber,
            donorProfileId: d.donorProfileId,
            distanceKm: d.approxDistanceKm,
          }))
        );

        // Send notifications
        for (const donor of potentialDonors) {
          const user = await dbStore.users.findUnique({ where: { id: donor.userId } });
          if (user) {
            await NotificationService.sendDonorEmergencyAlert({
              userId: user.id,
              email: user.email,
              bloodGroup: request.bloodGroup,
              component: request.component,
              distanceKm: donor.approxDistanceKm,
              caseId: theCase.id,
            });
          }
        }
      }

      logger.info({
        caseId: theCase.id,
        stageNumber,
        matchedDonorsCount: potentialDonors.length,
        radiusKm: rule.radiusKm,
      }, 'StageRunner: Potential donors notified for stage');
    } else if (rule.actionType === StageActionType.ACTIVATE_NGO) {
      // Find active NGOs in the city/district
      const ngos = await dbStore.organizations.findMany(
        o => o.type === OrganizationType.NGO && o.status === OrganizationStatus.ACTIVE
      );

      for (const ngo of ngos) {
        await dbStore.ngoActivations.create({
          caseId: theCase.id,
          ngoOrganizationId: ngo.id,
          broadcastMessage: `Emergency mobilization: ${request.unitsNeeded} units of ${request.bloodGroup} needed for urgent hospital requirement.`,
        });

        // Notify NGO admin users
        const ngoUsers = await dbStore.users.findMany(u => u.organizationId === ngo.id);
        for (const u of ngoUsers) {
          await NotificationService.sendNgoActivationAlert({
            userId: u.id,
            caseId: theCase.id,
            bloodGroup: request.bloodGroup,
            shortageUnits: theCase.shortageUnits,
          });
        }
      }

      logger.info({
        caseId: theCase.id,
        activatedNgosCount: ngos.length,
      }, 'StageRunner: NGOs activated for stage 3');
    } else if (rule.actionType === StageActionType.ESCALATE_CENTRES) {
      // Find other blood centres in the network
      const otherCentres = await dbStore.organizations.findMany(
        o => o.type === OrganizationType.BLOOD_CENTRE && o.id !== theCase.bloodCentreId && o.status === OrganizationStatus.ACTIVE
      );

      for (const centre of otherCentres) {
        await dbStore.caseEscalationTargets.create({
          caseId: theCase.id,
          targetCentreOrgId: centre.id,
          status: 'NOTIFIED',
        });

        const centreUsers = await dbStore.users.findMany(u => u.organizationId === centre.id);
        for (const u of centreUsers) {
          await NotificationService.sendCentreEscalationAlert({
            userId: u.id,
            caseId: theCase.id,
            fromStage: stageNumber - 1,
            toStage: stageNumber,
            newStatus: CaseStatus.ESCALATED,
          });
        }
      }

      logger.info({
        caseId: theCase.id,
        escalatedCentresCount: otherCentres.length,
      }, 'StageRunner: Case escalated to regional network centres');
    }

    // 5. Schedule timeout timer
    scheduler.scheduleStageTimeout(theCase.id, stageNumber, dueAt);
  }
}
