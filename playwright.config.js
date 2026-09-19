import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173/portfolio-test/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run build && node scripts/serve.mjs --base /portfolio-test/',
    url: 'http://127.0.0.1:4173/portfolio-test/',
    reuseExistingServer: false
  }
});
