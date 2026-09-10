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

/**
 * Seat one slot on its own pin, converging.
 *
 * ⚠ A SOLVED `y` GOES STALE UNDER THE SCROLL. The document grows as the
 * corridor's lazy chunks mount, so geometry read at the top of the stack is
 * short by the time the reader is at the bottom of it — and the deeper the
 * slot, the further short. That is the same law the turn's `rollToP` obeys
 * one beat later (ADR-095: converge on the published clock, never on one
 * solved position); it reached the stack when ADR-094 U1 lengthened the
 * pinned dwell and card 4 stopped arriving at `top − pin + 40`.
 */
async function seatSlot(page: Page, idx: number, offset = 40): Promise<void> {
  const seen: string[] = [];
  for (let pass = 0; pass < 8; pass++) {
    const s = await page.evaluate((i) => {
      const el = document.querySelectorAll<HTMLElement>("[data-pc-slot]")[i];
      const r = el.getBoundingClientRect();
      return {
        doc: Math.round(r.top + window.scrollY),
        pin: Number.parseFloat(getComputedStyle(el).top) || 0,
        state: el.getAttribute("data-pc-state"),
      };
    }, idx);
    /* ⚠ CONVERGE ON THE HOOK'S OWN PUBLISHED STATE, not on the rect. A
       geometry check can be satisfied on one pass and stale on the next —
       the lazy chunks are still decoding and the document is still
       growing — and the first cut of this helper returned on exactly that,
       leaving the whole pile 62px short with card 4 reading `incoming`
       while the still showed it seated. `data-pc-state` is what the hook
       actually computed on the frame we are about to assert. */
    if (s.state === "pinned" || s.state === "covered") return;
    seen.push(`${s.state}@${s.doc}`);
    await rollTo(page, s.doc - s.pin + offset);
  }
  throw new Error(`slot ${idx} never seated (saw ${seen.join(" ")})`);
}

const slotStates = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-pc-slot]")].map((s) => s.getAttribute("data-pc-state"))
  );

/**
 * One card's head strip and the field under it (ADR-094 U1).
 *
 * ⚠ THIS SURFACE HAD NO MARKUP GUARD AT ALL until this pass — `tl-card`
 * appeared in no test file — so the head could be recomposed and the fields
 * rebuilt with every gate green. It reads what the owner's ruling is ABOUT:
 * the client leads the strip, the project's name is down in the record, the
 * tabs are flat and square, and the field shows ONE thing.
 */
const cardShape = (page: Page, idx: number) =>
  page.evaluate((i) => {
    const slot = document.querySelectorAll<HTMLElement>("[data-pc-slot]")[i];
    const head = slot.querySelector<HTMLElement>(".tl-card__head")!;
    const stns = [...head.querySelectorAll<HTMLElement>(".fl-con__stn")];
    return {
      /* The head's own children, in order — the kicker leads. */
      lead: head.firstElementChild?.className ?? "",
      kicker: head.querySelector(".tl-card__kicker")?.textContent?.trim() ?? "",
      /* The name is in the RECORD column now, never in the strip. */
      titleInRecord: !!slot.querySelector(".tl-card__record > .tl-card__title"),
      titleInHead: !!head.querySelector(".tl-card__title"),
      stations: stns.map((b) => b.textContent?.trim() ?? ""),
      on: stns.filter((b) => b.hasAttribute("data-on")).length,
      /* Both halves of "no gradient, no notch" — pinned from both ends so a
         restored ramp or a returning chamfer fails rather than passing by
         omission. */
      ramps: stns.map((b) => getComputedStyle(b).backgroundImage),
      clips: stns.map((b) => getComputedStyle(b).clipPath),
      spineShown: [...slot.querySelectorAll<HTMLElement>(".fl-con__spine")].some(
        (el) => getComputedStyle(el).display !== "none"
      ),
      films: slot.querySelectorAll(".tl-film").length,
      wires: slot.querySelectorAll(".tl-wire").length,
      stills: slot.querySelectorAll(".tl-still").length,
      maps: slot.querySelectorAll(".fl-pda").length,
    };
  }, idx);

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
    // The parse-level order (ADR-094 added the proposal after the proof,
    // ADR-095 the turn before it — and ADR-095 U1 deleted the interstitial
    // slab between them; the cards inside #services are `article`s).
    const stations = ["hero", "about", "services", "turn", "proposition", "contact"];
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
    await seatSlot(page, 0);
    expect(await slotStates(page)).toEqual(["pinned", "incoming", "incoming", "incoming"]);
    expect(await goldMarks(page)).toEqual(["services"]);
    await expect(page.locator("html")).toHaveAttribute("data-corridor-exit", "true");

    // Card 4 pinned: everything above it covered, the runway's index at the end.
    await seatSlot(page, 3);
    expect(await slotStates(page)).toEqual(["covered", "covered", "covered", "pinned"]);
    await expect(page.locator(".tl-stack__runway")).toHaveAttribute("data-pc-active", "3");

    /* ADR-094 U1 — THE HEAD IS CHROME AND THE FIELD SHOWS ONE THING.
       The client leads every strip, the project's name sits in the record
       column, and the three cards that had more than one thing to show
       switch on the house rail instead of printing all of it at once. */
    const shapes = await Promise.all([0, 1, 2, 3].map((i) => cardShape(page, i)));
    for (const [i, c] of shapes.entries()) {
      expect(c.lead, `card ${i + 1} leads with the client`).toContain("tl-card__kicker");
      expect(c.kicker, `card ${i + 1} kicker`).toMatch(/^Loop Earplugs \u00b7 /);
      expect(c.titleInRecord, `card ${i + 1} name is in the record`).toBe(true);
      expect(c.titleInHead, `card ${i + 1} name is out of the head`).toBe(false);
      /* ⚠ Both halves of the owner's note, on every station that exists:
         no ramp (`console.css`'s recess and its lit gradient) and no notch
         (the leading station's chamfer, which had no console cut above it
         to explain). Asserting only "the open one is filled" would let
         either come back. */
      for (const r of c.ramps) expect(r, `card ${i + 1} station ramp`).toBe("none");
      for (const cp of c.clips) expect(cp, `card ${i + 1} station notch`).toBe("none");
      expect(c.spineShown, `card ${i + 1} spine`).toBe(false);
      if (c.stations.length) {
        expect(c.on, `card ${i + 1} has exactly one open station`).toBe(1);
      }
    }
    // The ads card is a contact sheet — one object, six shots, no rail.
    expect(shapes[0].stations).toEqual([]);
    expect(shapes[0].stills).toBeGreaterThan(1);
    // The two crammed cards now show ONE film / ONE drawing.
    expect(shapes[1].stations).toHaveLength(2);
    expect(shapes[1].films).toBe(1);
    expect(shapes[2].stations).toHaveLength(4);
    expect(shapes[2].wires).toBe(1);
    /* The map's own three readings, LIFTED INTO THE HEAD — which is also
       what makes them pressable here: the card covers the console with a
       transparent layer so its wheel capture cannot freeze the stack. */
    expect(shapes[3].stations).toEqual(["WORK", "CONFIGURATION", "SUBSTRATE"]);
    expect(shapes[3].maps).toBe(1);
    expect(
      await page.locator('[data-pc-index="3"] .fl-pda .fl-con__rail').count(),
      "the map's rail left the console"
    ).toBe(0);

    // A station click swaps the field and moves the mark.
    const toolTabs = page.locator('[data-pc-index="2"] .fl-con__stn');
    await toolTabs.nth(2).click();
    await expect(toolTabs.nth(2)).toHaveAttribute("data-on", "true");
    expect((await cardShape(page, 2)).on).toBe(1);
    expect((await cardShape(page, 2)).wires).toBe(1);

    /* ADR-095 — THE TURN, and ADR-095 U1's ground + decoded line. A
       transparent station the canvas lives through: its stage pins, the
       ambient hold and the exit band stay live, the journey turns to the
       Proposal, and the route's writer publishes the beat's clock on the
       station (`data-tl-turn`, a pure function of its rect:
       `(vh − top) / (vh + runway)`, runway = height − vh). NOTHING slides
       over it — the ground itself warms and resolves. */
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
    /** ⚠ CONVERGE ON THE PUBLISHED CLOCK, never on one solved `y`. The
     *  document grows under the scroll as the lazy chunks mount, so a `y`
     *  computed before a roll lands at a different `p` — measured 0.84
     *  asked, 0.64 arrived, which is the difference between the line lit and
     *  the line still mid-decode. The writer publishes what it actually
     *  computed, so re-solve against THAT until it agrees. */
    const publishedP = () =>
      page.evaluate(() =>
        Number(document.getElementById("turn")?.getAttribute("data-tl-turn") ?? "0")
      );
    const rollToP = async (p: number) => {
      for (let pass = 0; pass < 5; pass++) {
        const r = await page.evaluate(() => {
          const el = document.getElementById("turn")?.getBoundingClientRect();
          return { top: (el?.top ?? 0) + window.scrollY, height: el?.height ?? 0 };
        });
        const runway = Math.max(1, r.height - turn.vh);
        await rollTo(page, Math.round(r.top + p * (turn.vh + runway) - turn.vh));
        if (Math.abs((await publishedP()) - p) <= 0.01) return;
      }
      expect(await publishedP(), `the turn never settled at p ${p}`).toBeCloseTo(p, 1);
    };

    /** Every decoded line's live layer beside the ghost that holds its box. */
    const decodeLines = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("#turn .tl-dc")].map((dc) => ({
          ghost: dc.querySelector<HTMLElement>(".tl-dc__ghost")?.textContent ?? "",
          live: dc.querySelector<HTMLElement>(".tl-dc__live")?.textContent ?? "",
          ghostBox: Math.round(
            dc.querySelector<HTMLElement>(".tl-dc__ghost")?.getBoundingClientRect().width ?? 0
          ),
        }))
      );

    // Mid-turn: the mark's own beat. The ambient still holds, the ground has
    // begun to warm, and the copy has not arrived.
    await rollToP(0.6);
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
    const midWash = await page.evaluate(() =>
      Number(
        getComputedStyle(document.querySelector<HTMLElement>("[data-tl-turn-stage]")!)
          .getPropertyValue("--tl-wash")
          .trim()
      )
    );
    expect(midWash).toBeGreaterThan(0.2);

    // The line, lit: every live layer carries its ghost's exact string.
    await rollToP(0.84);
    const lit = await decodeLines();
    expect(lit).toHaveLength(4);
    for (const line of lit) {
      expect(line.ghost.length).toBeGreaterThan(0);
      expect(line.live).toBe(line.ghost);
    }
    // …and the products have settled around it.
    const products = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLImageElement>(".tl-turn__product")].map((i) => ({
        painted: i.complete && i.naturalWidth > 0,
        o: Number(i.style.getPropertyValue("--tm-o")),
      }))
    );
    expect(products).toHaveLength(4);
    for (const pr of products) {
      expect(pr.painted).toBe(true);
      expect(pr.o).toBeGreaterThanOrEqual(0.95);
    }

    /* ADR-095 U3 — THE COPY SITS AROUND THE MARK, NOT ON IT (owner,
       2026-09-10: the title and the text "overlap with the logo"). The mark
       is WebGL and has no box to measure, so this asserts the band it
       occupies is clear: the title block ends above the ring's top and the
       paragraph and button begin below its bottom, both derived from the
       same weld point and radius the CSS seats them off.
       ⚠ The two literals restate the design intent rather than reading the
       tokens back — a guard that computed the band from `--tl-mark-cy` and
       `--tl-mark-r` would agree with the CSS by construction and catch
       nothing. */
    const band = await page.evaluate(() => {
      const stage = document
        .querySelector<HTMLElement>("[data-tl-turn-stage]")!
        .getBoundingClientRect();
      const box = (sel: string) => {
        const r = document.querySelector<HTMLElement>(sel)!.getBoundingClientRect();
        return {
          top: (r.top - stage.top) / stage.height,
          bottom: (r.bottom - stage.top) / stage.height,
        };
      };
      return { over: box(".tl-turn__copy--over"), under: box(".tl-turn__copy--under") };
    });
    // The ring reaches roughly 0.29 → 0.80 of the stage about its weld point.
    expect(band.over.bottom, "the title clears the mark's top").toBeLessThanOrEqual(0.29);
    expect(band.under.top, "the paragraph clears the mark's bottom").toBeGreaterThanOrEqual(0.8);
    // …and neither runs off the stage, which is how a split fails quietly.
    expect(band.over.top).toBeGreaterThan(0);
    expect(band.under.bottom).toBeLessThan(1);

    /* The end of the runway: the line has un-typed back out and the ground
       has RESOLVED, so the proposal below meets the page's own parchment
       and no edge is ever drawn. ⚠ The ghost's box may not have moved a
       pixel across the whole decode — that is the effect's one promise. */
    const litBoxes = lit.map((l) => l.ghostBox);
    await rollToP(1);
    const gone = await decodeLines();
    for (const line of gone) expect(line.live).toBe("");
    expect(gone.map((l) => l.ghostBox)).toEqual(litBoxes);
    const endWash = await page.evaluate(() =>
      Number(
        getComputedStyle(document.querySelector<HTMLElement>("[data-tl-turn-stage]")!)
          .getPropertyValue("--tl-wash")
          .trim()
      )
    );
    expect(endWash).toBeLessThan(0.05);

    /* The proposal is the declared kill edge now (ADR-095 U1 moved it off
       the deleted interstitial): once its top has passed the viewport top
       the ambient hold and the exit band are gone — an opaque station the
       hook did not name would have hard-cut the canvas at that edge
       instead (ADR-030 §6). */
    const propTop = await page.evaluate(
      () =>
        (document.getElementById("proposition")?.getBoundingClientRect().top ?? 0) + window.scrollY
    );
    await rollTo(page, propTop + 40);
    expect(
      await page.evaluate(() => document.documentElement.getAttribute("data-corridor-exit"))
    ).toBeNull();
    expect(await goldMarks(page)).toEqual(["proposition"]);

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
