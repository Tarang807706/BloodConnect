import { dbStore } from '../../data/dbStore';
import { AppError } from '../../common/errors/AppError';
import { mapProvider } from '../maps/map.provider';
import {
  UpdateDonorProfileInput,
  UpdateDonorAvailabilityInput,
  UpdateDonorPreferencesInput,
  UserRole,
} from '@bloodconnect/shared';

export class DonorsService {
  static async getProfile(userId: string) {
    const donor = await dbStore.donorProfiles.findUniqueByUserId(userId);
    if (!donor) throw AppError.notFound('Donor profile not found');
    const user = await dbStore.users.findUnique({ where: { id: userId } });

    return {
      ...donor,
      fullName: user ? user.fullName : '',
      email: user ? user.email : '',
    };
  }

  static async updateProfile(userId: string, input: UpdateDonorProfileInput) {
    const donor = await dbStore.donorProfiles.findUniqueByUserId(userId);
    if (!donor) throw AppError.notFound('Donor profile not found');

    const updates: any = {};
    if (input.phone) updates.phone = input.phone;
    if (input.city) updates.city = input.city;
    if (input.area) updates.area = input.area;
    if (input.bloodGroup) updates.bloodGroup = input.bloodGroup;

    if (input.approxLat !== undefined && input.approxLng !== undefined) {
      const approx = mapProvider.toApproximateCoordinates({
        lat: input.approxLat,
        lng: input.approxLng,
      });
      updates.approxLat = approx.lat;
      updates.approxLng = approx.lng;
      updates.gridCell = mapProvider.toGridCell(approx);
    }

    if (input.fullName) {
      await dbStore.users.update(userId, { fullName: input.fullName });
    }

    return dbStore.donorProfiles.update(donor.id, updates);
  }

  static async updateAvailability(userId: string, input: UpdateDonorAvailabilityInput) {
    const donor = await dbStore.donorProfiles.findUniqueByUserId(userId);
    if (!donor) throw AppError.notFound('Donor profile not found');

    return dbStore.donorProfiles.update(donor.id, {
      isAvailable: input.isAvailable,
      unavailableUntil: input.unavailableUntil || null,
    });
  }

  static async updatePreferences(userId: string, input: UpdateDonorPreferencesInput) {
    const donor = await dbStore.donorProfiles.findUniqueByUserId(userId);
    if (!donor) throw AppError.notFound('Donor profile not found');

    return dbStore.donorProfiles.update(donor.id, {
      maxTravelKm: input.maxTravelKm,
      preferredComponents: input.preferredComponents.join(','),
      allowedChannels: input.allowedChannels.join(','),
      quietHoursStart: input.quietHoursStart || null,
      quietHoursEnd: input.quietHoursEnd || null,
    });
  }

  static async getReceivedRequests(userId: string) {
    const donor = await dbStore.donorProfiles.findUniqueByUserId(userId);
    if (!donor) throw AppError.notFound('Donor profile not found');

    const notifications = await dbStore.donorNotifications.findByDonorProfileId(donor.id);
    const results = [];

    for (const notif of notifications) {
      const theCase = await dbStore.emergencyCases.findUnique(notif.caseId);
      if (!theCase) continue;

      const request = await dbStore.emergencyRequests.findUnique(theCase.requestId);
      if (!request) continue;

      const bloodCentre = await dbStore.organizations.findUnique(theCase.bloodCentreId);
      const myResponse = (await dbStore.donorResponses.findByCaseId(theCase.id)).find(
        r => r.donorProfileId === donor.id
      );

      results.push({
        caseId: theCase.id,
        requestId: request.id,
        bloodGroup: request.bloodGroup,
        component: request.component,
        urgency: request.urgency,
        shortageUnits: theCase.shortageUnits,
        caseStatus: theCase.status,
        bloodCentreName: bloodCentre ? bloodCentre.name : 'Authorized Blood Centre',
        bloodCentreArea: bloodCentre ? bloodCentre.area : '',
        approxDistanceKm: notif.distanceKm,
        notifiedAt: notif.sentAt,
        myResponse: myResponse
          ? {
              response: myResponse.response,
              estimatedArrivalMinutes: myResponse.estimatedArrivalMinutes,
              respondedAt: myResponse.respondedAt,
            }
          : null,
        safetyDisclaimer:
          'Your response indicates willingness only. Medical screening and final donation eligibility are decided exclusively by the authorized blood centre.',
      });
    }

    return results;
  }

  static async getResponseHistory(userId: string) {
    const donor = await dbStore.donorProfiles.findUniqueByUserId(userId);
    if (!donor) throw AppError.notFound('Donor profile not found');

    const responses = await dbStore.donorResponses.findByDonorProfileId(donor.id);
    const outcomes = await dbStore.donationOutcomes.findByCaseId(''); // filtered by donor

    const results = [];
    for (const r of responses) {
      const theCase = await dbStore.emergencyCases.findUnique(r.caseId);
      const req = theCase ? await dbStore.emergencyRequests.findUnique(theCase.requestId) : null;

      results.push({
        caseId: r.caseId,
        response: r.response,
        estimatedArrivalMinutes: r.estimatedArrivalMinutes,
        respondedAt: r.respondedAt,
        bloodGroup: req ? req.bloodGroup : null,
        caseStatus: theCase ? theCase.status : null,
      });
    }

    return results;
  }
}
