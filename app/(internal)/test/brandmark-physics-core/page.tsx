"use client";

/**
 * /test/brandmark-physics-core — dev lab for the GPGPU-driven 3D
 * particle core that replaces the corridor brandmark on entry
 * (ADR-023).
 *
 * Goals:
 *   - Dial the assemble envelope (force coefficients at ignite=0
 *     vs ignite=1) until the burst-into-focus reads right.
 *   - Tune the parked #services CENTERPIECE look (clean-field thinning,
 *     dot scale + crispness, gentle 3D drift) — "Centerpiece view" snaps
 *     to the production parked state so you start from the real mark.
 *   - Save a tuning combo to Supabase and get a short shareable id
 *     (load it back by pasting the id) — see `brandmark_presets`.
 *   - Compare against the flat SVG (toggle the bottom-left chip).
 *   - Inspect against the wireframe icosphere context that wraps
 *     the core in the production scene.
 *
 * Internal route only — blocked from production by `middleware.ts`.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
} from "@/components/brand/BrandmarkPhysicsCore";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { supabase } from "@/lib/supabase";

const DEFAULTS = {
  // Particles
  count: BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  scatterRadius: 0.55,
  // (BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP = 3600 — dense enough that the
  //  Services centerpiece reads as a fine, evenly-spread field; still well
  //  under the gimbal's 9600-dot shell so the brandmark stays the lighter
  //  bright core, not the heaviest element in the composition.)
  bulge: 0.18,
  thickness: 0.06,

  // Render
  pointSize: 2.8,
  color: "#caa554",
  accentColor: "#e9c97a",
  opacity: 0.78,

  // Centerpiece (Services parked state — cleanField 0 = corridor, 1 = parked)
  cleanField: 0,
  depth: 1,
  corridorKeep: 1, // surviving particle fraction at clean=0 (corridor thinning)
  cleanFieldKeep: 0.65, // surviving particle fraction at clean=1 (spacing)
  cleanFieldDotScale: 0.5, // dot-size mult at clean=1 (fineness)
  cleanFieldEdge: 0.4, // dot falloff inner edge at clean=1 (crispness)
  // Centerpiece drift — lab replica of the actor's gentle 3D tilt (× cleanField)
  driftAmpX: 0.16,
  driftAmpY: 0.21,
  driftPeriodX: 17,
  driftPeriodY: 13,

  // State
  ignite: 1,
  reducedMotion: false,
  paused: false,

  // Forces — OFF (ignite=0)
  offReturn: 0.4,
  offFlow: 0.06,
  offTurb: 0.32,

  // Forces — ON (ignite=1)
  onReturn: 6.0,
  onFlow: 0.012,
  onTurb: 0.012,

  // Context
  showSphere: true,
  sphereRadius: 1.6,
  sphereDetail: 3,
  showFlatCompare: false,
  worldHalfExtent: 0.34,
  background: "dark" as const,
} satisfies Record<string, unknown>;

type Background = "dark" | "void" | "test";

export default function BrandmarkPhysicsCorePage() {
  const [count, setCount] = useState(DEFAULTS.count);
  const [scatterRadius, setScatterRadius] = useState(DEFAULTS.scatterRadius);
  const [bulge, setBulge] = useState(DEFAULTS.bulge);
  const [thickness, setThickness] = useState(DEFAULTS.thickness);

  const [pointSize, setPointSize] = useState(DEFAULTS.pointSize);
  const [color, setColor] = useState(DEFAULTS.color);
  const [accentColor, setAccentColor] = useState(DEFAULTS.accentColor);
  const [opacity, setOpacity] = useState(DEFAULTS.opacity);
  const [cleanField, setCleanField] = useState(DEFAULTS.cleanField);
  const [depth, setDepth] = useState(DEFAULTS.depth);
  const [corridorKeep, setCorridorKeep] = useState(DEFAULTS.corridorKeep);
  const [cleanFieldKeep, setCleanFieldKeep] = useState(DEFAULTS.cleanFieldKeep);
  const [cleanFieldDotScale, setCleanFieldDotScale] = useState(DEFAULTS.cleanFieldDotScale);
  const [cleanFieldEdge, setCleanFieldEdge] = useState(DEFAULTS.cleanFieldEdge);
  const [driftAmpX, setDriftAmpX] = useState(DEFAULTS.driftAmpX);
  const [driftAmpY, setDriftAmpY] = useState(DEFAULTS.driftAmpY);
  const [driftPeriodX, setDriftPeriodX] = useState(DEFAULTS.driftPeriodX);
  const [driftPeriodY, setDriftPeriodY] = useState(DEFAULTS.driftPeriodY);

  // Presets (Supabase save / load with a short shareable slug)
  const [presetLabel, setPresetLabel] = useState("");
  const [presetSlug, setPresetSlug] = useState("");
  const [loadSlug, setLoadSlug] = useState("");
  const [presetStatus, setPresetStatus] = useState("");
  const [presetBusy, setPresetBusy] = useState(false);

  const [ignite, setIgnite] = useState(DEFAULTS.ignite);
  const [reducedMotion, setReducedMotion] = useState(DEFAULTS.reducedMotion);
  const [paused, setPaused] = useState(DEFAULTS.paused);

  const [offReturn, setOffReturn] = useState(DEFAULTS.offReturn);
  const [offFlow, setOffFlow] = useState(DEFAULTS.offFlow);
  const [offTurb, setOffTurb] = useState(DEFAULTS.offTurb);

  const [onReturn, setOnReturn] = useState(DEFAULTS.onReturn);
  const [onFlow, setOnFlow] = useState(DEFAULTS.onFlow);
  const [onTurb, setOnTurb] = useState(DEFAULTS.onTurb);

  const [showSphere, setShowSphere] = useState(DEFAULTS.showSphere);
  const [sphereRadius, setSphereRadius] = useState(DEFAULTS.sphereRadius);
  const [sphereDetail, setSphereDetail] = useState(DEFAULTS.sphereDetail);
  const [showFlatCompare, setShowFlatCompare] = useState(DEFAULTS.showFlatCompare);
  const [worldHalfExtent, setWorldHalfExtent] = useState(DEFAULTS.worldHalfExtent);
  const [background, setBackground] = useState<Background>(DEFAULTS.background);

  // Bumping `simEpoch` re-mounts the core, which re-runs the volume
  // sample + sim build — the cleanest way to "replay" the assemble
  // envelope without state surgery.
  const [simEpoch, setSimEpoch] = useState(0);
  const replay = useCallback(() => setSimEpoch((n) => n + 1), []);

  const resetParticles = useCallback(() => {
    setCount(DEFAULTS.count);
    setScatterRadius(DEFAULTS.scatterRadius);
    setBulge(DEFAULTS.bulge);
    setThickness(DEFAULTS.thickness);
  }, []);

  const resetRender = useCallback(() => {
    setPointSize(DEFAULTS.pointSize);
    setColor(DEFAULTS.color);
    setAccentColor(DEFAULTS.accentColor);
    setOpacity(DEFAULTS.opacity);
    setCleanField(DEFAULTS.cleanField);
    setDepth(DEFAULTS.depth);
    setCorridorKeep(DEFAULTS.corridorKeep);
    setCleanFieldKeep(DEFAULTS.cleanFieldKeep);
    setCleanFieldDotScale(DEFAULTS.cleanFieldDotScale);
    setCleanFieldEdge(DEFAULTS.cleanFieldEdge);
    setDriftAmpX(DEFAULTS.driftAmpX);
    setDriftAmpY(DEFAULTS.driftAmpY);
    setDriftPeriodX(DEFAULTS.driftPeriodX);
    setDriftPeriodY(DEFAULTS.driftPeriodY);
  }, []);

  const resetForces = useCallback(() => {
    setOffReturn(DEFAULTS.offReturn);
    setOffFlow(DEFAULTS.offFlow);
    setOffTurb(DEFAULTS.offTurb);
    setOnReturn(DEFAULTS.onReturn);
    setOnFlow(DEFAULTS.onFlow);
    setOnTurb(DEFAULTS.onTurb);
  }, []);

  const resetContext = useCallback(() => {
    setShowSphere(DEFAULTS.showSphere);
    setSphereRadius(DEFAULTS.sphereRadius);
    setSphereDetail(DEFAULTS.sphereDetail);
    setShowFlatCompare(DEFAULTS.showFlatCompare);
    setWorldHalfExtent(DEFAULTS.worldHalfExtent);
    setBackground(DEFAULTS.background);
  }, []);

  const resetAll = useCallback(() => {
    resetParticles();
    resetRender();
    resetForces();
    resetContext();
    setIgnite(DEFAULTS.ignite);
    setReducedMotion(DEFAULTS.reducedMotion);
    setPaused(DEFAULTS.paused);
  }, [resetParticles, resetRender, resetForces, resetContext]);

  // Snap to the production parked-#services centerpiece look (the values the
  // actor drives at recT=1) so you start tuning from the real mark.
  const setCenterpieceView = useCallback(() => {
    setIgnite(1); // assembled
    setCleanField(1); // parked
    setDepth(1); // 3D dome kept
    setOpacity(0.9); // CENTER_OPACITY (decoupled centerpiece opacity)
    setPointSize(4.0); // CORE_POINT_SIZE_3D
    setCount(6000); // BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP
    setCorridorKeep(0.27); // ≈ CORRIDOR_DRAW_TARGET / count (corridor stays calm)
    setCleanFieldKeep(0.65); // CLEAN_FIELD_KEEP
    setCleanFieldDotScale(0.5);
    setCleanFieldEdge(0.4);
  }, []);

  // Collect the current brandmark-appearance state into a flat settings object.
  // Keys map 1:1 to the production constants (see the panel's "production map"
  // note), so a shared id translates straight into the real centerpiece tune.
  const buildSettings = useCallback(
    () => ({
      v: 1,
      target: "services-centerpiece",
      count,
      cleanField,
      corridorKeep,
      cleanFieldKeep,
      cleanFieldDotScale,
      cleanFieldEdge,
      pointSize,
      opacity,
      color,
      accentColor,
      depth,
      bulge,
      thickness,
      ignite,
      scatterRadius,
      driftAmpX,
      driftAmpY,
      driftPeriodX,
      driftPeriodY,
    }),
    [
      count,
      cleanField,
      corridorKeep,
      cleanFieldKeep,
      cleanFieldDotScale,
      cleanFieldEdge,
      pointSize,
      opacity,
      color,
      accentColor,
      depth,
      bulge,
      thickness,
      ignite,
      scatterRadius,
      driftAmpX,
      driftAmpY,
      driftPeriodX,
      driftPeriodY,
    ]
  );

  const applySettings = useCallback((s: Record<string, unknown>) => {
    const num = (k: string, fallback: number) =>
      typeof s[k] === "number" ? (s[k] as number) : fallback;
    const str = (k: string, fallback: string) =>
      typeof s[k] === "string" ? (s[k] as string) : fallback;
    setCount(num("count", DEFAULTS.count));
    setCleanField(num("cleanField", DEFAULTS.cleanField));
    setCorridorKeep(num("corridorKeep", DEFAULTS.corridorKeep));
    setCleanFieldKeep(num("cleanFieldKeep", DEFAULTS.cleanFieldKeep));
    setCleanFieldDotScale(num("cleanFieldDotScale", DEFAULTS.cleanFieldDotScale));
    setCleanFieldEdge(num("cleanFieldEdge", DEFAULTS.cleanFieldEdge));
    setPointSize(num("pointSize", DEFAULTS.pointSize));
    setOpacity(num("opacity", DEFAULTS.opacity));
    setColor(str("color", DEFAULTS.color));
    setAccentColor(str("accentColor", DEFAULTS.accentColor));
    setDepth(num("depth", DEFAULTS.depth));
    setBulge(num("bulge", DEFAULTS.bulge));
    setThickness(num("thickness", DEFAULTS.thickness));
    setIgnite(num("ignite", DEFAULTS.ignite));
    setScatterRadius(num("scatterRadius", DEFAULTS.scatterRadius));
    setDriftAmpX(num("driftAmpX", DEFAULTS.driftAmpX));
    setDriftAmpY(num("driftAmpY", DEFAULTS.driftAmpY));
    setDriftPeriodX(num("driftPeriodX", DEFAULTS.driftPeriodX));
    setDriftPeriodY(num("driftPeriodY", DEFAULTS.driftPeriodY));
  }, []);

  const handleSavePreset = useCallback(async () => {
    if (!supabase) {
      setPresetStatus("Supabase not configured (.env.local)");
      return;
    }
    setPresetBusy(true);
    setPresetStatus("Saving…");
    const settings = buildSettings();
    const label = presetLabel.trim().slice(0, 120);
    for (let attempt = 0; attempt < 5; attempt++) {
      let slug = "";
      for (let i = 0; i < 6; i++) slug += ((Math.random() * 36) | 0).toString(36);
      const { error } = await supabase
        .from("brandmark_presets")
        .insert({ slug, label: label || null, settings });
      if (!error) {
        setPresetSlug(slug);
        setLoadSlug(slug);
        setPresetStatus(`Saved — share this id: ${slug}`);
        setPresetBusy(false);
        return;
      }
      if (error.code === "23505") continue; // slug collision → retry
      setPresetStatus(`Save failed: ${error.message}`);
      setPresetBusy(false);
      return;
    }
    setPresetStatus("Save failed: too many slug collisions");
    setPresetBusy(false);
  }, [buildSettings, presetLabel]);

  const handleLoadPreset = useCallback(
    async (rawSlug: string) => {
      if (!supabase) {
        setPresetStatus("Supabase not configured (.env.local)");
        return;
      }
      const slug = rawSlug.trim().toLowerCase();
      if (!slug) {
        setPresetStatus("Enter an id to load");
        return;
      }
      setPresetBusy(true);
      setPresetStatus(`Loading ${slug}…`);
      const { data, error } = await supabase
        .from("brandmark_presets")
        .select("settings,label")
        .eq("slug", slug)
        .maybeSingle();
      if (error) {
        setPresetStatus(`Load failed: ${error.message}`);
        setPresetBusy(false);
        return;
      }
      if (!data) {
        setPresetStatus(`No preset found for "${slug}"`);
        setPresetBusy(false);
        return;
      }
      applySettings((data.settings ?? {}) as Record<string, unknown>);
      setPresetLabel(typeof data.label === "string" ? data.label : "");
      setPresetSlug(slug);
      setPresetStatus(`Loaded "${slug}"`);
      setPresetBusy(false);
    },
    [applySettings]
  );

  const backgroundColor =
    background === "dark"
      ? "var(--surface-0, #0a0908)"
      : background === "void"
        ? "#000"
        : "linear-gradient(135deg, #1a1614 0%, #0a0908 50%, #14110d 100%)";

  const forces = useMemo(
    () => ({
      off: { returnStrength: offReturn, flowStrength: offFlow, turbulence: offTurb },
      on: { returnStrength: onReturn, flowStrength: onFlow, turbulence: onTurb },
    }),
    [offReturn, offFlow, offTurb, onReturn, onFlow, onTurb]
  );

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
      >
        {showSphere ? <WireframeSphere radius={sphereRadius} detail={sphereDetail} /> : null}
        <CenterpieceDriftRig
          scale={worldHalfExtent * 2}
          cleanField={cleanField}
          ampX={driftAmpX}
          ampY={driftAmpY}
          periodX={driftPeriodX}
          periodY={driftPeriodY}
        >
          <BrandmarkPhysicsCore
            key={simEpoch}
            count={count}
            ignite={ignite}
            pointSize={pointSize}
            color={color}
            accentColor={accentColor}
            opacity={opacity}
            cleanField={cleanField}
            corridorKeep={corridorKeep}
            cleanFieldKeep={cleanFieldKeep}
            cleanFieldDotScale={cleanFieldDotScale}
            cleanFieldEdge={cleanFieldEdge}
            depth={depth}
            scatterRadius={scatterRadius}
            bulge={bulge}
            thickness={thickness}
            paused={paused}
            reducedMotion={reducedMotion}
            forces={forces}
          />
        </CenterpieceDriftRig>
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
          Brandmark Physics Core
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
          Silhouette sample + dome depth + GPGPU sim. The cloud reads as dust at ignite=0 and
          assembles into the brandmark at ignite=1.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={resetAll} style={primaryResetButtonStyle}>
            Reset all
          </button>
          <button type="button" onClick={replay} style={primaryResetButtonStyle}>
            Replay sim
          </button>
        </div>

        <SectionLabel>Presets · save / share</SectionLabel>
        <button type="button" onClick={setCenterpieceView} style={primaryResetButtonStyle}>
          Centerpiece view (parked #services)
        </button>
        <input
          type="text"
          value={presetLabel}
          onChange={(e) => setPresetLabel(e.target.value)}
          placeholder="Label (optional)"
          maxLength={120}
          style={{
            width: "100%",
            boxSizing: "border-box",
            margin: "8px 0",
            padding: "6px 8px",
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(202,165,84,0.3)",
            color: "var(--dawn, #ece3d6)",
            fontFamily: "inherit",
            fontSize: 11,
          }}
        />
        <button
          type="button"
          onClick={handleSavePreset}
          disabled={presetBusy}
          style={{ ...primaryResetButtonStyle, opacity: presetBusy ? 0.5 : 1 }}
        >
          Save → share id
        </button>
        {presetSlug ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              margin: "8px 0",
              padding: "6px 10px",
              background: "rgba(202,165,84,0.08)",
              border: "1px solid rgba(202,165,84,0.35)",
            }}
          >
            <span style={{ color: "var(--gold, #caa554)", fontSize: 14, letterSpacing: "0.12em" }}>
              {presetSlug}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(presetSlug)}
              style={{
                background: "transparent",
                border: "1px solid rgba(202,165,84,0.4)",
                color: "var(--dawn, #ece3d6)",
                fontSize: 9,
                padding: "3px 8px",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              copy
            </button>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input
            type="text"
            value={loadSlug}
            onChange={(e) => setLoadSlug(e.target.value)}
            placeholder="Paste id…"
            style={{
              flex: 1,
              minWidth: 0,
              boxSizing: "border-box",
              padding: "6px 8px",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(202,165,84,0.3)",
              color: "var(--dawn, #ece3d6)",
              fontFamily: "inherit",
              fontSize: 11,
            }}
          />
          <button
            type="button"
            onClick={() => handleLoadPreset(loadSlug)}
            disabled={presetBusy}
            style={{ ...resetButtonStyle, marginTop: 0, opacity: presetBusy ? 0.5 : 1 }}
          >
            Load
          </button>
        </div>
        {presetStatus ? (
          <div
            style={{
              fontSize: 10,
              color: "rgba(236,227,214,0.6)",
              margin: "8px 0",
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {presetStatus}
          </div>
        ) : null}

        <SectionLabel>Ignite</SectionLabel>
        <ControlSlider
          label="Ignite"
          value={ignite}
          min={0}
          max={1}
          step={0.01}
          onChange={setIgnite}
        />
        <Checkbox
          label="Reduced motion (no compute)"
          checked={reducedMotion}
          onChange={setReducedMotion}
        />
        <Checkbox label="Pause sim" checked={paused} onChange={setPaused} />
        <div
          style={{
            fontSize: 9,
            color: "rgba(236, 227, 214, 0.4)",
            marginTop: -4,
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          Reduced-motion forces a static render at home positions (mobile fallback path). Pause
          freezes the dynamic sim mid-frame.
        </div>

        <SectionLabel>Particles</SectionLabel>
        <ControlSlider
          label="Particle count (global budget)"
          value={count}
          min={500}
          max={8000}
          step={100}
          onChange={(v) => setCount(Math.round(v))}
        />
        <ControlSlider
          label="Corridor keep (clean=0 draw frac)"
          value={corridorKeep}
          min={0.1}
          max={1}
          step={0.01}
          onChange={setCorridorKeep}
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
          Count is the shared budget. Corridor keep thins it back down at clean field 0 so the
          corridor stays calm while the centerpiece (clean field 1, Keep slider) draws densely.
          Prod: count 6000, corridor keep ≈ 0.27 (≈1600 drawn). &gt; 4096 uses a 128×128 sim texture
          (~4× compute).
        </div>
        <ControlSlider
          label="Scatter radius"
          value={scatterRadius}
          min={0}
          max={1.5}
          step={0.01}
          onChange={setScatterRadius}
        />
        <ControlSlider
          label="Forward dome (bulge)"
          value={bulge}
          min={0}
          max={0.5}
          step={0.005}
          onChange={setBulge}
        />
        <ControlSlider
          label="Thickness jitter"
          value={thickness}
          min={0}
          max={0.3}
          step={0.005}
          onChange={setThickness}
        />
        <button type="button" onClick={resetParticles} style={resetButtonStyle}>
          Reset particles
        </button>

        <SectionLabel>Render</SectionLabel>
        <ControlSlider
          label="Point size (CSS px)"
          value={pointSize}
          min={1}
          max={12}
          step={0.1}
          onChange={setPointSize}
        />
        <ColorRow label="Body" value={color} onChange={setColor} />
        <ColorRow label="Rim" value={accentColor} onChange={setAccentColor} />
        <ControlSlider
          label="Opacity"
          value={opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={setOpacity}
        />

        <SectionLabel>Centerpiece (Services parked)</SectionLabel>
        <ControlSlider
          label="Clean field (0 corridor · 1 parked)"
          value={cleanField}
          min={0}
          max={1}
          step={0.01}
          onChange={setCleanField}
        />
        <ControlSlider
          label="Depth (0 flat · 1 dome)"
          value={depth}
          min={0}
          max={1}
          step={0.01}
          onChange={setDepth}
        />
        <ControlSlider
          label="Keep — particle fraction (spacing)"
          value={cleanFieldKeep}
          min={0.4}
          max={1}
          step={0.01}
          onChange={setCleanFieldKeep}
        />
        <ControlSlider
          label="Dot scale (fineness)"
          value={cleanFieldDotScale}
          min={0.2}
          max={1.2}
          step={0.01}
          onChange={setCleanFieldDotScale}
        />
        <ControlSlider
          label="Dot crispness (edge)"
          value={cleanFieldEdge}
          min={0.2}
          max={0.5}
          step={0.01}
          onChange={setCleanFieldEdge}
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
          Clean field → 1 is the parked #services look: thinned (Keep), fine uniform dots (Dot
          scale), crisp (Dot crispness), no per-particle pulse, sim turbulence damped to 0 (wobble
          kill); Depth keeps the 3D dome and the drift below tilts it; background dim = the Opacity
          slider. Production map → count: COUNT_DESKTOP · Keep: CLEAN_FIELD_KEEP · Dot scale: clean
          dot mult · Dot crispness: clean falloff · Opacity: CENTER_OPACITY · Point size:
          CORE_POINT_SIZE_3D · Tilt: CENTER_DRIFT_*.
        </div>
        <button type="button" onClick={resetRender} style={resetButtonStyle}>
          Reset render
        </button>

        <SectionLabel>Centerpiece drift (× clean field)</SectionLabel>
        <ControlSlider
          label="Tilt amp X (rad)"
          value={driftAmpX}
          min={0}
          max={0.5}
          step={0.01}
          onChange={setDriftAmpX}
        />
        <ControlSlider
          label="Tilt amp Y (rad)"
          value={driftAmpY}
          min={0}
          max={0.5}
          step={0.01}
          onChange={setDriftAmpY}
        />
        <ControlSlider
          label="Tilt period X (s)"
          value={driftPeriodX}
          min={5}
          max={40}
          step={0.5}
          onChange={setDriftPeriodX}
        />
        <ControlSlider
          label="Tilt period Y (s)"
          value={driftPeriodY}
          min={5}
          max={40}
          step={0.5}
          onChange={setDriftPeriodY}
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
          Both amplitudes 0 = fully still. Maps to CENTER_DRIFT_AMP_* / CENTER_DRIFT_PERIOD_* in the
          actor. Tilt scales with clean field, so it&apos;s flat in the corridor (cleanField = 0).
        </div>

        <SectionLabel>Forces · ignite=0 (dispersed)</SectionLabel>
        <ControlSlider
          label="Return strength"
          value={offReturn}
          min={0}
          max={5}
          step={0.05}
          onChange={setOffReturn}
        />
        <ControlSlider
          label="Flow strength"
          value={offFlow}
          min={0}
          max={1}
          step={0.005}
          onChange={setOffFlow}
        />
        <ControlSlider
          label="Turbulence"
          value={offTurb}
          min={0}
          max={1}
          step={0.005}
          onChange={setOffTurb}
        />

        <SectionLabel>Forces · ignite=1 (assembled)</SectionLabel>
        <ControlSlider
          label="Return strength"
          value={onReturn}
          min={0}
          max={20}
          step={0.1}
          onChange={setOnReturn}
        />
        <ControlSlider
          label="Flow strength"
          value={onFlow}
          min={0}
          max={0.2}
          step={0.001}
          onChange={setOnFlow}
        />
        <ControlSlider
          label="Turbulence"
          value={onTurb}
          min={0}
          max={0.2}
          step={0.001}
          onChange={setOnTurb}
        />
        <button type="button" onClick={resetForces} style={resetButtonStyle}>
          Reset forces
        </button>

        <SectionLabel>Context</SectionLabel>
        <Checkbox label="Wireframe icosphere" checked={showSphere} onChange={setShowSphere} />
        <ControlSlider
          label="Sphere radius"
          value={sphereRadius}
          min={0.4}
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
          onChange={(v) => setSphereDetail(Math.round(v))}
        />
        <ControlSlider
          label="World half-extent"
          value={worldHalfExtent}
          min={0.1}
          max={1.5}
          step={0.01}
          onChange={setWorldHalfExtent}
        />
        <Checkbox
          label="Show flat SVG (compare)"
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
          Reset context
        </button>

        <p
          style={{
            marginTop: 18,
            fontSize: 10,
            color: "rgba(236, 227, 214, 0.45)",
            lineHeight: 1.6,
          }}
        >
          The cloud is sampled from the brandmark&rsquo;s 2D silhouette and given depth via a
          forward dome + per-particle Z jitter &mdash; same approach as the existing readable
          particle mark. Reset sim re-mounts the core so the assemble plays from scratch.
        </p>
      </div>
    </main>
  );
}

interface CenterpieceDriftRigProps {
  scale: number;
  cleanField: number;
  ampX: number;
  ampY: number;
  periodX: number;
  periodY: number;
  children: ReactNode;
}

/** Lab replica of the actor's centerpiece gentle 3D drift: a slow sinusoidal
 *  X / Y tilt scaled by `cleanField` (the lab's stand-in for the production
 *  `recT`). Mirrors `CENTER_DRIFT_*` in `BrandmarkPhysicsCoreActor`. At
 *  cleanField = 0 (corridor) the tilt is 0 → flat, like production. */
function CenterpieceDriftRig({
  scale,
  cleanField,
  ampX,
  ampY,
  periodX,
  periodY,
  children,
}: CenterpieceDriftRigProps) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const k = cleanField < 0 ? 0 : cleanField > 1 ? 1 : cleanField;
    const px = periodX || 1;
    const py = periodY || 1;
    g.rotation.x = Math.sin((t / px) * Math.PI * 2) * ampX * k;
    g.rotation.y = Math.sin((t / py) * Math.PI * 2) * ampY * k;
  });
  return (
    <group ref={ref} scale={scale}>
      {children}
    </group>
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
  if (step >= 0.01) return v.toFixed(2);
  return v.toFixed(3);
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
      <span style={{ color: "var(--gold, #caa554)", fontSize: 10, textTransform: "uppercase" }}>
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
