import { z } from 'zod';
import { BloodGroup } from '../enums';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const RegisterDonorSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Name must be at least 2 characters long'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  bloodGroup: z.nativeEnum(BloodGroup),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area or neighborhood is required'),
  approxLat: z.number().min(-90).max(90),
  approxLng: z.number().min(-180).max(180),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterDonorInput = z.infer<typeof RegisterDonorSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
