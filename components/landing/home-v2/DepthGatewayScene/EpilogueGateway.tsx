"use client";

/**
 * EpilogueGateway — a minimal gold portal that EMERGES on the horizon
 * during the corridor epilogue (ADR-018, epilogue v2). Visual rhyme
 * with the studio's original homepage gateway (concentric gold/dawn
 * rings + soft radial glow), trimmed down to a few primitives so it
 * reads as a DISTANT artifact — not the main act.
 *
 * Composition:
 *   - 3 concentric thin gold rings (RingGeometry) at progressively
 *     larger radii — the iconic "depth-portal" silhouette.
 *   - 1 dawn outer ring at the outermost radius — adds the second-
 *     palette accent that registers as Thoughtform's brand vocabulary.
 *   - 1 additive radial glow plane behind the rings — soft halo that
 *     reads as light pouring through the portal.
 *
 * Choreography (GATEWAY band on `epilogueProgress`):
 *   - Scale lerps 0.25 -> 1.0 (slow emerge, not a pop).
 *   - Opacity lerps 0 -> ~0.85 with a gentle late ramp so the gateway
 *     "comes into focus" after the landscape morph is already under
 *     way (band starts ~0.2, ends ~0.85).
 *   - Subtle breathing pulse driven by clock time so the portal feels
 *     alive once emerged.
 *
 * World placement:
 *   - Z ≈ -30 — behind the parked Intelligence station (~-22.6) and
 *     well within the canvas `far` plane (100). Sits in front of the
 *     `StaticStarfield` near edge (-26..-46) so stars read as the sky
 *     behind it.
 *   - Y ≈ -0.2 — slightly below the optical axis so the gateway sits
 *     on the horizon line that the warped wormhole shelves create.
 *
 * Mount: insert in `DepthGatewayScene/index.tsx` immediately AFTER
 * `<StaticStarfield />` so it composites as deep background but in
 * front of the star volume.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

const GOLD_HEX = "#caa554";
const GOLD_BRIGHT_HEX = "#e9c97a";
const DAWN_HEX = "#ebe3d6";

/** World position of the gateway centre. Slightly above-zero Y so
 *  the portal sits on the horizon line implied by the warped
 *  wormhole shelves rather than floating against empty void. */
const GATEWAY_POSITION: [number, number, number] = [0, -0.2, -30];

/** Outer ring radius in world units. ~2.0 reads as "distant but
 *  legibly portal-sized" at the parked camera distance (~10 units
 *  away). */
const RING_OUTER_RADIUS = 2.0;
/** Inner ring radii as fractions of the outer radius. Three steps
 *  reads as the classic concentric-portal silhouette without
 *  becoming visually noisy. */
const RING_INNER_FRACTIONS = [0.42, 0.58, 0.78];

/** Ring thickness (annulus outer - inner). Thin enough that each
 *  ring reads as a line at parked camera distance, thick enough to
 *  avoid moire at low DPI. */
const RING_THICKNESS = 0.02;

/** Halo glow plane size — wider than the outermost ring so the
 *  bloom bleeds outward instead of clipping at the ring edge. */
const GLOW_SIZE = 6.0;

/** Custom shader for the radial halo — a soft additive disk that
 *  reads as light spilling out from behind the rings. */
const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c) * 2.0;
  // Soft falloff: bright core, smooth fade to the edge. The slight
  // time-driven breath keeps the gateway feeling alive once emerged.
  float breath = 1.0 + sin(uTime * 0.6) * 0.04;
  float core = pow(max(0.0, 1.0 - d), 2.2) * breath;
  // Inner notch so the rings don't get washed out by the bloom.
  core *= smoothstep(0.0, 0.12, d);
  float alpha = core * uOpacity;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

/** Concentric ring geometries built once, shared across mounts. */
function buildRings(): { geom: THREE.RingGeometry; isOuter: boolean }[] {
  const out: { geom: THREE.RingGeometry; isOuter: boolean }[] = [];
  // Outermost dawn ring.
  out.push({
    geom: new THREE.RingGeometry(RING_OUTER_RADIUS - RING_THICKNESS, RING_OUTER_RADIUS, 96),
    isOuter: true,
  });
  // Inner gold rings.
  for (const f of RING_INNER_FRACTIONS) {
    const r = RING_OUTER_RADIUS * f;
    out.push({
      geom: new THREE.RingGeometry(r - RING_THICKNESS, r, 80),
      isOuter: false,
    });
  }
  return out;
}

export function EpilogueGateway() {
  const groupRef = useRef<THREE.Group>(null);
  const glowMaterialRef = useRef<THREE.ShaderMaterial>(null);
  // One material per ring so each can fade independently if we want
  // a stagger later; today they share the same alpha.
  const ringMaterialsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const rings = useMemo(() => buildRings(), []);

  const ringMaterials = useMemo(() => {
    const dawn = new THREE.Color(DAWN_HEX);
    const gold = new THREE.Color(GOLD_HEX);
    const goldBright = new THREE.Color(GOLD_BRIGHT_HEX);
    return rings.map((r, i) => {
      const color = r.isOuter ? dawn : i === 1 ? goldBright : gold;
      return new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    });
  }, [rings]);

  const glowGeom = useMemo(() => new THREE.PlaneGeometry(GLOW_SIZE, GLOW_SIZE), []);
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      uniforms: {
        uColor: { value: new THREE.Color(GOLD_HEX) },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      rings.forEach((r) => r.geom.dispose());
      ringMaterials.forEach((m) => m.dispose());
      glowGeom.dispose();
      glowMaterial.dispose();
    };
  }, [rings, ringMaterials, glowGeom, glowMaterial]);

  useEffect(() => {
    ringMaterialsRef.current = ringMaterials;
  }, [ringMaterials]);

  useEffect(() => {
    glowMaterialRef.current = glowMaterial;
  }, [glowMaterial]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const { epilogueProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = epilogueBand(epilogueProgress, "GATEWAY");
    if (reveal <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Scale lerps 0.25 -> 1.0 across the GATEWAY band so the gateway
    // genuinely EMERGES (grows out of nothing) rather than just
    // fading on at full size. Slight tail beyond 1.0 (1.02) so the
    // outermost edge "settles" at peak.
    const scale = 0.25 + 0.75 * reveal;
    group.scale.setScalar(scale);

    // Ring opacity caps at 0.85 — the gateway is a horizon artifact,
    // not a centre-of-attention. Inner rings get a slight extra lift
    // so the bright accent reads through the bloom.
    const t = clock.elapsedTime;
    const baseOpacity = reveal * 0.85;
    const breath = 1 + Math.sin(t * 0.55) * 0.06;
    for (let i = 0; i < ringMaterials.length; i++) {
      const isInnerBright = !rings[i].isOuter && i === 2;
      const innerBoost = isInnerBright ? 1.12 : 1.0;
      ringMaterials[i].opacity = Math.min(1, baseOpacity * innerBoost * breath);
    }

    // Glow opacity ramps slightly behind the rings so the rings
    // arrive first as silhouettes, then the bloom fills in.
    const glowReveal = Math.max(0, reveal - 0.1);
    glowMaterial.uniforms.uOpacity.value = Math.min(0.5, glowReveal * 0.55);
    glowMaterial.uniforms.uTime.value = t;
  });

  return (
    <group ref={groupRef} position={GATEWAY_POSITION} visible={false}>
      {/* Glow plane sits BEHIND the rings (slightly more negative Z
          relative to the group origin) so the rings read as
          silhouettes against the bloom. */}
      <mesh geometry={glowGeom} material={glowMaterial} position={[0, 0, -0.05]} />
      {rings.map((r, i) => (
        <mesh key={`gateway-ring-${i}`} geometry={r.geom} material={ringMaterials[i]} />
      ))}
    </group>
  );
}
