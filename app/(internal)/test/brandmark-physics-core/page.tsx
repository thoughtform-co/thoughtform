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
  type BrandmarkBasis,
  type BrandmarkCoreShape,
  type BrandmarkCoreGlyph,
  type BrandmarkCoreBlending,
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

  // Particle BASIS — where each particle LIVES (independent of how it
  // DRAWS). `dome-fill` is the legacy filled silhouette; the new bases
  // light up oriented primitives (dash / bracket / scan) by giving each
  // particle a contour tangent in `aAngle`.
  basis: "dome-fill" as BrandmarkBasis,
  gridSnap: 1 / 32, // edge-lattice cell size in normalised units

  // Particle SHAPE — how each particle draws inside its point sprite.
  shape: "dot" as BrandmarkCoreShape, // dot · dither · voxel · glyph · dash · cell · bracket · scan
  glyph: "plus" as BrandmarkCoreGlyph, // symbol when shape = glyph
  shapeStroke: 0.12, // glyph stroke / voxel gap / weight / dash width
  primitiveAspect: 2.4, // length:width for oriented primitives (dash / scan)
  lineJitter: 0, // perpendicular jitter on oriented primitives
  freezeMotion: false, // freeze sim wobble + fragment pulse (independent of cleanField)
  blending: "additive" as BrandmarkCoreBlending, // additive glow vs flat retro field

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
  // HUD reticle framing (lab-only retro-futuristic overlay)
  showReticle: false,
  reticleScale: 1,
} satisfies Record<string, unknown>;

type Background = "dark" | "void" | "test";

const SHAPE_OPTIONS: { value: BrandmarkCoreShape; label: string }[] = [
  { value: "dot", label: "Dot" },
  { value: "dither", label: "Dither" },
  { value: "voxel", label: "Voxel" },
  { value: "glyph", label: "Glyph" },
  { value: "dash", label: "Dash" },
  { value: "cell", label: "Cell" },
  { value: "bracket", label: "Brkt" },
  { value: "scan", label: "Scan" },
];

const ALL_SHAPE_VALUES: ReadonlyArray<BrandmarkCoreShape> = [
  "dot",
  "dither",
  "voxel",
  "glyph",
  "dash",
  "cell",
  "bracket",
  "scan",
];

const GLYPH_OPTIONS: { value: BrandmarkCoreGlyph; label: string }[] = [
  { value: "plus", label: "+" },
  { value: "cross", label: "✕" },
  { value: "square", label: "▢" },
  { value: "ring", label: "◦" },
  { value: "diamond", label: "◇" },
  { value: "asterisk", label: "✳" },
];

const ALL_GLYPH_VALUES: ReadonlyArray<BrandmarkCoreGlyph> = [
  "plus",
  "cross",
  "square",
  "ring",
  "diamond",
  "asterisk",
];

const BLENDING_OPTIONS: { value: BrandmarkCoreBlending; label: string }[] = [
  { value: "additive", label: "Additive" },
  { value: "normal", label: "Normal" },
];

const BASIS_OPTIONS: { value: BrandmarkBasis; label: string }[] = [
  { value: "dome-fill", label: "Filled" },
  { value: "svg-outline", label: "Outline" },
  { value: "edge-lattice", label: "Lattice" },
  { value: "model-wire", label: "Wire" },
];

const ALL_BASIS_VALUES: ReadonlyArray<BrandmarkBasis> = [
  "dome-fill",
  "svg-outline",
  "edge-lattice",
  "model-wire",
];

/** Visual preset = a coordinated bundle of basis / shape / blending /
 *  primitive knobs that the lab can apply with one click, so changes
 *  read as a genuine style shift rather than a single slider tweak.
 *  Five presets cover the design space we're exploring:
 *
 *   - `Luminous Dust` — the legacy soft-halo additive cloud (today's
 *     production look). Equivalent to "reset render".
 *   - `Vector Trace` — particles ON the SVG contour with oriented short
 *     dashes (tangent-aligned). Tactical drafting feel; pairs with
 *     Normal blending so the dashes read crisp.
 *   - `Raster Field` — dome-fill quantised to a lattice with hard outlined
 *     cells. HORSE 2026 / halftone look.
 *   - `Wire Artifact` — model-wire basis (contours fan into the depth
 *     plane) with oriented dashes; reads as a wireframe 3D object.
 *   - `HUD Glyph` — dome-fill with plus / cross glyphs. The closest to
 *     the Shift5 reticle grid: legible glyphs over the brandmark area. */
interface VisualPreset {
  id: string;
  label: string;
  description: string;
  apply: {
    basis: BrandmarkBasis;
    shape: BrandmarkCoreShape;
    glyph?: BrandmarkCoreGlyph;
    blending: BrandmarkCoreBlending;
    shapeStroke: number;
    primitiveAspect: number;
    lineJitter: number;
    pointSize: number;
    opacity: number;
    corridorKeep: number;
    cleanFieldKeep: number;
    cleanFieldDotScale: number;
    cleanFieldEdge: number;
    cleanField: number;
    bulge: number;
    thickness: number;
    /** Freeze sim wobble + fragment pulse. Defaults to `true` for raster /
     *  wire-style looks where the brandmark should read as a STATIC dither /
     *  cell field rather than a breathing cloud (sim micro-jitter on hard
     *  pixel cells reads as "wobble like liquid"). */
    freezeMotion: boolean;
  };
}

const VISUAL_PRESETS: ReadonlyArray<VisualPreset> = [
  {
    id: "luminous-dust",
    label: "Luminous Dust",
    description: "Soft halo · additive · the legacy production look. Breathing motion.",
    apply: {
      basis: "dome-fill",
      shape: "dot",
      blending: "additive",
      shapeStroke: 0.12,
      primitiveAspect: 2.4,
      lineJitter: 0,
      pointSize: 2.8,
      opacity: 0.9,
      corridorKeep: 1,
      cleanFieldKeep: 0.65,
      cleanFieldDotScale: 0.5,
      cleanFieldEdge: 0.4,
      cleanField: 0,
      bulge: 0.18,
      thickness: 0.06,
      freezeMotion: false,
    },
  },
  {
    id: "vector-trace",
    label: "Vector Trace",
    description: "Particles ON the contour · tangent-aligned dashes · normal blending · static.",
    apply: {
      basis: "svg-outline",
      shape: "dash",
      blending: "normal",
      shapeStroke: 0.09,
      primitiveAspect: 2.6,
      lineJitter: 0.2,
      pointSize: 4.5,
      opacity: 0.95,
      corridorKeep: 1,
      cleanFieldKeep: 1,
      cleanFieldDotScale: 1,
      cleanFieldEdge: 0.4,
      cleanField: 0,
      bulge: 0,
      thickness: 0,
      freezeMotion: true,
    },
  },
  {
    id: "raster-field",
    label: "Raster Field",
    description: "Filled silhouette snapped to a lattice · outlined cells · static raster.",
    apply: {
      basis: "edge-lattice",
      shape: "cell",
      blending: "normal",
      shapeStroke: 0.16,
      primitiveAspect: 1,
      lineJitter: 0,
      pointSize: 6,
      opacity: 0.95,
      corridorKeep: 1,
      cleanFieldKeep: 1,
      cleanFieldDotScale: 1,
      cleanFieldEdge: 0.4,
      cleanField: 0,
      bulge: 0,
      thickness: 0,
      freezeMotion: true,
    },
  },
  {
    id: "wire-artifact",
    label: "Wire Artifact",
    description: "Contours fan into depth · oriented dashes · wireframe 3D object · static.",
    apply: {
      basis: "model-wire",
      shape: "dash",
      blending: "additive",
      shapeStroke: 0.07,
      primitiveAspect: 3,
      lineJitter: 0.1,
      pointSize: 3.5,
      opacity: 0.9,
      corridorKeep: 1,
      cleanFieldKeep: 1,
      cleanFieldDotScale: 1,
      cleanFieldEdge: 0.4,
      cleanField: 0,
      bulge: 0.22,
      thickness: 0,
      freezeMotion: true,
    },
  },
  {
    id: "hud-glyph",
    label: "HUD Glyph",
    description: "Filled silhouette · plus/cross glyphs · additive HUD reticle field · static.",
    apply: {
      basis: "dome-fill",
      shape: "glyph",
      glyph: "plus",
      blending: "additive",
      shapeStroke: 0.08,
      primitiveAspect: 1,
      lineJitter: 0,
      pointSize: 5,
      opacity: 0.85,
      corridorKeep: 1,
      cleanFieldKeep: 0.7,
      cleanFieldDotScale: 0.7,
      cleanFieldEdge: 0.4,
      cleanField: 0,
      bulge: 0,
      thickness: 0,
      freezeMotion: true,
    },
  },
];

export default function BrandmarkPhysicsCorePage() {
  const [count, setCount] = useState(DEFAULTS.count);
  const [scatterRadius, setScatterRadius] = useState(DEFAULTS.scatterRadius);
  const [bulge, setBulge] = useState(DEFAULTS.bulge);
  const [thickness, setThickness] = useState(DEFAULTS.thickness);

  const [pointSize, setPointSize] = useState(DEFAULTS.pointSize);
  const [color, setColor] = useState(DEFAULTS.color);
  const [accentColor, setAccentColor] = useState(DEFAULTS.accentColor);
  const [opacity, setOpacity] = useState(DEFAULTS.opacity);
  const [basis, setBasis] = useState<BrandmarkBasis>(DEFAULTS.basis);
  const [gridSnap, setGridSnap] = useState(DEFAULTS.gridSnap);
  const [shape, setShape] = useState<BrandmarkCoreShape>(DEFAULTS.shape);
  const [glyph, setGlyph] = useState<BrandmarkCoreGlyph>(DEFAULTS.glyph);
  const [shapeStroke, setShapeStroke] = useState(DEFAULTS.shapeStroke);
  const [primitiveAspect, setPrimitiveAspect] = useState(DEFAULTS.primitiveAspect);
  const [lineJitter, setLineJitter] = useState(DEFAULTS.lineJitter);
  const [freezeMotion, setFreezeMotion] = useState(DEFAULTS.freezeMotion);
  const [blending, setBlending] = useState<BrandmarkCoreBlending>(DEFAULTS.blending);
  const [activePreset, setActivePreset] = useState<string>("luminous-dust");
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
  // Tracks whether the on-mount ?preset=<slug> auto-load has fired so React
  // strict mode's effect double-invocation in dev doesn't load the same
  // preset twice. A ref (not state) so the strict-mode second run sees the
  // value the first run set — `useEffect` cleanup doesn't reset refs.
  const initialUrlLoadHandled = useRef(false);

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
  const [showReticle, setShowReticle] = useState(DEFAULTS.showReticle);
  const [reticleScale, setReticleScale] = useState(DEFAULTS.reticleScale);

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
    setBasis(DEFAULTS.basis);
    setGridSnap(DEFAULTS.gridSnap);
    setShape(DEFAULTS.shape);
    setGlyph(DEFAULTS.glyph);
    setShapeStroke(DEFAULTS.shapeStroke);
    setPrimitiveAspect(DEFAULTS.primitiveAspect);
    setLineJitter(DEFAULTS.lineJitter);
    setFreezeMotion(DEFAULTS.freezeMotion);
    setBlending(DEFAULTS.blending);
    setActivePreset("luminous-dust");
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

  // Apply a coordinated visual preset (basis + shape + blending + sizing
  // + clean-field knobs all together) so a single click lands a fully-
  // realised look instead of fiddling with sliders one by one. Preserves
  // `count` / `worldHalfExtent` / forces (the lab's tuning context),
  // updates only the appearance dials.
  const applyVisualPreset = useCallback((id: string) => {
    const preset = VISUAL_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setActivePreset(preset.id);
    setBasis(preset.apply.basis);
    setShape(preset.apply.shape);
    if (preset.apply.glyph) setGlyph(preset.apply.glyph);
    setBlending(preset.apply.blending);
    setShapeStroke(preset.apply.shapeStroke);
    setPrimitiveAspect(preset.apply.primitiveAspect);
    setLineJitter(preset.apply.lineJitter);
    setFreezeMotion(preset.apply.freezeMotion);
    setPointSize(preset.apply.pointSize);
    setOpacity(preset.apply.opacity);
    setCorridorKeep(preset.apply.corridorKeep);
    setCleanFieldKeep(preset.apply.cleanFieldKeep);
    setCleanFieldDotScale(preset.apply.cleanFieldDotScale);
    setCleanFieldEdge(preset.apply.cleanFieldEdge);
    setCleanField(preset.apply.cleanField);
    setBulge(preset.apply.bulge);
    setThickness(preset.apply.thickness);
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
    setShowReticle(DEFAULTS.showReticle);
    setReticleScale(DEFAULTS.reticleScale);
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
  // Schema v2 adds `basis`, `gridSnap`, `primitiveAspect`, `lineJitter`, and
  // `activePreset` — v1 presets still load (missing fields fall back to defaults).
  const buildSettings = useCallback(
    () => ({
      v: 2,
      target: "services-centerpiece",
      activePreset,
      basis,
      gridSnap,
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
      shape,
      glyph,
      shapeStroke,
      primitiveAspect,
      lineJitter,
      freezeMotion,
      blending,
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
      activePreset,
      basis,
      gridSnap,
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
      shape,
      glyph,
      shapeStroke,
      primitiveAspect,
      lineJitter,
      freezeMotion,
      blending,
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
    // Basis (v2) — gracefully defaults to "dome-fill" for v1 presets that
    // never wrote one, preserving their visual intent (filled silhouette).
    const basisVal = str("basis", DEFAULTS.basis) as BrandmarkBasis;
    setBasis(
      (ALL_BASIS_VALUES as ReadonlyArray<string>).includes(basisVal) ? basisVal : DEFAULTS.basis
    );
    setGridSnap(num("gridSnap", DEFAULTS.gridSnap));
    const shapeVal = str("shape", DEFAULTS.shape) as BrandmarkCoreShape;
    setShape((ALL_SHAPE_VALUES as ReadonlyArray<string>).includes(shapeVal) ? shapeVal : "dot");
    const glyphVal = str("glyph", DEFAULTS.glyph) as BrandmarkCoreGlyph;
    setGlyph((ALL_GLYPH_VALUES as ReadonlyArray<string>).includes(glyphVal) ? glyphVal : "plus");
    setShapeStroke(num("shapeStroke", DEFAULTS.shapeStroke));
    setPrimitiveAspect(num("primitiveAspect", DEFAULTS.primitiveAspect));
    setLineJitter(num("lineJitter", DEFAULTS.lineJitter));
    // freezeMotion (v2). Missing on v1 presets → default false (legacy
    // "Luminous Dust" breathing motion). Boolean cast so JSON `false` and
    // `undefined` both produce the right result.
    setFreezeMotion(
      typeof s["freezeMotion"] === "boolean"
        ? (s["freezeMotion"] as boolean)
        : DEFAULTS.freezeMotion
    );
    setBlending(str("blending", DEFAULTS.blending) === "normal" ? "normal" : "additive");
    setDepth(num("depth", DEFAULTS.depth));
    setBulge(num("bulge", DEFAULTS.bulge));
    setThickness(num("thickness", DEFAULTS.thickness));
    setIgnite(num("ignite", DEFAULTS.ignite));
    setScatterRadius(num("scatterRadius", DEFAULTS.scatterRadius));
    setDriftAmpX(num("driftAmpX", DEFAULTS.driftAmpX));
    setDriftAmpY(num("driftAmpY", DEFAULTS.driftAmpY));
    setDriftPeriodX(num("driftPeriodX", DEFAULTS.driftPeriodX));
    setDriftPeriodY(num("driftPeriodY", DEFAULTS.driftPeriodY));
    // Mark the loaded preset as "custom" so the UI doesn't claim it
    // matches one of the canned VISUAL_PRESETS unless v2 explicitly says so.
    const presetVal = str("activePreset", "");
    setActivePreset(VISUAL_PRESETS.some((p) => p.id === presetVal) ? presetVal : "custom");
  }, []);

  // Build a shareable URL for the current preset. The page lives at
  // /test/brandmark-physics-core; a `?preset=<slug>` query param re-loads
  // the preset on next visit. Returns a string the user can paste anywhere.
  const buildPresetUrl = useCallback((slug: string): string => {
    if (typeof window === "undefined") return "";
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?preset=${encodeURIComponent(slug)}`;
  }, []);

  // Reflect a loaded / saved slug in the address bar so a refresh re-loads
  // and the URL itself is shareable. `replaceState` (not `pushState`) keeps
  // the browser back-stack clean — bouncing between presets shouldn't fill
  // up history.
  const writePresetToUrl = useCallback((slug: string): void => {
    if (typeof window === "undefined") return;
    const next = `${window.location.pathname}?preset=${encodeURIComponent(slug)}`;
    window.history.replaceState(null, "", next);
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
        writePresetToUrl(slug);
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
  }, [buildSettings, presetLabel, writePresetToUrl]);

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
      setLoadSlug(slug);
      writePresetToUrl(slug);
      setPresetStatus(`Loaded "${slug}"`);
      setPresetBusy(false);
    },
    [applySettings, writePresetToUrl]
  );

  // On mount, honour ?preset=<slug> from the URL so a shared link loads the
  // right look automatically. The ref guard prevents React strict mode's
  // effect double-invocation in dev from firing the load twice. Runs only
  // once per page mount; subsequent URL changes are intentionally ignored
  // (the user has the input + Load button for explicit reloads).
  //
  // `handleLoadPreset` eventually writes state (busy / status / loadSlug /
  // preset settings) via an async Supabase fetch — the `react-hooks/
  // set-state-in-effect` rule flags this conservatively because it can't
  // see across the promise boundary, but this is exactly the "subscribe to
  // an external system" pattern the rule's docs OK. The cascading-render
  // concern doesn't apply: the load fires once per page mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialUrlLoadHandled.current) return;
    initialUrlLoadHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("preset");
    if (!slug) return;
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void handleLoadPreset(trimmed);
  }, [handleLoadPreset]);

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
            basis={basis}
            gridSnap={gridSnap}
            shape={shape}
            glyph={glyph}
            shapeStroke={shapeStroke}
            primitiveAspect={primitiveAspect}
            lineJitter={lineJitter}
            freezeMotion={freezeMotion}
            blending={blending}
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

      {showReticle ? <ReticleOverlay scale={reticleScale} /> : null}

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
            <span
              style={{
                color: "var(--gold, #caa554)",
                fontSize: 14,
                letterSpacing: "0.12em",
                flex: "1 1 auto",
                minWidth: 0,
              }}
            >
              {presetSlug}
            </span>
            <div style={{ display: "flex", gap: 4, flex: "0 0 auto" }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(presetSlug);
                  setPresetStatus(`Copied id: ${presetSlug}`);
                }}
                title="Copy just the id"
                style={presetMicroButtonStyle}
              >
                id
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = buildPresetUrl(presetSlug);
                  if (!url) return;
                  navigator.clipboard?.writeText(url);
                  setPresetStatus(`Copied URL: ${url}`);
                }}
                title="Copy a shareable URL with the preset embedded"
                style={presetMicroButtonStyle}
              >
                url
              </button>
            </div>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input
            type="text"
            value={loadSlug}
            onChange={(e) => setLoadSlug(e.target.value)}
            onKeyDown={(e) => {
              // Enter loads — no need to round-trip through the button. Also
              // accept the most common "I just hit space by mistake" → trim
              // in handleLoadPreset, so leading whitespace doesn't fail the
              // 23505 slug regex.
              if (e.key === "Enter") {
                e.preventDefault();
                if (!presetBusy) handleLoadPreset(loadSlug);
              }
            }}
            placeholder="Paste id…"
            style={{
              flex: "1 1 auto",
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
            // Without an explicit width override, this button inherits
            // `width: 100%` from resetButtonStyle. In a flex row that becomes
            // its flex-basis, so the button greedily fills the row and the
            // input shrinks to a single character wide. Pin it to auto.
            style={{
              ...resetButtonStyle,
              width: "auto",
              flex: "0 0 auto",
              marginTop: 0,
              padding: "6px 14px",
              opacity: presetBusy ? 0.5 : 1,
            }}
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

        <SectionLabel>Visual preset</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {VISUAL_PRESETS.map((p) => {
            const active = p.id === activePreset;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyVisualPreset(p.id)}
                style={{
                  flex: "1 1 calc(50% - 4px)",
                  minWidth: 100,
                  padding: "6px 8px",
                  textAlign: "left",
                  background: active ? "rgba(202,165,84,0.18)" : "transparent",
                  border: `1px solid ${active ? "rgba(202,165,84,0.7)" : "rgba(202,165,84,0.25)"}`,
                  color: active ? "var(--gold, #caa554)" : "rgba(236,227,214,0.7)",
                  fontFamily: "inherit",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  lineHeight: 1.3,
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(236, 227, 214, 0.5)",
            marginBottom: 8,
            lineHeight: 1.5,
            minHeight: 26,
          }}
        >
          {VISUAL_PRESETS.find((p) => p.id === activePreset)?.description ??
            "Custom · loaded from a shared id or hand-tuned."}
        </div>

        <SectionLabel>Particle basis (where particles live)</SectionLabel>
        <ChoiceRow
          label="Basis"
          value={basis}
          options={BASIS_OPTIONS}
          onChange={(v) => {
            setBasis(v);
            setActivePreset("custom");
          }}
        />
        {basis === "edge-lattice" ? (
          <ControlSlider
            label="Lattice cell (1/N)"
            value={gridSnap}
            min={1 / 80}
            max={1 / 12}
            step={0.001}
            onChange={(v) => {
              setGridSnap(v);
              setActivePreset("custom");
            }}
          />
        ) : null}
        <div
          style={{
            fontSize: 9,
            color: "rgba(236, 227, 214, 0.4)",
            marginTop: -4,
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          Filled = legacy silhouette (today&rsquo;s production). Outline = particles ON the SVG
          contour (tangent stored in aAngle for oriented strokes). Lattice = silhouette snapped to a
          grid for raster reads. Wire = outline + per-path Z so contours fan into depth.
        </div>

        <SectionLabel>Particle shape (how each draws)</SectionLabel>
        <ChoiceRow
          label="Shape"
          value={shape}
          options={SHAPE_OPTIONS}
          onChange={(v) => {
            setShape(v);
            setActivePreset("custom");
          }}
        />
        {shape === "glyph" ? (
          <ChoiceRow
            label="Symbol"
            value={glyph}
            options={GLYPH_OPTIONS}
            onChange={(v) => {
              setGlyph(v);
              setActivePreset("custom");
            }}
          />
        ) : null}
        {shape !== "dot" ? (
          <ControlSlider
            label={
              shape === "voxel"
                ? "Voxel gap"
                : shape === "cell"
                  ? "Cell stroke"
                  : shape === "dash" || shape === "scan"
                    ? "Stroke width"
                    : "Stroke / weight"
            }
            value={shapeStroke}
            min={0.02}
            max={0.3}
            step={0.005}
            onChange={(v) => {
              setShapeStroke(v);
              setActivePreset("custom");
            }}
          />
        ) : null}
        {shape === "dash" || shape === "scan" || shape === "bracket" ? (
          <>
            <ControlSlider
              label="Primitive aspect (len:width)"
              value={primitiveAspect}
              min={1}
              max={5}
              step={0.05}
              onChange={(v) => {
                setPrimitiveAspect(v);
                setActivePreset("custom");
              }}
            />
            <ControlSlider
              label="Line jitter (perpendicular)"
              value={lineJitter}
              min={0}
              max={1}
              step={0.02}
              onChange={(v) => {
                setLineJitter(v);
                setActivePreset("custom");
              }}
            />
          </>
        ) : null}
        <ChoiceRow
          label="Blending"
          value={blending}
          options={BLENDING_OPTIONS}
          onChange={(v) => {
            setBlending(v);
            setActivePreset("custom");
          }}
        />
        <Checkbox
          label="Freeze motion (static render)"
          checked={freezeMotion}
          onChange={(v) => {
            setFreezeMotion(v);
            setActivePreset("custom");
          }}
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
          Dot = original soft glow. Dither / Voxel / Cell / Glyph rewrite the per-particle mask.
          Dash / Bracket / Scan rotate by the contour tangent &mdash; pair them with the Outline or
          Wire basis to get oriented strokes; on Filled basis they fall back to axis-aligned. Normal
          blending kills the additive bloom for the rasterised looks. <strong>Freeze motion</strong>{" "}
          damps the GPGPU sim&rsquo;s turbulence + flow to 0 AND stills the fragment pulse, so the
          brandmark reads as a STATIC dither / raster field instead of wobbling like a liquid.
          Decoupled from Clean field, so colour / density stay where they are. Lab-only &mdash; the
          live #services centerpiece is unaffected unless production wires a preset.
        </div>

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
        <Checkbox label="HUD reticle framing" checked={showReticle} onChange={setShowReticle} />
        {showReticle ? (
          <ControlSlider
            label="Reticle size"
            value={reticleScale}
            min={0.5}
            max={2}
            step={0.05}
            onChange={setReticleScale}
          />
        ) : null}
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

interface ChoiceRowProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

/** Compact segmented button group — used for the shape / symbol / blending
 *  switches (more legible than a stack of radios for short enumerations). */
function ChoiceRow<T extends string>({ label, value, options, onChange }: ChoiceRowProps<T>) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span
        style={{
          display: "block",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 10,
          color: "var(--dawn-70, rgba(236,227,214,0.7))",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                flex: "1 1 auto",
                minWidth: 36,
                padding: "5px 8px",
                background: active ? "rgba(202,165,84,0.18)" : "transparent",
                border: `1px solid ${active ? "rgba(202,165,84,0.7)" : "rgba(202,165,84,0.25)"}`,
                color: active ? "var(--gold, #caa554)" : "rgba(236,227,214,0.6)",
                fontFamily: "inherit",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Retro-futuristic focus-reticle overlay (corner brackets + registration ticks
 *  + mono labels) framing the centred mark — the look from the Benjamin /
 *  HORSE 2026 references. Lab-only presentation; never mounted in production. */
function ReticleOverlay({ scale }: { scale: number }) {
  const side = 46 * scale; // vmin
  const arm = 24; // px bracket arm length
  const stroke = "rgba(202, 165, 84, 0.85)";
  const faint = "rgba(202, 165, 84, 0.5)";
  const corner: React.CSSProperties = {
    position: "absolute",
    width: arm,
    height: arm,
    borderColor: stroke,
    borderStyle: "solid",
    borderWidth: 0,
  };
  const tick: React.CSSProperties = { position: "absolute", background: stroke };
  const label: React.CSSProperties = {
    position: "absolute",
    fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
    fontSize: 10,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(236, 227, 214, 0.7)",
    whiteSpace: "nowrap",
  };
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        width: `${side}vmin`,
        height: `${side}vmin`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 40,
      }}
    >
      {/* corner brackets */}
      <div style={{ ...corner, top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }} />
      <div style={{ ...corner, top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }} />
      <div style={{ ...corner, bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }} />
      <div style={{ ...corner, bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }} />

      {/* edge registration ticks */}
      <div
        style={{
          ...tick,
          top: -1,
          left: "50%",
          width: 1,
          height: 10,
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          ...tick,
          bottom: -1,
          left: "50%",
          width: 1,
          height: 10,
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          ...tick,
          left: -1,
          top: "50%",
          width: 10,
          height: 1,
          transform: "translateY(-50%)",
        }}
      />
      <div
        style={{
          ...tick,
          right: -1,
          top: "50%",
          width: 10,
          height: 1,
          transform: "translateY(-50%)",
        }}
      />

      {/* center crosshair */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 16,
          height: 1,
          background: faint,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 1,
          height: 16,
          background: faint,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* mono labels */}
      <div style={{ ...label, top: -18, left: 2 }}>Brandmark · Core</div>
      <div style={{ ...label, top: -18, right: 2, color: "rgba(202,165,84,0.8)" }}>TF—023</div>
      <div style={{ ...label, bottom: -18, left: 2 }}>Lat 0.000 · Lon 0.000</div>
      <div style={{ ...label, bottom: -18, right: 2 }}>Scan ▮▮▯</div>
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

// Compact micro-button used inside the "preset slug" chip for the
// `id` / `url` copy actions. Sized to read as a hint inside the chip,
// not as a primary action — the chip itself is the affordance.
const presetMicroButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(202,165,84,0.4)",
  color: "var(--dawn, #ece3d6)",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 9,
  padding: "3px 8px",
  cursor: "pointer",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};
