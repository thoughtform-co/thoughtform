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
 *   node scripts/sweep-csp-enforced.mjs [--base http://localhost:3113] [--era-media azeroth]
 *
 * ⚠ ADR-082 U34 ADDED THE ERA STAGE'S TRANSMISSION TO THE WALK. `media-src`
 * names ONE remote origin now (the site's own Supabase project, the era-media
 * bucket), and a policy widened for one film is only proven by PLAYING that
 * film under enforcement. On the landing (dark) the sweep seats `#voidwalker`,
 * picks `--era-media` by its bust, opens the pile's FRONT card, and lists every
 * request it saw to the bucket's host — zero requests means the step proved
 * nothing about the widening, and says so.
 */
import { chromium } from "playwright";

import { COOKIE, signPass } from "./owner-pass/signPass.mjs";

const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3113";
const ERA_MEDIA = process.argv.includes("--era-media")
  ? process.argv[process.argv.indexOf("--era-media") + 1]
  : "azeroth";
/* Read from the policy's own module, so the sweep can never check a host the
   header does not name. */
const { ERA_MEDIA_ORIGIN } = await import("../lib/security/headers.mjs");

/* `/arcs` is the owner's page (ADR-117): a production build answers it with a
   404 unless the request carries his pass. The sweep signs one when it is
   handed the server's own secret (`OWNER_PASS_SECRET`, from the environment,
   never printed); without it the route is SKIPPED LOUDLY rather than swept
   as a 404 page that happens to live at that path. */
const OWNER_ROOT = process.env.OWNER_PASS_SECRET?.trim() || null;

const ROUTES = [
  "/",
  "/claude-workshop",
  "/arcs/trinny-london/proposal",
  ...(OWNER_ROOT ? ["/arcs"] : []),
  "/arcs/loop-earplugs",
  "/arcs/ai-keynote",
  /* The proposal (ADR-098): a new section kind with its own client leaf,
     and the one arc that is light-LOCKED, so it is the route where a
     policy violation would show up in a theme nobody could toggle out of. */
  "/arcs/suri-proposal",
  "/arcs/suri",
];
const THEMES = ["dark", "light"];

const browser = await chromium.launch({ headless: false });
const violations = [];

if (!OWNER_ROOT) {
  console.log(
    "SKIPPED /arcs — the overview is owner-gated (ADR-117); set OWNER_PASS_SECRET to the server's own value to sweep it."
  );
}

for (const route of ROUTES) {
  for (const theme of THEMES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    if (route === "/arcs" && OWNER_ROOT) {
      await page.context().addCookies([
        {
          name: COOKIE,
          value: signPass(OWNER_ROOT, Math.floor(Date.now() / 1000) + 3600),
          url: `${base}/arcs`,
        },
      ]);
    }
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

      // ADR-082 U34: the era stage's TRANSMISSION front card, on `--era-media`.
      const bucketHits = [];
      page.on("request", (req) => {
        if (req.url().startsWith(`${ERA_MEDIA_ORIGIN}/`)) bucketHits.push(req.url());
      });
      try {
        /* Seated as `probe-voidwalker-eras.mjs` seats it: 45 % into the
           station's runway, walked there in steps (a jump skips the writers),
           then the era driven with the KEYBOARD — the reel keeps two chips
           outside its clip window, so a pointer click can land on nothing. */
        await page.evaluate(async () => {
          const runway = document.querySelector("#voidwalker .vw");
          if (!runway) return;
          const to = Math.round(
            runway.getBoundingClientRect().top + window.scrollY + 0.45 * (runway.offsetHeight - window.innerHeight)
          );
          let y = window.scrollY;
          while (Math.abs(to - y) > 600) {
            y += Math.sign(to - y) * 600;
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 90));
          }
          window.scrollTo(0, to);
        });
        await page.waitForTimeout(1500);
        const eras = await page
          .locator("#voidwalker [data-vwh-era-tab]")
          .evaluateAll((els) => els.map((e) => e.getAttribute("data-vwh-era-tab")));
        const target = eras.indexOf(ERA_MEDIA);
        if (target < 0) throw new Error(`no era "${ERA_MEDIA}" on the rail`);
        await page.locator("#voidwalker [data-vwh-era-tab][data-on='true']").first().focus();
        await page.keyboard.press("Home");
        for (let k = 0; k < target; k++) await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(2000);
        const front = page
          .locator(`.vwd__sheet[data-vwd-era="${ERA_MEDIA}"] .vwd__mcard[data-vwd-media-depth="0"] .vwd__mcard__frame`)
          .first();
        await front.click({ timeout: 4000, force: true });
        await page.waitForTimeout(4000);
        await page.keyboard.press("Escape");
        console.log(
          `${tag} transmission · ${ERA_MEDIA} front card opened · ${bucketHits.length} request(s) to ${ERA_MEDIA_ORIGIN}`
        );
      } catch (err) {
        violations.push(
          `${tag} note: the ${ERA_MEDIA} transmission card was not reachable in sweep — ${String(err?.message ?? err).split("\n")[0]}`
        );
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
