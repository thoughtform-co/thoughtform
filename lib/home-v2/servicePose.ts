/**
 * servicePose — bounded per-service rig pose for the #services brandmark.
 *
 * As the visitor scrolls through the three services, the brandmark + armillary
 * rig settles to a DISTINCT pose per service so each reveal reads as a turn.
 * The mark is a shallow-Z silhouette (`.claude/rules/brandmark.md`): a full spin
 * would collapse it to a sliver, so these amplitudes are deliberately BOUNDED —
 * a gentle 3/4 sweep through frontal, never edge-on. The genuinely-3D orbits
 * (which rotate with the rig) amplify the sense of rotation, so a modest mark
 * yaw reads clearly.
 *
 * Single source of truth for BOTH the production rig
 * (`BrandmarkPhysicsCoreActor`, unified corridor instrument) and the lab rig
 * (`ServicesHologramScene`, `/test/services-demo`), so the two never drift
 * apart (the brandmark rule warns against re-tilting one without the other).
 *
 * The pose composes ON TOP of the rig's billboard, gentle Lissajous drift, and
 * pointer-look. Worst-case combined angle stays well clear of edge-on:
 *   yaw   ≈ SERVICE_POSE_YAW (0.34) + drift (0.21) + pointer (0.12) ≈ 0.67 rad ≈ 38°.
 */

/** Max yaw offset (radians) at the first/last service — ~19.5°. */
export const SERVICE_POSE_YAW_RAD = 0.34;
/** Max pitch offset (radians), tilted opposite to yaw for a subtle 3D read — ~5.7°. */
export const SERVICE_POSE_PITCH_RAD = 0.1;

export interface ServicePose {
  /** Rotation about Y (radians). */
  yaw: number;
  /** Rotation about X (radians). */
  pitch: number;
}

/**
 * Bounded pose for the given service.
 *
 * A symmetric sweep through frontal: the first service leans one way, the
 * middle service is ~frontal, the last leans the other way. Monotonic in
 * `index`, so scrolling forward reads as a continuous turn.
 *
 * @param index 0-based service index.
 * @param total number of services (default 3).
 */
export function getServicePose(index: number, total = 3): ServicePose {
  const safeTotal = Math.max(1, total);
  // t: 0 (first) → 1 (last). pos: +1 (first) → -1 (last), 0 at the middle.
  const t = safeTotal > 1 ? index / (safeTotal - 1) : 0.5;
  const pos = (0.5 - t) * 2;
  return {
    yaw: pos * SERVICE_POSE_YAW_RAD,
    pitch: -pos * SERVICE_POSE_PITCH_RAD,
  };
}
