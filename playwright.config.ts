import { defineConfig, devices } from "@playwright/test";

/**
 * Thoughtform Visual Regression Testing Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/visual",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:3003",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers and viewports */
  projects: [
    // ═══════════════════════════════════════════════════════════════
    // MOBILE VIEWPORTS - Primary target for the refactor
    // ═══════════════════════════════════════════════════════════════
    {
      name: "iphone-14-pro-max",
      use: {
        ...devices["iPhone 14 Pro Max"],
        viewport: { width: 430, height: 932 },
      },
    },
    {
      name: "iphone-14",
      use: {
        ...devices["iPhone 14"],
        viewport: { width: 390, height: 844 },
      },
    },
    // ⚠ CHROMIUM-BACKED COPIES OF THE TWO PHONE SHAPES (ADR-107). The
    // `devices["iPhone 14*"]` descriptors carry `defaultBrowserType: "webkit"`,
    // and WebKit honours the dev server's `upgrade-insecure-requests` CSP on
    // localhost — every sub-resource goes to `https://localhost:3003` and the
    // page renders unstyled (`.claude/rules/mobile-sections.md` "Verifying").
    // The same descriptors on Chromium keep the viewport, the DPR, the touch
    // and the mobile UA, and can hit the dev server. Real Safari behaviour
    // (sticky, `svh`, the GPU) is the owner's device read; these are the
    // phone geometry guards that can run in CI.
    {
      name: "iphone-14-pro-max-chromium",
      use: {
        ...devices["iPhone 14 Pro Max"],
        defaultBrowserType: "chromium",
        browserName: "chromium",
        viewport: { width: 430, height: 932 },
      },
    },
    {
      name: "iphone-14-chromium",
      use: {
        ...devices["iPhone 14"],
        defaultBrowserType: "chromium",
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // TABLET VIEWPORT
    // ═══════════════════════════════════════════════════════════════
    {
      name: "tablet",
      use: {
        ...devices["iPad Mini"],
        viewport: { width: 768, height: 1024 },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // DESKTOP VIEWPORT
    // ═══════════════════════════════════════════════════════════════
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3003",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Snapshot settings for visual regression */
  expect: {
    toHaveScreenshot: {
      /* Threshold for pixel difference (0.2 = 20% tolerance) */
      maxDiffPixelRatio: 0.1,
      /* Threshold for color difference */
      threshold: 0.2,
      /* Animation causes flaky tests - wait for animations to settle */
      animations: "disabled",
    },
  },
});
