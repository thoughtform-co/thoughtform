/**
 * /test/map-phone-lab — the registry (the field-log-lab four-field contract:
 * id, label, thesis, provenance). `shipped` mounts production; the three
 * directions are the owner's pick of four (2026-09-25: One stream, Readout
 * rows, Swipe deck — the dial was declined before it was built).
 */

import type { MplDirection } from "./models";

export type MplId = "shipped" | MplDirection;

export interface MplDirectionDef {
  id: MplId;
  label: string;
  thesis: string;
  provenance: string;
}

export const MPL_DIRECTIONS: Record<MplId, MplDirectionDef> = {
  shipped: {
    id: "shipped",
    label: "Shipped",
    thesis:
      "Production today (ADR-107 U2): three lists keyed on the rail — the index, the configured streams' three answers, the five shapes with their Skills. Two to four bays of inner scroll per reading.",
    provenance: "components/landing/home-v2/services/casefile/map/pda/PdaPhoneReadings.tsx",
  },
  pick: {
    id: "pick",
    label: "One stream",
    thesis:
      "One thing per reading, tied by one selected stream: WORK is the estate as a field of state tiles you pick from, CONFIGURATION is that stream as a spine (owner, card, three answers), LAYER is five bars by Skill count with that stream's shapes lit.",
    provenance: "ADR-069's persistent object, cut for a phone; the R4 board read top to bottom.",
  },
  rows: {
    id: "rows",
    label: "Readout rows",
    thesis:
      "The owner's travel-data grammar and nothing else: a framed key, the value set right. Departments with their state marks; a stepper and four answers; five shapes as runs of Skill ticks with the open one's sentence.",
    provenance: "Starfield's TRAVEL DATA rows, the /arcs dossier (ADR-118 U3).",
  },
  deck: {
    id: "deck",
    label: "Swipe deck",
    thesis:
      "One object per swipe on a horizontal snap track, a single lit segment for the position: a card per department, per stream, per shape — the shape cards over their own physics field.",
    provenance: "The phone's own gesture; the rail's travelling segment as the position mark.",
  },
};

export const MPL_IDS: readonly MplId[] = ["shipped", "pick", "rows", "deck"];

export function isMplId(v: string | null): v is MplId {
  return v === "shipped" || v === "pick" || v === "rows" || v === "deck";
}

/** The three phone frames the directions are judged in. 681 is the ring and
 *  pile rung's floor (`min-height: 681px`) and the CI proxy for the
 *  toolbar-shown iPhone frame; 844 the toolbar-hidden iPhone 14; 932 the Pro
 *  Max. ⚠ The bay each yields is PRODUCTION's arithmetic, not the lab's:
 *  the field sheet is built from `proof-stack.css`'s own split rules. */
export const MPL_PRESETS = {
  p681: { w: 390, h: 681 },
  p844: { w: 390, h: 844 },
  p932: { w: 430, h: 932 },
} as const;
export type MplPreset = keyof typeof MPL_PRESETS;

export function isMplPreset(v: string | null): v is MplPreset {
  return v === "p681" || v === "p844" || v === "p932";
}
