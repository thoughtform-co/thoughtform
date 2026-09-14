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
/** Mirrors `SEAM_DETACH_END` — the frame the two copies un-hide on. */
const SEAM_DETACH_AT = 0.25;

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

/** Roll to `q` — how far `#proposition` has ARRIVED, its own clock (ADR-099).
 *  ⚠ Solved for the published clock, never a pixel count: the station starts
 *  half a viewport above the turn's end, and where that lands moves with the
 *  document the corridor inflates. */
async function rollToQ(page: Page, q: number) {
  const box = await page.evaluate(() => {
    const el = document.getElementById("proposition")!;
    return { docTop: el.getBoundingClientRect().top + window.scrollY, vh: window.innerHeight };
  });
  await rollTo(page, Math.round(box.docTop - (1 - q) * box.vh));
}

/** Roll to `t` — the seam clock the phases' strike and the carriers hang on
 *  (ADR-101).
 *
 *  ⚠ TWO LOOPS, AND THE SPLIT IS NOT TIDINESS. `#offer`'s beats are a lazy
 *  nested root, so the first entry into this band grows the document by several
 *  viewports; walking in has to be allowed to take as many passes as it needs
 *  WITHOUT spending the convergence budget.
 *
 *  ⚠ AND IT CONVERGES ON THE BEAT'S OWN RECT, NOT ON THE PUBLISHED CLOCK.
 *  `seamProgress` CLAMPS, so every scroll position above `#phases` reads 0.00 —
 *  a `t = 0` target therefore "arrives" two viewports short, with the record
 *  behind it still waiting to strike and every assertion downstream reading a
 *  page that is nowhere near where it was asked for. A clamped clock is not a
 *  convergence target at its own floor.
 */
async function rollToT(page: Page, t: number) {
  for (let pass = 0; pass < 6; pass++) {
    if (await page.evaluate(() => !!document.getElementById("phases"))) break;
    const offerTop = await page.evaluate(
      () =>
        (document.getElementById("offer") as HTMLElement).getBoundingClientRect().top +
        window.scrollY
    );
    await rollTo(page, Math.round(offerTop));
  }
  for (let pass = 0; pass < 5; pass++) {
    const box = await page.evaluate(() => {
      const ph = document.getElementById("phases");
      if (!ph) return null;
      const row = ph.querySelector<HTMLElement>(".arc-groups--plates");
      const pr = ph.getBoundingClientRect();
      const s1 = row
        ? Math.max(0, window.innerHeight - (row.getBoundingClientRect().bottom - pr.top))
        : 0;
      return { docTop: pr.top + window.scrollY, vh: window.innerHeight, s1 };
    });
    if (!box) return;
    const want = box.vh - t * (box.vh - box.s1);
    await rollTo(page, Math.round(box.docTop - want));
    const now = await page.evaluate(
      () => (document.getElementById("phases") as HTMLElement).getBoundingClientRect().top
    );
    if (Math.abs(now - want) <= 4) break;
  }
}

/**
 * Let every animation under `sel` finish.
 *
 * ⚠ A STRIKE'S LENGTH IS A LADDER, NOT A DURATION. The ledger's last rung is
 * 960ms behind 640ms of delay, so a fixed wait is either a flake or slower
 * than it needs to be on every other assertion. `getAnimations().finished`
 * asks the animations themselves; the `catch` is load-bearing, because an
 * animation cancelled mid-flight (the stamp changing under it) REJECTS.
 */
async function settleStrike(page: Page, sel: string) {
  await page.evaluate(async (q: string) => {
    const root = document.querySelector(q);
    if (!root) return;
    const running = [root, ...root.querySelectorAll("*")].flatMap((el) =>
      typeof el.getAnimations === "function" ? el.getAnimations() : []
    );
    await Promise.all(running.map((a) => a.finished.catch(() => {})));
  }, sel);
  await page.waitForTimeout(120);
}

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
 * ⚠ THE RAIL IS IN THE FIELD AGAIN (ADR-097 U7, retiring U6's band seat), and
 * since U10 the field is a TERMINAL OF FRAMES — the rail, a closed evidence
 * frame on every kind, an optional foot frame — so `housing` reads the frame,
 * the gap and the foot as well. Every element is read from the SLOT: read it
 * from one container and this reports four railless cards while staying green
 * on a rail that had merely moved.
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
        /* U10 — the terminal of frames: the evidence frame on EVERY kind, the
           field's gap, the foot slot and what it holds. */
        const frameEl = slot.querySelector<HTMLElement>(
          ".fl-con__console, .pf-field--tools, .pf-field--films"
        );
        const frame = frameEl?.getBoundingClientRect() ?? null;
        const fc = frameEl ? getComputedStyle(frameEl) : null;
        const footEl = slot.querySelector<HTMLElement>(".pf-card__foot");
        const verdict = r(".fl-verdict");
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
          watch: watch
            ? {
                left: watch.left,
                right: watch.right,
                top: watch.top,
                bottom: watch.bottom,
                h: watch.height,
              }
            : null,
          lastClaimBottom: last?.bottom ?? null,
          frame: frame
            ? { left: frame.left, right: frame.right, top: frame.top, bottom: frame.bottom }
            : null,
          frameClosed:
            !!fc &&
            [
              fc.borderTopWidth,
              fc.borderRightWidth,
              fc.borderBottomWidth,
              fc.borderLeftWidth,
            ].every((w) => w === "1px"),
          gap: Number.parseFloat(getComputedStyle(field).rowGap),
          footShown: !!footEl && getComputedStyle(footEl).display !== "none",
          verdictInFoot: !!slot.querySelector(".pf-card__foot > .fl-verdict"),
          watchInFoot: !!slot.querySelector(".pf-card__foot > .pf-watch"),
          verdict: verdict ? { top: verdict.top, bottom: verdict.bottom } : null,
          bayHeads: slot.querySelectorAll(".pf-bay__head").length,
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

    await page.goto("/arcs/trinny-london/proposal?theme=dark", { waitUntil: "domcontentloaded" });
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
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex.*nofollow/
    );
    // A sitemap that lists a noindexed URL advertises a page it then tells
    // crawlers to drop (app/sitemap.ts's own rule).
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/arcs/trinny-london/proposal");
  });

  test("ADR-053 recipe: the station order, and no anchor to a station it removed", async ({
    page,
  }) => {
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");

    const order = await page.evaluate(() =>
      [...document.querySelectorAll("section[id]")].map((s) => s.id)
    );
    // The parse-level order (ADR-094 added the proposal after the proof,
    // ADR-095 the turn before it — and ADR-095 U1 deleted the interstitial
    // slab between them; the cards inside #services are `article`s; ADR-094
    // U9 appended the offer between the proposal and the exit).
    const stations = ["hero", "about", "services", "turn", "proposition", "offer", "contact"];
    expect(order.filter((id) => stations.includes(id))).toEqual(stations);
    await expect(page.locator("#home-corridor-mount")).toHaveCount(1);

    // The nav items are a prop on this route (ADR-093): production's list is
    // hardcoded in React, so the parse-time link cleanup cannot reach it and
    // this page would ship two dead anchors in a drawer counting four.
    const links = await page.locator(".hud__nav__inline__link").allTextContents();
    expect(links).toEqual(["About", "Proof", "Proposal", "The offer"]);
    await expect(page.locator(".hud__nav__list__head span").last()).toHaveText("04");
    for (const dead of ["#voidwalker", "#practice", "#continuum"]) {
      await expect(page.locator(`a[href="${dead}"]`)).toHaveCount(0);
    }
  });

  test("ADR-093: the journey rail runs on THIS page's order", async ({ page }) => {
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
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
    // Six since ADR-094 U9: the offer is a station and the rail counts
    // stations, even though the Proposal MARK ranges over it.
    await expect(sector).toHaveText(/^0[1-6]\/06$/);

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
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
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
      /* ⚠ THE RAIL KEEPS THE FIELD'S INSET, WHICH IS ADR-094 U8's ≥15px BACK
         IN FORCE (ADR-097 U8, owner: "the length of the tabs should be the
         same as the right panel where the image and text lives"). U4 ran it
         full-bleed to the divider and the card's edge; U6 relaxed this pair to
         an inequality for the band seat; with the rail back in the field and
         the divider REMOVED, the edge worth sharing is the frame's — and the
         frame sits on `--pf-field-px`, like every drawing in the panel. So the
         floor is the token's again rather than a sign check.
         ⚠ DIVIDED BY THE CARD'S SCALE: cards 1–3 are covered here and receded
         by depth. The token is a layout length; the rect is a picture of it. */
      if (c.housing.firstStnLeft !== null) {
        expect(
          (c.housing.firstStnLeft - c.housing.divider) / c.housing.k,
          `card ${i + 1} rail inset L`
        ).toBeGreaterThanOrEqual(15);
        expect(
          (c.housing.cardRight - c.housing.lastStnRight!) / c.housing.k,
          `card ${i + 1} rail inset R`
        ).toBeGreaterThanOrEqual(15);
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
    /* ⚠ THE FILM IS FRAMED LIKE EVERY OTHER KIND (ADR-097 U10, owner: "it's
       like uniformizing and harmonizing all the cards"). It was the one
       unframed field; now its closed box ends on the record's last rule
       itself, because a film has no foot. */
    expect(shapes[0].housing.frameClosed, "the film is not framed (U10)").toBe(true);
    expect(shapes[0].housing.footShown, "a film has no foot frame").toBe(false);
    expect(
      Math.abs(shapes[0].housing.frame!.bottom - shapes[0].housing.lastClaimBottom!),
      "the film's frame does not end on the record's last rule"
    ).toBeLessThanOrEqual(2);
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
    /* ⚠ THE VERDICT IS THE PANEL'S FOOT FRAME (ADR-097 U10, owner: it "needs
       to be a separate frame, a bit higher … a horizontal divider so it
       really feels like a separate frame/block"). Portalled by the plate into
       the card's foot slot (`verdictHost`, the rail's seam), one gap under
       the closed frame, its bottom on the record's last rule. A COUNT of one
       was all this surface had on the verdict; its SEAT is pinned now. Every
       delta ÷ k — this card is read covered and receded. */
    const h2 = shapes[1].housing;
    expect(h2.frameClosed, "the ads' frame is not a closed box (U10)").toBe(true);
    expect(h2.verdictInFoot, "the verdict is not the panel's foot frame").toBe(true);
    expect(
      Math.abs((h2.verdict!.top - h2.frame!.bottom) / h2.k - h2.gap),
      "the verdict is not one gap under the frame"
    ).toBeLessThanOrEqual(1.5);
    expect(
      Math.abs(h2.verdict!.bottom - h2.lastClaimBottom!),
      "the verdict does not end on the record's last rule"
    ).toBeLessThanOrEqual(2);

    /* ⚠ AND THE RED LINE IS A BLOCK WITH A NAMED CENTRE (ADR-084 U2, owner:
       the four bands are "not really clear what they're related to"). This
       host had no `.fl-cap` assertion at all, and it is the SMALLEST field
       the sheet renders in — 579 × 215 at 1280×720, where a quadrant is
       108px against 88 of ink. So the ink is measured against the cell in
       BOTH directions: a centred box that outgrows its cell spills through
       the TOP as well, where `scrollHeight` never reports it. */
    const red = await page.evaluate(async () => {
      const card = document.querySelector('[data-pc-index="1"]');
      const stn = [...(card?.querySelectorAll(".fl-con__stn") ?? [])].find((b) =>
        /RED LINE/i.test(b.textContent ?? "")
      ) as HTMLElement | undefined;
      if (!card || !stn) return null;
      stn.click();
      await new Promise((r) => setTimeout(r, 500));
      const ul = card.querySelector(".fl-caps--sheet");
      const hub = card.querySelector(".fl-caps-block__hub");
      if (!ul || !hub) return { caps: card.querySelectorAll(".fl-cap").length };
      const u = ul.getBoundingClientRect();
      const b = hub.getBoundingClientRect();
      return {
        caps: card.querySelectorAll(".fl-cap").length,
        tags: card.querySelectorAll(".fl-cap__tag").length,
        hub: hub.textContent,
        dx: Math.abs(b.x + b.width / 2 - (u.x + u.width / 2)),
        dy: Math.abs(b.y + b.height / 2 - (u.y + u.height / 2)),
        spills: [...card.querySelectorAll(".fl-cap")].flatMap((c) => {
          const cb = c.getBoundingClientRect();
          const kids = [...c.children].map((k) => k.getBoundingClientRect());
          const d = c.querySelector(".fl-cap__d") as HTMLElement;
          const over = [
            cb.top - kids[0].top,
            kids[kids.length - 1].bottom - cb.bottom,
            d.scrollHeight - d.clientHeight,
          ];
          return over.some((v) => v > 0.5) ? [`${c.textContent?.slice(0, 24)}: ${over}`] : [];
        }),
      };
    });
    expect(red?.caps, "THE RED LINE's four quadrants").toBe(4);
    expect(red?.tags, "and their four risk designations").toBe(4);
    expect(red?.hub, "the charge letters at the crossing").toBe("NO AI UGC");
    expect(red?.dx ?? 9, "the hub is on the crossing, x").toBeLessThanOrEqual(1);
    expect(red?.dy ?? 9, "the hub is on the crossing, y").toBeLessThanOrEqual(1);
    expect(red?.spills, "a quadrant's ink outside its cell").toEqual([]);

    // 03 the tools — ONE drawing at a time, its walkthrough as the panel's foot.
    expect(shapes[2].stations).toHaveLength(4);
    expect(shapes[2].wires).toBe(1);
    expect(shapes[2].watchBars).toBe(1);
    /* ⚠ ADR-097 U10 — THE PANEL IS A TERMINAL OF FRAMES (owner, beside the
       Cyberpunk panels and Starfield's TRAVEL DATA: "in that terminal
       interface you have different frames … the tabs don't need to have a
       border connected to them"; "Watch Walkthrough … a bigger button like
       the Starfield one … aligned horizontally with the bottom divider of the
       left panel"). ADR-094 U8's apparatus is cut to the drawing: the box is
       a CLOSED frame, its head line is deleted, and the watch bar is a
       separate FOOT frame one gap under it — a button, not a bar. Pinned as
       RELATIONS, every delta ÷ k (this card is read covered and receded):
       the button is one gap under the box, spans it, is ≥44px tall, and its
       bottom is the record's last rule — ADR-094 U8's one floor, back, after
       U9 had let the two floors drift `--pf-card-py` apart. */
    const h3 = shapes[2].housing;
    expect(h3.box, "the tools field draws its box").not.toBeNull();
    expect(h3.frameClosed, "the tools box is not a closed frame (U10)").toBe(true);
    expect(h3.bayHeads, "the apparatus head came back — U10 deleted it").toBe(0);
    expect(
      h3.wireLeft! - h3.box!.left,
      "the drawing clears the box's left wall"
    ).toBeGreaterThanOrEqual(12);
    expect(h3.watchInFoot, "the button is not the panel's foot frame").toBe(true);
    expect(
      Math.abs((h3.watch!.top - h3.box!.bottom) / h3.k - h3.gap),
      "the button is fused to the box — it is the panel's foot frame, one gap under it"
    ).toBeLessThanOrEqual(1.5);
    expect(
      Math.abs(h3.watch!.left - h3.box!.left),
      "the button spans the frame (L)"
    ).toBeLessThanOrEqual(1.5);
    expect(
      Math.abs(h3.watch!.right - h3.box!.right),
      "the button spans the frame (R)"
    ).toBeLessThanOrEqual(1.5);
    expect(h3.watch!.h / h3.k, "a rule with a label, not a button").toBeGreaterThanOrEqual(44);
    expect(
      Math.abs(h3.watch!.bottom - h3.lastClaimBottom!),
      "the panel's last frame does not end on the record's last rule (ADR-094 U8's floor, back at U10)"
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
    // The map's console is the fourth closed frame, and it has no foot (U10).
    expect(shapes[3].housing.frameClosed, "the map's console is not a closed frame (U10)").toBe(
      true
    );
    expect(shapes[3].housing.footShown, "the map has no foot frame").toBe(false);
    expect(
      Math.abs(shapes[3].housing.frame!.bottom - shapes[3].housing.lastClaimBottom!),
      "the map's frame does not end on the record's last rule"
    ).toBeLessThanOrEqual(2);

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

    /* ADR-099 — THE CONFIGURATION SCROLLS IN, AND THE BARE FRAME IS GONE
       (owner, 2026-09-13: "there's a brief moment where a blank section or
       a leftover section briefly appears. That shouldn't happen" — and,
       for the same beat, "as you move away… the elements from the next
       section should scroll into view").

       ADR-095 U5 pinned this station and powered its record on in place,
       which solved a slab sliding over the turn and bought a worse thing: a
       pin cannot begin until the beat above it has ended, so the reader
       crossed a viewport of emptied stage before anything arrived. The
       record is an arc beat now and the two stations overlap.

       THE OVERLAP IS THE ASSERTION, and it is measured on the two clocks at
       once: at the frame the turn is spent, the proposal must ALREADY be
       half-arrived and its head must ALREADY be on screen. */
    const seam = await page.evaluate(() => {
      const turn = document.getElementById("turn")!;
      const prop = document.getElementById("proposition")!;
      return {
        pTurn: Number(turn.getAttribute("data-tl-turn") ?? "0"),
        q: Number(prop.getAttribute("data-tl-prop") ?? "0"),
        propTop: Math.round(prop.getBoundingClientRect().top),
        vh: window.innerHeight,
      };
    });
    expect(seam.pTurn, "the turn is spent at this stop").toBeGreaterThan(0.98);
    expect(seam.q, "the proposal is already arriving as the turn ends").toBeGreaterThan(0.35);
    expect(seam.propTop, "its top is already inside the frame").toBeLessThan(seam.vh);

    /* ⚠ AND THE PIN IS GONE, BOTH HALVES. A stage left behind would pin `q`
       at 0 with the writer no longer reading it; a `--tp-in` left behind
       would be a reveal channel nothing drives, which latches the record
       invisible on exactly the paths that cannot un-hide it. */
    await expect(page.locator("#proposition [data-tl-prop-stage]")).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        document.getElementById("proposition")!.style.getPropertyValue("--tp-in")
      )
    ).toBe("");

    /* THE RECORD IS THE ARCS' OWN BEAT NOW (ADR-099), AND SINCE ADR-100 IT
       IS THE BOARD: two svg boards in one row under an `.arc-head`, which
       is what gives it the cross, the eyebrow and the datum every other
       beat on this page has. The framed panel it replaced is gone with its
       picker — nothing on this beat is pressable. */
    await rollToQ(page, 1);
    await rollToQ(page, 1);
    const board = page.locator("#proposition .arc-board");
    await expect(board).toHaveCount(1);
    await expect(page.locator("#proposition .arc-cfg, #proposition [data-cfg-pick]")).toHaveCount(
      0
    );
    await expect(page.locator("#proposition .arc-head")).toHaveCount(1);
    await expect(page.locator("#proposition .arc-head").first()).toHaveClass(/is-in/);
    /* ⚠ THE CROSS AND NO CORAL RULE (owner: "all sections should have that
       cross in the left corner above the H1… the configuration one also has
       some weird red divider. We need to remove that"). The mark is the arc
       head's own origin cross; the rule left with `.tl-prop__head`. */
    await expect(page.locator("#proposition .arc-head__mark--origin")).toHaveCount(1);
    await expect(page.locator("#proposition .tl-prop__head")).toHaveCount(0);

    /* ⚠ ONE RECORD, TWO KINDS OF DRAWING (ADR-100 U2). The dormant side is
       a LEDGER — four ruled rows, no housing, no cable, nothing gold and
       nothing green — and the lit side is the BOARD: one gold-washed chip,
       a green seat, three lanes. The contrast the owner asked for is the
       kind of object, so what this asserts is that the left draws NO
       module at all, not that its modules are dimmer. Read off the COMPUTED
       paint — the tokens are aliases of the ramp and light re-derives them,
       so this is the drawing's own claim rather than its class names — and
       read after the ladder has landed, because every lit object rests at
       opacity 0 until it does. */
    await expect(board).toHaveClass(/is-in/);
    await page.waitForTimeout(1200);
    await expect(page.locator('#proposition .arc-board svg[role="img"]')).toHaveCount(2);
    const roles = await page.evaluate(() => {
      const rgb = (v: string) => {
        const p = document.createElement("i");
        p.style.color = v;
        document.body.append(p);
        const c = getComputedStyle(p).color;
        p.remove();
        return c;
      };
      const root = document.querySelector("#proposition .arc-board") as HTMLElement;
      const cs = getComputedStyle(root);
      const goldRgb = cs.getPropertyValue("--gold-rgb").trim();
      const green = rgb(cs.getPropertyValue("--arc-board-green"));
      const read = (mode: string) => {
        const svg = document.querySelector(`[data-board-state="${mode}"] svg`)!;
        const fills = [...svg.querySelectorAll("path, rect")].map((e) => getComputedStyle(e).fill);
        const wash = svg.querySelector('[data-board-role="card"] .arc-board__wash');
        const seat = svg.querySelector('[data-board-role="seat"] .arc-board__outline');
        return {
          goldFills: fills.filter((f) => f.includes(goldRgb)).length,
          cardGold: wash ? getComputedStyle(wash).fill.includes(goldRgb) : false,
          seat: seat ? getComputedStyle(seat).stroke : null,
          modules: svg.querySelectorAll(".arc-board__module").length,
          rows: svg.querySelectorAll(".arc-board__row").length,
          marks: svg.querySelectorAll(".arc-board__mark").length,
          wires: svg.querySelectorAll(".arc-board__wire").length,
        };
      };
      return { green, today: read("today"), configured: read("configured") };
    });
    expect(roles.today.modules, "the dormant side is a ledger, not a board").toBe(0);
    expect(roles.today.rows, "five ruled rows, one per fact").toBe(5);
    expect(roles.today.goldFills, "the ledger lights nothing gold").toBe(0);
    expect(roles.today.wires, "the ledger is unwired").toBe(0);
    expect(roles.today.seat, "nothing is housed on the ledger").toBeNull();
    expect(roles.configured.rows, "the lit side draws no ledger row").toBe(0);
    expect(roles.configured.cardGold, "the chip is the gold fill").toBe(true);
    expect(roles.configured.seat, "the seat is green: the human, and nothing else").toBe(
      roles.green
    );
    // ⚠ NO DIAMONDS ANYWHERE (U2, owner: "remove the square diamond icon
    // above The Studio") — the chip's wash is what marks the built thing.
    expect(roles.today.marks + roles.configured.marks, "a mark came back").toBe(0);
    /* FOUR lanes, eight wires each: the seat's green drop IN and the gold run
       OUT of the chip's floor (U4's cross), plus the context's and the
       tools' runs across (ADR-100 U1 took the two socket drops with the
       sockets). */
    expect(roles.configured.wires, "the ribbons").toBe(32);

    /* ⚠ BOTH ARRIVAL LADDERS ARE LIVE, AND THE LEDGER'S IS THE SLOWER
       (U2, owner 2026-09-14: "the elements from the studio today should move
       a bit slower into view"). A delay that does not apply fails SILENTLY —
       nothing errors and the still is identical — and the lit board shipped
       that way for a day: its rungs are two classes and an attribute against
       the four-class `animation:` shorthand that starts them, so the
       shorthand won and RESET every delay to zero. Both sides are asserted
       from both ends: each ladder is strictly increasing (so no rung is
       dead) and the dormant rungs are slower AND longer than the lit ones
       (so the contrast the owner asked for cannot be tuned away).
       ⚠ AND IT IS READ IN DOM ORDER, NOT SORTED BY DELAY (U4). Sorted, this
       walk cannot see a ladder whose rungs are in the wrong ORDER — which
       is what U3 shipped: the ledger's delays were applied in the LIT
       board's role order, so the rows arrived 1-3-2-4 while every
       assertion here passed. A ledger read out of order is a list that
       flickered. */
    const ladders = await page.evaluate(() => {
      const secs = (v: string) => parseFloat(v) * (v.trim().endsWith("ms") ? 0.001 : 1);
      const read = (mode: string) =>
        [...document.querySelectorAll(`[data-board-state="${mode}"] [data-board-role]`)].map(
          (m) => {
            const cs = getComputedStyle(m as HTMLElement);
            return {
              role: m.getAttribute("data-board-role") ?? "",
              d: secs(cs.animationDelay),
              t: secs(cs.animationDuration),
            };
          }
        );
      return { today: read("today"), lit: read("configured") };
    });
    /* The ledger is read in the order it is DRAWN; the board assembles from
       its chip outward, so only its rungs may be sorted. */
    expect(
      ladders.today.map((r) => r.role),
      "the ledger's rows, in reading order"
    ).toEqual(["seat", "layer", "card", "tools", "reach"]);
    for (const [name, rungs] of [
      ["the ledger", ladders.today],
      ["the board", [...ladders.lit].sort((a, b) => a.d - b.d)],
    ] as const) {
      expect(rungs.length, `${name} has five objects`).toBe(5);
      for (let i = 1; i < rungs.length; i++) {
        expect(rungs[i].d, `${name}'s ladder is dead or out of order at rung ${i}`).toBeGreaterThan(
          rungs[i - 1].d
        );
      }
    }
    const lastOf = (r: { d: number; t: number }[]) => r[r.length - 1];
    expect(
      lastOf(ladders.today).d,
      "the ledger's last row waits longer than the board's last module"
    ).toBeGreaterThan(Math.max(...ladders.lit.map((r) => r.d)));
    expect(
      ladders.today[0].t,
      "and each ledger row takes longer to arrive than a lit module"
    ).toBeGreaterThan(ladders.lit[0].t);

    /* ⚠ AND THE MARK IS STILL THERE, FADING BEHIND IT (owner: "the brand
       mark in the back doesn't really dominate too much"). The canvas has to
       live through this beat, so the corridor is STILL ENGAGED here — the
       kill edge is `#offer`, the first opaque station below. */
    expect(
      await page.evaluate(() => document.documentElement.getAttribute("data-corridor-exit")),
      "the canvas lives through the proposal"
    ).toBe("true");
    expect(await goldMarks(page)).toEqual(["proposition"]);

    /* …and `#offer` is where the corridor finally ends (ADR-094 U9): the
       proposal's beats after the configuration, the first opaque station
       below it. Exactly one station declares it, so JS and CSS cannot name
       different edges. */
    expect(await page.locator("[data-corridor-kill]").count()).toBe(1);
    await expect(page.locator("#offer[data-corridor-kill]")).toHaveCount(1);
    await expect(page.locator("#contact[data-corridor-kill]")).toHaveCount(0);

    /* THE OFFER (ADR-094 U9): the proposal's beats after the configuration,
       the arcs' own components mounted into `#offer` over a route-local
       record. Two of its drawings are what this pass exists for — the three
       phases as PLATES and the fee as a LEDGER — so both are pinned here at
       the lit state, and the Proposal mark stays gold across them (the mark
       ranges over the two stations). ⚠ Rolled to TWICE: the reveal is an
       IntersectionObserver with a -10% dead band, and one roll out of the
       proposal's pinned stretch can land the beat before it has fired. */
    const topOf = (id: string) =>
      page.evaluate(
        (sel) => (document.getElementById(sel)?.getBoundingClientRect().top ?? 0) + window.scrollY,
        id
      );
    await rollTo(page, await topOf("phases"));
    await rollTo(page, await topOf("phases"));
    await expect(page.locator("#offer .arc-root")).toHaveCount(1);
    await expect(page.locator("#phases .arc-plate")).toHaveCount(3);
    await expect(page.locator("#phases .arc-plate__foot")).toHaveCount(3);
    await expect(page.locator("#phases .arc-plate").first()).toHaveClass(/is-in/);
    expect(await goldMarks(page)).toEqual(["proposition"]);

    /* ⚠ AND THE PLATE IS CUT — TOP-RIGHT, AND ONLY TOP-RIGHT (ADR-098 U3,
       owner: the cards "should have the notch", then "I don't think we need
       a notch in the bottom-left corner … it is too close to the text").
       A clip CUTS a border and never strokes one, so the edge is a
       two-contour RING — and the border has to be gone, or the plate is
       outlined on five sides and open on one.
       ⚠ THE CORNER IS PINNED FROM BOTH ENDS (ADR-065 U4/U5's own finding:
       a one-sided assertion verifies that a cut exists, never that it is on
       the right corner) — AND IT IS HIT-TESTED, NOT PARSED. The computed
       `clip-path` keeps its percentages and its `calc()`s
       (`polygon(0px 0px, calc(100% - 26px) 0px, 100% 26px, 100% 100%, 0px
       100%)`), so reading it for pixel pairs measures the SERIALISATION and
       finds one point in five. `elementFromPoint` asks the browser what it
       actually painted: a clipped corner does not answer. */
    const corners = await page.evaluate(() => {
      const el = document.querySelector("#phases .arc-plate") as HTMLElement;
      el.scrollIntoView({ block: "center" });
      const r = el.getBoundingClientRect();
      /* Inside the chamfer's own triangle: a point `d` in from BOTH edges of
         a corner is clipped exactly when `2d < ch`, so 0.35 of the cut is
         inside a notch and painted on a square corner.
         ⚠ A CUSTOM PROPERTY IS A STRING UNTIL SOMETHING LAYS IT OUT —
         `getPropertyValue` hands back `clamp(16px, 1.8vw, 26px)` and
         `parseFloat` returns 16, or NaN on a `calc()`. The probe inherits
         the token from the plate and reports the resolved pixel. */
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;left:0;top:0;height:1px;width:var(--arc-plate-ch)";
      el.appendChild(probe);
      const ch = probe.getBoundingClientRect().width;
      probe.remove();
      const d = Math.max(4, ch * 0.35);
      const at = (x: number, y: number) =>
        !!(document.elementFromPoint(x, y) as HTMLElement | null)?.closest("#phases .arc-plate");
      return {
        ch,
        tl: at(r.left + d, r.top + d),
        tr: at(r.right - d, r.top + d),
        bl: at(r.left + d, r.bottom - d),
        br: at(r.right - d, r.bottom - d),
        pts: getComputedStyle(el)
          .clipPath.replace(/^polygon\(/, "")
          .replace(/\)$/, "")
          .split(","),
      };
    });
    expect(corners.ch, "the cut is at the plate rung").toBeGreaterThan(8);
    expect(corners.tr, "the notch is TOP-RIGHT").toBe(false);
    expect(corners.bl, "the BOTTOM-LEFT corner is square: the foot's text needs it").toBe(true);
    expect(corners.tl, "the top-left is square").toBe(true);
    expect(corners.br, "the bottom-right is square").toBe(true);
    expect(corners.pts.length, "one notch means five points, not six").toBe(5);
    expect(corners.pts[4].trim(), "the silhouette closes on the box's own corner").toBe("0px 100%");

    await rollTo(page, await topOf("pricing"));
    await rollTo(page, await topOf("pricing"));
    await expect(page.locator("#pricing .arc-ledger__table")).toHaveCount(1);
    await expect(page.locator("#pricing .arc-ledger__total .arc-ledger__fee")).toHaveText(
      /£45,000/
    );
    await expect(page.locator("#pricing .arc-ledger__tip")).toHaveCount(3);
    /* ⚠ THE HEAD AND THE FOOT ARE ONE MATERIAL, AND IT IS THE CHIP'S
       (ADR-101 §B, owner 2026-09-14: the plates' foot had "a black sort of
       fill. I don't think we have that in the AI capability cards, so we use
       the soft yellow fill"). This REPLACES ADR-098 U2's inverse-band
       assertion, and it is asserted as a COMPOSITE rather than as two
       declarations: the head paints its wash as a `background-image` layer
       and the foot as a `background-color`, so comparing the declarations
       reads two different strings for one colour. What matters is the pixel.
       ⚠ AND THE CONTRAST IS MEASURED ON THAT COMPOSITE, in light, because
       `--gold-ink` on a gold wash is the one rung on this plate that could
       fall under the floor (measured 4.81:1 on the foot's label, 5.2 on the
       head's kicker; `--gold` itself would be ~1.7 and may never letter). */
    const plate = await page.evaluate(() => {
      const num = (v: string) => (v.match(/[\d.]+/g) ?? []).map(Number);
      const over = (fg: number[], bg: number[]) => {
        const a = fg[3] ?? 1;
        return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
      };
      const lin = (c: number) => {
        const x = c / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      };
      const L = ([r, g, b]: number[]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (a: number[], b: number[]) => {
        const hi = Math.max(L(a), L(b));
        const lo = Math.min(L(a), L(b));
        return (hi + 0.05) / (lo + 0.05);
      };
      /* Composite down to the first OPAQUE ancestor, then re-apply this
         element's own wash — a `background-image` never shows in
         `backgroundColor`, so a naive walk measures the plate under it. */
      const bedOf = (el: Element) => {
        const chain: number[][] = [];
        let n: Element | null = el;
        while (n) {
          const c = num(getComputedStyle(n).backgroundColor);
          if (c.length >= 3) chain.push(c);
          if (c.length >= 3 && (c[3] ?? 1) >= 0.85) break;
          n = n.parentElement;
        }
        let bg = chain.length ? chain[chain.length - 1].slice(0, 3) : [255, 255, 255];
        for (let i = chain.length - 2; i >= 0; i--) bg = over(chain[i], bg);
        const img = getComputedStyle(el).backgroundImage;
        const wash = img.match(/rgba?\(([\d.,\s]+)\)/);
        return wash ? over(num(wash[1]), bg) : bg;
      };
      const on = (el: Element) => {
        const bg = bedOf(el.parentElement!);
        return +ratio(over(num(getComputedStyle(el).color), bg), bg).toFixed(2);
      };
      const foot = document.querySelector("#phases .arc-plate__foot")!;
      const head = document.querySelector("#phases .arc-plate__head")!;
      return {
        footBed: bedOf(foot).map(Math.round),
        headBed: bedOf(head).map(Math.round),
        footLabel: on(foot.querySelector(".arc-plate__foot-label")!),
        footLine: on(foot.querySelector(".arc-plate__foot-line")!),
        kicker: on(head.querySelector(".arc-plate__kicker")!),
        name: on(head.querySelector(".arc-plate__name")!),
        /* The gold rule across the head's top, stopping at the cut. */
        ruleW: Math.round(parseFloat(getComputedStyle(head, "::before").width || "0")),
        headW: Math.round(head.getBoundingClientRect().width),
      };
    });
    // A LIGHT band on parchment, not the inverse: the chip's own wash.
    expect(plate.footBed[0], "the foot carries the soft gold fill").toBeGreaterThan(180);
    for (let i = 0; i < 3; i++) {
      expect(
        Math.abs(plate.footBed[i] - plate.headBed[i]),
        `the head and the foot are one material (${plate.headBed} vs ${plate.footBed})`
      ).toBeLessThanOrEqual(3);
    }
    expect(plate.footLabel, "DELIVERABLE on the wash").toBeGreaterThanOrEqual(4.5);
    expect(plate.footLine, "the outcome on the wash").toBeGreaterThanOrEqual(4.5);
    expect(plate.kicker, "the module label on the wash").toBeGreaterThanOrEqual(4.5);
    expect(plate.name, "the module name on the wash").toBeGreaterThanOrEqual(4.5);
    /* And the head's gold rule stops at the cut — run to the corner it
       overshoots into the notch, which is `boardGlyphs`' own law on the
       object this band came from. */
    expect(plate.ruleW, "the head's rule runs the full width").toBeLessThan(plate.headW - 8);
    expect(plate.ruleW, "the head's rule is missing").toBeGreaterThan(plate.headW - 40);

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
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
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
      await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
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

  test("ADR-099: every proposal head sits on ONE datum", async ({ page }) => {
    /* Owner, 2026-09-13: the head "must always be positioned at the right
       position, because in the Trinny London configuration it's different
       from 'we propose a modular approach that compounds'".

       The cause was `.arc-sec { align-content: center }`: a beat centres in
       its own screen, so where its head lands is a function of how tall its
       BODY is — and the proposal's bodies range from a three-plate row to a
       fee table. Measured 0.107 → 0.197 of the frame across the page's own
       beats before this. Head-bearing beats are seated from the top now, on
       the homepage masthead's own datum.

       ⚠ THE ASSERTION IS THE EQUALITY, NOT THE VALUE. A fixed frac would
       pass on one viewport and lie on another; what the owner asked for is
       that the heads agree with EACH OTHER. The datum's own value is
       checked once, loosely, so a wholesale reseat is still caught. */
    for (const vp of [
      { width: 1920, height: 1247 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".home-v2-stage");
      await page.waitForTimeout(SETTLE_MS);

      const topOf = (id: string) =>
        page.evaluate(
          (sel) =>
            (document.getElementById(sel)?.getBoundingClientRect().top ?? 0) + window.scrollY,
          id
        );
      /** The head's eyebrow, relative to its own beat's top — the datum is a
       *  padding on the beat, so THAT is the box it must be constant in. */
      const seatOf = async (id: string) => {
        /* ⚠ CONVERGE ON THE BEAT'S OWN TOP, never on one solved `y`. The
           first long roll is clamped while the corridor inflates the
           document (5,490px of growth measured at 1280×720 between the
           first roll and the second), so a reading taken there is of a beat
           that has not reached its place — and a fixed pair of rolls is a
           bet on how much of that growth landed in between.
           ⚠ AND IT REWINDS FIRST. The loop navigates the SAME url a second
           time at a new viewport, and Chrome restores the previous scroll
           across that reload: `rollTo` then reads `from` deep in the page,
           walks the wrong way and parks on whatever it reaches. Measured as
           a failure on the SECOND viewport alone, with the first green. */
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(120);
        for (let pass = 0; pass < 4; pass++) {
          await rollTo(page, await topOf(id));
          const off = await page.evaluate(
            (sel) => Math.abs(document.getElementById(sel)?.getBoundingClientRect().top ?? 1e9),
            id
          );
          if (off <= 2) break;
        }
        /* ⚠ AND WAIT FOR THE REVEAL, WHICH IS THE SEAT. `.arc-reveal` rests
           TRANSLATED and settles on `is-in`, so a rect read before it lands
           measures the animation rather than the datum — and it passes
           solo, where the page is quiet, while failing in a full run. The
           transition itself then has to finish, or the head is caught
           mid-travel. */
        await page.locator(`#${id} .arc-head`).first().waitFor({ state: "visible" });
        await expect(page.locator(`#${id} .arc-head`).first()).toHaveClass(/is-in/);
        await page.waitForTimeout(700);
        return page.evaluate((sel) => {
          const beat = document.getElementById(sel)!;
          const desig = beat.querySelector(".arc-head__desig") as HTMLElement;
          return Math.round(desig.getBoundingClientRect().top - beat.getBoundingClientRect().top);
        }, id);
      };

      const config = await seatOf("configuration");
      const phases = await seatOf("phases");
      const pricing = await seatOf("pricing");
      const where = `${vp.width}×${vp.height}`;
      expect(Math.abs(config - phases), `${where}: config vs phases`).toBeLessThanOrEqual(1);
      expect(Math.abs(config - pricing), `${where}: config vs pricing`).toBeLessThanOrEqual(1);
      // The datum itself: `clamp(48px, 10.7svh, 148px)` plus the head's own
      // box, so a band rather than a number — a reseat lands outside it.
      expect(config, `${where}: the datum`).toBeGreaterThan(40);
      expect(config, `${where}: the datum`).toBeLessThan(200);
    }
  });

  test("ADR-100: the board fills its band, letters at the floor and collides nowhere", async ({
    page,
  }) => {
    /* The live half of the board's fit guard. `arc-board-fit` walks the
       drawing's own declaration — every string against the measure it must
       fit — but the arithmetic cannot see a CSS change: a flex base that
       drifted from its crop, a box the height cap shrank, a font the sheet
       stopped resolving. So the rendered svg is measured here at the two
       shapes that bracket the page: the owner's own tall window and the
       reference laptop, where the chrome rung lands at 10.02px.

       ⚠ `preserveAspectRatio="xMidYMid meet"` scales by the SMALLER ratio,
       so `box.width / vb.width` over-reports; glyph boxes are compared in
       user units (`getBBox`) and the rendered size derived from the meet
       (the map smoke's own instrument). Label-on-label overlap is the check
       nothing else makes. */
    for (const vp of [
      { width: 1920, height: 1247 },
      { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".home-v2-stage");
      await page.waitForTimeout(SETTLE_MS);
      await rollToQ(page, 1);
      await rollToQ(page, 1);
      const row = page.locator("#proposition .arc-board");
      await expect(row).toHaveClass(/is-in/);
      await page.waitForTimeout(1200);
      const read = await page.evaluate(() => {
        const rowEl = document.querySelector("#proposition .arc-board")!;
        const rowRect = rowEl.getBoundingClientRect();
        const bandEl = rowEl.parentElement!;
        const band = bandEl.getBoundingClientRect();
        const bandCs = getComputedStyle(bandEl);
        const inner = {
          left: band.left + parseFloat(bandCs.paddingLeft),
          right: band.right - parseFloat(bandCs.paddingRight),
        };
        const beat = document.getElementById("configuration")!.getBoundingClientRect();
        const headEl = document.querySelector("#configuration .arc-head") as HTMLElement;
        const head = headEl.getBoundingClientRect();
        const headGap = getComputedStyle(headEl).marginBottom;
        const phasesHead = document.querySelector("#phases .arc-head") as HTMLElement | null;
        const phasesHeadGap = phasesHead ? getComputedStyle(phasesHead).marginBottom : headGap;
        const boards = [...rowEl.querySelectorAll("svg")].map((svg) => {
          const r = svg.getBoundingClientRect();
          const vb = svg.viewBox.baseVal;
          const meet = Math.min(r.width / vb.width, r.height / vb.height);
          const items = [...svg.querySelectorAll("text")].map((t) => ({
            text: (t.textContent ?? "").slice(0, 40),
            b: t.getBBox(),
            px: Number.parseFloat(getComputedStyle(t).fontSize) * meet,
          }));
          const overlaps: string[] = [];
          for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
              const a = items[i].b;
              const b = items[j].b;
              const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
              const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
              if (ox > 0.5 && oy > 0.5) overlaps.push(`"${items[i].text}" x "${items[j].text}"`);
            }
          }
          return {
            h: r.height,
            meet,
            drawnH: vb.height * meet,
            minPx: Math.min(...items.map((i) => i.px)),
            texts: items.length,
            overlaps,
          };
        });
        return {
          vh: window.innerHeight,
          row: {
            left: rowRect.left,
            right: rowRect.right,
            top: rowRect.top,
            bottom: rowRect.bottom,
          },
          inner,
          head: { left: head.left, right: head.right },
          headGap,
          phasesHeadGap,
          beat: { top: beat.top, bottom: beat.bottom, h: beat.height },
          boards,
        };
      });
      const where = `${vp.width}×${vp.height}`;
      expect(read.boards, `${where}: two boards`).toHaveLength(2);
      for (const b of read.boards) {
        // The dormant board letters exactly ten strings (the set is pinned in
        // `arc-board-fit`); the lit one seventeen.
        expect(b.texts, `${where}: a drawing letters`).toBeGreaterThanOrEqual(10);
        expect(b.overlaps, `${where}: labels printing through labels`).toEqual([]);
        expect(b.minPx, `${where}: the type floor`).toBeGreaterThanOrEqual(10);
        /* The svg sits at its own height (`height: auto` off the crop's
           aspect — ADR-100 U1 retired the elastic crop), so the drawn height
           is the box's within a rounding — no letterbox on either axis. */
        expect(Math.abs(b.drawnH - b.h), `${where}: the crop fills its box`).toBeLessThanOrEqual(2);
      }
      const [today, configured] = read.boards;
      /* ⚠ THE COUNTS ARE PINNED LIVE, not only in `arc-board-fit`'s label
         sets: a `<text>` that stopped rendering — a token that stopped
         resolving, a role group that stopped mounting — leaves the
         arithmetic green and the drawing short. Ten on the ledger,
         seventeen on the board (ADR-100 U2, U4's fifth fact). */
      expect([today.texts, configured.texts], `${where}: the drawings' own counts`).toEqual([
        10, 17,
      ]);
      expect(
        Math.abs(today.meet - configured.meet) / configured.meet,
        `${where}: one meet on both boards`
      ).toBeLessThan(0.01);
      expect(Math.abs(today.h - configured.h), `${where}: one top, one floor`).toBeLessThanOrEqual(
        1
      );
      expect(read.row.left, `${where}: inside the band`).toBeGreaterThanOrEqual(
        read.inner.left - 1
      );
      expect(read.row.right, `${where}: inside the band`).toBeLessThanOrEqual(read.inner.right + 1);
      expect(read.row.top, `${where}: inside the beat`).toBeGreaterThanOrEqual(read.beat.top - 1);
      expect(read.row.bottom, `${where}: inside the beat`).toBeLessThanOrEqual(
        read.beat.bottom + 1
      );
      /* ⚠ AND THE DRAWING SITS ON ITS OWN HEAD'S EDGES (U4, owner: the
         configuration head "is a bit more centered versus the other
         sections … 'We propose a modular approach that compounds' — that
         positioning is the gold standard"). The heads were always
         pixel-identical; the DRAWING was the object that was out, on the
         1440 instrument band against a head on the 1200 text band, 120px
         per side at 1920×1247. It reads as a mis-set head and measures as a
         mis-set drawing, which is why this assertion is on the row. */
      expect(
        Math.abs(read.row.left - read.head.left),
        `${where}: the drawing's left edge is its head's`
      ).toBeLessThanOrEqual(1);
      expect(
        Math.abs(read.row.right - read.head.right),
        `${where}: the drawing's right edge is its head's`
      ).toBeLessThanOrEqual(1);
      /* And the head's own margin is the standard one, so the gap under the
         dek matches the plate beats' (the second half of the same read). */
      expect(read.headGap, `${where}: the head's margin is the beats' own`).toBe(
        read.phasesHeadGap
      );
      // The reference laptop is the binding shape: the beat holds one viewport there.
      if (vp.height === 720)
        expect(read.beat.h, `${where}: one viewport`).toBeLessThanOrEqual(read.vh + 1);
    }
  });

  test("ADR-101 §A: both beats STRIKE in, seated, and nothing rises", async ({ page }) => {
    /* Owner, 2026-09-14: the next section's elements _"don't have to fly in.
       They don't have to have a movement. They need to have a glitch effect
       like we have on our homepage. Let's make sure it only happens when all
       the elements from the [turn] have faded out."_

       ⚠ THE THING THAT CAN REGRESS SILENTLY IS THE ORDER, not the effect. A
       burst that fires early looks like a burst; a burst that never fires
       leaves a beat the arcs' own reveal would have shown anyway (the stamps
       fail OPEN by contract), so the page reads correct and the ask is
       simply not delivered. Both ends are pinned here. */
    await page.setViewportSize({ width: 1920, height: 1247 });
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(SETTLE_MS);

    const read = () =>
      page.evaluate(() => {
        const prop = document.getElementById("proposition")!;
        const head = prop.querySelector(".arc-head") as HTMLElement | null;
        const svgs = [...prop.querySelectorAll(".arc-board__svg")] as SVGElement[];
        const roles = [...prop.querySelectorAll("[data-board-role]")] as SVGElement[];
        const cs = (el: Element | null) => {
          if (!el) return null;
          const c = getComputedStyle(el);
          return {
            op: c.opacity,
            vis: c.visibility,
            anim: c.animationName,
            fill: c.animationFillMode,
            tr: c.transform,
            /* ⚠ `animationName` IS THE DECLARATION, NOT THE STATE. It keeps
               naming the keyframes long after the burst has ended, so "did it
               finish" has to be asked of the animations themselves. */
            running: el.getAnimations().some((a) => a.playState === "running"),
          };
        };
        return {
          arrive: prop.getAttribute("data-tl-prop-arrive"),
          q: prop.getAttribute("data-tl-prop"),
          pe: getComputedStyle(prop).pointerEvents,
          head: cs(head),
          svgs: svgs.map(cs),
          roles: roles.map((r) => ({
            role: r.getAttribute("data-board-role"),
            ...cs(r)!,
          })),
        };
      });

    // 1 — before the turn is spent the record is ABSENT, not transparent.
    await rollToQ(page, 0.9);
    await rollToQ(page, 0.9);
    const awaiting = await read();
    expect(awaiting.arrive, "the record waits while the turn empties").toBe("await");
    expect(awaiting.head!.vis).toBe("hidden");
    for (const v of awaiting.svgs) expect(v!.vis).toBe("hidden");
    /* ⚠ AND IT TAKES NO CLICKS WHILE IT WAITS. The stations overlap by a
       WHOLE viewport now, so this box is laid out directly over the turn's
       own button for the turn's last screen — and a hidden box with
       `pointer-events: auto` swallows the one link that beat offers. Asked
       from the LINK's side, because that is the failure a reader meets. */
    expect(awaiting.pe, "an awaiting station must not take a click").toBe("none");
    const ctaReachable = await page.evaluate(() => {
      const cta = document.querySelector(".tl-turn__cta") as HTMLElement | null;
      if (!cta) return null;
      const r = cta.getBoundingClientRect();
      if (r.width < 1 || r.bottom < 0 || r.top > window.innerHeight) return null;
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit ? cta.contains(hit) || hit.contains(cta) : false;
    });
    if (ctaReachable !== null) {
      expect(ctaReachable, "the turn's CTA is under the awaiting station").toBe(true);
    }

    // 2 — at the datum it STRIKES, and every part of it runs the burst.
    await rollToQ(page, 1);
    await rollToQ(page, 1);
    const striking = await read();
    expect(striking.arrive, "the record strikes as the turn lands").toBe("in");
    expect(striking.head!.anim).toMatch(/tl-glitch-bands/);
    expect(striking.head!.anim).toMatch(/tl-glitch-strike/);
    for (const v of striking.svgs) expect(v!.anim).toMatch(/tl-glitch-bands/);
    expect(striking.roles.length, "five roles, drawn twice").toBe(10);
    for (const r of striking.roles) {
      expect(r.anim, `${r.role} does not strike`).toMatch(/tl-glitch-strike/);
    }

    // 3 — and it ends on the CASCADE: no fill, nothing pinned, nothing risen.
    await settleStrike(page, "#proposition");
    const settled = await read();
    expect(settled.head!.vis).toBe("visible");
    expect(settled.head!.op).toBe("1");
    expect(settled.head!.running, "the burst is spent, not held").toBe(false);
    /* ⚠ AND IT FILLS BACKWARDS, NEVER FORWARDS. Every one of these ends on
       exactly what the cascade already says, so ending ON the cascade cannot
       pop — a `forwards` fill would pin the last frame over it and take the
       board's own resting paint with it. The fill is what makes a DELAYED rung
       legal at all: without it a rung sits lit for the length of its delay and
       then snaps to zero, which is the ladder playing backwards. */
    // One value per animation in the list — three, all the same.
    expect(new Set(settled.head!.fill.split(",").map((v) => v.trim()))).toEqual(
      new Set(["backwards"])
    );
    /* ⚠ NOTHING RISES. `ArcShell`'s IntersectionObserver still stamps
       `.is-in`; what it drives is neutralised route-wide, and a beat running
       BOTH is the defect this replaced rather than a second opinion about
       it. `none` is the resting transform of a neutralised reveal. */
    expect(settled.head!.tr, "the head rose as well as struck").toBe("none");
    for (const r of settled.roles) {
      expect(r.op, `${r.role} is dark after its strike`).toBe("1");
    }

    // 4 — scrolling back strikes it OUT and re-arms it.
    await rollToQ(page, 0.9);
    await rollToQ(page, 0.9);
    const leaving = await read();
    expect(leaving.arrive, "it leaves the way it came").toBe("out");
    await rollToQ(page, 1);
    await rollToQ(page, 1);
    expect((await read()).arrive, "the strike re-arms").toBe("in");

    /* 5 — and the phases, one station down, on the SEAM rather than on an
       arrival: hidden while the plates row is still entering the frame,
       struck once it is four fifths in. */
    await rollToT(page, 0.4);
    const phasesEarly = await page.evaluate(() => {
      const ph = document.getElementById("phases");
      if (!ph) return null;
      const head = ph.querySelector(".arc-head")!;
      const plate = ph.querySelector(".arc-plate")!;
      return {
        arrive: document.getElementById("offer")?.getAttribute("data-tl-phases-arrive") ?? null,
        seam: document.getElementById("offer")?.getAttribute("data-tl-seam") ?? null,
        head: getComputedStyle(head).visibility,
        plate: getComputedStyle(plate).visibility,
      };
    });
    expect(phasesEarly, "#phases never mounted").not.toBeNull();
    expect(phasesEarly!.arrive, `the phases struck at seam ${phasesEarly!.seam}`).toBe("await");
    expect(phasesEarly!.head).toBe("hidden");
    expect(phasesEarly!.plate).toBe("hidden");

    await rollToT(page, 1);
    await settleStrike(page, "#phases");
    const phasesLate = await page.evaluate(() => {
      const ph = document.getElementById("phases")!;
      const plates = [...ph.querySelectorAll(".arc-plate")];
      return {
        arrive: document.getElementById("offer")!.getAttribute("data-tl-phases-arrive"),
        head: getComputedStyle(ph.querySelector(".arc-head")!).visibility,
        plates: plates.map((p) => ({
          vis: getComputedStyle(p).visibility,
          running: p.getAnimations().some((a) => a.playState === "running"),
          /* The comb's last frame is STRING-EQUAL to the plate's own clip,
             so the animation and the cascade end on one polygon. */
          clip: getComputedStyle(p).clipPath,
          w: Math.round(p.getBoundingClientRect().width),
        })),
      };
    });
    expect(phasesLate.arrive).toBe("in");
    expect(phasesLate.head).toBe("visible");
    expect(phasesLate.plates.length).toBe(3);
    for (const p of phasesLate.plates) {
      expect(p.vis).toBe("visible");
      expect(p.running, "the plate's burst is spent, not held").toBe(false);
      expect(p.clip, "the plate lost its own notch to the comb").toMatch(/polygon/);
      expect(p.w).toBeGreaterThan(200);
    }
  });

  test("ADR-101 §B: the chip becomes the plates, welded at both ends", async ({ page }) => {
    /* Owner, 2026-09-14: the chip _"moves into the center of the screen, and
       then it copies itself left and right. That becomes the cards from the
       'We propose a modular approach' section … I don't want fucking
       cross-dissolves. This really needs to be an elegant transformation of
       the element."_

       ⚠ THE TWO WELDS ARE THE WHOLE CLAIM, and neither is visible on a still
       that is not taken on exactly the right frame: at t = 0 the carrier has
       to BE the chip it covers, and at t = 1 it has to BE the head it is
       replaced by. Off by a few pixels at either end and the reader sees a
       jump — which is what a cross-dissolve was being avoided to prevent.
       `trinny-seam` pins the arithmetic; this pins the live boxes. */
    await page.setViewportSize({ width: 1920, height: 1247 });
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(SETTLE_MS);

    const read = () =>
      page.evaluate(() => {
        const box = (el: Element | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        };
        const layer = document.querySelector<HTMLElement>(".tl-seam");
        const cs = [...document.querySelectorAll<HTMLElement>(".tl-seam__carrier")];
        const chip = document.querySelector(
          '#proposition [data-board-state="configured"] [data-board-module="card"] .arc-board__plate'
        );
        const heads = [...document.querySelectorAll("#phases .arc-plate__head")];
        return {
          t: Number(document.getElementById("offer")?.getAttribute("data-tl-seam") ?? "0"),
          arrive:
            document.getElementById("proposition")?.getAttribute("data-tl-prop-arrive") ?? null,
          q: document.getElementById("proposition")?.getAttribute("data-tl-prop") ?? null,
          chipAway: document.getElementById("proposition")?.getAttribute("data-tl-chip") ?? null,
          hold: document.getElementById("offer")?.getAttribute("data-tl-heads") ?? null,
          layerHidden: layer ? layer.hidden : null,
          shown: cs.filter((c) => !c.hidden).length,
          carriers: cs.map((c) => ({
            hidden: c.hidden,
            box: box(c),
            kicker: c.querySelector(".tl-seam__kicker")?.textContent ?? "",
            name: c.querySelector(".tl-seam__name")?.textContent ?? "",
          })),
          chip: box(chip),
          chipVis: chip ? getComputedStyle(chip).visibility : null,
          chipText: [
            ...document.querySelectorAll(
              '#proposition [data-board-state="configured"] [data-board-role="card"] text'
            ),
          ].map((t) => getComputedStyle(t).visibility),
          heads: heads.map((h) => ({ box: box(h), vis: getComputedStyle(h).visibility })),
        };
      });

    // 0 — the chip is whole on the board and there is no layer to see.
    await rollToT(page, 0);
    const rest = await read();
    expect(rest.chipAway, "the chip is still seated").toBeNull();
    expect(rest.layerHidden).toBe(true);
    for (const v of rest.chipText)
      expect(v, `arrive=${rest.arrive} q=${rest.q} t=${rest.t}`).toBe("visible");

    /* 1 — the first frame of travel: ONE carrier, over the chip it covers,
       to the pixel. The chip's own words are away and its OUTLINE is not:
       four ribbons still run to that box, and a seat that vanished would
       leave them ending in the middle of the board. */
    await rollToT(page, 0.02);
    const off = await read();
    if (off.t > 0 && off.t < SEAM_DETACH_AT) {
      expect(off.chipAway, "the chip is put away as the carrier lifts").toBe("away");
      expect(off.hold, "the heads are held").toBe("hold");
      expect(off.shown, "one object, not three, before the split").toBe(1);
      for (const v of off.chipText) expect(v, "the chip's words are away").toBe("hidden");
      expect(off.chipVis, "the chip's OUTLINE stays — the ribbons meet it").toBe("visible");
      const c = off.carriers.find((x) => !x.hidden)!;
      // The weld: within a pixel and a half of the chip's own screen box.
      for (const k of ["w", "h"] as const) {
        expect(
          Math.abs(c.box![k] - off.chip![k]),
          `the carrier is not the chip's size at t ${off.t} (${k})`
        ).toBeLessThanOrEqual(1.5);
      }
      expect(c.kicker, "it carries the chip's own words").toBe("AI CAPABILITY");
      expect(c.name).toBe("owned by the team");
    }

    // 2 — past the split: one object became three.
    await rollToT(page, 0.5);
    const split = await read();
    expect(split.shown, "the chip copied itself left and right").toBe(3);
    const xs = split.carriers.map((c) => c.box!.x).sort((a, b) => a - b);
    expect(xs[1] - xs[0], "the copies peeled apart").toBeGreaterThan(60);
    expect(xs[2] - xs[1]).toBeGreaterThan(60);
    for (const h of split.heads) expect(h.vis, "the heads are held").toBe("hidden");

    /* 3 — the far weld. Each carrier is its head's box, and its words have
       already landed: the decode finishes at 90 % of the seat so the last
       stretch is a pure geometry move and the hand-over frame carries no
       half-shuffled glyph. */
    await rollToT(page, 0.99);
    /* ⚠ AND THE PLATES HAVE TO HAVE STOPPED STRIKING BEFORE THEIR HEADS ARE
       MEASURED. §A's burst animates `translate: 2.5px 0` on the plate itself,
       so a head read mid-strike is up to 2.5px from where it settles — which
       reads as the carrier missing its weld and is the HARNESS moving the
       target. Settled, the delta is 0.00 on all four terms (measured). */
    await settleStrike(page, "#phases");
    const seated = await read();
    if (seated.t > 0.9 && seated.t < 1) {
      expect(seated.shown).toBe(3);
      for (let i = 0; i < 3; i++) {
        const c = seated.carriers[i].box!;
        const h = seated.heads[i].box!;
        for (const k of ["x", "y", "w", "h"] as const) {
          expect(
            Math.abs(c[k] - h[k]),
            `carrier ${i} is not its head's box at t ${seated.t} (${k})`
          ).toBeLessThanOrEqual(1.5);
        }
        expect(seated.carriers[i].kicker, `carrier ${i}'s kicker`).toMatch(/^M[123] /);
      }
    }

    // 4 — and at 1 the layer is away and the real heads paint.
    await rollToT(page, 1);
    const done = await read();
    expect(done.layerHidden, "the layer hands over").toBe(true);
    expect(done.chipAway, "the chip is whole again").toBeNull();
    expect(done.hold).toBeNull();
    for (const h of done.heads) expect(h.vis, "the real heads paint").toBe("visible");
    for (const v of done.chipText) expect(v).toBe("visible");
  });

  test("ADR-101 §A: under reduced motion nothing strikes, and nothing is hidden", async ({
    page,
  }) => {
    /* ⚠ THE ONE FAILURE MODE OF A STAMPED REVEAL IS THAT IT LATCHES SHUT.
       Both beats are hidden by an attribute the writer publishes, and the
       writer parks — removing every stamp — wherever the beat cannot run: a
       phone, a short window, reduced motion. So an ABSENT stamp has to mean
       SHOWN, which is this route's own law one station over (the ground's
       polarity, ADR-099). If it ever meant HIDDEN, the readers who cannot
       see the burst would be the readers who cannot see the record either,
       and nothing on any other path would fail. */
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1920, height: 1247 });
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(SETTLE_MS);

    const propTop = await page.evaluate(
      () => document.getElementById("proposition")!.getBoundingClientRect().top + window.scrollY
    );
    await rollTo(page, Math.round(propTop));
    await rollTo(page, Math.round(propTop));

    const read = await page.evaluate(() => {
      const prop = document.getElementById("proposition")!;
      const head = prop.querySelector(".arc-head") as HTMLElement;
      const svgs = [...prop.querySelectorAll(".arc-board__svg")];
      return {
        arrive: prop.getAttribute("data-tl-prop-arrive"),
        seam: document.getElementById("offer")?.getAttribute("data-tl-seam") ?? null,
        phases: document.getElementById("offer")?.getAttribute("data-tl-phases-arrive") ?? null,
        head: {
          vis: getComputedStyle(head).visibility,
          op: getComputedStyle(head).opacity,
          w: Math.round(head.getBoundingClientRect().width),
        },
        svgs: svgs.map((v) => ({
          vis: getComputedStyle(v).visibility,
          op: getComputedStyle(v).opacity,
          h: Math.round(v.getBoundingClientRect().height),
        })),
      };
    });

    expect(read.arrive, "a parked writer must leave no stamp behind").toBeNull();
    expect(read.seam).toBeNull();
    expect(read.phases).toBeNull();
    expect(read.head.vis).toBe("visible");
    expect(read.head.op).toBe("1");
    expect(read.head.w).toBeGreaterThan(400);
    expect(read.svgs.length, "both boards render").toBe(2);
    for (const v of read.svgs) {
      expect(v.vis).toBe("visible");
      expect(v.op).toBe("1");
      expect(v.h).toBeGreaterThan(100);
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("ADR-101 §A: the approach is spent, and exactly one ground paints it", async ({ page }) => {
    /* A sticky stage costs one viewport of scroll-off at its end; with the
       turn's products gone and its line un-typed by then, that viewport was
       an empty stage leaving. `--tl-prop-lead` overlaps the two stations by
       it.

       ⚠ ADR-095 U6 TOOK HALF AND ADR-101 §A TAKES ALL OF IT, because the
       record stopped rising. Half was right while it ARRIVED by travelling:
       the line got to leave before the next thing came in, and the thing
       coming in was moving, so an overlap read as a handover. The record is
       STRUCK in now, seated, so the frame before it has to be empty and the
       frame it lands on has to be composed — which is one scroll position,
       not two. `#proposition`'s top IS the turn's release.

       ⚠ WHICH IS ONLY LEGAL BECAUSE THE GROUNDS SWAP. Two coats of the same
       viewport-locked field is a hard horizontal band across the frame — the
       defect the overlap buys unless exactly one ground is painting at every
       scroll position. That is the second half of this test and it is the
       half that can regress silently: the pixels are a wash on a wash, so
       nothing throws and no geometry gate can see it. */
    await page.setViewportSize({ width: 1920, height: 1247 });
    await page.goto("/arcs/trinny-london/proposal", { waitUntil: "domcontentloaded" });
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

    /* Zero, to the pixel: `p` and `q` saturate on the same frame, which is
       what the configuration's strike is hung on. A lead that drifts either
       way re-opens the bare frame this beat was re-cut to delete — short,
       and the record strikes over a turn that has not finished leaving. */
    expect(
      Math.abs(approach),
      `the proposal opens ${approach}px off the turn's release — the lead has drifted`
    ).toBeLessThanOrEqual(2);

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
        const offer = document.getElementById("offer")?.getBoundingClientRect();
        return {
          turn: seen(".tl-turn__wash"),
          prop: seen(".tl-prop__ground"),
          // The next OPAQUE station: where the coral stops, this begins.
          offerTop: offer ? Math.max(0, Math.min(window.innerHeight, offer.top)) : null,
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
      /* ⚠ AND THE FRAME IS NEVER BARE EITHER. A swap that hides both is the
         same bug with the sign flipped, and it looks like the wash simply
         vanishing at the seam.

         ⚠ THE UNION, NOT THE LARGEST (ADR-099). This asserted that ONE
         element covered 90 % of the frame, which was true while the proposal
         was a 160svh pinned station whose ground blanketed the viewport by
         itself. Its record is a beat now and the station is one screen, so
         past the release the coral FEATHERS OUT (`TURN_PROP_FADE`) exactly
         where `#offer` — the next opaque station, and the ambient's kill
         edge — begins painting: measured at release+0.7vh, the prop canvas
         reaches alpha 1 by y 998 and the offer's top IS 998.

         So the honest question is whether anything is UNPAINTED, and the
         answer is the union of the coral and the opaque station under it.
         Keeping the old form would have meant loosening a number until it
         passed, which is how a guard stops describing the page. */
      const bands: [number, number][] = [];
      if (tLive) bands.push([tLive.top, tLive.bottom]);
      if (pLive) bands.push([pLive.top, pLive.bottom]);
      // The offer is opaque from its own top to the foot of the frame.
      if (paint.offerTop !== null) bands.push([paint.offerTop, geom.vh]);
      bands.sort((a, b) => a[0] - b[0]);
      let covered = 0;
      let reach = 0;
      for (const [from, to] of bands) {
        if (to <= reach) continue;
        covered += to - Math.max(from, reach);
        reach = to;
      }
      expect(
        covered,
        `the frame is bare at release${at >= 0 ? "+" : ""}${at}vh ` +
          `(bands ${JSON.stringify(bands.map(([a, b]) => [Math.round(a), Math.round(b)]))})`
      ).toBeGreaterThan(geom.vh * 0.9);
    }
  });
});
