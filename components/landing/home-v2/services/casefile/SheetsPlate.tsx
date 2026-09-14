"use client";

import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";

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
 * ⚠ IT ADDS ALMOST NOTHING. The rail is `ConsoleRail`, and two of the
 * three bodies reuse grammars that already exist — `.fl-stills` from the
 * stills plate and `.fl-caps` from the tools plate. Only the two-column
 * comparison is new markup. A sheet kind that needs a whole plate of its
 * own is probably a ROW, not a sheet.
 *
 * ⚠ NO CONSOLE FOOT (owner, 2026-08-08 — "remove the text at the bottom of
 * the right panel"). The per-sheet `foot` sentence left with the map's on
 * the same ruling; `CaseSheet.foot` is deleted and the slot stays empty on
 * every plate, smoke-asserted.
 *
 * ⚠ **THE VERDICT BAND IS NOT THAT FOOT COMING BACK** (owner, 2026-08-29 —
 * "some sort of templates where maybe at the bottom we have some
 * information"). The foot is ROW-level chrome hung off `ConsoleFrame`;
 * `.fl-verdict` is SHEET content — it switches with the rail, it is the
 * sentence each sheet exists to deliver, and it renders INSIDE the field on
 * the films row's production-block seat (`flex: 0 0 auto` sibling of the
 * body, which keeps its own `flex: 1 1 auto`). It is what makes three
 * sheets that shared a rail and nothing else read as one instrument showing
 * three faces. ⚠ On the proof card it is PORTALLED to the card's foot slot
 * (`verdictHost`, ADR-097 U10) and re-seated there as a frame of its own;
 * omitted, it renders here as before.
 *
 * ⚠ ALWAYS ON, unlike `.fl-filmprod`'s tall-viewport gate. That block is
 * supplementary record about a row; this is each sheet's punchline. On THE
 * RED LINE it was the only place the surface said UGC until ADR-084 U2 gave
 * the facts body a HUB — the charge now names itself at the crossing of the
 * four risks, and the verdict states the position under them.
 *
 * ⚠ A SHEET IS NOT A SECOND DIRECTORY. The directory rows are the
 * engagement's bodies of work; sheets are facets of ONE of them. If a sheet
 * would read as a separate project, it wants a row — and a row reshapes the
 * browse band, which is a different and much more expensive change
 * (`.claude/rules/proof.md`).
 *
 * ⚠ IT HAS A SECOND HOME (ADR-078): the portfolio arc's `studio` beat mounts
 * this plate at PAGE scale on the same `LOOP_STUDIO_SHEETS` array. Hence
 * `stillSizes` — the only thing that could not be shared, because a `sizes`
 * hint is a statement about the BOX and the arc's box is bigger. The default
 * keeps the casefile byte-identical; the arc passes its own. Any other edit
 * here is a TWO-SURFACE change: run `services-ring-smoke` AND
 * `arc-portfolio-smoke`.
 */
export function SheetsPlate({
  sheets,
  stillSizes = "200px",
  railHost,
  verdictHost,
}: {
  sheets: readonly CaseSheet[];
  stillSizes?: string;
  /** Where to render the rail instead of the frame's own slot (ADR-094 U3).
   *  Omitted — the casefile and the portfolio arc — nothing changes. */
  railHost?: HTMLElement | null;
  /** Where to render the sheet's verdict instead of under the body (ADR-097
   *  U10). Omitted — the casefile and the portfolio arc — nothing changes. */
  verdictHost?: HTMLElement | null;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sheet = sheets[activeIdx] ?? sheets[0];

  if (!sheet) return null;

  const rail = (
    <ConsoleRail
      stations={sheets.map((s) => ({ id: s.id, name: s.label }))}
      activeIdx={activeIdx}
      onActive={setActiveIdx}
      label="Studio sheets"
    />
  );

  const verdict = sheet.verdict ? (
    <div className="fl-verdict">
      <span className="fl-verdict__k">{sheet.verdict.kicker}</span>
      <p className="fl-verdict__p">{sheet.verdict.copy}</p>
    </div>
  ) : null;

  return (
    <ConsoleFrame
      className="fl-plate fl-plate--sheets"
      data-sheet={sheet.id}
      rail={railHost ? null : rail}
    >
      <SheetBody sheet={sheet} stillSizes={stillSizes} />
      {verdictHost ? null : verdict}
      {/* ⚠ THE RAIL CAN BE PORTALLED OUT (ADR-094 U3), the seam `PdaConsole`
          already carries and this plate is its second consumer. Given a host
          the rail renders THERE and the frame's own slot goes empty; omitted,
          the render is byte-identical — which is what the casefile and the
          portfolio arc rely on and their smokes assert.
          ⚠ IT IS A HOST, NOT A CONTROLLED `activeIdx`. The state stays here
          because the plate is what knows which sheet is open; a route that
          also owned the index would be a second source for one piece of it. */}
      {railHost ? createPortal(rail, railHost) : null}
      {/* ⚠ AND SO CAN THE VERDICT (ADR-097 U10) — the second additive seam on
          this plate, on the same terms. Given a host the band renders THERE
          and the console keeps its body alone; omitted, the render is
          byte-identical, which the casefile and the arc portfolio rely on
          (`fillUnion` on `.arc-sheets`). It is still THIS plate's sentence:
          it switches with the rail because the plate renders it, wherever
          it renders it. */}
      {verdictHost && verdict ? createPortal(verdict, verdictHost) : null}
    </ConsoleFrame>
  );
}

/** One switch over the sheet body kinds, with the same `never` guard
 *  `TrackVisual` carries: a new body is a compile error until it renders. */
function SheetBody({ sheet, stillSizes }: { sheet: CaseSheet; stillSizes: string }) {
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
                sizes={stillSizes}
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
              {/* The kicker and the name are ONE block, and the wrapper is
                  what lets the column distribute (2026-08-28, owner: the
                  sheet is "not optimally using space"). The column is
                  `space-between` now; without this the verdict would drift
                  off its own category name to satisfy the spacing. */}
              <header className="fl-cmp__head">
                <span className="fl-cmp__kicker">{col.kicker}</span>
                <h4 className="fl-cmp__name">{col.name}</h4>
              </header>
              {/* The middle SLACK row — image (optional) plus the reading
                  block. Wrapped together because both belong to the middle
                  1fr grid cell; separating them would put the image in the
                  slack and push the text below it, undoing ADR-084's "split
                  the slack, don't pool it" arithmetic one plate over.
                  Quoted, not italic — the house has no italics, and the
                  quotation marks are what mark this as the category
                  speaking in its own voice. */}
              <div className="fl-cmp__middle">
                {col.image ? (
                  <figure className="fl-cmp__figure">
                    <Image
                      className="fl-cmp__img"
                      src={col.image.src}
                      alt={col.image.alt}
                      width={col.image.width ?? 444}
                      height={col.image.height ?? 444}
                      sizes="(min-width: 1920px) 340px, (min-width: 1440px) 260px, 220px"
                    />
                  </figure>
                ) : null}
                <div className="fl-cmp__read">
                  <p className="fl-cmp__claim">“{col.claim}”</p>
                  <p className="fl-cmp__desc">{col.desc}</p>
                </div>
              </div>
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
      /* FOUR QUADRANTS AROUND A NAMED CENTRE (ADR-084 U2, owner 2026-09-14:
         the red line's bands are "not really clear what they're related
         to"). The four claims divide the field and one cross divides them;
         `hub` letters the subject at the crossing, with the rules stopping
         short of it so the label sits IN the division rather than on top of
         a line. Without a `hub` it is the plain 2×2 and no cross. */
      return (
        <div className={`fl-caps-block${body.hub ? " fl-caps-block--hub" : ""}`}>
          <ul className="fl-caps fl-caps--sheet">
            {body.facts.map((f) => (
              <li className="fl-cap" key={f.title}>
                {/* The category designation over the claim — the reader takes
                    the AXIS before the statement, which is what makes four
                    quadrants read as one ranked argument. */}
                {f.tag ? <span className="fl-cap__tag">{f.tag}</span> : null}
                <span className="fl-cap__t">{f.title}</span>
                <span className="fl-cap__d">{f.desc}</span>
              </li>
            ))}
          </ul>
          {body.hub ? <span className="fl-caps-block__hub">{body.hub}</span> : null}
        </div>
      );

    default: {
      const exhaustive: never = body;
      return exhaustive;
    }
  }
}
