/**
 * capture-proof-stack — the four proof cards on the REAL landing, measured
 * (ADR-096).
 *
 * HEADED: the pile sits over the scroll-driven WebGL corridor and a headless
 * context leaves the canvas dead. Real scrolls, never a teleport — the
 * dissipate clock the cards arrive on is rect-derived.
 *
 * A card is seated by scrolling to its slot's own flow offset inside the
 * runway (that IS its pin point, `top-base + i·peek` from the viewport top)
 * plus a fraction of its dwell. ⚠ Never `scrollIntoView` on a sticky slot:
 * an already-pinned slot's rect is its PINNED position, so the read converges
 * on wherever it already is (the trinny smoke's own finding).
 *
 * Usage:
 *   node scripts/capture-proof-stack.mjs --vp 1440x900 --theme dark
 */
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "shots");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
const CARDS = argOf("--cards", "0,1,2,3").split(",").map(Number);
/* `--mid` shoots card 1 MID-ARRIVAL (the plate's fade, ADR-097); `--perf`
   scrolls the whole pile at reading speed and prints the frame-time
   distribution — the glass's cost is a per-frame backdrop SNAPSHOT
   (ADR-056's measurement), so the number to watch is the >33ms share. */
const MID = args.includes("--mid");
const PERF = args.includes("--perf");
/* `--handoff` walks the LAST card off the screen and reports the ring against
   its bottom edge — the beat ADR-096 U3 solves for. */
const HANDOFF = args.includes("--handoff");
/* `--glitch 0,180,360,540,720` shoots the first card's materialisation
   on a PAUSED clock, one still per millisecond offset. */
const GLITCH = (argOf("--glitch", "") || "")
  .split(",")
  .map(Number)
  .filter((n) => Number.isFinite(n));
/* `--mobile` shoots the PHONE's pile (ADR-107): an emulated iPhone context
   (touch, DPR 3, the mobile UA) at `--vp`, on Chromium — the WebKit device
   cannot reach the dev server (mobile-sections.md). `--pairs` walks pair 0
   through its four states: record pinned, field half up, field pinned,
   record 1 arriving — and shoots each. `--headless` runs new-headless
   Chromium on SwiftShader; `PW_CHROMIUM` hands over a pinned binary. */
const MOBILE = args.includes("--mobile");
const PAIRS = args.includes("--pairs");
const HEADLESS = args.includes("--headless");

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: HEADLESS,
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: HEADLESS ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [],
});
const ctx = await browser.newContext({
  ...(MOBILE ? { ...devices["iPhone 14"], defaultBrowserType: "chromium" } : {}),
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const tag = `${VW}x${VH}-${THEME}`;

try {
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });
  await page.waitForSelector(".pf-stack", { timeout: 60_000 });

  /* The geometry the whole beat is derived from, read once. */
  const geo = await page.evaluate(() => {
    const runway = document.querySelector(".services-stage-root");
    const pile = document.querySelector(".services-stage-root > .pf-stack");
    const inner = document.querySelector(".pf-stack__runway");
    if (!runway || !pile || !inner) return null;
    const rw = runway.getBoundingClientRect();
    const slots = [...document.querySelectorAll(".pf-slot")].map((el) => ({
      offset: el.offsetTop,
      top: Number.parseFloat(getComputedStyle(el).top),
      position: getComputedStyle(el).position,
      height: el.offsetHeight,
    }));
    return {
      vh: window.innerHeight,
      runwayTop: rw.top + window.scrollY,
      runwayH: rw.height,
      pileH: pile.offsetHeight,
      innerH: inner.offsetHeight,
      proofRunwayVar: getComputedStyle(runway).getPropertyValue("--svc-proof-runway").trim(),
      pilePosition: getComputedStyle(pile).position,
      slots,
    };
  });
  if (!geo) throw new Error("no .pf-stack — the stack never mounted");

  console.log(`\n── geometry @ ${tag} ────────────────────────────────`);
  console.log(`  viewport            ${geo.vh}px`);
  console.log(
    `  runway height       ${Math.round(geo.runwayH)}px  (${(geo.runwayH / geo.vh).toFixed(2)} vh)`
  );
  console.log(`  pile height         ${geo.pileH}px  (${(geo.pileH / geo.vh).toFixed(2)} vh)`);
  console.log(`  --svc-proof-runway  ${geo.proofRunwayVar}`);
  console.log(`  pile position       ${geo.pilePosition}`);
  /* ⚠ THE SHARE IS THE WRITTEN NUMBER, NOT `pileH + 1.2vh` (ADR-096 U3).
     The release is the last card's own exit now and is solved INSIDE the
     measured share, which ends short of the pile's box — so reading the
     domain off the old sum reported a drift that is not there. */
  const sharePx = geo.proofRunwayVar.endsWith("px")
    ? Number.parseFloat(geo.proofRunwayVar)
    : geo.pileH;
  console.log(
    `  proof share         ${Math.round(sharePx)}px  (${(sharePx / geo.vh).toFixed(2)} vh, ` +
      `pile ${Math.round(sharePx - geo.pileH)}px)`
  );
  console.log(
    `  ring domain         ${Math.round(geo.runwayH - geo.vh - sharePx)}px ` +
      `(want ${Math.round(4 * geo.vh)}px)`
  );
  for (const [i, s] of geo.slots.entries()) {
    console.log(
      `  slot ${i}  offset ${String(Math.round(s.offset)).padStart(5)}  top ${String(
        Math.round(s.top)
      ).padStart(3)}  h ${Math.round(s.height)}  ${s.position}`
    );
  }

  for (const i of CARDS) {
    const s = geo.slots[i];
    if (!s) continue;
    /* ⚠ THE RUNWAY'S TOP IS RE-READ PER CARD. The corridor mounts lazily and
       inflates the document late, so a `top` measured once at mount is stale
       by the time the first scroll lands — card 0 reported `incoming` at a
       target solved against a shorter page. */
    /* ⚠ AND IT CONVERGES RATHER THAN SOLVING ONCE. The corridor mounts lazily
       and the document grows UNDER the scroll, so the first landing is short
       by whatever it grew — card 0 reported `incoming` at 0.26 with its own
       seat solved correctly against a page that had since moved. Re-solve
       until the slot publishes `pinned` (the hook's own value, never a rect —
       the trinny smoke's `rollToP` law). */
    for (let pass = 0; pass < 4; pass += 1) {
      await page.evaluate(
        ({ off, top, h }) => {
          const rw = document.querySelector(".services-stage-root");
          const y = rw.getBoundingClientRect().top + window.scrollY + off - top + h * 0.35;
          window.scrollTo(0, Math.round(y));
        },
        { off: s.offset, top: s.top, h: s.height }
      );
      await page.waitForTimeout(pass === 0 ? 900 : 450);
      const seated = await page.evaluate(
        (idx) => document.querySelectorAll(".pf-slot")[idx]?.getAttribute("data-pc-state"),
        i
      );
      if (seated === "pinned" || seated === "covered") break;
    }
    const state = await page.evaluate((idx) => {
      const slot = document.querySelectorAll(".pf-slot")[idx];
      const card = slot?.querySelector(".pf-card");
      const r = card?.getBoundingClientRect();
      const stage = document.querySelector(".services-stage");
      return {
        pcState: slot?.getAttribute("data-pc-state"),
        enter: slot ? getComputedStyle(slot).getPropertyValue("--pc-enter").trim() : null,
        card: r
          ? {
              x: Math.round(r.x),
              y: Math.round(r.y),
              w: Math.round(r.width),
              h: Math.round(r.height),
            }
          : null,
        title: card?.querySelector(".pf-card__title")?.textContent?.trim(),
        stations: [...(card?.querySelectorAll(".fl-con__stn") ?? [])].map((b) =>
          b.textContent?.trim()
        ),
        plate: card ? getComputedStyle(card).backgroundColor : null,
        /* ADR-097 — the folder card's own state: depth, the plate's opacity
           and recession, the lip's paint, and the tab's width. */
        depth: slot ? getComputedStyle(slot).getPropertyValue("--pc-depth").trim() : null,
        opacity: card ? getComputedStyle(card).opacity : null,
        transform: card ? getComputedStyle(card).transform : null,
        ring: card ? getComputedStyle(card, "::before").backgroundColor : null,
        headW: card
          ? Math.round(card.querySelector(".pf-card__head")?.getBoundingClientRect().width ?? 0)
          : null,
        /* ADR-097 U10 — the terminal of frames: the evidence frame's four
           borders, the field's gap, rail→frame and frame→foot air, the last
           region's floor against the record's last rule, the foot's height,
           and the apparatus head that must stay deleted. */
        panel: (() => {
          const field = card?.querySelector(".pf-card__field");
          const frame = card?.querySelector(".fl-con__console, .pf-field--tools, .pf-field--films");
          const tabs = card?.querySelector(".pf-card__tabs");
          const foot = card?.querySelector(".pf-card__foot");
          const last = [...(card?.querySelectorAll(".pf-card__claim") ?? [])].at(-1);
          if (!field || !frame) return null;
          const fc = getComputedStyle(frame);
          const fr = frame.getBoundingClientRect();
          const footShown = !!foot && getComputedStyle(foot).display !== "none";
          const lastRegion = footShown ? foot : frame;
          const h = (sel) =>
            Math.round(card.querySelector(sel)?.getBoundingClientRect().height ?? 0) || null;
          return {
            borders: [
              fc.borderTopWidth,
              fc.borderRightWidth,
              fc.borderBottomWidth,
              fc.borderLeftWidth,
            ].join("/"),
            gap: getComputedStyle(field).rowGap,
            railToFrame: Math.round(fr.top - (tabs?.getBoundingClientRect().bottom ?? fr.top)),
            frameToFoot: footShown
              ? Math.round(foot.getBoundingClientRect().top - fr.bottom)
              : null,
            floorDelta: last
              ? Math.round(
                  lastRegion.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom
                )
              : null,
            watchH: h(".pf-watch"),
            verdictH: h(".fl-verdict"),
            bayHeads: card.querySelectorAll(".pf-bay__head").length,
            /* ADR-126: the map console's FIELD and its svg, the box every
               reading is fitted to — the number `pda-viewbox`/`pda-flight`'s
               FIELD tables record for the pile (the casefile's were the
               only rows until 2026-09-26). */
            mapField: (() => {
              const fld = card.querySelector(".fl-pda .fl-con__field");
              const svg = card.querySelector(".fl-pda__svg");
              if (!fld || !svg) return null;
              const r = fld.getBoundingClientRect();
              const g = svg.getBoundingClientRect();
              return {
                w: Math.round(r.width),
                h: Math.round(r.height),
                svgW: Math.round(g.width),
                svgH: Math.round(g.height),
              };
            })(),
          };
        })(),
        pile: (() => {
          const p = document.querySelector(".services-stage-root > .pf-stack");
          const q = p?.getBoundingClientRect();
          return q ? { x: Math.round(q.x), w: Math.round(q.width) } : null;
        })(),
        proofLive: stage?.hasAttribute("data-proof-live"),
      };
    }, i);
    console.log(
      `  card ${i}  ${state.pcState ?? "?"}  enter ${state.enter}  ` +
        `${JSON.stringify(state.card)}  ${JSON.stringify(state.title)}`
    );
    if (state.stations.length) console.log(`           rail  ${state.stations.join(" | ")}`);
    console.log(`           plate ${state.plate}`);
    console.log(
      `           depth ${state.depth}  opacity ${state.opacity}  ${state.transform}  ` +
        `ring ${state.ring}  head ${state.headW}px`
    );
    console.log(`           panel ${JSON.stringify(state.panel)}`);
    await page.screenshot({ path: `${OUT}/proof-stack-${tag}-card${i}.png` });
  }

  /* ── `--mid`: card 1 caught MID-ARRIVAL (ADR-097) ────────────────────
     The plate's fade is the thing the still has to show, and a seated card
     cannot show it. Raw ratio .4 on the hook's own travel (`vh − pinTop`)
     lands `--pc-enter` ≈ smoothstep(.4) = .35 — inside the plate's window
     and before the record's. Re-solved per pass, like the seats above,
     because the corridor grows the document under the first scroll. */
  /* ── `--pairs`: the phone's pair 0, in its four states (ADR-107) ─────
     Each state is a seat on one of the first three slots plus an offset,
     converged on the hook's own `data-pc-state` after a rewind above the
     pile (a stuck slot's `offsetTop` is its stuck position). What is printed
     is the pair law: field 0's top against record 0's top + band, the record
     body's visibility once covered, and record 1 landing on field 0's line. */
  if (PAIRS) {
    const seat = async (i, extra) => {
      for (let pass = 0; pass < 6; pass += 1) {
        /* ⚠ `<html>` scrolls smoothly, so both scrolls below are ANIMATIONS:
           wait for scrollY to stop moving (the smokes' `settleScroll`), or the
           rewind is short, the slot is still stuck, and `offsetTop` reports
           the stuck position. */
        const settle = () =>
          page.evaluate(async () => {
            const t0 = performance.now();
            let last = window.scrollY;
            let still = 0;
            await new Promise((resolve) => {
              const tick = () => {
                const y = window.scrollY;
                still = Math.abs(y - last) < 0.5 ? still + 1 : 0;
                last = y;
                if (still >= 3 || performance.now() - t0 > 1600) resolve();
                else requestAnimationFrame(tick);
              };
              requestAnimationFrame(tick);
            });
          });
        await page.evaluate(() => {
          const rw = document.querySelector(".pf-stack__runway");
          window.scrollTo(
            0,
            Math.round(rw.getBoundingClientRect().top + window.scrollY - window.innerHeight)
          );
        });
        await settle();
        const y = await page.evaluate(
          ({ idx, more }) => {
            const rw = document.querySelector(".pf-stack__runway");
            const slot = document.querySelector(`.pf-slot[data-pc-index="${idx}"]`);
            const pin = Number.parseFloat(getComputedStyle(slot).top) || 0;
            return Math.round(
              rw.getBoundingClientRect().top + window.scrollY + slot.offsetTop - pin + more
            );
          },
          { idx: i, more: extra }
        );
        await page.evaluate((t) => window.scrollTo(0, t), y);
        await settle();
        await page.waitForTimeout(pass === 0 ? 400 : 150);
        const st = await page.evaluate(
          (idx) => document.querySelector(`.pf-slot[data-pc-index="${idx}"]`)?.dataset.pcState,
          i
        );
        if (st === "pinned" || st === "covered") return st;
      }
      return null;
    };
    const read = () =>
      page.evaluate(() => {
        const q = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            top: +r.top.toFixed(1),
            bottom: +r.bottom.toFixed(1),
            h: +r.height.toFixed(1),
            vis: getComputedStyle(el).visibility,
          };
        };
        return {
          states: [...document.querySelectorAll(".pf-slot")]
            .map((e) => e.dataset.pcState)
            .join(","),
          r0: q('[data-pc-index="0"]'),
          r0head: q('[data-pc-index="0"] .pf-card__head'),
          r0body: q('[data-pc-index="0"] .pf-card__body'),
          f0: q('[data-pc-index="1"]'),
          f0bay: q('[data-pc-index="1"] .pf-card__bay'),
          r1: q('[data-pc-index="2"]'),
          records: [0, 2, 4, 6].map((i) => {
            const el = document.querySelector(`[data-pc-index="${i}"] .pf-card__record`);
            return el ? `${el.scrollHeight}/${el.clientHeight}` : "—";
          }),
        };
      });
    const STATES = [
      ["r0-pinned", 0, 40],
      ["f0-half", 1, -300],
      ["f0-pinned", 1, 40],
      ["r1-arriving", 2, -260],
      ["r1-pinned", 2, 40],
    ];
    console.log(`\n── pairs @ ${tag} ───────────────────────────────────────`);
    for (const [name, i, extra] of STATES) {
      const st = await seat(i, extra);
      const r = await read();
      console.log(`  ${name.padEnd(12)} seat=${st}  states=${r.states}`);
      console.log(
        `    r0 top ${r.r0?.top} band h ${r.r0head?.h} body ${r.r0body?.vis}  ` +
          `f0 top ${r.f0?.top} (band+${r.f0 && r.r0 ? (r.f0.top - r.r0.top).toFixed(1) : "?"}) ` +
          `bay h ${r.f0bay?.h}  r1 top ${r.r1?.top}`
      );
      await page.screenshot({ path: `${OUT}/proof-pair-${tag}-${name}.png` });
    }
    const r = await read();
    console.log(`  record scroll/client: ${r.records.join("  ")}`);
  }

  if (MID && geo.slots[1]) {
    const s = geo.slots[1];
    let mid = null;
    for (let pass = 0; pass < 5; pass += 1) {
      await page.evaluate(
        ({ off, top }) => {
          const rw = document.querySelector(".services-stage-root");
          const vh = window.innerHeight;
          const slotTop = vh - 0.4 * (vh - top);
          const y = rw.getBoundingClientRect().top + window.scrollY + off - slotTop;
          window.scrollTo(0, Math.round(y));
        },
        { off: s.offset, top: s.top }
      );
      await page.waitForTimeout(pass === 0 ? 900 : 450);
      mid = await page.evaluate(() => {
        const slot = document.querySelectorAll(".pf-slot")[1];
        const card = slot?.querySelector(".pf-card");
        const cs = card ? getComputedStyle(card) : null;
        return {
          enter: Number(getComputedStyle(slot).getPropertyValue("--pc-enter")),
          opacity: cs?.opacity,
          translate: cs?.translate,
          transform: cs?.transform,
          record: card ? getComputedStyle(card.querySelector(".pf-card__record")).opacity : null,
        };
      });
      if (mid.enter > 0.25 && mid.enter < 0.45) break;
    }
    console.log(`\n  card 1 mid-arrival: ${JSON.stringify(mid)}`);
    await page.screenshot({ path: `${OUT}/proof-stack-${tag}-mid.png` });
  }

  /* ── `--handoff`: the last card's exit, walked (ADR-096 U3) ───────────
     The share is solved so the ring's visible cards PARK as this card's
     bottom leaves the frame, so the reading that matters is the pair
     `--svc-content-in` / published hit anchors against the card's own bottom
     edge. ⚠ Runway-relative scroll throughout: the corridor inflates the
     document, so an absolute `y` means nothing between runs. */
  /* ── `--glitch`: the first card's materialisation, on a PAUSED clock ──
     (ADR-097 U11/U12.) The sweep is 720ms and a Playwright round trip is 400–900,
     so "shoot it mid-flight" is post-hoc fiction (ADR-071's own finding). It
     is REPLAYED instead: the attribute is toggled off and on to restart the
     animations, then every one of them is paused and seeked to the same
     `currentTime`. Deterministic, and the same frame comes back every run. */
  if (GLITCH.length) {
    for (let pass = 0; pass < 4; pass += 1) {
      await page.evaluate(
        ({ off, top, h }) => {
          const rw = document.querySelector(".services-stage-root");
          const y = rw.getBoundingClientRect().top + window.scrollY + off - top + h * 0.35;
          window.scrollTo(0, Math.round(y));
        },
        { off: geo.slots[0].offset, top: geo.slots[0].top, h: geo.slots[0].height }
      );
      await page.waitForTimeout(pass === 0 ? 900 : 450);
      const seated = await page.evaluate(
        () => document.querySelectorAll(".pf-slot")[0]?.getAttribute("data-pc-state") === "pinned"
      );
      if (seated) break;
    }
    const armed = await page.evaluate(() =>
      document.querySelectorAll(".pf-slot")[0]?.getAttribute("data-pf-arrive")
    );
    console.log(`\n── the glitch @ ${tag} ──────────────────────────────`);
    console.log(`  card 0 data-pf-arrive = ${armed}`);
    for (const ms of GLITCH) {
      const frame = await page.evaluate((t) => {
        const slot = document.querySelectorAll(".pf-slot")[0];
        const card = slot.querySelector(".pf-card");
        /* ⚠ CANCEL BEFORE RESTARTING. Toggling the attribute alone does not
           replace a CSS animation the WAAPI has already paused — it ADDS one,
           and the count climbed 3 → 6 → 9 across a five-frame strip while every
           computed value still looked right. */
        /* ⚠ SUBTREE. Pass 1 animates the CARD; pass 2 (ADR-104) animates
           `.pf-card__body` and the two `.pf-cardwire` halves, which are
           DESCENDANTS — `getAnimations()` on an element returns only its own,
           so without this the strip freezes pass 1 and lets pass 2 run free. */
        for (const a of card.getAnimations({ subtree: true })) a.cancel();
        slot.dataset.pfArrive = "await";
        void card.offsetWidth; // restart, not resume
        slot.dataset.pfArrive = "in";
        const anims = card.getAnimations({ subtree: true });
        for (const a of anims) {
          a.pause();
          a.currentTime = t;
        }
        const cs = getComputedStyle(card);
        const body = card.querySelector(".pf-card__body");
        const wire = card.querySelector(".pf-cardwire--l");
        return {
          anims: anims.length,
          opacity: cs.opacity,
          clip: cs.clipPath.slice(0, 46),
          /* ADR-104's pass 2: the body's window opening and the skeleton's
             left half retracting are one travelling edge pair — they must
             stay complementary at every frame. */
          body: body ? getComputedStyle(body).clipPath : null,
          wireL: wire ? getComputedStyle(wire).clipPath : null,
          wireVis: wire ? getComputedStyle(wire).visibility : null,
          filter: cs.filter === "none" ? "none" : cs.filter.slice(0, 38),
          translate: cs.translate,
        };
      }, ms);
      console.log(`  ${String(ms).padStart(4)}ms  ${JSON.stringify(frame)}`);
      await page.screenshot({
        path: `${OUT}/proof-glitch-${String(ms).padStart(4, "0")}ms-${tag}.png`,
      });
    }
    /* Hand the card back its own clock, or every still after this is frozen. */
    await page.evaluate(() => {
      const card = document.querySelectorAll(".pf-slot")[0].querySelector(".pf-card");
      for (const a of card.getAnimations({ subtree: true })) a.finish();
    });
  }

  if (HANDOFF) {
    const ex = await page.evaluate(() => {
      const pile = document.querySelector(".services-stage-root > .pf-stack");
      const slots = [...document.querySelectorAll("[data-pc-slot]")];
      const last = slots[slots.length - 1];
      const cs = getComputedStyle(last);
      const exit = (Number.parseFloat(cs.top) || 0) + last.offsetHeight;
      const gone = pile.offsetHeight - (Number.parseFloat(cs.marginBottom) || 0);
      return { exit, gone, unstick: gone - exit };
    });
    console.log(`\n── the handoff @ ${tag} ─────────────────────────────`);
    console.log(`  exit ${ex.exit}px   unstick ${ex.unstick}   gone ${ex.gone}`);
    console.log(`     % of exit    scroll   cardBottom   --svc-content-in   hits`);
    const at = async (s) => {
      for (let pass = 0; pass < 4; pass += 1) {
        await page.evaluate((rel) => {
          const rw = document.querySelector(".services-stage-root");
          window.scrollTo(0, Math.round(rw.getBoundingClientRect().top + window.scrollY + rel));
        }, s);
        await page.waitForTimeout(pass === 0 ? 500 : 260);
        const landed = await page.evaluate(() => {
          const rw = document.querySelector(".services-stage-root");
          return Math.round(-rw.getBoundingClientRect().top);
        });
        if (Math.abs(landed - s) <= 2) break;
      }
      return page.evaluate(() => {
        const card = [...document.querySelectorAll("[data-pc-slot]")]
          .at(-1)
          .querySelector(".pf-card");
        const stage = document.querySelector(".services-stage");
        const rw = document.querySelector(".services-stage-root");
        return {
          s: Math.round(-rw.getBoundingClientRect().top),
          bottom: Math.round(card.getBoundingClientRect().bottom),
          contentIn: Number.parseFloat(stage?.style.getPropertyValue("--svc-content-in") ?? "0"),
          hits: document.querySelectorAll(".svc-ring-hits__hit").length,
        };
      });
    };
    for (let f = 0; f <= 10; f += 1) {
      const r = await at(Math.round(ex.unstick + (f / 10) * ex.exit));
      console.log(
        `  ${String(f * 10).padStart(9)}%  ${String(r.s).padStart(8)}  ` +
          `${String(r.bottom).padStart(10)}   ${r.contentIn.toFixed(3).padStart(14)}   ` +
          `${String(r.hits).padStart(4)}`
      );
      if (f === 7) await page.screenshot({ path: `${OUT}/proof-handoff-70pct-${tag}.png` });
    }
    await page.screenshot({ path: `${OUT}/proof-handoff-gone-${tag}.png` });
    const past = await at(ex.gone + 120);
    console.log(`  past +120  ${JSON.stringify(past)}`);
    await page.screenshot({ path: `${OUT}/proof-handoff-past120-${tag}.png` });
  }

  /* ── `--perf`: the pile scrolled at reading speed ─────────────────────
     A rAF-delta sampler runs in the page while the wheel walks the whole
     pile; the cards are blurred glass over a live WebGL bed, and the cost of
     a `backdrop-filter` is the per-frame SNAPSHOT (ADR-056), so what matters
     is the share of long frames, not the mean. The pointer sits in the left
     margin, off the cards — the map card owns the wheel under a pointer. */
  if (PERF) {
    await page.evaluate(() => {
      const rw = document.querySelector(".services-stage-root");
      window.scrollTo(
        0,
        Math.round(rw.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5)
      );
    });
    await page.waitForTimeout(800);
    await page.mouse.move(40, Math.round(VH / 2));
    await page.evaluate(() => {
      window.__pfPerf = [];
      window.__pfPerfOn = true;
      let last = performance.now();
      const tick = (t) => {
        window.__pfPerf.push(t - last);
        last = t;
        if (window.__pfPerfOn) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const distance = geo.pileH + geo.vh * 0.5;
    for (let y = 0; y < distance; y += 80) {
      await page.mouse.wheel(0, 80);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(300);
    const perf = await page.evaluate(() => {
      window.__pfPerfOn = false;
      const d = window.__pfPerf.slice(1).sort((a, b) => a - b);
      const n = d.length;
      const mean = d.reduce((a, b) => a + b, 0) / Math.max(1, n);
      const p95 = d[Math.min(n - 1, Math.floor(n * 0.95))];
      const long = d.filter((x) => x > 33).length;
      return {
        frames: n,
        mean: +mean.toFixed(1),
        p95: +p95.toFixed(1),
        max: +d[n - 1].toFixed(1),
        longShare: +((100 * long) / Math.max(1, n)).toFixed(1),
      };
    });
    console.log(
      `\n  perf @ ${tag}: ${perf.frames} frames  mean ${perf.mean}ms  p95 ${perf.p95}ms  ` +
        `max ${perf.max}ms  >33ms ${perf.longShare}%`
    );
  }

  /* And the handoff: the offer's masthead past the release. */
  await page.evaluate((pileH) => {
    const rw = document.querySelector(".services-stage-root");
    const y = rw.getBoundingClientRect().top + window.scrollY + pileH + window.innerHeight * 1.4;
    window.scrollTo(0, Math.round(y));
  }, geo.pileH);
  await page.waitForTimeout(1200);
  const offer = await page.evaluate(() => {
    const m = document.querySelector(".services-masthead");
    const stage = document.querySelector(".services-stage");
    return {
      mastheadOpacity: m ? getComputedStyle(m).opacity : null,
      contentIn: stage ? getComputedStyle(stage).getPropertyValue("--svc-content-in").trim() : null,
      step: stage?.getAttribute("data-active-step"),
    };
  });
  console.log(`\n  offer @ +1.4vh past the pile: ${JSON.stringify(offer)}`);
  await page.screenshot({ path: `${OUT}/proof-stack-${tag}-offer.png` });

  if (errors.length) {
    console.log(`\n  ⚠ page errors:`);
    for (const e of errors.slice(0, 6)) console.log(`    ${e}`);
  }
  console.log(`\n  shots -> ${OUT}/proof-stack-${tag}-*.png\n`);
} finally {
  await browser.close();
}
