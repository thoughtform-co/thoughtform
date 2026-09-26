"use client";

import type {
  CaseMapDistrict,
  CaseMapShape,
  CaseMapStream,
  CaseMapWork,
  CaseSkillEntry,
} from "@/lib/cases/types";

import { PdaConsole } from "./map/pda/PdaConsole";

/**
 * THE WORK-TO-INTELLIGENCE MAP.
 *
 * The casefile's right panel is a held instrument — a chamfered console
 * frame around the drawing (the orbit ring, head badge and foot sentence
 * have all since been decluttered away — ADR-068 U1/U2).
 * Two readings since ADR-126 (three until then), direct access, any order:
 *
 *   01 THE WORK           the marketing estate — twelve cartridges in three
 *                         workstream columns, each climbing prompt → agent
 *   02 THE CONFIGURATION  one stream, with four modules seated into it
 *
 * Ported from the owner's `thoughtform-intelligence-map-v18.html`; every
 * coordinate in `map/pda/**` is his. The isometric city this replaces
 * (ADR-062) is still on disk — `map/MapSurface.tsx` and its three sheets are
 * untouched and their projection test still passes — because a drawing that
 * took nine measured defects to fit is worth being able to go back to.
 *
 * ⚠ POINTER OPT-IN. `.fl-pda` is an `auto` island on a `pointer-events: none`
 * host, and it must stay scoped to the plate: the casefile sits at z 6 over
 * `.svc-ring-hits__hit` at z 4, so lifting it to the host silently swallows
 * every card click once the ring lands (`.claude/rules/proof.md`).
 *
 * ⚠ KEYS ARE SCOPED TO THE PLATE, not `document`. This surface lives inside a
 * scroll-pinned corridor beat with its own key handling; a global listener
 * would fight it. React's synthetic events bubble from the focused
 * descendant, so the binding works without a global hook.
 */

interface Props {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  /** The three creative workstreams reading 01 columns by (ADR-126). */
  streams: readonly CaseMapStream[];
  works: readonly CaseMapWork[];
  /**
   * ⚠ THE SKILLS RESERVOIR IS GEOMETRY NOW, not just evidence the plate
   * sums. Reading 03 letters one plate per named Skill, so this array
   * stopped being something the registry row alone consumed — a missing
   * `skills` prop is five empty cards, not a smaller number somewhere.
   */
  skills: readonly CaseSkillEntry[];
  envelope: "WITHIN" | "AT" | "OVER";
  /**
   * Optional: where the console's reading rail paints, if not on the
   * console's own top edge (ADR-094 U1). A pass-through — this plate has
   * never been anything but the seam between the casefile's vocabulary and
   * the map's, and it stays that.
   */
  railHost?: HTMLElement | null;
}

export function IntelligenceMapPlate({
  shapes,
  districts,
  streams,
  works,
  skills,
  envelope,
  railHost,
}: Props) {
  return (
    <PdaConsole
      shapes={shapes}
      districts={districts}
      streams={streams}
      works={works}
      skills={skills}
      envelope={envelope}
      railHost={railHost}
    />
  );
}
