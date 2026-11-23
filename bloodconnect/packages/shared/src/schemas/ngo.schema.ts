import { z } from 'zod';
import { BloodGroup } from '../enums';

export const CreateVolunteerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email().optional(),
  city: z.string().min(2),
  area: z.string().min(2),
  approxLat: z.number().min(-90).max(90),
  approxLng: z.number().min(-180).max(180),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  specialSkills: z.string().max(255).optional(), // e.g. "vehicle driver", "community mobilization"
});

export const ActivateNgoVolunteersSchema = z.object({
  broadcastMessage: z.string().min(5).max(300),
  volunteerIds: z.array(z.string().uuid()).optional(),
});

export type CreateVolunteerInput = z.infer<typeof CreateVolunteerSchema>;
export type ActivateNgoVolunteersInput = z.infer<typeof ActivateNgoVolunteersSchema>;
