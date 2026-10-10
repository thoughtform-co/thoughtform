import type { CSSProperties, ReactNode } from "react";

import type { StackSide, StackTier } from "./stackLayout";
import { deckDrop, stackPaths, stackSeats } from "./stackLayout";

/** A callout beside a plate: a mono label, lines under it, an optional chip. */
export interface StackCallout {
  label: string;
  lines?: readonly string[];
  chip?: string;
}

/** A tile on the deck: the discipline, the workstream, the role. */
export interface StackTileWord {
  id: string;
  bucket: string;
  name: string;
  line?: string;
  lit?: boolean;
}

export interface StackFigureProps {
  id: string;
  /** Bottom-up or top-down: the drawing sorts. */
  tiers: readonly StackTier[];
  /** The one tier lit gold: the layer, by the house's law. */
  lit?: StackTier;
  /** The words beside each plate. A tier with no callout draws bare. */
  callouts: Readonly<Partial<Record<StackTier, StackCallout>>>;
  /** The tiles on the deck (with `tiers` including "tiles"). */
  tiles?: readonly StackTileWord[];
  /** The courses on the layer: the skills, then the evaluations. */
  courses?: { skills: readonly string[]; evals: readonly string[] };
  alt: string;
  className?: string;
  /** Which side each tier's words sit; the house default is `STACK_SIDES`. */
  sides?: Readonly<Partial<Record<StackTier, StackSide>>>;
  /**
   * The live stage, mounted OVER THE SVG'S OWN BOX (never the figure's): the
   * canvas frames exactly the crop, so the hologram and the drawing are one
   * picture and the words beside it stay beside it. A canvas over the whole
   * figure painted the page's ground across the callouts.
   */
  holo?: ReactNode;
  /** The air between plates, world units; the house's unless a host's words
   *  need more room (the leverage's console column). */
  gap?: number;
  /**
   * The words in FLOW rather than seated: a column spread evenly over the
   * drawing's height, each leader level with its word. For a host whose
   * column is too narrow for seated callouts to clear each other (the
   * leverage's console); the plates are evenly spaced, so the words land
   * within a few pixels of their seats.
   */
  flow?: boolean;
}

/**
 * StackFigure — the layer stack, drawn (the proposal system, 2026-10-10):
 * the SVG from `stackLayout`, which letters nothing, and the DOM words beside
 * the plate each names on a 1px DOM leader. The hatch id is per instance
 * (Slab's rule). The lit tier takes the gold wash and the gold hatch; the
 * `shared` tier is dashed; the rest is the ramp.
 *
 * ⚠ SERVER, NO STATE. `data-stack-*` only. The approach wraps it in
 * `StackSteps`, whose `data-step` the sheet reads for the three states.
 */
export function StackFigure({
  id,
  tiers,
  lit = "layer",
  callouts,
  tiles = [],
  courses,
  alt,
  className = "",
  sides = {},
  holo,
  gap,
  flow = false,
}: StackFigureProps) {
  const nCourses = courses ? courses.skills.length + courses.evals.length : 0;
  const g = stackPaths(tiers, { tiles: Math.max(1, tiles.length), courses: nCourses, gap });
  const seats = stackSeats(tiers, sides, gap);
  const hatch = `${id}-hatch`;
  const skills = courses?.skills.length ?? 0;
  const calloutTiers = tiers.filter((t) => callouts[t] || (t === "tiles" && tiles.length));
  /* Every word on one side: the drawing takes the other column's room. */
  const layout = calloutTiers.every((t) => seats[t].side === "right")
    ? "right"
    : calloutTiers.every((t) => seats[t].side === "left")
      ? "left"
      : "both";
  return (
    <figure
      className={`stk ${className}`.trim()}
      data-stack=""
      data-stack-layout={layout}
      data-stack-flow={flow ? "" : undefined}
      role="img"
      aria-label={alt}
      style={
        {
          "--stk-w": g.frame.w,
          "--stk-h": g.frame.h,
          "--stk-aspect": `${g.frame.w} / ${g.frame.h}`,
          "--stk-drop": `${deckDrop(g.frame, gap).toFixed(1)}px`,
        } as CSSProperties
      }
    >
      {/* ⚠ THE FIGURE IS THE SIZE CONTAINER AND THE GRID IS ITS CHILD: a
          container unit used on the container itself resolves against its
          ancestor, which is how the first cut drew the slab at the band's
          width. */}
      <div className="stk__in">
        <div className="stk__plot">
          <svg
            className="stk__svg"
            viewBox={`0 0 ${g.frame.w} ${g.frame.h}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id={hatch}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="6" className="stk__hatch" />
              </pattern>
            </defs>
            {g.plates.map((p) => (
              <g
                key={p.tier}
                className="stk__plate"
                data-stack-tier={p.tier}
                data-stack-lit={p.tier === lit ? "" : undefined}
              >
                <path className="stk__hidden" d={p.hidden} />
                <path className="stk__face stk__face--left" d={p.left} />
                <path className="stk__face stk__face--right" d={p.right} />
                <path className="stk__face stk__face--top" d={p.top} />
                {p.tier === lit ? (
                  <path className="stk__fill" d={p.top} fill={`url(#${hatch})`} />
                ) : null}
                {p.tier === "layer"
                  ? g.courses.map((d, i) => (
                      <path
                        key={d}
                        className="stk__course"
                        data-stack-course={i < skills ? "skill" : "eval"}
                        d={d}
                      />
                    ))
                  : null}
                {p.tier === "layer" && g.run ? <path className="stk__run" d={g.run} /> : null}
              </g>
            ))}
            {g.tiles.map((t, i) => {
              const word = tiles[tiles.length - 1 - i] ?? tiles[i];
              return (
                <g
                  key={`${t.tier}-${i}`}
                  className="stk__tile"
                  data-stack-tier="tiles"
                  data-stack-lit={word?.lit ? "" : undefined}
                >
                  <path className="stk__hidden" d={t.hidden} />
                  <path className="stk__face stk__face--left" d={t.left} />
                  <path className="stk__face stk__face--right" d={t.right} />
                  <path className="stk__face stk__face--top" d={t.top} />
                </g>
              );
            })}
          </svg>
          {holo}
        </div>
        {(["left", "right"] as const).map((side) => (
          <div key={side} className="stk__callouts" data-stack-side={side} aria-hidden="true">
            {calloutTiers
              .filter((t) => seats[t].side === side)
              .map((t) => {
                const seat = seats[t];
                const c = callouts[t];
                return (
                  <div
                    key={t}
                    className="stk__callout"
                    data-stack-tier={t}
                    data-stack-lit={t === lit ? "" : undefined}
                    style={{ "--ax": seat.ax, "--at": seat.at } as CSSProperties}
                  >
                    <span className="stk__lead" />
                    {t === "tiles" && tiles.length ? (
                      <ul className="stk__tiles">
                        {tiles.map((w) => (
                          <li
                            key={w.id}
                            className="stk__tile-word"
                            data-stack-lit={w.lit ? "" : undefined}
                          >
                            <span className="stk__tile-bucket">{w.bucket}</span>
                            <span className="stk__tile-name">{w.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {c ? (
                      <>
                        <span className="stk__callout-label">
                          {c.label}
                          {c.chip ? <span className="stk__chip">{c.chip}</span> : null}
                        </span>
                        {c.lines?.map((l) => (
                          <span key={l} className="stk__callout-line">
                            {l}
                          </span>
                        ))}
                      </>
                    ) : null}
                    {t === "layer" && courses ? (
                      <ul className="stk__courses">
                        {courses.skills.map((sk) => (
                          <li key={sk} data-stack-course="skill">
                            {sk}
                          </li>
                        ))}
                        {courses.evals.map((ev) => (
                          <li key={ev} data-stack-course="eval">
                            {ev}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </figure>
  );
}
