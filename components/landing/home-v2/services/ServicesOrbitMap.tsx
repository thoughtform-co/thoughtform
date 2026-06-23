"use client";

import { pointOnEllipse } from "@/lib/celestial/orbits";
import { SERVICE_ORBITS } from "./celestialData";

/**
 * ServicesOrbitMap — the SVG celestial layer of the Services stage.
 *
 * Subtle celestial cartography around the parked brandmark particle core
 * (the "sun" at the SVG origin):
 *
 *   - CARTOGRAPHY (`.svc-cartography`): a few concentric guide rings in
 *     varied line types (thin solid · fine dotted · dashed) plus a sparse
 *     scatter of faint stars. Quiet star-chart backdrop — NO heavy axes,
 *     NO tick scales (deliberately removed).
 *   - ORBITS (`.svc-orbit`): one tilted ellipse per service in a distinct
 *     weight/tint (fine warm · bold bright · medium cool), each carrying a
 *     small body that slowly drifts (`useOrbitDrift`). The orbit lines
 *     DRAW ON — they wrap around the mark as the section arrives (the
 *     stroke-dashoffset reveal is scrubbed by `--svc-content-in` in
 *     services.css, echoing the corridor sphere enveloping the mark).
 *     `pathLength={100}` normalizes every ellipse so one dash length === the
 *     full circumference regardless of size.
 *
 * The bodies are AMBIENT — decoupled from the cards (the cards point at the
 * brandmark via a leader, not at these bodies). Pure presentation;
 * `pointer-events: none`. Composites in front of the ambient interior-
 * sphere particles behind `#services` (ADR-008 transparent-stage exception).
 */

/** Faint background stars (viewBox units; kept clear of the central mark). */
const STARS: ReadonlyArray<{ x: number; y: number; r: number; o: number }> = [
  { x: -118, y: -84, r: 0.7, o: 0.5 },
  { x: -92, y: 96, r: 0.5, o: 0.35 },
  { x: -134, y: 18, r: 0.6, o: 0.45 },
  { x: -64, y: -120, r: 0.5, o: 0.3 },
  { x: 40, y: -128, r: 0.7, o: 0.5 },
  { x: 118, y: -70, r: 0.6, o: 0.4 },
  { x: 132, y: 24, r: 0.5, o: 0.35 },
  { x: 96, y: 104, r: 0.7, o: 0.45 },
  { x: 18, y: 132, r: 0.5, o: 0.3 },
  { x: -40, y: 126, r: 0.6, o: 0.4 },
  { x: 128, y: -118, r: 0.5, o: 0.3 },
  { x: -126, y: -120, r: 0.55, o: 0.35 },
  { x: 74, y: 70, r: 0.5, o: 0.25 },
  { x: -78, y: -40, r: 0.45, o: 0.22 },
];

export function ServicesOrbitMap() {
  return (
    <div className="services-orbit-map" aria-hidden="true">
      <svg
        className="services-orbit-map__svg"
        viewBox="-140 -140 280 280"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Celestial cartography (quiet backdrop) ───────────────── */}
        <g className="svc-cartography">
          {/* faint stars */}
          <g className="svc-cartography__stars" fill="var(--dawn, #ebe3d6)">
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
            ))}
          </g>
          {/* concentric guide rings — three distinct line types */}
          {/* thin solid (inner boundary, just outside the mark) */}
          <circle
            cx={0}
            cy={0}
            r={63}
            fill="none"
            stroke="var(--dawn, #ebe3d6)"
            strokeOpacity={0.14}
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
          {/* dashed (outer) */}
          <circle
            cx={0}
            cy={0}
            r={134}
            fill="none"
            stroke="var(--dawn, #ebe3d6)"
            strokeOpacity={0.2}
            strokeWidth={0.5}
            strokeDasharray="5 6"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {/* ── Orbits + ambient drifting bodies ─────────────────────── */}
        <g className="svc-orbits">
          {SERVICE_ORBITS.map((o) => {
            // Resting position (psi0) as the SVG transform attribute, so
            // SSR / pre-hydration / reduced-motion park the body correctly
            // before useOrbitDrift takes over via style.transform.
            const rest = pointOnEllipse(o.orbit.rx, o.orbit.ry, o.orbit.rotateDeg, o.psi0Deg);
            return (
              <g className="svc-orbit" data-i={o.i} key={o.id}>
                {/* Solid orbits DRAW ON: `pathLength={100}` normalizes the
                    dash so the stroke-dashoffset reveal (services.css) wraps
                    the full ellipse evenly. NB: NO `non-scaling-stroke` — it
                    makes the browser ignore `pathLength` and break the draw-on
                    into partial arcs. The dotted orbit instead carries its dot
                    `stroke-dasharray` inline and fades in (a dotted line can't
                    draw-on cleanly). Stroke weight scales with the orbit. */}
                <ellipse
                  className={`svc-orbit__path${o.line.dotted ? " svc-orbit__path--dotted" : ""}`}
                  cx={0}
                  cy={0}
                  rx={o.orbit.rx}
                  ry={o.orbit.ry}
                  pathLength={o.line.dotted ? undefined : 100}
                  transform={`rotate(${o.orbit.rotateDeg})`}
                  fill="none"
                  stroke={o.line.stroke}
                  strokeWidth={o.line.strokeWidth}
                  strokeLinecap={o.line.lineCap}
                  strokeDasharray={
                    o.line.dotted ? `${o.line.dashMark} ${o.line.dashGap}` : undefined
                  }
                />
                <g
                  className="svc-orbit__node-rot"
                  data-i={o.i}
                  transform={`translate(${rest.x} ${rest.y})`}
                >
                  <circle className="svc-orbit__node" r={2.1} />
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
