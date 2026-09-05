"use client";

import { useEffect, useRef } from "react";

import { LabelGrammar, LineLadder, Marks, TypeLadder } from "./specimens/foundations";
import { Frames, PanelAnatomy } from "./specimens/frames";
import { Buttons, Readouts, Rows, Stations } from "./specimens/controls";

/**
 * THE DESIGN GRID — every rule the kit proposes, drawn once, at the size it
 * ships at, under the same knobs the panel obeys.
 *
 * ⚠ IT READS ONLY `--ik-*`. The panel view proves a rule on the real surface;
 * this view proves the rule EXISTS as one value rather than as nine hand-tuned
 * ones. If a specimen needs a literal that is not a token, the token is missing
 * — that is the sheet's whole diagnostic job.
 *
 * ⚠ AND IT IS ONE SCROLL, NOT A GALLERY OF CARDS. Each section is a band with a
 * head on the left and its specimens on the right, on the same 34.5% column
 * split the casefile uses, so the sheet is itself an instance of the grammar it
 * documents.
 */

const SECTIONS = [
  {
    id: "line",
    n: "LINE LAW",
    claim: "One weight, one hue, three alphas by role.",
    body: <LineLadder />,
  },
  {
    id: "type",
    n: "TYPE LADDER",
    claim: "One modular scale, two faces, nothing above 500.",
    body: <TypeLadder />,
  },
  {
    id: "labels",
    n: "LABEL GRAMMAR",
    claim: "Five forms, one rung and one alpha each.",
    body: <LabelGrammar />,
  },
  { id: "marks", n: "MARKS", claim: "A diamond, a reticle, a tick.", body: <Marks /> },
  {
    id: "frames",
    n: "FRAMES",
    claim: "Chamfer is a device, a bracket is a frame, a child is square.",
    body: <Frames />,
  },
  {
    id: "stations",
    n: "STATIONS",
    claim: "Selection is a box, and one of three ways to mark it.",
    body: <Stations />,
  },
  {
    id: "buttons",
    n: "BUTTONS",
    claim: "Three ranks, four states, ink on gold never void.",
    body: <Buttons />,
  },
  {
    id: "rows",
    n: "DIRECTORY ROWS",
    claim: "The file register, and the panel's one unambiguous accent spend.",
    body: <Rows />,
  },
  {
    id: "readouts",
    n: "READOUTS",
    claim: "A pair, a strip, a bench — and never a meter without its figure.",
    body: <Readouts />,
  },
  {
    id: "anatomy",
    n: "PANEL ANATOMY",
    claim: "A bar to hang from, a body, a foot that says one thing.",
    body: <PanelAnatomy />,
  },
];

export function KitSheet() {
  const ref = useRef<HTMLDivElement>(null);

  /**
   * ⚠ THE TYPE LADDER PRINTS ITS RESOLVED SIZES, MEASURED, NOT DECLARED.
   * The whole finding this kit exists for is a COUNT of rendered values, so a
   * sheet that printed its own intended sizes would be the same class of
   * document that let fifteen letter-spacings accumulate. Read off the live
   * computed style, one task after layout — a task rather than a frame, because
   * rAF stalls in a hidden document and this is what the capture shoots.
   */
  useEffect(() => {
    const t = window.setTimeout(() => {
      const rows = ref.current?.querySelectorAll<HTMLElement>(".ik-type__row") ?? [];
      for (const row of rows) {
        const sample = row.querySelector<HTMLElement>(".ik-type__sample");
        const out = row.querySelector<HTMLElement>(".ik-type__px");
        if (!sample || !out) continue;
        const cs = getComputedStyle(sample);
        const px = Math.round(parseFloat(cs.fontSize) * 10) / 10;
        /* Tracking in EM, not the computed px. The whole finding is a count of
           rungs, and a rung is an em: the same `.06em` reads as three different
           pixel values across this ladder, which is exactly the confusion a
           ladder printed in px would hide. */
        const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
        const em = (Math.round((ls / parseFloat(cs.fontSize)) * 1000) / 1000).toFixed(3);
        out.textContent = `${px}px · ${cs.fontWeight} · ${em}em`;
      }
    }, 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="ik-sheet" ref={ref}>
      {SECTIONS.map((s) => (
        <section className="ik-sec" data-ik-section={s.id} key={s.id}>
          <header className="ik-sec__head">
            <span className="ik-sec__n">{s.n}</span>
            <p className="ik-sec__claim">{s.claim}</p>
          </header>
          <div className="ik-sec__body">{s.body}</div>
        </section>
      ))}
    </div>
  );
}
