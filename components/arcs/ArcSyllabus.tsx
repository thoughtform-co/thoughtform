"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";

import type { ArcMotion, ArcSectionOf, ArcSyllabusGlyph } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  GLYPH_H,
  GLYPH_W,
  GLYPHS,
  SYLLABUS_CLASS_WORD,
  SYLLABUS_EXAMPLE_FLAG,
  SYLLABUS_ROWS,
  SYLLABUS_TABLIST_LABEL,
  TRACK_ENTRY_COL,
  classCol,
  classNumeral,
  launchCol,
  phaseLabel,
  phaseSpans,
} from "./syllabus/syllabusLayout";

interface ArcSyllabusProps {
  section: ArcSectionOf<"syllabus">;
  index: number;
  motion?: ArcMotion;
}

/** The shape of what a class makes: hairlines, no text, no transform. */
function Glyph({ glyph }: { glyph: ArcSyllabusGlyph }) {
  return (
    <svg
      className="arc-syl__glyph"
      viewBox={`0 0 ${GLYPH_W} ${GLYPH_H}`}
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[glyph].map((p, i) =>
        p.t === "rect" ? (
          <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} />
        ) : p.t === "line" ? (
          <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} />
        ) : (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} />
        )
      )}
    </svg>
  );
}

/**
 * ArcSyllabus — a course on one track (ADR-134).
 *
 * The whole term in one picture: the two ways in as the fork the track
 * starts from, one station per class under the phases of the house arc, a
 * gate after every station, and what is launched at the end. The open
 * station's practical sheet sits under the track, so the four rows a student
 * needs (objective, what they make, the gate, the tool) are drawn ONCE, not
 * once per class — the owner's reading of nine identical sections was "a
 * glorified PowerPoint".
 *
 * ⚠ THE FIRST RENDER IS CLASS ONE, OPEN — what the server sends, what no-JS
 * reads. State changes only in callbacks (the bench's law). Every sheet is in
 * the DOM, so print can show all nine.
 *
 * ⚠ ATTRIBUTES ARE `data-syl-*`, NEVER `data-arc-*` (`arc-terminal-markup`
 * measures the reveal seam on the latter). No transform on any SVG node.
 *
 * ⚠ THE STATIONS ARE GRID ITEMS OF THE TRACK: the tablist is
 * `display: contents`, so every station lands in its own column and row of
 * one grid with the fork and the launch — which is what keeps the rail
 * through the plates' centres at every width without measuring anything.
 */
export function ArcSyllabus({ section, index, motion = "reveal" }: ArcSyllabusProps) {
  const { classes, phases } = section;
  const [open, setOpen] = useState(0);
  const spans = phaseSpans(phases, classes);
  const n = classes.length;
  const tabId = (i: number) => `${section.id}-class-${i + 1}`;
  const panelId = (i: number) => `${section.id}-sheet-${i + 1}`;

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    const to =
      event.key === "Home" ? 0 : event.key === "End" ? n - 1 : step ? (open + step + n) % n : -1;
    if (to < 0) return;
    event.preventDefault();
    setOpen(to);
    event.currentTarget.querySelector<HTMLButtonElement>(`#${tabId(to)}`)?.focus();
  };

  return (
    <ArcBeat
      id={section.id}
      kind="syllabus"
      className="arc-section arc-sec arc-sec--syllabus"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="syllabus"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure className="arc-syl arc-reveal" data-syl-open={open} {...rung(motion, 0.12, 0)}>
          <div className="arc-syl__track" style={{ "--syl-n": n } as CSSProperties}>
            {/* The phases: a hairline bracket over each run of classes. */}
            {spans.map((p) => (
              <span
                key={p.id}
                className="arc-syl__phase"
                data-syl-phase={p.id}
                style={{ gridColumn: p.column }}
              >
                <span className="arc-syl__phaselabel">{p.label}</span>
              </span>
            ))}

            {/* The fork: the assignment's two ways in. */}
            <span
              className="arc-syl__endlabel arc-syl__endlabel--in"
              style={{ gridColumn: TRACK_ENTRY_COL }}
            >
              {section.entry.label}
            </span>
            <ul className="arc-syl__ends arc-syl__ends--in" style={{ gridColumn: TRACK_ENTRY_COL }}>
              {section.entry.ways.map((w) => (
                <li key={w} className="arc-syl__end">
                  {w}
                </li>
              ))}
            </ul>

            {/* The rail the stations sit on. */}
            <i
              className="arc-syl__rail"
              aria-hidden="true"
              style={{ gridColumn: `${classCol(0)} / ${launchCol(n)}` }}
            />

            <div
              className="arc-syl__stations"
              role="tablist"
              aria-label={SYLLABUS_TABLIST_LABEL}
              onKeyDown={onKey}
            >
              {classes.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  id={tabId(i)}
                  className="arc-syl__stn"
                  aria-selected={i === open}
                  aria-controls={panelId(i)}
                  tabIndex={i === open ? 0 : -1}
                  onClick={() => setOpen(i)}
                  style={{ gridColumn: classCol(i) }}
                >
                  <span className="arc-syl__num">{classNumeral(i)}</span>
                  <span className="arc-syl__seat">
                    <span className="arc-syl__plate">
                      <Glyph glyph={c.glyph} />
                    </span>
                  </span>
                  <span className="arc-syl__name">{c.name}</span>
                </button>
              ))}
            </div>

            {/* The end: what is launched. */}
            <span
              className="arc-syl__endlabel arc-syl__endlabel--out"
              style={{ gridColumn: launchCol(n) }}
            >
              {section.launch.label}
            </span>
            <ul className="arc-syl__ends arc-syl__ends--out" style={{ gridColumn: launchCol(n) }}>
              {section.launch.items.map((w) => (
                <li key={w} className="arc-syl__end">
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {section.note ? <p className="arc-syl__note">{section.note}</p> : null}

          <div className="arc-syl__sheets">
            {classes.map((c, i) => (
              <div
                key={c.id}
                id={panelId(i)}
                className="arc-syl__sheet"
                role="tabpanel"
                aria-labelledby={tabId(i)}
                hidden={i !== open}
              >
                <div className="arc-syl__sheethead">
                  <span className="arc-syl__kicker">
                    {SYLLABUS_CLASS_WORD} {classNumeral(i)} · {phaseLabel(phases, c.phase)}
                  </span>
                  <span className="arc-syl__sheetname">{c.name}</span>
                  {/* What the class makes, at the size a student reads it. */}
                  <span className="arc-syl__sheetglyph">
                    <Glyph glyph={c.glyph} />
                  </span>
                  {c.example ? (
                    <a className="arc-syl__example" href={c.example.href}>
                      <span className="arc-syl__exampleflag">{SYLLABUS_EXAMPLE_FLAG}</span>
                      <span className="arc-syl__examplelabel">{c.example.label}</span>
                    </a>
                  ) : null}
                </div>
                <dl className="arc-syl__rows">
                  {SYLLABUS_ROWS.map((r) => (
                    <div key={r.id} className="arc-syl__row" data-syl-row={r.id}>
                      <dt className="arc-syl__key">{r.label}</dt>
                      <dd className="arc-syl__val">{c[r.id]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </figure>
      </div>
    </ArcBeat>
  );
}
