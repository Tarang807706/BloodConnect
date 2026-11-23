import { z } from 'zod';
import { BloodGroup, BloodComponent, NotificationChannel } from '../enums';

export const UpdateDonorProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  city: z.string().min(2).optional(),
  area: z.string().min(2).optional(),
  approxLat: z.number().min(-90).max(90).optional(),
  approxLng: z.number().min(-180).max(180).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
});

export const UpdateDonorAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  unavailableUntil: z.string().datetime().nullable().optional(),
});

export const UpdateDonorPreferencesSchema = z.object({
  maxTravelKm: z.number().min(1).max(100).default(15),
  preferredComponents: z.array(z.nativeEnum(BloodComponent)).default([BloodComponent.WHOLE_BLOOD]),
  allowedChannels: z.array(z.nativeEnum(NotificationChannel)).default([NotificationChannel.IN_APP, NotificationChannel.EMAIL]),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(), // e.g. "22:00"
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(),   // e.g. "07:00"
});

export type UpdateDonorProfileInput = z.infer<typeof UpdateDonorProfileSchema>;
export type UpdateDonorAvailabilityInput = z.infer<typeof UpdateDonorAvailabilitySchema>;
export type UpdateDonorPreferencesInput = z.infer<typeof UpdateDonorPreferencesSchema>;
