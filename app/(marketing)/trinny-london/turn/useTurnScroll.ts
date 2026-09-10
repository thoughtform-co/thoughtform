/**
 * useTurnScroll — the turn's ONE writer (ADR-095).
 *
 * Reads `#turn`'s rect once per scroll frame and drives the whole beat from
 * it, all pure functions of that rect (`turnClock.ts`):
 *   - `brandmarkMorphRef.progress` — the particle morph the corridor's
 *     parked mark and the armillary read per frame;
 *   - `brandmarkMorphRef.veil` — the mark put away once the copy owns the
 *     centre;
 *   - the ground's wash, through a fragment shader (`turnWash.ts`) or, where
 *     WebGL is refused, a CSS gradient on the same canvas;
 *   - `--tm-*` on each `[data-tm]` product — its pose on the arc into rest;
 *   - the copy's decode (`decodeText.ts`), written straight into each
 *     `[data-tl-decode]` node, plus `--tl-cta-o` on the block;
 *   - `--tl-turn` / `data-tl-turn` on `#turn` — the smoke's observable.
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
  morphOf,
  productPose,
  turnProgress,
  veilOf,
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
    let lastP = -1;
    let lastPropA = -1;

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
      wash?.draw(0);
      propWash?.draw(0);
      prop?.style.removeProperty("--tl-wash");
      lastP = -1;
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

      if (lastP >= 0 && Math.abs(p - lastP) < 0.0005) return;
      lastP = p;

      brandmarkMorphRef.current.progress = morphOf(p);
      brandmarkMorphRef.current.veil = veilOf(p);
      turn.style.setProperty("--tl-turn", p.toFixed(3));
      turn.setAttribute("data-tl-turn", p.toFixed(2));

      // The channel the CSS fallback and the smoke read; the canvas itself
      // is painted above, outside this gate.
      stage.style.setProperty("--tl-wash", washOf(p).toFixed(3));

      for (let i = 0; i < products.length; i++) {
        const el = products[i];
        const k = Number(el.dataset.tm) || 0;
        const pose = productPose(k, p, rests[i], stageW, stageH);
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
