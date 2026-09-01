/**
 * The CSP enforcement sweep (2026-09-01, pre-launch Phase 7).
 *
 * Run against a PRODUCTION build serving the ENFORCED header
 * (`enforceCsp: true` in next.config.mjs → `next start`). Walks every
 * public route in both themes with real incremental scrolls (the corridor
 * is scroll-composed), opens the tools walkthrough lightbox, and collects
 * every SecurityPolicyViolationEvent plus every console message that
 * names the policy. Zero findings is the gate for flipping enforcement on.
 *
 *   node scripts/sweep-csp-enforced.mjs [--base http://localhost:3113]
 */
import { chromium } from "playwright";

const base =
  process.argv.includes("--base")
    ? process.argv[process.argv.indexOf("--base") + 1]
    : "http://localhost:3113";

const ROUTES = ["/", "/claude-workshop", "/arcs", "/arcs/portfolio", "/arcs/ai-keynote"];
const THEMES = ["dark", "light"];

const browser = await chromium.launch({ headless: false });
const violations = [];

for (const route of ROUTES) {
  for (const theme of THEMES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const tag = `${route} [${theme}]`;

    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener("securitypolicyviolation", (e) => {
        window.__cspViolations.push(
          `${e.violatedDirective} blocked ${e.blockedURI || "(inline)"} @ ${e.sourceFile || "?"}`
        );
      });
    });
    page.on("console", (msg) => {
      const text = msg.text();
      // `/_vercel/insights|speed-insights/script.js` 404s locally (those
      // endpoints exist only on Vercel's platform, same-origin in prod) —
      // a MIME refusal, not a CSP finding, and pure noise in this sweep.
      if (/\/_vercel\/(insights|speed-insights)\//.test(text)) return;
      if (/Content.Security.Policy|Refused to/i.test(text)) {
        violations.push(`${tag} console: ${text.slice(0, 220)}`);
      }
    });

    await page.goto(`${base}${route}?theme=${theme}`, { waitUntil: "load" });
    await page.waitForTimeout(2500);

    // Real incremental scroll to the page's floor — the corridor and every
    // lazy seam (video posters, walkthrough bays, the map console) mount
    // along the way.
    await page.evaluate(async () => {
      const step = Math.max(400, window.innerHeight * 0.6);
      let last = -1;
      while (window.scrollY !== last) {
        last = window.scrollY;
        window.scrollBy(0, step);
        await new Promise((r) => setTimeout(r, 180));
      }
    });
    await page.waitForTimeout(2000);

    // On the landing, exercise the one third-party frame + self-hosted
    // media path: open the tools walkthrough lightbox if reachable.
    if (route === "/" && theme === "dark") {
      const shot = page.locator(".fl-shot").first();
      if ((await shot.count()) > 0) {
        try {
          await shot.scrollIntoViewIfNeeded();
          await shot.click({ timeout: 4000, force: true });
          await page.waitForTimeout(2500);
          await page.keyboard.press("Escape");
        } catch {
          violations.push(`${tag} note: walkthrough lightbox not clickable in sweep (non-fatal)`);
        }
      }
    }

    const pageViolations = await page.evaluate(() => window.__cspViolations);
    for (const v of pageViolations) violations.push(`${tag} ${v}`);
    console.log(`${tag}: ${pageViolations.length} violation event(s)`);
    await page.close();
  }
}

await browser.close();

if (violations.length > 0) {
  console.log("\nFINDINGS:");
  for (const v of violations) console.log("  " + v);
  process.exit(1);
}
console.log("\nCLEAN — no CSP violations across routes/themes.");
