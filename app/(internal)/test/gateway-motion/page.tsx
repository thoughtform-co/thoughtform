"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLenis } from "@/lib/hooks/useLenis";
import {
  loadGatewayManifest,
  resolveTuning,
  type GatewayMotionManifest,
  type GatewayVisualEntry,
  type TreatmentKey,
} from "@/lib/gateway-motion/manifest";
import {
  DepthMeshGateway,
  DepthParallaxGateway,
  FpsMeter,
  GatewayStage,
  KenBurnsGateway,
  KENBURNS_DEFAULTS,
  LivingPlateOverlay,
  LIVING_DEFAULTS,
  MESH_DEFAULTS,
  PARALLAX_DEFAULTS,
  ScrubSequenceGateway,
  useOnScreen,
  usePointerLerp,
  useScrollProgressRef,
  type KenBurnsConfig,
  type LivingConfig,
  type MeshConfig,
  type ParallaxConfig,
} from "@/components/gateway/motion";

// ═══════════════════════════════════════════════════════════════
// TEST PAGE: GATEWAY MOTION LAB
//
// Five plate-preserving treatments for the Gateway key visuals, side by
// side on one sticky stage — compare feel, fidelity, and cost, then
// promote a winner toward the landing hero. Assets come from
// `npm run gateway:prep` (see scripts/gateway-prep/README.md); the scrub
// mode plays whatever `npm run gateway:frames` packaged (proxy from the
// old AI video until TouchDesigner/Unreal renders land).
//
// Deep-linkable: /test/gateway-motion?mode=parallax&visual=gateway-v1
// ═══════════════════════════════════════════════════════════════

type Mode = TreatmentKey;

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "kenburns", label: "KEN BURNS" },
  { id: "parallax", label: "DEPTH PARALLAX" },
  { id: "mesh", label: "2.5D MESH" },
  { id: "living", label: "LIVING PLATE" },
  { id: "scrub", label: "SCRUB SEQUENCE" },
];

const LIVING_STATIC_PLATE: KenBurnsConfig = {
  ...KENBURNS_DEFAULTS,
  zoomFrom: 1.02,
  zoomTo: 1.02,
  travelY: 0,
};

const PAGE_HEIGHT_VH = 520;

const panelStyle: React.CSSProperties = {
  position: "fixed",
  top: 20,
  right: 20,
  width: 300,
  maxHeight: "92vh",
  overflowY: "auto",
  background: "rgba(8, 7, 6, 0.95)",
  border: "1px solid rgba(202, 165, 84, 0.3)",
  borderRadius: 4,
  padding: 16,
  fontFamily: "var(--font-mono, 'PT Mono', monospace)",
  fontSize: 11,
  color: "#ebe3d6",
  zIndex: 1000,
  backdropFilter: "blur(8px)",
};

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ opacity: 0.7 }}>{label}</span>
        <span style={{ color: "#caa554" }}>{value.toFixed(step < 0.01 ? 3 : 2)}</span>
      </label>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#caa554" }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        cursor: "pointer",
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#caa554" }}
      />
    </label>
  );
}

export default function GatewayMotionLabPage() {
  const [manifest, setManifest] = useState<GatewayMotionManifest | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  // Deep-link state (?mode=&visual=) read lazily — no useSearchParams, so no
  // Suspense/CSR-bailout dance; Playwright and preview tools use the params.
  const [visualId, setVisualId] = useState(() => {
    if (typeof window === "undefined") return "gateway-v1";
    return new URLSearchParams(window.location.search).get("visual") ?? "gateway-v1";
  });
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "parallax";
    const m = new URLSearchParams(window.location.search).get("mode") as Mode | null;
    return m && MODES.some((x) => x.id === m) ? m : "parallax";
  });
  const [grain, setGrain] = useState(true);
  const [motesOverlay, setMotesOverlay] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [simulate, setSimulate] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const active = useOnScreen(stageRef);
  const pointerRef = usePointerLerp(stageRef, active);
  const progressRef = useScrollProgressRef(active);
  const { scrollProgress } = useLenis();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("mode", mode);
    params.set("visual", visualId);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [mode, visualId]);

  useEffect(() => {
    loadGatewayManifest()
      .then(setManifest)
      .catch((err: Error) => setManifestError(err.message));
  }, []);

  const entry: GatewayVisualEntry | null = useMemo(
    () => manifest?.visuals.find((v) => v.id === visualId) ?? manifest?.visuals[0] ?? null,
    [manifest, visualId]
  );

  // Per-mode tuning, re-seeded from manifest overrides when the visual
  // changes — the setState-during-render reset pattern (not an effect), so
  // the reseeded values paint in the same pass.
  const [kbConfig, setKbConfig] = useState<KenBurnsConfig>(KENBURNS_DEFAULTS);
  const [pxConfig, setPxConfig] = useState<ParallaxConfig>(PARALLAX_DEFAULTS);
  const [meshConfig, setMeshConfig] = useState<MeshConfig>(MESH_DEFAULTS);
  const [livingConfig, setLivingConfig] = useState<LivingConfig>(LIVING_DEFAULTS);
  const [tunedForId, setTunedForId] = useState<string | null>(null);
  if (entry && entry.id !== tunedForId) {
    setTunedForId(entry.id);
    setKbConfig(resolveTuning(KENBURNS_DEFAULTS, entry, "kenburns"));
    setPxConfig(resolveTuning(PARALLAX_DEFAULTS, entry, "parallax"));
    setMeshConfig(resolveTuning(MESH_DEFAULTS, entry, "mesh"));
    setLivingConfig(resolveTuning(LIVING_DEFAULTS, entry, "living"));
  }

  // Simulation slider overrides live scroll for per-frame consumers.
  useEffect(() => {
    progressRef.current.simulate = simulate;
  }, [simulate, progressRef]);

  const needsWebGlDepth = mode === "parallax" || mode === "mesh";
  const depthMissing = needsWebGlDepth && entry && !entry.depth;

  return (
    <div style={{ background: "#050403", fontFamily: "var(--font-mono, 'PT Mono', monospace)" }}>
      {/* Scroll runway — the stage stays pinned while ~4 viewports scrub past. */}
      <div style={{ height: `${PAGE_HEIGHT_VH}vh` }}>
        <div style={{ position: "sticky", top: 0, height: "100vh" }} ref={stageRef}>
          <GatewayStage entry={entry} grain={grain}>
            {entry ? (
              <>
                {mode === "kenburns" ? (
                  <KenBurnsGateway
                    entry={entry}
                    progressRef={progressRef}
                    active={active}
                    config={kbConfig}
                  />
                ) : null}
                {mode === "parallax" && entry.depth ? (
                  <DepthParallaxGateway
                    entry={entry}
                    active={active}
                    pointerRef={pointerRef}
                    progressRef={progressRef}
                    config={pxConfig}
                    showStats={showStats}
                  />
                ) : null}
                {mode === "mesh" && entry.depth ? (
                  <DepthMeshGateway
                    entry={entry}
                    active={active}
                    pointerRef={pointerRef}
                    progressRef={progressRef}
                    config={meshConfig}
                    showStats={showStats}
                  />
                ) : null}
                {mode === "living" ? (
                  <>
                    <KenBurnsGateway
                      entry={entry}
                      progressRef={progressRef}
                      active={active}
                      config={LIVING_STATIC_PLATE}
                      drift={false}
                    />
                    <LivingPlateOverlay entry={entry} active={active} config={livingConfig} />
                  </>
                ) : null}
                {mode === "scrub" ? (
                  <ScrubSequenceGateway entry={entry} active={active} progressRef={progressRef} />
                ) : null}
                {motesOverlay && mode !== "living" ? (
                  <LivingPlateOverlay
                    entry={entry}
                    active={active}
                    config={{ ...livingConfig, twinkle: 0 }}
                  />
                ) : null}
                {depthMissing ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      color: "#c96f4a",
                      fontSize: 12,
                    }}
                  >
                    NO DEPTH ASSETS FOR {entry.id} — run npm run gateway:prep
                  </div>
                ) : null}
              </>
            ) : manifestError ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  padding: 32,
                  textAlign: "center",
                  color: "#ebe3d6",
                  fontSize: 12,
                }}
              >
                <div style={{ maxWidth: 520 }}>
                  <p style={{ color: "#caa554", marginBottom: 12 }}>
                    GATEWAY MOTION // SETUP REQUIRED
                  </p>
                  <p style={{ opacity: 0.75, lineHeight: 1.6 }}>{manifestError}</p>
                </div>
              </div>
            ) : null}
          </GatewayStage>

          {/* Title block */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              color: "#ebe3d6",
              fontSize: 11,
              letterSpacing: "0.08em",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <div style={{ color: "#caa554" }}>TEST // GATEWAY MOTION LAB</div>
            <div style={{ opacity: 0.6, marginTop: 4 }}>
              {entry?.name ?? "—"} · {MODES.find((m) => m.id === mode)?.label} ·{" "}
              {Math.round((simulate ?? scrollProgress) * 100)}%
            </div>
            <div style={{ opacity: 0.4, marginTop: 4 }}>
              scroll to scrub · move pointer for parallax
            </div>
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div style={panelStyle}>
        <h3 style={{ margin: "0 0 14px", color: "#caa554", fontSize: 13 }}>
          GATEWAY MOTION // CONTROLS
        </h3>

        <label style={{ display: "block", marginBottom: 6, opacity: 0.7 }}>Visual</label>
        <select
          value={entry?.id ?? visualId}
          onChange={(e) => setVisualId(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 12,
            background: "#0d0b09",
            color: "#ebe3d6",
            border: "1px solid rgba(202,165,84,0.3)",
            padding: "6px 8px",
            fontFamily: "inherit",
            fontSize: 11,
          }}
        >
          {(manifest?.visuals ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <label style={{ display: "block", marginBottom: 6, opacity: 0.7 }}>Treatment</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: "7px 8px",
                background: mode === m.id ? "rgba(202, 165, 84, 0.25)" : "rgba(0,0,0,0.3)",
                border: `1px solid rgba(202, 165, 84, ${mode === m.id ? 0.7 : 0.25})`,
                borderRadius: 3,
                color: mode === m.id ? "#caa554" : "#ebe3d6",
                fontFamily: "inherit",
                fontSize: 10,
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "kenburns" ? (
          <>
            <SliderControl
              label="Zoom from"
              value={kbConfig.zoomFrom}
              min={1}
              max={1.4}
              step={0.01}
              onChange={(v) => setKbConfig({ ...kbConfig, zoomFrom: v })}
            />
            <SliderControl
              label="Zoom to"
              value={kbConfig.zoomTo}
              min={1}
              max={1.6}
              step={0.01}
              onChange={(v) => setKbConfig({ ...kbConfig, zoomTo: v })}
            />
            <SliderControl
              label="Origin X"
              value={kbConfig.originX}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setKbConfig({ ...kbConfig, originX: v })}
            />
            <SliderControl
              label="Origin Y"
              value={kbConfig.originY}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setKbConfig({ ...kbConfig, originY: v })}
            />
            <SliderControl
              label="Travel Y %"
              value={kbConfig.travelY}
              min={-12}
              max={12}
              step={0.5}
              onChange={(v) => setKbConfig({ ...kbConfig, travelY: v })}
            />
          </>
        ) : null}

        {mode === "parallax" ? (
          <>
            <SliderControl
              label="Parallax px"
              value={pxConfig.parallaxPx}
              min={0}
              max={80}
              step={1}
              onChange={(v) => setPxConfig({ ...pxConfig, parallaxPx: v })}
            />
            <SliderControl
              label="Focus depth"
              value={pxConfig.focus}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setPxConfig({ ...pxConfig, focus: v })}
            />
            <SliderControl
              label="Dolly zoom"
              value={pxConfig.dollyZoom}
              min={0}
              max={0.35}
              step={0.005}
              onChange={(v) => setPxConfig({ ...pxConfig, dollyZoom: v })}
            />
            <SliderControl
              label="Grain"
              value={pxConfig.grain}
              min={0}
              max={0.15}
              step={0.005}
              onChange={(v) => setPxConfig({ ...pxConfig, grain: v })}
            />
            <SliderControl
              label="Shimmer"
              value={pxConfig.shimmer}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => setPxConfig({ ...pxConfig, shimmer: v })}
            />
            <SliderControl
              label="Sweep mode (0/1/2)"
              value={pxConfig.sweepMode}
              min={0}
              max={2}
              step={1}
              onChange={(v) => setPxConfig({ ...pxConfig, sweepMode: v })}
            />
            <SliderControl
              label="Sweep intensity"
              value={pxConfig.sweepIntensity}
              min={0}
              max={0.8}
              step={0.01}
              onChange={(v) => setPxConfig({ ...pxConfig, sweepIntensity: v })}
            />
            <SliderControl
              label="Sweep width"
              value={pxConfig.sweepWidth}
              min={0.02}
              max={0.4}
              step={0.01}
              onChange={(v) => setPxConfig({ ...pxConfig, sweepWidth: v })}
            />
          </>
        ) : null}

        {mode === "mesh" ? (
          <>
            <SliderControl
              label="Relief"
              value={meshConfig.relief}
              min={0}
              max={2.5}
              step={0.05}
              onChange={(v) => setMeshConfig({ ...meshConfig, relief: v })}
            />
            <SliderControl
              label="Focus depth"
              value={meshConfig.focus}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => setMeshConfig({ ...meshConfig, focus: v })}
            />
            <SliderControl
              label="Orbit °"
              value={meshConfig.orbitDeg}
              min={0}
              max={8}
              step={0.1}
              onChange={(v) => setMeshConfig({ ...meshConfig, orbitDeg: v })}
            />
            <SliderControl
              label="Dolly"
              value={meshConfig.dolly}
              min={0}
              max={0.4}
              step={0.01}
              onChange={(v) => setMeshConfig({ ...meshConfig, dolly: v })}
            />
            <SliderControl
              label="Edge fade"
              value={meshConfig.edgeFade}
              min={0.01}
              max={0.25}
              step={0.01}
              onChange={(v) => setMeshConfig({ ...meshConfig, edgeFade: v })}
            />
            <SliderControl
              label="Grain"
              value={meshConfig.grain}
              min={0}
              max={0.15}
              step={0.005}
              onChange={(v) => setMeshConfig({ ...meshConfig, grain: v })}
            />
            <SliderControl
              label="BG distance"
              value={meshConfig.bgDistance}
              min={0.2}
              max={4}
              step={0.1}
              onChange={(v) => setMeshConfig({ ...meshConfig, bgDistance: v })}
            />
          </>
        ) : null}

        {mode === "living" ? (
          <>
            <SliderControl
              label="Twinkle count"
              value={livingConfig.twinkleCount}
              min={0}
              max={400}
              step={10}
              onChange={(v) => setLivingConfig({ ...livingConfig, twinkleCount: v })}
            />
            <SliderControl
              label="Twinkle speed"
              value={livingConfig.twinkleSpeed}
              min={0.1}
              max={2}
              step={0.05}
              onChange={(v) => setLivingConfig({ ...livingConfig, twinkleSpeed: v })}
            />
            <SliderControl
              label="Mote count"
              value={livingConfig.moteCount}
              min={0}
              max={120}
              step={4}
              onChange={(v) => setLivingConfig({ ...livingConfig, moteCount: v })}
            />
            <SliderControl
              label="Mote speed"
              value={livingConfig.moteSpeed}
              min={0.2}
              max={3}
              step={0.1}
              onChange={(v) => setLivingConfig({ ...livingConfig, moteSpeed: v })}
            />
          </>
        ) : null}

        {mode === "scrub" && entry?.sequence ? (
          <p style={{ opacity: 0.6, lineHeight: 1.5, marginBottom: 10 }}>
            {entry.sequence.frameCount} frames @ {entry.sequence.width}×{entry.sequence.height} (
            {entry.sequence.format}) — proxy from the legacy AI video until TD/Unreal renders land.
          </p>
        ) : null}

        <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(202,165,84,0.2)" }}>
          <ToggleRow label="Film grain layer" checked={grain} onChange={setGrain} />
          <ToggleRow label="Dust motes overlay" checked={motesOverlay} onChange={setMotesOverlay} />
          <ToggleRow label="Perf stats" checked={showStats} onChange={setShowStats} />
          <ToggleRow
            label="Simulate scroll"
            checked={simulate !== null}
            onChange={(on) => setSimulate(on ? (simulate ?? scrollProgress) : null)}
          />
          {simulate !== null ? (
            <SliderControl
              label="Progress"
              value={simulate}
              min={0}
              max={1}
              step={0.01}
              onChange={setSimulate}
            />
          ) : null}
        </div>
      </div>

      {!showStats && (mode === "kenburns" || mode === "living" || mode === "scrub") ? (
        <FpsMeter active={active} />
      ) : null}
    </div>
  );
}
