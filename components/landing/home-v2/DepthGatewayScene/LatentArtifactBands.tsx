"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_DIAGNOSTIC, STATION_THOUGHTFORM, depthOpacityForWorldPosition } from "./sceneGeom";

/**
 * LatentArtifactBands — world-fixed equations, tokens, and vector
 * shards spaced along the Z corridor between the Thoughtform compass
 * and the Diagnostic orbital field.
 *
 * Unlike `LatentFieldTunnel`, which is a camera-relative ambient
 * substrate (particles respawn in a cone around the camera), every
 * artifact in this layer lives at a FIXED world position. The user
 * literally flies past each one: it appears as a faint distant glyph
 * far down the corridor, intensifies as the camera closes the
 * distance, scales up through perspective, and recedes / culls as it
 * crosses the camera plane.
 *
 * That depth contract matches the Star Atlas-style "objects persist
 * in world space; distance decides visibility" model that already
 * governs the gate geometry on this route (ADR-018, 2026-05-24
 * revision). What this layer adds is semantic latent-space content:
 *
 *   - **Equations** — short LaTeX-flavoured expressions
 *     (`‖v‖²`, `Σ wᵢxᵢ`, `softmax(z)`, `∂L/∂w`, …) that read as
 *     research notation drifting through the corridor.
 *   - **Tokens** — bracket-tagged identifiers (`[CLS]`, `<emb>`,
 *     `ctx[i]`, `k=32`) that read as the inputs to the embedding
 *     space the brandmark is navigating.
 *   - **Vector shards** — short directional line segments with a
 *     diamond marker at each end; reads as embedding-space basis
 *     directions captured at a moment in time.
 *
 * Authoring rules followed below:
 *   - Artifacts are HAND-PLACED in world space (no random per-frame
 *     respawn) so the user sees the SAME landmarks every time, which
 *     reinforces the "real space I am travelling through" read.
 *   - No artifact sits on the optical axis or inside the central
 *     brandmark column (|x| > 0.9 OR |y| > 0.55 minimum offset).
 *   - No artifact sits in the peripheral HUD-rail strip (|x| < ~2.6,
 *     |y| < ~1.5 maximum offset at the parked compass distance).
 *   - Z range: starts after the Thoughtform station, not on top of
 *     it. The semantic equations should be discovered during travel,
 *     not already visible in the parked Thoughtform read.
 *   - Each artifact's depth-focus window is sized to its scale so
 *     larger plates fade in earlier (visible from further away) and
 *     smaller plates only register when close.
 *
 * Mounts inside the section-scoped R3F canvas in `DepthGatewayScene`
 * — paints at full quality on desktop, skipped on reduced-motion /
 * no-WebGL (same gate as the surrounding scene).
 */

// ─── Visual constants ───────────────────────────────────────────

const DAWN_HEX = "#ebe3d6";
const DAWN_SOFT_HEX = "#d6cdb5";
const GOLD_HEX = "#caa554";

/** PlaneGeometry shared by every billboard artifact — the per-mesh
 *  scale prop and the per-material UV/texture decide what each
 *  artifact looks like. */
const PLANE_GEOM_SIZE = 1;

/** Approximate world-space pixel ratio when rendering glyphs to the
 *  canvas atlas. 256px tile → 1.0 world plane; the per-artifact
 *  `scale` then shrinks/enlarges that. Picked so PT Mono at 60px
 *  on the source canvas reads crisply at the corridor's typical
 *  viewing distances (camera-to-anchor 2 – 8 world units). */
const ATLAS_TILE_PX = 256;
const ATLAS_FONT_PX = 64;

/** Semantic artifacts begin after the Thoughtform gate clears the
 *  centre. This keeps the parked section from showing the entire next
 *  corridor while preserving fixed-world-Z fly-past behavior once the
 *  camera starts moving. */
const ARTIFACT_NEAR_Z =
  STATION_THOUGHTFORM.position[2] +
  (STATION_DIAGNOSTIC.position[2] - STATION_THOUGHTFORM.position[2]) * 0.34;
const ARTIFACT_Z_STEP = 0.68;
const ARTIFACT_EXTRA_FAR_Z = STATION_DIAGNOSTIC.position[2] - 2.35;

function artifactZ(index: number): number {
  return ARTIFACT_NEAR_Z - ARTIFACT_Z_STEP * index;
}

function semanticCorridorReveal(progress: number): number {
  return smoothstep(0.16, 0.28, progress);
}

// ─── Artifact catalogue (hand-placed) ──────────────────────────

interface EquationArtifact {
  kind: "equation";
  text: string;
  /** World position. */
  pos: [number, number, number];
  /** World half-extent of the plane. Larger = reads from further. */
  scale: number;
  /** Optional tint (defaults to dawn-soft). */
  color?: string;
}

interface TokenArtifact {
  kind: "token";
  text: string;
  pos: [number, number, number];
  scale: number;
  color?: string;
}

interface VectorArtifact {
  kind: "vector";
  /** Origin of the vector in world space. */
  pos: [number, number, number];
  /** Direction (will be normalised then scaled by `length`). */
  dir: [number, number, number];
  /** World length of the segment. */
  length: number;
  color?: string;
}

type Artifact = EquationArtifact | TokenArtifact | VectorArtifact;

/** Equation expressions, drawn from the latent / attention / loss
 *  vocabulary. Kept short (≤ 9 visible characters) so each plate
 *  reads cleanly at typical viewing distance and never approaches
 *  the visual weight of the brandmark or the Diagnostic head copy. */
const EQUATION_LEXICON = [
  "‖v‖²",
  "Σ wᵢxᵢ",
  "softmax(z)",
  "∂L/∂w",
  "cos(θ)",
  "xᵀAx",
  "⟨q,k⟩",
  "ℒ(θ)",
  "μ ± σ",
  "tanh(x)",
  "eˣ / ∑eˣ",
  "θ → ϕ",
] as const;

const TOKEN_LEXICON = ["[CLS]", "<emb>", "ctx[i]", "k=32", "attn", "proj"] as const;

/** Catalogue: every artifact's world position, scale, kind, and
 *  content. The Z range intentionally begins deeper than the
 *  Thoughtform station, so the parked Thoughtform beat stays clean
 *  and the equations are discovered only once the brandmark leads the
 *  camera into the corridor. */
const ARTIFACTS: Artifact[] = [
  // ── Equations — primary content layer ─────────────────────────
  { kind: "equation", text: EQUATION_LEXICON[0], pos: [-1.6, 0.95, artifactZ(0)], scale: 0.42 },
  { kind: "equation", text: EQUATION_LEXICON[1], pos: [1.85, -0.85, artifactZ(1)], scale: 0.5 },
  {
    kind: "equation",
    text: EQUATION_LEXICON[2],
    pos: [2.05, 0.7, artifactZ(2)],
    scale: 0.6,
    color: GOLD_HEX,
  },
  { kind: "equation", text: EQUATION_LEXICON[3], pos: [-1.95, -0.65, artifactZ(3)], scale: 0.48 },
  { kind: "equation", text: EQUATION_LEXICON[4], pos: [1.55, 1.15, artifactZ(4)], scale: 0.42 },
  { kind: "equation", text: EQUATION_LEXICON[5], pos: [-2.2, 0.55, artifactZ(5)], scale: 0.5 },
  {
    kind: "equation",
    text: EQUATION_LEXICON[6],
    pos: [1.85, -1.05, artifactZ(6)],
    scale: 0.52,
    color: GOLD_HEX,
  },
  { kind: "equation", text: EQUATION_LEXICON[7], pos: [-1.45, 1.0, artifactZ(7)], scale: 0.46 },
  { kind: "equation", text: EQUATION_LEXICON[8], pos: [2.1, 0.4, artifactZ(8)], scale: 0.46 },
  { kind: "equation", text: EQUATION_LEXICON[9], pos: [-1.8, -0.95, artifactZ(9)], scale: 0.5 },
  { kind: "equation", text: EQUATION_LEXICON[10], pos: [1.55, 0.95, artifactZ(10)], scale: 0.5 },
  {
    kind: "equation",
    text: EQUATION_LEXICON[11],
    pos: [-2.0, -0.45, ARTIFACT_EXTRA_FAR_Z],
    scale: 0.46,
  },

  // ── Tokens — bracketed identifiers, slightly larger, gold ─────
  {
    kind: "token",
    text: TOKEN_LEXICON[0],
    pos: [-1.2, -1.1, artifactZ(1)],
    scale: 0.45,
    color: GOLD_HEX,
  },
  { kind: "token", text: TOKEN_LEXICON[1], pos: [1.3, 1.05, artifactZ(3)], scale: 0.45 },
  { kind: "token", text: TOKEN_LEXICON[2], pos: [-1.7, 0.35, artifactZ(4)], scale: 0.48 },
  { kind: "token", text: TOKEN_LEXICON[3], pos: [1.7, -0.45, artifactZ(6)], scale: 0.42 },
  {
    kind: "token",
    text: TOKEN_LEXICON[4],
    pos: [-1.35, 0.75, artifactZ(8)],
    scale: 0.42,
    color: GOLD_HEX,
  },
  { kind: "token", text: TOKEN_LEXICON[5], pos: [1.4, -1.0, artifactZ(10)], scale: 0.42 },

  // ── Vector shards — directional line segments with end markers ─
  {
    kind: "vector",
    pos: [-1.05, 0.6, artifactZ(2)],
    dir: [0.85, 0.4, -0.25],
    length: 0.95,
    color: GOLD_HEX,
  },
  { kind: "vector", pos: [1.2, -0.55, artifactZ(4)], dir: [-0.7, -0.45, -0.3], length: 0.85 },
  {
    kind: "vector",
    pos: [-1.4, -0.4, artifactZ(5)],
    dir: [0.6, 0.6, -0.35],
    length: 0.9,
    color: GOLD_HEX,
  },
  { kind: "vector", pos: [1.45, 0.45, artifactZ(7)], dir: [-0.55, 0.55, -0.4], length: 0.85 },
  { kind: "vector", pos: [-1.1, 0.8, artifactZ(9)], dir: [0.7, -0.5, -0.35], length: 0.9 },
  {
    kind: "vector",
    pos: [1.25, -0.85, artifactZ(10)],
    dir: [-0.6, 0.5, -0.4],
    length: 0.85,
    color: GOLD_HEX,
  },
];

// ─── Atlas building ─────────────────────────────────────────────

/** Build a single canvas atlas containing every equation + token
 *  glyph. Each artifact's `text` is matched to a tile; the per-mesh
 *  material picks its tile via shader uniforms. Equations and
 *  tokens share the same atlas so we keep texture count low. */
interface GlyphAtlas {
  texture: THREE.CanvasTexture;
  cols: number;
  rows: number;
  /** Look-up: `text` → linear tile index. */
  index: Map<string, number>;
}

function buildGlyphAtlas(): GlyphAtlas {
  const allText = [...EQUATION_LEXICON, ...TOKEN_LEXICON];
  // Square atlas tiled to fit all glyphs.
  const cols = Math.ceil(Math.sqrt(allText.length));
  const rows = Math.ceil(allText.length / cols);
  const canvas = document.createElement("canvas");
  canvas.width = cols * ATLAS_TILE_PX;
  canvas.height = rows * ATLAS_TILE_PX;
  const ctx = canvas.getContext("2d");
  const index = new Map<string, number>();
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${ATLAS_FONT_PX}px "PT Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < allText.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = col * ATLAS_TILE_PX + ATLAS_TILE_PX / 2;
      const cy = row * ATLAS_TILE_PX + ATLAS_TILE_PX / 2;
      ctx.fillText(allText[i], cx, cy);
      index.set(allText[i], i);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return { texture, cols, rows, index };
}

// ─── Shaders ────────────────────────────────────────────────────

/** Billboard vertex shader: position the plane in world space, then
 *  rebuild its corners relative to the camera-right / camera-up axes
 *  so the glyph always faces the camera. Per-vertex scale comes from
 *  the `uScale` uniform, so a single PlaneGeometry can render
 *  artifacts of any world-space size without instantiation. */
const billboardGlyphVertex = /* glsl */ `
uniform float uScale;
varying vec2 vUv;

void main() {
  vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 cameraUp = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 worldCentre = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 worldPos = worldCentre + cameraRight * position.x * uScale + cameraUp * position.y * uScale;
  vec4 mvPos = viewMatrix * vec4(worldPos, 1.0);
  gl_Position = projectionMatrix * mvPos;
  vUv = uv;
}
`;

const billboardGlyphFragment = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uCols;
uniform float uRows;
uniform float uTileIndex;
uniform vec3 uColor;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  float col = mod(uTileIndex, uCols);
  float row = floor(uTileIndex / uCols);
  // gl_FragCoord-style mapping: vUv runs 0..1 across the plane;
  // map into the tile's region of the atlas.
  vec2 tileUv = vec2((col + vUv.x) / uCols, (row + (1.0 - vUv.y)) / uRows);
  vec4 sampleColor = texture2D(uAtlas, tileUv);
  float alpha = sampleColor.a * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ─── Sub-components ─────────────────────────────────────────────

interface GlyphBillboardProps {
  atlas: GlyphAtlas;
  tileIndex: number;
  pos: [number, number, number];
  scale: number;
  color: string;
}

/** A single billboard plane painted with one tile from the shared
 *  glyph atlas. Per-frame the material's `uOpacity` is set from the
 *  artifact's camera-space depth so the plate fades in from far,
 *  reads at full near the parked focus distance, and recedes as the
 *  camera crosses it. */
function GlyphBillboard({ atlas, tileIndex, pos, scale, color }: GlyphBillboardProps) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: billboardGlyphVertex,
      fragmentShader: billboardGlyphFragment,
      uniforms: {
        uAtlas: { value: atlas.texture },
        uCols: { value: atlas.cols },
        uRows: { value: atlas.rows },
        uTileIndex: { value: tileIndex },
        uColor: { value: new THREE.Color(color) },
        uScale: { value: scale },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
  }, [atlas, tileIndex, scale, color]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  // Depth-focus window scaled with the artifact size, but kept
  // tighter than before so parked Thoughtform does not already show
  // the whole semantic layer behind it.
  const depthWindow = useMemo(() => {
    const reach = 4.5 + scale * 3.5;
    return {
      near: 0.4,
      nearFade: 0.5,
      far: reach,
      farFade: Math.max(0.9, scale * 2.2),
    };
  }, [scale]);

  useFrame(() => {
    const { paintProgress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      material.uniforms.uOpacity.value = 0;
      return;
    }
    const opacity =
      depthOpacityForWorldPosition(paintProgress, pos, depthWindow) *
      semanticCorridorReveal(paintProgress);
    // Cap at a deliberate ceiling — artifacts read as ambient
    // signal, not as foreground UI competing with the brandmark
    // or the gate copy.
    material.uniforms.uOpacity.value = opacity * 0.85;
  });

  return (
    <mesh position={pos}>
      <planeGeometry args={[PLANE_GEOM_SIZE, PLANE_GEOM_SIZE]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

interface VectorShardProps {
  pos: [number, number, number];
  dir: [number, number, number];
  length: number;
  color: string;
}

/** A short directional line segment with a tiny diamond marker at
 *  each end. Direction is normalised and scaled by `length`; the
 *  segment paints additively so it composites cleanly over the void
 *  without thickening into a UI stroke. */
function VectorShard({ pos, dir, length, color }: VectorShardProps) {
  const { lineGeom, diamondGeom, endPos } = useMemo(() => {
    const dirVec = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    const end: [number, number, number] = [
      pos[0] + dirVec.x * length,
      pos[1] + dirVec.y * length,
      pos[2] + dirVec.z * length,
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dirVec.x * length, dirVec.y * length, dirVec.z * length),
    ]);
    // Small camera-facing diamond outline (4 segments) for the end
    // markers. We render it twice — once at origin, once at end —
    // each translated by its mesh position.
    const r = 0.028;
    const diamondGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, r, 0),
      new THREE.Vector3(r, 0, 0),
      new THREE.Vector3(0, -r, 0),
      new THREE.Vector3(-r, 0, 0),
      new THREE.Vector3(0, r, 0),
    ]);
    return { lineGeom: lineGeo, diamondGeom: diamondGeo, endPos: end };
  }, [pos, dir, length]);

  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  const diamondMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  const lineObject = useMemo(() => {
    const line = new THREE.Line(lineGeom, lineMaterial);
    line.position.set(pos[0], pos[1], pos[2]);
    return line;
  }, [lineGeom, lineMaterial, pos]);

  const startDiamondObject = useMemo(() => {
    const diamond = new THREE.LineLoop(diamondGeom, diamondMaterial);
    diamond.position.set(pos[0], pos[1], pos[2]);
    return diamond;
  }, [diamondGeom, diamondMaterial, pos]);

  const endDiamondObject = useMemo(() => {
    const diamond = new THREE.LineLoop(diamondGeom, diamondMaterial);
    diamond.position.set(endPos[0], endPos[1], endPos[2]);
    return diamond;
  }, [diamondGeom, diamondMaterial, endPos]);

  useEffect(() => {
    return () => {
      lineGeom.dispose();
      diamondGeom.dispose();
      lineMaterial.dispose();
      diamondMaterial.dispose();
    };
  }, [lineGeom, diamondGeom, lineMaterial, diamondMaterial]);

  // Sample depth at the SEGMENT MIDPOINT so a vector spanning the
  // near plane still resolves to a sensible single opacity value —
  // we don't want one end at 0 and the other at 1.
  const midpoint = useMemo<[number, number, number]>(() => {
    return [(pos[0] + endPos[0]) / 2, (pos[1] + endPos[1]) / 2, (pos[2] + endPos[2]) / 2];
  }, [pos, endPos]);

  const depthWindow = useMemo(
    () => ({
      near: 0.4,
      nearFade: 0.5,
      far: 5.4,
      farFade: 1.4,
    }),
    []
  );

  useFrame(() => {
    const { paintProgress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      lineMaterial.opacity = 0;
      diamondMaterial.opacity = 0;
      return;
    }
    const opacity =
      depthOpacityForWorldPosition(paintProgress, midpoint, depthWindow) *
      semanticCorridorReveal(paintProgress);
    lineMaterial.opacity = opacity * 0.6;
    diamondMaterial.opacity = opacity * 0.85;
  });

  return (
    <group>
      <primitive object={lineObject} />
      <primitive object={startDiamondObject} />
      <primitive object={endDiamondObject} />
    </group>
  );
}

// ─── Root component ─────────────────────────────────────────────

export function LatentArtifactBands() {
  // Skip mounting entirely on mobile-narrow viewports — the
  // artifacts would compete with the already-tight copy layout and
  // the camera path is the same on every viewport so spatial
  // anchoring isn't lost.
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 760;
  }, []);

  const atlas = useMemo(() => {
    if (!enabled || typeof window === "undefined") return null;
    return buildGlyphAtlas();
  }, [enabled]);

  useEffect(() => {
    return () => {
      atlas?.texture.dispose();
    };
  }, [atlas]);

  // Confirm the corridor span the catalogue targets is consistent
  // with the computed reveal band — surfaces in DEV logs only if the
  // assumed range deviates enough to make the parked Thoughtform beat
  // show too much of the next leg again. Cheap one-shot, no runtime cost.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const minArtifactZ = Math.min(...ARTIFACTS.map((a) => a.pos[2]));
    const maxArtifactZ = Math.max(...ARTIFACTS.map((a) => a.pos[2]));
    if (
      Math.abs(maxArtifactZ - ARTIFACT_NEAR_Z) > 0.75 ||
      Math.abs(minArtifactZ - ARTIFACT_EXTRA_FAR_Z) > 0.75
    ) {
      console.warn(
        "[LatentArtifactBands] artifact Z range",
        [minArtifactZ, maxArtifactZ],
        "drifted from semantic reveal range",
        [ARTIFACT_EXTRA_FAR_Z, ARTIFACT_NEAR_Z],
        "— consider re-spacing the ARTIFACTS catalogue."
      );
    }
  }, []);

  if (!enabled || !atlas) return null;

  return (
    <group>
      {ARTIFACTS.map((artifact, i) => {
        if (artifact.kind === "vector") {
          return (
            <VectorShard
              key={`vec-${i}`}
              pos={artifact.pos}
              dir={artifact.dir}
              length={artifact.length}
              color={artifact.color ?? DAWN_HEX}
            />
          );
        }
        const tileIndex = atlas.index.get(artifact.text);
        if (tileIndex === undefined) return null;
        return (
          <GlyphBillboard
            key={`glyph-${i}`}
            atlas={atlas}
            tileIndex={tileIndex}
            pos={artifact.pos}
            scale={artifact.scale}
            color={artifact.color ?? (artifact.kind === "token" ? DAWN_HEX : DAWN_SOFT_HEX)}
          />
        );
      })}
    </group>
  );
}
