"use client";

import { useEffect } from "react";

import { clearPrelude, writePrelude } from "@/lib/home-v2/corridorPreludeRef";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";
import {
  aboutVoidwalkerHandoffRef,
  isAboutVoidwalkerHandoffReady,
  isValidViewportRect,
} from "@/lib/voidwalker/aboutVoidwalkerHandoff";
import { voidwalkerHologramProgressRef } from "@/lib/voidwalker/voidwalkerHologramClock";

import {
  measureCarrier,
  parkCarrier,
  reseatNameGlide,
  writeCarrier,
  type CarrierMeasure,
} from "./aboutFlowCarrier";
import {
  ABOUT_ERA_PIN_U,
  A_BOX_OUT,
  A_OUT,
  CARD_FLIGHT,
  DECK_SQUARE,
  FOLD,
  RINGS_CLOSE,
  TRAVEL,
  aboutState,
  aboutU,
  apertureHalf,
  apertureFeather,
  apertureHalfMax,
  apertureInset,
  cardFlight,
  easedWindow,
  flowState,
  featherStops,
  windowOf,
  type AboutState,
  type FeatherStops,
  type FlowState,
  type Rect,
} from "./flowClock";

/**
 * useWorkshopFlow — the one writer for the workshop's opening flow on
 * /arcs/thoughtform/workshop-v1 (ADR-138): About hands into the eras as it does
 * on `/`, and the eras hand into the Arc through the parked brandmark.
 *
 * WHAT IT READS. `#about`'s rect (the About's clock), the era stage's own
 * published progress (`voidwalkerHologramProgressRef`, written by its hook,
 * `useVoidwalkerHologramScroll`), that hook's handoff targets
 * (`aboutVoidwalkerHandoffRef`: the figure's portrait seat and the era
 * title's rect, both where they will be once the era pins), and the corridor's
 * live brandmark shell, where the seam lands.
 *
 * WHAT IT WRITES, AND ONLY THAT.
 *   · `data-tw-flow` (`about` → `era` → `seam` → `done`) and `data-tw-about`
 *     (`hold` → `run` → `done`) on `.tw-root`;
 *   · the corridor's PRELUDE (`corridorPreludeRef`): the parked mark behind
 *     the About and the eras, its travel onto the thesis anchor, its fold
 *     into the glyph, and the square the thesis frame opens through;
 *   · `--tw-*` custom properties on the elements that consume them, the fact
 *     row's `clip-path`, and the carrier's leaves.
 * ⚠ NEVER the shared bus (`data-active-station`, `data-corridor-*`,
 * `--hero-lift`) and ⚠ NEVER `transform`, `opacity` or `clip-path` on a
 * `[data-m]` node — the reveal owns those, so the card flies on the
 * individual `translate` / `scale` properties.
 *
 * ⚠ IT RUNS EVERY FRAME THROUGH THE SEAM, not only on scroll: the glyph the
 * aperture centres on rides the corridor's follower and settles after the
 * wheel stops.
 *
 * ⚠ ABSENT MEANS SHOWN. Off the capable rung, before the corridor or the era
 * stage exists, or before the era's hook has measured its targets, nothing is
 * stamped and `park()` has cleared every write: hero → a static About → the
 * eras in flow → the corridor.
 */

export const WORKSHOP_FLOW_QUERY =
  "(min-width: 1101px) and (prefers-reduced-motion: no-preference)";
const FLOW_ATTR = "data-tw-flow";
const ABOUT_ATTR = "data-tw-about";

interface Dom {
  root: HTMLElement;
  about: HTMLElement;
  stage: HTMLElement;
  layer: HTMLElement;
  name: HTMLElement;
  role: HTMLElement;
  bios: HTMLElement[];
  boxes: HTMLElement[];
  orbit: HTMLElement;
  portrait: HTMLElement;
  labels: HTMLElement[];
  era: HTMLElement;
}

function resolveDom(): Dom | null {
  const root = document.querySelector<HTMLElement>(".tw-root");
  const about = root?.querySelector<HTMLElement>("#about");
  const stage = about?.querySelector<HTMLElement>("[data-tw-about-stage]");
  const layer = stage?.querySelector<HTMLElement>("[data-tw-flow-layer]");
  const name = about?.querySelector<HTMLElement>(".voidwalker__name");
  const role = about?.querySelector<HTMLElement>(".voidwalker__role");
  const bios = about ? Array.from(about.querySelectorAll<HTMLElement>(".voidwalker__bio")) : [];
  const boxes = about
    ? Array.from(about.querySelectorAll<HTMLElement>(".voidwalker__meta, .voidwalker__links"))
    : [];
  const orbit = about?.querySelector<HTMLElement>(".voidwalker__orbit");
  const portrait = orbit?.querySelector<HTMLElement>(".voidwalker__orbit__portrait");
  const labels = orbit
    ? Array.from(orbit.querySelectorAll<HTMLElement>(".voidwalker__orbit__label"))
    : [];
  const era = root?.querySelector<HTMLElement>("#voidwalker");
  if (!root || !about || !stage || !layer || !name || !role || !orbit || !portrait || !era) {
    return null;
  }
  return { root, about, stage, layer, name, role, bios, boxes, orbit, portrait, labels, era };
}

/** The live corridor frame the seam lands on — present once the lazy chunk
 *  has mounted, and not on the corridor's own fallback. */
interface Corridor {
  stage: HTMLElement;
  shell: HTMLElement;
}

function resolveCorridor(root: HTMLElement): Corridor | null {
  const stage = root.querySelector<HTMLElement>(".home-v2-stage");
  const shell = root.querySelector<HTMLElement>(".home-v2-projected-brandmark");
  if (!stage || !shell || stage.dataset.fallback === "true") return null;
  return { stage, shell };
}

const px = (v: number) => `${v.toFixed(2)}px`;

/** The soft square's mask stops, as `<prefix>x0…x3` / `<prefix>y0…y3`. */
function writeStops(root: HTMLElement, prefix: string, stops: FeatherStops): void {
  for (let i = 0; i < 4; i++) {
    root.style.setProperty(`${prefix}x${i}`, px(stops.x[i]!));
    root.style.setProperty(`${prefix}y${i}`, px(stops.y[i]!));
  }
}

const SEAM_VARS = ["--tw-ap", "--tw-apg"].flatMap((p) =>
  [0, 1, 2, 3].flatMap((i) => [`${p}x${i}`, `${p}y${i}`])
);

export function useWorkshopFlow(): void {
  useEffect(() => {
    let dom = resolveDom();
    if (!dom) return;
    const mq = window.matchMedia(WORKSHOP_FLOW_QUERY);

    let capable = false;
    let flow: FlowState | null = null;
    let about: AboutState | null = null;
    let raf = 0;
    let corridor: Corridor | null = null;
    let carrier: CarrierMeasure | null = null;
    let carriesName = false;
    /** The name's glide end has been moved onto the pinned title's box. */
    let reseated = false;
    /** Viewport, transform-free: the card's resting box. */
    let cardBox: Rect | null = null;
    /** The glyph's centre, kept so a closed aperture has somewhere to sit
     *  before the corridor is armed and the shell is laid out. */
    let glyphCentre: [number, number] = [window.innerWidth * 0.72, window.innerHeight * 0.5];
    /* The era's progress is written by its OWN rAF, which may run after this
       one in the same frame: a scroll that stops would leave the flow on the
       previous frame's `p` (measured: "done" at p 0.986 on the way back up).
       So every scroll buys a short tail of frames, and a `p` that is still
       moving keeps the loop alive until it settles. */
    let tail = 0;
    let lastP = Number.NaN;
    const TAIL_FRAMES = 3;

    const d = () => dom!;

    /** Every About write back to identity. */
    const resetAbout = () => {
      const { orbit, boxes, role, layer } = d();
      for (const p of [
        "--tw-ring",
        "--tw-deck-fan",
        "--tw-card-dx",
        "--tw-card-dy",
        "--tw-card-s",
      ]) {
        orbit.style.removeProperty(p);
      }
      for (const b of boxes) b.style.removeProperty("clip-path");
      role.style.removeProperty("--tw-rule");
      parkCarrier(layer);
    };

    const resetSeam = () => {
      const { root } = d();
      for (const name of SEAM_VARS) root.style.removeProperty(name);
    };

    const park = () => {
      if (!dom) return;
      resetAbout();
      resetSeam();
      d().root.removeAttribute(FLOW_ATTR);
      d().root.removeAttribute(ABOUT_ATTR);
      clearPrelude();
      flow = null;
      about = null;
      carrier = null;
      carriesName = false;
    };

    /** The era title's seat, as the era stage's hook published it. */
    const eraSeat = () => {
      const h = aboutVoidwalkerHandoffRef.current;
      const title = d().era.querySelector<HTMLElement>('[data-vwh-handoff-target="era-title"]');
      if (!title || !isValidViewportRect(h.eraTitleRect)) return null;
      const text = title.getAttribute("aria-label") ?? "";
      if (!text) return null;
      return {
        left: h.eraTitleRect.cx - h.eraTitleRect.w / 2,
        top: h.eraTitleRect.cy - h.eraTitleRect.h / 2,
        cs: getComputedStyle(title),
        text,
      };
    };

    /** Everything that changes only with layout. */
    const remeasure = () => {
      const { stage, layer, name, role, bios, labels, orbit, portrait } = d();
      /* The card's RESTING box, from its painted one: the flight is a
         translate + a uniform scale about the centre, so the values last
         written invert it exactly (a remeasure mid-flight, on a resize or a
         reload, still gets the rest box). `offset*` would be transform-free
         too, but it rounds to whole pixels, and the seat is fractional:
         measured, the card landed ~1px wide of it. */
      const pr = portrait.getBoundingClientRect();
      const read = (name: string, fallback: number) => {
        const v = parseFloat(orbit.style.getPropertyValue(name));
        return Number.isFinite(v) ? v : fallback;
      };
      const dx = read("--tw-card-dx", 0);
      const dy = read("--tw-card-dy", 0);
      const s = read("--tw-card-s", 1) || 1;
      const w = pr.width / s;
      const h = pr.height / s;
      cardBox = {
        x: pr.left + pr.width / 2 - dx - w / 2,
        y: pr.top + pr.height / 2 - dy - h / 2,
        w,
        h,
      };
      const seat = eraSeat();
      carrier = measureCarrier(layer, stage, { name, role, bios, labels }, seat);
      carriesName = !!seat;
      reseated = false;
    };

    const writeAbout = (u: number) => {
      const { orbit, boxes, role, layer } = d();
      orbit.style.setProperty("--tw-ring", (1 - easedWindow(u, RINGS_CLOSE)).toFixed(4));
      orbit.style.setProperty("--tw-deck-fan", (1 - easedWindow(u, DECK_SQUARE)).toFixed(4));
      const seat = aboutVoidwalkerHandoffRef.current.portraitSeat;
      if (cardBox && isValidViewportRect(seat)) {
        const f = cardFlight(
          cardBox,
          { x: seat.cx - seat.w / 2, y: seat.cy - seat.h / 2, w: seat.w, h: seat.h },
          windowOf(u, CARD_FLIGHT)
        );
        orbit.style.setProperty("--tw-card-dx", px(f.dx));
        orbit.style.setProperty("--tw-card-dy", px(f.dy));
        orbit.style.setProperty("--tw-card-s", f.s.toFixed(5));
      }
      const shut = apertureInset(1 - easedWindow(u, A_BOX_OUT));
      for (const b of boxes) {
        b.style.clipPath = `inset(0 ${shut.toFixed(2)}% 0 ${shut.toFixed(2)}%)`;
      }
      role.style.setProperty("--tw-rule", (1 - easedWindow(u, A_OUT)).toFixed(4));
      if (carrier) writeCarrier(layer, carrier, u);
    };

    /** The seam: the prelude's channels and the square, from the era's `p`. */
    const writeSeam = (p: number, live: boolean) => {
      const { root } = d();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let glyph: Rect | null = null;
      if (corridor) {
        const r = corridor.shell.getBoundingClientRect();
        if (r.width > 1 && r.height > 1) {
          glyph = { x: r.left, y: r.top, w: r.width, h: r.height };
          glyphCentre = [r.left + r.width / 2, r.top + r.height / 2];
        }
      }
      const [cx, cy] = glyphCentre;
      const soft = apertureFeather(vh);
      const half = apertureHalf(p, apertureHalfMax(cx, cy, vw, vh, soft));
      /* The soft edge never runs past the centre: a small square peaks there
         instead of folding its two ramps over each other. The core and the
         masks read the same width, so the band the mark fades out across is
         the band the frame fades in across. */
      const feather = Math.min(soft, half);
      writePrelude({
        level: live ? 1 : 0,
        travel: easedWindow(p, TRAVEL),
        fold: easedWindow(p, FOLD),
        aperture: live ? { cx, cy, half, feather } : null,
      });
      writeStops(root, "--tw-ap", featherStops(0, 0, cx, cy, half, feather));
      const g = glyph ?? { x: cx, y: cy, w: 0, h: 0 };
      writeStops(root, "--tw-apg", featherStops(g.x, g.y, cx, cy, half, feather));
    };

    const frame = () => {
      raf = 0;
      if (!capable || !dom) return;
      if (!dom.about.isConnected) {
        park();
        dom = resolveDom();
        if (!dom) return;
      }
      if (!corridor || !corridor.shell.isConnected) corridor = resolveCorridor(dom.root);
      const vwClock = voidwalkerHologramProgressRef.current;
      const ready =
        !!corridor &&
        vwClock.engaged &&
        isAboutVoidwalkerHandoffReady(aboutVoidwalkerHandoffRef.current);
      /* No corridor, or the era stage has not engaged and measured yet: the
         page is the static About over the eras in flow. */
      if (!ready) {
        if (flow) park();
        return;
      }

      const p = vwClock.progress;
      const moving = p !== lastP;
      lastP = p;
      const nextFlow = flowState(p);
      if (nextFlow !== flow) {
        dom.root.setAttribute(FLOW_ATTR, nextFlow);
        flow = nextFlow;
      }
      writeSeam(p, nextFlow !== "done");

      const u = aboutU(dom.about.getBoundingClientRect().top, layoutViewportHeight());
      const nextAbout = aboutState(u);
      if (nextAbout !== about) {
        dom.root.setAttribute(ABOUT_ATTR, nextAbout);
        if (nextAbout === "hold") resetAbout();
        else if (about === "hold" || about === null) remeasure();
        about = nextAbout;
      }
      if (nextAbout === "run") {
        if (!carriesName && eraSeat()) remeasure();
        if (carriesName && carrier && !reseated && u >= ABOUT_ERA_PIN_U) {
          const title = dom.era.querySelector<HTMLElement>('[data-vwh-handoff-target="era-title"]');
          const t = title?.getBoundingClientRect();
          if (t && t.width > 0) {
            reseatNameGlide(carrier, t.left, t.top);
            reseated = true;
          }
        }
        writeAbout(u);
      }

      /* The glyph under the square rides the follower; so does the square. */
      if (nextFlow === "seam" || moving || tail > 0) {
        if (tail > 0) tail -= 1;
        schedule();
      }
    };

    function schedule() {
      if (!raf) raf = window.requestAnimationFrame(frame);
    }
    const onScroll = () => {
      tail = TAIL_FRAMES;
      schedule();
    };

    const evaluate = () => {
      if (!dom) return;
      const next = mq.matches && getComputedStyle(dom.stage).position === "sticky";
      if (!next && capable) park();
      capable = next;
      if (capable && about && about !== "hold") remeasure();
      schedule();
    };

    let disposed = false;
    evaluate();
    /* The era stage and the corridor both mount after this effect runs, and
       neither announces itself: a light poll until the flow is up. */
    const poll = window.setInterval(() => {
      if (flow) return;
      schedule();
    }, 250);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", evaluate, { passive: true });
    mq.addEventListener("change", evaluate);
    document.fonts?.ready
      .then(() => {
        if (!disposed) evaluate();
      })
      .catch(() => {});

    return () => {
      disposed = true;
      window.clearInterval(poll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", evaluate);
      mq.removeEventListener("change", evaluate);
      if (raf) window.cancelAnimationFrame(raf);
      park();
    };
  }, []);
}
