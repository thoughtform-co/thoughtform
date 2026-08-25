"use client";

/**
 * ArcProgramCourse — the seven stations, in both of their layouts.
 *
 * ⚠ ONE TREE, TWO LAYOUTS. The markup is exactly what the flat board renders,
 * so the FALLBACK is byte-identical by construction rather than by inspection
 * — which matters more than usual here, because `arc-portfolio-smoke` runs
 * with WebGL DISABLED and the fallback is the only thing it can see. Flat, the
 * stylesheet places each station at `left: var(--at)` in its derived lane.
 * Live, this component writes a transform per frame from the anchors the scene
 * publishes, and the leader line runs back down the ring's own rim.
 *
 * ⚠ ADR-080 U2 BUILT TRACKED LABELS AND REJECTED THEM, ON ARITHMETIC: seven
 * three-line blocks against a 377px anchor spread. Both terms changed in U3 —
 * the spread roughly tripled with the lens and the beat's height, and the
 * note moved to a hover so a block is two lines. The rejection is superseded
 * by a changed premise, not overruled.
 *
 * ⚠ NOT A SCROLL WRITER (ADR-002). It reads a module ref and writes inline
 * transforms on seven elements. The rAF is gated three ways — the mode
 * attribute, an IntersectionObserver, and document visibility — because the
 * anchors cannot change while any of those is false.
 */

import { type CSSProperties, useEffect, useRef } from "react";

import { readHoloAnchors } from "@/components/holo-program/holoAnchorsRef";
import {
  labelMetrics,
  layoutHoloLabels,
  type LabelBox,
} from "@/components/holo-program/holoLabelLayout";
import type { ArcSectionOf } from "@/lib/arcs/types";

type Waypoints = ArcSectionOf<"program">["waypoints"];

export function ArcProgramCourse({ waypoints }: { waypoints: Waypoints }) {
  const navRef = useRef<HTMLElement | null>(null);
  const leadRef = useRef<SVGPathElement | null>(null);
  const items = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const section = nav.closest("section");

    let raf = 0;
    let onScreen = false;
    let tracking = false;

    /* ⚠ THE STALE-TRANSFORM PATH IS THE ONE THAT CAN BREAK THE FALLBACK.
       A canvas error resets `data-holo` to "static" and the flat board comes
       back — with seven stations frozen at whatever transform the last live
       frame wrote. Clear on every stop, and on unmount. */
    const clear = () => {
      for (const el of Object.values(items.current)) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
      }
      if (leadRef.current) leadRef.current.setAttribute("d", "");
      tracking = false;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (section?.getAttribute("data-holo") !== "live" || document.visibilityState !== "visible") {
        if (tracking) clear();
        return;
      }
      const w = nav.clientWidth;
      const h = nav.clientHeight;
      if (w === 0 || h === 0) return;
      const anchors = readHoloAnchors();
      if (anchors.length === 0) return;

      const m = labelMetrics(w);
      const boxes = layoutHoloLabels(anchors, { w, h }, m);
      let d = "";
      for (const b of boxes) {
        const el = items.current[b.id];
        if (!el) continue;
        if (!b.visible) {
          el.style.opacity = "0";
          continue;
        }
        /* ⚠ THE WHOLE TRANSFORM IS WRITTEN HERE, CENTRING INCLUDED. The lab
           writes a translate on the same element whose CSS declares
           `translate3d(-50%, 0, 0)`, and the inline write REPLACES it — so
           every lab label hangs from its anchor by the left edge and only the
           margin half of the offset survives. One element, one write, nothing
           for the cascade to lose. */
        el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) translate3d(-50%, -50%, 0)`;
        el.style.opacity = String(0.42 + b.frontness * 0.58);
        el.style.zIndex = String(Math.round(b.frontness * 100));
        d += leaderPath(b, m);
      }
      /* One path for all seven leaders — one DOM write per frame, not seven. */
      if (leadRef.current) leadRef.current.setAttribute("d", d);
      tracking = true;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting === onScreen) return;
        onScreen = e.isIntersecting;
        if (onScreen) {
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
          raf = 0;
          clear();
        }
      },
      { rootMargin: "20% 0px" }
    );
    io.observe(nav);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clear();
    };
  }, []);

  return (
    <nav
      className="arc-prog__stns"
      aria-label="The trajectory, and what each part opens"
      ref={navRef}
    >
      {/* The leader lines. One path, rebuilt per frame; it carries whatever
          the declutter had to move, so a pushed label still reads as
          belonging to its ring. */}
      <svg className="arc-prog__leads" aria-hidden="true" focusable="false">
        <path ref={leadRef} d="" />
      </svg>
      <ol>
        {waypoints.map((wp, i) => {
          const Tag = wp.target ? "a" : "span";
          return (
            <li
              className="arc-prog__stn"
              key={wp.id}
              data-wp={wp.id}
              data-lane={i % 2 === 0 ? "up" : "dn"}
              data-seat={wp.seat ? "" : undefined}
              style={{ "--at": `${wp.at * 100}%` } as CSSProperties}
              ref={(el) => {
                items.current[wp.id] = el;
              }}
            >
              <Tag className="arc-prog__stn-hit" {...(wp.target ? { href: `#${wp.target}` } : {})}>
                {wp.sub ? <span className="arc-prog__stn-date">{wp.sub}</span> : null}
                <span className="arc-prog__stn-lbl">{wp.label}</span>
                {wp.note ? <span className="arc-prog__stn-note">{wp.note}</span> : null}
              </Tag>
              <i className="arc-prog__stn-stem" aria-hidden="true" />
              <i className="arc-prog__stn-dia" aria-hidden="true" />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** From the rim anchor to the block's near edge, as one `M…L…` run. */
function leaderPath(b: LabelBox, m: { blockW: number; blockH: number }): string {
  const dx = b.x - b.ax;
  const dy = b.y - b.ay;
  const len = Math.hypot(dx, dy) || 1;
  // Stop the line at the block's boundary rather than at its centre.
  const t = Math.max(0, len - Math.min(m.blockH / 2, m.blockW / 2)) / len;
  const ex = b.ax + dx * t;
  const ey = b.ay + dy * t;
  return `M${b.ax.toFixed(1)} ${b.ay.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
}
