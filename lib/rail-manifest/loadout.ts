/**
 * Resource Loadout — shared data + state math (ADR-031 follow-up).
 *
 * The loadout is a persistent HUD micro-instrument at the foot of the
 * left rail showing the three core RESOURCES of the journey — Arc,
 * Services, Tools — as pluggable modules that seat as the reader reaches
 * each section, backed by a charge gauge. It is a fourth consumer of the
 * single active-index resolved by `resolveActiveIdx` (no new scroll
 * writer, no store): every socket state and the gauge value are pure
 * functions of that integer.
 *
 * Shared by the parse-time builder (`lib/v7-parse/railLoadout.ts`), the
 * client controller (`components/landing/v7/RailLoadout.tsx`), and the
 * unit tests. The three resource ids are read directly here rather than
 * via a `glyph` flag on `entries.ts`, so the manifest drift-guard
 * (`tests/lib/rail-manifest.test.ts`) stays pinned to services-only.
 */

import { MANIFEST_ENTRIES, type ManifestEntry, type ManifestEntryId } from "./entries";

/** The three core resources shown in the loadout, in journey order. */
export const LOADOUT_RESOURCE_IDS = [
  "arc",
  "services",
  "tools",
] as const satisfies readonly ManifestEntryId[];

export type LoadoutState = "upcoming" | "active" | "seated";

export interface LoadoutResource {
  entry: ManifestEntry;
  /** Index of this resource's entry within `MANIFEST_ENTRIES`. */
  manifestIdx: number;
  /** Short display name for the socket ("Arc" / "Services" / "Tools"). */
  name: string;
}

export const LOADOUT_RESOURCES: readonly LoadoutResource[] = LOADOUT_RESOURCE_IDS.map((id) => {
  const manifestIdx = MANIFEST_ENTRIES.findIndex((e) => e.id === id);
  const entry = MANIFEST_ENTRIES[manifestIdx];
  return { entry, manifestIdx, name: entry.name };
});

/** A socket's state as a pure function of the resolved active index. */
export function loadoutState(manifestIdx: number, activeIdx: number): LoadoutState {
  if (activeIdx < manifestIdx) return "upcoming";
  if (activeIdx === manifestIdx) return "active";
  return "seated";
}

/** Number of resources reached (0..3) — the charge gauge value. */
export function chargeForActiveIdx(activeIdx: number): number {
  return LOADOUT_RESOURCES.filter((r) => activeIdx >= r.manifestIdx).length;
}

/** Status word for a socket's `aria-label`. */
export function loadoutStatusWord(state: LoadoutState): string {
  return state === "active" ? "active" : state === "seated" ? "loaded" : "pending";
}
