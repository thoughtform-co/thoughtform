"use client";

import { useEffect, useRef } from "react";

/** Seed chamfer size (`--ch: 16px` in services.css). The outline only exists
 *  at seed rest geometry — it fades out before the open morph grows the
 *  chamfer to 26px (see `.svc-plate__wire` visibility rules), so it never
 *  needs to track `--ch`. */
const CH = 16;

/**
 * PlateWireOutline — the wireframe seed's dotted chamfer outline
 * (ADR-025 Update 8, "wireframe seeds").
 *
 * A CSS border can't trace the plate's chamfered silhouette — `clip-path`
 * on `.svc-plate__sh` would shave it at the cut corners (the ADR-007 /
 * BEST-PRACTICES "Polygon Cards: Separate Background from Border" class of
 * bug) — so the outline is an SVG polygon in native pixel space, mounted as
 * a sibling AFTER `.svc-plate__sh` (paints above the shell, outside the
 * clip). Stroke styling lives in services.css (`.svc-plate__wire-line`,
 * dasharray 3 7 — the scan-connector grammar) so the ink stays tunable next
 * to the rest of the plate rules.
 *
 * Two 3px diamond ticks (rotated squares — shape law: diamonds, not
 * circles) sit at the chamfer midpoints. A ResizeObserver keeps the polygon
 * true through `--plate-width` changes and viewport resizes; RO fires
 * per-frame during CSS size transitions, which covers the close tail as the
 * card settles back to seed geometry.
 */
export function PlateWireOutline() {
  const svgRef = useRef<SVGSVGElement>(null);
  const polyRef = useRef<SVGPolygonElement>(null);
  const tickTopRightRef = useRef<SVGRectElement>(null);
  const tickBottomLeftRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    // Observe the HOST PLATE, not the svg: ResizeObserver never delivers a
    // usable contentRect for an <svg> element (Chrome reports it empty), so
    // observing the svg leaves the polygon point-less. The plate article is
    // a normal CSS box and the svg is inset:0 inside it — same geometry.
    const host = svg?.closest<HTMLElement>(".svc-plate");
    if (!svg || !host) return;

    const apply = () => {
      // offsetWidth/Height = untransformed layout box (getBoundingClientRect
      // would bake in any ancestor transform the stage picks up).
      const w = host.offsetWidth;
      const h = host.offsetHeight;
      if (w <= 0 || h <= 0) return;
      polyRef.current?.setAttribute(
        "points",
        `0,0 ${w - CH},0 ${w},${CH} ${w},${h} ${CH},${h} 0,${h - CH}`
      );
      tickTopRightRef.current?.setAttribute(
        "transform",
        `translate(${w - CH / 2} ${CH / 2}) rotate(45)`
      );
      tickBottomLeftRef.current?.setAttribute(
        "transform",
        `translate(${CH / 2} ${h - CH / 2}) rotate(45)`
      );
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  return (
    <svg ref={svgRef} className="svc-plate__wire" aria-hidden="true">
      <polygon ref={polyRef} className="svc-plate__wire-line" />
      <rect
        ref={tickTopRightRef}
        className="svc-plate__wire-tick"
        x="-1.5"
        y="-1.5"
        width="3"
        height="3"
      />
      <rect
        ref={tickBottomLeftRef}
        className="svc-plate__wire-tick"
        x="-1.5"
        y="-1.5"
        width="3"
        height="3"
      />
    </svg>
  );
}
