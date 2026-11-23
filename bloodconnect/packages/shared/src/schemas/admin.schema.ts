import { z } from 'zod';
import { OrganizationStatus, StageActionType } from '../enums';

export const VerifyOrganizationSchema = z.object({
  status: z.nativeEnum(OrganizationStatus),
  adminNotes: z.string().max(500).optional(),
});

export const UpdateStageRuleSchema = z.object({
  stageNumber: z.number().int().min(1).max(4),
  actionType: z.nativeEnum(StageActionType),
  radiusKm: z.number().min(1).max(100),
  timeoutMinutes: z.number().int().min(1).max(120),
  minResponsesFactor: z.number().min(0.5).max(10.0),
  autoAdvanceOnTimeout: z.boolean(),
});

export const UpdateSystemConfigSchema = z.object({
  configKey: z.string().min(2),
  configValue: z.string(),
  description: z.string().optional(),
});

export type VerifyOrganizationInput = z.infer<typeof VerifyOrganizationSchema>;
export type UpdateStageRuleInput = z.infer<typeof UpdateStageRuleSchema>;
export type UpdateSystemConfigInput = z.infer<typeof UpdateSystemConfigSchema>;
