/**
 * The flight grammar's overridable config — the lever surface for the
 * ADR-081 lab (`/test/voidwalker-flight-lab`).
 *
 * Every knob has a DEFAULT which mirrors the corresponding constant in
 * `voidwalkerTravelClock.ts` byte-for-byte. Production never mutates
 * this object, so the clock, the hook, and the tunnel produce the same
 * numbers whether or not the lab route is on disk. The lab route calls
 * `setVwFlightOverrides(partial)` at mount and undoes it on unmount.
 *
 * ⚠ THREE-FREE, and that is load-bearing (`landing-performance` doctrine).
 * DOM components import this module through the clock, so a `three`
 * import here would drag the WebGL stack into the landing's First Load JS.
 *
 * ⚠ SINGLE ACTIVE OBJECT, MERGE SEMANTICS. `setVwFlightOverrides` merges
 * a partial into the active object; unspecified keys keep their previous
 * value. That is what lets a URL param panel move ONE knob without
 * resetting the rest — the same shape a lab table needs to compare
 * variants along one axis at a time.
 */

/** The path shape a beat traces to and from its park position. */
export type VwPathVariant =
  | /** Straight lerps from side-fraction to side-fraction — the shipped
   *  ADR-081 U2 grammar. Cards diagonal in / diagonal out. */
  "linear" /** Quadratic curve through the anchors — the reference (Noomo)
   *  read: cards swing OUT before arriving, then throw wide as they
   *  pass. `curveBend` controls the belly of the curve. */
  | "curved" /** The card flies inside a drawn housing frame that powers on at
   *  park. Path shape identical to `curved`; the DIFFERENCE is that
   *  the housing has its own opacity ramp (`housingReveal`) so it
   *  arrives dim and lights on park. */
  | "housed";

export interface VwFlightConfig {
  /** How many stops a beat's full −1 → +1 flight spans. */
  span: number;
  /** Time constant (seconds) of the flight's exponential chase. */
  tauSeconds: number;
  /** Total travel runway, in viewports. Paired with
   *  `--vw-travel-runway` in the CSS. */
  runwaySvh: number;
  /** Lateral offset at the reading plane, as a fraction of viewport
   *  width. Sets the amount of alternation on parked beats. */
  xPark: number;
  /** …at birth, deep in the tunnel. */
  xFar: number;
  /** …as it passes the camera. */
  xNear: number;
  /** Vertical offset at birth, as a fraction of viewport height. */
  yFar: number;
  /** …and as it leaves. */
  yNear: number;
  /** Peak yaw at the extremes of the flight, degrees. */
  rotMax: number;
  /** Peak roll (bank), degrees. The `curved` and `housed` variants add
   *  a mild bank as the card swings out; `linear` ignores this. */
  rollMax: number;
  /** How far the `curved`/`housed` variants bow past the direct line.
   *  0 collapses back to a straight lerp; higher values push the card
   *  further to its own side before it arrives at the reader. */
  curveBend: number;
  /** Peak defocus, px, at the extremes of the flight. */
  blurMax: number;
  /** How much of the far half a beat fades IN over. */
  fogIn: number;
  /** …and how much of the near half it fades OUT over. */
  fogOut: number;
  /** How far into the APPROACH the defocus saturates. */
  blurReachIn: number;
  /** …and into the DEPARTURE. */
  blurReachOut: number;
  /** How much of the approach the DETAIL takes to power on. */
  detailIn: number;
  /** …and how quickly it goes once the beat leaves. */
  detailOut: number;
  /** The path shape (see `VwPathVariant`). */
  pathVariant: VwPathVariant;
  /** Wall-density multiplier for the tunnel's point count. 1.0 is
   *  the shipped budget (30 rings × 34 points on desktop). */
  wallDensityMul: number;
  /** Extra streak/lane layer intensity (0 = off). A new painter
   *  channel the flight lab exposes for the "populated field" read. */
  streakStrength: number;
  /** Brandmark's own dispersion reaction during the entry dive
   *  (0 = current behaviour, 1 = dramatic parting). */
  entryReactionStrength: number;
  /** Scroll-velocity channel strength (0 = disabled). Feeds card tilt,
   *  fog intensity, and streak length in the lab variants. */
  velocityStrength: number;
  /**
   * Longitudinal RAIL density (ADR-081 U5). 1 is the shipped budget; 0
   * removes the rail layer entirely and restores the pre-U5 dots-only
   * tunnel, which is what the lab needs to A/B the two reads.
   *
   * ⚠ The rails are what make the bore read as a bore. The dot shell
   * carries VOLUME and deliberately twists each ring (`r * 0.19`) so it
   * never lines up into stripes; that decision is correct for the dots
   * and is exactly why the tunnel had no direction cue at all. Rails
   * carry DIRECTION, on their own layer, converging toward the optical
   * axis with depth.
   */
  railDensity: number;
  /**
   * How completely the brandmark releases from the camera during the
   * entry dive (ADR-081 U5). 1 = the mark returns to its world anchor
   * and the diving camera flies through it; 0 = the pre-U5 behaviour,
   * where the mark stays welded a fixed distance in front of the lens
   * and therefore can never be reached.
   *
   * ⚠ AT `entry = 0` THIS IS AN IDENTITY AT EVERY VALUE. The release is
   * scaled by the entry channel, so the ambient hold is byte-identical
   * whatever this is set to — the same construction contract the camera
   * pose branch carries.
   */
  markFlyThrough: number;
}

/** ⚠ DEFAULT VALUES ARE THE CURRENTLY-SHIPPED CONSTANTS.
 *  Any drift here silently changes the landing page. Keep this table
 *  matched to `voidwalkerTravelClock.ts`; the two are unit-pinned. */
export const VW_FLIGHT_DEFAULT: Readonly<VwFlightConfig> = Object.freeze({
  span: 3.8,
  tauSeconds: 0.18,
  runwaySvh: 14,
  xPark: 0.042,
  xFar: 0.2,
  xNear: 0.62,
  yFar: 0.1,
  yNear: 0.16,
  rotMax: 9,
  rollMax: 0, // linear (production) declares no roll
  curveBend: 0, // linear (production) has zero bow
  blurMax: 5,
  fogIn: 0.7,
  fogOut: 0.32,
  blurReachIn: 0.55,
  blurReachOut: 0.3,
  detailIn: 0.3,
  detailOut: 0.16,
  pathVariant: "linear",
  wallDensityMul: 1,
  streakStrength: 0,
  entryReactionStrength: 0,
  velocityStrength: 0,
  // ⚠ THE TWO U5 KNOBS DEFAULT TO THE NEW BEHAVIOUR, not to the old
  // one. Every knob above mirrors a pre-existing shipped constant, so
  // its default is an identity; these two ARE the U5 change, and their
  // zero value is the restore path the lab uses to compare against.
  railDensity: 1,
  markFlyThrough: 1,
});

let active: VwFlightConfig = { ...VW_FLIGHT_DEFAULT };

/** Read the current flight config. The clock calls this at write time,
 *  so a lab override lands on the next frame with no remount. */
export function getVwFlightConfig(): Readonly<VwFlightConfig> {
  return active;
}

/**
 * Merge a partial override into the active config. The lab route is the
 * only production caller (it undoes on unmount). Tests call it in a
 * `beforeEach` / `afterEach` pair around cases that need to sweep a
 * knob, then restore via `resetVwFlightConfig()`.
 *
 * ⚠ NO-OP DEDUP. The lab's first effect writes the current URL state at
 * mount even if it matches the defaults; without dedup, that fires a
 * `vw-flight-config` event, which forces `VoidwalkerTimeTunnel` to bump
 * its `configEpoch` and rebuild its point-cloud geometry — from INSIDE
 * an already-committing nested root that mounts the corridor via
 * `createRoot`. React warns about "sync unmount while rendering". Every
 * subsequent no-op write would do the same. Comparing to the ACTIVE
 * object and returning early is byte-identical when the same value is
 * already in place.
 */
export function setVwFlightOverrides(partial: Partial<VwFlightConfig>): void {
  let changed = false;
  const next: Record<string, unknown> = { ...active };
  for (const key of Object.keys(partial) as Array<keyof VwFlightConfig>) {
    const v = partial[key];
    if (v === undefined) continue;
    if (next[key] !== v) {
      changed = true;
      next[key] = v;
    }
  }
  if (!changed) return;
  active = next as unknown as VwFlightConfig;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vw-flight-config"));
  }
}

/** Restore every knob to its default. Dedupes the same way. */
export function resetVwFlightConfig(): void {
  const wasDefault = (Object.keys(VW_FLIGHT_DEFAULT) as Array<keyof VwFlightConfig>).every(
    (k) => active[k] === VW_FLIGHT_DEFAULT[k]
  );
  if (wasDefault) return;
  active = { ...VW_FLIGHT_DEFAULT };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vw-flight-config"));
  }
}
