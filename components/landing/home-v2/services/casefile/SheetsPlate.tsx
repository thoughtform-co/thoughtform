"use client";

import Image from "next/image";
import { useState } from "react";

import type { CaseSheet } from "@/lib/cases/types";

import { ConsoleFrame } from "./console/ConsoleFrame";
import { ConsoleRail } from "./console/ConsoleRail";

/**
 * SheetsPlate — one row, several things to show, on the shared rail.
 *
 * The Studio row is what forced this: it showed the ads and nothing else,
 * when the engagement was equally the RULE the studio drew for when AI may
 * make an image and the LIMIT it refuses to cross (owner, 2026-08-06 —
 * "it's not just the ads"). Output, rule, limit.
 *
 * ⚠ IT ADDS ALMOST NOTHING. The rail is `ConsoleRail`, the foot is the
 * console's own, and two of the three bodies reuse grammars that already
 * exist — `.fl-stills` from the stills plate and `.fl-caps` from the tools
 * plate. Only the two-column comparison is new markup. A sheet kind that
 * needs a whole plate of its own is probably a ROW, not a sheet.
 *
 * ⚠ A SHEET IS NOT A SECOND DIRECTORY. The directory rows are the
 * engagement's bodies of work; sheets are facets of ONE of them. If a sheet
 * would read as a separate project, it wants a row — and a row reshapes the
 * browse band, which is a different and much more expensive change
 * (`.claude/rules/proof.md`).
 */
export function SheetsPlate({ sheets }: { sheets: readonly CaseSheet[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sheet = sheets[activeIdx] ?? sheets[0];

  if (!sheet) return null;

  return (
    <ConsoleFrame
      className="fl-plate fl-plate--sheets"
      data-sheet={sheet.id}
      rail={
        <ConsoleRail
          stations={sheets.map((s) => ({ id: s.id, name: s.label }))}
          activeIdx={activeIdx}
          onActive={setActiveIdx}
          label="Studio sheets"
        />
      }
      foot={sheet.foot ? <p>{sheet.foot}</p> : undefined}
    >
      <SheetBody sheet={sheet} />
    </ConsoleFrame>
  );
}

/** One switch over the sheet body kinds, with the same `never` guard
 *  `TrackVisual` carries: a new body is a compile error until it renders. */
function SheetBody({ sheet }: { sheet: CaseSheet }) {
  const body = sheet.body;

  switch (body.kind) {
    case "stills":
      /* The stills plate's own grammar, verbatim — tiles fit by HEIGHT so the
         4:5 ads are never cropped, and in NATURAL COLOUR. The one filtered
         image on this surface is the tools capture, and these are the reason
         why (ADR-064 U2): a client's ads are authored colour. */
      return (
        <ul className="fl-stills">
          {body.shots.map((shot) => (
            <li className="fl-still" key={shot.src}>
              <Image
                className="fl-still__shot"
                src={shot.src}
                alt={shot.alt}
                width={shot.width ?? 1080}
                height={shot.height ?? 1350}
                sizes="200px"
              />
            </li>
          ))}
        </ul>
      );

    case "compare":
      /* ⚠ EXACTLY TWO COLUMNS, and the type is enforcing a design rule rather
         than a data shape: this sheet exists to draw ONE line. A third column
         is a table, and a table is a different argument. */
      return (
        <div className="fl-cmp">
          {body.columns.map((col) => (
            <section className="fl-cmp__col" key={col.name}>
              <span className="fl-cmp__kicker">{col.kicker}</span>
              <h4 className="fl-cmp__name">{col.name}</h4>
              {/* Quoted, not italic — the house has no italics, and the
                  quotation marks are what mark this as the category speaking
                  in its own voice. */}
              <p className="fl-cmp__claim">“{col.claim}”</p>
              <p className="fl-cmp__desc">{col.desc}</p>
              <ul className="fl-cmp__ex">
                {col.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      );

    case "facts":
      /* The tools plate's fact grid, reused. Four titled claims, 2×2, on the
         symmetric rails — the same object doing the same job on another row
         is exactly what the shared grammar is for. */
      return (
        <ul className="fl-caps fl-caps--tool fl-caps--sheet">
          {body.facts.map((f) => (
            <li className="fl-cap" key={f.title}>
              <span className="fl-cap__t">{f.title}</span>
              <span className="fl-cap__d">{f.desc}</span>
            </li>
          ))}
        </ul>
      );

    default: {
      const exhaustive: never = body;
      return exhaustive;
    }
  }
}
