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
 * Put one slot on its pin from ANYWHERE in the pile, including from below it.
 *
 * ⚠ `seatSlot` cannot do this, twice over. It returns early on `covered` —
 * fine while the card's controls lived in the head's peek band, wrong since
 * ADR-094 U2 put the rail and the players in the FIELD, which a later card
 * covers. And a converging re-seat does not work either: `rect.top +
 * scrollY` on an already-pinned `sticky` slot gives the PINNED position, so
 * `doc − pin` converges on wherever it already is (measured 12532 → 12765,
 * `covered` eight passes running). `seatSlot` is sound walking DOWN the pile
 * only — so rewind to the stack's top and walk.
 */
async function seatPinnedFromTop(page: Page, idx: number): Promise<void> {
  const toStackTop = async () =>
    rollTo(
      page,
      await page.evaluate(
        () =>
          (document.getElementById("services")?.getBoundingClientRect().top ?? 0) + window.scrollY
      )
    );
  await toStackTop();
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
    if (s.state === "pinned") return;
    seen.push(`${s.state}@${s.doc}`);
    /* ⚠ ONLY AN `incoming` SLOT'S RECT IS TRUSTWORTHY. Once it sticks,
       `rect.top + scrollY` reports the PINNED position, so the arithmetic
       converges on wherever it already is. Overshooting is therefore not
       recoverable in place — rewind and walk again. And the document GROWS
       under the walk as the lazy chunks mount, which is why one pass is not
       enough even from a known start. */
    if (s.state === "covered") await toStackTop();
    else await rollTo(page, s.doc - s.pin + 40);
  }
  throw new Error(`slot ${idx} never pinned (saw ${seen.join(" ")})`);
}

/**
 * One card's head strip and the field under it (ADR-094 U1).
 *
 * ⚠ THIS SURFACE HAD NO MARKUP GUARD AT ALL until this pass — `pf-card`
 * appeared in no test file — so the head could be recomposed and the fields
 * rebuilt with every gate green. It reads what the owner's ruling is ABOUT:
 * the client leads the strip, the project's name is down in the record, the
 * tabs are flat and square, and the field shows ONE thing.
 *
 * ⚠ THE RAIL MOVED INTO THE BAND (ADR-097 U6), so this reads it from the
 * HEAD now. The reason the old comment gave still stands, pointed the other
 * way: read it from the wrong container and this reports four railless cards
 * while staying green on a rail that had stopped rendering.
 */
const cardShape = (page: Page, idx: number) =>
  page.evaluate((i) => {
    const slot = document.querySelectorAll<HTMLElement>("[data-pc-slot]")[i];
    const head = slot.querySelector<HTMLElement>(".pf-card__head")!;
    const field = slot.querySelector<HTMLElement>(".pf-card__field")!;
    /* ⚠ THE RAIL IS BACK IN THE FIELD (ADR-097 U7, retiring U6's band seat —
       owner: "I don't think the tabs in the header is working; can't we
       restore them in their original position?"). Read from the SLOT, which
       answers wherever the rail is seated; reading it from one host is how
       this reader would report four railless cards and stay green on a rail
       that had merely moved. */
    const stns = [...slot.querySelectorAll<HTMLElement>(".fl-con__stn")];
    const tabs = slot.querySelector<HTMLElement>(".pf-card__tabs");
    return {
      /* The band is a flat strip again (U7), so the kicker leads the head
         itself rather than a `__headid` cell inside it. */
      lead: head.firstElementChild?.className ?? "",
      kicker: head.querySelector(".pf-card__kicker")?.textContent?.trim() ?? "",
      /* ⚠ THE HEAD HAS NO RIGHT SLOT (U7, owner: "remove the numbers (01
         etc)"). The ordinal held it from ADR-094 U4; the CLAIM is the display
         title below, and the project's name letters nowhere on the card at
         all. Counted, not read — the pin is the absence. */
      arcs: slot.querySelectorAll(".pf-card__arc").length,
      headRails: head.querySelectorAll(".pf-card__headrail").length,
      /* The display heading — the arc's own line since U3. */
      title: slot.querySelector(".pf-card__title")?.textContent?.trim() ?? "",
      /* ADR-065's canonical diagonal on the housing, and rule 4 under it:
         the children of a chamfered box are SQUARE. */
      cardClip: getComputedStyle(slot.querySelector<HTMLElement>(".pf-card")!).clipPath,
      /* The stations have their own pin below (ADR-089 U3's no-notch
         ruling); these are the two boxes rule 4 reaches that nothing else
         looks at. */
      childClips: [...slot.querySelectorAll<HTMLElement>(".fl-con__console, .pf-card__field")].map(
        (el) => getComputedStyle(el).clipPath
      ),
      titleInRecord: !!slot.querySelector(".pf-card__record > .pf-card__title"),
      titleInHead: !!head.querySelector(".pf-card__title"),
      stationsInHead: head.querySelectorAll(".fl-con__stn").length,
      /* ⚠ AND IT MAY NEVER REACH THE RECORD (owner, twice over: the tabs
         "should never extend too much to the left side where the left panel
         sits"). Back in the field the rail is FULL-BLEED to the field's own
         box (ADR-097 U4), and the field begins on the divider — so this is
         the same question asked of a different seat, measured, not assumed. */
      railCrossesDivider: (() => {
        const first = stns[0]?.getBoundingClientRect();
        const f = field.getBoundingClientRect();
        return first ? first.left < f.left - 1 : false;
      })(),
      /* ⚠ THE RAIL IS IN THE CARD'S OWN SLOT, which for the studio card is
         the PORTAL landing (`SheetsPlate.railHost`). Counting stations
         anywhere in the field would pass on a plate that had quietly kept
         its rail in its own console. */
      stationsInSlot: tabs ? tabs.querySelectorAll(".fl-con__stn").length : 0,
      /* The claim's evidence sentence — the record the homepage's left
         column carries and this card did not read until U2. */
      claimDescs: [...slot.querySelectorAll(".pf-card__claim-desc")].map(
        (el) => el.textContent?.trim() ?? ""
      ),
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
      films: slot.querySelectorAll(".pf-film").length,
      wires: slot.querySelectorAll(".pf-wire").length,
      /* The ads are the casefile's own `.fl-still` since U3 — the card
         mounts `SheetsPlate` whole rather than re-typing its bodies. */
      stills: slot.querySelectorAll(".fl-still").length,
      maps: slot.querySelectorAll(".fl-pda").length,
      /* One sheet's verdict band, which is the thing that makes three
         sheets read as one instrument showing three faces. */
      verdicts: slot.querySelectorAll(".fl-verdict").length,
      /* THE PLAYERS (U3). A film's control is its own FRAME (a `<button>`,
         the homepage films plate's grammar); a drawing gets a labelled bar,
         because a control over a wireframe has to say what it opens. */
      filmIsButton: slot.querySelector(".pf-film__frame")?.tagName ?? "",
      watchBars: slot.querySelectorAll(".pf-watch").length,
      /* ADR-094 U8 — THE LADDER AND THE HOUSING. Nothing pinned a type size
         on this card before (`fontSize` appeared in zero assertions), which
         is how it shipped one rung small. The claim is the lede's PEER by
         size and outranks it by weight; the mark is an integer lattice
         multiple; the field is inset off both edges; the tools' bar is the
         box's FOOT; and the register's floor is the box's floor. */
      ladder: (() => {
        const px = (sel: string) => {
          const el = slot.querySelector<HTMLElement>(sel);
          return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
        };
        const ct = slot.querySelector<HTMLElement>(".pf-card__claim-title");
        return {
          title: px(".pf-card__title"),
          lede: px(".pf-card__lede"),
          claim: px(".pf-card__claim-title"),
          claimWeight: ct ? getComputedStyle(ct).fontWeight : "",
          /* ⚠ LAYOUT width, not the rect (ADR-097). These shapes are read
             with card 4 seated, so cards 1–3 are COVERED and scaled by depth
             (.91 at the bottom of the pile); `getBoundingClientRect` on a
             transformed subtree returns a PICTURE of the layout, and this
             read passed on `scale(.98)` only because 21 × .98 rounds back to
             21. At .91 it is 19. */
          mark: slot.querySelector<HTMLElement>(".pf-card__mark")?.offsetWidth ?? 0,
        };
      })(),
      housing: (() => {
        const r = (sel: string) =>
          slot.querySelector<HTMLElement>(sel)?.getBoundingClientRect() ?? null;
        const cardEl = slot.querySelector<HTMLElement>(".pf-card")!;
        const card = r(".pf-card")!;
        /* The card's rendered-over-layout ratio: 1 on the open card, under it
           on a covered one. Every rect DELTA below is a transformed length and
           is divided by this before it is compared with a token (ADR-097). */
        const k = card.width / Math.max(1, cardEl.offsetWidth);
        const record = r(".pf-card__record")!;
        const box = r(".pf-field--tools");
        const wire = r(".pf-wire");
        const watch = r(".pf-watch");
        const claims = [...slot.querySelectorAll<HTMLElement>(".pf-card__claim")];
        const last = claims.length ? claims[claims.length - 1].getBoundingClientRect() : null;
        return {
          k,
          /* The head is the client's BAND (ADR-097 U1 — the owner took the
             tab-only cut off: "I want the full top row to have that
             gradient"): its share of the top edge, both rects transformed
             alike so the ratio needs no `k`, and its paint. */
          headShare: head.getBoundingClientRect().width / Math.max(1, card.width),
          headBg: getComputedStyle(head).backgroundImage,
          divider: record.right,
          cardRight: card.right,
          firstStnLeft: stns.length ? stns[0].getBoundingClientRect().left : null,
          lastStnRight: stns.length ? stns[stns.length - 1].getBoundingClientRect().right : null,
          box: box ? { left: box.left, right: box.right, bottom: box.bottom } : null,
          wireLeft: wire?.left ?? null,
          watch: watch ? { left: watch.left, right: watch.right, bottom: watch.bottom } : null,
          lastClaimBottom: last?.bottom ?? null,
          bayHead: slot.querySelector(".pf-bay__head")?.textContent?.trim() ?? "",
        };
      })(),
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
    await expect(page.locator(".pf-stack__runway")).toHaveAttribute("data-pc-active", "3");

    /* ADR-094 U1 — THE HEAD IS CHROME AND THE FIELD SHOWS ONE THING.
       The client leads every strip, the project's name sits in the record
       column, and the three cards that had more than one thing to show
       switch on the house rail instead of printing all of it at once. */
    const shapes = await Promise.all([0, 1, 2, 3].map((i) => cardShape(page, i)));
    for (const [i, c] of shapes.entries()) {
      /* ⚠ THE BAND IS A FLAT STRIP AGAIN (U7). U6 made it the body's `2fr 3fr`
         grid so a rail could sit in its second cell, and pinned the identity
         into a `__headid` wrapper; with the rail back in the field the head
         has one child and the kicker leads it directly. */
      expect(c.lead, `card ${i + 1} leads with the client`).toContain("pf-card__kicker");
      expect(c.kicker, `card ${i + 1} kicker`).toMatch(/^Loop Earplugs \u00b7 /);
      expect(c.titleInRecord, `card ${i + 1} name is in the record`).toBe(true);
      expect(c.titleInHead, `card ${i + 1} name is out of the head`).toBe(false);
      /* \u26a0 ADR-094 U2 \u2014 THE HEAD CARRIES THE ARC AND NOTHING ELSE. This
         strip is the PEEK BAND, the sliver a covered card still shows; with
         the tabs gone it would otherwise read `LOOP EARPLUGS \u00b7 BUILD` on
         all four and the pile would stop indexing itself. Pinned from both
         ends: the beat is here, and the rail is NOT. */
      /* ⚠ THE CLAIM IS THE HEADING AND THE BAND IS THE CLIENT ALONE (U3 +
         ADR-097 U7: "remove the numbers (01 etc)" and the rail back to the
         field). The ordinal held the head's right slot from ADR-094 U4 and
         this asserted it was two digits; the absence is what is pinned now,
         on both the ordinal and the band rail, because the head is the strip
         a covered card still shows and anything creeping back into it is on
         screen four times over. */
      expect(c.title, `card ${i + 1} title is the arc's claim`).toMatch(/^We\s+\S/);
      expect(c.arcs, `card ${i + 1} letters an ordinal again`).toBe(0);
      expect(c.headRails, `card ${i + 1} rail came back to the band`).toBe(0);
      /* ⚠ ADR-065's CANONICAL DIAGONAL ON THE HOUSING (U4, owner: "all the
         cards in the proof section should have a notch … in the bottom-left
         and top-right corners") — and RULE 4 with it, from both ends: the
         card is cut, and the things seated inside it are not. A chamfer that
         propagated into the rail or the console is what makes a surface read
         as a pile of notched things rather than one housing with parts. */
      expect(c.cardClip, `card ${i + 1} is chamfered`).toMatch(/^polygon\(/);
      for (const cp of c.childClips) {
        expect(cp, `card ${i + 1} child keeps square corners`).toBe("none");
      }
      expect(c.stationsInHead, `card ${i + 1} rail left the field`).toBe(0);
      expect(c.railCrossesDivider, `card ${i + 1} rail reaches over the record`).toBe(false);
      /* Four claims, each with its evidence sentence in the DOM. Whether it
         PAINTS is a height rung (940h) \u2014 the sentence is sr-only below it,
         which is the casefile's own 1070h precedent \u2014 so this asserts the
         record is read, not that it is visible at every viewport. */
      expect(c.claimDescs, `card ${i + 1} claim sentences`).toHaveLength(4);
      for (const d of c.claimDescs) expect(d.length).toBeGreaterThan(0);
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
      /* ⚠ ADR-094 U8 — ONE LADDER. Title ≥ 24px; the claim is the lede's peer
         by SIZE and outranks it by WEIGHT (500, the ceiling); the mark is an
         integer multiple of the 7-cell lattice (21 here, 28 on the 940h rung).
         An equality on two computed sizes, not a floor: the day one moves
         without the other the ranking is by accident again. */
      expect(c.ladder.title, `card ${i + 1} title size`).toBeGreaterThanOrEqual(24);
      expect(c.ladder.claim, `card ${i + 1} claim = lede`).toBeCloseTo(c.ladder.lede, 1);
      expect(c.ladder.claimWeight, `card ${i + 1} claim weight`).toBe("500");
      expect([21, 28], `card ${i + 1} mark on the lattice`).toContain(Math.round(c.ladder.mark));
      /* ⚠ THE FIELD IS INSET OFF BOTH EDGES, rail and bay on ONE edge (owner:
         "too close to the center border and the right border"). ≥ 16px is
         the token's floor; the divider is the record's right edge. */
      /* ⚠ THE RAIL IS IN THE BAND, AND IT MAY NEVER REACH THE RECORD
         (ADR-097 U6, owner: the tabs "should never extend too much to the
         left side where the left panel sits, it should remain on the right
         side"). The band carries the body's own tracks, so the rail's cell
         BEGINS on the divider and crossing it is not a thing the layout can
         do. An inequality, not an equality: U4's full-bleed clause was about
         a rail spanning the PANEL it sat on, and this rail no longer sits on
         one — what survives of it is that the row still starts at the
         divider and still stops inside the card.
         ⚠ DIVIDED BY THE CARD'S SCALE: cards 1–3 are covered here and receded
         by depth. The token is a layout length; the rect is a picture of it. */
      if (c.housing.firstStnLeft !== null) {
        expect(
          (c.housing.firstStnLeft - c.housing.divider) / c.housing.k,
          `card ${i + 1} rail reaches over the record`
        ).toBeGreaterThanOrEqual(-1.5);
        expect(
          (c.housing.cardRight - c.housing.lastStnRight!) / c.housing.k,
          `card ${i + 1} rail runs past the card's edge`
        ).toBeGreaterThanOrEqual(-1.5);
      }
      /* ⚠ THE HEAD IS THE CLIENT'S BAND (ADR-097 U1) — the FULL top row,
         carrying the client's gradient; the first cut's tab-only tint was
         read off the live page and rejected the same day. Pinned from both
         ends: the row spans the card, and it paints a gradient. */
      expect(c.housing.headShare, `card ${i + 1} head is not the full top row`).toBeGreaterThan(
        0.98
      );
      expect(c.housing.headBg, `card ${i + 1} head carries no gradient`).toMatch(/linear-gradient/);
    }
    /* ⚠ THE ORDER IS THE RECORD'S ARC SINCE ADR-094 U2 and these indices
       moved with it: the frontier work leads, because it is what earned the
       studio the right to run AI itself. `trinny-proof-order.test.ts` pins
       the sequence against `arc.step`; this pins what each card SHOWS. */
    // 01 the frontier — ONE film, on its own rail, in the 4:5 social cut,
    // and the frame is the control that plays it.
    expect(shapes[0].stations).toHaveLength(2);
    expect(shapes[0].films).toBe(1);
    expect(shapes[0].filmIsButton).toBe("BUTTON");
    expect(shapes[0].watchBars, "a film needs no labelled bar").toBe(0);
    /* 02 the studio — THREE SHEETS on the rail (U3, owner: "we also should
       have tabs, just like on the homepage, where we have our guidelines on
       where not to use AI, governance and the red line"). The record held
       all three and this card was rendering the ad wall alone.
       ⚠ THE RAIL IS PORTALLED: `SheetsPlate` owns which sheet is open, so
       `proofTabs` returns null for this kind and the stations arrive in the
       card's slot from the plate — which is what `stationsInSlot` proves. */
    expect(shapes[1].stations).toEqual(["THE WORK", "THE GOVERNANCE", "THE RED LINE"]);
    expect(shapes[1].stationsInSlot).toBe(3);
    expect(shapes[1].stills).toBeGreaterThan(1);
    expect(shapes[1].verdicts, "each sheet ends on its verdict").toBe(1);
    // 03 the tools — ONE drawing at a time, over its walkthrough.
    expect(shapes[2].stations).toHaveLength(4);
    expect(shapes[2].wires).toBe(1);
    expect(shapes[2].watchBars).toBe(1);
    /* ⚠ ADR-094 U8 — THE TOOLS BAY IS AN APPARATUS: one hairline box from
       under the rail to the card's floor, a head micro-label (the year the
       tool went into service — record, not copy), the drawing centred inside
       it off both walls, and the watch bar FUSED as the box's foot (the
       homepage bay's own grammar, ADR-068). Pinned as RELATIONS between
       rects, not as sizes: the bar's bottom IS the box's bottom, its width IS
       the box's, and the register's last rule lands on that same floor —
       which is the one line that makes two columns read as one card. */
    const h3 = shapes[2].housing;
    expect(h3.box, "the tools field draws its box").not.toBeNull();
    expect(h3.bayHead, "the bay's head letters the year").toMatch(/^In service \d{4}$/i);
    expect(
      h3.wireLeft! - h3.box!.left,
      "the drawing clears the box's left wall"
    ).toBeGreaterThanOrEqual(12);
    expect(
      Math.abs(h3.watch!.bottom - h3.box!.bottom),
      "the bar is the box's foot"
    ).toBeLessThanOrEqual(1.5);
    expect(
      Math.abs(h3.watch!.left - h3.box!.left),
      "the bar spans the box (L)"
    ).toBeLessThanOrEqual(1.5);
    expect(
      Math.abs(h3.watch!.right - h3.box!.right),
      "the bar spans the box (R)"
    ).toBeLessThanOrEqual(1.5);
    expect(
      Math.abs(h3.lastClaimBottom! - h3.box!.bottom),
      "register and box share one floor"
    ).toBeLessThanOrEqual(2);
    /* 04 the company — the map's own three readings, PORTALLED into the
       field's rail, which is also what makes them pressable here: the card
       covers the console with a transparent layer so its wheel capture
       cannot freeze the stack. */
    expect(shapes[3].stations).toEqual(["WORK", "CONFIGURATION", "SUBSTRATE"]);
    expect(shapes[3].maps).toBe(1);
    expect(
      await page.locator('[data-pc-index="3"] .fl-pda .fl-con__rail').count(),
      "the map's rail left the console"
    ).toBe(0);

    /* ⚠ THE FILM IS THE 4:5 SOCIAL CUT, AND ITS CAPTION SAYS SO. A 16:9
       poster in a 693×926 field is a stamp with a third of the box empty
       either side; the record's `portrait` still is the same film framed
       for the shape it is shown in. Both halves are pinned — the picture
       and the line under it — because a caption left on the master's meta
       contradicts the frame directly above it. */
    const film = await page.evaluate(() => {
      const el = document.querySelector<HTMLImageElement>('[data-pc-index="0"] .pf-film img');
      const box = el?.getBoundingClientRect();
      return {
        portrait: !!document.querySelector('[data-pc-index="0"] .pf-film--portrait'),
        src: el?.currentSrc || el?.src || "",
        ratio: box ? box.width / box.height : 0,
        caption: [...document.querySelectorAll('[data-pc-index="0"] .pf-film__caption > span')].map(
          (s) => s.textContent?.trim() ?? ""
        ),
      };
    });
    expect(film.portrait).toBe(true);
    expect(film.src).toMatch(/4x5/);
    expect(film.ratio).toBeCloseTo(0.8, 1);
    expect(film.caption[1]).not.toMatch(/16\s*:\s*9/i);

    /* ⚠ AND IT PLAYS IN THE FRAME, NOT OVER THE PAGE (U4, owner: "when you
       click on the video thumbnail, it shows the full-screen video. I don't
       want that"). Three things, and the box is the one that matters most:
       the `<video>` takes EXACTLY the still's rect, so the swap is
       pixel-for-pixel and nothing reflows under the click. */
    await seatPinnedFromTop(page, 0);
    /* ⚠ THE ORIGIN IS PART OF THE RECT, AND LEAVING IT OUT IS WHAT LET THE
       PLAYER JUMP (owner, 2026-09-10: it "moves to the left side while it
       should stay centered like the thumbnail"). This read was `{w, h}` and
       the frame's SIZE genuinely never moved — `.pf-field--films`' one auto
       column was sized from content, so a `<video>`'s intrinsic width
       saturated the track, `justify-content` had nothing left to centre, and
       the item fell to the left padding edge 121–141px away at its own
       unchanged size. A rect compared as a silhouette is ADR-069 U1's finding;
       this is the same hole one surface later, so BOTH halves are pinned. */
    const rectIn = (page: Page, sel: string) =>
      page.evaluate((s) => {
        const r = document.querySelector<HTMLElement>(s)?.getBoundingClientRect();
        /* ⚠ RELATIVE TO THE FIELD, NEVER THE VIEWPORT. `.click()` runs a
           `scrollIntoViewIfNeeded` first, so the two reads either side of it
           are not taken at the same scroll offset — measured 181px of pure
           `y` drift on a frame that had not moved inside its panel at all.
           The claim is about where the player sits IN ITS BOX, and that is
           the frame this asserts in. */
        const f = document
          .querySelector<HTMLElement>('[data-pc-index="0"] .pf-field--films')
          ?.getBoundingClientRect();
        return r && f
          ? {
              x: Math.round(r.x - f.x),
              y: Math.round(r.y - f.y),
              w: Math.round(r.width),
              h: Math.round(r.height),
            }
          : null;
      }, sel);
    const filmBox = await rectIn(page, '[data-pc-index="0"] .pf-film__frame');
    await page.locator('[data-pc-index="0"] .pf-film__frame').click();
    const inline = await page.evaluate(() => ({
      mounted: !!document.querySelector('[data-pc-index="0"] video'),
      src: document.querySelector('[data-pc-index="0"] video')?.getAttribute("src") ?? "",
      lightbox: document.querySelectorAll(".fl-lightbox").length,
    }));
    const liveBox = await rectIn(page, '[data-pc-index="0"] video');
    expect(inline.mounted, "the cut mounts a player").toBe(true);
    expect(inline.src, "and it is the 4:5 cut, self-hosted").toMatch(/^\/videos\/.*4x5\.mp4$/);
    expect(inline.lightbox, "and NOT the full-screen takeover").toBe(0);
    expect(liveBox, "the player takes the still's exact box, origin included").toEqual(filmBox);
    /* ⚠ AND IT IS CENTRED IN THE FIELD IN BOTH STATES, which is the claim the
       equality above cannot make on its own: two frames that agree with each
       other can still both sit off-centre — and under the auto track they did,
       the STILL reading 38px left of centre at 1280×720 and 8.6px at 1440×800
       while the equality was the only thing anyone checked. */
    const gaps = await page.evaluate(() => {
      const field = document
        .querySelector<HTMLElement>('[data-pc-index="0"] .pf-field--films')!
        .getBoundingClientRect();
      const frame = document
        .querySelector<HTMLElement>('[data-pc-index="0"] .pf-film__frame')!
        .getBoundingClientRect();
      return { left: frame.left - field.left, right: field.right - frame.right };
    });
    expect(
      Math.abs(gaps.left - gaps.right),
      "the player is centred in its field, not flush to one wall"
    ).toBeLessThan(2);
    /* ⚠ A STATION SWITCH GIVES THE NEXT FILM ITS STILL BACK. The play state
       is keyed on the film's own src, not a boolean — a boolean would carry
       across the swap and start the second film unasked. */
    await page.locator('[data-pc-index="0"] .fl-con__stn').nth(1).click();
    await expect(page.locator('[data-pc-index="0"] video')).toHaveCount(0);

    /* ⚠ THE WALKTHROUGH ACTUALLY OPENS AND ACTUALLY PLAYS (U3, owner: "we
       should have a video walkthrough of all these software"). A control
       that renders and does nothing is the defect this asserts against, and
       three of its properties are load-bearing:
       · it PORTALS to `document.body` — mandatory, because this card lives
         in a `position: sticky` slot and a clipped or transformed ancestor
         becomes the containing block even for `fixed`;
       · the page cannot scroll under it (`overflow: hidden` on `<html>` is
         NOT a scroll lock — the non-passive handlers are, ADR-056 U8);
       · Escape closes it. */
    /* ⚠ RE-SEAT CARD 3 FIRST — its controls are in the FIELD now, under the
       card above. See `seatPinnedFromTop` for why `seatSlot` alone cannot. */
    await seatPinnedFromTop(page, 2);

    await page.locator('[data-pc-index="2"] .pf-watch').click();
    const player = await page.evaluate(() => {
      const lb = document.querySelector<HTMLElement>(".fl-lightbox");
      const v = lb?.querySelector("video");
      return {
        open: !!lb,
        onBody: lb?.parentElement === document.body,
        src: v?.getAttribute("src") ?? "",
        label: lb?.querySelector(".fl-lightbox__label")?.textContent?.trim() ?? "",
      };
    });
    expect(player.open).toBe(true);
    expect(player.onBody, "the lightbox portals out of the sticky slot").toBe(true);
    expect(player.src).toMatch(/^\/videos\/tools\//);
    expect(player.label).toMatch(/Walkthrough/);
    /* ⚠ THE BASELINE IS TAKEN WITH THE PLAYER ALREADY OPEN, never before the
       click: `locator.click()` scrolls its target into view first, so a
       reading from before it is a reading from a different scroll position
       and the lock gets blamed for Playwright's own nudge.
       ⚠ And the wheel goes where the POINTER is — `page.mouse.wheel`
       dispatches at the current position, wherever the last click left it,
       and a wheel outside the dialog is not testing the dialog. */
    await expect(page.locator(".fl-lightbox")).toHaveCount(1);
    const beforeWatch = await page.evaluate(() => Math.round(window.scrollY));
    await page.mouse.move(960, 620);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    expect(
      await page.evaluate(() => Math.round(window.scrollY)),
      "the page is locked while the player is open"
    ).toBe(beforeWatch);
    await page.keyboard.press("Escape");
    await expect(page.locator(".fl-lightbox")).toHaveCount(0);

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
    // ⚠ THREE SINCE THE EYEBROW CAME OUT (owner, 2026-09-10): the title, its
    // paragraph and the call to action. The count is what the writer walks,
    // so a stale number here passes on a page missing a line.
    expect(lit).toHaveLength(3);
    for (const line of lit) {
      expect(line.ghost.length).toBeGreaterThan(0);
      expect(line.live).toBe(line.ghost);
    }
    // ⚠ AND THE OTHER CLIENT IS NOT NAMED ON THIS BEAT (owner, same pass) —
    // the turn is the pitch's hinge, where a reference reads as borrowed
    // credit rather than as an offer.
    expect(lit.map((l) => l.ghost).join(" ")).not.toContain("Loop Earplugs");
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

    /* The end of the runway: the line has un-typed back out, and the ground
       STAYS. ⚠ The ghost's box may not have moved a pixel across the whole
       decode — that is the effect's one promise. */
    const litBoxes = lit.map((l) => l.ghostBox);
    await rollToP(1);
    const gone = await decodeLines();
    for (const line of gone) expect(line.live).toBe("");
    expect(gone.map((l) => l.ghostBox)).toEqual(litBoxes);

    /* ADR-095 U4 — THE CLIENT'S COLOUR TAKES THE PAGE (owner, 2026-09-10:
       "it's important that the gradient doesn't change colour — when you
       enter the Trinny section, that gradient can stay that shader"). U1 ran
       the wash back to parchment here so the proposal met the house ground
       with no edge; the answer to that edge is the proposal carrying the SAME
       field, so the turn's is full at the end of its runway and the proposal
       has a ground of its own. */
    const endWash = await page.evaluate(() =>
      Number(
        getComputedStyle(document.querySelector<HTMLElement>("[data-tl-turn-stage]")!)
          .getPropertyValue("--tl-wash")
          .trim()
      )
    );
    expect(endWash).toBeGreaterThan(0.95);
    await expect(page.locator("#proposition [data-tl-prop-wash]")).toHaveCount(1);

    /* ADR-095 U5 — THE PROPOSAL IS NOT A SLAB, AND ITS ELEMENTS ARRIVE IN
       PLACE (owner, 2026-09-10: "we have a parallax paint flying over it. I
       don't want that … the elements from the next section should just come
       into view").

       An opaque station in normal flow can only ARRIVE by travelling, and
       its content travels with it. So it is PINNED now, TRANSPARENT over the
       live canvas, and its record sits blank until the stage has stopped.
       These three assertions are the mechanism, in order. */
    const propStage = page.locator("#proposition [data-tl-prop-stage]");
    await expect(propStage).toHaveCount(1);

    const propGeom = await page.evaluate(() => {
      const el = document.getElementById("proposition")!;
      const st = el.querySelector<HTMLElement>("[data-tl-prop-stage]")!;
      return {
        docTop: el.getBoundingClientRect().top + window.scrollY,
        height: el.getBoundingClientRect().height,
        pad: st.offsetTop,
        stageH: st.offsetHeight,
        sticky: getComputedStyle(st).position,
      };
    });
    expect(propGeom.sticky).toBe("sticky");
    const travel = Math.max(1, propGeom.height - propGeom.pad - propGeom.stageH);
    /** Roll to `q` — how far into the stage's PINNED stretch, its own clock. */
    const rollToQ = async (q: number) =>
      rollTo(page, Math.round(propGeom.docTop + propGeom.pad + q * travel));

    /* AT THE PIN: the record is blank and the box it will fill is already
       where it will be. ⚠ The head's rule is INSIDE that reveal — with it
       one level down, the coral line painted at full strength across an
       otherwise empty frame. */
    await rollToQ(0);
    const armed = await page.evaluate(() => {
      const head = document.querySelector<HTMLElement>("#proposition .tl-prop__head")!;
      const r = head.getBoundingClientRect();
      return {
        tp: Number(document.getElementById("proposition")!.style.getPropertyValue("--tp-in")),
        headOpacity: Number(getComputedStyle(head).opacity),
        box: { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width) },
      };
    });
    expect(armed.tp).toBe(0);
    expect(armed.headOpacity).toBe(0);

    /* LIT: the record is at full strength — and its BOX HAS NOT MOVED A
       PIXEL. That is the whole claim, and it is the one thing a "does it
       appear?" assertion never makes. */
    await rollToQ(0.8);
    const propLit = await page.evaluate(() => {
      const head = document.querySelector<HTMLElement>("#proposition .tl-prop__head")!;
      const r = head.getBoundingClientRect();
      const live = document.querySelector<HTMLElement>("#proposition [data-tl-decode]");
      const ghost = document.querySelector<HTMLElement>("#proposition .tl-dc__ghost");
      return {
        tp: Number(document.getElementById("proposition")!.style.getPropertyValue("--tp-in")),
        headOpacity: Number(getComputedStyle(head).opacity),
        box: { top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width) },
        live: live?.textContent ?? "",
        ghost: ghost?.textContent ?? "",
        transform: getComputedStyle(head).transform,
      };
    });
    expect(propLit.tp).toBe(1);
    expect(propLit.headOpacity).toBe(1);
    /* ⚠ 2px, NOT EXACT, AND THE TOLERANCE IS NOT A HEDGE. The two samples
       are taken at different scroll positions, so the sticky stage's top
       lands on a different sub-pixel and the rect rounds one either way —
       measured 149 against 148. What this rules out is TRAVEL, which on the
       `data-m` reveal it replaces was 14px and on a rising slab is a whole
       viewport. An exact bound here is the flake generator ADR-088 records. */
    expect(
      Math.abs(propLit.box.top - armed.box.top),
      "the record does not travel"
    ).toBeLessThanOrEqual(2);
    expect(propLit.box.left).toBe(armed.box.left);
    expect(propLit.box.w).toBe(armed.box.w);
    /* ⚠ OPACITY ONLY. A transform here is the move-and-fade reveal coming
       back wearing the new channel's clothes. */
    expect(propLit.transform === "none" || propLit.transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(
      true
    );
    // The title decoded to its ghost's exact string.
    expect(propLit.ghost.length).toBeGreaterThan(0);
    expect(propLit.live).toBe(propLit.ghost);

    /* ⚠ AND THE MARK IS STILL THERE, FADING BEHIND IT (owner: "the brand
       mark in the back doesn't really dominate too much — we can fade it
       out a bit as the next section scrolls into view"). The canvas has to
       live through this beat, so the corridor is STILL ENGAGED here where
       it used to be dead — the kill edge moved to `#contact`. */
    expect(
      await page.evaluate(() => document.documentElement.getAttribute("data-corridor-exit")),
      "the canvas lives through the proposal"
    ).toBe("true");
    expect(await goldMarks(page)).toEqual(["proposition"]);

    /* The proposal: the head, the three bands, the three kickers.
       ⚠ THE GHOST, NOT THE `<h2>`. Since U5 the title is a ghost plus a live
       layer, so the heading's own `textContent` is the string TWICE — which
       is not a defect, it is the decode's markup contract (the ghost holds
       the box and the accessible text; the live leaf is what the writer
       overwrites). Asserting on the heading would fail on the effect being
       present. */
    await expect(page.locator("#proposition .tl-prop__title .tl-dc__ghost")).toHaveText(
      "The Trinny London configuration"
    );
    await expect(page.locator("#proposition .tl-config__band")).toHaveCount(3);
    await expect(page.locator("#proposition .tl-config__kicker")).toHaveCount(3);

    /* ⚠ THE INSTRUMENT PICKS (ADR-094 U7). Three teams on one layer; at
       rest the first is picked and every row of the layer is lit. Picking
       the third swaps the readout to its record and dims the rows that team
       does not read — the transfer made visible, and the one behaviour on
       this station. Asserted from both ends: the picked tile's state AND
       the un-picked tile's, the lit rows AND the dimmed one. */
    const tiles = page.locator("#proposition [data-tl-pick]");
    await expect(tiles).toHaveCount(3);
    await expect(tiles.nth(0)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#proposition [data-tl-layer].is-on")).toHaveCount(4);
    await tiles.nth(2).click();
    await expect(tiles.nth(2)).toHaveAttribute("aria-selected", "true");
    await expect(tiles.nth(0)).toHaveAttribute("aria-selected", "false");
    await expect(page.locator('#proposition [data-tl-cfg="name"]')).toHaveText("Finance");
    await expect(page.locator('#proposition [data-tl-cfg="where"]')).toHaveText(
      await tiles
        .nth(2)
        .getAttribute("data-where")
        .then((v) => v ?? "")
    );
    await expect(page.locator('#proposition [data-tl-layer="examples"]')).not.toHaveClass(/is-on/);
    await expect(page.locator('#proposition [data-tl-layer="rules"]')).toHaveClass(/is-on/);
    // Back to the first, so the stills below read the resting record.
    await tiles.nth(0).click();
    await expect(page.locator("#proposition [data-tl-layer].is-on")).toHaveCount(4);

    /* …and `#contact` is where the corridor finally ends. Exactly one
       station declares it, so JS and CSS cannot name different edges. */
    expect(await page.locator("[data-corridor-kill]").count()).toBe(1);
    await expect(page.locator("#contact[data-corridor-kill]")).toHaveCount(1);
    const contactTop = await page.evaluate(
      () => (document.getElementById("contact")?.getBoundingClientRect().top ?? 0) + window.scrollY
    );
    await rollTo(page, contactTop + 40);
    expect(
      await page.evaluate(() => document.documentElement.getAttribute("data-corridor-exit"))
    ).toBeNull();
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

  test("ADR-095 U6: the entry composition holds its shape, and holds still", async ({ page }) => {
    /* The Thoughtform two-column composition is stated in WORLD units, and a
       perspective camera's lateral screen offset is `x·vh / (2·d·tan(fov/2))`
       — the frame's WIDTH cancels out of the aspect term. Its contents do the
       opposite: the copy block caps at 460 CSS px and the phase labels are
       ~10px type. So the empty middle between them is `spread(vh) − contents`
       and grows without limit as the window gets taller: measured 184px at
       1440×900 and 458px at 1920×1247 before `thoughtformSpread` solved it.

       ⚠ THE ASSERTION IS THE PROPORTION, NOT THE PIXELS. The damp's job is
       that the composition occupies the same FRACTION of any frame, so a
       pixel bound would pass at one viewport and mean nothing at the other —
       which is precisely how the defect survived every existing gate. */
    const readEntry = async () => {
      await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".home-v2-stage");
      await page.waitForTimeout(SETTLE_MS);
      const stageTop = await page.evaluate(() =>
        Math.round(
          (document.querySelector(".home-v2-stage") as Element).getBoundingClientRect().top +
            window.scrollY
        )
      );
      // Two stops, both inside the pan's hold (see `thoughtformPan.start`).
      await rollTo(page, stageTop + 40);
      const a = await page.evaluate(() => {
        const box = (s: string) => {
          const el = document.querySelector(s);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: Math.round(r.left), right: Math.round(r.right) };
        };
        const di = document.getElementById("depthIndicator");
        return {
          progress: di ? parseFloat(di.style.top) / 100 : 1,
          copy: box(".home-v2-copy-block--thoughtform-left"),
          nav: box(".home-v2-copy-phase--navigate"),
          vw: window.innerWidth,
        };
      });
      await rollTo(page, stageTop + 200);
      const b = await page.evaluate(() => {
        const el = document.querySelector(".home-v2-copy-block--thoughtform-left");
        const di = document.getElementById("depthIndicator");
        return {
          progress: di ? parseFloat(di.style.top) / 100 : 1,
          left: el ? Math.round(el.getBoundingClientRect().left) : NaN,
        };
      });
      return { a, b };
    };

    // The authored reference. Every committed snapshot viewport is at or
    // below this height, which is why the damp clamps to 1 here.
    await page.setViewportSize({ width: 1440, height: 900 });
    const ref = await readEntry();
    expect(ref.a.copy).not.toBeNull();
    expect(ref.a.nav).not.toBeNull();
    const refFrac = (ref.a.nav!.left - ref.a.copy!.right) / ref.a.vw;

    // The owner's own monitor — the shape the composition was never authored
    // at, and where the gutter measured 23.9 % of the frame.
    await page.setViewportSize({ width: 1920, height: 1247 });
    const tall = await readEntry();
    const tallFrac = (tall.a.nav!.left - tall.a.copy!.right) / tall.a.vw;

    // Both stops must be inside the hold, or the readings below are of a
    // composition already panning and the test is measuring the wrong thing.
    expect(ref.a.progress).toBeLessThan(0.05);
    expect(tall.a.progress).toBeLessThan(0.05);

    // The proportion holds. 0.05..0.16 is the band the two reference
    // viewports themselves sit in (7.2 % at 1280×720, 12.8 % here).
    expect(refFrac).toBeGreaterThan(0.05);
    expect(refFrac).toBeLessThan(0.16);
    expect(tallFrac).toBeGreaterThan(0.05);
    expect(tallFrac).toBeLessThan(0.16);
    // And the two frames agree with each other, which is the whole claim.
    expect(Math.abs(tallFrac - refFrac)).toBeLessThan(0.06);

    /* ⚠ AND THE PARKED FRAME IS PARKED. `thoughtformPan.start` moved 0 →
       0.05 so the composition is still on arrival and only travels once the
       reader is into the Arc; before that it began sliding on the first
       pixel of scroll. Both stops are inside the hold (asserted above), so
       any lateral travel between them is the defect the owner named. */
    expect(tall.b.progress).toBeLessThan(0.05);
    expect(Math.abs(tall.b.left - tall.a.copy!.left)).toBeLessThanOrEqual(6);
  });

  test("ADR-094 U5: the proposal seats its head on the homepage's datum", async ({ page }) => {
    /* The record is head + drawing in one grid, and centring it seated the
       HEAD by half the drawing's height — measured 306px at 1920×1247, frac
       0.241, against the services masthead's title at 0.107 on the same
       frame. `align-content: start` plus a datum-derived top padding is the
       fix; this is the measurement that says it held. */
    await page.setViewportSize({ width: 1920, height: 1247 });
    await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(SETTLE_MS);

    const geom = await page.evaluate(() => {
      const prop = document.getElementById("proposition") as HTMLElement;
      const stage = prop.querySelector("[data-tl-prop-stage]") as HTMLElement;
      const r = prop.getBoundingClientRect();
      return {
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
        padTop: stage.offsetTop,
        stageH: stage.offsetHeight,
        vh: window.innerHeight,
      };
    });
    const travel = geom.height - geom.padTop - geom.stageH;
    expect(travel).toBeGreaterThan(0);

    /* ⚠ ROLL TWICE. The first long roll from the top is clamped while the
       corridor inflates the document, and a reading taken there is of an
       UNPINNED station — which reports a head frac of 4.1 and looks like a
       catastrophic failure rather than a harness miss. */
    const target = Math.round(geom.top + geom.padTop + 0.7 * travel);
    await rollTo(page, target);
    await rollTo(page, target);

    const seat = await page.evaluate(() => {
      const prop = document.getElementById("proposition") as HTMLElement;
      const head = prop.querySelector(".tl-prop__head") as HTMLElement;
      const inner = prop.querySelector(".tl-prop__inner") as HTMLElement;
      const h = head.getBoundingClientRect();
      const i = inner.getBoundingClientRect();
      return {
        q: parseFloat(prop.getAttribute("data-tl-prop") ?? "0"),
        headFrac: h.top / window.innerHeight,
        innerBottom: i.bottom,
        vh: window.innerHeight,
      };
    });

    // Pinned, and lit — otherwise the seat below is of a travelling stage.
    expect(seat.q).toBeGreaterThan(0.3);
    // The homepage's masthead title sits at 0.107 of the frame.
    expect(seat.headFrac).toBeGreaterThan(0.06);
    expect(seat.headFrac).toBeLessThan(0.15);
    // ⚠ And the record still FITS. `start` can only overrun downward, which
    // is the whole reason it is safer than the `center` it replaced — but
    // safer-to-see is not the same as fitting, so measure it.
    expect(seat.innerBottom).toBeLessThan(seat.vh);
  });

  test("ADR-095 U6: the approach is halved, and exactly one ground paints it", async ({ page }) => {
    /* A sticky stage costs one viewport of scroll-off at its end; with the
       turn's products gone and its line un-typed by then, that viewport was
       an empty stage leaving. `--tl-prop-lead` overlaps the two stations by
       half of it.

       ⚠ WHICH IS ONLY LEGAL BECAUSE THE GROUNDS SWAP. Two coats of the same
       viewport-locked field is a hard horizontal band across the frame — the
       defect the overlap buys unless exactly one ground is painting at every
       scroll position. That is the second half of this test and it is the
       half that can regress silently: the pixels are a wash on a wash, so
       nothing throws and no geometry gate can see it. */
    await page.setViewportSize({ width: 1920, height: 1247 });
    await page.goto("/trinny-london", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(SETTLE_MS);

    const geom = await page.evaluate(() => {
      const box = (id: string) => {
        const r = (document.getElementById(id) as HTMLElement).getBoundingClientRect();
        return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
      };
      return { turn: box("turn"), prop: box("proposition"), vh: window.innerHeight };
    });
    const release = geom.turn.top + geom.turn.height - geom.vh;
    const approach = geom.prop.top - release;

    // Half a viewport, not a whole one. The band is wide enough to survive a
    // runway retune and narrow enough to fail if the lead is dropped.
    expect(approach / geom.vh).toBeGreaterThan(0.35);
    expect(approach / geom.vh).toBeLessThan(0.65);

    for (const at of [-1.0, -0.6, -0.25, -0.02, 0.02, 0.2, 0.45, 0.7]) {
      const y = Math.round(release + at * geom.vh);
      await rollTo(page, y);
      await rollTo(page, y);
      const paint = await page.evaluate(() => {
        const seen = (sel: string) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const op = parseFloat(getComputedStyle(el).opacity || "1");
          const top = Math.max(0, r.top);
          const bottom = Math.min(window.innerHeight, r.bottom);
          return { op, top, bottom, covers: Math.max(0, bottom - top) };
        };
        return {
          turn: seen(".tl-turn__wash"),
          prop: seen(".tl-prop__ground"),
          handoff: document.getElementById("turn")?.getAttribute("data-tl-handoff") ?? null,
        };
      });
      const t = paint.turn;
      const p = paint.prop;
      expect(t).not.toBeNull();
      expect(p).not.toBeNull();
      // The overlap of the two grounds INSIDE the frame, counting only a
      // ground that is actually painting.
      const tLive = t!.op > 0.01 ? t! : null;
      const pLive = p!.op > 0.01 ? p! : null;
      const overlap =
        tLive && pLive
          ? Math.max(0, Math.min(tLive.bottom, pLive.bottom) - Math.max(tLive.top, pLive.top))
          : 0;
      expect(
        overlap,
        `two grounds painting ${overlap}px of the frame at release${at >= 0 ? "+" : ""}${at}vh ` +
          `(handoff=${paint.handoff}, turn op ${t!.op}, prop op ${p!.op})`
      ).toBeLessThanOrEqual(4);
      // ⚠ And the frame is never BARE either. A swap that hides both is the
      // same bug with the sign flipped, and it looks like the wash simply
      // vanishing at the seam.
      expect(
        Math.max(tLive?.covers ?? 0, pLive?.covers ?? 0),
        `no ground covers the frame at release${at >= 0 ? "+" : ""}${at}vh`
      ).toBeGreaterThan(geom.vh * 0.9);
    }
  });
});
