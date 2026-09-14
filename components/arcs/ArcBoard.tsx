import type { ArcMotion, ArcSectionOf, BoardState } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { Letter, Module, Ribbon } from "./board/boardGlyphs";
import { boardGeom, type BoardGeom, type Role } from "./board/boardLayout";
import { arcTitleText } from "./chrome";

interface ArcBoardProps {
  section: ArcSectionOf<"board">;
  index: number;
  motion?: ArcMotion;
}

const ROLES: readonly Role[] = ["seat", "layer", "card", "tools", "reach"];

/**
 * ArcBoard — the client's configuration, one record drawn twice (ADR-100
 * U2, five facts since U4): a ruled LEDGER of the facts as they stand
 * today, beside the BOARD they become once a configuration is seated — the
 * proof's R4 grammar (ADR-070 U11) at page scale.
 *
 * ⚠ RADICALLY SIMPLE, BY OWNER RULING (U1). The first cut drew a bed, two
 * sockets, foot rows, hatched cables, four sentences and a second card row,
 * and grew the crop to the beat; he said "no, radically simplify it".
 *
 * ⚠ AND THE TWO SIDES ARE DIFFERENT KINDS OF DRAWING (U2). U1 kept them
 * symmetrical — the same slots, dashed — and he read it as one picture at
 * two brightnesses: "it shouldn't look too similar to the right … a
 * contrast like before and after, but without implying they're
 * unorganized". A ledger is the answer: ordered, complete, and connected to
 * nothing.
 *
 * ⚠ NOT IN A FRAME. The row has no plate, no border and no ground: the
 * modules are the objects and the page's own ground shows between them —
 * on the Trinny page, the turn's coral wash.
 *
 * ⚠ ONE BAND, AND U2's TWO ARE REVERSED (U4). The head stayed on the TEXT
 * band while the drawing took the INSTRUMENT band, reasoning that a drawing
 * is a wide figure. Measured at 1920×1247: the head is PIXEL-IDENTICAL to
 * the phases' (title x 360, copy x 1146.7) and it was the DRAWING that was
 * out — 240—1680 against a head at 360—1560, so the head read 120px inboard
 * of its own drawing on each side while every plate beat below sits flush
 * with its head. The owner read that as the head being "a bit more centered
 * versus the other sections", and the plates are the gold standard. Both
 * blocks take `.arc-band`. The cost is the meet: 1440/1400 → 1200/1400 at
 * 1920, so the chrome rung paints 13.1px rather than 15.7 (the floor is 10);
 * below the ~1503px crossover the two bands coincide and nothing moves.
 * `:has(> .arc-band > .arc-head)` still matches the first band, so the datum
 * rule and the beat's id are untouched.
 *
 * ⚠ SERVER, NO STATE, NO SCRIPT. The arrival is CSS on `.is-in`; no-JS,
 * reduced motion and terminal all render LIT.
 */
export function ArcBoard({ section, index, motion = "reveal" }: ArcBoardProps) {
  const [today, configured] = section.states;
  return (
    <ArcBeat
      id={section.id}
      kind="board"
      className="arc-section arc-sec arc-sec--board"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="board"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
      </div>
      <div className="arc-band">
        <div
          className="arc-board arc-reveal"
          role="group"
          aria-label={`${today.label}, and ${configured.label.toLowerCase()}`}
          {...rung(motion, 0.14)}
        >
          <Board state={today} />
          <Board state={configured} />
        </div>
      </div>
    </ArcBeat>
  );
}

function Board({ state }: { state: BoardState }) {
  const g = boardGeom(state);
  return (
    <figure
      className={`arc-board__state arc-board__state--${state.mode}`}
      data-board-state={state.mode}
    >
      <svg
        className="arc-board__svg"
        viewBox={`0 0 ${g.vb.w} ${g.vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={state.alt}
      >
        {/* The ribbons go under the modules, so their entries are hidden by
            the opaque plates — R4's own order. */}
        {g.lanes.map((lane) => (
          <g key={lane.id} data-board-lane={lane.id}>
            <Ribbon lane={lane} />
          </g>
        ))}
        {ROLES.map((role) => (
          <RoleGroup key={role} role={role} g={g} />
        ))}
      </svg>
    </figure>
  );
}

/** Everything of one role, in one group the arrival ladder can light. */
function RoleGroup({ role, g }: { role: Role; g: BoardGeom }) {
  const modules = g.modules.filter((m) => m.role === role);
  const letters = g.letters.filter((l) => l.role === role);
  return (
    <g data-board-role={role} className={role === "card" ? "arc-board__bloom" : "arc-board__in"}>
      {modules.map((m) => (
        <Module key={m.id} m={m} />
      ))}
      {letters.map((l) => (
        <Letter key={l.slot} l={l} />
      ))}
    </g>
  );
}
