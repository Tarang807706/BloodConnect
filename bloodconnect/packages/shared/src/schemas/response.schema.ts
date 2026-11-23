import { z } from 'zod';
import { ResponseType } from '../enums';

export const DonorResponseSchema = z.object({
  response: z.nativeEnum(ResponseType),
  estimatedArrivalMinutes: z.number().int().min(5).max(360).optional(),
  notes: z.string().max(200).optional(),
  acknowledgedDisclaimer: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge that your response expresses willingness and medical eligibility is decided solely by the blood centre.',
  }),
});

export const VolunteerResponseSchema = z.object({
  caseId: z.string().uuid(),
  volunteerId: z.string().uuid(),
  response: z.nativeEnum(ResponseType),
  notes: z.string().max(200).optional(),
});

export type DonorResponseInput = z.infer<typeof DonorResponseSchema>;
export type VolunteerResponseInput = z.infer<typeof VolunteerResponseSchema>;
