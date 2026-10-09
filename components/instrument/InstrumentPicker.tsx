"use client";

import { useEffect, useRef, useState } from "react";

import type { Altitude } from "@/lib/instrument/types";

interface PickerProps {
  figureId: string;
  altitudes: readonly Altitude[];
  initial: Altitude;
  engine: "css" | "flip" | "anime";
  words: Record<Altitude, string>;
}

/** What an engine needs: the figure, the nodes that travel, the attribute swap. */
interface Move {
  fig: HTMLElement;
  nodes: HTMLElement[];
  swap: () => void;
}

const MOVING = ".ins-chip, .ins-panel, .ins-node, .ins-frame";
const DURATION = 0.36;

/** The CSS engine: the attribute changes; the sheet's transitions do the rest. */
function cutTo({ swap }: Move) {
  swap();
}

/** gsap/Flip: record the seats, swap, animate the same nodes to their new seats. */
async function flipTo({ nodes, swap }: Move) {
  /* `gsap/all`, not `gsap/Flip`: the plugin's types ship as `flip.d.ts` and
     a case-insensitive disk sees two casings of one file (TS1149). */
  const { Flip, gsap } = await import("gsap/all");
  gsap.registerPlugin(Flip);
  const state = Flip.getState(nodes, { props: "opacity" });
  swap();
  /* In flow, not absolute: taken out of the grid the housing folds under
     the nodes for the length of the move. Transforms keep the layout. */
  Flip.from(state, {
    absolute: false,
    scale: false,
    duration: DURATION,
    ease: "power3.out",
    stagger: 0.03,
    nested: true,
    /* The sheet owns every resting state (ADR-080): the sizes and the
       transform Flip wrote for the move are cleared when it lands. */
    clearProps:
      "transform,translate,rotate,scale,width,height,minWidth,minHeight,maxWidth,maxHeight,opacity",
  });
}

/** animejs: a FLIP by hand — rects before, swap, rects after, transforms to zero. */
async function animeTo({ nodes, swap }: Move) {
  const { animate } = await import("animejs");
  const before = new Map(nodes.map((n) => [n, n.getBoundingClientRect()]));
  swap();
  const moved = nodes.filter((n) => {
    const a = before.get(n);
    const b = n.getBoundingClientRect();
    return !!a && (a.width > 0 || b.width > 0);
  });
  moved.forEach((n, i) => {
    const a = before.get(n)!;
    const b = n.getBoundingClientRect();
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    const sx = b.width ? a.width / b.width : 1;
    const sy = b.height ? a.height / b.height : 1;
    n.style.transformOrigin = "0 0";
    n.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    animate(n, {
      translateX: 0,
      translateY: 0,
      scaleX: 1,
      scaleY: 1,
      duration: DURATION * 1000,
      delay: i * 30,
      ease: "outCubic",
      onComplete: () => {
        n.style.transform = "";
        n.style.transformOrigin = "";
      },
    });
  });
}

/**
 * InstrumentPicker — the breadcrumb as the one island (ADR-154).
 *
 * It writes ONE attribute, `data-altitude`, on the figure it was rendered in;
 * the sheet places the parts. The engine is loaded by `import()` on the first
 * pick only, so a page without a pick carries no gsap and no animejs (the
 * import doctrine bans their static import under `components/instrument`).
 * Under reduced motion every engine is the cut. Nothing idles: a transition
 * plays once per pick and the drawing is then still (ADR-080).
 */
export function InstrumentPicker({ figureId, altitudes, initial, engine, words }: PickerProps) {
  const [at, setAt] = useState<Altitude>(initial);
  const shown = useRef<Altitude>(initial);

  /* A pick sets the state; the move runs from the state, in an effect, so
     the handler is pure and the engine is one effect with one job. */
  useEffect(() => {
    if (at === shown.current) return;
    const fig = document.getElementById(figureId);
    if (!fig) return;
    shown.current = at;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(fig.querySelectorAll<HTMLElement>(MOVING));
    const move: Move = {
      fig,
      nodes,
      swap: () => {
        fig.setAttribute("data-altitude", at);
        const alt = fig.getAttribute(`data-alt-${at}`);
        if (alt) fig.setAttribute("aria-label", alt);
      },
    };
    if (reduced || engine === "css") cutTo(move);
    else if (engine === "flip") void flipTo(move);
    else void animeTo(move);
  }, [at, engine, figureId]);

  return (
    <nav className="ins__crumb" aria-label="Altitude" data-ins-picker={engine}>
      {altitudes.map((a) => (
        <button
          key={a}
          type="button"
          className="ins__crumb-at"
          data-on={a === at || undefined}
          aria-pressed={a === at}
          onClick={() => setAt(a)}
        >
          {words[a]}
        </button>
      ))}
    </nav>
  );
}
