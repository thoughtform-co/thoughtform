import type { CSSProperties } from "react";

import { BREAKDOWN_KEPT, BREAKDOWN_REJECTED } from "@/components/arcs/ArcBreakdown";
import { ArcClipLoop } from "@/components/arcs/ArcClipLoop";
import { type MapCallout, jobMap } from "@/components/arcs/jobMap";
import type { ArcJobFigure } from "@/lib/arcs/types";

/* The job card's figure, COPIED from `components/arcs/ArcJob.tsx`
   (`Evidence`, `JobMap`, `JobFlow`, `seat`, `two`, `thousands`), which does
   not export them and which this lab may not edit. Markup and classes are
   production's to the letter, so `leverage.css` and `job-stack.css` style
   it unchanged. On a pick, the direction's delta goes into `ArcJob.tsx` and
   this copy is deleted. */

export const two = (n: number) => String(n).padStart(2, "0");
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export function Evidence({ figure, seed }: { figure: ArcJobFigure; seed: number }) {
  if (figure.kind === "clip") {
    return (
      <div className="arc-case__clip">
        <ArcClipLoop clip={figure.clip} />
      </div>
    );
  }
  if (figure.kind === "pair") {
    return (
      <div className="arc-case__pair" data-job-ratio={figure.ratio}>
        {[figure.a, figure.b].map((f) => (
          <div key={f.src} className="arc-case__still" data-job-verdict={f.verdict}>
            {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted stills at their own size, the arcs' idiom */}
            <img src={f.src} alt={f.alt} loading="lazy" decoding="async" />
            <p className="arc-case__verdict">
              <b>{f.verdict === "kept" ? BREAKDOWN_KEPT : BREAKDOWN_REJECTED}</b>
              {f.label}
            </p>
          </div>
        ))}
      </div>
    );
  }
  if (figure.kind === "map") {
    return <JobMap figure={figure} seed={seed} />;
  }
  if (figure.kind === "flow") {
    return <JobFlow figure={figure} />;
  }
  return (
    <dl className="arc-case__ledger">
      {figure.rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function seat(c: MapCallout): CSSProperties {
  const style: CSSProperties = {};
  if (c.anchor === "start") style.left = `${c.ax * 100}%`;
  else style.right = `${(1 - c.ax) * 100}%`;
  if (c.vAlign === "top") style.top = `${c.at * 100}%`;
  else style.bottom = `${(1 - c.at) * 100}%`;
  return style;
}

function JobMap({
  figure,
  seed,
}: {
  figure: Extract<ArcJobFigure, { kind: "map" }>;
  seed: number;
}) {
  const d = jobMap(figure.map, figure.labels ?? [], seed);
  const named = d.callouts.map((c) => c.text.toLowerCase());
  const label =
    `${thousands(figure.map.total)} items in ${figure.map.clusters.length} groups, one grain each` +
    (named.length ? `; the largest groups named: ${named.join(", ")}.` : ".");
  return (
    <div className="arc-case__map" role="img" aria-label={label}>
      <svg
        className="arc-case__map-svg"
        viewBox={`0 0 ${d.vb} ${d.vb}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        {d.tiers.map((t) =>
          t.paths.map((p) => (
            <path
              key={`${t.tier}-${p.a}`}
              className="arc-case__map-grain"
              data-map-tier={t.tier}
              fillOpacity={p.a}
              d={p.d}
            />
          ))
        )}
        {d.callouts.map((c) => (
          <g key={c.id}>
            <path className="arc-case__map-leader" d={c.leader} />
            <path className="arc-case__map-node" d={c.node} />
          </g>
        ))}
      </svg>
      {d.callouts.map((c) => (
        <p
          key={c.id}
          className="arc-case__map-label"
          data-map-seat={c.id}
          style={seat(c)}
          aria-hidden="true"
        >
          {c.text}
        </p>
      ))}
    </div>
  );
}

function JobFlow({ figure }: { figure: Extract<ArcJobFigure, { kind: "flow" }> }) {
  const label = figure.steps.map((s) => s.key).join(", then ");
  return (
    <ol className="arc-case__flow" aria-label={label}>
      {figure.steps.map((s, i) => (
        <li key={s.key} className="arc-case__flow-step" data-lit={s.lit ? true : undefined}>
          <p className="arc-case__flow-key">
            <span>{two(i + 1)}</span>
            {s.key}
          </p>
          <ul className="arc-case__flow-notes">
            {s.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          {figure.check && figure.check.at === i ? (
            <p className="arc-case__flow-check">
              <b>{figure.check.key}</b>
              {figure.check.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
