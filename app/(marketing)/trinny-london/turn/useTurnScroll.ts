/**
 * useTurnScroll — the turn's ONE writer (ADR-095).
 *
 * Reads `#turn`'s rect once per scroll frame and writes three things from
 * it, all pure functions of that rect (`turnClock.ts`):
 *   - `brandmarkMorphRef.current.progress` — the particle morph clock the
 *     corridor's parked mark and the armillary read per frame;
 *   - `--tl-turn` / `data-tl-turn` on `#turn` — the smoke's observable;
 *   - `--tm-dx/-dy/-dr/-s/-o` on each `[data-tm]` product — its pose on the
 *     arc into rest. The CSS places the product from those five vars with
 *     the `translate` / `rotate` / `scale` properties, so the images never
 *     carry `data-parallax` (that channel writes `translate` too, and is
 *     dead inside a pinned stage anyway — it derives from the element's
 *     live rect, which does not move while the stage is stuck).
 *
 * Passive listeners, one rAF, delta-gated, the `useStackedCardsScroll`
 * pattern. It parks (progress 0, every var cleared) whenever the capable
 * rung does not match or the stage does not compute `sticky` — the route's
 * inert media rung is the CSS's, and the stage's computed position is the
 * truth, read on measure rather than per frame.
 *
 * THREE-FREE. The morph target's builder is reached through `load()` in
 * the spec below — a dynamic edge, so the route page's static graph stays
 * clear of `three` (landing-import-doctrine).
 */

import { useEffect } from "react";
import { brandmarkMorphRef, type BrandmarkMorphSpec } from "@/lib/brandmark/morphTargetRef";
import { morphOf, productPose, turnProgress, type ProductRest } from "./turnClock";

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
    if (!turn || !stage) return;
    const products = Array.from(turn.querySelectorAll<HTMLElement>("[data-tm]"));
    const mq = window.matchMedia(TURN_CAPABLE_QUERY);

    let raf = 0;
    let live = false;
    let stageW = 0;
    let stageH = 0;
    let rests: ProductRest[] = [];
    let lastP = -1;

    const park = () => {
      brandmarkMorphRef.current.progress = 0;
      turn.style.removeProperty("--tl-turn");
      turn.removeAttribute("data-tl-turn");
      for (const el of products) for (const v of PRODUCT_VARS) el.style.removeProperty(v);
      lastP = -1;
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
    };

    const frame = () => {
      raf = 0;
      if (!live) {
        park();
        return;
      }
      const rect = turn.getBoundingClientRect();
      const p = turnProgress(rect.top, rect.height, window.innerHeight);
      if (lastP >= 0 && Math.abs(p - lastP) < 0.0005) return;
      lastP = p;
      brandmarkMorphRef.current.progress = morphOf(p);
      turn.style.setProperty("--tl-turn", p.toFixed(3));
      turn.setAttribute("data-tl-turn", p.toFixed(2));
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
    };
  }, []);
}
