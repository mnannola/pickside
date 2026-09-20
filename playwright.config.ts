import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'npm run dev -- --port 3100', url: 'http://localhost:3100', reuseExistingServer: false, timeout: 120000, env: { NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', APP_URL: 'http://localhost:3100', LOCAL_DATABASE: '1', LOCAL_DATABASE_PATH: '.data/e2e', VOTER_SECRET: 'playwright-only-secret-with-at-least-32-characters' } }
});
