/**
 * useTurnScroll — the ONE writer for the turn AND the proposal (ADR-095,
 * extended in U5).
 *
 * Reads `#turn`'s rect once per scroll frame and drives the whole beat from
 * it, all pure functions of that rect (`turnClock.ts`):
 *   - `brandmarkMorphRef.progress` — the particle morph the corridor's
 *     parked mark and the armillary read per frame;
 *   - `brandmarkMorphRef.veil` — the mark put away once the copy owns the
 *     centre, and taken further as the proposal arrives;
 *   - the ground's wash, through a fragment shader (`turnWash.ts`) or, where
 *     WebGL is refused, a CSS gradient on the same canvas;
 *   - `--tm-*` on each `[data-tm]` product — its pose on the arc into rest,
 *     and back out of frame as the beat ends;
 *   - the copy's decode (`./turnDecode`), written straight into each
 *     `[data-tl-decode]` node, plus `--tl-cta-o` on the block;
 *   - `--tl-turn` / `data-tl-turn` on `#turn` — the smoke's observable.
 *
 * …and then, off `#proposition`'s OWN rect:
 *   - `data-tl-prop` — its ARRIVAL (ADR-099), published for the capture and
 *     the smoke to converge on. It does not drive the record's LAYOUT: that
 *     is an arc beat, and this writer touches its ground and its veil and
 *     nothing inside it.
 *   - `data-tl-prop-arrive` — `await` / `in` / `out` (ADR-101 §A), the
 *     hysteresis stamp the configuration's STRIKE hangs on. The one thing
 *     here that is not a pure function of scroll, and the reason it is a
 *     stamp rather than a channel: a burst has a direction and a memory,
 *     which a progress value does not.
 *
 * …and off `#phases`' rect, one station further down:
 *   - `--tl-seam` / `data-tl-seam` — the seam clock `t`, 0 as the plates row
 *     enters the frame and 1 when it is whole in it;
 *   - `data-tl-phases-arrive` — the same three states, off `t`.
 *
 * ⚠ ONE WRITER, THREE STATIONS, AND THAT IS DELIBERATE. This effect already
 * held `#proposition`, its canvas and its rect for the shared ground; a
 * second hook would mean two rAFs racing over one mark's veil, which has
 * exactly one owner by contract. `#offer` joins it for the same reason one
 * level on: the seam is measured between two stations, so nothing but this
 * frame can hold both rects at one instant.
 *
 * Passive listeners, one rAF, delta-gated (the `useStackedCardsScroll`
 * pattern). It parks — progress 0, veil 0, every var cleared, every line
 * restored to its true text — whenever the capable rung does not match or
 * the stage does not compute `sticky`, so the reduced-motion and phone
 * paths get the composition standing still and readable.
 *
 * THREE-FREE. The morph target's builder is reached through `load()` in the
 * spec below — a dynamic edge, so the route page's static graph stays clear
 * of `three` (landing-import-doctrine); the wash is raw WebGL and imports
 * nothing.
 */

import { useEffect } from "react";
import { brandmarkMorphRef, type BrandmarkMorphSpec } from "@/lib/brandmark/morphTargetRef";
import {
  arriveNext,
  ctaInOf,
  ctaInkOf,
  ctaOutOf,
  markVeil,
  morphOf,
  productPose,
  propArrival,
  seamLanding,
  seamProgress,
  turnProgress,
  PHASES_ARRIVE_IN,
  PHASES_ARRIVE_OUT,
  PROP_ARRIVE_IN,
  PROP_ARRIVE_OUT,
  TURN_PROP_FADE,
  washOf,
  type Arrive,
  type ProductRest,
} from "./turnClock";
import { turnDecodeFrame } from "./turnDecode";
import { createTurnWash, type TurnWash } from "./turnWash";

/** The inverse of the stack's inert rung — where the beat is live. */
export const TURN_CAPABLE_QUERY =
  "(min-width: 961px) and (min-height: 681px) and (prefers-reduced-motion: no-preference)";

/** Trinny London's coral (the Naked Ambition tube — the route's
 *  `--tl-brand-rgb`), and a lighter rim for the wireframe's limb. The WebGL
 *  golds are exempt from CSS by design, so these are literals here, beside
 *  the route token they mirror. */
export const TURN_MORPH_COLOR = "#F06850";
export const TURN_MORPH_ACCENT = "#F5907E";
export const TURN_MORPH_LIFT = 0.12;

export function trinnyMorphSpec(): BrandmarkMorphSpec {
  return {
    id: "trinny-london",
    load: () => import("../mark/buildTrinnyTarget"),
    color: TURN_MORPH_COLOR,
    accent: TURN_MORPH_ACCENT,
    lift: TURN_MORPH_LIFT,
  };
}

const PRODUCT_VARS = ["--tm-dx", "--tm-dy", "--tm-dr", "--tm-s", "--tm-o"] as const;

export function useTurnScroll(): void {
  useEffect(() => {
    const turn = document.querySelector<HTMLElement>(".tl-root #turn");
    const stage = turn?.querySelector<HTMLElement>("[data-tl-turn-stage]");
    const root = document.querySelector<HTMLElement>(".tl-root");
    if (!turn || !stage || !root) return;
    const products = Array.from(turn.querySelectorAll<HTMLElement>("[data-tm]"));
    // The LIVE layers only. Each sits absolutely over an in-flow ghost that
    // holds the true box and the accessible text, so a wider glyph run can
    // never move the block (the house decode's own markup contract).
    const lines = Array.from(turn.querySelectorAll<HTMLElement>("[data-tl-decode]"));
    const canvas = turn.querySelector<HTMLCanvasElement>("[data-tl-turn-wash]");
    // The proposal carries the SAME ground (ADR-095 U4) — same shader, same
    // token, one viewport-locked field — so the coral does not resolve out
    // from under the reader at the seam.
    const prop = document.querySelector<HTMLElement>(".tl-root #proposition");
    const propCanvas = prop?.querySelector<HTMLCanvasElement>("[data-tl-prop-wash]") ?? null;
    /* The offer, for the seam alone (ADR-101 §B). `#phases` is the beat whose
       plates the chip becomes; `#offer` is where its stamp lives, because the
       carrier layer is seated against the ROUTE and a stamp on the station is
       one selector away from every plate inside it.
       ⚠ THE STATION IS STATIC MARKUP; ITS BEATS ARE NOT. `#offer` is a nested
       root that mounts on approach, so `#phases` does not exist when this
       effect runs and a query taken here returns null FOREVER — which reads
       as a seam pinned at 0 and a beat that never strikes, with nothing
       throwing. It is resolved in `measure()` and re-resolved whenever the
       root's box changes, which is exactly the frame it mounts on. */
    const offer = document.querySelector<HTMLElement>(".tl-root #offer");
    let phases: HTMLElement | null = null;
    let seamRow: HTMLElement | null = null;
    const mq = window.matchMedia(TURN_CAPABLE_QUERY);

    // The true strings, read from the server-rendered text once. They are
    // never re-read: from here the decode owns `textContent`.
    const truth = lines.map((el) => el.textContent ?? "");

    let wash: TurnWash | null = null;
    if (canvas) {
      wash = createTurnWash(canvas, root);
      // No WebGL (or the context was refused): the same element takes a CSS
      // gradient instead. A ground with banding beats no ground at all.
      if (!wash) stage.dataset.tlWash = "css";
    }
    let propWash: TurnWash | null = null;
    if (propCanvas && prop) {
      propWash = createTurnWash(propCanvas, root);
      if (propWash) propWash.setFade(TURN_PROP_FADE);
      else prop.dataset.tlWash = "css";
    }

    let raf = 0;
    let live = false;
    let stageW = 0;
    let stageH = 0;
    let rests: ProductRest[] = [];
    /* ⚠ THE STAGE'S OWN BOX, NOT THE STATION'S. `.station` carries top
       padding — 140px at 1920×1247 — so the sticky stage pins that much
       LATER than the station's top reaches the viewport top. Measured from
       the layout (`offsetTop`/`offsetHeight`, which no transform reaches)
       once per relayout, because a clock written against the station alone
       opened the reveal 45px into a 140px travel and lit the record while it
       was still moving. */
    let lastP = -1;
    let lastQ = -1;
    let lastT = -1;
    let lastPropA = -1;
    let lastHandoff = -1;
    /* Where `#phases`' top lands when its plates row is whole in the frame.
       Measured per relayout; 0 until the beat exists, which makes the seam a
       no-op rather than a divide by nothing. */
    let seamS1 = 0;
    /* ⚠ THE TWO STRIKES ARE THE ONLY STATE THIS WRITER KEEPS, and they are
       state because a burst has a DIRECTION. Everything else here is a pure
       function of a rect and survives being recomputed from nothing. */
    let propArrive: Arrive | null = null;
    let phasesArrive: Arrive | null = null;

    /** Write a stamp only when it changes — an attribute write restarts every
     *  animation under it, so an un-gated one would re-strike every frame. */
    const stamp = (host: HTMLElement | null, name: string, was: Arrive | null, now: Arrive) => {
      if (host && was !== now) host.setAttribute(name, now);
      return now;
    };

    const park = () => {
      brandmarkMorphRef.current.progress = 0;
      brandmarkMorphRef.current.veil = 0;
      turn.style.removeProperty("--tl-turn");
      turn.removeAttribute("data-tl-turn");
      stage.style.removeProperty("--tl-wash");
      stage.style.removeProperty("--tl-cta-o");
      for (const el of products) for (const v of PRODUCT_VARS) el.style.removeProperty(v);
      lines.forEach((el, i) => {
        el.textContent = truth[i];
      });
      /* ⚠ THE PARKED PROPOSAL IS FULLY LIT, and since ADR-099 it is lit by
         construction rather than by a fail-open default. Its record is an arc
         beat with the arcs' own reveal opt-in, so on the phone and under
         reduced motion it simply stands; there is no `--tp-in` channel left
         to write, and therefore no path on which parking could hide it. */
      turn.removeAttribute("data-tl-handoff");
      // ⚠ BOTH fail open: parked, the proposal keeps its ground.
      prop?.removeAttribute("data-tl-ground");
      lastHandoff = -1;
      prop?.removeAttribute("data-tl-prop");
      /* ⚠ AND BOTH STRIKES FAIL OPEN. Parked is the phone, the short window
         and reduced motion, where the arcs' own reveal stands the record up on
         its own; an ABSENT stamp means SHOWN, exactly as the ground's does one
         rule over. Leaving `await` behind here would blank two whole beats on
         the paths that cannot un-blank them. */
      prop?.removeAttribute("data-tl-prop-arrive");
      offer?.removeAttribute("data-tl-phases-arrive");
      offer?.removeAttribute("data-tl-seam");
      offer?.style.removeProperty("--tl-seam");
      propArrive = null;
      phasesArrive = null;
      wash?.draw(0);
      propWash?.draw(0);
      prop?.style.removeProperty("--tl-wash");
      lastP = -1;
      lastQ = -1;
      lastT = -1;
      lastPropA = -1;
    };

    const measure = () => {
      live = mq.matches && getComputedStyle(stage).position === "sticky";
      stageW = stage.clientWidth;
      stageH = stage.clientHeight;
      // Layout values, transform-free: placement rides the `translate`
      // property, which `offsetLeft/Top` never see.
      rests = products.map((el) => ({
        cx: el.offsetLeft + el.offsetWidth / 2,
        cy: el.offsetTop + el.offsetHeight / 2,
      }));
      wash?.resize();
      propWash?.resize();
      phases = offer?.querySelector<HTMLElement>("#phases") ?? null;
      seamRow = phases?.querySelector<HTMLElement>(".arc-groups--plates") ?? null;
      /* ⚠ READ AS A DIFFERENCE OF TWO RECTS IN ONE FRAME, never as an
         `offsetTop` chain: `#phases` is not a positioned box, so it is not in
         its own descendants' `offsetParent` chain and the walk would run past
         it to the station. Both rects move together under scroll, so their
         difference is a layout measure however far down the page they are. */
      if (phases && seamRow) {
        const pr = phases.getBoundingClientRect();
        const rr = seamRow.getBoundingClientRect();
        seamS1 = seamLanding(window.innerHeight, rr.bottom - pr.top);
      } else {
        seamS1 = 0;
      }
    };

    const frame = () => {
      raf = 0;
      if (!live) {
        park();
        return;
      }
      /* ⚠ EVERY RECT THIS FRAME NEEDS, READ BEFORE THE FIRST STYLE WRITE.
         Five boxes across three stations; interleaving a `--tl-wash` write
         between two of them buys a forced synchronous layout per frame for
         nothing. */
      const vh = window.innerHeight;
      const rect = turn.getBoundingClientRect();
      const propRect = prop ? prop.getBoundingClientRect() : null;
      const phasesRect = phases ? phases.getBoundingClientRect() : null;
      const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
      const propCanvasRect = propCanvas ? propCanvas.getBoundingClientRect() : null;
      const p = turnProgress(rect.top, rect.height, vh);

      /* ⚠ BOTH GROUNDS ARE PAINTED BEFORE THE PROGRESS GATE BELOW, and each
         off its OWN canvas's rect.

         The field is viewport-locked, so a canvas that MOVES has to be
         repainted even when its amount has not changed — and `p` saturates at
         1 the moment `#turn` leaves, which is exactly when its stage releases
         and its canvas starts travelling. Gated with everything else, the
         turn's ground froze at the origin it held when `p` reached 1 and then
         scrolled away carrying that stale image, out of register with the
         proposal's by the height of the travel: a hard line across the seam,
         measured. The proposal's has the same problem from the other side —
         it has a viewport and a half to cross after `p` is spent.

         ⚠ And it is the CANVAS's rect, never its station's: the grounds are
         absolutely positioned and their stations carry padding of their own,
         so the two boxes differ. Each wash keeps its own delta gate, so this
         costs a rect read and nothing else. */
      if (canvasRect) {
        wash?.draw(washOf(p), canvasRect.top, canvasRect.left);
      }
      if (propWash && prop && propCanvasRect) {
        // Constant: the ground does not resolve, it FEATHERS (see
        // `TURN_PROP_FADE`). Only its origin moves, which is what keeps its
        // field continuous with the turn's across the seam.
        propWash.draw(1, propCanvasRect.top, propCanvasRect.left);
        if (lastPropA !== 1) {
          lastPropA = 1;
          prop.style.setProperty("--tl-wash", "1");
        }
      }

      /* -- The ground's handoff (U6) --------------------------------
         The two stations OVERLAP by `--tl-prop-lead` now, so for half a
         viewport after the turn's stage unpins both grounds are in the
         frame. The proposal's reaches up past the release point (see the
         CSS), so from that frame on it covers the viewport by itself and
         the turn's is simply switched off -- no cross-fade, because
         `washOf` has saturated at 1 since p 0.68 and the proposal paints
         a constant 1 on a field locked to the same origin. Same amount,
         same field: the step is a no-op on the pixels.

         ⚠ STAMPED ON THE STATION, NOT THE STAGE, so one rule reaches the
         canvas AND the no-WebGL gradient; and delta-gated, because this is
         a boolean that flips once per pass. */
      const handoff = p >= 1 ? 1 : 0;
      if (lastHandoff !== handoff) {
        lastHandoff = handoff;
        if (handoff) {
          turn.setAttribute("data-tl-handoff", "1");
          prop?.removeAttribute("data-tl-ground");
        } else {
          turn.removeAttribute("data-tl-handoff");
          prop?.setAttribute("data-tl-ground", "hold");
        }
      }

      /* ── The proposal's own clock (ADR-099) ────────────────────────────
         `q` is the station's ARRIVAL, one viewport wide. It was the pinned
         stretch of a sticky stage (U5) — blank while the section travelled,
         powering on once it stopped — and that is what left a bare frame
         between the two beats: a pin cannot begin until the thing above it
         has ended. The record scrolls in now, so the two overlap.
         ⚠ Read off `#proposition`'s rect, never the turn's: the two stations
         overlap by `--tl-prop-lead`, so the turn's `p` saturates while this
         one is still arriving — which is exactly the overlap ADR-099 wanted,
         and it can only be measured on the station that is moving. */
      const q = propRect ? propArrival(propRect.top, vh) : 0;

      /* ⚠ AND `t` JOINS THE GATE, WHICH IS NOT OPTIONAL. `p` and `q` both
         saturate the moment the record lands, so from that frame on the two
         of them agree forever — which is the WHOLE of `#offer`'s scroll. A
         gate on those two alone returns before the seam is ever read, and
         the phases' strike would simply never fire. */
      const t = phasesRect ? seamProgress(phasesRect.top, vh, seamS1) : 0;

      if (
        lastP >= 0 &&
        Math.abs(p - lastP) < 0.0005 &&
        Math.abs(q - lastQ) < 0.0005 &&
        Math.abs(t - lastT) < 0.0005
      )
        return;
      lastP = p;
      lastQ = q;
      lastT = t;

      brandmarkMorphRef.current.progress = morphOf(p);
      /* Both stations, one channel — additive. `veilOf` saturates at
         `p = 0.72` and `q` opens at `p ≈ 0.77`, so the turn hands the mark
         over rather than racing it: 0.72 by the end of the turn, 0.94 as the
         record lands (ADR-099). */
      brandmarkMorphRef.current.veil = markVeil(p, q);
      turn.style.setProperty("--tl-turn", p.toFixed(3));
      turn.setAttribute("data-tl-turn", p.toFixed(2));

      /* The arrival is still PUBLISHED — the capture and the smoke converge
         on it rather than on a solved `y`, and the ground's own swap reads
         the same rect. What it no longer drives is the record: that is an arc
         beat with the arcs' reveal, so nothing here writes its opacity. */
      prop?.setAttribute("data-tl-prop", q.toFixed(2));

      /* ⚠ THE CONFIGURATION STRIKES, IT DOES NOT RISE (ADR-101 §A). `q` is
         1 exactly when `p` is, under the 100svh lead, so the trigger frame is
         the one where the turn is spent AND the head is on its datum: the
         record is already composed and seated when the burst fires, which is
         the only way a strike can read as materialising rather than as a
         second entrance. */
      propArrive = stamp(
        prop,
        "data-tl-prop-arrive",
        propArrive,
        arriveNext(propArrive, q, PROP_ARRIVE_IN, PROP_ARRIVE_OUT)
      );

      if (offer) {
        offer.style.setProperty("--tl-seam", t.toFixed(3));
        offer.setAttribute("data-tl-seam", t.toFixed(2));
        phasesArrive = stamp(
          offer,
          "data-tl-phases-arrive",
          phasesArrive,
          arriveNext(phasesArrive, t, PHASES_ARRIVE_IN, PHASES_ARRIVE_OUT)
        );
      }

      // The channel the CSS fallback and the smoke read; the canvas itself
      // is painted above, outside this gate.
      stage.style.setProperty("--tl-wash", washOf(p).toFixed(3));

      for (let i = 0; i < products.length; i++) {
        const el = products[i];
        const k = Number(el.dataset.tm) || 0;
        const pose = productPose(k, p, rests[i], stageW, stageH, products.length);
        el.style.setProperty("--tm-dx", `${pose.dx.toFixed(1)}px`);
        el.style.setProperty("--tm-dy", `${pose.dy.toFixed(1)}px`);
        el.style.setProperty("--tm-dr", `${pose.dr.toFixed(2)}deg`);
        el.style.setProperty("--tm-s", pose.scale.toFixed(3));
        el.style.setProperty("--tm-o", pose.opacity.toFixed(3));
      }

      const pIn = ctaInOf(p);
      const pOut = ctaOutOf(p);
      stage.style.setProperty("--tl-cta-o", ctaInkOf(p).toFixed(3));
      for (let i = 0; i < lines.length; i++) {
        const next = turnDecodeFrame(truth, i, pIn, pOut);
        if (lines[i].textContent !== next) lines[i].textContent = next;
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(frame);
    };
    const relayout = () => {
      measure();
      lastP = -1;
      lastT = -1;
      schedule();
    };

    measure();
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout, { passive: true });
    mq.addEventListener("change", relayout);

    /* ⚠ AND THE NESTED ROOTS ARE WATCHED, BECAUSE THEY ARRIVE LATE. Both
       `#proposition`'s record and `#offer`'s beats are lazy roots: the
       station boxes are server-rendered and empty, and everything the seam
       measures appears inside them one approach later. A `ResizeObserver` on
       the roots fires on exactly that frame — it is the one signal that says
       'the thing you could not find is here now', and it covers a font swap
       and an image settling for free. */
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => relayout());
    if (ro) {
      for (const sel of [
        ".tl-root [data-tl-config-root]",
        ".tl-root [data-tl-offer-root]",
      ] as const) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el) ro.observe(el);
      }
    }

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", relayout);
      mq.removeEventListener("change", relayout);
      park();
      wash?.dispose();
      propWash?.dispose();
    };
  }, []);
}
