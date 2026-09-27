import type { CSSProperties } from "react";

import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import type { ArcMotion, ArcQuestion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  Q_CARD,
  Q_PITCH,
  Q_VB,
  Q_WIRES,
  plateRect,
  qRectVars,
  qRun,
  type QSide,
} from "./framing/questionsLayout";

interface ArcQuestionsProps {
  section: ArcSectionOf<"questions">;
  index: number;
  motion?: ArcMotion;
}

type Tone = "lit" | "human" | "quiet";
const toneOf = (q: ArcQuestion): Tone => (q.lit ? "lit" : q.human ? "human" : "quiet");

/**
 * ArcQuestions — one piece of work, six questions around it (ADR-130). The
 * Moira workshop's configuration board on the house's material: the work at
 * the centre as a plate with its top-right notch (a single notch means
 * CONNECTED — ADR-065 rule 5 — and it is the one object every ribbon meets),
 * six plates cut on the lawful TR + BL pair around it, joined by eight-wire
 * ribbons (R4, ADR-070 U11). The owner's layout: the model, the context and
 * the evaluations on the left; the data, the interface and the owner on the
 * right.
 *
 * ⚠ GOLD IS WHAT THE TEAM WRITES, GREEN IS THE HUMAN (the board's law,
 * ADR-100). The context and the evaluations are lit and carry the tag; their
 * ribbons are gold. The owner's plate and ribbon are green. The other three
 * are the plate and the seam: chosen and connected for everyone.
 *
 * ⚠ THE PLATES ARE DOM, THE SVG CARRIES ONLY THE RIBBONS: the answers are
 * sentences that wrap, and SVG `<text>` cannot. The stage holds the crop's
 * aspect so a plate positioned by percentage lands on its wires' ends.
 *
 * ⚠ SERVER, NO STATE. `data-questions-*` only. Below 900px the wires go and
 * the plates fall into one column: the work first, the two the team writes
 * next (Moira's own fallback — without the wiring only the order can carry
 * the emphasis).
 */
export function ArcQuestions({ section, index, motion = "reveal" }: ArcQuestionsProps) {
  const { work, left, right, tag, alt } = section;
  const sides: readonly [QSide, readonly ArcQuestion[]][] = [
    ["left", left],
    ["right", right],
  ];
  return (
    <ArcBeat
      id={section.id}
      kind="questions"
      className="arc-section arc-sec arc-sec--questions"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="questions"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div
          className="arc-q arc-reveal"
          role="group"
          aria-label={alt}
          data-questions-figure=""
          {...rung(motion, 0.14)}
        >
          <div className="arc-q__stage">
            <svg
              className="arc-q__wires"
              viewBox={`0 0 ${Q_VB.w} ${Q_VB.h}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {sides.map(([side, qs]) =>
                qs.map((q, i) => (
                  <g
                    key={`${side}-${q.id}`}
                    className="arc-q__ribbon"
                    data-questions-tone={toneOf(q)}
                  >
                    {ribbonPaths(qRun(side, i), Q_WIRES, Q_PITCH).map((d) => (
                      <path key={d} d={d} />
                    ))}
                  </g>
                ))
              )}
            </svg>

            <article
              className="arc-plate arc-q__card"
              data-questions-card=""
              style={qRectVars(Q_CARD) as CSSProperties}
            >
              <header className="arc-plate__head">
                <span className="arc-plate__kicker" data-lead="">
                  {work.label}
                </span>
                <span className="arc-plate__name">{work.name}</span>
              </header>
              <div className="arc-q__cardbody">
                {work.image ? (
                  <span className="arc-q__media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={work.image.src}
                      alt={work.image.alt}
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                ) : null}
                <p className="arc-q__line">{work.line}</p>
              </div>
              <footer className="arc-plate__foot">
                <span className="arc-plate__foot-label">{work.bar.label}</span>
                <span className="arc-plate__foot-line">{work.bar.line}</span>
              </footer>
            </article>

            {sides.map(([side, qs]) =>
              qs.map((q, i) => (
                <section
                  key={`${side}-${q.id}`}
                  className="arc-plate arc-plate--pair arc-q__mod"
                  aria-label={q.title}
                  data-questions-plate={q.id}
                  data-questions-side={side}
                  data-questions-tone={toneOf(q)}
                  style={qRectVars(plateRect(side, i)) as CSSProperties}
                >
                  <header className="arc-plate__head">
                    <span className="arc-q__kickrow">
                      <span className="arc-plate__kicker">{q.title}</span>
                      {q.lit ? <span className="arc-q__tag">{tag}</span> : null}
                    </span>
                    <span className="arc-plate__name">{q.question}</span>
                  </header>
                  <p className="arc-q__answer">{q.answer}</p>
                </section>
              ))
            )}
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
