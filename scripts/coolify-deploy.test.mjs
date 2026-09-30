import assert from 'node:assert/strict';
import test from 'node:test';
import { deployAll, readConfiguration } from './coolify-deploy.mjs';

const environment = {
  COOLIFY_URL: 'https://coolify.example.com',
  COOLIFY_API_TOKEN: 'test-token',
  COOLIFY_DEPLOYMENTS: JSON.stringify([
    {
      name: 'api',
      uuid: 'a1234567890123456789',
      healthUrl: 'https://api.example.com/health',
    },
  ]),
  COOLIFY_POLL_INTERVAL_MS: '1',
  COOLIFY_DEPLOY_TIMEOUT_MS: '1000',
  GITHUB_SHA: 'abc123',
};

test('rejects an insecure Coolify API URL', () => {
  assert.throws(
    () => readConfiguration({ ...environment, COOLIFY_URL: 'http://coolify' }),
    /must use HTTPS/,
  );
});

test('deploys, verifies the commit, and checks health', async () => {
  const calls = [];
  const responses = [
    json({ deployments: [{ deployment_uuid: 'deployment-1' }] }),
    json({ status: 'queued' }),
    json({ status: 'finished', commit: 'abc123' }),
    new Response('healthy', { status: 200 }),
  ];
  const results = await deployAll(readConfiguration(environment), {
    fetch: async (url, init) => {
      calls.push({ url: String(url), method: init?.method ?? 'GET' });
      const response = responses.shift();
      assert.ok(response);
      return response;
    },
    wait: async () => undefined,
  });

  assert.equal(results[0]?.commit, 'abc123');
  assert.deepEqual(
    calls.map((call) => call.method),
    ['POST', 'GET', 'GET', 'GET'],
  );
});

test('fails when Coolify deploys a different commit', async () => {
  const responses = [
    json({ deployments: [{ deployment_uuid: 'deployment-1' }] }),
    json({ status: 'finished', commit: 'wrong-sha' }),
  ];
  await assert.rejects(
    deployAll(readConfiguration(environment), {
      fetch: async () => responses.shift(),
      wait: async () => undefined,
    }),
    /instead of abc123/,
  );
});

function json(value) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
