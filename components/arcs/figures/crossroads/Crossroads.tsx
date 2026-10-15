import type { ArcFigureSpec } from "@/lib/arcs/types";

import { headDrawing } from "./head";

type CrossroadsSpec = Extract<ArcFigureSpec, { id: "crossroads" }>;

/**
 * Crossroads — the talk's conclusion (ADR-156 U3): one anonymous head, split
 * down the nose line. The left half is particles, the human: what only people
 * make together. The right half is the contour lines of a machine, the one
 * gold object: the intelligence. A dashed seam above and below marks where
 * the road forks; each way is named on its own side.
 *
 * ⚠ SERVER, NO STATE. The head is procedural (`head.ts`), nobody's face.
 */
export function Crossroads({ spec }: { spec: CrossroadsSpec }) {
  const d = headDrawing();
  return (
    <div className="arc-fig__cross" data-fig="crossroads">
      <p className="arc-fig__way" data-side="human">
        <span className="arc-fig__block-name">{spec.human.label}</span>
        {spec.human.line}
      </p>
      <figure className="arc-fig__head" aria-label={spec.alt}>
        <svg viewBox={`0 0 ${d.w} ${d.h}`} aria-hidden="true">
          <path
            className="arc-fig__seam"
            d={`M${d.seamX.toFixed(1)} -40 L${d.seamX.toFixed(1)} 40 M${d.seamX.toFixed(1)} ${d.h - 40} L${d.seamX.toFixed(1)} ${d.h + 40}`}
          />
          {d.dots.map((p, i) => (
            <circle key={i} className="arc-fig__particle" cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={p.r.toFixed(2)} />
          ))}
          {d.lines.map((l, i) => (
            <path key={i} className="arc-fig__contour" d={l} />
          ))}
        </svg>
      </figure>
      <p className="arc-fig__way" data-side="machine">
        <span className="arc-fig__block-name">{spec.machine.label}</span>
        {spec.machine.line}
      </p>
    </div>
  );
}
