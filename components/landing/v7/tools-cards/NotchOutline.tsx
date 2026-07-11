"use client";

import { useEffect, useRef } from "react";

export type Corner = "tl" | "tr" | "bl" | "br";

/**
 * NotchOutline — the card's chamfer border, as SVG.
 *
 * A CSS border can't trace a chamfered silhouette — `clip-path` on the fill
 * layer would shave it at the cut corner (ADR-007 / BEST-PRACTICES "Polygon
 * Cards: Separate Background from Border") — so the outline is an SVG
 * polygon in native pixel space, mounted inside `.pcl-card` but painting
 * OUTSIDE the fill clip. One 3px diamond tick (rotated square — shape law:
 * diamonds, not circles) marks the chamfer midpoint.
 *
 * ResizeObserver watches the HOST card (RO never delivers a usable
 * contentRect for an <svg>; Chrome reports it empty) and reads
 * offsetWidth/offsetHeight — NOT getBoundingClientRect, which would bake in
 * the recession scale the covered card carries (PlateWireOutline precedent).
 */
export function NotchOutline({ corner, notch }: { corner: Corner; notch: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const polyRef = useRef<SVGPolygonElement>(null);
  const tickRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const host = svg?.closest<HTMLElement>(".pcl-card");
    if (!svg || !host) return;

    const apply = () => {
      const w = host.offsetWidth;
      const h = host.offsetHeight;
      if (w <= 0 || h <= 0) return;
      const ch = notch;
      const points =
        corner === "tr"
          ? `0,0 ${w - ch},0 ${w},${ch} ${w},${h} 0,${h}`
          : corner === "tl"
            ? `${ch},0 ${w},0 ${w},${h} 0,${h} 0,${ch}`
            : corner === "br"
              ? `0,0 ${w},0 ${w},${h - ch} ${w - ch},${h} 0,${h}`
              : `0,0 ${w},0 ${w},${h} ${ch},${h} 0,${h - ch}`;
      polyRef.current?.setAttribute("points", points);

      const tick =
        corner === "tr"
          ? [w - ch / 2, ch / 2]
          : corner === "tl"
            ? [ch / 2, ch / 2]
            : corner === "br"
              ? [w - ch / 2, h - ch / 2]
              : [ch / 2, h - ch / 2];
      tickRef.current?.setAttribute("transform", `translate(${tick[0]} ${tick[1]}) rotate(45)`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    return () => ro.disconnect();
  }, [corner, notch]);

  return (
    <svg ref={svgRef} className="pcl-notch" aria-hidden="true">
      <polygon ref={polyRef} className="pcl-notch__line" />
      <rect ref={tickRef} className="pcl-notch__tick" x="-1.5" y="-1.5" width="3" height="3" />
    </svg>
  );
}
