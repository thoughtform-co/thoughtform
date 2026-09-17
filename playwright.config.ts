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
    // ⚠ EVERY PROJECT IS CHROMIUM-BACKED, AND THE WEBKIT ONES ARE DELETED
    // (ADR-107 U1). `devices["iPhone 14*"]` and `devices["iPad Mini"]` carry
    // `defaultBrowserType: "webkit"`, and WebKit honours the dev server's
    // `upgrade-insecure-requests` CSP ON LOCALHOST — every sub-resource is
    // requested over `https://localhost:3003`, the HTTP dev server cannot
    // answer, and the page renders with no CSS and no React. The corridor
    // specs then hang on `waitForSelector(".home-v2-stage")` until the 30s
    // timeout. ⚠ THAT IS NOT A FLAKE AND NO RETRY CAN HELP IT: the browser is
    // asking for a URL that does not exist.
    //
    // ADR-107 diagnosed this and added `-chromium` COPIES of the two phones,
    // but left the WebKit originals in the list, so they kept running and kept
    // failing — and `tablet` never got a copy at all. The originals are gone
    // now and `tablet` is Chromium; the descriptors still carry the viewport,
    // the DPR, the touch and the mobile UA, which is what these projects
    // actually guard. Real Safari behaviour (sticky, `svh`, the GPU) is the
    // owner's device read and was never what CI measured.
    //
    // ⚠ The `-chromium` SUFFIX IS KEPT on the two phones even though nothing
    // is webkit any more: the rules and several ADRs name those projects in
    // their verify recipes, and renaming them to buy tidiness would break
    // every recorded command for a suffix that now just means "the phone".
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
        defaultBrowserType: "chromium",
        browserName: "chromium",
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
