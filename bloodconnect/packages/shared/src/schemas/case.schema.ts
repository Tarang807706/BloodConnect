import { z } from 'zod';

export const ActivateCaseSchema = z.object({
  customStage1RadiusKm: z.number().min(1).max(50).optional(),
  notes: z.string().max(500).optional(),
});

export const PauseCaseSchema = z.object({
  reason: z.string().min(5, 'Pause reason is mandatory for clinical audit trail'),
});

export const EscalateCaseSchema = z.object({
  reason: z.string().min(5, 'Escalation rationale is required'),
});

export const CancelCaseSchema = z.object({
  reason: z.string().min(5, 'Cancellation reason is mandatory for audit'),
});

export const CloseCaseSchema = z.object({
  closingNotes: z.string().min(5, 'Closing clinical summary is required'),
});

export type ActivateCaseInput = z.infer<typeof ActivateCaseSchema>;
export type PauseCaseInput = z.infer<typeof PauseCaseSchema>;
export type EscalateCaseInput = z.infer<typeof EscalateCaseSchema>;
export type CancelCaseInput = z.infer<typeof CancelCaseSchema>;
export type CloseCaseInput = z.infer<typeof CloseCaseSchema>;
