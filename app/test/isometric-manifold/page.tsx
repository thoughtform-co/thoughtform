"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ParticleCanvasV2 } from "@/components/hud/ParticleCanvasV2";
import { DEFAULT_CONFIG, type ParticleSystemConfig } from "@/lib/particle-config";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════
// ISOMETRIC STRATEGY MAP - TOPOLOGY TEST
// Grid-based topology with contours, wireframes, and scroll navigation
// ═══════════════════════════════════════════════════════════════

export default function IsometricManifoldTest() {
  const [mounted, setMounted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll/wheel for navigation
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScrollProgress((prev) => {
      const delta = e.deltaY * 0.0003;
      return Math.max(0, Math.min(1, prev + delta));
    });
  }, []);

  // Strategy / Isometric POV Configuration with TOPOLOGY
  const strategyConfig: ParticleSystemConfig = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      manifold: {
        ...DEFAULT_CONFIG.manifold,
        // DISABLE default terrain - we're using landmarks for topology
        rows: 0,
        columns: 0,
        spreadX: 1,
        spreadZ: 1,
        opacity: 0.8,
        waveAmplitude: 0,
        color: "#ebe3d6",
      },
      camera: {
        focalLength: 2500,
        vanishX: 0.5,
        vanishY: 0.55, // Slightly lower to see more of the grid
        pitch: 55,
        yaw: 45,
        roll: 0,
        truckX: 0,
        truckY: -100,
        terrainClipY: 0,
        maxDepth: 10000,
      },
      landmarks: [
        // ═══════════════════════════════════════════════════════════════
        // STARFIELD BACKGROUND
        // ═══════════════════════════════════════════════════════════════
        {
          id: "starfield",
          sectionId: "test",
          name: "Background Stars",
          shape: "starfield",
          color: "#ebe3d6",
          density: 6.0,
          scale: 5.0,
          position: { x: 0, y: -600, z: 3000 },
          enabled: true,
        },

        // ═══════════════════════════════════════════════════════════════
        // PRIMARY GRID - The base topology plane
        // ═══════════════════════════════════════════════════════════════
        {
          id: "main-grid",
          sectionId: "test",
          name: "Primary Grid",
          shape: "gridlines",
          color: "#9370DB", // Purple grid like reference image
          density: 0.8, // Sparser for cleaner lines
          scale: 1.5,
          position: { x: 0, y: 400, z: 2000 },
          enabled: true,
        },

        // ═══════════════════════════════════════════════════════════════
        // CONTOUR TOPOLOGY - Elevation rings
        // ═══════════════════════════════════════════════════════════════
        {
          id: "contour-main",
          sectionId: "test",
          name: "Central Topology",
          shape: "contour",
          color: "#caa554",
          density: 2.5,
          scale: 1.5,
          position: { x: 0, y: 350, z: 2000 },
          enabled: true,
        },
        {
          id: "contour-left",
          sectionId: "test",
          name: "Left Ridge",
          shape: "contour",
          color: "#e74c3c",
          density: 2.0,
          scale: 1.0,
          position: { x: -800, y: 350, z: 1800 },
          enabled: true,
        },
        {
          id: "contour-right",
          sectionId: "test",
          name: "Right Basin",
          shape: "contour",
          color: "#FF6B35", // Orange like reference
          density: 2.0,
          scale: 0.8,
          position: { x: 900, y: 350, z: 2200 },
          enabled: true,
        },

        // ═══════════════════════════════════════════════════════════════
        // GEOMETRIC STRUCTURES - Wireframe objects on the grid
        // ═══════════════════════════════════════════════════════════════
        {
          id: "command-sphere",
          sectionId: "test",
          name: "Command Node",
          shape: "wireframeSphere",
          color: "#e74c3c",
          density: 3.0,
          scale: 2.0, // Larger
          position: { x: 0, y: 100, z: 2000 }, // Higher above grid
          enabled: true,
        },
        {
          id: "data-tower",
          sectionId: "test",
          name: "Data Spire",
          shape: "tower",
          color: "#FF6B35",
          density: 2.5,
          scale: 1.5, // Larger
          position: { x: -500, y: 0, z: 1800 },
          enabled: true,
        },
        {
          id: "signal-helix",
          sectionId: "test",
          name: "Signal Array",
          shape: "helix",
          color: "#9ACD32",
          density: 2.5,
          scale: 1.0, // Larger
          position: { x: 500, y: 100, z: 2200 },
          enabled: true,
        },

        // ═══════════════════════════════════════════════════════════════
        // ORBITAL PATHS
        // ═══════════════════════════════════════════════════════════════
        {
          id: "orbit-inner",
          sectionId: "test",
          name: "Inner Trajectory",
          shape: "orbit",
          color: "#FF6B35",
          density: 4.0,
          scale: 1.5,
          position: { x: 0, y: 200, z: 2000 },
          enabled: true,
        },
        {
          id: "orbit-outer",
          sectionId: "test",
          name: "Outer Trajectory",
          shape: "orbit",
          color: "#FF6B35",
          density: 3.0,
          scale: 2.5,
          position: { x: 0, y: 220, z: 2000 },
          enabled: true,
        },

        // ═══════════════════════════════════════════════════════════════
        // STRANGE ATTRACTOR - Central feature (above the wireframe sphere)
        // ═══════════════════════════════════════════════════════════════
        {
          id: "lorenz-core",
          sectionId: "test",
          name: "Lorenz Core",
          shape: "lorenz",
          color: "#caa554",
          density: 5.0,
          scale: 3.0,
          position: { x: 0, y: -100, z: 2000 }, // Higher up (more negative Y = higher)
          enabled: true,
        },
      ],
    }),
    []
  );

  if (!mounted) return null;

  return (
    <main
      className="relative w-full h-screen bg-[#0a0908] overflow-hidden font-mono text-[#ebe3d6]"
      onWheel={handleWheel}
    >
      {/* The Manifold Canvas */}
      <div className="absolute inset-0 z-0">
        <ParticleCanvasV2 scrollProgress={scrollProgress} config={strategyConfig} />
      </div>

      {/* SCROLL INDICATOR */}
      <div className="absolute left-1/2 bottom-4 -translate-x-1/2 z-30 flex flex-col items-center gap-2 opacity-60">
        <div className="text-[9px] uppercase tracking-widest">Scroll to Navigate</div>
        <div className="w-4 h-8 border border-[#ebe3d6]/40 rounded-full flex items-start justify-center p-1">
          <div
            className="w-1 h-2 bg-[#caa554] rounded-full transition-transform"
            style={{ transform: `translateY(${scrollProgress * 12}px)` }}
          />
        </div>
        <div className="text-[8px] opacity-50">{Math.round(scrollProgress * 100)}%</div>
      </div>

      {/* STRATEGY UI OVERLAY */}

      {/* Top Left: System Info */}
      <div className="absolute top-6 left-6 z-10 p-4 border border-[#ebe3d6]/20 bg-[#0a0908]/80 backdrop-blur-md">
        <div className="text-[9px] uppercase tracking-widest opacity-50 mb-1">
          Topology Analysis
        </div>
        <div className="text-xl font-light tracking-tight flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#caa554] animate-pulse" />
          SECTOR_THETA
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2">
          <div>
            <div className="text-[8px] uppercase opacity-40">Grid Resolution</div>
            <div className="text-xs">2048 × 2048</div>
          </div>
          <div>
            <div className="text-[8px] uppercase opacity-40">Elevation Range</div>
            <div className="text-xs text-[#caa554]">±180m</div>
          </div>
          <div>
            <div className="text-[8px] uppercase opacity-40">Contour Interval</div>
            <div className="text-xs">15m</div>
          </div>
          <div>
            <div className="text-[8px] uppercase opacity-40">Features</div>
            <div className="text-xs">7 Active</div>
          </div>
        </div>
      </div>

      {/* Top Right: View Controls */}
      <div className="absolute top-6 right-6 z-10 text-right">
        <div className="p-4 border-r-2 border-[#caa554] bg-gradient-to-l from-[#caa554]/10 to-transparent">
          <div className="text-[9px] uppercase tracking-widest text-[#caa554] mb-1 italic">
            Active View
          </div>
          <div className="text-lg">ISOMETRIC_TOPOLOGY</div>
        </div>
        <div className="mt-4 flex flex-col gap-2 items-end text-[9px]">
          <div className="flex items-center gap-2 opacity-60">
            <span className="w-3 h-[2px] bg-[#6b6355]" />
            <span>Grid Lines</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <span className="w-3 h-[2px] bg-[#caa554]" />
            <span>Contour (Primary)</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <span className="w-3 h-[2px] bg-[#e74c3c]" />
            <span>Contour (Alert)</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <span className="w-3 h-[2px] bg-[#3498db]" />
            <span>Contour (Data)</span>
          </div>
        </div>
      </div>

      {/* Bottom Left: Navigation */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
        <Link
          href="/test"
          className="text-[9px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2"
        >
          <span>← Exit Topology View</span>
        </Link>
        <div className="flex gap-4 items-center mt-2">
          <div className="p-2 border border-[#ebe3d6]/20 bg-[#0a0908]/80">
            <div className="text-[9px] font-bold">POV: 50° PITCH / 40° YAW</div>
            <div className="text-[8px] opacity-40 uppercase">Isometric Projection</div>
          </div>
        </div>
      </div>

      {/* Bottom Right: Coordinates */}
      <div className="absolute bottom-6 right-6 z-10 w-64">
        <div className="p-3 border border-[#ebe3d6]/10 bg-[#0a0908]/80 backdrop-blur-md">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[8px] uppercase opacity-40">X</div>
              <div className="text-xs font-mono">0.000</div>
            </div>
            <div>
              <div className="text-[8px] uppercase opacity-40">Y</div>
              <div className="text-xs font-mono">{(scrollProgress * 100).toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[8px] uppercase opacity-40">Z</div>
              <div className="text-xs font-mono">{(4000 + scrollProgress * 5000).toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SCANLINE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(10,9,8,0.6)_100%)]" />
    </main>
  );
}
