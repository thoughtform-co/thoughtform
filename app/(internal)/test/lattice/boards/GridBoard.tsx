"use client";

import { useEffect, useLayoutEffect, useState } from "react";

import { measureLattice, type LatticeReport } from "@/lib/lattice/measure";

/**
 * The grid board: an empty band one viewport tall under the overlay (the
 * shell forces it on for this board) and a LEGEND listing each column edge
 * and each rung as MEASURED beside the value it is expected to agree with.
 * "Seated" is two numbers agreeing — the token laid out against the frame's
 * own tick, the token chain against a second derivation of the same edge —
 * never a boolean the page asserts about itself.
 */
export function GridBoard() {
  const [report, setReport] = useState<LatticeReport | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- the legend IS a read of
     the laid-out document; it cannot exist before layout. */
  useLayoutEffect(() => {
    setReport(measureLattice(document));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const onResize = () => setReport(measureLattice(document));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="lat-grid-board" data-lat-grid-board="">
      <dl className="lat-legend" aria-label="The lattice, measured">
        <div className="lat-legend__head">
          <dt>columns</dt>
          <dd>
            {report ? `${report.seated.columns}/${report.columns.length} seated` : "measuring"}
          </dd>
        </div>
        {report?.columns.map((c) => (
          <div className="lat-legend__row" key={`c${c.n}`} data-off={c.delta > 1 || undefined}>
            <dt>c{c.n}</dt>
            <dd>
              {c.x} · {c.expected} · Δ{c.delta}
            </dd>
          </div>
        ))}
        <div className="lat-legend__head">
          <dt>rungs</dt>
          <dd>
            {report
              ? `${report.seated.rungs}/${report.rungs.length} seated · ${report.ticks} ticks · rail ${report.rail}`
              : "measuring"}
          </dd>
        </div>
        {report?.rungs.map((r) => (
          <div className="lat-legend__row" key={`r${r.n}`} data-off={r.delta > 1.5 || undefined}>
            <dt>r{r.n}</dt>
            <dd>
              {r.y} · {Number.isFinite(r.tick) ? r.tick : "—"} · Δ
              {Number.isFinite(r.delta) ? r.delta : "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
