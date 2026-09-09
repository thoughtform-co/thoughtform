import { expect, test, type Page } from "@playwright/test";

/**
 * /trinny-london — the light-locked pitch variant (ADR-093), with the proof
 * stack, the interstitial and the proposal (ADR-094).
 *
 * Three things this route claims that no other spec can check, because no
 * other route makes them: it is LOCKED to light whatever the visitor
 * brought with them, it offers only the anchors it actually ships, and its
 * journey rail runs on ITS OWN order rather than production's.
 *
 * ⚠ Structural, not snapshot-based, like the corridor smoke beside it: a
 * pitch page's copy is expected to change under it (phases 2 and 3), and a
 * baseline would fail on every copy edit while catching none of the above.
 *
 * ⚠ SERIAL. The corridor's attribute writers live in the WebGL frameloop;
 * several landing pages in parallel against one dev server starve headless
 * GPU contexts and the hooks never mount.
 */
test.describe.configure({ mode: "serial" });

const SETTLE_MS = 700;

/** Roll to `y` in viewport-sized steps, then let the corridor catch up. */
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

/** The ids of every mark currently lit gold, across BOTH corners. */
const goldMarks = (page: Page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        ".rin-cl--journey .rin-mark, .rin-settings .rin-mark"
      ),
    ]
      .filter((m) => m.dataset.state === "here")
      .map((m) => m.dataset.mark ?? "")
  );

/**
 * Park inside the corridor's `navigate` band.
 *
 * ⚠ NEVER BY A HARDCODED PIXEL COUNT (the corridor smoke's own law — the
 * stage is sized in viewport units and the same `y` lands at a different
 * fraction on every project), and ⚠ never on rAF alone: the phase attribute
 * is written from the frameloop off a SMOOTHED scroll value, so it lags by
 * more than a frame. Search for it with a real settle per probe.
 */
async function walkToArc(page: Page): Promise<number> {
  const stage = await page.evaluate(
    () => document.querySelector(".home-v2-stage")?.getBoundingClientRect().height ?? 9000
  );
  const seen: string[] = [];
  for (let frac = 0.28; frac <= 0.6; frac += 0.04) {
    const y = Math.round(stage * frac);
    await rollTo(page, y);
    const phase = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-phase")
    );
    if (phase === "navigate") return y;
    seen.push(`${frac.toFixed(2)}:${phase ?? "-"}`);
  }
  throw new Error(
    `never found the navigate band (stage=${Math.round(stage)}, saw ${seen.join(" ")})`
  );
}

/** The stack's slots — where each is, and where it pins. Read off the live
 *  computed style, never a hardcoded pixel count (the stack's CSS owns the
 *  geometry and the hook reads the same values). */
const slotGeometry = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-pc-slot]")].map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        top: Math.round(r.top + window.scrollY),
        pin: Number.parseFloat(cs.top) || 0,
        position: cs.position,
      };
    })
  );

const slotStates = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-pc-slot]")].map((s) => s.getAttribute("data-pc-state"))
  );

test.describe("Trinny London pitch variant", () => {
  test("ADR-093: the light lock beats a stored dark preference AND ?theme=dark", async ({
    page,
  }) => {
    // The two ways a reader could arrive in the wrong theme. A visitor who
    // chose dark on `/` months ago is the realistic one.
    await page.addInitScript(() => window.localStorage.setItem("tf-theme", "dark"));
    const imageRequests: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "image" || /Gateway/i.test(r.url())) imageRequests.push(r.url());
    });

    await page.goto("/trinny-london?theme=dark", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(html).toHaveAttribute("data-theme-lock", "light");

    // ⚠ THE VISITOR'S CHOICE SURVIVES THE VISIT. A lock that persisted
    // itself would follow them back to `/` and change a site they never
    // asked to change.
    expect(await page.evaluate(() => window.localStorage.getItem("tf-theme"))).toBe("dark");

    // The light plate, and ONLY the light plate: the preload is injected
    // after the bootstrap stamps the attribute, so a lock that ran too late
    // would show up here as the dark plate on the wire.
    const preloads = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="image"]')].map(
        (l) => l.href
      )
    );
    expect(preloads.some((h) => h.includes("Gateway_v2-light.webp"))).toBe(true);
    expect(preloads.some((h) => h.includes("Gateway_v1b"))).toBe(false);
    expect(imageRequests.filter((u) => /Gateway_v1b/.test(u))).toEqual([]);

    // The switch is hidden, not absent — the leaf still mounts and still
    // hydrates the store from the attribute.
    const toggle = page.locator(".theme-toggle");
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toBeHidden();
  });

  test("ADR-093: unlisted — noindex, and out of the sitemap", async ({ page, request }) => {
    await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex.*nofollow/
    );
    // A sitemap that lists a noindexed URL advertises a page it then tells
    // crawlers to drop (app/sitemap.ts's own rule).
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/trinny-london");
  });

  test("ADR-053 recipe: the station order, and no anchor to a station it removed", async ({
    page,
  }) => {
    await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");

    const order = await page.evaluate(() =>
      [...document.querySelectorAll("section[id]")].map((s) => s.id)
    );
    // The parse-level order (ADR-094 added the two stations after the proof,
    // ADR-095 the turn between them; the cards inside #services are
    // `article`s, not sections).
    const stations = ["hero", "about", "services", "turn", "trinny", "proposition", "contact"];
    expect(order.filter((id) => stations.includes(id))).toEqual(stations);
    await expect(page.locator("#home-corridor-mount")).toHaveCount(1);

    // The nav items are a prop on this route (ADR-093): production's list is
    // hardcoded in React, so the parse-time link cleanup cannot reach it and
    // this page would ship two dead anchors in a drawer counting four.
    const links = await page.locator(".hud__nav__inline__link").allTextContents();
    expect(links).toEqual(["About", "Proof", "Proposal"]);
    await expect(page.locator(".hud__nav__list__head span").last()).toHaveText("03");
    for (const dead of ["#voidwalker", "#practice", "#continuum"]) {
      await expect(page.locator(`a[href="${dead}"]`)).toHaveCount(0);
    }
  });

  test("ADR-093: the journey rail runs on THIS page's order", async ({ page }) => {
    await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(600);

    // Production's row is hero · thesis · arc · proof · services · about ·
    // voidwalker. Here About is SECOND and there is no voidwalker.
    const marks = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".rin-cl--journey .rin-mark")].map(
        (m) => m.dataset.mark ?? ""
      )
    );
    // ADR-094: the Proof mark keeps the `services` id (the station's, for
    // the clock) and the proposal is a roster-only station.
    expect(marks).toEqual(["hero", "about", "thesis", "arc", "services", "proposition"]);

    // ⚠ The SECTOR denominator is this page's five, not production's seven.
    // It shipped as 07 once: the hook seeded its state with the production
    // total and bailed out of the update because the POSITION had not
    // changed — every mark correct, the number beside them wrong.
    const sector = page.locator(".rin-tele").nth(1).locator(".rin-tele__v");
    await expect(sector).toHaveText(/^0[1-5]\/05$/);

    // Gold is wayfinding: exactly one mark, and it travels in PAGE order.
    expect(await goldMarks(page)).toEqual(["hero"]);

    /* ⚠ WALKED, NOT PROBED AT A POSITION. The first cut asserted `about`
       200px into the bio and failed on desktop, where the corridor is
       already engaged there — a true reading of a page whose bio is shorter
       than the viewport is tall, and a false failure of the claim being
       made. The claim is the ORDER, so the walk collects the sequence and
       checks it against the roster's, which is scale-free. */
    const seen: string[] = ["hero"];
    const end = await page.evaluate(
      () => (document.getElementById("services")?.getBoundingClientRect().top ?? 0) + window.scrollY
    );
    for (let y = 0; y < end; y += Math.round(await page.evaluate(() => window.innerHeight * 0.4))) {
      await rollTo(page, y);
      const gold = await goldMarks(page);
      expect(gold.length, `two marks lit at y=${y}: [${gold.join(",")}]`).toBeLessThanOrEqual(1);
      if (gold[0] && gold[0] !== seen[seen.length - 1]) seen.push(gold[0]);
    }
    // Every mark the walk met, in the order it met them — a subsequence of
    // the roster's own order, never production's (where About trails
    // Services and would surface last, after the corridor).
    expect(seen).toEqual(["hero", "about", "thesis", "arc"]);

    await walkToArc(page);
    expect(await goldMarks(page)).toEqual(["arc"]);
    // …and About is BEHIND the reader, not ahead of them. This is the
    // assertion a production-clocked roster fails: `row("about")` sits at
    // readout index 3, past services at 2, so it would read `ahead` here.
    const aboutState = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>('.rin-cl--journey .rin-mark[data-mark="about"]')
          ?.dataset.state
    );
    expect(aboutState).toBe("passed");
  });

  test("ADR-094: the proof stacks in #services, and the interstitial ends the ambient", async ({
    page,
  }) => {
    await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForSelector("[data-pc-slot]", { timeout: 20_000 });

    /* The station keeps its id but mounts THIS route's slot, so nothing of
       the offer mounts — and the WebGL ring is opted out on `<html>` before
       the corridor chunk can read it (its entrance clock rests at "go"). */
    await expect(page.locator("html")).toHaveAttribute("data-services-ring", "off");
    await expect(page.locator(".fl-case")).toHaveCount(0);
    await expect(page.locator(".services-stage")).toHaveCount(0);
    await expect(page.locator(".svc-ring-hits__hit")).toHaveCount(0);
    await expect(page.locator("[data-pc-slot]")).toHaveCount(4);

    /* ⚠ GEOMETRY IS READ AT THE STACK, NOT FROM THE TOP OF THE PAGE. The
       corridor's lazy content inflates the document under the scroll
       (mobile-sections' own law), so slot tops read on arrival land short
       once the reader is actually there. Roll to the station first. */
    await rollTo(
      page,
      await page.evaluate(
        () =>
          (document.getElementById("services")?.getBoundingClientRect().top ?? 0) + window.scrollY
      )
    );
    // Desktop: every slot resolves sticky, or the hook parks the whole pile.
    const slots = await slotGeometry(page);
    for (const s of slots) expect(s.position).toBe("sticky");
    // …and the first pin clears the frame's top-left journey row.
    expect(slots[0].pin).toBeGreaterThanOrEqual(64);

    // Card 1 pinned: the pile's front, the Proof mark, the exit band live.
    await rollTo(page, slots[0].top - slots[0].pin + 40);
    expect(await slotStates(page)).toEqual(["pinned", "incoming", "incoming", "incoming"]);
    expect(await goldMarks(page)).toEqual(["services"]);
    await expect(page.locator("html")).toHaveAttribute("data-corridor-exit", "true");

    // Card 4 pinned: everything above it covered, the runway's index at the end.
    await rollTo(page, slots[3].top - slots[3].pin + 40);
    expect(await slotStates(page)).toEqual(["covered", "covered", "covered", "pinned"]);
    await expect(page.locator(".tl-stack__runway")).toHaveAttribute("data-pc-active", "3");

    /* ADR-095 — THE TURN. A transparent station the canvas lives through:
       its stage pins, the ambient hold and the exit band stay live, the
       journey turns to the Proposal, and the route's writer publishes the
       beat's clock on the station (`data-tl-turn`, a pure function of its
       rect: `(vh − top) / (vh + runway)`, runway = height − 2·vh). The
       fallback SVG is hidden while the WebGL mark is parked on stage. */
    const turn = await page.evaluate(() => {
      const el = document.getElementById("turn");
      const r = el?.getBoundingClientRect();
      return {
        top: (r?.top ?? 0) + window.scrollY,
        height: r?.height ?? 0,
        vh: window.innerHeight,
        stage: el ? getComputedStyle(el.querySelector("[data-tl-turn-stage]")!).position : null,
      };
    });
    expect(turn.stage).toBe("sticky");
    const runway = Math.max(1, turn.height - 2 * turn.vh);
    const scrollForP = (p: number) => Math.round(turn.top + p * (turn.vh + runway) - turn.vh);

    await rollTo(page, scrollForP(0.6));
    await expect(page.locator("html")).toHaveAttribute("data-services-ambient", "true");
    await expect(page.locator("html")).toHaveAttribute("data-corridor-exit", "true");
    const midP = Number(await page.locator("#turn").getAttribute("data-tl-turn"));
    expect(midP).toBeGreaterThan(0.5);
    expect(midP).toBeLessThan(0.7);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.querySelector(".tl-turn__mark")!).visibility
      )
    ).toBe("hidden");
    expect(await goldMarks(page)).toEqual(["proposition"]);

    await rollTo(page, scrollForP(1));
    expect(Number(await page.locator("#turn").getAttribute("data-tl-turn"))).toBeGreaterThanOrEqual(
      0.98
    );
    await expect(page.locator("html")).toHaveAttribute("data-services-ambient", "true");
    // The four products painted from public/ (CSP is img-src 'self') and at
    // rest — the writer's pose vars at their settled values.
    await page.waitForTimeout(800);
    const products = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tl-turn__product")].map((i) => ({
        painted: i.complete && i.naturalWidth > 0,
        o: Number(i.style.getPropertyValue("--tm-o")),
        s: Number(i.style.getPropertyValue("--tm-s")),
      }))
    );
    expect(products).toHaveLength(4);
    for (const p of products) {
      expect(p.painted).toBe(true);
      expect(p.o).toBeGreaterThanOrEqual(0.95);
      expect(p.s).toBeGreaterThanOrEqual(0.98);
    }

    /* The interstitial is the declared kill edge: once its top has passed
       the viewport top the ambient hold and the exit band are gone — an
       opaque station the hook did not name would have hard-cut the canvas
       at that edge instead (ADR-030 §6). On the capable rung it overlaps
       the turn by a viewport, so this is also where the stage releases. */
    const trinnyTop = await page.evaluate(
      () => (document.getElementById("trinny")?.getBoundingClientRect().top ?? 0) + window.scrollY
    );
    await rollTo(page, trinnyTop + 40);
    expect(
      await page.evaluate(() => document.documentElement.getAttribute("data-corridor-exit"))
    ).toBeNull();
    expect(await goldMarks(page)).toEqual(["proposition"]);
    await expect(page.locator("#trinny .tl-turn__product")).toHaveCount(0);

    // The proposal: the head, the three bands, the three kickers.
    await expect(page.locator("#proposition .tl-prop__title")).toHaveText(
      "The Trinny London configuration"
    );
    await expect(page.locator("#proposition .tl-config__band")).toHaveCount(3);
    await expect(page.locator("#proposition .tl-config__kicker")).toHaveCount(3);
  });

  test("ADR-053 invariant: the entry hold never covers the bio", async ({ page }) => {
    /* `useLandingScroll` arms `data-corridor-entry` with no upper bound, and
       home-v2.css then pins the corridor's sticky cell `position: fixed`
       full-viewport. On `/` the hero is the curtain over it; here #about
       sits between the hero and the mount, so the armed frame would paint
       over the last viewport of the bio. The route sheet restores native
       sticky — this is the assertion that it still does. */
    await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");

    const mountTop = await page.evaluate(() => {
      const el = document.getElementById("home-corridor-mount");
      return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0;
    });
    // Just short of the mount: the entry flag is armed and the bio is still
    // the thing on screen.
    await rollTo(page, Math.max(0, mountTop - 300));
    await expect(page.locator("html")).toHaveAttribute("data-corridor-entry", "1");
    const position = await page.evaluate(
      () => getComputedStyle(document.querySelector(".home-v2-stage__sticky") as Element).position
    );
    expect(position).toBe("sticky");
  });
});
