/**
 * Rail Manifest — canonical journey data (ADR-031).
 *
 * The left HUD rail's journey registry: one entry per beat, in
 * PRODUCTION order (ADR-033 funnel — hero → corridor → services →
 * about → continuum → practice → contact). Since Update 9 the rail
 * renders ONE detent diamond over this list, and the corridor is
 * represented at BEAT granularity — Thesis → Navigate → Encode → Build
 * (the Arc's three moves are first-class journey entries, so the
 * marker follows the corridor's structure, not just section
 * boundaries). All four share one mount element, which is why this
 * list is explicitly curated instead of DOM-derived;
 * `tests/lib/rail-manifest.test.ts` carries a drift guard asserting the
 * station-kind entries match the parsed production DOM.
 *
 * `label` is the authored station number (the Arc's beats all carry
 * the Arc's "03"). Display of labels retired with the rolodex
 * (Update 9) — kept as data.
 *
 * Pure data — imported by the server-side parse builder
 * (`lib/v7-parse/railManifest.ts`) and the client controller
 * (`components/landing/v7/RailManifest.tsx`).
 */

export type ManifestEntryId =
  | "hero"
  | "thesis"
  | "navigate"
  | "encode"
  | "build"
  | "services"
  | "about"
  | "proof"
  | "practice"
  | "contact";

export interface ManifestEntry {
  id: ManifestEntryId;
  /** Authored station number (vestigial since Update 9 — not displayed). */
  label: string;
  /** Beat name — revealed by the detent diamond on hover / focus. */
  name: string;
  kind: "station" | "corridor";
  /**
   * Scroll target: the station element id, or the corridor mount id
   * for corridor entries (which add `scrollFraction` into the runway).
   */
  targetId: string;
  /**
   * Corridor only: the `data-corridor-phase` value that marks this beat
   * active. Published by the CorridorStationHeaders RAF (single writer)
   * from `paintProgress` hand-offs that MIRROR CorridorProgressRail's
   * STAGES band starts, so the left diamond and the right-rail register
   * agree on the active beat.
   */
  corridorPhase?: "thesis" | "navigate" | "encode" | "build";
  /** Corridor only: fraction into the mount runway (raw stage progress,
   *  0..1 across the whole 820svh) — BOTH the click-nav landing spot and
   *  the detent position. Beat parks are paintProgress × EPILOGUE_START
   *  (620/820): Navigate 0.40 → 0.30, Encode 0.636 → 0.48,
   *  Build 0.923 → 0.70. */
  scrollFraction?: number;
  /** Hero canon: the first viewport shows no rail title. */
  hideActiveName?: boolean;
}

export const CORRIDOR_MOUNT_ID = "home-corridor-mount";

/**
 * The title the rail marker reveals on hover for a given entry — or
 * `null` when the entry has none (ADR-031 Update 9, the detent diamond).
 * `hero` hides its rail title (hero canon), and future interstitial
 * slides can opt out the same way (`hideActiveName: true`, or an empty
 * `name`). One place so the controller and any test agree on the rule.
 */
export function manifestTitle(entry: ManifestEntry): string | null {
  return entry.hideActiveName || !entry.name?.trim() ? null : entry.name;
}

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
  // ── The Arc's three beats (Update 9 — was one "arc" entry). The
  // diamond visits each park; `data-corridor-phase` advances at the
  // shared hand-offs (0.2 / 0.48 / 0.78 in paintProgress). ──
  {
    id: "navigate",
    label: "03",
    name: "Navigate",
    kind: "corridor",
    targetId: CORRIDOR_MOUNT_ID,
    corridorPhase: "navigate",
    scrollFraction: 0.3,
  },
  {
    id: "encode",
    label: "03",
    name: "Encode",
    kind: "corridor",
    targetId: CORRIDOR_MOUNT_ID,
    corridorPhase: "encode",
    scrollFraction: 0.48,
  },
  {
    id: "build",
    label: "03",
    name: "Build",
    kind: "corridor",
    targetId: CORRIDOR_MOUNT_ID,
    corridorPhase: "build",
    scrollFraction: 0.7,
  },
  {
    id: "services",
    label: "08",
    name: "Services",
    kind: "station",
    targetId: "services",
  },
  {
    // The navigator is the third brand pillar (ADR-033; replaced the
    // retired "Products"/#tools entry — the cases live in the Arc's
    // Build-park reveal now).
    id: "about",
    label: "09",
    name: "About",
    kind: "station",
    targetId: "about",
  },
  // The client case (ADR-054) — the evidence beat that replaced the
  // ADR-049 continuum. (Its three Navigate/Encode/Build sub-rows were
  // folded into the retired section menu; subsections went with it,
  // ADR-055.)
  { id: "proof", label: "05", name: "Proof", kind: "station", targetId: "proof" },
  { id: "practice", label: "06", name: "Practice", kind: "station", targetId: "practice" },
  { id: "contact", label: "10", name: "Contact", kind: "station", targetId: "contact" },
] as const;
