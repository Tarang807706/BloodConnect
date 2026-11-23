import { z } from 'zod';
import { DonationOutcomeType } from '../enums';

export const RecordDonationOutcomeSchema = z.object({
  donorProfileId: z.string().uuid('Valid donor profile ID is required'),
  outcome: z.nativeEnum(DonationOutcomeType),
  unitsCollected: z.number().int().min(0).max(5).default(0),
  deferralReason: z.string().max(255).optional(),
  clinicalNotes: z.string().max(500).optional(),
});

export type RecordDonationOutcomeInput = z.infer<typeof RecordDonationOutcomeSchema>;
