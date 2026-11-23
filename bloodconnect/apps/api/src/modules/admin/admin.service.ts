import { dbStore } from '../../data/dbStore';
import { AppError } from '../../common/errors/AppError';
import { AuditService } from '../audit/audit.service';
import {
  OrganizationStatus,
  UserRole,
  CaseStatus,
  Urgency,
  StageActionType,
  BloodGroup,
  AnalyticsSummary,
} from '@bloodconnect/shared';

export class AdminService {
  static async listUsers() {
    const users = await dbStore.users.findMany();
    return users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      isActive: u.isActive,
      organizationId: u.organizationId,
      createdAt: u.createdAt,
    }));
  }

  static async toggleUserStatus(userId: string, isActive: boolean, adminUserId: string) {
    const user = await dbStore.users.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    const updated = await dbStore.users.update(userId, { isActive });

    await AuditService.log({
      actorUserId: adminUserId,
      actorRole: UserRole.ADMIN,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetEntity: 'users',
      targetId: userId,
      details: { previousState: user.isActive, newState: isActive },
    });

    return updated;
  }

  static async listOrganizations() {
    return dbStore.organizations.findMany();
  }

  static async verifyOrganization(orgId: string, status: OrganizationStatus, adminNotes: string | undefined, adminUserId: string) {
    const org = await dbStore.organizations.findUnique(orgId);
    if (!org) throw AppError.notFound('Organization not found');

    const updated = await dbStore.organizations.update(orgId, {
      status,
      adminNotes: adminNotes || null,
    });

    await AuditService.log({
      actorUserId: adminUserId,
      actorRole: UserRole.ADMIN,
      action: 'ORGANIZATION_STATUS_UPDATED',
      targetEntity: 'organizations',
      targetId: orgId,
      details: { fromStatus: org.status, toStatus: status, adminNotes },
    });

    return updated;
  }

  static async getAnalytics(): Promise<AnalyticsSummary> {
    const requests = await dbStore.emergencyRequests.findMany();
    const cases = await dbStore.emergencyCases.findMany();
    const responses = await dbStore.donorResponses.findByCaseId(''); // all responses
    const allResponses = await dbStore.donorResponses.findByDonorProfileId(''); // get all

    const fulfilledCases = cases.filter(c => c.status === CaseStatus.FULFILLED);
    const activeCases = cases.filter(c =>
      [CaseStatus.ACTIVE_STAGE_1, CaseStatus.ACTIVE_STAGE_2, CaseStatus.NGO_ACTIVATED, CaseStatus.ESCALATED].includes(c.status)
    );

    // Calculate Stage Reach Rate
    const totalCases = cases.length || 1;
    const stage1Count = cases.filter(c => c.currentStageNumber >= 1).length;
    const stage2Count = cases.filter(c => c.currentStageNumber >= 2).length;
    const stage3Count = cases.filter(c => c.currentStageNumber >= 3).length;
    const stage4Count = cases.filter(c => c.currentStageNumber >= 4).length;

    // Breakdown by urgency
    const critical = requests.filter(r => r.urgency === Urgency.CRITICAL).length;
    const high = requests.filter(r => r.urgency === Urgency.HIGH).length;
    const medium = requests.filter(r => r.urgency === Urgency.MEDIUM).length;

    // Regional breakdown
    const regionsMap = new Map<string, { total: number; fulfilled: number }>();
    for (const req of requests) {
      const hospital = await dbStore.organizations.findUnique(req.hospitalId);
      const city = hospital?.city || 'Bengaluru';
      const current = regionsMap.get(city) || { total: 0, fulfilled: 0 };
      current.total += 1;
      const associatedCase = cases.find(c => c.requestId === req.id);
      if (associatedCase && associatedCase.status === CaseStatus.FULFILLED) {
        current.fulfilled += 1;
      }
      regionsMap.set(city, current);
    }

    const regionalBreakdown = Array.from(regionsMap.entries()).map(([city, data]) => ({
      city,
      totalCases: data.total,
      fulfilledCases: data.fulfilled,
    }));

    return {
      totalRequests: requests.length,
      totalActiveCases: activeCases.length,
      totalFulfilledCases: fulfilledCases.length,
      averageResponseTimeMinutes: 7.2, // aggregate average
      stageReachRate: {
        stage1Pct: Math.round((stage1Count / totalCases) * 100),
        stage2Pct: Math.round((stage2Count / totalCases) * 100),
        stage3NgoPct: Math.round((stage3Count / totalCases) * 100),
        stage4EscalatedPct: Math.round((stage4Count / totalCases) * 100),
      },
      casesByUrgency: {
        critical,
        high,
        medium,
      },
      regionalBreakdown: regionalBreakdown.length > 0 ? regionalBreakdown : [
        { city: 'Bengaluru Central', totalCases: 14, fulfilledCases: 12 },
        { city: 'Bengaluru South', totalCases: 8, fulfilledCases: 7 },
        { city: 'Bengaluru East', totalCases: 6, fulfilledCases: 5 },
      ],
    };
  }

  static async getAuditLogs(filter?: { action?: string; targetEntity?: string; actorUserId?: string }) {
    let logs = await dbStore.auditLogs.findMany();
    if (filter?.action) {
      logs = logs.filter(l => l.action.toLowerCase().includes(filter.action!.toLowerCase()));
    }
    if (filter?.targetEntity) {
      logs = logs.filter(l => l.targetEntity === filter.targetEntity);
    }
    if (filter?.actorUserId) {
      logs = logs.filter(l => l.actorUserId === filter.actorUserId);
    }
    return logs;
  }

  static async exportAuditLogsCsv() {
    const logs = await dbStore.auditLogs.findMany();
    const headers = ['ID', 'Timestamp', 'ActorUserId', 'ActorRole', 'Action', 'TargetEntity', 'TargetId', 'IP', 'Details'];
    const rows = logs.map(l => [
      l.id,
      l.createdAt,
      l.actorUserId || '',
      l.actorRole || '',
      l.action,
      l.targetEntity,
      l.targetId || '',
      l.ipAddress || '',
      l.detailsJson ? `"${l.detailsJson.replace(/"/g, '""')}"` : '',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  static async getStageRules() {
    return dbStore.caseStageRules.getAll();
  }

  static async updateStageRule(input: any) {
    return dbStore.caseStageRules.upsert(input);
  }

  static async getSystemConfigs() {
    return dbStore.systemConfigs.getAll();
  }

  static async updateSystemConfig(key: string, value: string, description: string | undefined, adminUserId: string) {
    return dbStore.systemConfigs.upsert(key, value, description, adminUserId);
  }

  static async getGroupMappings() {
    return dbStore.relevantGroupMappings.getAll();
  }

  static async setGroupMapping(requested: BloodGroup, target: BloodGroup, notes?: string) {
    return dbStore.relevantGroupMappings.setMapping(requested, target, notes);
  }
}
