/**
 * artifactGeom — geometry contract, reveal envelopes, and label
 * payloads for the Intelligence Layer Artifact demo.
 *
 * The artifact is a low-angle topographic deck with a central
 * substrate sphere, concentric polygonal tracks, raised satellite
 * pylons, and inbound source channels. Three semantic layers map
 * onto spatial roles:
 *
 *   - Trusted sources  -> outer perimeter pips + inbound channels.
 *   - Encoded judgment -> central substrate sphere + brandmark cloud.
 *   - Knowledge graph  -> faint hairline struts between sphere
 *                          vertices and the inner deck ring.
 *   - Headless surfaces -> raised pylons + endpoint diamonds.
 *
 * All scalars are world units (Three.js). The deck lies on the XZ
 * plane (Y = 0), pylons rise on +Y, and the camera looks down at a
 * shallow angle so the artifact reads as engineered infrastructure
 * rather than a chart.
 */

// ── Phase envelopes (global progress [0..1] → per-phase scalars) ─────

export interface PhaseWindow {
  /** Progress at which the phase begins to emerge. */
  readonly start: number;
  /** Progress at which the phase is fully present. */
  readonly peak: number;
  /** Progress past which the phase begins to recede (or 1.0). */
  readonly end: number;
}

/**
 * Reveal envelopes. Each phase emerges over `[start, peak]`, holds
 * through `[peak, end]`, and stays at 1.0 past `end` so the resolved
 * artifact remains visible at progress = 1. The Gateway phase is the
 * exception — it fully recedes once the user is past `end` because it
 * represents the descent itself.
 */
export const PHASES: Record<
  "gateway" | "sources" | "substrate" | "graph" | "surfaces" | "resolved",
  PhaseWindow
> = {
  gateway: { start: 0.0, peak: 0.08, end: 0.18 },
  sources: { start: 0.16, peak: 0.32, end: 1.0 },
  substrate: { start: 0.36, peak: 0.56, end: 1.0 },
  graph: { start: 0.46, peak: 0.62, end: 1.0 },
  surfaces: { start: 0.6, peak: 0.8, end: 1.0 },
  resolved: { start: 0.82, peak: 0.96, end: 1.0 },
};

// ── Deck geometry ────────────────────────────────────────────────────

/** Outer deck track radius (the outermost polygon). */
export const DECK_OUTER_RADIUS = 3.2;
/** Middle deck track radius (carries plated segments + pylon roots). */
export const DECK_MID_RADIUS = 2.62;
/** Inner deck track radius (the substrate boundary). */
export const DECK_INNER_RADIUS = 1.9;

/** Number of sides for each polygonal track. Higher = smoother circle,
 *  lower = more obviously engineered. 12 (dodecagon) reads as
 *  "instrument" without looking pixelated. */
export const DECK_OUTER_SIDES = 12;
export const DECK_MID_SIDES = 12;
export const DECK_INNER_SIDES = 24;

/** Vertical drop applied to the deck plates so the artifact reads as
 *  a layered podium rather than a flat circle. The outer ring sits at
 *  Y = 0; the mid ring lifts to Y = `DECK_LIFT`; the inner ring (and
 *  substrate base) lift further. */
export const DECK_LIFT = 0.08;

/** Per-side tick marker count along the outer track. Reads as bearing
 *  ticks. Multiplied by `DECK_OUTER_SIDES` to keep them aligned with
 *  the polygon vertices. */
export const OUTER_TICKS_PER_SIDE = 4;

// ── Substrate core ───────────────────────────────────────────────────

/** Geodesic sphere radius. Sized to sit visibly inside the inner deck
 *  without crowding the surrounding graph struts. */
export const SUBSTRATE_RADIUS = 0.92;

/** Vertical lift of the sphere centre above the deck plane. The
 *  brandmark cloud and sphere centre coincide. */
export const SUBSTRATE_LIFT = 0.55;

/** Icosahedron detail level for the geodesic wireframe. `1` gives a
 *  classic 80-face geodesic, which reads as engineered without looking
 *  like a low-poly model. */
export const SUBSTRATE_DETAIL = 1;

/** Inner wireframe detail level — a tighter geodesic used as a faint
 *  inner shell to hint at depth. */
export const SUBSTRATE_INNER_DETAIL = 2;

/** Brandmark particle count for the central cloud. The brandmark is
 *  sampled face-on and billboarded to the camera so the shape always
 *  reads from the artifact's primary viewing angle. */
export const BRANDMARK_PARTICLE_COUNT = 1600;

/** Half-extent of the brandmark cloud in world units (matches the
 *  substrate sphere's projected radius from the parked camera so the
 *  mark visibly INHABITS the sphere). */
export const BRANDMARK_HALF_EXTENT = SUBSTRATE_RADIUS * 0.82;

// ── Trusted sources ──────────────────────────────────────────────────

/** Source pip count distributed around the outer deck. Even spacing
 *  reads as instrumented (provenance taps) rather than a generic
 *  starfield. */
export const SOURCE_PIP_COUNT = 8;

/** Inbound channel length — how far each source channel extends from
 *  the outer pip toward the substrate before fading. Short enough that
 *  the channels point at the centre without crossing the sphere. */
export const SOURCE_CHANNEL_INNER_RADIUS = DECK_MID_RADIUS - 0.2;

/** Per-channel dust particle count (sparse motes drifting along the
 *  source channels). */
export const SOURCE_CHANNEL_MOTE_COUNT = 12;

// ── Knowledge graph ──────────────────────────────────────────────────

/** Per-vertex struts drawn from the inner deck up toward the substrate
 *  sphere. Reads as semantic relations binding the substrate to the
 *  deck. */
export const GRAPH_STRUT_COUNT = 8;

/** Inner deck rim radius for the graph strut roots (slightly inset
 *  from the inner track so struts visibly attach to the deck, not the
 *  track line itself). */
export const GRAPH_STRUT_ROOT_RADIUS = DECK_INNER_RADIUS - 0.06;

// ── Headless surface pylons ──────────────────────────────────────────

/** Number of pylons around the rim. Matches the source pip count so
 *  the artifact reads symmetrically (each source has a matching
 *  surface — a clean visual rhythm, not a literal 1:1 mapping). */
export const PYLON_COUNT = 6;

/** Pylon root radius (where the post meets the deck). Offset slightly
 *  outboard of the mid track so the pylons sit ON the deck rather
 *  than ON the track line. */
export const PYLON_ROOT_RADIUS = DECK_MID_RADIUS + 0.18;

/** Pylon mast height above the deck plane. */
export const PYLON_HEIGHT = 0.72;

/** Cap diamond half-extent on each pylon. */
export const PYLON_CAP_SIZE = 0.09;

// ── Gateway descent ring ─────────────────────────────────────────────

/** Gateway ring world radius (a frontal bearing ring the camera flies
 *  through during the alignment phase). */
export const GATEWAY_RADIUS = 1.6;

/** Z position the gateway starts at (in front of the artifact, far
 *  from the camera). */
export const GATEWAY_Z_START = -4.0;

/** Z position the gateway ends at (past the camera). */
export const GATEWAY_Z_END = 4.8;

// ── Camera ───────────────────────────────────────────────────────────

/** Vertical FOV for the artifact camera. */
export const CAMERA_FOV = 36;

/** Resting camera position (low-angle, slightly above the deck). */
export const CAMERA_POSITION: readonly [number, number, number] = [0, 2.4, 6.2];

/** Camera look-at target (just above the deck plane, biased toward
 *  the substrate sphere). */
export const CAMERA_LOOK_AT: readonly [number, number, number] = [0, 0.35, 0];

/** Tiny camera orbit applied while the resolved view holds — gives
 *  the parked artifact a slow hand-flown feel. */
export const CAMERA_ORBIT_RADIUS = 0.16;
export const CAMERA_ORBIT_LIFT = 0.08;
export const CAMERA_ORBIT_PERIOD_SEC = 28;

// ── Colour tokens ────────────────────────────────────────────────────

/** Thoughtform palette as Three.js colour hex values. */
export const COLOR_GOLD = 0xcaa554;
export const COLOR_GOLD_RIM = 0xe9c97a;
export const COLOR_DAWN = 0xebe3d6;
export const COLOR_VOID = 0x0a0908;
/** Atreides light — provenance / "the work that came before" tier. */
export const COLOR_ATREIDES = 0x5b7a4e;

// ── Role-tier mapping ────────────────────────────────────────────────
//
// Each of the three intelligence-layer roles owns ONE colour from the
// canonical Thoughtform palette tiers. The variants below all paint
// their Sources / Substrate / Surfaces zones with these same colours
// so the role is readable across forms.

/** Atreides-green family. Provenance, "where the work comes from". */
export const COLOR_SOURCES = COLOR_ATREIDES;
/** Canonical gold. The active centre — you-are-here / encoded judgment. */
export const COLOR_SUBSTRATE = COLOR_GOLD;
/** Dawn family. Structure / output skin / headless surfaces. */
export const COLOR_SURFACES = COLOR_DAWN;

/** CSS-string equivalents for DOM labels and SVG fallback. */
export const COLOR_SOURCES_CSS = "#5b7a4e";
export const COLOR_SUBSTRATE_CSS = "#caa554";
export const COLOR_SURFACES_CSS = "#ebe3d6";

// ── Phase math helpers ───────────────────────────────────────────────

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Evaluate a phase envelope: emerges over [start, peak], holds at 1
 *  through [peak, end]. The Gateway phase passes a `recede` end to
 *  fade out past `end`; the rest stay at 1 so the resolved artifact
 *  is fully present at progress = 1. */
export function phasePresence(progress: number, window: PhaseWindow, recedeOver?: number): number {
  const rise = smoothstep(window.start, window.peak, progress);
  if (recedeOver === undefined) return rise;
  // Recede over a small window past `end`.
  const fall = 1 - smoothstep(window.end, window.end + recedeOver, progress);
  return rise * fall;
}

// ── Variants ─────────────────────────────────────────────────────────

/** Structural metaphors selectable in the lab page. Each maps the
 *  three layers onto a different spatial composition so the user can
 *  compare which form reads best.
 *
 *  - `armillary`     : low-angle deck + central substrate sphere +
 *                       raised pylons. Reads as engineered
 *                       infrastructure with the three layers as
 *                       distinct zones (perimeter / centre / rim).
 *  - `shell`         : single object with three concentric shells. The
 *                       substrate is the inner core; sources are a
 *                       tilted provenance band around it; surfaces are
 *                       the paneled outer skin with port glyphs.
 *  - `orbital`       : three planes orbiting one core. Each plane is
 *                       visually distinct (Sources green, Surfaces
 *                       dawn) and carries its own anchored label tag.
 *  - `strata`        : cross-section / layer cake viewed from the side.
 *                       Three vertically stacked slabs joined by
 *                       hairline pillars (Surfaces top dawn, Substrate
 *                       middle gold + brandmark, Sources bottom green).
 *  - `funnel`        : horizontal directional flow. Sources cluster on
 *                       the left feeding green motes inward, central
 *                       Substrate brandmark, Surfaces fan of port
 *                       channels on the right.
 *  - `constellation` : celestial navigation chart. Substrate at centre
 *                       + bearing rings + tick grid; Sources stars in
 *                       the upper hemisphere with inbound trajectories,
 *                       Surfaces stars in the lower hemisphere with
 *                       outbound trajectories.
 */
export type ArtifactVariant =
  | "armillary"
  | "shell"
  | "orbital"
  | "strata"
  | "funnel"
  | "constellation"
  | "aperture"
  // Corridor family — the home page's accreted shell composition
  // (low-poly brain + source orbits + outer shell) imported into the
  // lab as switchable variants. Each entry pairs the shared inner
  // composition with a different OUTER SHELL so we can compare shell
  // shapes in-context against the brain before picking a winner for
  // the production corridor.
  | "corridor-geodesic"
  | "corridor-rings"
  | "corridor-panels"
  | "corridor-contour"
  | "corridor-gem";

export interface VariantSpec {
  key: ArtifactVariant;
  label: string;
  sub: string;
}

export const ARTIFACT_VARIANTS: readonly VariantSpec[] = [
  { key: "armillary", label: "Armillary", sub: "Deck instrument" },
  { key: "shell", label: "Shell", sub: "Nested concentric layers" },
  { key: "orbital", label: "Orbital", sub: "Distinct planes" },
  { key: "strata", label: "Strata", sub: "Cross-section stack" },
  { key: "funnel", label: "Funnel", sub: "Directional flow" },
  { key: "constellation", label: "Constellation", sub: "Navigation chart" },
  { key: "aperture", label: "Aperture", sub: "Windows + orbiting sources" },
  // Corridor variants — same inner composition (brain + orbits),
  // different outer shell. Labels group them under `Home ·` so the
  // chrome switcher reads as a sub-family.
  { key: "corridor-geodesic", label: "Home · Geodesic", sub: "Current home shell" },
  { key: "corridor-rings", label: "Home · Rings", sub: "Armillary gimbal" },
  { key: "corridor-panels", label: "Home · Panels", sub: "Tangent surface plates" },
  { key: "corridor-contour", label: "Home · Contour", sub: "Latitude rings" },
  { key: "corridor-gem", label: "Home · Gem", sub: "Crystalline bipyramid" },
];

/** Aperture variant — interface-window labels for the highlighted
 *  facets. Each entry pairs a short uppercase interface name with the
 *  icosahedron face index it should render on. The list is kept short
 *  (six windows) so the sphere doesn't get crowded; the remaining
 *  facets stay unlit so the windows read as a deliberate subset.
 *
 *  Faces are picked by hand to spread roughly around the sphere when
 *  rendered as a detail-0 icosahedron (20 faces). The exact indices
 *  may need light tuning once the geodesic edge wireframe is in the
 *  scene; treated as preset coordinates here for clarity. */
export interface ApertureWindow {
  /** Stable id (URL-safe, used as a CSS class fragment). */
  id: string;
  /** Short uppercase label shown next to the window. */
  label: string;
  /** Index of the icosahedron face this window paints. Indices into
   *  `THREE.IcosahedronGeometry(_, 0)`'s face list. */
  faceIndex: number;
}

export const APERTURE_WINDOWS: readonly ApertureWindow[] = [
  { id: "api", label: "API", faceIndex: 1 },
  { id: "mcp", label: "MCP", faceIndex: 4 },
  { id: "web", label: "Web", faceIndex: 7 },
  { id: "slack", label: "Slack", faceIndex: 10 },
  { id: "cursor", label: "Cursor", faceIndex: 13 },
  { id: "claude", label: "Claude", faceIndex: 16 },
];

// ── Label anchors ───────────────────────────────────────────────────

/** World-space anchor points exposed by each variant. The leader-line
 *  label system projects these to canvas pixel coordinates each frame
 *  so the labels can connect to a visible point on the geometry while
 *  the label box itself stays at a fixed slot in the chrome.
 *
 *  Each anchor is a `[x, y, z]` tuple in the variant's local world
 *  coordinate system. The `AnchorProjector` reads them from the
 *  caller and projects them through the active camera. */
export interface ArtifactAnchors {
  sources: readonly [number, number, number];
  substrate: readonly [number, number, number];
  surfaces: readonly [number, number, number];
}

/** Slot keys used by the leader-line system. Match the role identifiers
 *  so CSS variables stay readable (`--anchor-sources-x`, etc.). */
export const ANCHOR_KEYS: readonly ["sources", "substrate", "surfaces"] = [
  "sources",
  "substrate",
  "surfaces",
];

// ── Labels ───────────────────────────────────────────────────────────

/** Phase labels surfaced beside the artifact at the resolved view.
 *  Short, one or two words — the artifact carries the meaning. */
export interface ArtifactLabel {
  id: "sources" | "substrate" | "surfaces";
  ordinal: string;
  title: string;
  sub: string;
  /** CSS colour, mapped to the role-tier palette above. */
  color: string;
}

export const ARTIFACT_LABELS: readonly ArtifactLabel[] = [
  {
    id: "sources",
    ordinal: "01",
    title: "Sources",
    sub: "where the work lives",
    color: COLOR_SOURCES_CSS,
  },
  {
    id: "substrate",
    ordinal: "02",
    title: "Substrate",
    sub: "how the team decides",
    color: COLOR_SUBSTRATE_CSS,
  },
  {
    id: "surfaces",
    ordinal: "03",
    title: "Surfaces",
    sub: "where the layer is called",
    color: COLOR_SURFACES_CSS,
  },
];

/** Phase telemetry shown above the artifact while scrubbing — gives
 *  the lab a "spec readout" register rather than a marketing one. */
export interface PhaseTelemetry {
  /** Phase key as used in `PHASES`. */
  key: keyof typeof PHASES;
  /** Progress at which this readout activates. */
  start: number;
  /** Code shown left of the readout. */
  code: string;
  /** Short uppercase descriptor shown right of the readout. */
  status: string;
}

export const PHASE_TELEMETRY: readonly PhaseTelemetry[] = [
  { key: "gateway", start: 0.0, code: "STATION 00 · ALIGN", status: "DESCENT" },
  { key: "sources", start: 0.18, code: "STATION 01 · SRC", status: "INBOUND" },
  { key: "substrate", start: 0.4, code: "STATION 02 · SUB", status: "ENCODING" },
  { key: "graph", start: 0.5, code: "STATION 02 · GRAPH", status: "RESOLVING" },
  { key: "surfaces", start: 0.66, code: "STATION 03 · SRF", status: "DEPLOYING" },
  { key: "resolved", start: 0.86, code: "LAYER · OWNED", status: "LIVE" },
];

export function telemetryAt(progress: number): PhaseTelemetry {
  let current: PhaseTelemetry = PHASE_TELEMETRY[0];
  for (const t of PHASE_TELEMETRY) {
    if (progress >= t.start) current = t;
  }
  return current;
}
