import { createServer } from 'node:http';

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'owner@example.test',
  aud: 'authenticated',
  role: 'authenticated',
};
const company = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Société fixture',
  email: user.email,
  fiscalRegion: 'NONE',
  defaultCurrency: 'EUR',
  defaultPaymentMethod: 'bank_transfer',
  isDefault: true,
};
const client = {
  id: '00000000-0000-4000-8000-000000000003',
  name: 'Client fixture',
  email: 'client@example.test',
  fiscalRegion: 'NONE',
};

export async function startAccountFixture() {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({ url: request.url, method: request.method });
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3100');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'authorization, content-type, apikey, x-client-info',
    );
    if (request.method === 'OPTIONS') {
      response.end();
      return;
    }
    if (request.url === '/auth/v1/user') {
      response.end(JSON.stringify(user));
      return;
    }
    const items = request.url.startsWith('/api/v1/companies')
      ? [company]
      : request.url.startsWith('/api/v1/clients')
        ? [client]
        : null;
    if (items && request.headers.authorization) {
      response.end(JSON.stringify({ items, total: 1, page: 1, limit: 100 }));
      return;
    }
    response.statusCode = 401;
    response.end(JSON.stringify({ message: 'Fixture rejects unexpected requests' }));
  });
  await new Promise((resolve) => server.listen(54329, '127.0.0.1', resolve));
  return { requests, close: () => new Promise((resolve) => server.close(resolve)) };
}

export async function authenticateFixture(context) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = (data) => Buffer.from(JSON.stringify(data)).toString('base64url');
  // This deliberately fake token is accepted only by the isolated fixture server.
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, email: user.email, aud: 'authenticated', exp: expires })}.${Buffer.from('test-signature').toString('base64url')}`;
  await context.addCookies([
    {
      name: 'sb-127-auth-token',
      value: `base64-${encode({ access_token: token, refresh_token: 'fixture-refresh-token', expires_at: expires, expires_in: 3600, token_type: 'bearer', user })}`,
      domain: '127.0.0.1',
      path: '/',
    },
  ]);
}
