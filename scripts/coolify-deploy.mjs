const ACTIVE_STATUSES = new Set(['queued', 'in_progress']);
const FAILURE_STATUSES = new Set(['failed', 'cancelled', 'cancelled-by-user']);

export function readConfiguration(environment = process.env) {
  const baseUrl = new URL(required(environment, 'COOLIFY_URL'));
  if (baseUrl.protocol !== 'https:') throw new Error('COOLIFY_URL must use HTTPS');

  const deployments = JSON.parse(required(environment, 'COOLIFY_DEPLOYMENTS'));
  if (!Array.isArray(deployments) || deployments.length === 0)
    throw new Error('COOLIFY_DEPLOYMENTS must be a non-empty JSON array');

  return {
    baseUrl: baseUrl.toString().replace(/\/$/, ''),
    token: required(environment, 'COOLIFY_API_TOKEN'),
    expectedCommit: required(environment, 'GITHUB_SHA'),
    deployments: deployments.map(validateDeployment),
    pollIntervalMs: positiveInteger(
      environment.COOLIFY_POLL_INTERVAL_MS ?? '15000',
      'COOLIFY_POLL_INTERVAL_MS',
    ),
    timeoutMs: positiveInteger(
      environment.COOLIFY_DEPLOY_TIMEOUT_MS ?? '1800000',
      'COOLIFY_DEPLOY_TIMEOUT_MS',
    ),
  };
}

export async function deployAll(config, dependencies = {}) {
  const request = dependencies.fetch ?? fetch;
  const wait = dependencies.wait ?? delay;
  const results = [];

  for (const deployment of config.deployments) {
    console.log(`Queueing ${deployment.name} deployment`);
    const queued = await requestJson(
      request,
      `${config.baseUrl}/api/v1/deploy?uuid=${encodeURIComponent(deployment.uuid)}`,
      config.token,
      { method: 'POST' },
    );
    const deploymentUuid = queued.deployments?.[0]?.deployment_uuid;
    if (typeof deploymentUuid !== 'string' || !deploymentUuid)
      throw new Error(`Coolify did not queue ${deployment.name}`);

    const result = await waitForDeployment({
      ...config,
      deployment,
      deploymentUuid,
      request,
      wait,
    });
    await waitForHealth(deployment, request, wait);
    results.push(result);
  }

  return results;
}

async function waitForDeployment(options) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < options.timeoutMs) {
    const result = await requestJson(
      options.request,
      `${options.baseUrl}/api/v1/deployments/${encodeURIComponent(options.deploymentUuid)}`,
      options.token,
    );
    const status = String(result.status ?? '');
    if (status === 'finished') {
      if (result.commit !== options.expectedCommit)
        throw new Error(
          `${options.deployment.name} deployed ${String(result.commit)} instead of ${options.expectedCommit}`,
        );
      console.log(`${options.deployment.name} deployed commit ${options.expectedCommit}`);
      return result;
    }
    if (FAILURE_STATUSES.has(status))
      throw new Error(`${options.deployment.name} deployment ended with ${status}`);
    if (!ACTIVE_STATUSES.has(status))
      throw new Error(`${options.deployment.name} returned unknown deployment status ${status}`);
    await options.wait(options.pollIntervalMs);
  }
  throw new Error(`${options.deployment.name} deployment timed out`);
}

async function waitForHealth(deployment, request, wait) {
  const deadline = Date.now() + 300_000;
  while (Date.now() < deadline) {
    try {
      const response = await request(deployment.healthUrl, {
        headers: { 'user-agent': 'factumation-deployment-verifier' },
        redirect: 'follow',
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        console.log(`${deployment.name} health check passed`);
        return;
      }
    } catch {
      // The new container may still be entering service.
    }
    await wait(10_000);
  }
  throw new Error(`${deployment.name} health check timed out`);
}

async function requestJson(request, url, token, init = {}) {
  const response = await request(url, {
    ...init,
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      ...init.headers,
    },
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      `Coolify API returned ${String(response.status)}: ${String(body.message ?? 'request failed')}`,
    );
  return body;
}

function validateDeployment(value, index) {
  if (!value || typeof value !== 'object')
    throw new Error(`Deployment ${String(index)} must be an object`);
  const name = String(value.name ?? '').trim();
  const uuid = String(value.uuid ?? '').trim();
  const healthUrl = new URL(String(value.healthUrl ?? ''));
  if (!/^[a-z0-9-]{3,64}$/i.test(name))
    throw new Error(`Deployment ${String(index)} has an invalid name`);
  if (!/^[a-z0-9]{20,32}$/.test(uuid)) throw new Error(`${name} has an invalid Coolify UUID`);
  if (healthUrl.protocol !== 'https:') throw new Error(`${name} health URL must use HTTPS`);
  return { name, uuid, healthUrl: healthUrl.toString() };
}

function required(environment, name) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function positiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0)
    throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  deployAll(readConfiguration()).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
