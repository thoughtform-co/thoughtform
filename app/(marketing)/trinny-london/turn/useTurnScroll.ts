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
 * …and then, off `#proposition`'s OWN rect (U5):
 *   - `--tp-in` / `data-tl-prop` on `#proposition` — its elements' power-on,
 *     which is opacity ONLY and starts after its stage has pinned, so the
 *     record appears in place instead of riding a slab up the screen;
 *   - the same house decode on its title.
 *
 * ⚠ ONE WRITER, TWO STATIONS, AND THAT IS DELIBERATE. This effect already
 * held `#proposition`, its canvas and its rect for the shared ground; a
 * second hook would mean two rAFs racing over one mark's veil, which has
 * exactly one owner by contract.
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
  ctaInOf,
  ctaInkOf,
  ctaOutOf,
  markVeil,
  morphOf,
  productPose,
  propInOf,
  propPinnedProgress,
  turnProgress,
  TURN_PROP_FADE,
  washOf,
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
    const propStage = prop?.querySelector<HTMLElement>("[data-tl-prop-stage]") ?? null;
    const propLines = prop
      ? Array.from(prop.querySelectorAll<HTMLElement>("[data-tl-decode]"))
      : [];
    const mq = window.matchMedia(TURN_CAPABLE_QUERY);

    // The true strings, read from the server-rendered text once. They are
    // never re-read: from here the decode owns `textContent`.
    const truth = lines.map((el) => el.textContent ?? "");
    const propTruth = propLines.map((el) => el.textContent ?? "");

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
    let propPadTop = 0;
    let propStageH = 0;
    let lastP = -1;
    let lastQ = -1;
    let lastPropA = -1;
    let lastHandoff = -1;

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
      /* ⚠ THE PARKED PROPOSAL IS FULLY LIT, not blank. Its channel is a
         REVEAL — absent, the CSS reads `var(--tp-in, 1)` and the record
         simply stands, which is what the phone and the reduced-motion paths
         must get. Writing 0 here would hide the whole proposal on exactly
         the paths that have no way to un-hide it. */
      turn.removeAttribute("data-tl-handoff");
      // ⚠ BOTH fail open: parked, the proposal keeps its ground.
      prop?.removeAttribute("data-tl-ground");
      lastHandoff = -1;
      prop?.style.removeProperty("--tp-in");
      prop?.removeAttribute("data-tl-prop");
      propLines.forEach((el, i) => {
        el.textContent = propTruth[i];
      });
      wash?.draw(0);
      propWash?.draw(0);
      prop?.style.removeProperty("--tl-wash");
      lastP = -1;
      lastQ = -1;
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
      if (propStage) {
        propPadTop = propStage.offsetTop;
        propStageH = propStage.offsetHeight;
      }
      wash?.resize();
      propWash?.resize();
    };

    const frame = () => {
      raf = 0;
      if (!live) {
        park();
        return;
      }
      const rect = turn.getBoundingClientRect();
      const p = turnProgress(rect.top, rect.height, window.innerHeight);

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
      if (canvas) {
        const cr = canvas.getBoundingClientRect();
        wash?.draw(washOf(p), cr.top, cr.left);
      }
      if (propWash && prop) {
        // Constant: the ground does not resolve, it FEATHERS (see
        // `TURN_PROP_FADE`). Only its origin moves, which is what keeps its
        // field continuous with the turn's across the seam.
        const pr = propCanvas!.getBoundingClientRect();
        propWash.draw(1, pr.top, pr.left);
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

      /* ── The proposal's own clock (U5) ─────────────────────────────────
         Its stage is pinned exactly as the turn's is, and `q` is how far
         into that PINNED stretch the reader has come — 0 for the whole
         approach, which is what lets the record sit blank while its section
         travels and power on only once it has stopped. That is the whole
         mechanism: nothing has to slide, because nothing is visible while
         anything is moving.
         ⚠ Read off `#proposition`'s rect, never the turn's: the two stations
         are adjacent, so the turn's `p` saturates at 1 a viewport before
         this one's pin and would light the record mid-travel. */
      let q = 0;
      if (prop && propStage) {
        const prRect = prop.getBoundingClientRect();
        q = propPinnedProgress(prRect.top, prRect.height, propPadTop, propStageH);
      }

      if (lastP >= 0 && Math.abs(p - lastP) < 0.0005 && Math.abs(q - lastQ) < 0.0005) return;
      lastP = p;
      lastQ = q;

      brandmarkMorphRef.current.progress = morphOf(p);
      /* Both stations, one channel — additive, and `q` is 0 through the
         whole turn, so this IS `veilOf(p)` there to the last bit. */
      brandmarkMorphRef.current.veil = markVeil(p, q);
      turn.style.setProperty("--tl-turn", p.toFixed(3));
      turn.setAttribute("data-tl-turn", p.toFixed(2));

      if (prop) {
        const tp = propInOf(q);
        prop.style.setProperty("--tp-in", tp.toFixed(3));
        prop.setAttribute("data-tl-prop", q.toFixed(2));
        for (let i = 0; i < propLines.length; i++) {
          // One direction only: the proposal does not un-type. The turn's
          // copy leaves because its stage is being handed over; this record
          // stays readable as the reader scrolls past it.
          const next = turnDecodeFrame(propTruth, i, tp, 0);
          if (propLines[i].textContent !== next) propLines[i].textContent = next;
        }
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
      schedule();
    };

    measure();
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout, { passive: true });
    mq.addEventListener("change", relayout);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", relayout);
      mq.removeEventListener("change", relayout);
      park();
      wash?.dispose();
      propWash?.dispose();
    };
  }, []);
}
