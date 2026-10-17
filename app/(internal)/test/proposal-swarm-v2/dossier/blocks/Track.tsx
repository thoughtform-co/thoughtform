import type { CSSProperties } from "react";

import type { Figure, Lane } from "../types";

/**
 * Track: time on one axis. A beat sheet, a sound mix, a cut-down: lanes over
 * one ruler, each lane named beside its band, its segments' names above it on
 * plumb leaders (never on the band's face), moments marked on the band, a
 * level drawn as a filled run. HTML on percentages, so the type holds its
 * size at any width; nothing is squashed.
 */
export function Track({ figure }: { figure: Extract<Figure, { kind: "track" }> }) {
  const pct = (t: number) => `${(t / figure.length) * 100}%`;
  const minor = figure.grid ? Math.round(figure.length / figure.grid.minor) : 0;
  return (
    <div className="csd-track">
      <div className="csd-track__plot">
        {figure.lanes.map((lane) => (
          <LaneRow key={lane.label} lane={lane} pct={pct} length={figure.length} />
        ))}
        <div className="csd-track__ruler" aria-hidden="true">
          <span className="csd-track__k" />
          <div className="csd-track__axis">
            {figure.grid
              ? Array.from({ length: minor + 1 }, (_, i) => {
                  const t = i * figure.grid!.minor;
                  const major =
                    Math.abs(t / figure.grid!.major - Math.round(t / figure.grid!.major)) < 1e-6;
                  return (
                    <i
                      key={i}
                      className={
                        major ? "csd-track__tick csd-track__tick--major" : "csd-track__tick"
                      }
                      style={{ left: pct(t) }}
                    />
                  );
                })
              : null}
            {figure.scale.map((t) => (
              <span key={t} className="csd-track__at" style={{ left: pct(t) }}>
                {t}
                {figure.unit}
              </span>
            ))}
          </div>
        </div>
      </div>
      {figure.frames?.length ? (
        <ol
          className="csd-track__frames"
          style={{ gridTemplateColumns: `repeat(${figure.frames.length}, minmax(0, 1fr))` }}
        >
          {figure.frames.map((f) => (
            <li key={f.label}>
              <div
                className="csd-track__frame"
                style={{ "--r": f.still.ratio.replace("/", " / ") } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- lab: published stills, fixed box */}
                <img src={f.still.src} alt={f.still.alt} loading="lazy" decoding="async" />
              </div>
              <span>{f.label}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {figure.key ? <p className="csd-track__key">{figure.key}</p> : null}
    </div>
  );
}

/** Rough mono width of a label, as a share of the band: enough to stagger. */
const CH_SHARE = 1.45;

function LaneRow({
  lane,
  pct,
  length,
}: {
  lane: Lane;
  pct: (t: number) => string;
  length: number;
}) {
  /* the segment names, staggered onto as many rows as they need */
  const named = (lane.segments ?? []).filter((s) => s.label);
  const rows: number[] = [];
  const seat = named.map((s) => {
    const x = (s.from / length) * 100;
    const w = (s.label ?? "").length * CH_SHARE + 2;
    let r = 0;
    while (rows[r] !== undefined && rows[r] > x) r += 1;
    rows[r] = x + w;
    return r;
  });
  const marks = lane.marks ?? [];
  const nRows = Math.max(rows.length, marks.length ? 1 : 0);
  return (
    <div className="csd-lane" style={{ "--rows": nRows } as CSSProperties}>
      <p className="csd-track__k">{lane.label}</p>
      <div className="csd-lane__body">
        <div className="csd-lane__names" aria-hidden="true">
          {named.map((s, i) => (
            <span
              key={`${s.label}-${s.from}`}
              className="csd-lane__name"
              data-lit={s.lit ? "" : undefined}
              style={{ left: pct(s.from), "--row": seat[i] } as CSSProperties}
            >
              {s.label}
            </span>
          ))}
          {marks.map((m) => (
            <span
              key={`${m.label}-${m.at}`}
              className="csd-lane__mark"
              data-lit={m.lit ? "" : undefined}
              style={{ left: pct(m.at), "--row": 0 } as CSSProperties}
            >
              {m.label}
            </span>
          ))}
        </div>
        <div className="csd-lane__band">
          {(lane.segments ?? []).map((s) => (
            <i
              key={`${s.from}-${s.to}`}
              className="csd-lane__seg"
              data-lit={s.lit ? "" : undefined}
              style={{ left: pct(s.from), width: pct(s.to - s.from) }}
            />
          ))}
          {lane.level ? (
            <i
              className="csd-lane__level"
              style={{
                clipPath: `polygon(${[
                  ...lane.level.map(([t, v]) => `${(t / length) * 100}% ${(1 - v) * 100}%`),
                  `${(lane.level[lane.level.length - 1][0] / length) * 100}% 100%`,
                  `${(lane.level[0][0] / length) * 100}% 100%`,
                ].join(", ")})`,
              }}
            />
          ) : null}
          {(lane.ticks ?? []).map((t) => (
            <i key={t} className="csd-lane__tick" style={{ left: pct(t) }} />
          ))}
          {marks.map((m) => (
            <i
              key={`p-${m.at}`}
              className="csd-lane__plumb"
              data-lit={m.lit ? "" : undefined}
              style={{ left: pct(m.at) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
