"use client";

import { CLUSTER_RING_RADII, CLUSTER_TRIAD, SUBSTRATE_RING } from "./intelligenceLayerGeom";
import { OrbitalCluster } from "./OrbitalCluster";
import { SplitRing } from "./SplitRing";

/**
 * OrbitField — the R3F scene for the intelligence-layer triad
 * (ADR-014 v5 — clean futuristic three-cluster composition).
 *
 * Three coplanar, front-on orbital clusters — one per pillar of the
 * Navigate / Encode / Build spine. Each cluster is a stack of five
 * concentric hairline rings + four cardinal diamond markers + sparse
 * dust dots, painted at equal richness so the three pillars read as
 * equal stations on the same horizontal axis.
 *
 *   [ 01 trusted sources ]   [ 02 encoded substrate ]   [ 03 headless surfaces ]
 *
 * The brandmark itself no longer paints inside the mid cluster — it
 * fully dissolves at the start of the substrate window via the new
 * SPLIT choreography (see SplitRing). The mid cluster's outermost
 * ring is what was the brandmark; subsequent inner rings + diamonds +
 * dust fade in via the RESOLVE phase.
 *
 * Choreography (substrate scroll progress 0 → 1):
 *
 *   ARRIVE   [0.00, 0.20]: brandmark vector ring is the only visible
 *                          artefact. SplitRing + clusters invisible.
 *   HANDOFF  [0.20, 0.40]: brandmark vector ring fades out;
 *                          SplitRing fades in at the same scale +
 *                          position as a unified ring. Visually
 *                          identical-looking ring throughout the
 *                          crossfade.
 *   SPLIT    [0.40, 0.70]: SplitRing decomposes into three 120° arcs
 *                          that translate from substrate centre to
 *                          the three chamber positions, tweening
 *                          their angular span 120° → 360° as they
 *                          arrive. The arc destinations are the same
 *                          centres + radii as the OrbitalClusters
 *                          take for their outermost rings, so the
 *                          handoff at end-of-SPLIT is seamless.
 *   RESOLVE  [0.70, 1.00]: each cluster's inner four rings + cardinal
 *                          diamonds + dust dots fade in, with the
 *                          mid cluster leading (stagger 0) and side
 *                          clusters following (stagger 0.04).
 *
 * The scene-scroll envelope (`orbitEmerge`) wraps everything so the
 * entire instrument retracts cleanly on exit — when the user scrolls
 * past the substrate window, all clusters and arcs return to invisible
 * via the same trapezoid that owned the previous LEFT_ORBIT /
 * RIGHT_ORBIT emerge.
 *
 * No HARD SWAPs, no R3F-side opacity gates beyond what the phase
 * scalars dictate. Each primitive (SplitRing + each OrbitalCluster)
 * subscribes to the brandmark journey store independently and
 * computes its own per-frame state; this component is purely
 * compositional.
 */

// Three 120° arcs that perfectly tile a 360° ring with no overlap or
// gap. Home angles below tile [30°, 150°], [150°, 270°], [270°, 30°].
// Mapped to chamber positions so each arc translates in the natural
// direction relative to its home angle:
//
//   - Arc 0 (home 210°): faces down-left → translates to left chamber.
//   - Arc 1 (home 330°): faces down-right → translates to right chamber.
//   - Arc 2 (home  90°): faces up        → stays at substrate centre.
const ARC_HOME_ANGLES_DEG = [210, 330, 90] as const;

export function OrbitField() {
  const substrateCentre = SUBSTRATE_RING.centre;
  const outerRadius = SUBSTRATE_RING.radius * CLUSTER_RING_RADII[0];

  // Cluster IDs in the same order as ARC_HOME_ANGLES_DEG so the
  // SplitRing's arc-i lands at clusterById(targets[i]) by the end of
  // SPLIT. CLUSTER_TRIAD is declared in order [sources, substrate,
  // surfaces]; we re-index here so [left, right, mid] matches the arc
  // mapping above.
  const sourcesCluster = CLUSTER_TRIAD[0]; // left
  const substrateCluster = CLUSTER_TRIAD[1]; // mid
  const surfacesCluster = CLUSTER_TRIAD[2]; // right

  const splitTargets = [
    sourcesCluster.centre,
    surfacesCluster.centre,
    substrateCluster.centre,
  ] as const;

  return (
    <>
      {/* SplitRing — visible only during HANDOFF + SPLIT phases. The
          arcs hand off into the cluster outermost rings at end-of-SPLIT.
          Rendered FIRST so it sits behind the clusters in z-order if
          they overlap during the late SPLIT crossfade (they shouldn't,
          but z-order keeps the cluster ring on top as the canonical
          artefact going forward). */}
      <SplitRing
        substrateCentre={substrateCentre}
        targetCentres={splitTargets}
        arcHomeAnglesDeg={ARC_HOME_ANGLES_DEG}
        radius={outerRadius}
      />

      {/* Three orbital clusters — equal richness, equal radius. Mid
          cluster leads the resolve cascade (stagger 0); side clusters
          follow with a small delay (stagger 0.04). Each cluster
          subscribes to the journey transform independently and
          computes its own per-element opacities; this component just
          composes them at their fixed scene positions. */}
      <OrbitalCluster
        centre={sourcesCluster.centre}
        radius={sourcesCluster.radius}
        stagger={sourcesCluster.stagger}
      />
      <OrbitalCluster
        centre={substrateCluster.centre}
        radius={substrateCluster.radius}
        stagger={substrateCluster.stagger}
      />
      <OrbitalCluster
        centre={surfacesCluster.centre}
        radius={surfacesCluster.radius}
        stagger={surfacesCluster.stagger}
      />
    </>
  );
}
