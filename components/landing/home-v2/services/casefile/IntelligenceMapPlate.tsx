"use client";

import type { CaseMapDistrict, CaseMapShape, CaseMapWork } from "@/lib/cases/types";

import { PdaConsole } from "./map/pda/PdaConsole";

/**
 * THE WORK-TO-INTELLIGENCE MAP.
 *
 * The casefile's right panel is a held instrument — a console with an orbit
 * ring behind it, a chamfered frame, a gold badge in its head, a depth rail
 * down its left side and a foot that says what the reader is looking at.
 * Three readings, direct access, any order:
 *
 *   01 THE WORK           twenty cartridges, four across
 *   02 THE CONFIGURATION  one stream, with four modules seated into it
 *   03 THE SUBSTRATE      the teams, the shapes, and the crossing between
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
  works: readonly CaseMapWork[];
  envelope: "WITHIN" | "AT" | "OVER";
}

export function IntelligenceMapPlate({ shapes, districts, works, envelope }: Props) {
  return <PdaConsole shapes={shapes} districts={districts} works={works} envelope={envelope} />;
}
