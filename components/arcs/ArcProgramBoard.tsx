import type { CSSProperties } from "react";

import { LOOP_FIGURES } from "@/lib/arcs/content/shared/loop-figures";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcProgramBoardProps {
  section: ArcSectionOf<"program">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcProgramBoard — the engagement, plotted (ADR-078 U1).
 *
 * ⚠ IT REPLACED A DIAGRAM OF A METAPHOR. The first cut drew adoption and
 * automation as a ratchet: two strands, teeth, return lifts. It was
 * internally coherent and said nothing — an abstract mechanism a reader had
 * to have explained before it meant anything, in a house where every other
 * instrument draws a RECORD. The dossiers draw real tool interfaces, the map
 * draws 47 real Skills, the sheets draw real ads. This one now draws real
 * dates: what shipped at Loop, when, against the curve of how many people
 * were on the layer while it did.
 *
 * The chart IS the argument the section makes. Four tools inside eight
 * months reads as a cluster on the right; the adoption curve climbing under
 * them is the "and the teams came with it" clause. Nobody has to be told
 * that adoption and automation drive each other — the two lines are drawn on
 * the same axis and arrive at the same place.
 *
 * ⚠ THE ONLY DIGITS IT LETTERS ARE YEARS. The register figures come from
 * `LOOP_FIGURES` here in the renderer, the same contract `dossier` has with
 * `PROJECT_CASES` — a hand-typed count is the one that goes stale, and the
 * canon is parity-pinned to the casefile in exactly one place. The content
 * module carries a head, waypoints with their positions, and no numbers.
 *
 * ⚠ `14` MUST READ "TEAMS USING THE LAYER" — a different and smaller set
 * than the 22 briefed, and the wording is the only thing keeping them apart
 * (`.claude/rules/proof.md`).
 *
 * ⚠ DOM, NOT AN SVG CANVAS. The host runs w/h ≈ 3.3 → 2.1 across the three
 * reference viewports and no authored viewBox survives that spread — the
 * measured reason the tool wireframes are DOM. Every rule and connector is a
 * 1px div; a stroked single-axis path reports a zero-height rect and
 * vanishes from the collapse guard.
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

  /* The axis: three years and the open end. Years are the one kind of digit
     this drawing letters — a date locates the work, it does not claim
     anything about it. */
  const years = ["2024", "2025", "2026", "Now"] as const;

  /* The adoption curve, as a step ladder: each rung is a level the layer
     held for a while, rising left to right. Authored against the rollout's
     own shape (embedded → pilot → briefed → organic pull), NOT interpolated
     — the plateau before the pilot is real and the drawing should show it. */
  const curve = [8, 8, 20, 34, 34, 52, 70, 78, 92];

  const seat = section.waypoints.find((w) => w.seat);
  const course = section.waypoints.filter((w) => !w.seat);

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
              instrument is, and what state it is in. No invented serial. */}
          <div className="arc-prog__hd">
            <span className="arc-prog__hd-ttl">The program</span>
            <span className="arc-prog__hd-st">Loop Earplugs · active</span>
          </div>

          <div className="arc-prog__body">
            <div className="arc-prog__field">
              {/* THE GRATICULE, the scatter and the edge ladders: the
                  field's material. Everything here is chrome — it carries
                  no reading, and nothing is measured against it. */}
              <div className="arc-prog__grid" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <i
                    className={`arc-prog__vr${i % 4 === 0 ? " arc-prog__vr--major" : ""}`}
                    key={`v-${i}`}
                    style={{ "--i": i } as CSSProperties}
                  />
                ))}
                {Array.from({ length: 5 }, (_, i) => (
                  <i
                    className="arc-prog__hr"
                    key={`h-${i}`}
                    style={{ "--i": i } as CSSProperties}
                  />
                ))}
                {SCATTER.map(([x, y], i) => (
                  <i
                    className="arc-prog__dot"
                    key={`d-${i}`}
                    style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties}
                  />
                ))}
              </div>

              <div className="arc-prog__ladder" aria-hidden="true">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>

              {/* THE PRIORS: the run-in before the axis opens. What the
                  operator did one system earlier, as chart grammar — a dim
                  segment and its labels, never a paragraph. */}
              {section.priors && section.priors.length > 0 ? (
                <div className="arc-prog__prior">
                  <i className="arc-prog__prior-line" aria-hidden="true" />
                  <span className="arc-prog__prior-lbl">{section.priors.join(" · ")}</span>
                </div>
              ) : null}

              {/* THE ADOPTION CURVE — the one green thing, because green is
                  the human everywhere on this estate. A step ladder: the
                  rung heights are the record's own shape, and the register
                  beside it letters the figure so the curve never has to. */}
              <div className="arc-prog__curve" aria-hidden="true">
                {curve.map((h, i) => {
                  const prev = curve[i - 1] ?? h;
                  return (
                    <i
                      /* ⚠ THE RISER IS A MODIFIER, NOT A DEFAULT. Two rungs
                         at the same level (a plateau the layer actually
                         held) would draw a zero-height riser — an element
                         with real geometry on one axis and none on the
                         other, which is exactly what the collapse guard
                         exists to catch. A plateau has no riser because
                         nothing rose. */
                      className={`arc-prog__rung${h !== prev ? " arc-prog__rung--step" : ""}`}
                      key={`r-${i}`}
                      style={
                        {
                          "--i": i,
                          "--n": curve.length,
                          "--h": `${h}%`,
                          "--prev": `${prev}%`,
                        } as CSSProperties
                      }
                    />
                  );
                })}
              </div>
              <span className="arc-prog__curve-lbl">Adoption</span>

              {/* THE COURSE: what shipped, plotted where it shipped. Each
                  waypoint is a real anchor, so the chart is also the page's
                  table of contents. */}
              <nav className="arc-prog__course" aria-label="What shipped, and when">
                <ol>
                  {course.map((wp) => (
                    <li
                      className="arc-prog__wp"
                      key={wp.id}
                      data-wp={wp.id}
                      style={{ "--at": `${wp.at * 100}%` } as CSSProperties}
                    >
                      {wp.target ? (
                        <a className="arc-prog__wp-hit" href={`#${wp.target}`}>
                          <i className="arc-prog__wp-dia" aria-hidden="true" />
                          <span className="arc-prog__wp-lbl">{wp.label}</span>
                          {wp.sub ? <span className="arc-prog__wp-sub">{wp.sub}</span> : null}
                        </a>
                      ) : (
                        <span className="arc-prog__wp-hit">
                          <i className="arc-prog__wp-dia" aria-hidden="true" />
                          <span className="arc-prog__wp-lbl">{wp.label}</span>
                          {wp.sub ? <span className="arc-prog__wp-sub">{wp.sub}</span> : null}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>

              {/* THE SEAT: where both the curve and the course arrive. The
                  drawing's ONE bright object, framed by stand-off brackets
                  — observed, not a second device (ADR-065's third grammar). */}
              {seat ? (
                <div
                  className="arc-prog__seat"
                  style={{ "--at": `${seat.at * 100}%` } as CSSProperties}
                >
                  {seat.target ? (
                    <a className="arc-prog__seat-hit" href={`#${seat.target}`}>
                      <span className="arc-prog__seat-in">
                        <span className="arc-prog__wp-lbl">{seat.label}</span>
                        {seat.sub ? <span className="arc-prog__wp-sub">{seat.sub}</span> : null}
                      </span>
                    </a>
                  ) : (
                    <span className="arc-prog__seat-hit">
                      <span className="arc-prog__seat-in">
                        <span className="arc-prog__wp-lbl">{seat.label}</span>
                        {seat.sub ? <span className="arc-prog__wp-sub">{seat.sub}</span> : null}
                      </span>
                    </span>
                  )}
                  <i className="arc-prog__br arc-prog__br--tl" aria-hidden="true" />
                  <i className="arc-prog__br arc-prog__br--tr" aria-hidden="true" />
                  <i className="arc-prog__br arc-prog__br--bl" aria-hidden="true" />
                  <i className="arc-prog__br arc-prog__br--br" aria-hidden="true" />
                </div>
              ) : null}

              {/* The axis band closes the field. */}
              <div className="arc-prog__axis">
                {years.map((y, i) => (
                  <span className="arc-prog__yr" key={y} style={{ "--i": i } as CSSProperties}>
                    {y}
                  </span>
                ))}
              </div>
            </div>

            <dl className="arc-prog__reg">
              {registers.map((r) => (
                <div className="arc-prog__reg-row" key={r.id}>
                  <dt className="arc-prog__fig">{r.figure}</dt>
                  <dd className="arc-prog__lbl">{r.label}</dd>
                </div>
              ))}
            </dl>
          </div>
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
 * The field's point scatter — AUTHORED, never random.
 *
 * `Math.random()` in a render is a hydration mismatch and a screenshot that
 * never reproduces; these are hand-placed to sit off the curve and off the
 * course, so the material never reads as data.
 */
const SCATTER: readonly (readonly [number, number])[] = [
  [6, 18],
  [13, 62],
  [19, 31],
  [24, 74],
  [31, 12],
  [37, 45],
  [43, 68],
  [48, 24],
  [55, 81],
  [61, 37],
  [67, 15],
  [72, 58],
  [78, 29],
  [84, 71],
  [89, 41],
  [94, 19],
  [9, 44],
  [28, 88],
  [52, 9],
  [70, 84],
];
