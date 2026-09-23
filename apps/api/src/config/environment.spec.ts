import { describe, expect, it } from 'vitest';

import { parseAllowedOrigins, validateEnvironment } from './environment.js';

const validEnvironment = {
  NODE_ENV: 'test',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_ANON_KEY: 'public-anon-key-with-enough-characters',
};

describe('validateEnvironment', () => {
  it('applies safe defaults and coerces numeric settings', () => {
    const environment = validateEnvironment({
      ...validEnvironment,
      PORT: '3101',
      ENABLE_SWAGGER: 'false',
    });

    expect(environment.PORT).toBe(3101);
    expect(environment.ENABLE_SWAGGER).toBe(false);
    expect(environment.THROTTLE_LIMIT).toBe(120);
    expect(environment.OPENROUTER_EXTRACTION_MODEL).toBe('google/gemini-2.5-flash-lite');
    expect(environment.OPENROUTER_TRANSCRIPTION_MODEL).toBe('openai/whisper-large-v3-turbo');
  });

  it('supports the legacy public variable names during migration', () => {
    const environment = validateEnvironment({
      VITE_SUPABASE_URL: validEnvironment.SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: validEnvironment.SUPABASE_ANON_KEY,
    });

    expect(environment.SUPABASE_URL).toBe(validEnvironment.SUPABASE_URL);
  });

  it('rejects missing or insecure Supabase configuration', () => {
    expect(() =>
      validateEnvironment({ SUPABASE_URL: 'http://localhost:54321', SUPABASE_ANON_KEY: 'short' }),
    ).toThrow('Invalid API environment');
  });

  it('requires contact webhook URL and signing secret together', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        CONTACT_WEBHOOK_URL: 'https://automation.example.com/contact',
      }),
    ).toThrow('CONTACT_WEBHOOK_URL and CONTACT_WEBHOOK_SECRET must be configured together');
  });

  it('requires an explicit CORS allowlist and disables Swagger by default in production', () => {
    expect(() => validateEnvironment({ ...validEnvironment, NODE_ENV: 'production' })).toThrow(
      'CORS_ORIGINS is required in production',
    );

    const environment = validateEnvironment({
      ...validEnvironment,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://factumation.app',
    });
    expect(environment.ENABLE_SWAGGER).toBe(false);
  });
});

describe('parseAllowedOrigins', () => {
  it('normalizes a comma-separated allowlist', () => {
    expect([...parseAllowedOrigins('https://factumation.app, http://localhost:3000')]).toEqual([
      'https://factumation.app',
      'http://localhost:3000',
    ]);
  });

  it('rejects origins with paths', () => {
    expect(() => parseAllowedOrigins('https://factumation.app/private')).toThrow(
      'CORS_ORIGINS contains an invalid origin',
    );
  });
});
