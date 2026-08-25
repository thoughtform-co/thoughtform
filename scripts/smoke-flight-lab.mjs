// Smoke test the /test/voidwalker-flight-lab route:
// 1. panel mounts
// 2. clicking a preset writes config into the URL + into the shared store
// 3. reload with URL params applies overrides at boot
// 4. reset button restores defaults
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const errors = [];
// ⚠ Filter out well-known dev-only noise the lab inherits from the
// `(internal)` layout's auth-gate reveal (see the page's comment on
// DeferredFlightLabPanel). The smoke asserts the lab's OWN contract —
// panel mounts, preset writes URL + config, reload replays URL, reset
// restores — not React's dev-mode warnings about the underlying
// corridor mount pattern.
const IGNORED_ERROR_PATTERNS = [
  "upgrade-insecure-requests", // report-only CSP notice
  "synchronously unmount a root while React was already rendering",
];
const isIgnored = (t) => IGNORED_ERROR_PATTERNS.some((p) => t.includes(p));
page.on("pageerror", (e) => {
  const s = String(e);
  if (!isIgnored(s)) errors.push(s);
});
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const t = msg.text();
  if (!isIgnored(t)) errors.push(t);
});

await page.goto("http://localhost:3003/test/voidwalker-flight-lab", {
  waitUntil: "domcontentloaded",
});
await page.waitForSelector(".home-v2-stage", { timeout: 20000 });
await page.waitForSelector(".vwfl", { timeout: 10000 });
await page.waitForTimeout(1200);

// 1. panel is up and shows the default variant
const initialVariant = await page.locator("#vwfl-path").inputValue();
console.log("initial pathVariant:", initialVariant);
if (initialVariant !== "linear") errors.push(`expected linear, got ${initialVariant}`);

// 2. click V2 preset → curved variant + url query
await page.getByRole("button", { name: "V2-noomo-swing" }).click();
await page.waitForTimeout(500);
const urlAfterPreset = page.url();
const afterVariant = await page.locator("#vwfl-path").inputValue();
console.log("after V2 preset URL:", urlAfterPreset);
console.log("after V2 preset variant:", afterVariant);
if (afterVariant !== "curved") errors.push(`expected curved, got ${afterVariant}`);
if (!urlAfterPreset.includes("pathVariant=curved")) {
  errors.push("URL did not carry pathVariant=curved");
}

// 3. reload with URL params: variant re-applies
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".vwfl", { timeout: 10000 });
await page.waitForTimeout(800);
const reloadedVariant = await page.locator("#vwfl-path").inputValue();
console.log("after reload variant:", reloadedVariant);
if (reloadedVariant !== "curved") {
  errors.push(`expected reloaded curved, got ${reloadedVariant}`);
}

// 4. reset restores default
await page.getByRole("button", { name: /reset/i }).click();
await page.waitForTimeout(500);
const resetVariant = await page.locator("#vwfl-path").inputValue();
const resetUrl = page.url();
console.log("after reset variant:", resetVariant);
console.log("after reset URL:", resetUrl);
if (resetVariant !== "linear") errors.push(`expected reset linear, got ${resetVariant}`);
if (resetUrl.includes("pathVariant=")) errors.push("reset did not clear URL");

// 5. also verify Panel does NOT mount on the marketing route
await page.goto("http://localhost:3003/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1000);
const panelOnLanding = await page.locator(".vwfl").count();
if (panelOnLanding !== 0) errors.push(`vwfl panel leaked onto /: ${panelOnLanding}`);

await browser.close();

if (errors.length) {
  console.error("\nERRORS:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log("\n✓ flight-lab smoke: all checks passed");
