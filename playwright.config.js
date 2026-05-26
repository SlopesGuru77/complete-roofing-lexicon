// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Test harness for the single-file static app. Serves the repo root over
// http-server on port 8765 and runs specs from ./tests against it.
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:8765',
    trace: 'on-first-retry',
    headless: true
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'npx http-server . -p 8765 -s -c-1',
    url: 'http://localhost:8765',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
