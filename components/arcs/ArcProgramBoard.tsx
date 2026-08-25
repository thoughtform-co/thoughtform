import type { CSSProperties } from "react";

import { LOOP_FIGURES } from "@/lib/arcs/content/shared/loop-figures";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcHoloProgramMount } from "./ArcHoloProgramMount";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcProgramBoardProps {
  section: ArcSectionOf<"program">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcProgramBoard — the trajectory, plotted, and the page's contents
 * (ADR-078 U1; re-cut ADR-079).
 *
 * ⚠ IT REPLACED A DIAGRAM OF A METAPHOR. The first cut drew adoption and
 * automation as a ratchet: an abstract mechanism a reader had to have
 * explained before it meant anything, in a house where every other
 * instrument draws a RECORD. This one draws real dates.
 *
 * ⚠ AND IT ABSORBED THE `rollout` SECTION (ADR-079, owner). That was six
 * dated log rows under a second masthead at the far end of the page — the
 * same 2024 → now span, in a second grammar. The page stated its own
 * chronology twice. Now there is one chronology, and it is also the table
 * of contents: every station is an anchor into the chapter it belongs to.
 *
 * ⚠ THE STATIONS ALTERNATE ABOVE AND BELOW THE AXIS, and that is
 * arithmetic, not styling. Seven stations across the band leave ~120px
 * each; a station block is ~170px wide. Alternating lanes doubles the
 * pitch between same-side neighbours, which is what lets each one carry a
 * date, a name AND its note without colliding. `--lane` is derived from
 * the index here so content never authors it.
 *
 * ⚠ THE ADOPTION CURVE IS ITS OWN REGISTER AT THE FOOT, not a line behind
 * the stations. Drawn under them it crossed every note, and a reading the
 * eye has to pick out of the text is not a reading.
 *
 * ⚠ THE ONLY DIGITS IT LETTERS ARE YEARS — and since ADR-079 the years
 * live on the stations' own `sub`, so the axis carries no separate scale:
 * a row repeating 2024 / 2025 / 2026 under stations already dated 2024 and
 * "Sept 2025" was the same fact twice, and it collided with the lower lane.
 * The register figures come from `LOOP_FIGURES` here in the renderer.
 *
 * ⚠ `14` MUST READ "TEAMS USING THE LAYER" — a different and smaller set
 * than the 22 briefed, and the wording is the only thing keeping them apart
 * (`.claude/rules/proof.md`).
 *
 * ⚠ DOM, NOT AN SVG CANVAS. The host runs w/h ≈ 3.3 → 2.1 across the three
 * reference viewports and no authored viewBox survives that spread. Every
 * rule and connector is a 1px div; only the curve is a path, and it is
 * `preserveAspectRatio="none"` inside its own band, where distortion is
 * the point — a step ladder reads as a step ladder at any aspect.
 *
 * ⚠ IT IS THE FIRST SECTION, so it is the one the curtain holds — it must
 * stay under one viewport at 1280×720 or `data-arc-tall` disarms the seam
 * with nothing but one smoke assertion to say so.
 */
export function ArcProgramBoard({ section, index, motion = "reveal" }: ArcProgramBoardProps) {
  /* The registers, in the order the chart earns them: what adoption moved,
     what encoding produced, what got built, what it did to the work. */
  const registers = [
    { id: "workshops", figure: LOOP_FIGURES.workshops, label: "Workshops run" },
    { id: "people", figure: LOOP_FIGURES.people, label: "People on the layer" },
    { id: "skills", figure: LOOP_FIGURES.skills, label: "Skills encoded" },
    { id: "teams", figure: LOOP_FIGURES.teamsUsing, label: "Teams using the layer" },
    { id: "tools", figure: LOOP_FIGURES.tools, label: "Tools in production" },
    { id: "studio", figure: LOOP_FIGURES.studioAi, label: "Of briefings involve AI" },
  ] as const;

  return (
    <ArcBeat
      id={section.id}
      kind="program"
      className="arc-section arc-sec arc-sec--prog"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band arc-band--instrument">
        <ArcSectionHead
          head={section.head}
          kind="program"
          index={index}
          sectionId={section.id}
          motion={motion}
        />

        <div className="arc-prog arc-reveal" {...rung(motion, 0.12, 0)}>
          {/* The header band — the reference boards' grammar: what the
              instrument is, and the one reading it publishes. No invented
              serial, and the readout is a span of time, not a metric. */}
          <div className="arc-prog__hd">
            <span className="arc-prog__hd-ttl">
              Adoption · 2024 → now · organic pull, not mandate
            </span>
            <span className="arc-prog__hd-st">18 months on record</span>
          </div>

          <div className="arc-prog__plot">
            {/* THE INSTRUMENT (ADR-080) — the same record in three
                dimensions: one ring per dated waypoint, its radius the
                adoption reach at that date, i.e. the step ladder below made
                volumetric. It mounts INSIDE the plot on purpose: this box is
                the field whose material it replaces, it is the box the
                stations are positioned against, and its `overflow: hidden`
                is what houses the drawing instead of letting a ground plane
                run out past the panel's own frame.
                ⚠ Strictly additive — without JS, WebGL, the width or the
                motion budget, `data-holo` never reaches "live" and every
                rule below paints exactly as it always has. */}
            <ArcHoloProgramMount waypoints={section.waypoints} />

            {/* THE FIELD'S MATERIAL: graticule and scatter. Everything here
                is chrome — it carries no reading and nothing is measured
                against it. */}
            <div className="arc-prog__grid" aria-hidden="true" />
            <div className="arc-prog__scatter" aria-hidden="true">
              {SCATTER.map(([x, y], i) => (
                <i key={`d-${i}`} style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties} />
              ))}
            </div>

            <i className="arc-prog__axis" aria-hidden="true" />

            {/* THE COURSE. Each station is a real date and, bar the two
                that open no chapter, an anchor — so the chart IS the
                page's table of contents. */}
            <nav className="arc-prog__stns" aria-label="The trajectory, and what each part opens">
              <ol>
                {section.waypoints.map((wp, i) => {
                  const Tag = wp.target ? "a" : "span";
                  return (
                    <li
                      className="arc-prog__stn"
                      key={wp.id}
                      data-wp={wp.id}
                      data-lane={i % 2 === 0 ? "up" : "dn"}
                      data-seat={wp.seat ? "" : undefined}
                      style={{ "--at": `${wp.at * 100}%` } as CSSProperties}
                    >
                      <Tag
                        className="arc-prog__stn-hit"
                        {...(wp.target ? { href: `#${wp.target}` } : {})}
                      >
                        {wp.sub ? <span className="arc-prog__stn-date">{wp.sub}</span> : null}
                        <span className="arc-prog__stn-lbl">{wp.label}</span>
                        {wp.note ? <span className="arc-prog__stn-note">{wp.note}</span> : null}
                      </Tag>
                      <i className="arc-prog__stn-stem" aria-hidden="true" />
                      <i className="arc-prog__stn-dia" aria-hidden="true" />
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* THE ADOPTION BAND — the one green thing, because green is
                the human everywhere on this estate. The priors run in at
                its head, which is where they belong in time. */}
            <div className="arc-prog__band">
              {section.priors && section.priors.length > 0 ? (
                <span className="arc-prog__band-lbl">Priors · {section.priors.join(" · ")}</span>
              ) : null}
              <span className="arc-prog__band-lbl arc-prog__band-lbl--r">
                Adoption · organic pull → now
              </span>
              <svg
                className="arc-prog__curve"
                viewBox="0 0 1000 60"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d={CURVE} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>

          <i className="arc-prog__ruler" aria-hidden="true" />

          {/* THE PLATFORM TRACK — what ran beside the course. Absorbed from
              the retired `rollout` log; it is edge-anchored chrome here,
              not a second masthead. */}
          {section.parallel && section.parallel.length > 0 ? (
            <div className="arc-prog__ft">
              <div className="arc-prog__par">
                <b>Running in parallel</b>
                {section.parallel.map((line, i) => (
                  <span key={`p-${i}`}>{line}</span>
                ))}
              </div>
              <span className="arc-prog__ft-lbl">
                Twenty-two teams briefed · forty-five minutes each
              </span>
            </div>
          ) : null}

          <dl className="arc-prog__reg">
            {registers.map((r) => (
              <div className="arc-prog__reg-row" key={r.id}>
                <dt className="arc-prog__fig">{r.figure}</dt>
                <dd className="arc-prog__lbl">{r.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {section.footnote ? (
          <p className="arc-footnote arc-reveal" {...rung(motion, 0.22, 0)}>
            {section.footnote}
          </p>
        ) : null}
      </div>
    </ArcBeat>
  );
}

/**
 * The adoption curve, as a step ladder in the band's own 1000×60 space.
 * Authored against the rollout's shape (embedded → pilot → briefed →
 * organic pull), rising left to right, never interpolated.
 */
const CURVE = "M30 54H150V48H270V42H390V35H510V28H630V21H750V13H870V6H975";

/**
 * The field's point scatter — AUTHORED, never random.
 *
 * `Math.random()` in a render is a hydration mismatch and a screenshot that
 * never reproduces; these are hand-placed to sit clear of the stations, so
 * the material never reads as data.
 */
const SCATTER: readonly (readonly [number, number])[] = [
  [9, 78],
  [14, 70],
  [19, 74],
  [26, 64],
  [31, 68],
  [36, 56],
  [43, 52],
  [47, 60],
  [54, 46],
  [59, 50],
  [64, 40],
  [71, 36],
  [76, 42],
  [83, 30],
  [88, 34],
  [92, 24],
];
