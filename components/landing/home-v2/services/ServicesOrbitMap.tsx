"use client";

import { pointOnEllipse } from "@/lib/celestial/orbits";
import { SERVICE_ORBITS } from "./celestialData";

/**
 * ServicesOrbitMap — the SVG celestial layer of the Services stage.
 *
 * A precise, minimal orrery drawn around the parked brandmark particle
 * core (the "sun" at the SVG origin). One tilted elliptical orbit per
 * service; a small node rides each orbit. Inactive orbits stay faint;
 * the active orbit (keyed off the stage's `[data-active-step]` in
 * `services.css`) brightens and reveals a halo + registration tick on its
 * node. The nodes are drifted by `useOrbitDrift`, which writes a
 * `transform` on each `.svc-orbit__node-rot` group every frame.
 *
 * Pure presentation: this component exposes only `data-i` hooks; all
 * emphasis/visibility is CSS-driven. The center is intentionally left
 * empty — the particle sun is the center marker, so no reticle competes
 * with it.
 *
 * Layer scope: `pointer-events: none` overlay, centered over the same
 * point the R3F core parks at (viewport optical center). Composites in
 * front of the ambient interior-sphere particles behind `#services`
 * (ADR-008 transparent-stage exception).
 */
export function ServicesOrbitMap() {
  return (
    <div className="services-orbit-map" aria-hidden="true">
      <svg
        className="services-orbit-map__svg"
        viewBox="-140 -140 280 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        {SERVICE_ORBITS.map((o) => {
          // Resting position (psi0) — rendered as the SVG transform attribute
          // so SSR / pre-hydration / reduced-motion park the node correctly
          // before useOrbitDrift takes over via style.transform.
          const rest = pointOnEllipse(o.orbit.rx, o.orbit.ry, o.orbit.rotateDeg, o.psi0Deg);
          return (
            <g className="svc-orbit" data-i={o.i} key={o.id}>
              <ellipse
                className="svc-orbit__path"
                cx={0}
                cy={0}
                rx={o.orbit.rx}
                ry={o.orbit.ry}
                transform={`rotate(${o.orbit.rotateDeg})`}
                fill="none"
                stroke={o.line.stroke}
                strokeWidth={o.line.strokeWidth}
                strokeDasharray={`${o.line.dashMark} ${o.line.dashGap}`}
                strokeLinecap={o.line.lineCap}
                vectorEffect="non-scaling-stroke"
              />
              <g
                className="svc-orbit__node-rot"
                data-i={o.i}
                transform={`translate(${rest.x} ${rest.y})`}
              >
                {/* Active-only emphasis: open halo ring around the node. */}
                <circle
                  className="svc-orbit__halo"
                  r={5.5}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth={0.6}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Active-only registration tick above the node. */}
                <path
                  className="svc-orbit__tick"
                  d="M0 -9 L0 -6"
                  stroke="var(--gold)"
                  strokeWidth={0.6}
                  vectorEffect="non-scaling-stroke"
                />
                {/* The planet/body. */}
                <circle className="svc-orbit__node" r={2.1} />
                {/* Sparse mono label — the service index (e.g. "01"). */}
                <text className="svc-orbit__label" x={6.5} y={-5}>
                  {o.label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
