import type { CSSProperties } from "react";

/**
 * The street hunt (2016) — a map plate: two streets crossing on a hairline
 * grid, the closure across one of them, a crowd of dots converging on the
 * pin. The one gold object is the LURE chip at the pin — the thing he
 * placed; the crowd is green, the flow. Labels: HUNT · KAMMENSTRAAT ·
 * STREET CLOSED · CROWD · LURE.
 */

/** The crowd, as percentages of the map — drifting in from every edge
 *  toward the pin at (58, 54). Hand-placed so no two overlap. */
const CROWD: readonly [number, number, number?][] = [
  [12, 18],
  [22, 34],
  [9, 58],
  [18, 76],
  [34, 86],
  [30, 12],
  [46, 24],
  [42, 66],
  [50, 84],
  [70, 16],
  [84, 30],
  [90, 52],
  [80, 72],
  [66, 88],
  [62, 36, 1],
  [48, 46, 1],
  [72, 60, 1],
];

export function HuntWireframe() {
  return (
    <div className="vw-wire vw-wire--hunt" aria-hidden="true">
      <div className="vw-wire__in">
        <div className="vw-wire__hd">
          <span className="vw-wire__lbl">HUNT</span>
          <span className="vw-wire__lbl">KAMMENSTRAAT</span>
        </div>
        <div className="vw-wire__hu-map">
          <i className="vw-wire__hu-street vw-wire__hu-street--v" />
          <i className="vw-wire__hu-street vw-wire__hu-street--h" />
          <i className="vw-wire__hu-closure" />
          <span className="vw-wire__hu-crowd">
            {CROWD.map(([x, y, near], i) => (
              <i
                key={i}
                data-near={near ? "" : undefined}
                style={{ ["--x" as string]: `${x}%`, ["--y" as string]: `${y}%` } as CSSProperties}
              />
            ))}
          </span>
          <span className="vw-wire__hu-pin">
            <i className="vw-wire__hu-diamond" />
            <span className="vw-wire__cta" data-gold="">
              <span className="vw-wire__lbl">LURE</span>
            </span>
          </span>
        </div>
        <div className="vw-wire__ft">
          <span className="vw-wire__lbl vw-wire__lbl--grn vw-wire__hu-key">CROWD</span>
          <span className="vw-wire__lbl vw-wire__hu-key vw-wire__hu-key--closed">
            STREET CLOSED
          </span>
        </div>
      </div>
    </div>
  );
}
