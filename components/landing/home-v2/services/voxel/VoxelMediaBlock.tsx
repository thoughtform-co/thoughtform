"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  type Texture,
  Vector3,
} from "three";
import { useMediaTexture } from "./useMediaTexture";
import { voxelFragmentShader, voxelVertexShader } from "./shaders";
import { VOXEL_PALETTE, type VoxelConfig, type VoxelMediaItem } from "./voxelTypes";

interface VoxelMediaBlockProps {
  item: VoxelMediaItem;
  /** World-space center of the block. */
  position: [number, number, number];
  /** World width of the block; height derives from media aspect. */
  width: number;
  /** Live config. Rebuild-affecting fields (resolution, gap) re-run the
   *  mesh memo; per-frame fields are read live in the frame loop. */
  config: VoxelConfig;
  /** Shared noise + dither textures (one set for the whole grid). */
  noiseTex: Texture;
  ditherTex: Texture;
  /** True when this block is the in-view / hovered one (video + extra energy). */
  active: boolean;
  /** Stagger delay (seconds) before this block assembles in. */
  revealDelay: number;
  onHover: (id: string, hovering: boolean) => void;
}

const _matrix = new Matrix4();
const _scale = new Vector3();
const _pos = new Vector3();
const _quat = new Quaternion();

export function VoxelMediaBlock({
  item,
  position,
  width,
  config,
  noiseTex,
  ditherTex,
  active,
  revealDelay,
  onHover,
}: VoxelMediaBlockProps) {
  const { texture, aspect } = useMediaTexture(item.image, item.video, active);

  // Grid resolution is rebuilt only when it (or aspect/gap) changes — not
  // every frame.
  const cols = config.resolution;
  const rows = Math.max(1, Math.round(cols / aspect));
  const gap = config.gap;

  // Build the instanced mesh (geometry + per-instance matrix + aUv + material)
  // once per (cols, rows, width, aspect, gap). Heavy work stays off the frame.
  //
  // GPU disposal happens HERE (dispose the previous build before making the
  // next), NOT in a useEffect cleanup: React StrictMode double-invokes effect
  // cleanups (mount → cleanup → mount), which would dispose the *live* mesh's
  // buffers and leave it rendering blank. Disposing the prior memo result is
  // StrictMode-safe and still frees GPU memory on every rebuild.
  const prevMeshRef = useRef<InstancedMesh | null>(null);
  const mesh = useMemo(() => {
    const prev = prevMeshRef.current;
    if (prev) {
      prev.geometry.dispose();
      (prev.material as ShaderMaterial).dispose();
      prev.dispose();
    }
    const count = cols * rows;
    const height = width / aspect;
    const cellW = width / cols;
    const cellH = height / rows;
    const cubeDepth = Math.min(cellW, cellH);
    const shrink = 1 - MathUtils.clamp(gap, 0, 0.9);

    const geo = new BoxGeometry(1, 1, 1);
    const aUv = new Float32Array(count * 2);

    const material = new ShaderMaterial({
      vertexShader: voxelVertexShader,
      fragmentShader: voxelFragmentShader,
      transparent: false,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uHover: { value: 0 },
        tNoise: { value: noiseTex },
        tMedia: { value: texture },
        tDither: { value: ditherTex },
        uDisplaceHeight: { value: config.displaceHeight },
        uNoiseSpeed: { value: config.noiseSpeed },
        uNoiseScale: { value: config.noiseScale },
        uGlitch: { value: config.glitch },
        uLightDir: { value: new Vector3(0.6, 0.55, 0.6).normalize() },
        uLightColor: { value: new Color(VOXEL_PALETTE.light) },
        uAmbient: { value: new Color(VOXEL_PALETTE.ambient) },
        uRimColor: { value: new Color(VOXEL_PALETTE.rim) },
        uFogColor: { value: new Color(VOXEL_PALETTE.fog) },
        uFogDensity: { value: config.fogDensity },
        uFogStart: { value: 11.5 },
        uEmissive: { value: 0.55 },
        uOpacity: { value: 1 },
      },
    });

    const m = new InstancedMesh(geo, material, count);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        const x = (col + 0.5) / cols - 0.5; // -0.5..0.5
        const y = 0.5 - (row + 0.5) / rows; // top row → +y
        _pos.set(x * width, y * height, 0);
        _scale.set(cellW * shrink, cellH * shrink, cubeDepth * shrink);
        _matrix.compose(_pos, _quat, _scale);
        m.setMatrixAt(i, _matrix);

        aUv[i * 2] = (col + 0.5) / cols;
        aUv[i * 2 + 1] = 1 - (row + 0.5) / rows; // flipY-correct V
      }
    }
    m.instanceMatrix.needsUpdate = true;
    geo.setAttribute("aUv", new InstancedBufferAttribute(aUv, 2));
    m.frustumCulled = false;

    prevMeshRef.current = m;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, rows, width, aspect, gap, noiseTex, ditherTex]);

  // NOTE: no unmount-time dispose effect — StrictMode double-fires effect
  // cleanups, which would dispose the live mesh and blank it. The memo above
  // frees prior builds; the final mesh is reclaimed on context teardown.

  // Swap the active texture (image ⇄ video) without rebuilding the mesh.
  useEffect(() => {
    if (texture) (mesh.material as ShaderMaterial).uniforms.tMedia.value = texture;
  }, [texture, mesh]);

  const revealRef = useRef(0);
  const hoverRef = useRef(0);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    elapsedRef.current += dt;
    const c = config;
    const u = (mesh.material as ShaderMaterial).uniforms;

    // assemble in after the stagger delay
    const target = elapsedRef.current > revealDelay ? 1 : 0;
    revealRef.current = MathUtils.damp(revealRef.current, target, 3.2, dt);
    hoverRef.current = MathUtils.damp(hoverRef.current, active ? 1 : 0, 6, dt);

    u.uTime.value += dt;
    u.uReveal.value = revealRef.current;
    u.uHover.value = hoverRef.current;
    u.uDisplaceHeight.value = c.displaceHeight;
    u.uNoiseSpeed.value = c.noiseSpeed;
    u.uNoiseScale.value = c.noiseScale;
    u.uGlitch.value = c.glitch;
    u.uFogDensity.value = c.fogDensity;
    (u.uLightDir.value as Vector3)
      .set(Math.cos(c.lightAngle), 0.55, Math.sin(c.lightAngle))
      .normalize();
  });

  return (
    <group position={position}>
      <primitive
        object={mesh}
        onPointerOver={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          onHover(item.id, true);
        }}
        onPointerOut={() => onHover(item.id, false)}
      />
    </group>
  );
}
