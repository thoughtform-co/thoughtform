import type { ArcMotion, ArcSectionOf, BoardState } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { Diamond, Letter, Module, Ribbon } from "./board/boardGlyphs";
import { boardGeom, type BoardGeom, type Role } from "./board/boardLayout";
import { arcTitleText } from "./chrome";

interface ArcBoardProps {
  section: ArcSectionOf<"board">;
  index: number;
  motion?: ArcMotion;
}

const ROLES: readonly Role[] = ["head", "seat", "layer", "card", "tools"];

/**
 * ArcBoard — the client's configuration as a circuit board in two states
 * (ADR-100): as it runs today, dormant, beside the same studio with a
 * configuration seated, lit. Four objects each — the seat, the layer, the
 * card, the tools — one line apiece, in the proof's R4 grammar (ADR-070
 * U11) at page scale.
 *
 * ⚠ RADICALLY SIMPLE, BY OWNER RULING (U1). The first cut drew a bed, two
 * sockets, foot rows, hatched cables, four sentences and a second card row,
 * and grew the crop to the beat; he said "no, radically simplify it". What
 * survives is the reading and nothing that decorates it.
 *
 * ⚠ NOT IN A FRAME. The row has no plate, no border and no ground: the
 * modules are the objects and the page's own ground shows between them —
 * on the Trinny page, the turn's coral wash.
 *
 * ⚠ TWO BANDS, DELIBERATELY. The head stays on the TEXT band so it seats on
 * the same x as every other proposal head (ADR-099's datum guard measures
 * `seatOf("configuration")` against the phases and the fee). The drawing
 * takes the INSTRUMENT band. `:has(> .arc-band > .arc-head)` still matches
 * the first band, so the datum rule and the beat's id are untouched.
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
      <div className="arc-band arc-band--instrument">
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
  const diamonds = g.diamonds.filter((d) => d.role === role);
  return (
    <g data-board-role={role} className={role === "card" ? "arc-board__bloom" : "arc-board__in"}>
      {role === "head" ? (
        <line
          x1={g.datum.x1}
          y1={g.datum.y}
          x2={g.datum.x2}
          y2={g.datum.y}
          stroke="var(--arc-board-edge)"
        />
      ) : null}
      {modules.map((m) => (
        <Module key={m.id} m={m} />
      ))}
      {diamonds.map((d) => (
        <Diamond key={d.id} d={d} />
      ))}
      {letters.map((l) => (
        <Letter key={l.slot} l={l} />
      ))}
    </g>
  );
}
