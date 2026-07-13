/**
 * Rail Manifest — canonical journey data (ADR-031).
 *
 * The left HUD rail's station manifest: one slot per journey entry, in
 * PRODUCTION order (ADR-021 corridor reorder — hero → corridor
 * [Thesis/Arc] → services → tools → continuum → practice → build →
 * about → contact), NOT the authored prototype order. The corridor
 * phases are first-class entries even though they share one mount
 * element, which is why this list is explicitly curated instead of
 * DOM-derived; `tests/lib/rail-manifest.test.ts` carries a drift guard
 * asserting the station-kind entries match the parsed production DOM.
 *
 * `label` is the authored station number, displayed ONLY on the
 * ACTIVE rolodex row (Update 3 canon — every row shows its name, the
 * number rides the active row alone): the production sequence is
 * non-monotonic (…03, 08, 08A, 05…) because services + tools relocate
 * ahead of continuum, and showing one number at a time keeps that
 * invisible while staying consistent with the station corner chrome
 * ("08 SERVICES").
 *
 * Pure data — imported by the server-side parse builder
 * (`lib/v7-parse/railManifest.ts`) and the client controller
 * (`components/landing/v7/RailManifest.tsx`).
 */

export type ManifestEntryId =
  | "hero"
  | "thesis"
  | "arc"
  | "services"
  | "tools"
  | "continuum"
  | "practice"
  | "build"
  | "about"
  | "contact";

export interface ManifestEntry {
  id: ManifestEntryId;
  /** Authored station number — rides ONLY the active rolodex row. */
  label: string;
  /** Station name — always visible in the reel (the active row
   *  prefixes the authored number, scramble-decoded). */
  name: string;
  kind: "station" | "corridor";
  /**
   * Scroll target: the station element id, or the corridor mount id
   * for corridor entries (which add `scrollFraction` into the runway).
   */
  targetId: string;
  corridorPhase?: "thesis" | "arc";
  /** Corridor only: fraction into the mount runway the click lands at. */
  scrollFraction?: number;
  /** Brand pillars (Arc / Services / Tools): the layered-stack module
   *  glyph (the folded card ring) rides these three rolodex rows as a
   *  "most important elements" marker — always shown, fill by state. */
  glyph?: "stack";
  /** Hero canon: the first viewport shows no rail title. */
  hideActiveName?: boolean;
}

export const CORRIDOR_MOUNT_ID = "home-corridor-mount";

export const MANIFEST_ENTRIES: readonly ManifestEntry[] = [
  {
    id: "hero",
    label: "01",
    name: "Hero",
    kind: "station",
    targetId: "hero",
    hideActiveName: true,
  },
  {
    id: "thesis",
    label: "02",
    name: "Thesis",
    kind: "corridor",
    targetId: CORRIDOR_MOUNT_ID,
    corridorPhase: "thesis",
    scrollFraction: 0,
  },
  {
    id: "arc",
    label: "03",
    name: "Arc",
    kind: "corridor",
    targetId: CORRIDOR_MOUNT_ID,
    corridorPhase: "arc",
    // Provisional — tuned against where data-corridor-phase actually
    // flips to "arc" (ADR-031; verify live).
    scrollFraction: 0.35,
    glyph: "stack",
  },
  {
    id: "services",
    label: "08",
    name: "Services",
    kind: "station",
    targetId: "services",
    glyph: "stack",
  },
  { id: "tools", label: "08A", name: "Tools", kind: "station", targetId: "tools", glyph: "stack" },
  { id: "continuum", label: "05", name: "Continuum", kind: "station", targetId: "continuum" },
  { id: "practice", label: "06", name: "Practice", kind: "station", targetId: "practice" },
  { id: "build", label: "07", name: "Build", kind: "station", targetId: "build" },
  { id: "about", label: "09", name: "About", kind: "station", targetId: "about" },
  { id: "contact", label: "10", name: "Contact", kind: "station", targetId: "contact" },
] as const;
