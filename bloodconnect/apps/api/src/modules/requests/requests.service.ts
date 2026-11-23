import { dbStore, EmergencyRequestRecord } from '../../data/dbStore';
import { AppError } from '../../common/errors/AppError';
import { mapProvider } from '../maps/map.provider';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import {
  CreateEmergencyRequestInput,
  CancelRequestInput,
  VerifyRequestInput,
  RequestStatus,
  UserRole,
  OrganizationType,
  OrganizationStatus,
} from '@bloodconnect/shared';

export class RequestsService {
  static async createRequest(hospitalOrgId: string, actorUserId: string, input: CreateEmergencyRequestInput) {
    const hospital = await dbStore.organizations.findUnique(hospitalOrgId);
    if (!hospital || hospital.type !== OrganizationType.HOSPITAL) {
      throw AppError.forbidden('Only verified hospital organizations can create emergency requests');
    }

    if (hospital.status !== OrganizationStatus.ACTIVE) {
      throw AppError.forbidden('Hospital organization account is pending administrator approval');
    }

    const bloodCentre = await dbStore.organizations.findUnique(input.bloodCentreId);
    if (!bloodCentre || bloodCentre.type !== OrganizationType.BLOOD_CENTRE || bloodCentre.status !== OrganizationStatus.ACTIVE) {
      throw AppError.badRequest('Selected blood centre is not an active authorized regional centre');
    }

    const approx = mapProvider.toApproximateCoordinates({
      lat: input.approxLat,
      lng: input.approxLng,
    });

    const request = await dbStore.emergencyRequests.create({
      hospitalId: hospitalOrgId,
      bloodCentreId: input.bloodCentreId,
      bloodGroup: input.bloodGroup,
      component: input.component,
      unitsNeeded: input.unitsNeeded,
      urgency: input.urgency,
      requiredBy: input.requiredBy,
      status: RequestStatus.SUBMITTED,
      clinicalNotes: input.clinicalNotes || null,
      approxLat: approx.lat,
      approxLng: approx.lng,
    });

    // Write Status History
    await dbStore.requestStatusHistory.create({
      requestId: request.id,
      fromStatus: null,
      toStatus: RequestStatus.SUBMITTED,
      reason: 'Emergency request submitted by hospital',
      actorUserId,
      actorRole: UserRole.HOSPITAL,
    });

    // Write Audit Log
    await AuditService.log({
      actorUserId,
      actorRole: UserRole.HOSPITAL,
      action: 'REQUEST_CREATED',
      targetEntity: 'emergency_requests',
      targetId: request.id,
      details: {
        unitsNeeded: input.unitsNeeded,
        bloodGroup: input.bloodGroup,
        component: input.component,
        bloodCentreId: input.bloodCentreId,
      },
    });

    // Notify Blood Centre staff
    const centreUsers = await dbStore.users.findMany(u => u.organizationId === input.bloodCentreId);
    for (const u of centreUsers) {
      await NotificationService.sendDonorEmergencyAlert({
        userId: u.id,
        email: u.email,
        bloodGroup: input.bloodGroup,
        component: input.component,
        distanceKm: 0,
        caseId: request.id,
      });
    }

    return request;
  }

  static async listRequests(user: { role: UserRole; organizationId?: string | null }) {
    if (user.role === UserRole.HOSPITAL) {
      return dbStore.emergencyRequests.findMany(r => r.hospitalId === user.organizationId);
    } else if (user.role === UserRole.BLOOD_CENTRE) {
      return dbStore.emergencyRequests.findMany(r => r.bloodCentreId === user.organizationId);
    } else if (user.role === UserRole.ADMIN) {
      return dbStore.emergencyRequests.findMany();
    }
    throw AppError.forbidden();
  }

  static async getPendingForCentre(centreOrgId: string) {
    return dbStore.emergencyRequests.findMany(
      r => r.bloodCentreId === centreOrgId && [RequestStatus.SUBMITTED, RequestStatus.VERIFICATION_PENDING].includes(r.status)
    );
  }

  static async getRequestDetail(requestId: string, user: { role: UserRole; organizationId?: string | null }) {
    const request = await dbStore.emergencyRequests.findUnique(requestId);
    if (!request) throw AppError.notFound('Emergency request not found');

    // Scoped access
    if (user.role === UserRole.HOSPITAL && request.hospitalId !== user.organizationId) {
      throw AppError.forbidden('Cannot view requests belonging to another hospital');
    }
    if (user.role === UserRole.BLOOD_CENTRE && request.bloodCentreId !== user.organizationId) {
      throw AppError.forbidden('Cannot view requests not assigned to your blood centre');
    }

    const hospital = await dbStore.organizations.findUnique(request.hospitalId);
    const bloodCentre = await dbStore.organizations.findUnique(request.bloodCentreId);
    const verification = await dbStore.requestVerifications.findUniqueByRequestId(request.id);
    const history = await dbStore.requestStatusHistory.findByRequestId(request.id);
    const associatedCase = await dbStore.emergencyCases.findByRequestId(request.id);

    return {
      ...request,
      hospitalName: hospital ? hospital.name : 'Unknown Hospital',
      bloodCentreName: bloodCentre ? bloodCentre.name : 'Unknown Blood Centre',
      verification,
      statusHistory: history,
      caseId: associatedCase ? associatedCase.id : null,
      caseStatus: associatedCase ? associatedCase.status : null,
    };
  }

  static async cancelRequest(requestId: string, hospitalOrgId: string, actorUserId: string, input: CancelRequestInput) {
    const request = await dbStore.emergencyRequests.findUnique(requestId);
    if (!request) throw AppError.notFound('Emergency request not found');

    if (request.hospitalId !== hospitalOrgId) {
      throw AppError.forbidden('Only the requesting hospital can cancel this request');
    }

    if ([RequestStatus.CANCELLED, RequestStatus.REJECTED].includes(request.status)) {
      throw AppError.badRequest('Request is already closed');
    }

    const updated = await dbStore.emergencyRequests.update(requestId, {
      status: RequestStatus.CANCELLED,
    });

    await dbStore.requestStatusHistory.create({
      requestId,
      fromStatus: request.status,
      toStatus: RequestStatus.CANCELLED,
      reason: input.reason,
      actorUserId,
      actorRole: UserRole.HOSPITAL,
    });

    await AuditService.log({
      actorUserId,
      actorRole: UserRole.HOSPITAL,
      action: 'REQUEST_CANCELLED',
      targetEntity: 'emergency_requests',
      targetId: requestId,
      details: { reason: input.reason },
    });

    return updated;
  }

  static async verifyRequest(requestId: string, centreOrgId: string, actorUserId: string, input: VerifyRequestInput) {
    const request = await dbStore.emergencyRequests.findUnique(requestId);
    if (!request) throw AppError.notFound('Emergency request not found');

    if (request.bloodCentreId !== centreOrgId) {
      throw AppError.forbidden('Only the assigned blood centre can verify this request');
    }

    if (request.status !== RequestStatus.SUBMITTED && request.status !== RequestStatus.VERIFICATION_PENDING) {
      throw AppError.badRequest(`Request cannot be verified in status '${request.status}'`);
    }

    const shortage = Math.max(0, request.unitsNeeded - input.unitsAvailableAtCentre);
    let newStatus: RequestStatus = RequestStatus.VERIFIED;

    if (input.rejectionReason) {
      newStatus = RequestStatus.REJECTED;
    } else if (shortage === 0) {
      newStatus = RequestStatus.NO_SHORTAGE;
    }

    // Record verification
    const verification = await dbStore.requestVerifications.create({
      requestId,
      verifiedByUserId: actorUserId,
      unitsAvailableAtCentre: input.unitsAvailableAtCentre,
      shortageUnits: shortage,
      status: newStatus,
      notes: input.verificationNotes || null,
      rejectionReason: input.rejectionReason || null,
    });

    // Update request status
    const updated = await dbStore.emergencyRequests.update(requestId, {
      status: newStatus,
    });

    // Status History
    await dbStore.requestStatusHistory.create({
      requestId,
      fromStatus: request.status,
      toStatus: newStatus,
      reason: input.verificationNotes || (shortage === 0 ? 'Full stock available at centre' : 'Shortage confirmed'),
      actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
    });

    // Audit Log
    await AuditService.log({
      actorUserId,
      actorRole: UserRole.BLOOD_CENTRE,
      action: 'REQUEST_VERIFIED',
      targetEntity: 'emergency_requests',
      targetId: requestId,
      details: {
        unitsAvailableAtCentre: input.unitsAvailableAtCentre,
        shortageUnits: shortage,
        status: newStatus,
      },
    });

    return {
      request: updated,
      verification,
      canActivateCoordination: newStatus === RequestStatus.VERIFIED && shortage > 0,
    };
  }
}
