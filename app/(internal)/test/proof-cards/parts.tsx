import type { CSSProperties, ReactNode } from "react";

import { crewSeed } from "@/components/arcs/crewParticles";
import { type MapCallout, jobMap } from "@/components/arcs/jobMap";
import { DISCIPLINES } from "@/lib/arcs/content/shared/disciplines";
import type { ArcJobFigure, ArcSectionOf, ArcTitle } from "@/lib/arcs/types";

/**
 * What every direction shares: the record's words and the evidence itself.
 * The jobs are `X_BIONIC_JOBS`, read by reference (one section, one
 * record); only the housing around them is iterated here. The map is the
 * live card's own drawing (`jobMap.ts`, numbers in and paths out), so every
 * direction shows the same Drive.
 */

export type Job = ArcSectionOf<"job">;

export const two = (n: number) => String(n).padStart(2, "0");

export const KEPT = "Kept";
export const SENT_BACK = "Sent back";

export const workstreamOf = (job: Job) =>
  DISCIPLINES.find((d) => d.id === job.bucket)?.long ?? "Creative production";

export const resultLabel = (job: Job) => job.result.label ?? "Time saved";

/** The return's one sentence, the figure lit. */
export function Said({ title }: { title: ArcTitle | undefined }) {
  if (!title) return null;
  const t = title as { pre?: string; em?: string; post?: string };
  return (
    <>
      {t.pre}
      {t.em ? (
        <>
          {" "}
          <em>{t.em}</em>
        </>
      ) : null}
      {t.post ? (/^[.,;:]/.test(t.post) ? t.post : ` ${t.post}`) : null}
    </>
  );
}

/** The evidence, bare: each direction frames it. */
export function Evidence({ job }: { job: Job }) {
  const figure = job.figure;
  if (figure.kind === "clip") {
    return (
      <div className="pk-ev pk-ev--clip">
        <video
          src={figure.clip.src}
          poster={figure.clip.poster}
          aria-label={figure.clip.alt}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
    );
  }
  if (figure.kind === "pair") {
    return (
      <div className="pk-ev pk-ev--pair">
        {[figure.a, figure.b].map((f) => (
          <div key={f.src} className="pk-still" data-verdict={f.verdict}>
            <div className="pk-still__img">
              {/* eslint-disable-next-line @next/next/no-img-element -- lab, self-hosted stills */}
              <img src={f.src} alt={f.alt} />
            </div>
            <p className="pk-still__v">
              <b>{f.verdict === "kept" ? KEPT : SENT_BACK}</b>
              <span>{f.label}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  if (figure.kind === "map") return <MapField job={job} figure={figure} />;
  if (figure.kind === "flow") {
    return (
      <dl className="pk-ev pk-ev--ledger">
        {figure.steps.map((st) => (
          <div key={st.key}>
            <dt>{st.key}</dt>
            <dd>{st.notes.join(" · ")}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className="pk-ev pk-ev--ledger">
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
  const s: CSSProperties = {};
  if (c.anchor === "start") s.left = `${c.ax * 100}%`;
  else s.right = `${(1 - c.ax) * 100}%`;
  if (c.vAlign === "top") s.top = `${c.at * 100}%`;
  else s.bottom = `${(1 - c.at) * 100}%`;
  return s;
}

function MapField({ job, figure }: { job: Job; figure: Extract<ArcJobFigure, { kind: "map" }> }) {
  const d = jobMap(figure.map, figure.labels ?? [], crewSeed(job.id));
  return (
    <div className="pk-ev pk-ev--map" role="img" aria-label={figure.caption}>
      <div className="pk-map">
        <svg viewBox={`0 0 ${d.vb} ${d.vb}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          {d.tiers.map((t) =>
            t.paths.map((p) => (
              <path
                key={`${t.tier}-${p.a}`}
                className="pk-map__grain"
                data-tier={t.tier}
                fillOpacity={p.a}
                d={p.d}
              />
            ))
          )}
          {d.callouts.map((c) => (
            <g key={c.id}>
              <path className="pk-map__leader" d={c.leader} />
              <path className="pk-map__node" d={c.node} />
            </g>
          ))}
        </svg>
        {d.callouts.map((c) => (
          <p key={c.id} className="pk-map__label" style={seat(c)} aria-hidden="true">
            {c.text}
          </p>
        ))}
      </div>
    </div>
  );
}

/** A small mono key. */
export function Key({ children, n }: { children: ReactNode; n?: string }) {
  return (
    <p className="pk-key">
      {n ? <span className="pk-key__n">{n}</span> : null}
      {children}
    </p>
  );
}
