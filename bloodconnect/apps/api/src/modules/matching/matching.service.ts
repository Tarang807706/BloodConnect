import { BloodGroup, BloodComponent } from '@bloodconnect/shared';
import { dbStore, DonorProfileRecord } from '../../data/dbStore';
import { mapProvider } from '../maps/map.provider';
import { logger } from '../../common/logger/pino';

export interface MatchingCriteria {
  caseId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  limit?: number;
}

export interface MatchedPotentialDonor {
  donorProfileId: string;
  userId: string;
  bloodGroup: BloodGroup;
  approxDistanceKm: number;
  city: string;
  area: string;
  phone: string;
  preferredComponents: string;
}

export class MatchingService {
  /**
   * Identifies potential registered donors within radius.
   * Safety Note: This is an administrative notification mobilization targeting tool.
   * NEVER marks or implies medical eligibility or clinical compatibility!
   */
  static async findPotentialDonors(criteria: MatchingCriteria): Promise<MatchedPotentialDonor[]> {
    const { caseId, bloodGroup, centerLat, centerLng, radiusKm, limit = 50 } = criteria;

    // 1. Get eligible target blood groups from administrative mappings (default: same group only)
    const targetGroups = await dbStore.relevantGroupMappings.getTargetGroupsForRequestedGroup(bloodGroup);

    // 2. Fetch all donors
    const allDonors = await dbStore.donorProfiles.findMany();
    const now = new Date();

    const candidates: MatchedPotentialDonor[] = [];

    for (const donor of allDonors) {
      // Filter 1: Blood Group mapping match
      if (!targetGroups.includes(donor.bloodGroup)) {
        continue;
      }

      // Filter 2: Availability
      if (!donor.isAvailable) {
        continue;
      }

      // Filter 3: Snooze expiration
      if (donor.unavailableUntil && new Date(donor.unavailableUntil) > now) {
        continue;
      }

      // Filter 4: Not already notified for this case
      const alreadyNotified = await dbStore.donorNotifications.hasNotified(caseId, donor.id);
      if (alreadyNotified) {
        continue;
      }

      // Filter 5: Rough Bounding Box pre-filter (1 degree latitude is approx 111 km)
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
      if (
        Math.abs(donor.approxLat - centerLat) > latDelta ||
        Math.abs(donor.approxLng - centerLng) > lngDelta
      ) {
        continue;
      }

      // Filter 6: Haversine distance check
      const distance = mapProvider.calculateDistanceKm(
        { lat: centerLat, lng: centerLng },
        { lat: donor.approxLat, lng: donor.approxLng }
      );

      // Distance must be within stage radius AND within donor's maximum travel willingness
      if (distance <= radiusKm && distance <= donor.maxTravelKm) {
        candidates.push({
          donorProfileId: donor.id,
          userId: donor.userId,
          bloodGroup: donor.bloodGroup,
          approxDistanceKm: distance,
          city: donor.city,
          area: donor.area,
          phone: donor.phone,
          preferredComponents: donor.preferredComponents,
        });
      }
    }

    // Sort by proximity ascending
    candidates.sort((a, b) => a.approxDistanceKm - b.approxDistanceKm);

    logger.info({
      caseId,
      bloodGroup,
      radiusKm,
      matchedCount: candidates.length,
    }, 'Potential donor matching completed for case stage');

    return candidates.slice(0, limit);
  }
}
