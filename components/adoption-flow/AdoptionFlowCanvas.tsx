"use client";

/**
 * The adoption-flow lab's canvas: `HoloEquilibriumCanvas`'s shell at its
 * smallest (ADR-080, ADR-143 U7) — a real perspective camera at one rest
 * pose, OrbitControls with zoom and pan off and a slow idle turn, the house
 * bloom, grain and vignette, and linear fog toward the ground for depth.
 * One option at a time; the DOM trackers ride over the canvas.
 */

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { holoGroundCss, resolveHoloPalette } from "@/components/holo-program/holoPalette";
import { POST } from "@/components/holo-program/holoProgramGeom";
import type { ThemeMode } from "@/lib/theme/themeModeRef";

import type { FlowOptionId } from "./options";
import { FLOW_SCENES } from "./scenes";

const RAD = Math.PI / 180;

export function AdoptionFlowCanvas({ option, mode }: { option: FlowOptionId; mode: ThemeMode }) {
  const def = FLOW_SCENES[option];
  const palette = useMemo(() => resolveHoloPalette(mode), [mode]);
  const ground = holoGroundCss(mode);
  const els = useRef<(HTMLElement | null)[]>([]);
  const { camera: cam } = def;

  const cameraProps = useMemo(() => {
    const az = cam.azimuthDeg * RAD;
    const el = cam.elevationDeg * RAD;
    const [tx, ty, tz] = cam.target;
    return {
      position: [
        tx + cam.distance * Math.cos(el) * Math.sin(az),
        ty + cam.distance * Math.sin(el),
        tz + cam.distance * Math.cos(el) * Math.cos(az),
      ] as [number, number, number],
      fov: cam.fov,
      near: 0.1,
      far: 80,
    };
  }, [cam]);

  const Scene = def.Scene;

  return (
    <div className="afl-canvas" style={{ background: ground }}>
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={`${option}-${mode}`}
          camera={cameraProps}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={[ground]} />
          <fog attach="fog" args={[ground, cam.distance - 4, cam.distance + 13]} />
          <OrbitControls
            makeDefault
            target={cam.target}
            enableDamping
            dampingFactor={0.075}
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={0.22}
            minPolarAngle={(90 - cam.elevationDeg - 22) * RAD}
            maxPolarAngle={(90 - cam.elevationDeg + 14) * RAD}
            rotateSpeed={0.4}
          />
          <Scene palette={palette} trackers={els} />
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom
              /* the instrument's own numbers (equilibriumFigures): a softer,
                 wider glow that lifts the bright arcs and not the hairlines */
              intensity={1.05 * palette.bloomScale}
              luminanceThreshold={palette.additive ? 0.56 : 0.97}
              luminanceSmoothing={POST.bloomRadius}
              radius={0.86}
              mipmapBlur
            />
            <Noise opacity={palette.additive ? POST.grain * palette.grainScale : 0} premultiply />
            <Vignette
              offset={0.2}
              darkness={palette.additive ? POST.vignette * palette.vignetteScale : 0}
              eskil={false}
            />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
      <div className="afl-trackers" aria-hidden="true">
        {def.trackers.map((t, i) => (
          <div
            key={t.key}
            className="afl-trk"
            data-side={t.side}
            ref={(el) => {
              els.current[i] = el;
            }}
          >
            <span className="afl-trk__box" />
            <span className="afl-trk__txt">
              <b>{t.key}</b> · {t.label}
            </span>
            <span className="afl-trk__ro" data-ro />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdoptionFlowCanvas;
