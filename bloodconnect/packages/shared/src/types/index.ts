import { UserRole, BloodGroup, BloodComponent, Urgency, RequestStatus, CaseStatus, StageActionType, ResponseType, DonationOutcomeType } from '../enums';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  donorProfileId?: string | null;
  tokenFamily?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    organizationId?: string | null;
    organizationName?: string | null;
    donorProfileId?: string | null;
  };
}

export interface ApproximateLocation {
  approxLat: number;
  approxLng: number;
  city: string;
  area: string;
  gridCell?: string;
}

export interface CaseTimelineEntry {
  id: string;
  caseId: string;
  fromStatus: string | null;
  toStatus: string;
  reason?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  createdAt: string;
}

export interface WillingDonorSummary {
  donorProfileId: string;
  bloodGroup: BloodGroup;
  approxDistanceKm: number;
  city: string;
  area: string;
  contactPhone?: string; // Revealed only to authorized blood centre
  fullName?: string;     // Revealed only to authorized blood centre
  responseType: ResponseType;
  estimatedArrivalMinutes?: number | null;
  respondedAt: string;
  disclaimer: string;
}

export interface HospitalCaseView {
  caseId: string;
  requestId: string;
  bloodGroup: BloodGroup;
  component: BloodComponent;
  unitsRequested: number;
  unitsShortage: number;
  status: CaseStatus;
  currentStage: number;
  stageAction: StageActionType;
  potentialDonorsMobilizedCount: number;
  willingResponsesCount: number;
  unitsFulfilled: number;
  requiredBy: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalRequests: number;
  totalActiveCases: number;
  totalFulfilledCases: number;
  averageResponseTimeMinutes: number;
  stageReachRate: {
    stage1Pct: number;
    stage2Pct: number;
    stage3NgoPct: number;
    stage4EscalatedPct: number;
  };
  casesByUrgency: {
    critical: number;
    high: number;
    medium: number;
  };
  regionalBreakdown: Array<{
    city: string;
    totalCases: number;
    fulfilledCases: number;
  }>;
}
