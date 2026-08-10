// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC LAB — the plate renderer. A pure function of the
// composition: SSR-safe, deterministic, no state.
//
// The bind is a ONE-INK drawing like the tome references — hierarchy
// comes from stroke weight, not color. Line-work rides `--gold-line`
// (the LINE role of the gold ramp: #caa554 dark, #8a6b20 at 3.6:1 on
// parchment). The apparatus — leaders, labels, plate chrome — is the
// second ink: dawn, like a scholar's annotations over the ritual.
// ═══════════════════════════════════════════════════════════════════

import type { BindComposition, MarkPrimitive } from "@/lib/daemoniac/types";
import { PLATE_CANVAS } from "@/lib/daemoniac/types";
import { primitiveD } from "@/lib/daemoniac/primitives";

/** The script register (glyphs, ideograms) is the one organic register
 *  on the surface — round caps on purpose, documented in GRAMMAR.md.
 *  Everything structural keeps the house squared cut. */
const ROUND_ROLES = new Set<MarkPrimitive["role"]>(["glyph", "ideogram"]);

export interface BindPlateProps {
  composition: BindComposition;
  /** Leaders + margin labels. The drawing works without them. */
  showApparatus?: boolean;
  /** Extra chrome: frame hairline, catalog no, designation. */
  showChrome?: boolean;
  className?: string;
}

export function BindPlate({
  composition,
  showApparatus = true,
  showChrome = true,
  className,
}: BindPlateProps) {
  const { marks, apparatus, meta, record } = composition;
  const vb = `${PLATE_CANVAS.x} ${PLATE_CANVAS.y} ${PLATE_CANVAS.width} ${PLATE_CANVAS.height}`;

  return (
    <svg
      className={className}
      viewBox={vb}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`The bind of ${record.name} — ${meta.figLabel}`}
    >
      {/* The bind — one ink, weight-hierarchied. */}
      <g stroke="var(--gold-line)">
        {marks.map((m, i) => (
          <path
            key={i}
            d={primitiveD(m)}
            strokeWidth={m.weight}
            strokeLinecap={ROUND_ROLES.has(m.role) ? "round" : "butt"}
          />
        ))}
      </g>

      {/* The apparatus — the scholar's ink. */}
      {showApparatus && apparatus.length > 0 && (
        <g className="dae-plate__apparatus">
          {apparatus.map((a, i) => (
            <g key={i}>
              <path
                d={a.leader.map(([x, y], j) => `${j === 0 ? "M" : "L"} ${x} ${y}`).join(" ")}
                stroke="rgba(var(--dawn-rgb), 0.4)"
                strokeWidth={0.3}
              />
              <text
                x={a.lx}
                y={a.ly}
                textAnchor={a.align === "left" ? "start" : "end"}
                className="dae-plate__note"
              >
                {a.text}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Plate chrome — archival, PT Mono, zero radius. */}
      {showChrome && (
        <g className="dae-plate__chrome">
          <rect
            x={-160}
            y={-160}
            width={320}
            height={320}
            stroke="var(--dawn-08)"
            strokeWidth={0.5}
          />
          <text x={-154} y={-149} className="dae-plate__label" textAnchor="start">
            {meta.figLabel}
          </text>
          <text x={154} y={-149} className="dae-plate__label" textAnchor="end">
            {meta.catalogNo}
          </text>
          <text x={-154} y={155} className="dae-plate__label" textAnchor="start">
            {record.name.toUpperCase()}
          </text>
          <text x={154} y={155} className="dae-plate__label" textAnchor="end">
            DAEMONIAC
          </text>
        </g>
      )}
    </svg>
  );
}
