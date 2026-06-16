"use client";

/**
 * /test/brandmark-3d — dev lab for the extruded-3D brandmark
 * (procedural matcap, no scene lights — fits the corridor's
 * all-unlit aesthetic).
 *
 * Goal: dial in the dimensional read of the brandmark before
 * touching the production intelligence-layer corridor centre mark.
 * Live tuning for:
 *
 *   - Geometry: depth, bevel thickness/size/segments, curve
 *     tessellation, include-slivers toggle (the hairline radial
 *     ticks extrude into fragile blades — off by default).
 *   - Matcap: core / mid / edge colour stops (hot core → brand
 *     gold body → deep bronze rim) + stop positions. Regenerates
 *     the procedural texture on every change.
 *   - Motion: auto-rotate speed (Y) + pointer-parallax tilt.
 *   - Context: faint wireframe icosphere behind the mark to preview
 *     the in-intelligence-layer read; toggle a flat-SVG overlay for
 *     direct before/after comparison.
 *
 * Internal route — blocked from production by `middleware.ts`.
 * Mirrors the control-panel pattern from /test/brandmark-vector.
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  Brandmark3D,
  DEFAULT_GOLD_MATCAP_STOPS,
  MATCAP_PRESETS,
  RoomEnvironmentRig,
  type Brandmark3DMaterialMode,
  type MatcapPresetName,
} from "@/components/brand/Brandmark3D";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";

/**
 * Default value for every lab control. Single source of truth so the
 * `Reset all` button and the per-section resets stay in sync with the
 * initial `useState` seeds.
 */
const DEFAULTS = {
  // Geometry
  depth: 20,
  bevelThickness: 2,
  bevelSize: 2,
  bevelSegments: 4,
  curveSegments: 18,
  includeSlivers: false,

  // Material
  materialMode: "matcap" as Brandmark3DMaterialMode,
  matcapPreset: "gold" as MatcapPresetName,
  matcapStyle: "metallic" as "metallic" | "iridescent",
  // Matcap stops (mirrors DEFAULT_GOLD_MATCAP_STOPS).
  coreColor: DEFAULT_GOLD_MATCAP_STOPS.core,
  midColor: DEFAULT_GOLD_MATCAP_STOPS.mid,
  edgeColor: DEFAULT_GOLD_MATCAP_STOPS.edge,
  midStop: DEFAULT_GOLD_MATCAP_STOPS.midStop,
  edgeStop: DEFAULT_GOLD_MATCAP_STOPS.edgeStop,
  // PBR (chrome / liquid-metal)
  physColor: "#caa554",
  metalness: 1,
  roughness: 0.15,
  clearcoat: 0,
  iridescence: 0,
  envIntensity: 1,

  // Shape treatments
  wireframe: false,
  wireStyle: "edges" as "edges" | "triangles",
  wireColor: "#caa554",
  wireOpacity: 0.5,
  cutaway: false,
  cutawayAxis: "x" as "x" | "y",
  cutawayOffset: 0,
  cutawayFlip: false,

  // Motion — auto-rotate off by default; middle-mouse drag rotates
  // the mark manually (see Brandmark3D drag handlers). Slide the
  // Auto-rotate slider to >0 if you want continuous spin.
  autoRotate: 0,
  pointerParallax: true,
  pointerTilt: 0.22,
  middleMouseDrag: true,

  // Context preview
  showSphere: true,
  sphereRadius: 1.6,
  sphereDetail: 3,
  showFlatCompare: false,
  background: "dark" as const,
} satisfies Record<string, unknown>;

type Background = "dark" | "void" | "test";

export default function Brandmark3DPreviewPage() {
  const [depth, setDepth] = useState<number>(DEFAULTS.depth);
  const [bevelThickness, setBevelThickness] = useState<number>(DEFAULTS.bevelThickness);
  const [bevelSize, setBevelSize] = useState<number>(DEFAULTS.bevelSize);
  const [bevelSegments, setBevelSegments] = useState<number>(DEFAULTS.bevelSegments);
  const [curveSegments, setCurveSegments] = useState<number>(DEFAULTS.curveSegments);
  const [includeSlivers, setIncludeSlivers] = useState<boolean>(DEFAULTS.includeSlivers);

  const [materialMode, setMaterialMode] = useState<Brandmark3DMaterialMode>(DEFAULTS.materialMode);
  const [matcapStyle, setMatcapStyle] = useState<"metallic" | "iridescent">(DEFAULTS.matcapStyle);
  const [coreColor, setCoreColor] = useState<string>(DEFAULTS.coreColor);
  const [midColor, setMidColor] = useState<string>(DEFAULTS.midColor);
  const [edgeColor, setEdgeColor] = useState<string>(DEFAULTS.edgeColor);
  const [midStop, setMidStop] = useState<number>(DEFAULTS.midStop);
  const [edgeStop, setEdgeStop] = useState<number>(DEFAULTS.edgeStop);

  const [physColor, setPhysColor] = useState<string>(DEFAULTS.physColor);
  const [metalness, setMetalness] = useState<number>(DEFAULTS.metalness);
  const [roughness, setRoughness] = useState<number>(DEFAULTS.roughness);
  const [clearcoat, setClearcoat] = useState<number>(DEFAULTS.clearcoat);
  const [iridescence, setIridescence] = useState<number>(DEFAULTS.iridescence);
  const [envIntensity, setEnvIntensity] = useState<number>(DEFAULTS.envIntensity);

  const [wireframe, setWireframe] = useState<boolean>(DEFAULTS.wireframe);
  const [wireStyle, setWireStyle] = useState<"edges" | "triangles">(DEFAULTS.wireStyle);
  const [wireColor, setWireColor] = useState<string>(DEFAULTS.wireColor);
  const [wireOpacity, setWireOpacity] = useState<number>(DEFAULTS.wireOpacity);
  const [cutaway, setCutaway] = useState<boolean>(DEFAULTS.cutaway);
  const [cutawayAxis, setCutawayAxis] = useState<"x" | "y">(DEFAULTS.cutawayAxis);
  const [cutawayOffset, setCutawayOffset] = useState<number>(DEFAULTS.cutawayOffset);
  const [cutawayFlip, setCutawayFlip] = useState<boolean>(DEFAULTS.cutawayFlip);

  const [autoRotate, setAutoRotate] = useState<number>(DEFAULTS.autoRotate);
  const [pointerParallax, setPointerParallax] = useState<boolean>(DEFAULTS.pointerParallax);
  const [pointerTilt, setPointerTilt] = useState<number>(DEFAULTS.pointerTilt);
  const [middleMouseDrag, setMiddleMouseDrag] = useState<boolean>(DEFAULTS.middleMouseDrag);

  const [showSphere, setShowSphere] = useState<boolean>(DEFAULTS.showSphere);
  const [sphereRadius, setSphereRadius] = useState<number>(DEFAULTS.sphereRadius);
  const [sphereDetail, setSphereDetail] = useState<number>(DEFAULTS.sphereDetail);
  const [showFlatCompare, setShowFlatCompare] = useState<boolean>(DEFAULTS.showFlatCompare);
  const [background, setBackground] = useState<Background>(DEFAULTS.background);

  // Per-section resets — re-seed only the controls in that section.
  // `useCallback` is just for tidiness; React state setters are stable
  // so identity here doesn't actually matter for re-renders.
  const resetGeometry = useCallback(() => {
    setDepth(DEFAULTS.depth);
    setBevelThickness(DEFAULTS.bevelThickness);
    setBevelSize(DEFAULTS.bevelSize);
    setBevelSegments(DEFAULTS.bevelSegments);
    setCurveSegments(DEFAULTS.curveSegments);
    setIncludeSlivers(DEFAULTS.includeSlivers);
  }, []);

  // Apply a named matcap preset — sets stops + style in one go. The
  // colour pickers below remain live overrides afterwards.
  const applyMatcapPreset = useCallback((name: MatcapPresetName) => {
    const p = MATCAP_PRESETS[name];
    setMaterialMode("matcap");
    setCoreColor(p.core);
    setMidColor(p.mid);
    setEdgeColor(p.edge);
    setMidStop(p.midStop);
    setEdgeStop(p.edgeStop);
    setMatcapStyle(p.style);
  }, []);

  const resetMaterial = useCallback(() => {
    setMaterialMode(DEFAULTS.materialMode);
    setMatcapStyle(DEFAULTS.matcapStyle);
    setCoreColor(DEFAULTS.coreColor);
    setMidColor(DEFAULTS.midColor);
    setEdgeColor(DEFAULTS.edgeColor);
    setMidStop(DEFAULTS.midStop);
    setEdgeStop(DEFAULTS.edgeStop);
    setPhysColor(DEFAULTS.physColor);
    setMetalness(DEFAULTS.metalness);
    setRoughness(DEFAULTS.roughness);
    setClearcoat(DEFAULTS.clearcoat);
    setIridescence(DEFAULTS.iridescence);
    setEnvIntensity(DEFAULTS.envIntensity);
  }, []);

  const resetShape = useCallback(() => {
    setWireframe(DEFAULTS.wireframe);
    setWireStyle(DEFAULTS.wireStyle);
    setWireColor(DEFAULTS.wireColor);
    setWireOpacity(DEFAULTS.wireOpacity);
    setCutaway(DEFAULTS.cutaway);
    setCutawayAxis(DEFAULTS.cutawayAxis);
    setCutawayOffset(DEFAULTS.cutawayOffset);
    setCutawayFlip(DEFAULTS.cutawayFlip);
  }, []);

  const resetMotion = useCallback(() => {
    setAutoRotate(DEFAULTS.autoRotate);
    setPointerParallax(DEFAULTS.pointerParallax);
    setPointerTilt(DEFAULTS.pointerTilt);
    setMiddleMouseDrag(DEFAULTS.middleMouseDrag);
  }, []);

  const resetContext = useCallback(() => {
    setShowSphere(DEFAULTS.showSphere);
    setSphereRadius(DEFAULTS.sphereRadius);
    setSphereDetail(DEFAULTS.sphereDetail);
    setShowFlatCompare(DEFAULTS.showFlatCompare);
    setBackground(DEFAULTS.background);
  }, []);

  const resetAll = useCallback(() => {
    resetGeometry();
    resetMaterial();
    resetShape();
    resetMotion();
    resetContext();
  }, [resetGeometry, resetMaterial, resetShape, resetMotion, resetContext]);

  const backgroundColor =
    background === "dark"
      ? "var(--surface-0, #0a0908)"
      : background === "void"
        ? "#000"
        : "linear-gradient(135deg, #1a1614 0%, #0a0908 50%, #14110d 100%)";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: backgroundColor,
        color: "var(--dawn, #ece3d6)",
        fontFamily: "var(--font-pp-neue-montreal, ui-sans-serif), sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 35, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}
        onCreated={({ scene, gl, camera }) => {
          // Debug surface — internal route only; lets us introspect
          // the live scene from devtools or the IDE browser CDP.
          if (typeof window !== "undefined") {
            (window as unknown as Record<string, unknown>).__BRANDMARK_SCENE = scene;
            (window as unknown as Record<string, unknown>).__BRANDMARK_GL = gl;
            (window as unknown as Record<string, unknown>).__BRANDMARK_CAMERA = camera;
          }
        }}
      >
        {/* PBR needs an env map for reflections; only pay the PMREM
            cost when chrome/physical mode is active. */}
        {materialMode === "physical" ? <RoomEnvironmentRig intensity={envIntensity} /> : null}
        {showSphere ? <WireframeSphere radius={sphereRadius} detail={sphereDetail} /> : null}
        <Brandmark3D
          geometry={{
            depth,
            bevelThickness,
            bevelSize,
            bevelSegments,
            curveSegments,
            includeSlivers,
          }}
          materialMode={materialMode}
          matcap={{
            core: coreColor,
            mid: midColor,
            edge: edgeColor,
            midStop,
            edgeStop,
            style: matcapStyle,
          }}
          physical={{
            color: physColor,
            metalness,
            roughness,
            clearcoat,
            iridescence,
            envMapIntensity: envIntensity,
          }}
          wireframe={{
            enabled: wireframe,
            style: wireStyle,
            color: wireColor,
            opacity: wireOpacity,
          }}
          cutaway={{
            enabled: cutaway,
            axis: cutawayAxis,
            offset: cutawayOffset,
            flip: cutawayFlip,
          }}
          autoRotateSpeed={autoRotate}
          pointerParallax={pointerParallax}
          pointerTiltAmount={pointerTilt}
          middleMouseDrag={middleMouseDrag}
        />
      </Canvas>

      {showFlatCompare ? (
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            width: 180,
            height: 180,
            padding: 14,
            background: "rgba(15, 14, 12, 0.85)",
            border: "1px dashed rgba(202, 165, 84, 0.35)",
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          <BrandmarkGlyph outline={false} decorative />
          <div
            style={{
              position: "absolute",
              top: 6,
              left: 8,
              fontSize: 9,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(236, 227, 214, 0.6)",
              fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
            }}
          >
            Current (flat SVG)
          </div>
        </div>
      ) : null}

      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          width: 360,
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          padding: 20,
          background: "rgba(15, 14, 12, 0.92)",
          border: "1px solid rgba(202, 165, 84, 0.35)",
          color: "var(--dawn, #ece3d6)",
          zIndex: 50,
          fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
          fontSize: 11,
          letterSpacing: "0.04em",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 13,
            color: "var(--gold, #caa554)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Brandmark 3D Lab
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 12,
            fontSize: 10,
            color: "rgba(236, 227, 214, 0.45)",
            lineHeight: 1.5,
          }}
        >
          SVGLoader + ExtrudeGeometry. Matcap (no lights) or PBR chrome (RoomEnvironment
          reflections). Wireframe + cutaway available.
        </p>
        <button
          type="button"
          onClick={resetAll}
          style={primaryResetButtonStyle}
          title="Restore every control to its initial value"
        >
          Reset all to defaults
        </button>

        <SectionLabel>Geometry</SectionLabel>
        <ControlSlider
          label="Depth (SVG units)"
          value={depth}
          min={0}
          max={80}
          step={1}
          onChange={setDepth}
        />
        <ControlSlider
          label="Bevel thickness"
          value={bevelThickness}
          min={0}
          max={12}
          step={0.25}
          onChange={setBevelThickness}
        />
        <ControlSlider
          label="Bevel size"
          value={bevelSize}
          min={0}
          max={12}
          step={0.25}
          onChange={setBevelSize}
        />
        <ControlSlider
          label="Bevel segments"
          value={bevelSegments}
          min={1}
          max={12}
          step={1}
          onChange={setBevelSegments}
        />
        <ControlSlider
          label="Curve segments"
          value={curveSegments}
          min={4}
          max={48}
          step={1}
          onChange={setCurveSegments}
        />
        <Checkbox
          label="Include hairline ticks"
          checked={includeSlivers}
          onChange={setIncludeSlivers}
        />
        <button type="button" onClick={resetGeometry} style={resetButtonStyle}>
          Reset geometry
        </button>

        <SectionLabel>Material</SectionLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <RadioRow
            label="Matcap (no lights)"
            checked={materialMode === "matcap"}
            onChange={() => setMaterialMode("matcap")}
          />
          <RadioRow
            label="Chrome (PBR)"
            checked={materialMode === "physical"}
            onChange={() => setMaterialMode("physical")}
          />
        </div>

        {materialMode === "matcap" ? (
          <>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 10,
              }}
            >
              {(["gold", "chrome", "gunmetal", "iridescent", "holographic"] as const).map(
                (name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => applyMatcapPreset(name)}
                    style={presetChipStyle}
                  >
                    {name}
                  </button>
                )
              )}
            </div>
            <ColorRow label="Core" value={coreColor} onChange={setCoreColor} />
            <ColorRow label="Mid" value={midColor} onChange={setMidColor} />
            <ColorRow label="Edge" value={edgeColor} onChange={setEdgeColor} />
            <ControlSlider
              label="Mid stop"
              value={midStop}
              min={0}
              max={1}
              step={0.01}
              onChange={setMidStop}
            />
            <ControlSlider
              label="Edge stop"
              value={edgeStop}
              min={0}
              max={1}
              step={0.01}
              onChange={setEdgeStop}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <RadioRow
                label="Metallic"
                checked={matcapStyle === "metallic"}
                onChange={() => setMatcapStyle("metallic")}
              />
              <RadioRow
                label="Iridescent"
                checked={matcapStyle === "iridescent"}
                onChange={() => setMatcapStyle("iridescent")}
              />
            </div>
          </>
        ) : (
          <>
            <ColorRow label="Tint" value={physColor} onChange={setPhysColor} />
            <ControlSlider
              label="Metalness"
              value={metalness}
              min={0}
              max={1}
              step={0.01}
              onChange={setMetalness}
            />
            <ControlSlider
              label="Roughness"
              value={roughness}
              min={0}
              max={1}
              step={0.01}
              onChange={setRoughness}
            />
            <ControlSlider
              label="Clearcoat"
              value={clearcoat}
              min={0}
              max={1}
              step={0.01}
              onChange={setClearcoat}
            />
            <ControlSlider
              label="Iridescence"
              value={iridescence}
              min={0}
              max={1}
              step={0.01}
              onChange={setIridescence}
            />
            <ControlSlider
              label="Env reflection intensity"
              value={envIntensity}
              min={0}
              max={3}
              step={0.05}
              onChange={setEnvIntensity}
            />
            <div
              style={{
                fontSize: 9,
                color: "rgba(236, 227, 214, 0.4)",
                marginTop: -4,
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              Reflections come from a built-in RoomEnvironment (no HDR asset). Low roughness +
              metalness 1 = chrome.
            </div>
          </>
        )}
        <button type="button" onClick={resetMaterial} style={resetButtonStyle}>
          Reset material
        </button>

        <SectionLabel>Shape / technical</SectionLabel>
        <Checkbox label="Wireframe overlay" checked={wireframe} onChange={setWireframe} />
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <RadioRow
            label="Edges"
            checked={wireStyle === "edges"}
            onChange={() => setWireStyle("edges")}
          />
          <RadioRow
            label="Triangles"
            checked={wireStyle === "triangles"}
            onChange={() => setWireStyle("triangles")}
          />
        </div>
        <ColorRow label="Wire colour" value={wireColor} onChange={setWireColor} />
        <ControlSlider
          label="Wire opacity"
          value={wireOpacity}
          min={0}
          max={1}
          step={0.01}
          onChange={setWireOpacity}
        />
        <Checkbox
          label="Half / half cutaway (solid + wireframe)"
          checked={cutaway}
          onChange={setCutaway}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <RadioRow
            label="Split X"
            checked={cutawayAxis === "x"}
            onChange={() => setCutawayAxis("x")}
          />
          <RadioRow
            label="Split Y"
            checked={cutawayAxis === "y"}
            onChange={() => setCutawayAxis("y")}
          />
        </div>
        <ControlSlider
          label="Cut offset"
          value={cutawayOffset}
          min={-0.6}
          max={0.6}
          step={0.01}
          onChange={setCutawayOffset}
        />
        <Checkbox label="Flip cut side" checked={cutawayFlip} onChange={setCutawayFlip} />
        <button type="button" onClick={resetShape} style={resetButtonStyle}>
          Reset shape
        </button>

        <SectionLabel>Motion</SectionLabel>
        <ControlSlider
          label="Auto-rotate Y (rad/s)"
          value={autoRotate}
          min={-1}
          max={1}
          step={0.01}
          onChange={setAutoRotate}
        />
        <Checkbox
          label="Pointer parallax"
          checked={pointerParallax}
          onChange={setPointerParallax}
        />
        <ControlSlider
          label="Pointer tilt amount"
          value={pointerTilt}
          min={0}
          max={0.6}
          step={0.01}
          onChange={setPointerTilt}
        />
        <Checkbox
          label="Middle-mouse drag rotate"
          checked={middleMouseDrag}
          onChange={setMiddleMouseDrag}
        />
        <div
          style={{
            fontSize: 9,
            color: "rgba(236, 227, 214, 0.4)",
            marginTop: -4,
            marginBottom: 8,
            paddingLeft: 22,
            lineHeight: 1.5,
          }}
        >
          Hold the middle mouse button and drag to rotate the mark by hand. Auto-rotate and pointer
          parallax pause while you drag.
        </div>
        <button type="button" onClick={resetMotion} style={resetButtonStyle}>
          Reset motion
        </button>

        <SectionLabel>Context preview</SectionLabel>
        <Checkbox
          label="Wireframe icosphere behind mark"
          checked={showSphere}
          onChange={setShowSphere}
        />
        <ControlSlider
          label="Sphere radius"
          value={sphereRadius}
          min={0.8}
          max={3}
          step={0.05}
          onChange={setSphereRadius}
        />
        <ControlSlider
          label="Sphere detail"
          value={sphereDetail}
          min={1}
          max={5}
          step={1}
          onChange={setSphereDetail}
        />
        <Checkbox
          label="Show flat SVG (before/after)"
          checked={showFlatCompare}
          onChange={setShowFlatCompare}
        />

        <SectionLabel>Background</SectionLabel>
        <RadioRow
          label="Dark"
          checked={background === "dark"}
          onChange={() => setBackground("dark")}
        />
        <RadioRow
          label="Pure black"
          checked={background === "void"}
          onChange={() => setBackground("void")}
        />
        <RadioRow
          label="Gradient"
          checked={background === "test"}
          onChange={() => setBackground("test")}
        />
        <button type="button" onClick={resetContext} style={resetButtonStyle}>
          Reset context preview
        </button>

        <p
          style={{
            marginTop: 18,
            fontSize: 10,
            color: "rgba(236, 227, 214, 0.45)",
            lineHeight: 1.6,
          }}
        >
          Hairline ticks (paths 2/3/4/6) extrude into fragile blades; default off. Bevel size + the
          rim colour drive the metal read. The procedural matcap can be swapped for a captured PNG
          via the <code>matcapTexture</code> prop on{" "}
          <code style={{ color: "var(--gold)" }}>Brandmark3D</code>.
        </p>
      </div>
    </main>
  );
}

interface WireframeSphereProps {
  radius: number;
  detail: number;
}

function WireframeSphere({ radius, detail }: WireframeSphereProps) {
  const geom = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(radius, detail);
    const edges = new THREE.EdgesGeometry(ico);
    ico.dispose();
    return edges;
  }, [radius, detail]);

  useEffect(() => {
    return () => {
      geom.dispose();
    };
  }, [geom]);

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial
        color={new THREE.Color("#caa554")}
        transparent
        opacity={0.18}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function ControlSlider({ label, value, min, max, step, onChange }: ControlSliderProps) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 10,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--gold, #caa554)" }}>{formatValue(value, step)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "var(--gold, #caa554)" }}
      />
    </label>
  );
}

function formatValue(v: number, step: number): string {
  if (step >= 1) return v.toFixed(0);
  if (step >= 0.1) return v.toFixed(1);
  return v.toFixed(2);
}

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
      }}
    >
      <span
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 10,
          flex: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "var(--gold, #caa554)",
          fontSize: 10,
          textTransform: "uppercase",
        }}
      >
        {value}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 32,
          height: 22,
          padding: 0,
          border: "1px solid rgba(202,165,84,0.35)",
          background: "transparent",
          cursor: "pointer",
        }}
      />
    </label>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "var(--gold, #caa554)" }}
      />
      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em" }}>
        {label}
      </span>
    </label>
  );
}

interface RadioRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function RadioRow({ label, checked, onChange }: RadioRowProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
        cursor: "pointer",
      }}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: "var(--gold, #caa554)" }}
      />
      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em" }}>
        {label}
      </span>
    </label>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 14,
        marginBottom: 6,
        fontSize: 9,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "var(--gold-70, rgba(202,165,84,0.7))",
        borderTop: "1px dashed rgba(202, 165, 84, 0.2)",
        paddingTop: 8,
      }}
    >
      {children}
    </div>
  );
}

const resetButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  marginTop: 4,
  marginBottom: 4,
  background: "transparent",
  border: "1px solid rgba(202, 165, 84, 0.35)",
  color: "var(--gold, #caa554)",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const primaryResetButtonStyle: React.CSSProperties = {
  ...resetButtonStyle,
  marginTop: 0,
  marginBottom: 16,
  padding: "8px 10px",
  fontSize: 11,
  background: "rgba(202, 165, 84, 0.12)",
  borderColor: "rgba(202, 165, 84, 0.55)",
  color: "var(--gold, #caa554)",
};

const presetChipStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "transparent",
  border: "1px solid rgba(202, 165, 84, 0.3)",
  color: "var(--dawn-70, rgba(236,227,214,0.7))",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
};
