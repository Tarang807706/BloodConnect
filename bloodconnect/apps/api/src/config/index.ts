import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current dir
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().default('http://localhost:4000'),
  WEB_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://bloodconnect:bloodconnect_pass@localhost:5432/bloodconnect_db?schema=public'),
  JWT_ACCESS_SECRET: z.string().default('bloodconnect_super_secret_access_jwt_key_2026'),
  JWT_REFRESH_SECRET: z.string().default('bloodconnect_super_secret_refresh_jwt_key_2026'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ORCHESTRATOR_STAGE_1_TIMEOUT_MIN: z.coerce.number().default(10),
  ORCHESTRATOR_STAGE_2_TIMEOUT_MIN: z.coerce.number().default(10),
  ORCHESTRATOR_STAGE_3_TIMEOUT_MIN: z.coerce.number().default(15),
  ORCHESTRATOR_MIN_RESPONSES_FACTOR: z.coerce.number().default(1.5),
  LOCATION_APPROX_DECIMALS: z.coerce.number().default(2),
  MAP_PROVIDER: z.enum(['haversine', 'nominatim', 'google']).default('haversine'),
  ENABLE_MOCK_NOTIFICATIONS: z.coerce.boolean().default(true),
});

export const config = envSchema.parse(process.env);
