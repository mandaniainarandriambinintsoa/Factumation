import { z } from 'zod';

const booleanFromString = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return value;
}, z.boolean());

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  SUPABASE_URL: z
    .string()
    .url()
    .refine((url) => url.startsWith('https://'), {
      message: 'SUPABASE_URL must use HTTPS',
    }),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  API_KEY_PEPPER: z.string().min(32).optional(),
  SUPABASE_JWT_AUDIENCE: z.string().min(1).default('authenticated'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  ENABLE_SWAGGER: booleanFromString,
  REQUEST_BODY_LIMIT: z
    .string()
    .regex(/^\d+(?:kb|mb)$/i)
    .default('1mb'),
  DEPENDENCY_TIMEOUT_MS: z.coerce.number().int().min(100).max(30_000).default(3000),
  THROTTLE_TTL_MS: z.coerce.number().int().min(1000).max(3_600_000).default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().min(1).max(10_000).default(120),
  CONTACT_WEBHOOK_URL: z.string().url().optional(),
  CONTACT_WEBHOOK_SECRET: z.string().min(32).optional(),
  OPENROUTER_API_KEY: z.string().min(20).optional(),
  OPENROUTER_EXTRACTION_MODEL: z.string().min(3).default('google/gemini-2.5-flash-lite'),
  OPENROUTER_TRANSCRIPTION_MODEL: z.string().min(3).default('openai/whisper-large-v3-turbo'),
  OPENROUTER_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(60_000).default(55_000),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(input: Record<string, unknown>): Environment {
  const nodeEnvironment = input.NODE_ENV ?? 'development';
  if (nodeEnvironment === 'production' && input.CORS_ORIGINS === undefined) {
    throw new Error('Invalid API environment: CORS_ORIGINS is required in production');
  }
  if ((input.SUPABASE_SERVICE_ROLE_KEY === undefined) !== (input.API_KEY_PEPPER === undefined)) {
    throw new Error(
      'Invalid API environment: SUPABASE_SERVICE_ROLE_KEY and API_KEY_PEPPER must be configured together',
    );
  }
  if ((input.CONTACT_WEBHOOK_URL === undefined) !== (input.CONTACT_WEBHOOK_SECRET === undefined)) {
    throw new Error(
      'Invalid API environment: CONTACT_WEBHOOK_URL and CONTACT_WEBHOOK_SECRET must be configured together',
    );
  }

  const normalized = {
    ...input,
    SUPABASE_URL: input.SUPABASE_URL ?? input.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: input.SUPABASE_ANON_KEY ?? input.VITE_SUPABASE_ANON_KEY,
    ENABLE_SWAGGER: input.ENABLE_SWAGGER ?? nodeEnvironment !== 'production',
  };

  const result = environmentSchema.safeParse(normalized);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid API environment: ${issues}`);
  }

  return result.data;
}

export function parseAllowedOrigins(value: string): ReadonlySet<string> {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of origins) {
    const url = new URL(origin);
    if (url.origin !== origin || url.username || url.password || url.pathname !== '/') {
      throw new Error(`CORS_ORIGINS contains an invalid origin: ${origin}`);
    }
  }

  return new Set(origins);
}
