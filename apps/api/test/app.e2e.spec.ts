import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { Environment } from '../src/config/environment.js';

process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://project.supabase.co';
process.env.SUPABASE_ANON_KEY = 'public-anon-key-with-enough-characters';
process.env.ENABLE_SWAGGER = 'true';

describe('API foundation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const [{ AppModule }, { configureApplication }] = await Promise.all([
      import('../src/app.module.js'),
      import('../src/config/configure-application.js'),
    ]);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    configureApplication(app, app.get(ConfigService<Environment, true>));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    vi.unstubAllGlobals();
  });

  it('exposes an unauthenticated liveness probe with a request id', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/live').expect(200);

    expect(response.body).toEqual({ status: 'ok', service: 'factumation-api' });
    expect(response.headers['x-request-id']).toMatch(/^[A-Za-z0-9._-]{8,128}$/);
  });

  it('checks Supabase dependencies concurrently for readiness', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await request(app.getHttpServer()).get('/api/health/ready').expect(200);

    expect(response.body.dependencies).toEqual({ auth: 'up', dataApi: 'up' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports readiness failure without leaking dependency details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private upstream detail')));

    const response = await request(app.getHttpServer()).get('/api/health/ready').expect(503);

    expect(response.body.detail).toBe('An unexpected server error occurred.');
    expect(JSON.stringify(response.body)).not.toContain('private upstream detail');
  });

  it('protects versioned endpoints by default with Problem Details errors', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body).toMatchObject({
      type: 'about:blank',
      status: 401,
      detail: 'A bearer access token is required.',
      instance: '/api/v1/auth/me',
    });
    expect(response.body.requestId).toEqual(response.headers['x-request-id']);
  });

  it('publishes OpenAPI only when explicitly enabled', async () => {
    await request(app.getHttpServer()).get('/api/docs/openapi.json').expect(200);
  });
});
