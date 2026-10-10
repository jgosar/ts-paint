import { defineConfig } from '@playwright/test';

// A Windows user agent so that the About window always prints the same OS name
const PINNED_USER_AGENT: string =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const isCi: boolean = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  ...(isCi ? { workers: 1 } : {}),
  reporter: isCi ? [['list'], ['html', { open: 'never' }]] : [['html', { open: 'never' }]],
  expect: {
    // The UI is pixel art rendered without antialiasing, so screenshots must match exactly.
    // Device pixels, not CSS pixels: the visual project renders at device scale 2 (see below)
    toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled', scale: 'device' },
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    userAgent: PINNED_USER_AGENT,
    // The production build registers a service worker; keep it out of the tests unless a test opts in
    serviceWorkers: 'block',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    // No device preset: devices['Desktop Chrome'] would override the viewport and user agent configured above
    {
      name: 'chromium',
      testIgnore: /\.visual\.spec\.ts$/,
    },
    {
      // Screenshot tests: baselines are Linux-only and generated in the pinned Playwright Docker image, see e2e/README.md.
      // Device scale 2, like the original Paint screenshots the UI is compared against: text that Chromium centres on
      // a half CSS pixel lands on a whole device pixel, which keeps the anti-aliasing-free glyphs intact.
      name: 'chromium-visual',
      testMatch: /\.visual\.spec\.ts$/,
      use: { deviceScaleFactor: 2 },
    },
  ],
  webServer: {
    command: 'npm run build && npx http-server dist/ts-paint/browser -p 4173 -s -c-1',
    url: 'http://localhost:4173',
    reuseExistingServer: !isCi,
    timeout: 180_000,
  },
});
