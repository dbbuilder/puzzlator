import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:14001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      testMatch: /api-only\.spec\.ts/,
    },
  ],
})