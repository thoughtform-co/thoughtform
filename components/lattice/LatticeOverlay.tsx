import type { CSSProperties } from "react";

/**
 * The ruled underlay the lab draws FROM the tokens (ADR-149 §4, `?grid=1`):
 * thirteen column edges as N/12 of the BAND's own box (never `--lat-col` × N:
 * that token is `100vw`-based and overshoots by the scrollbar, 6px at the last
 * edge on the first capture), thirteen rungs on `--lat-rung-N`, and the band's
 * two edges. Every line is one absolute
 * element on its own token — never a grid, whose last edge would be a cell's
 * border rather than an edge of its own — so a token that drifts from the
 * live rail tick shows as a doubled line against the HUD's own. Lab-only in
 * use; the class lives in the shared sheet so the capture measures the same
 * thing the lab shows. A server component, `aria-hidden`, pointer-inert.
 */
const EDGES = Array.from({ length: 13 }, (_, n) => n);

export function LatticeOverlay() {
  return (
    <div className="lat-overlay" aria-hidden="true">
      <div className="lat-overlay__cols">
        {EDGES.map((n) => (
          <div
            key={`col-${n}`}
            className="lat-overlay__colline"
            data-col={n}
            style={{ left: `calc(100% * ${n} / var(--lat-cols))` } as CSSProperties}
          />
        ))}
      </div>
      {EDGES.map((n) => (
        <div
          key={`rung-${n}`}
          className="lat-overlay__rung"
          data-rung={n}
          style={{ top: `var(--lat-rung-${n})` } as CSSProperties}
        />
      ))}
      <div className="lat-overlay__edge" data-edge="left" style={{ left: "var(--lat-margin)" }} />
      <div className="lat-overlay__edge" data-edge="right" style={{ right: "var(--lat-margin)" }} />
    </div>
  );
}
