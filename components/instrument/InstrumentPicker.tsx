"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const { Flip } = await import("gsap/Flip");
  const { gsap } = await import("gsap");
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
  const busy = useRef(false);

  useEffect(() => {
    setAt(initial);
  }, [initial]);

  const pick = useCallback(
    async (next: Altitude) => {
      if (busy.current || next === at) return;
      const fig = document.getElementById(figureId);
      if (!fig) return;
      /* `fig` is in the Move for the engines that need the figure's box. */
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nodes = Array.from(fig.querySelectorAll<HTMLElement>(MOVING));
      const move: Move = {
        fig,
        nodes,
        swap: () => {
          fig.setAttribute("data-altitude", next);
          const alt = fig.getAttribute(`data-alt-${next}`);
          if (alt) fig.setAttribute("aria-label", alt);
        },
      };
      busy.current = true;
      setAt(next);
      try {
        if (reduced || engine === "css") cutTo(move);
        else if (engine === "flip") await flipTo(move);
        else await animeTo(move);
      } finally {
        window.setTimeout(() => {
          busy.current = false;
        }, DURATION * 1000);
      }
    },
    [at, engine, figureId]
  );

  return (
    <nav className="ins__crumb" aria-label="Altitude" data-ins-picker={engine}>
      {altitudes.map((a) => (
        <button
          key={a}
          type="button"
          className="ins__crumb-at"
          data-on={a === at || undefined}
          aria-pressed={a === at}
          onClick={() => void pick(a)}
        >
          {words[a]}
        </button>
      ))}
    </nav>
  );
}
