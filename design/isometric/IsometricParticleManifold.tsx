"use client";

import { useMemo } from "react";
import { ParticleCanvasV2 } from "@/components/hud/ParticleCanvasV2";
import {
  DEFAULT_CONFIG,
  type LandmarkConfig,
  type ParticleSystemConfig,
} from "@/lib/particle-config";

function makeTower(id: string, z: number): LandmarkConfig {
  return {
    id,
    sectionId: "isometric",
    name: "Central Artifact",
    shape: "tower",
    color: "#caa554",
    density: 0.9,
    scale: 1.15,
    position: { x: 0, y: 0, z },
    enabled: true,
  };
}

export function IsometricParticleManifold({ scrollProgress }: { scrollProgress: number }) {
  const config: ParticleSystemConfig = useMemo(() => {
    // Keep the field light: fewer manifold columns + shallower maxDepth.
    // Topology feel comes from camera pitch/yaw + the grid overlay (below).
    const isoConfig: ParticleSystemConfig = {
      ...DEFAULT_CONFIG,
      gateway: { ...DEFAULT_CONFIG.gateway, enabled: false },
      sigil: { ...DEFAULT_CONFIG.sigil, enabled: false },
      manifold: {
        ...DEFAULT_CONFIG.manifold,
        columns: 32, // 220 * 32 = 7040 terrain particles (vs 13200 at 60 cols)
        opacity: 0.32,
        waveAmplitude: 150,
        waveFrequency: 0.16,
        spreadX: 1.05,
        spreadZ: 1.0,
      },
      camera: {
        ...DEFAULT_CONFIG.camera,
        focalLength: 650, // keeps map readable while reducing yaw-induced offset
        // With yaw applied in the projection, moving the vanishing point recenters the map.
        vanishX: 0.8,
        vanishY: 0.56,
        pitch: 60, // top-down tilt (degrees)
        yaw: 45, // isometric rotation
        roll: 0,
        // Lift camera so the terrain band centers vertically (p.y is ~400 in the manifold).
        truckY: 400,
        terrainClipY: 0, // do not clip terrain: fill screen
        maxDepth: 6500, // fewer particles in view
      },
      // ParticleCanvasV2 fades landmarks by section index.
      // Duplicate the central artifact so it stays present across scroll quarters.
      landmarks: [
        makeTower("iso_tower_1", 2500),
        makeTower("iso_tower_2", 4500),
        makeTower("iso_tower_3", 6500),
        makeTower("iso_tower_4", 8500),
      ],
      version: DEFAULT_CONFIG.version,
    };

    return isoConfig;
  }, []);

  // Cheap, screen-filling “topo grid” overlay: feels like a map without adding thousands of WebGL lines.
  // We scroll the background-position so the grid participates in the travel.
  const gridOffset = useMemo(() => {
    const p = Math.max(0, Math.min(1, scrollProgress));
    // Two axes drifting at different rates feels more like navigation than a single pan.
    const x = Math.round(p * 1200);
    const y = Math.round(p * 1800);
    return { x, y };
  }, [scrollProgress]);

  return (
    <>
      <ParticleCanvasV2 scrollProgress={scrollProgress} config={config} />

      {/* Topological grid overlay (cheap) */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-40"
        style={{
          backgroundImage: [
            // Iso grid: two 60° families
            "repeating-linear-gradient(60deg, rgba(235,227,214,0.06) 0 1px, transparent 1px 48px)",
            "repeating-linear-gradient(-60deg, rgba(235,227,214,0.05) 0 1px, transparent 1px 48px)",
            // Subtle minor lines
            "repeating-linear-gradient(0deg, rgba(235,227,214,0.03) 0 1px, transparent 1px 96px)",
          ].join(", "),
          backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
}
