import { z } from 'zod';
import { OrganizationType } from '../enums';

export const RegisterOrganizationSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters'),
  type: z.nativeEnum(OrganizationType),
  licenseNumber: z.string().min(3, 'Government/Health Department license number is required'),
  contactEmail: z.string().email('Valid official contact email is required'),
  contactPhone: z.string().min(10, 'Valid phone number is required'),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area/District is required'),
  approxLat: z.number().min(-90).max(90),
  approxLng: z.number().min(-180).max(180),
  adminEmail: z.string().email('Admin email is required'),
  adminPassword: z.string().min(8, 'Admin password must be at least 8 characters'),
  adminFullName: z.string().min(2, 'Admin name is required'),
  // Profile specific fields
  emergencyHelpline: z.string().optional(),
  storageCapacityUnits: z.number().int().positive().optional(),
  volunteerCountEstimate: z.number().int().nonnegative().optional(),
});

export type RegisterOrganizationInput = z.infer<typeof RegisterOrganizationSchema>;
