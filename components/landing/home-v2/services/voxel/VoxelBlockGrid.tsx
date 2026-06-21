"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { MathUtils } from "three";
import { BackgroundHaze } from "./BackgroundHaze";
import { makeBlueNoiseTexture, makeValueNoiseTexture } from "./noiseTexture";
import { VoxelMediaBlock } from "./VoxelMediaBlock";
import { DEFAULT_VOXEL_CONFIG, type VoxelConfig, type VoxelMediaItem } from "./voxelTypes";

const BLOCK_WIDTH = 2.8;
const BLOCK_GAP_X = 0.85;

interface VoxelSceneProps {
  items: readonly VoxelMediaItem[];
  config: VoxelConfig;
}

function VoxelScene({ items, config }: VoxelSceneProps) {
  const noiseTex = useMemo(() => makeValueNoiseTexture({ size: 256, octaves: 4 }), []);
  const ditherTex = useMemo(() => makeBlueNoiseTexture(64), []);

  // One active block at a time (perf rule: only the hovered block decodes
  // video). Defaults to the lead/center block so a video plays on load.
  const defaultActive = items[Math.floor(items.length / 2)]?.id ?? items[0]?.id ?? null;
  const [activeId, setActiveId] = useState<string | null>(defaultActive);

  const onHover = (id: string, hovering: boolean) => {
    if (hovering) setActiveId(id);
    else setActiveId((cur) => (cur === id ? defaultActive : cur));
  };

  // Lay blocks in a centered row.
  const totalW = items.length * BLOCK_WIDTH + (items.length - 1) * BLOCK_GAP_X;
  const startX = -totalW / 2 + BLOCK_WIDTH / 2;

  // Gentle pointer parallax so the slab feels dimensional.
  const groupRef = useRef<Group>(null);
  const { pointer } = useThree();
  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    g.rotation.y = MathUtils.damp(g.rotation.y, pointer.x * 0.18, 4, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, -pointer.y * 0.12, 4, dt);
  });

  return (
    <>
      <BackgroundHaze noiseTex={noiseTex} />
      <group ref={groupRef}>
        {items.map((item, i) => (
          <VoxelMediaBlock
            key={item.id}
            item={item}
            position={[startX + i * (BLOCK_WIDTH + BLOCK_GAP_X), 0, 0]}
            width={BLOCK_WIDTH}
            config={config}
            noiseTex={noiseTex}
            ditherTex={ditherTex}
            active={activeId === item.id}
            revealDelay={0.15 + i * 0.18}
            onHover={onHover}
          />
        ))}
      </group>
    </>
  );
}

export interface VoxelBlockGridProps {
  items: readonly VoxelMediaItem[];
  /** Live config (lab sliders). Falls back to defaults. */
  config?: VoxelConfig;
  className?: string;
}

/**
 * The single R3F Canvas that paints the voxel media grid. Copies the
 * context-loss hardening from `BrandmarkParticleCanvas` (glEpoch remount)
 * but — unlike the brandmark field — keeps pointer events ON so blocks can
 * react to hover (the hovered block is the one that plays video).
 */
export function VoxelBlockGrid({ items, config, className }: VoxelBlockGridProps) {
  const cfg = config ?? DEFAULT_VOXEL_CONFIG;
  const [glEpoch, setGlEpoch] = useState(0);

  // R3F gates its first render on `react-use-measure` reporting a non-zero
  // size. Under React StrictMode the ResizeObserver can be set up while the
  // box is still 0 and never get a fresh callback once it settles, leaving
  // the canvas stuck at its default 300×150 with the scene unrendered. A few
  // resize ticks (spaced so they land after R3F has attached its listener)
  // force the measure to refresh. Cheap, idempotent insurance.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event("resize"));
    const timers = [50, 200, 500].map((ms) => window.setTimeout(fire, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);

  // Style the Canvas directly (absolute inset:0) — matching the proven
  // repo pattern (IntelligenceLayerStack / BrandmarkParticleCanvas). An
  // extra wrapper div left R3F's container measured as 0, so the renderer
  // root never reconciled its children.
  return (
    <Canvas
      key={glEpoch}
      className={className}
      camera={{ fov: 40, near: 0.1, far: 100, position: [0, 0.4, 14] }}
      dpr={[1, 1.75]}
      gl={{
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }}
      frameloop="always"
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        const onLost = (e: Event) => e.preventDefault();
        const onRestored = () => setGlEpoch((n) => n + 1);
        canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
        canvas.addEventListener("webglcontextrestored", onRestored, false);
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <VoxelScene items={items} config={cfg} />
    </Canvas>
  );
}
