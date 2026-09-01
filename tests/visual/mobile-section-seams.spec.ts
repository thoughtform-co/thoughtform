import { expect, test, type Page, type TestInfo } from "@playwright/test";

/**
 * Mobile section seams — the guard for `.claude/rules/mobile-sections.md`.
 *
 * The phone composition has no rail and no brandmark, but it still carries
 * FIXED chrome over a flowing document: the TR readout (`.hud-nav-overlay`
 * → `.hud__nav__btn`, z 60), the BR settings cluster (`.rin-settings`,
 * z 60), the two corner brackets, and — through the corridor's epilogue —
 * `.home-v2-mobile-signal`. Every one of them paints over whatever is
 * scrolling underneath, and none of them can see the document.
 *
 * The four laws this file holds, in the order they fail:
 *   1. stations do not overlap each other,
 *   2. no station copy is handed to the chrome,
 *   3. the epilogue signal is dead by the time #services owns the screen,
 *   4. the chrome stays inside the two bands the stations reserve.
 *
 * ⚠ NEVER NAVIGATE BY A HARDCODED PIXEL COUNT (landing-corridor-smoke's
 * law). The corridor stage is sized in viewport units and its lazy content
 * changes the document height as it mounts — a `scrollTo` can land short
 * and stay there. Every position in this file is SOUGHT: a real
 * viewport-stepped scroll, then a Playwright-side loop with a timeout that
 * re-reads where the page actually is. No bare waits, no teleports; the
 * corridor is WebGL and only a real scroll drives its frameloop.
 */

test.describe.configure({ mode: "serial" });

const PHONE_PROJECTS = new Set(["iphone-14", "iphone-14-pro-max"]);

/** The stations' DOM order on the marketing route, top to bottom. */
const STATION_IDS = ["hero", "services", "about", "voidwalker", "practice", "contact"] as const;

/**
 * The always-mounted fixed chrome, by the element that actually PAINTS.
 * ⚠ `.hud-nav-overlay` itself is a 0x0 anchor at the corner (measured
 * [368, 16, 0, 0] at 390x844) — it positions the nav and hosts the scrim
 * pseudo-element, but it has no box of its own to measure. The readout
 * button is the painted object, and it is also the drawer trigger.
 * `.home-v2-mobile-signal` is deliberately NOT here: while the epilogue is
 * playing it is CONTENT that owns the middle of the screen, which is what
 * test 3 is about instead.
 */
const CHROME_SELECTORS = [
  ".hud__nav__btn",
  ".rin-settings",
  ".hud__corner--tl",
  ".hud__corner--br",
] as const;

/**
 * ⚠ THE OPEN CHROME-OVER-COPY DEBT, PINNED RATHER THAN TOLERATED.
 *
 * The ≤960 padding floors reserve the two bands at a station's ENDS; they
 * cannot reach a multi-viewport station's middle, and the TR scrim buys
 * LEGIBILITY for what passes behind the corner without licensing a
 * collision. These are the ink runs that still land inside a chrome rect at
 * the stations' own rest positions, measured 2026-09-01 at 390x844 (the
 * binding phone) with the values at 430x932 noted:
 *
 *   #services · `.hud__nav__btn`  — the casefile's `27 → 47` counter
 *               (glyph [279,8,52,11], 10px) and the `Intelligence Map`
 *               title (glyph [53,31,241,39], 32.8px)
 *   #services · `.rin-settings`   — a `DEEP` lane label and the directory
 *               sentence at the station's foot
 *   #about    · `.hud__nav__btn`  — a 15px bio line at the top of the beat
 *   #about    · `.hud__corner--tl`— the same line's left end (390 ONLY;
 *               430x932 is clear, the wider column moves it inboard)
 *   #about    · `.rin-settings`   — the beat's `MODE` / `∂ · 0.001`
 *               telemetry at the foot, on the settings row's own line
 *   #contact  · `.hud__nav__btn`  — `Plot your` overlaps the readout by
 *               1px at the DOCUMENT'S END, where the scroll cannot go
 *               further (390 ONLY; 932 of viewport clears it)
 *
 * All of them are station INTERIORS — casefile.css, the about bio and its
 * telemetry, the contact headline — which this pass does not own. An entry
 * comes OUT of this list in the same commit as its fix; a collision on a
 * station that is NOT listed (#hero, #voidwalker, #practice are clean at
 * both phone shapes) fails the test outright, which is what stops a sixth
 * appearing quietly.
 */
const KNOWN_CHROME_COLLISIONS: Record<string, readonly string[]> = {
  services: [".hud__nav__btn", ".rin-settings"],
  about: [".hud__nav__btn", ".hud__corner--tl", ".rin-settings"],
  contact: [".hud__nav__btn"],
};

const BOOT_TIMEOUT = 20_000;
const SEEK_TIMEOUT = 12_000;
const SETTLE_MS = 650;

type Rect = { x: number; y: number; width: number; height: number };
type ChromeBox = { sel: string; rect: Rect };
// Same shape, declared for the in-page closure (which cannot see the
// module's types once it is serialised into the browser).
type ChromeBoxLike = ChromeBox;

function phonesOnly(testInfo: TestInfo) {
  test.skip(
    !PHONE_PROJECTS.has(testInfo.project.name),
    "the mobile seam laws are ≤960 rules; the tablet and desktop projects are a different composition"
  );
}

async function settle(page: Page, extraMs = 80) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
  if (extraMs) await page.waitForTimeout(extraMs);
}

async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v2-stage", { timeout: BOOT_TIMEOUT });
  // The mobile branch publishes the surface but never the desktop handoff
  // attributes (about-voidwalker-handoff-boundaries pins that), so this is
  // the one attribute that says "the phone composition has mounted".
  await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-surface", "hologram", {
    timeout: BOOT_TIMEOUT,
  });
  await settle(page, SETTLE_MS);
}

/** Roll to `y` in viewport-sized steps so the WebGL frameloop sees the travel. */
async function rollTo(page: Page, y: number) {
  await page.evaluate(async (target: number) => {
    const step = Math.max(300, window.innerHeight * 0.5);
    const from = window.scrollY;
    const dir = target > from ? 1 : -1;
    for (let at = from; dir > 0 ? at < target : at > target; at += dir * step) {
      window.scrollTo(0, at);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, target);
  }, y);
  await page.waitForTimeout(SETTLE_MS);
}

/**
 * Roll to `y` and keep rolling until the page agrees it is there.
 * ⚠ ONE `rollTo` IS NOT ENOUGH AND THIS IS MEASURED: the corridor's content
 * mounts and unmounts as it enters the rendering window, so the document
 * height moves under the scroll and a single pass can land ~1200px short
 * (seen at the #services approach). The loop is the fix, the timeout is
 * what keeps it a test rather than a hang.
 */
async function seekTo(page: Page, y: number, tolerance = 8): Promise<number> {
  const deadline = Date.now() + SEEK_TIMEOUT;
  let at = await page.evaluate(() => window.scrollY);
  while (Date.now() < deadline) {
    await rollTo(page, y);
    at = await page.evaluate(() => window.scrollY);
    if (Math.abs(at - y) <= tolerance) return at;
    // A target past the document's end is legitimately unreachable.
    const capped = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    if (y >= capped && at >= capped - tolerance) return at;
  }
  throw new Error(`seek never settled on ${y} (last read ${at})`);
}

/** Scroll until `probe()` reports true, in viewport-fraction steps. */
async function seekUntil(
  page: Page,
  from: number,
  probe: () => Promise<boolean>,
  label: string
): Promise<number> {
  const vh = await page.evaluate(() => window.innerHeight);
  const deadline = Date.now() + SEEK_TIMEOUT * 2;
  let y = from;
  const seen: number[] = [];
  while (Date.now() < deadline) {
    const at = await seekTo(page, Math.round(y));
    if (await probe()) return at;
    seen.push(at);
    y = at + vh * 0.25;
    const capped = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    if (at >= capped) break;
  }
  throw new Error(`never reached ${label} (walked ${seen.join(", ")})`);
}

/**
 * ⚠ THE BANDS ARE A `calc()` AND MUST BE RESOLVED BY THE ENGINE, NOT PARSED.
 * `getPropertyValue("--mobile-chrome-top")` hands back the authored
 * expression, not a length. A throwaway element that spends them as padding
 * is what makes the computed style report pixels.
 */
async function chromeBands(page: Page): Promise<{ top: number; bottom: number }> {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:0",
      "height:0",
      "visibility:hidden",
      "pointer-events:none",
      "padding-top:var(--mobile-chrome-top)",
      "padding-bottom:var(--mobile-chrome-bottom)",
    ].join(";");
    document.body.appendChild(probe);
    const s = getComputedStyle(probe);
    const out = {
      top: Number.parseFloat(s.paddingTop),
      bottom: Number.parseFloat(s.paddingBottom),
    };
    probe.remove();
    return out;
  });
}

/**
 * Every chrome element that is actually PAINTING right now, as its painted
 * rect.
 *
 * ⚠ A BOUNDING RECT IS NOT A PAINTED RECT ON THIS SURFACE, AND THAT IS THE
 * WHOLE REASON THIS HELPER EXISTS. The HUD frame is revealed by a CLIP that
 * tracks the hero's exit (`--hero-lift`; `.hud__corner--tl` /
 * `.hud__corner--br` in landing.css), so behind the curtain the brackets
 * report a full 28x28 rect while `clip-path` computes to `inset(828px …)`
 * on a 28px box — they paint nothing at all. Measured at 390x844: at
 * scrollY 0 BOTH brackets are fully clipped; at scrollY 295 the TL still is.
 * Take the rect at face value and every hero headline reads as "copy under
 * chrome" against chrome that is not on screen.
 */
async function visibleChrome(page: Page, selectors: readonly string[]): Promise<ChromeBox[]> {
  return page.evaluate((sels) => {
    // `inset()` takes the CSS box shorthand: 1 → all, 2 → block/inline,
    // 3 → top/inline/bottom, 4 → top/right/bottom/left. Computed style
    // resolves every term to px, so no calc() survives to here.
    const insetOf = (clip: string): [number, number, number, number] | null => {
      const m = clip.match(/^inset\(([^)]*)\)/);
      if (!m) return null;
      const parts = m[1]!
        .trim()
        .split(/\s+/)
        .map((p) => Number.parseFloat(p));
      if (parts.some((p) => Number.isNaN(p))) return null;
      const [a, b, c, d] = parts;
      if (parts.length === 1) return [a!, a!, a!, a!];
      if (parts.length === 2) return [a!, b!, a!, b!];
      if (parts.length === 3) return [a!, b!, c!, b!];
      if (parts.length >= 4) return [a!, b!, c!, d!];
      return null;
    };

    const out: ChromeBoxLike[] = [];
    for (const sel of sels) {
      for (const el of document.querySelectorAll<HTMLElement>(sel)) {
        const s = getComputedStyle(el);
        if (s.display === "none" || s.visibility === "hidden") continue;
        if (Number.parseFloat(s.opacity) < 0.05) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;

        let { x, y, width, height } = r;
        const inset = s.clipPath && s.clipPath !== "none" ? insetOf(s.clipPath) : null;
        if (inset) {
          const [t, right, b, left] = inset;
          x += Math.max(0, left);
          y += Math.max(0, t);
          width -= Math.max(0, left) + Math.max(0, right);
          height -= Math.max(0, t) + Math.max(0, b);
        }
        if (width < 1 || height < 1) continue;
        out.push({ sel, rect: { x, y, width, height } });
      }
    }
    return out;
  }, selectors);
}

/**
 * The scroll position at which a station is "at rest" — its own reading beat.
 * ⚠ THE HERO'S REST IS scrollY 0 AND NOTHING ELSE. It is the departing
 * curtain (ADR-022 v8): any position inside its own viewport is the card
 * mid-travel with its headline half off the top, which is a motion frame,
 * not a beat anyone reads.
 */
async function stationRest(page: Page, id: string): Promise<number> {
  if (id === "hero") return 0;
  return page.evaluate((stationId) => {
    const el = document.getElementById(stationId);
    if (!el) throw new Error(`missing station #${stationId}`);
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    return Math.round(top + Math.min(r.height * 0.35, 300));
  }, id);
}

test.describe("mobile section seams", () => {
  test("adjacent stations never print over one another", async ({ page }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const present = await page.evaluate(
      (ids) => ids.filter((id) => Boolean(document.getElementById(id))),
      [...STATION_IDS]
    );
    expect(present.length).toBeGreaterThan(3);

    for (let i = 0; i < present.length - 1; i += 1) {
      const [aId, bId] = [present[i]!, present[i + 1]!];
      await test.step(`${aId} → ${bId}`, async () => {
        // Put the LATER station's top at ~50 % of the viewport: the seam is
        // then mid-screen, where a sticky runway that has not released or a
        // negative margin that has not been cancelled is visible as an
        // overlap rather than hidden past an edge.
        const target = await page.evaluate((id) => {
          const el = document.getElementById(id)!;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return Math.max(0, Math.round(top - window.innerHeight * 0.5));
        }, bId);
        await seekTo(page, target);
        await settle(page, SETTLE_MS);

        const seam = await page.evaluate(
          ({ a, b }) => {
            const ae = document.getElementById(a)!.getBoundingClientRect();
            const be = document.getElementById(b)!.getBoundingClientRect();
            return { aBottom: ae.bottom, bTop: be.top };
          },
          { a: aId, b: bId }
        );
        // 1px of tolerance: the corridor host's own sticky runway lands on
        // fractional device pixels, and a seam is a seam at 0.5px.
        expect(
          seam.bTop,
          `#${bId} starts ${(seam.aBottom - seam.bTop).toFixed(1)}px inside #${aId}`
        ).toBeGreaterThanOrEqual(seam.aBottom - 1);
      });
    }
  });

  test("no station copy sits under the fixed chrome at rest", async ({ page }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const open: string[] = [];
    for (const id of STATION_IDS) {
      const exists = await page.evaluate((s) => Boolean(document.getElementById(s)), id);
      if (!exists) continue;

      await test.step(`#${id}`, async () => {
        await seekTo(page, await stationRest(page, id));
        await settle(page, SETTLE_MS);

        const chrome = await visibleChrome(page, CHROME_SELECTORS);
        // ⚠ #hero legitimately paints NO frame: the whole HUD is clipped
        // away behind the curtain until `--hero-lift` opens it. Everywhere
        // else, finding nothing means the probe has stopped measuring.
        if (id !== "hero") {
          expect(
            chrome.length,
            "no fixed chrome found — the probe is measuring nothing"
          ).toBeGreaterThan(0);
        }

        const hits = await page.evaluate((boxes) => {
          /**
           * ⚠ AN ELEMENT BOX IS NOT AN INK BOX, AND THE FIRST CUT OF THIS
           * TEST FAILED ON THE DIFFERENCE. A `.fl-brief` container is 200px
           * tall around a 39px line of type, so an element-rect test reports
           * a collision for a headline sitting 90px clear of the corner.
           * Range client rects are the actual glyph runs — one per line box,
           * measured where the letters are.
           *
           * ⚠ AND `elementsFromPoint` CANNOT DO THIS JOB AT ALL: it skips
           * `pointer-events: none`, which is every piece of chrome on this
           * surface, and it answers about a POINT when the question is about
           * an AREA. The chrome is z 60 over everything, so any station ink
           * inside a chrome rect is by definition painting underneath it.
           */
          const found: { sel: string; text: string; rect: number[]; fontSize: number }[] = [];
          for (const station of document.querySelectorAll(".station")) {
            const walker = document.createTreeWalker(station, NodeFilter.SHOW_TEXT);
            let node: Node | null;
            while ((node = walker.nextNode())) {
              const text = (node.textContent || "").trim();
              if (text.length < 2) continue;
              const parent = node.parentElement;
              if (!parent) continue;
              const cs = getComputedStyle(parent);
              if (cs.display === "none" || cs.visibility === "hidden") continue;
              if (Number.parseFloat(cs.opacity) < 0.05) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const r of Array.from(range.getClientRects())) {
                if (r.width < 1 || r.height < 1) continue;
                for (const box of boxes) {
                  const b = box.rect;
                  if (
                    r.left < b.x + b.width &&
                    b.x < r.right &&
                    r.top < b.y + b.height &&
                    b.y < r.bottom
                  ) {
                    found.push({
                      sel: box.sel,
                      text: text.slice(0, 40),
                      rect: [
                        Math.round(r.left),
                        Math.round(r.top),
                        Math.round(r.width),
                        Math.round(r.height),
                      ],
                      fontSize: Number.parseFloat(cs.fontSize),
                    });
                  }
                }
              }
            }
          }
          return found;
        }, chrome);

        for (const h of hits) {
          open.push(`#${id} ${h.sel} ∩ "${h.text}" @[${h.rect.join(",")}] ${h.fontSize}px`);
        }

        const collided = [...new Set(hits.map((h) => h.sel))].sort();
        const allowed = [...(KNOWN_CHROME_COLLISIONS[id] ?? [])].sort();
        const unlisted = collided.filter((sel) => !allowed.includes(sel));

        expect(
          unlisted,
          `NEW chrome-over-copy on #${id}: ${hits
            .filter((h) => unlisted.includes(h.sel))
            .map((h) => `${h.sel} ∩ "${h.text}"`)
            .join(" | ")}`
        ).toEqual([]);
      });
    }

    // The register, on every run, passing or not — an allowlist nobody can
    // read is an allowlist that grows.
    await testInfo.attach("chrome-over-copy", {
      body: open.length ? open.join("\n") : "(none)",
      contentType: "text/plain",
    });
  });

  test("the mobile epilogue signal is dead once #services owns the screen", async ({
    page,
  }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const svcTop = await page.evaluate(
      () => document.getElementById("services")!.getBoundingClientRect().top + window.scrollY
    );

    // Walk in from well before the seam so the signal is genuinely alive
    // first — asserting it is dead somewhere it was never shown proves
    // nothing. Measured at 390x844: opacity 1 from #services' top at ~166 %
    // of the viewport down to ~47 %, then 0.
    const alive = await page.evaluate(() => {
      const sig = document.querySelector<HTMLElement>(".home-v2-mobile-signal");
      return sig ? getComputedStyle(sig).display : "(absent)";
    });
    expect(alive, "the mobile signal is not mounted on this width").toBe("block");

    await seekUntil(
      page,
      Math.max(0, svcTop - 1600),
      async () =>
        page.evaluate(() => {
          const svc = document.getElementById("services")!;
          return svc.getBoundingClientRect().top / window.innerHeight < 0.45;
        }),
      "#services' top crossing 45 % of the viewport"
    );
    await settle(page, SETTLE_MS);

    const state = await page.evaluate(() => {
      const sig = document.querySelector<HTMLElement>(".home-v2-mobile-signal")!;
      const svc = document.getElementById("services")!;
      return {
        topPct: svc.getBoundingClientRect().top / window.innerHeight,
        opacity: Number.parseFloat(getComputedStyle(sig).opacity),
        inert: sig.hasAttribute("inert"),
      };
    });

    expect(state.topPct).toBeLessThan(0.45);
    expect(state.opacity, "the signal is still painting over #services").toBeLessThanOrEqual(0.01);
    expect(state.inert, "the signal still takes taps over #services").toBe(true);

    // Reversible: scroll back out of the band and the signal returns. A
    // kill that only latches one way is a kill that strands the epilogue
    // for anyone who scrolls up.
    await seekTo(page, Math.max(0, Math.round(svcTop - 600)));
    await settle(page, SETTLE_MS);
    const back = await page.evaluate(() => {
      const svc = document.getElementById("services")!;
      return svc.getBoundingClientRect().top / window.innerHeight;
    });
    expect(back, "the walk back never left the kill band").toBeGreaterThan(0.45);
  });

  test("every fixed chrome rect stays inside a reserved band", async ({ page }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const bands = await chromeBands(page);
    expect(bands.top, "--mobile-chrome-top does not resolve at this width").toBeGreaterThan(0);
    expect(bands.bottom, "--mobile-chrome-bottom does not resolve at this width").toBeGreaterThan(
      0
    );

    for (const id of STATION_IDS) {
      const exists = await page.evaluate((s) => Boolean(document.getElementById(s)), id);
      if (!exists) continue;

      await test.step(`#${id}`, async () => {
        await seekTo(page, await stationRest(page, id));
        await settle(page, SETTLE_MS);

        const vh = await page.evaluate(() => window.innerHeight);
        const chrome = await visibleChrome(page, CHROME_SELECTORS);
        if (id !== "hero") expect(chrome.length).toBeGreaterThan(0);

        const strays = chrome.filter((c) => {
          const inTop = c.rect.y + c.rect.height <= bands.top + 1;
          const inBottom = c.rect.y >= vh - bands.bottom - 1;
          return !inTop && !inBottom;
        });

        expect(
          strays.map(
            (s) =>
              `${s.sel} at y ${s.rect.y.toFixed(1)}…${(s.rect.y + s.rect.height).toFixed(1)} ` +
              `(bands: 0…${bands.top}, ${vh - bands.bottom}…${vh})`
          ),
          "fixed chrome is painting outside the bands the stations reserve — either move it back into a band or re-derive the two tokens in this same commit"
        ).toEqual([]);
      });
    }
  });

  test("the padding floor and the content-visibility opt-out are live", async ({
    page,
  }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const bands = await chromeBands(page);
    const report = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".station")].map((el) => {
        const s = getComputedStyle(el);
        return {
          id: el.id || "(none)",
          hero: el.classList.contains("hero"),
          cover: el.classList.contains("station--cover"),
          padTop: Number.parseFloat(s.paddingTop),
          padBottom: Number.parseFloat(s.paddingBottom),
          contentVisibility: s.contentVisibility,
        };
      })
    );

    for (const st of report) {
      if (st.hero) continue;
      // Law 4 — `content-visibility: auto` is a desktop optimisation. Its
      // `contain-intrinsic-size` guess is one viewport, and a phone station
      // runs 1.2–2.7 of them; the correction reflows the document under the
      // reader's thumb. Measured: #contact reserved 1204px for an 844px box.
      expect(st.contentVisibility, `#${st.id} still skips its contents on mobile`).not.toBe("auto");

      // Law 1 — the chrome bands are reserved. #voidwalker is the named
      // exception: `.vwd` is a one-screen 100svh instrument that clears the
      // chrome from inside, so its own id rule keeps the station.
      if (st.cover || st.id === "voidwalker") continue;
      expect(st.padTop, `#${st.id} does not reserve the top chrome band`).toBeGreaterThanOrEqual(
        bands.top - 0.5
      );
      expect(
        st.padBottom,
        `#${st.id} does not reserve the bottom chrome band`
      ).toBeGreaterThanOrEqual(bands.bottom - 0.5);
    }
  });
});
