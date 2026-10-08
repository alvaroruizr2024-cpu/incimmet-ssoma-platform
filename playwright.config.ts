import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 40_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.NATIVE_SERVER_URL || 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer:
    process.env.INCIMMET_TEST_SERVER === 'external'
      ? undefined
      : {
          command: 'node scripts/serve-export.mjs --port 3101',
          url: 'http://127.0.0.1:3101',
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
