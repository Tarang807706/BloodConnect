import { dbStore, VolunteerRecord } from '../../data/dbStore';
import { AppError } from '../../common/errors/AppError';
import { mapProvider } from '../maps/map.provider';
import { AuditService } from '../audit/audit.service';
import {
  CreateVolunteerInput,
  ActivateNgoVolunteersInput,
  VolunteerResponseInput,
  UserRole,
  ResponseType,
} from '@bloodconnect/shared';

export class NgoService {
  static async getDashboard(ngoOrgId: string) {
    const profile = await dbStore.ngoProfiles.findUniqueByOrgId(ngoOrgId);
    if (!profile) throw AppError.notFound('NGO Profile not found');

    const volunteers = await dbStore.volunteers.findByNgoProfileId(profile.id);
    const activations = await dbStore.ngoActivations.findByNgoId(ngoOrgId);

    const activeCasesList = [];
    for (const act of activations) {
      const theCase = await dbStore.emergencyCases.findUnique(act.caseId);
      if (theCase) {
        const req = await dbStore.emergencyRequests.findUnique(theCase.requestId);
        activeCasesList.push({
          caseId: theCase.id,
          bloodGroup: req?.bloodGroup,
          component: req?.component,
          urgency: req?.urgency,
          shortageUnits: theCase.shortageUnits,
          status: theCase.status,
          activatedAt: act.activatedAt,
        });
      }
    }

    return {
      totalVolunteers: volunteers.length,
      activeVolunteers: volunteers.filter(v => v.isActive).length,
      totalActivations: activations.length,
      activatedCases: activeCasesList,
    };
  }

  static async getActivatedCases(ngoOrgId: string) {
    const activations = await dbStore.ngoActivations.findByNgoId(ngoOrgId);
    const list = [];
    for (const act of activations) {
      const theCase = await dbStore.emergencyCases.findUnique(act.caseId);
      const req = theCase ? await dbStore.emergencyRequests.findUnique(theCase.requestId) : null;
      const responses = await dbStore.volunteerResponses.findByActivationId(act.id);

      list.push({
        activationId: act.id,
        caseId: act.caseId,
        broadcastMessage: act.broadcastMessage,
        activatedAt: act.activatedAt,
        caseStatus: theCase?.status,
        bloodGroup: req?.bloodGroup,
        unitsNeeded: req?.unitsNeeded,
        shortageUnits: theCase?.shortageUnits,
        volunteerResponsesCount: responses.length,
        willingVolunteersCount: responses.filter(r => r.response === ResponseType.I_CAN_HELP).length,
      });
    }
    return list;
  }

  static async createVolunteer(ngoOrgId: string, input: CreateVolunteerInput) {
    const profile = await dbStore.ngoProfiles.findUniqueByOrgId(ngoOrgId);
    if (!profile) throw AppError.notFound('NGO profile not found');

    const approx = mapProvider.toApproximateCoordinates({
      lat: input.approxLat,
      lng: input.approxLng,
    });

    const volunteer = await dbStore.volunteers.create({
      ngoProfileId: profile.id,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email || null,
      city: input.city,
      area: input.area,
      approxLat: approx.lat,
      approxLng: approx.lng,
      gridCell: mapProvider.toGridCell(approx),
      bloodGroup: input.bloodGroup || null,
      specialSkills: input.specialSkills || null,
      isActive: true,
    });

    return volunteer;
  }

  static async listVolunteers(ngoOrgId: string) {
    const profile = await dbStore.ngoProfiles.findUniqueByOrgId(ngoOrgId);
    if (!profile) throw AppError.notFound('NGO profile not found');
    return dbStore.volunteers.findByNgoProfileId(profile.id);
  }

  static async broadcastToVolunteers(caseId: string, ngoOrgId: string, input: ActivateNgoVolunteersInput) {
    const profile = await dbStore.ngoProfiles.findUniqueByOrgId(ngoOrgId);
    if (!profile) throw AppError.notFound('NGO profile not found');

    const activations = await dbStore.ngoActivations.findByCaseId(caseId);
    const myActivation = activations.find(a => a.ngoOrganizationId === ngoOrgId);

    if (!myActivation) {
      throw AppError.badRequest('This NGO has not been activated for this case');
    }

    const volunteers = await dbStore.volunteers.findByNgoProfileId(profile.id);
    const targetVolunteers = input.volunteerIds
      ? volunteers.filter(v => input.volunteerIds!.includes(v.id))
      : volunteers;

    return {
      message: `Mobilization alert dispatched to ${targetVolunteers.length} registered volunteers.`,
      dispatchedCount: targetVolunteers.length,
    };
  }

  static async recordVolunteerResponse(ngoOrgId: string, input: VolunteerResponseInput) {
    const volunteer = await dbStore.volunteers.findUnique(input.volunteerId);
    if (!volunteer) throw AppError.notFound('Volunteer not found');

    const activations = await dbStore.ngoActivations.findByCaseId(input.caseId);
    const myActivation = activations.find(a => a.ngoOrganizationId === ngoOrgId);
    if (!myActivation) throw AppError.badRequest('NGO not activated for case');

    const res = await dbStore.volunteerResponses.create({
      activationId: myActivation.id,
      volunteerId: input.volunteerId,
      response: input.response,
      notes: input.notes || null,
    });

    return res;
  }
}
