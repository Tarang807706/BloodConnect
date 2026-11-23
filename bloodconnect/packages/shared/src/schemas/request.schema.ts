import { z } from 'zod';
import { BloodGroup, BloodComponent, Urgency } from '../enums';

export const CreateEmergencyRequestSchema = z.object({
  bloodCentreId: z.string().uuid('Please select an authorized regional blood centre'),
  bloodGroup: z.nativeEnum(BloodGroup),
  component: z.nativeEnum(BloodComponent),
  unitsNeeded: z.number().int().min(1, 'At least 1 unit must be requested').max(50, 'Max 50 units per emergency batch'),
  urgency: z.nativeEnum(Urgency),
  requiredBy: z.string().datetime('Must be a valid ISO datetime'),
  clinicalNotes: z.string().max(300, 'Do not include patient identifiers. Mention only clinical context like ICU/OT').optional(),
  approxLat: z.number().min(-90).max(90),
  approxLng: z.number().min(-180).max(180),
});

export const CancelRequestSchema = z.object({
  reason: z.string().min(5, 'A clear cancellation reason is mandatory for audit trail'),
});

export const VerifyRequestSchema = z.object({
  unitsAvailableAtCentre: z.number().int().min(0, 'Available units cannot be negative'),
  verificationNotes: z.string().max(500).optional(),
  rejectionReason: z.string().optional(),
});

export type CreateEmergencyRequestInput = z.infer<typeof CreateEmergencyRequestSchema>;
export type CancelRequestInput = z.infer<typeof CancelRequestSchema>;
export type VerifyRequestInput = z.infer<typeof VerifyRequestSchema>;
