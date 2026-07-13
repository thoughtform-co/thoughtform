"use client";

/**
 * /test/arc-cases-terrace — look-dev lab for the Arc Cases Terrace
 * (ADR-034). Renders the REAL `ArcCasesTerraceScreen` (real store, real
 * crossfade) over the production `SubstrateTopography` painter and its
 * deterministic contour shroud, with:
 *
 *   - a level slider (drives `levelOverride` — the rise/fade envelope
 *     and the published `arcCasesLevelRef` the lab camera also reads);
 *   - placement tunables (x / z / width / yaw / pitch / rise depth);
 *   - a camera-shift slider previewing the armed framing;
 *   - the real store's arm/step controls;
 *   - a BAKE PREVIEW mode rendering the four `bakeCaseScreenFace`
 *     canvases into the DOM at half size for layout iteration.
 *
 * Final compositing is verified on the landing behind the flag (the
 * ADR-033 lab doctrine, carried over).
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

import {
  ArcCasesTerraceScreen,
  TERRACE_W,
  TERRACE_X,
  TERRACE_YAW,
  TERRACE_PITCH,
  TERRACE_Z,
} from "@/components/landing/home-v2/arc-cases/ArcCasesTerraceScreen";
import { arcCameraShiftX } from "@/components/landing/home-v2/arc-cases/terraceLayout";
import {
  TERRACE_BAKE_H,
  TERRACE_BAKE_W,
  bakeCaseScreenFace,
  loadImage,
  waitForCardFonts,
} from "@/components/landing/home-v2/arc-cases/caseScreenBake";
import { INT_Z, PARK_CAM_Z } from "@/components/landing/home-v2/DepthGatewayScene/substrateTerrain";
import { SubstrateTopography } from "@/components/landing/home-v2/DepthGatewayScene/SubstrateTopography";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { TERRACE_RISE_DEPTH } from "@/lib/arc-cases/terraceMath";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";

/** Lab camera — the park pose + the terrace shift. Slider-driven, or
 *  (with the real store on) riding the published `arcCasesLevelRef`
 *  exactly like the production rig. */
function LabCameraRig({ shift, fromRef }: { shift: number; fromRef: boolean }) {
  const { camera, size } = useThree();
  useFrame(() => {
    const level = fromRef ? arcCasesLevelRef.current.level : shift;
    const shiftX = arcCameraShiftX(level, size.width / Math.max(1, size.height));
    camera.position.set(shiftX, 0, PARK_CAM_Z);
    camera.lookAt(shiftX, 0, INT_Z);
  });
  return null;
}

function BakePreview() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    (async () => {
      await waitForCardFonts();
      for (const projectCase of PROJECT_CASES) {
        let img: HTMLImageElement | null = null;
        try {
          img = await loadImage(projectCase.image.src);
        } catch {
          img = null;
        }
        if (disposed) return;
        const canvas = bakeCaseScreenFace(projectCase, img);
        canvas.style.width = `${TERRACE_BAKE_W / 2}px`;
        canvas.style.height = `${TERRACE_BAKE_H / 2}px`;
        canvas.style.display = "block";
        host.appendChild(canvas);
      }
    })();
    return () => {
      disposed = true;
      host.replaceChildren();
    };
  }, []);
  return (
    <div ref={hostRef} style={{ display: "flex", flexDirection: "column", gap: 24, padding: 24 }} />
  );
}

const SLIDER = { display: "grid", gridTemplateColumns: "110px 1fr 52px", gap: 8 } as const;

export default function ArcCasesTerraceLab() {
  const [bakeMode, setBakeMode] = useState(false);
  const [level, setLevel] = useState(1);
  const [useStore, setUseStore] = useState(false);
  const [shift, setShift] = useState(1);
  const [x, setX] = useState(TERRACE_X);
  const [z, setZ] = useState(TERRACE_Z);
  const [width, setWidth] = useState(TERRACE_W);
  const [yaw, setYaw] = useState(TERRACE_YAW);
  const [pitch, setPitch] = useState(TERRACE_PITCH);
  const [riseDepth, setRiseDepth] = useState(TERRACE_RISE_DEPTH);
  const [groundGlow, setGroundGlow] = useState(false);

  const armed = useArcCasesStore((s) => s.armed);
  const slot = useArcCasesStore((s) => s.slot);
  const toggle = useArcCasesStore((s) => s.toggle);
  const step = useArcCasesStore((s) => s.step);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#050403", color: "#ece3d6" }}>
      {bakeMode ? (
        <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
          <BakePreview />
        </div>
      ) : (
        <Canvas
          camera={{ fov: 38, near: 0.1, far: 100, position: [0, 0, PARK_CAM_Z] }}
          style={{ position: "absolute", inset: 0 }}
        >
          <LabCameraRig shift={shift} fromRef={useStore} />
          <SubstrateTopography forceVisible terraceLevelOverride={useStore ? null : level} />
          <ArcCasesTerraceScreen
            preload
            levelOverride={useStore ? null : level}
            x={x}
            z={z}
            width={width}
            yaw={yaw}
            pitch={pitch}
            riseDepth={riseDepth}
            groundGlow={groundGlow}
          />
        </Canvas>
      )}

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          width: 320,
          padding: 16,
          background: "rgba(10, 9, 8, 0.85)",
          border: "1px solid rgba(236, 227, 214, 0.15)",
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          display: "grid",
          gap: 8,
        }}
      >
        <strong>ARC CASES TERRACE · LAB</strong>
        <label>
          <input
            type="checkbox"
            checked={bakeMode}
            onChange={(e) => setBakeMode(e.target.checked)}
          />{" "}
          bake preview mode
        </label>
        {!bakeMode && (
          <>
            <label>
              <input
                type="checkbox"
                checked={useStore}
                onChange={(e) => setUseStore(e.target.checked)}
              />{" "}
              real store (arm + damp) instead of slider
            </label>
            {useStore ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={toggle}>{armed ? "CLOSE" : "ARM"}</button>
                <button onClick={() => step(-1)}>◂ prev</button>
                <span>slot {PROJECT_CASES[slot].index}</span>
                <button onClick={() => step(1)}>next ▸</button>
              </div>
            ) : (
              <div style={SLIDER}>
                <span>level</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                />
                <span>{level.toFixed(2)}</span>
              </div>
            )}
            <div style={SLIDER}>
              <span>cam shift ×</span>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.01}
                value={shift}
                onChange={(e) => setShift(Number(e.target.value))}
              />
              <span>{shift.toFixed(2)}</span>
            </div>
            <div style={SLIDER}>
              <span>x</span>
              <input
                type="range"
                min={0}
                max={6}
                step={0.05}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
              />
              <span>{x.toFixed(2)}</span>
            </div>
            <div style={SLIDER}>
              <span>z</span>
              <input
                type="range"
                min={INT_Z - 8}
                max={INT_Z}
                step={0.1}
                value={z}
                onChange={(e) => setZ(Number(e.target.value))}
              />
              <span>{z.toFixed(1)}</span>
            </div>
            <div style={SLIDER}>
              <span>width</span>
              <input
                type="range"
                min={2}
                max={7}
                step={0.05}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
              <span>{width.toFixed(2)}</span>
            </div>
            <div style={SLIDER}>
              <span>yaw</span>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={yaw}
                onChange={(e) => setYaw(Number(e.target.value))}
              />
              <span>{yaw.toFixed(2)}</span>
            </div>
            <div style={SLIDER}>
              <span>pitch</span>
              <input
                type="range"
                min={-0.4}
                max={0.4}
                step={0.01}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
              />
              <span>{pitch.toFixed(2)}</span>
            </div>
            <div style={SLIDER}>
              <span>rise depth</span>
              <input
                type="range"
                min={0}
                max={3}
                step={0.05}
                value={riseDepth}
                onChange={(e) => setRiseDepth(Number(e.target.value))}
              />
              <span>{riseDepth.toFixed(2)}</span>
            </div>
            <label>
              <input
                type="checkbox"
                checked={groundGlow}
                onChange={(e) => setGroundGlow(e.target.checked)}
              />{" "}
              ground glow
            </label>
          </>
        )}
      </div>
    </div>
  );
}
