import type { CSSProperties } from "react";

import type { SessionsPageModel } from "@/lib/sessions/page";
import { FIELD_CELL } from "@/lib/sessions/field";

/**
 * The field (ADR-150) — the interstitial between the dates and the table:
 * each morning's day drawn as an ASCII numeral standing in a seeded field of
 * dots, the next one in gold (Blunarova's numerals, the hull's seeded grid).
 * A drawing, not a control: `aria-hidden`, and the dates are already
 * lettered twice above it.
 *
 * ⚠ ONE `<text>` PER ROW, its width pinned by `textLength`, so the grid
 * holds whatever PT Mono's real advance is. The glyphs are never digits.
 * It arrives once, row by row, on the page's one-shot reveal.
 */
export function SessionsField({ field }: { field: SessionsPageModel["field"] }) {
  const width = field.cols * FIELD_CELL.w;
  return (
    <section className="hs-field" aria-hidden="true" data-hs-section="field">
      <div className="hs-band hs-band--wide">
        <div className="hs-field__frame hs-reveal">
          <svg
            className="hs-field__svg"
            viewBox={`0 0 ${field.vb.w} ${field.vb.h}`}
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
          >
            {field.rows.map((row, i) => (
              <text
                key={i}
                className="hs-field__row"
                x="0"
                y={row.y}
                textLength={width}
                lengthAdjust="spacing"
                fontSize={FIELD_CELL.fs}
                xmlSpace="preserve"
                style={{ "--i": i } as CSSProperties}
              >
                {row.runs.map((run, j) => (
                  <tspan
                    key={j}
                    className={run.lit ? "hs-field__lit" : run.ink ? "hs-field__ink" : undefined}
                  >
                    {run.text}
                  </tspan>
                ))}
              </text>
            ))}
          </svg>
          {field.numerals.map((n, i) => (
            <span
              key={n.id}
              className="hs-field__label"
              data-lit={n.lit ? "" : undefined}
              style={{ "--ax": n.ax, "--at": n.foot } as CSSProperties}
            >
              {field.labels[i].text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
