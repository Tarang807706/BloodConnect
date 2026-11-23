import bcrypt from 'bcryptjs';
import { dbStore } from '../../data/dbStore';
import { mapProvider } from '../maps/map.provider';
import { AuditService } from '../audit/audit.service';
import { AppError } from '../../common/errors/AppError';
import {
  RegisterOrganizationInput,
  OrganizationType,
  OrganizationStatus,
  UserRole,
} from '@bloodconnect/shared';

export class OrganizationsService {
  static async register(input: RegisterOrganizationInput) {
    const existingOrg = await dbStore.organizations.findMany(
      o => o.licenseNumber.toLowerCase() === input.licenseNumber.toLowerCase()
    );
    if (existingOrg.length > 0) {
      throw AppError.conflict('An organization with this official license number already exists');
    }

    const existingUser = await dbStore.users.findUnique({ where: { email: input.adminEmail } });
    if (existingUser) {
      throw AppError.conflict('An account with this administrator email already exists');
    }

    const approx = mapProvider.toApproximateCoordinates({
      lat: input.approxLat,
      lng: input.approxLng,
    });
    const gridCell = mapProvider.toGridCell(approx);

    // 1. Create Organization in PENDING_APPROVAL status
    const org = await dbStore.organizations.create({
      name: input.name,
      type: input.type,
      status: OrganizationStatus.PENDING_APPROVAL,
      licenseNumber: input.licenseNumber,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      city: input.city,
      area: input.area,
      approxLat: approx.lat,
      approxLng: approx.lng,
      gridCell,
    });

    // 2. Create Profile specific to OrganizationType
    if (input.type === OrganizationType.HOSPITAL) {
      await dbStore.hospitalProfiles.create({
        organizationId: org.id,
        emergencyHelpline: input.emergencyHelpline,
      });
    } else if (input.type === OrganizationType.BLOOD_CENTRE) {
      await dbStore.bloodCentreProfiles.create({
        organizationId: org.id,
        storageCapacityUnits: input.storageCapacityUnits || 500,
        operatingHours: '24x7',
      });
    } else if (input.type === OrganizationType.NGO) {
      await dbStore.ngoProfiles.create({
        organizationId: org.id,
        volunteerCountEstimate: input.volunteerCountEstimate || 10,
        primaryContactName: input.adminFullName,
      });
    }

    // 3. Create Admin User for Organization
    const userRole =
      input.type === OrganizationType.HOSPITAL
        ? UserRole.HOSPITAL
        : input.type === OrganizationType.BLOOD_CENTRE
        ? UserRole.BLOOD_CENTRE
        : UserRole.NGO;

    const passwordHash = await bcrypt.hash(input.adminPassword, 10);
    const user = await dbStore.users.create({
      email: input.adminEmail.toLowerCase(),
      passwordHash,
      fullName: input.adminFullName,
      role: userRole,
      isActive: true,
      organizationId: org.id,
    });

    await AuditService.log({
      actorUserId: user.id,
      actorRole: userRole,
      action: 'ORGANIZATION_REGISTERED',
      targetEntity: 'organizations',
      targetId: org.id,
      details: { name: org.name, type: org.type, status: org.status },
    });

    return {
      organization: org,
      message: 'Organization registered successfully and is pending administrator verification.',
    };
  }

  static async getMyOrganization(organizationId: string) {
    const org = await dbStore.organizations.findUnique(organizationId);
    if (!org) throw AppError.notFound('Organization not found');

    let profile: any = null;
    if (org.type === OrganizationType.HOSPITAL) {
      profile = await dbStore.hospitalProfiles.findUniqueByOrgId(org.id);
    } else if (org.type === OrganizationType.BLOOD_CENTRE) {
      profile = await dbStore.bloodCentreProfiles.findUniqueByOrgId(org.id);
    } else if (org.type === OrganizationType.NGO) {
      profile = await dbStore.ngoProfiles.findUniqueByOrgId(org.id);
    }

    return { ...org, profile };
  }

  static async listAuthorizedCentres() {
    const centres = await dbStore.organizations.findMany(
      o => o.type === OrganizationType.BLOOD_CENTRE && o.status === OrganizationStatus.ACTIVE
    );
    return centres.map(c => ({
      id: c.id,
      name: c.name,
      city: c.city,
      area: c.area,
      approxLat: c.approxLat,
      approxLng: c.approxLng,
      contactPhone: c.contactPhone,
    }));
  }
}
