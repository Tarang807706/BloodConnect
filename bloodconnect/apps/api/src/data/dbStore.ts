import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  UserRole,
  OrganizationType,
  OrganizationStatus,
  RequestStatus,
  CaseStatus,
  StageActionType,
  ResponseType,
  BloodGroup,
  BloodComponent,
  Urgency,
  NotificationChannel,
  DeliveryStatus,
  DonationOutcomeType,
} from '@bloodconnect/shared';
import { logger } from '../common/logger/pino';

// Define DB Models
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  tokenFamily: string;
  isRevoked: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  licenseNumber: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  area: string;
  approxLat: number;
  approxLng: number;
  gridCell?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalProfileRecord {
  id: string;
  organizationId: string;
  emergencyHelpline?: string | null;
  bedCapacity?: number | null;
  traumaCenterLevel?: string | null;
}

export interface BloodCentreProfileRecord {
  id: string;
  organizationId: string;
  storageCapacityUnits: number;
  licenseExpiryDate?: string | null;
  operatingHours: string;
}

export interface NgoProfileRecord {
  id: string;
  organizationId: string;
  volunteerCountEstimate: number;
  primaryContactName?: string | null;
}

export interface DonorProfileRecord {
  id: string;
  userId: string;
  bloodGroup: BloodGroup;
  phone: string;
  city: string;
  area: string;
  approxLat: number;
  approxLng: number;
  gridCell?: string | null;
  isAvailable: boolean;
  unavailableUntil?: string | null;
  maxTravelKm: number;
  preferredComponents: string;
  allowedChannels: string;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerRecord {
  id: string;
  ngoProfileId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  city: string;
  area: string;
  approxLat: number;
  approxLng: number;
  gridCell?: string | null;
  bloodGroup?: BloodGroup | null;
  specialSkills?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyRequestRecord {
  id: string;
  hospitalId: string;
  bloodCentreId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsNeeded: number;
  urgency: Urgency;
  requiredBy: string;
  status: RequestStatus;
  clinicalNotes?: string | null;
  approxLat: number;
  approxLng: number;
  createdAt: string;
  updatedAt: string;
}

export interface RequestVerificationRecord {
  id: string;
  requestId: string;
  verifiedByUserId: string;
  unitsAvailableAtCentre: number;
  shortageUnits: number;
  status: RequestStatus;
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface RequestStatusHistoryRecord {
  id: string;
  requestId: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  reason?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  createdAt: string;
}

export interface EmergencyCaseRecord {
  id: string;
  requestId: string;
  bloodCentreId: string;
  shortageUnits: number;
  unitsFulfilled: number;
  status: CaseStatus;
  currentStageNumber: number;
  pausedFromStatus?: CaseStatus | null;
  pauseReason?: string | null;
  cancelReason?: string | null;
  closingNotes?: string | null;
  version: number;
  nextStageDueAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseStageRuleRecord {
  id: string;
  stageNumber: number;
  actionType: StageActionType;
  radiusKm: number;
  timeoutMinutes: number;
  minResponsesFactor: number;
  autoAdvanceOnTimeout: boolean;
  version: number;
  updatedAt: string;
}

export interface CaseStageRecord {
  id: string;
  caseId: string;
  stageNumber: number;
  actionType: StageActionType;
  radiusKm: number;
  timeoutMinutes: number;
  minResponsesFactor: number;
  startedAt: string;
  dueAt: string;
  completedAt?: string | null;
  isCurrent: boolean;
}

export interface CaseStatusHistoryRecord {
  id: string;
  caseId: string;
  fromStatus: CaseStatus | null;
  toStatus: CaseStatus;
  reason?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  createdAt: string;
}

export interface DonorNotificationRecord {
  id: string;
  caseId: string;
  stageNumber: number;
  donorProfileId: string;
  distanceKm: number;
  sentAt: string;
}

export interface DonorResponseRecord {
  id: string;
  caseId: string;
  donorProfileId: string;
  response: ResponseType;
  estimatedArrivalMinutes?: number | null;
  notes?: string | null;
  respondedAt: string;
  acknowledgedDisclaimer: boolean;
}

export interface NgoActivationRecord {
  id: string;
  caseId: string;
  ngoOrganizationId: string;
  broadcastMessage?: string | null;
  activatedAt: string;
}

export interface VolunteerResponseRecord {
  id: string;
  activationId: string;
  volunteerId: string;
  response: ResponseType;
  notes?: string | null;
  respondedAt: string;
}

export interface CaseEscalationTargetRecord {
  id: string;
  caseId: string;
  targetCentreOrgId: string;
  notifiedAt: string;
  status: string;
}

export interface DonationOutcomeRecord {
  id: string;
  caseId: string;
  donorProfileId: string;
  recordedByUserId: string;
  outcome: DonationOutcomeType;
  unitsCollected: number;
  deferralReason?: string | null;
  clinicalNotes?: string | null;
  recordedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  body: string;
  dataJson?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationDeliveryRecord {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  attempts: number;
  lastError?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  detailsJson?: string | null;
  createdAt: string;
}

export interface SystemConfigRecord {
  id: string;
  configKey: string;
  configValue: string;
  description?: string | null;
  updatedAt: string;
}

export interface SystemConfigHistoryRecord {
  id: string;
  configKey: string;
  previousValue: string;
  newValue: string;
  changedByUserId?: string | null;
  createdAt: string;
}

export interface RelevantGroupMappingRecord {
  id: string;
  requestedGroup: BloodGroup;
  targetDonorGroup: BloodGroup;
  notes?: string | null;
}

interface DatabaseSchema {
  users: UserRecord[];
  refreshTokens: RefreshTokenRecord[];
  organizations: OrganizationRecord[];
  hospitalProfiles: HospitalProfileRecord[];
  bloodCentreProfiles: BloodCentreProfileRecord[];
  ngoProfiles: NgoProfileRecord[];
  donorProfiles: DonorProfileRecord[];
  volunteers: VolunteerRecord[];
  emergencyRequests: EmergencyRequestRecord[];
  requestVerifications: RequestVerificationRecord[];
  requestStatusHistory: RequestStatusHistoryRecord[];
  emergencyCases: EmergencyCaseRecord[];
  caseStageRules: CaseStageRuleRecord[];
  caseStages: CaseStageRecord[];
  caseStatusHistory: CaseStatusHistoryRecord[];
  donorNotifications: DonorNotificationRecord[];
  donorResponses: DonorResponseRecord[];
  ngoActivations: NgoActivationRecord[];
  volunteerResponses: VolunteerResponseRecord[];
  caseEscalationTargets: CaseEscalationTargetRecord[];
  donationOutcomes: DonationOutcomeRecord[];
  notifications: NotificationRecord[];
  notificationDeliveries: NotificationDeliveryRecord[];
  auditLogs: AuditLogRecord[];
  systemConfigs: SystemConfigRecord[];
  systemConfigHistory: SystemConfigHistoryRecord[];
  relevantGroupMappings: RelevantGroupMappingRecord[];
}

class InMemoryDbStore {
  private data: DatabaseSchema;
  private filePath: string;
  private isPersisting = false;

  constructor() {
    this.filePath = path.resolve(process.cwd(), 'data', 'bloodconnect_store.json');
    this.data = this.createEmptySchema();
    this.loadFromFile();
  }

  private createEmptySchema(): DatabaseSchema {
    return {
      users: [],
      refreshTokens: [],
      organizations: [],
      hospitalProfiles: [],
      bloodCentreProfiles: [],
      ngoProfiles: [],
      donorProfiles: [],
      volunteers: [],
      emergencyRequests: [],
      requestVerifications: [],
      requestStatusHistory: [],
      emergencyCases: [],
      caseStageRules: [],
      caseStages: [],
      caseStatusHistory: [],
      donorNotifications: [],
      donorResponses: [],
      ngoActivations: [],
      volunteerResponses: [],
      caseEscalationTargets: [],
      donationOutcomes: [],
      notifications: [],
      notificationDeliveries: [],
      auditLogs: [],
      systemConfigs: [],
      systemConfigHistory: [],
      relevantGroupMappings: [],
    };
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = { ...this.createEmptySchema(), ...JSON.parse(raw) };
      }
    } catch (e) {
      logger.warn({ err: (e as any).message }, 'Could not read persisted json store, using fresh in-memory store');
    }
  }

  public persist() {
    if (this.isPersisting) return;
    this.isPersisting = true;
    setTimeout(() => {
      try {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err: any) {
        logger.error({ err: err.message }, 'Failed to persist store');
      } finally {
        this.isPersisting = false;
      }
    }, 100);
  }

  public clear() {
    this.data = this.createEmptySchema();
    this.persist();
  }

  // Repository Collections
  public get users() {
    return {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        return this.data.users.find(u => (where.id && u.id === where.id) || (where.email && u.email.toLowerCase() === where.email.toLowerCase())) || null;
      },
      findMany: async (filter?: (u: UserRecord) => boolean) => {
        return filter ? this.data.users.filter(filter) : [...this.data.users];
      },
      create: async (data: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
        const record: UserRecord = {
          id: data.id || uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.users.push(record);
        this.persist();
        return record;
      },
      update: async (id: string, updates: Partial<UserRecord>) => {
        const idx = this.data.users.findIndex(u => u.id === id);
        if (idx === -1) throw new Error(`User with id ${id} not found`);
        this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
        this.persist();
        return this.data.users[idx];
      },
    };
  }

  public get refreshTokens() {
    return {
      findUnique: async (tokenHash: string) => {
        return this.data.refreshTokens.find(t => t.tokenHash === tokenHash) || null;
      },
      create: async (data: Omit<RefreshTokenRecord, 'id' | 'createdAt'>) => {
        const record: RefreshTokenRecord = {
          id: uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        this.data.refreshTokens.push(record);
        this.persist();
        return record;
      },
      revokeFamily: async (tokenFamily: string) => {
        this.data.refreshTokens.forEach(t => {
          if (t.tokenFamily === tokenFamily) t.isRevoked = true;
        });
        this.persist();
      },
      revokeToken: async (id: string) => {
        const t = this.data.refreshTokens.find(x => x.id === id);
        if (t) {
          t.isRevoked = true;
          this.persist();
        }
      },
    };
  }

  public get organizations() {
    return {
      findUnique: async (id: string) => {
        return this.data.organizations.find(o => o.id === id) || null;
      },
      findMany: async (filter?: (o: OrganizationRecord) => boolean) => {
        return filter ? this.data.organizations.filter(filter) : [...this.data.organizations];
      },
      create: async (data: Omit<OrganizationRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
        const record: OrganizationRecord = {
          id: data.id || uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.organizations.push(record);
        this.persist();
        return record;
      },
      update: async (id: string, updates: Partial<OrganizationRecord>) => {
        const idx = this.data.organizations.findIndex(o => o.id === id);
        if (idx === -1) throw new Error(`Organization ${id} not found`);
        this.data.organizations[idx] = { ...this.data.organizations[idx], ...updates, updatedAt: new Date().toISOString() };
        this.persist();
        return this.data.organizations[idx];
      },
    };
  }

  public get donorProfiles() {
    return {
      findUniqueByUserId: async (userId: string) => {
        return this.data.donorProfiles.find(d => d.userId === userId) || null;
      },
      findUnique: async (id: string) => {
        return this.data.donorProfiles.find(d => d.id === id) || null;
      },
      findMany: async (filter?: (d: DonorProfileRecord) => boolean) => {
        return filter ? this.data.donorProfiles.filter(filter) : [...this.data.donorProfiles];
      },
      create: async (data: Omit<DonorProfileRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
        const record: DonorProfileRecord = {
          id: data.id || uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.donorProfiles.push(record);
        this.persist();
        return record;
      },
      update: async (id: string, updates: Partial<DonorProfileRecord>) => {
        const idx = this.data.donorProfiles.findIndex(d => d.id === id);
        if (idx === -1) throw new Error(`Donor profile ${id} not found`);
        this.data.donorProfiles[idx] = { ...this.data.donorProfiles[idx], ...updates, updatedAt: new Date().toISOString() };
        this.persist();
        return this.data.donorProfiles[idx];
      },
    };
  }

  public get emergencyRequests() {
    return {
      findUnique: async (id: string) => {
        return this.data.emergencyRequests.find(r => r.id === id) || null;
      },
      findMany: async (filter?: (r: EmergencyRequestRecord) => boolean) => {
        const list = filter ? this.data.emergencyRequests.filter(filter) : [...this.data.emergencyRequests];
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      create: async (data: Omit<EmergencyRequestRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
        const record: EmergencyRequestRecord = {
          id: data.id || uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.emergencyRequests.push(record);
        this.persist();
        return record;
      },
      update: async (id: string, updates: Partial<EmergencyRequestRecord>) => {
        const idx = this.data.emergencyRequests.findIndex(r => r.id === id);
        if (idx === -1) throw new Error(`Emergency request ${id} not found`);
        this.data.emergencyRequests[idx] = { ...this.data.emergencyRequests[idx], ...updates, updatedAt: new Date().toISOString() };
        this.persist();
        return this.data.emergencyRequests[idx];
      },
    };
  }

  public get requestVerifications() {
    return {
      findUniqueByRequestId: async (requestId: string) => {
        return this.data.requestVerifications.find(v => v.requestId === requestId) || null;
      },
      create: async (data: Omit<RequestVerificationRecord, 'id' | 'createdAt'>) => {
        const record: RequestVerificationRecord = {
          id: uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        this.data.requestVerifications.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get requestStatusHistory() {
    return {
      findByRequestId: async (requestId: string) => {
        return this.data.requestStatusHistory
          .filter(h => h.requestId === requestId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },
      create: async (data: Omit<RequestStatusHistoryRecord, 'id' | 'createdAt'>) => {
        const record: RequestStatusHistoryRecord = {
          id: uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        this.data.requestStatusHistory.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get emergencyCases() {
    return {
      findUnique: async (id: string) => {
        return this.data.emergencyCases.find(c => c.id === id) || null;
      },
      findByRequestId: async (requestId: string) => {
        return this.data.emergencyCases.find(c => c.requestId === requestId) || null;
      },
      findMany: async (filter?: (c: EmergencyCaseRecord) => boolean) => {
        const list = filter ? this.data.emergencyCases.filter(filter) : [...this.data.emergencyCases];
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      create: async (data: Omit<EmergencyCaseRecord, 'id' | 'createdAt' | 'updatedAt' | 'version'> & { id?: string }) => {
        const record: EmergencyCaseRecord = {
          id: data.id || uuidv4(),
          version: 1,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.emergencyCases.push(record);
        this.persist();
        return record;
      },
      update: async (id: string, updates: Partial<EmergencyCaseRecord>) => {
        const idx = this.data.emergencyCases.findIndex(c => c.id === id);
        if (idx === -1) throw new Error(`Case ${id} not found`);
        const currentVersion = this.data.emergencyCases[idx].version;
        this.data.emergencyCases[idx] = {
          ...this.data.emergencyCases[idx],
          ...updates,
          version: currentVersion + 1,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.emergencyCases[idx];
      },
    };
  }

  public get caseStages() {
    return {
      findByCaseId: async (caseId: string) => {
        return this.data.caseStages
          .filter(s => s.caseId === caseId)
          .sort((a, b) => a.stageNumber - b.stageNumber);
      },
      getCurrentStage: async (caseId: string) => {
        return this.data.caseStages.find(s => s.caseId === caseId && s.isCurrent) || null;
      },
      create: async (data: Omit<CaseStageRecord, 'id'>) => {
        // Mark previous stages as not current
        this.data.caseStages.forEach(s => {
          if (s.caseId === data.caseId && s.isCurrent) {
            s.isCurrent = false;
            s.completedAt = new Date().toISOString();
          }
        });
        const record: CaseStageRecord = {
          id: uuidv4(),
          ...data,
        };
        this.data.caseStages.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get caseStageRules() {
    return {
      findByStageNumber: async (stageNumber: number) => {
        return this.data.caseStageRules.find(r => r.stageNumber === stageNumber) || null;
      },
      getAll: async () => {
        return [...this.data.caseStageRules].sort((a, b) => a.stageNumber - b.stageNumber);
      },
      upsert: async (rule: Omit<CaseStageRuleRecord, 'id' | 'updatedAt' | 'version'>) => {
        const idx = this.data.caseStageRules.findIndex(r => r.stageNumber === rule.stageNumber);
        if (idx !== -1) {
          this.data.caseStageRules[idx] = {
            ...this.data.caseStageRules[idx],
            ...rule,
            version: this.data.caseStageRules[idx].version + 1,
            updatedAt: new Date().toISOString(),
          };
          this.persist();
          return this.data.caseStageRules[idx];
        } else {
          const record: CaseStageRuleRecord = {
            id: uuidv4(),
            ...rule,
            version: 1,
            updatedAt: new Date().toISOString(),
          };
          this.data.caseStageRules.push(record);
          this.persist();
          return record;
        }
      },
    };
  }

  public get caseStatusHistory() {
    return {
      findByCaseId: async (caseId: string) => {
        return this.data.caseStatusHistory
          .filter(h => h.caseId === caseId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      },
      create: async (data: Omit<CaseStatusHistoryRecord, 'id' | 'createdAt'>) => {
        const record: CaseStatusHistoryRecord = {
          id: uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        this.data.caseStatusHistory.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get donorNotifications() {
    return {
      findByCaseId: async (caseId: string) => {
        return this.data.donorNotifications.filter(n => n.caseId === caseId);
      },
      findByDonorProfileId: async (donorProfileId: string) => {
        return this.data.donorNotifications
          .filter(n => n.donorProfileId === donorProfileId)
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      },
      hasNotified: async (caseId: string, donorProfileId: string) => {
        return this.data.donorNotifications.some(n => n.caseId === caseId && n.donorProfileId === donorProfileId);
      },
      createBatch: async (records: Array<Omit<DonorNotificationRecord, 'id' | 'sentAt'>>) => {
        const created: DonorNotificationRecord[] = [];
        const now = new Date().toISOString();
        for (const r of records) {
          if (!this.data.donorNotifications.some(x => x.caseId === r.caseId && x.donorProfileId === r.donorProfileId)) {
            const entry: DonorNotificationRecord = {
              id: uuidv4(),
              ...r,
              sentAt: now,
            };
            this.data.donorNotifications.push(entry);
            created.push(entry);
          }
        }
        this.persist();
        return created;
      },
    };
  }

  public get donorResponses() {
    return {
      findByCaseId: async (caseId: string) => {
        return this.data.donorResponses.filter(r => r.caseId === caseId);
      },
      findByDonorProfileId: async (donorProfileId: string) => {
        return this.data.donorResponses.filter(r => r.donorProfileId === donorProfileId);
      },
      upsertResponse: async (data: Omit<DonorResponseRecord, 'id' | 'respondedAt'>) => {
        const idx = this.data.donorResponses.findIndex(r => r.caseId === data.caseId && r.donorProfileId === data.donorProfileId);
        const now = new Date().toISOString();
        if (idx !== -1) {
          this.data.donorResponses[idx] = {
            ...this.data.donorResponses[idx],
            ...data,
            respondedAt: now,
          };
          this.persist();
          return this.data.donorResponses[idx];
        } else {
          const entry: DonorResponseRecord = {
            id: uuidv4(),
            ...data,
            respondedAt: now,
          };
          this.data.donorResponses.push(entry);
          this.persist();
          return entry;
        }
      },
    };
  }

  public get ngoActivations() {
    return {
      findByCaseId: async (caseId: string) => {
        return this.data.ngoActivations.filter(a => a.caseId === caseId);
      },
      findByNgoId: async (ngoOrganizationId: string) => {
        return this.data.ngoActivations.filter(a => a.ngoOrganizationId === ngoOrganizationId);
      },
      create: async (data: Omit<NgoActivationRecord, 'id' | 'activatedAt'>) => {
        const record: NgoActivationRecord = {
          id: uuidv4(),
          ...data,
          activatedAt: new Date().toISOString(),
        };
        this.data.ngoActivations.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get volunteers() {
    return {
      findByNgoProfileId: async (ngoProfileId: string) => {
        return this.data.volunteers.filter(v => v.ngoProfileId === ngoProfileId);
      },
      findUnique: async (id: string) => {
        return this.data.volunteers.find(v => v.id === id) || null;
      },
      create: async (data: Omit<VolunteerRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
        const record: VolunteerRecord = {
          id: uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.volunteers.push(record);
        this.persist();
        return record;
      },
      update: async (id: string, updates: Partial<VolunteerRecord>) => {
        const idx = this.data.volunteers.findIndex(v => v.id === id);
        if (idx === -1) throw new Error(`Volunteer ${id} not found`);
        this.data.volunteers[idx] = { ...this.data.volunteers[idx], ...updates, updatedAt: new Date().toISOString() };
        this.persist();
        return this.data.volunteers[idx];
      },
    };
  }

  public get volunteerResponses() {
    return {
      findByActivationId: async (activationId: string) => {
        return this.data.volunteerResponses.filter(r => r.activationId === activationId);
      },
      create: async (data: Omit<VolunteerResponseRecord, 'id' | 'respondedAt'>) => {
        const record: VolunteerResponseRecord = {
          id: uuidv4(),
          ...data,
          respondedAt: new Date().toISOString(),
        };
        this.data.volunteerResponses.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get donationOutcomes() {
    return {
      findByCaseId: async (caseId: string) => {
        return this.data.donationOutcomes.filter(o => o.caseId === caseId);
      },
      create: async (data: Omit<DonationOutcomeRecord, 'id' | 'recordedAt'>) => {
        const record: DonationOutcomeRecord = {
          id: uuidv4(),
          ...data,
          recordedAt: new Date().toISOString(),
        };
        this.data.donationOutcomes.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get notifications() {
    return {
      findByUserId: async (userId: string) => {
        return this.data.notifications
          .filter(n => n.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      countUnread: async (userId: string) => {
        return this.data.notifications.filter(n => n.userId === userId && !n.isRead).length;
      },
      markAsRead: async (id: string, userId: string) => {
        const n = this.data.notifications.find(x => x.id === id && x.userId === userId);
        if (n) {
          n.isRead = true;
          this.persist();
        }
      },
      markAllAsRead: async (userId: string) => {
        this.data.notifications.forEach(n => {
          if (n.userId === userId) n.isRead = true;
        });
        this.persist();
      },
      create: async (data: Omit<NotificationRecord, 'id' | 'createdAt' | 'isRead'>) => {
        const record: NotificationRecord = {
          id: uuidv4(),
          ...data,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        this.data.notifications.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get notificationDeliveries() {
    return {
      create: async (data: Omit<NotificationDeliveryRecord, 'id' | 'createdAt'>) => {
        const record: NotificationDeliveryRecord = {
          id: uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        this.data.notificationDeliveries.push(record);
        this.persist();
        return record;
      },
      findByNotificationId: async (notificationId: string) => {
        return this.data.notificationDeliveries.filter(d => d.notificationId === notificationId);
      },
    };
  }

  public get auditLogs() {
    return {
      findMany: async (filter?: (a: AuditLogRecord) => boolean) => {
        const list = filter ? this.data.auditLogs.filter(filter) : [...this.data.auditLogs];
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },
      create: async (data: Omit<AuditLogRecord, 'id' | 'createdAt'>) => {
        const record: AuditLogRecord = {
          id: uuidv4(),
          ...data,
          createdAt: new Date().toISOString(),
        };
        this.data.auditLogs.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get systemConfigs() {
    return {
      findUnique: async (key: string) => {
        return this.data.systemConfigs.find(c => c.configKey === key) || null;
      },
      getAll: async () => {
        return [...this.data.systemConfigs];
      },
      upsert: async (key: string, value: string, description?: string, changedByUserId?: string) => {
        const idx = this.data.systemConfigs.findIndex(c => c.configKey === key);
        const prevValue = idx !== -1 ? this.data.systemConfigs[idx].configValue : '';
        const now = new Date().toISOString();
        if (idx !== -1) {
          this.data.systemConfigs[idx].configValue = value;
          if (description) this.data.systemConfigs[idx].description = description;
          this.data.systemConfigs[idx].updatedAt = now;
        } else {
          this.data.systemConfigs.push({
            id: uuidv4(),
            configKey: key,
            configValue: value,
            description: description || null,
            updatedAt: now,
          });
        }
        // Write history
        this.data.systemConfigHistory.push({
          id: uuidv4(),
          configKey: key,
          previousValue: prevValue,
          newValue: value,
          changedByUserId: changedByUserId || null,
          createdAt: now,
        });
        this.persist();
      },
    };
  }

  public get relevantGroupMappings() {
    return {
      getAll: async () => {
        return [...this.data.relevantGroupMappings];
      },
      getTargetGroupsForRequestedGroup: async (requestedGroup: BloodGroup): Promise<BloodGroup[]> => {
        const mappings = this.data.relevantGroupMappings.filter(m => m.requestedGroup === requestedGroup);
        if (mappings.length > 0) {
          return mappings.map(m => m.targetDonorGroup);
        }
        // Default rule: strictly same blood group notification (administrative targeting)
        return [requestedGroup];
      },
      setMapping: async (requestedGroup: BloodGroup, targetDonorGroup: BloodGroup, notes?: string) => {
        const exists = this.data.relevantGroupMappings.some(
          m => m.requestedGroup === requestedGroup && m.targetDonorGroup === targetDonorGroup
        );
        if (!exists) {
          this.data.relevantGroupMappings.push({
            id: uuidv4(),
            requestedGroup,
            targetDonorGroup,
            notes: notes || null,
          });
          this.persist();
        }
      },
    };
  }

  public get hospitalProfiles() {
    return {
      findUniqueByOrgId: async (orgId: string) => {
        return this.data.hospitalProfiles.find(h => h.organizationId === orgId) || null;
      },
      create: async (data: Omit<HospitalProfileRecord, 'id'>) => {
        const record: HospitalProfileRecord = { id: uuidv4(), ...data };
        this.data.hospitalProfiles.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get bloodCentreProfiles() {
    return {
      findUniqueByOrgId: async (orgId: string) => {
        return this.data.bloodCentreProfiles.find(b => b.organizationId === orgId) || null;
      },
      create: async (data: Omit<BloodCentreProfileRecord, 'id'>) => {
        const record: BloodCentreProfileRecord = { id: uuidv4(), ...data };
        this.data.bloodCentreProfiles.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get ngoProfiles() {
    return {
      findUniqueByOrgId: async (orgId: string) => {
        return this.data.ngoProfiles.find(n => n.organizationId === orgId) || null;
      },
      create: async (data: Omit<NgoProfileRecord, 'id'>) => {
        const record: NgoProfileRecord = { id: uuidv4(), ...data };
        this.data.ngoProfiles.push(record);
        this.persist();
        return record;
      },
    };
  }

  public get caseEscalationTargets() {
    return {
      findByCaseId: async (caseId: string) => {
        return this.data.caseEscalationTargets.filter(t => t.caseId === caseId);
      },
      create: async (data: Omit<CaseEscalationTargetRecord, 'id' | 'notifiedAt'>) => {
        const record: CaseEscalationTargetRecord = {
          id: uuidv4(),
          ...data,
          notifiedAt: new Date().toISOString(),
        };
        this.data.caseEscalationTargets.push(record);
        this.persist();
        return record;
      },
    };
  }
}

export const dbStore = new InMemoryDbStore();
