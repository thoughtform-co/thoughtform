/**
 * lib/latent-flight/content/waypoints — the seven destinations.
 *
 * The site's journey row, in its order and with its glyph ids: HOME ·
 * THESIS · ARC · PROOF · SERVICES · ABOUT · VOIDWALKER. The course runs
 * down −Z from the vessel's station and the waypoints ZIG-ZAG off it — the
 * Arc's own alternating beats, seen from the cockpit.
 *
 * ⚠ AUTHORED WHERE THEY ARE READ. Each position is the world point that
 * projects to a chosen screen seat at the vista's lens (fov 38°, 16:9), so
 * the seven marks and their labels spread around the frame — clear of the
 * boresight, the meters under it, the beacon's bracket box in the
 * upper-right third and the tape at the top. The first cut scaled the
 * lateral offsets with depth, which put every mark on ONE ring around the
 * boresight and printed SERVICES through VOIDWALKER: a containment gate
 * never sees two labels overlapping, only a still does.
 *
 * `s` is the course parameter (0 at HOME, 1 at VOIDWALKER) the flight model
 * (M3) will drive; `dock` marks a station with a dossier. `sector` is the
 * `nn/07` the right rail prints. Every number here is a position in the
 * scene, not a claim about the site.
 */

export type WaypointId =
  | "home"
  | "thesis"
  | "arc"
  | "proof"
  | "services"
  | "about"
  | "voidwalker";

export interface Waypoint {
  id: WaypointId;
  /** The printed name, uppercase by CSS. */
  name: string;
  /** Glyph id in the site's `SECTION_GLYPHS` table. */
  glyph: string;
  /** Course parameter, 0 … 1, strictly increasing along the route. */
  s: number;
  /** World position for a camera at the origin looking down −Z. */
  position: readonly [number, number, number];
  /** A station with a dossier (M4). */
  dock: boolean;
}

/** World units from HOME to VOIDWALKER along the course. */
export const COURSE_LENGTH = 260;

export const WAYPOINTS: readonly Waypoint[] = [
  { id: "home", name: "Home", glyph: "hero", s: 0, position: [-0.9, -1.1, -5], dock: false },
  { id: "thesis", name: "Thesis", glyph: "thesis", s: 0.15, position: [-9, -4.6, -39], dock: false },
  { id: "arc", name: "The Arc", glyph: "arc", s: 0.32, position: [19.2, -8.6, -83], dock: false },
  { id: "proof", name: "Proof", glyph: "proof", s: 0.5, position: [-18.6, 16.1, -130], dock: true },
  { id: "services", name: "Services", glyph: "services", s: 0.66, position: [-11.4, -29.6, -172], dock: false },
  { id: "about", name: "About", glyph: "about", s: 0.8, position: [-34.3, 44.4, -208], dock: false },
  { id: "voidwalker", name: "Voidwalker", glyph: "voidwalker", s: 1, position: [78.7, -4.5, -260], dock: true },
];

export const WAYPOINT_COUNT = WAYPOINTS.length;

export function waypointIndex(id: WaypointId): number {
  return WAYPOINTS.findIndex((w) => w.id === id);
}

/** `nn/07` — the sector readout for a waypoint. */
export function sectorLabel(id: WaypointId): string {
  const n = waypointIndex(id) + 1;
  return `${String(n).padStart(2, "0")}/${String(WAYPOINT_COUNT).padStart(2, "0")}`;
}

/** Normalised range from a position to a waypoint: 1.00 = the whole course. */
export function rangeTo(from: readonly [number, number, number], wp: Waypoint): number {
  const dx = wp.position[0] - from[0];
  const dy = wp.position[1] - from[1];
  const dz = wp.position[2] - from[2];
  return Math.hypot(dx, dy, dz) / COURSE_LENGTH;
}

/** Format a range the way the instruments print it: two decimals. */
export function formatRange(r: number): string {
  return Math.max(0, r).toFixed(2);
}

/** The bearing from the vessel to a point, degrees 000–359, 0 = dead ahead
 *  (−Z), increasing clockwise seen from above. */
export function bearingTo(
  from: readonly [number, number, number],
  to: readonly [number, number, number]
): number {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  return ((Math.round(deg) % 360) + 360) % 360;
}

export function formatBearing(deg: number): string {
  return String(((Math.round(deg) % 360) + 360) % 360).padStart(3, "0");
}
