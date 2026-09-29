import { defineConfig } from '/srv/dev/tools/browser/node_modules/@playwright/test/index.mjs';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  workers: 1,
  timeout: 90000,
  use: {
    actionTimeout: 15000,
    baseURL: 'http://127.0.0.1:3100',
    browserName: 'chromium',
    launchOptions: { chromiumSandbox: true },
    serviceWorkers: 'block',
  },
});
