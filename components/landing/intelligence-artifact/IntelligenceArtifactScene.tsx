"use client";

/**
 * IntelligenceArtifactScene — the lab-page shell around the artifact.
 *
 *   - Canvas wrapper with camera + WebGL settings.
 *   - Capability gate: probes WebGL on mount, listens to
 *     `prefers-reduced-motion`, and degrades gracefully when either
 *     fails (or when the viewport is too narrow for the 3D composition
 *     to read).
 *   - Variant switcher: toggle between Armillary / Shell / Orbital so
 *     the three structural metaphors can be compared side-by-side.
 *   - Scrub slider, phase tabs, and an autoplay toggle so the reveal
 *     can be inspected without wiring real scroll input.
 *   - HUD-style chrome: corner brackets, station readout, ALWAYS-ON
 *     colour-coded layer labels (Sources / Substrate / Surfaces) so
 *     it's immediately readable what each zone of the artifact is.
 *
 * This page is mounted at `/test/intelligence-artifact` and stays
 * inside the existing `(internal)` group so production traffic never
 * reaches it (middleware blocks `/test/*` in production).
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { probeWebGL } from "@/lib/webgl/probe";
import { IntelligenceArtifact } from "./IntelligenceArtifact";
import {
  ARTIFACT_LABELS,
  ARTIFACT_VARIANTS,
  type ArtifactVariant,
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_POSITION,
  COLOR_SOURCES_CSS,
  COLOR_SUBSTRATE_CSS,
  COLOR_SURFACES_CSS,
  PHASES,
  PHASE_TELEMETRY,
  clamp01,
  phasePresence,
  smoothstep,
  telemetryAt,
} from "./artifactGeom";

const PHASE_TABS: Array<{ key: keyof typeof PHASES; label: string; progress: number }> = [
  { key: "gateway", label: "Align", progress: 0.04 },
  { key: "sources", label: "Sources", progress: 0.28 },
  { key: "substrate", label: "Substrate", progress: 0.56 },
  { key: "surfaces", label: "Surfaces", progress: 0.78 },
  { key: "resolved", label: "Layer", progress: 0.96 },
];

/** Cycle length when autoplay is on (seconds for a single 0 → 1 sweep). */
const AUTOPLAY_DURATION_SEC = 14;

export function IntelligenceArtifactScene() {
  const tier = useDeviceTier();
  const isMobile = tier === "mobile";

  // ── Capability gates ────────────────────────────────────────────
  const [webglOk, setWebglOk] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebglOk(probeWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ── Variant + progress state ────────────────────────────────────
  const [variant, setVariant] = useState<ArtifactVariant>("armillary");
  const [progress, setProgress] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  useEffect(() => {
    if (!autoplay) return;
    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const t = (elapsed % AUTOPLAY_DURATION_SEC) / AUTOPLAY_DURATION_SEC;
      setProgress(t);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoplay]);

  // Wheel scrub disabled when autoplay is on.
  useEffect(() => {
    if (autoplay) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setProgress((prev) => clamp01(prev + e.deltaY * 0.0008));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [autoplay]);

  const handleTabClick = useCallback((p: number) => {
    setAutoplay(false);
    setProgress(p);
  }, []);

  // ── Phase scalars ───────────────────────────────────────────────
  // Always-on label opacities: each label fades in with its phase
  // envelope (Sources / Substrate / Surfaces) and stays visible from
  // then on — making the three layers legible end-to-end rather than
  // only at the resolved view.
  const sourcesP = phasePresence(progress, PHASES.sources);
  const substrateP = phasePresence(progress, PHASES.substrate);
  const surfacesP = phasePresence(progress, PHASES.surfaces);
  const labelGate = smoothstep(0.04, 0.18, progress);

  const labelOpacity = {
    sources: sourcesP * labelGate,
    substrate: substrateP * labelGate,
    surfaces: surfacesP * labelGate,
  };

  const telemetry = telemetryAt(progress);

  // ── Render fallback when we can't run the 3D scene ──────────────
  const useStaticFallback = webglOk === false || (webglOk !== null && reducedMotion && isMobile);

  return (
    <main className="ia-stage" data-mode={useStaticFallback ? "static" : "r3f"}>
      <style jsx>{styles}</style>

      <div className="ia-chrome">
        <div className="ia-corner ia-corner--tl" aria-hidden />
        <div className="ia-corner ia-corner--tr" aria-hidden />
        <div className="ia-corner ia-corner--bl" aria-hidden />
        <div className="ia-corner ia-corner--br" aria-hidden />

        <div className="ia-rail ia-rail--left" aria-hidden>
          <div className="ia-rail__tick" data-major />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" data-major />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" data-major />
        </div>
        <div className="ia-rail ia-rail--right" aria-hidden>
          <div className="ia-rail__tick" data-major />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" data-major />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" />
          <div className="ia-rail__tick" data-major />
        </div>

        <header className="ia-header">
          <span className="ia-header__code">INTERNAL · LAB</span>
          <span className="ia-header__title">INTELLIGENCE LAYER · ARTIFACT</span>
          <span className="ia-header__build">v0.2 · /test/intelligence-artifact</span>
        </header>

        <div className="ia-telemetry">
          <span className="ia-telemetry__code">{telemetry.code}</span>
          <span className="ia-telemetry__sep" aria-hidden>
            ◆
          </span>
          <span className="ia-telemetry__status">{telemetry.status}</span>
          <span className="ia-telemetry__sep" aria-hidden>
            ◆
          </span>
          <span className="ia-telemetry__variant">{variant.toUpperCase()}</span>
        </div>

        {/* Variant switcher — sits beside the telemetry line so the
            user can compare metaphors at the same scrub position. */}
        <div className="ia-variants" role="tablist" aria-label="Artifact variant">
          {ARTIFACT_VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={v.key === variant}
              className={`ia-variant${v.key === variant ? " is-on" : ""}`}
              onClick={() => setVariant(v.key)}
              title={v.sub}
            >
              <span className="ia-variant__label">{v.label}</span>
              <span className="ia-variant__sub">{v.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ia-canvas-wrap">
        {useStaticFallback ? (
          <StaticArtifactFallback progress={progress} variant={variant} />
        ) : webglOk === null ? (
          <div className="ia-loading" aria-hidden>
            <span>· · · · ·</span>
          </div>
        ) : (
          <Canvas
            key={variant}
            dpr={isMobile ? [1, 1.4] : [1, 1.75]}
            gl={{ alpha: true, antialias: !isMobile, premultipliedAlpha: false }}
            camera={{
              fov: CAMERA_FOV,
              near: 0.1,
              far: 60,
              position: [...CAMERA_POSITION],
            }}
            onCreated={({ camera }) => {
              camera.lookAt(...CAMERA_LOOK_AT);
            }}
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <IntelligenceArtifact
              progress={progress}
              reducedMotion={reducedMotion}
              variant={variant}
            />
          </Canvas>
        )}

        {/* Always-on labelled layer zones — colour-coded to the role
            tier so the artifact reads as Sources / Substrate /
            Surfaces from the moment each layer enters. */}
        <div className="ia-labels">
          <div
            className="ia-label ia-label--sources"
            style={
              {
                opacity: labelOpacity.sources,
                "--label-color": COLOR_SOURCES_CSS,
              } as React.CSSProperties
            }
          >
            <span className="ia-label__pip" aria-hidden />
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[0].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[0].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[0].sub}</span>
          </div>
          <div
            className="ia-label ia-label--substrate"
            style={
              {
                opacity: labelOpacity.substrate,
                "--label-color": COLOR_SUBSTRATE_CSS,
              } as React.CSSProperties
            }
          >
            <span className="ia-label__pip" aria-hidden />
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[1].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[1].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[1].sub}</span>
          </div>
          <div
            className="ia-label ia-label--surfaces"
            style={
              {
                opacity: labelOpacity.surfaces,
                "--label-color": COLOR_SURFACES_CSS,
              } as React.CSSProperties
            }
          >
            <span className="ia-label__pip" aria-hidden />
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[2].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[2].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[2].sub}</span>
          </div>
        </div>
      </div>

      {/* Phase scrubber + tabs + autoplay */}
      <div className="ia-controls">
        <div className="ia-controls__tabs" role="tablist" aria-label="Artifact phases">
          {PHASE_TABS.map((t) => {
            const phase = PHASES[t.key];
            const active =
              progress >= phase.start &&
              progress < (PHASE_TELEMETRY.find((p) => p.key === t.key)?.start ?? 0) + 0.2;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`ia-tab${active ? " is-on" : ""}`}
                onClick={() => handleTabClick(t.progress)}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          onChange={(e) => {
            setAutoplay(false);
            setProgress(parseInt(e.target.value, 10) / 1000);
          }}
          className="ia-scrub"
          aria-label="Phase progress"
        />

        <div className="ia-controls__row">
          <button
            type="button"
            className={`ia-auto${autoplay ? " is-on" : ""}`}
            onClick={() => setAutoplay((a) => !a)}
          >
            {autoplay ? "❚❚ AUTO" : "▶ AUTO"}
          </button>
          <span className="ia-controls__hint">scroll · drag the dial · tap a phase</span>
          <span className="ia-controls__readout">{Math.round(progress * 100)}%</span>
        </div>
      </div>
    </main>
  );
}

// ── Static fallback ───────────────────────────────────────────────────

interface StaticFallbackProps {
  progress: number;
  variant: ArtifactVariant;
}

/** SVG-only schematic shown when WebGL is unavailable or the device is
 *  flagged reduced-motion + mobile. Same semantic layers (sources →
 *  substrate → surfaces) at rest. */
function StaticArtifactFallback({ progress, variant }: StaticFallbackProps) {
  const sourcesP = phasePresence(progress, PHASES.sources);
  const substrateP = phasePresence(progress, PHASES.substrate);
  const surfacesP = phasePresence(progress, PHASES.surfaces);

  // All three variants reduce to the same essential schematic for the
  // static fallback — an outer Surfaces dawn ring, a middle Sources
  // green band, and a central Substrate gold core. The variant only
  // affects the inner sphere style (geodesic polygon vs concentric
  // rings vs cross-tilted ellipses).
  return (
    <svg
      className="ia-fallback"
      viewBox="-200 -160 400 320"
      role="img"
      aria-label={`Intelligence layer artifact (static schematic: ${variant})`}
    >
      {/* Outer Surfaces shell — dawn */}
      <polygon
        points={polygonPoints(0, 0, 160, variant === "armillary" ? 12 : 24)}
        fill="none"
        stroke={COLOR_SURFACES_CSS}
        strokeOpacity={0.45 * surfacesP + 0.15}
        strokeWidth={0.8}
      />

      {/* Middle Sources band — Atreides green */}
      <polygon
        points={polygonPoints(0, 0, 110, variant === "armillary" ? 12 : 32)}
        fill="none"
        stroke={COLOR_SOURCES_CSS}
        strokeOpacity={0.55 * sourcesP + 0.1}
        strokeWidth={0.85}
      />
      <polygon
        points={polygonPoints(0, 0, 92, 32)}
        fill="none"
        stroke={COLOR_SOURCES_CSS}
        strokeOpacity={0.3 * sourcesP + 0.06}
        strokeWidth={0.6}
      />

      {/* Substrate core — gold */}
      <circle
        cx={0}
        cy={0}
        r={48}
        fill="none"
        stroke={COLOR_SUBSTRATE_CSS}
        strokeOpacity={0.7 * substrateP}
        strokeWidth={1}
      />
      <polygon
        points={polygonPoints(0, 0, 48, 6)}
        fill="none"
        stroke={COLOR_SUBSTRATE_CSS}
        strokeOpacity={0.5 * substrateP}
        strokeWidth={0.7}
      />
      <polygon
        points={polygonPoints(0, 0, 30, 8)}
        fill="none"
        stroke={COLOR_SUBSTRATE_CSS}
        strokeOpacity={0.4 * substrateP}
        strokeWidth={0.6}
      />

      {/* Sources pips on the middle band */}
      {sourcePips(8, 101).map(([x, y], i) => (
        <polygon
          key={`src-${i}`}
          points={diamondAt(x, y, 4)}
          fill={COLOR_SOURCES_CSS}
          fillOpacity={0.9 * sourcesP}
        />
      ))}

      {/* Surfaces port diamonds on the outer shell */}
      {sourcePips(6, 160).map(([x, y], i) => (
        <g key={`srf-${i}`} opacity={surfacesP}>
          <polygon
            points={diamondAt(x, y, 5)}
            fill="none"
            stroke={COLOR_SURFACES_CSS}
            strokeOpacity={0.85}
            strokeWidth={0.7}
          />
          <polygon points={diamondAt(x, y, 2.5)} fill={COLOR_SURFACES_CSS} fillOpacity={0.95} />
        </g>
      ))}
    </svg>
  );
}

function polygonPoints(cx: number, cy: number, r: number, sides: number): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
  }
  return pts.join(" ");
}

function sourcePips(count: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.PI / count;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

function diamondAt(cx: number, cy: number, size: number): string {
  return [
    `${cx},${cy - size}`,
    `${cx + size},${cy}`,
    `${cx},${cy + size}`,
    `${cx - size},${cy}`,
  ].join(" ");
}

// ── Styles (scoped) ───────────────────────────────────────────────────

const styles = `
.ia-stage {
  position: fixed;
  inset: 0;
  background: var(--void, #0a0908);
  color: var(--dawn, #ebe3d6);
  font-family: var(--font-mono, "PT Mono", ui-monospace, monospace);
  overflow: hidden;
}

.ia-chrome {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ia-chrome > * { pointer-events: auto; }
.ia-corner, .ia-rail { pointer-events: none; }

.ia-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border: 1px solid var(--gold-40, rgba(202, 165, 84, 0.4));
}
.ia-corner--tl { top: 24px; left: 24px; border-right: none; border-bottom: none; }
.ia-corner--tr { top: 24px; right: 24px; border-left: none; border-bottom: none; }
.ia-corner--bl { bottom: 24px; left: 24px; border-right: none; border-top: none; }
.ia-corner--br { bottom: 24px; right: 24px; border-left: none; border-top: none; }

.ia-rail {
  position: absolute;
  top: 80px;
  bottom: 160px;
  width: 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 0;
}
.ia-rail--left { left: 24px; align-items: flex-start; padding-left: 18px; }
.ia-rail--right { right: 24px; align-items: flex-end; padding-right: 18px; }
.ia-rail__tick {
  width: 14px;
  height: 1px;
  background: var(--dawn-30, rgba(235, 227, 214, 0.3));
}
.ia-rail__tick[data-major] {
  width: 22px;
  background: var(--gold-40, rgba(202, 165, 84, 0.4));
}

.ia-header {
  position: absolute;
  top: 38px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.ia-header__code { color: var(--gold, #caa554); }
.ia-header__title { color: var(--dawn, #ebe3d6); }
.ia-header__build { color: var(--dawn-30, rgba(235, 227, 214, 0.3)); }

.ia-telemetry {
  position: absolute;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--gold, #caa554);
}
.ia-telemetry__code { color: var(--dawn-70, rgba(235, 227, 214, 0.7)); }
.ia-telemetry__sep { color: var(--gold, #caa554); font-size: 8px; }
.ia-telemetry__status { color: var(--gold, #caa554); }
.ia-telemetry__variant { color: var(--dawn-50, rgba(235, 227, 214, 0.5)); }

.ia-variants {
  position: absolute;
  top: 102px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}
.ia-variant {
  background: transparent;
  border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
  color: var(--dawn-50, rgba(235, 227, 214, 0.5));
  font-family: inherit;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 14px 8px 14px;
  cursor: pointer;
  transition: color 160ms, border-color 160ms, background 160ms;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 110px;
}
.ia-variant:hover {
  color: var(--gold, #caa554);
  border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
}
.ia-variant.is-on {
  color: var(--void, #0a0908);
  background: var(--gold, #caa554);
  border-color: var(--gold, #caa554);
}
.ia-variant__label { font-size: 10px; }
.ia-variant__sub {
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: none;
  opacity: 0.7;
}

.ia-canvas-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ia-loading {
  color: var(--gold-40, rgba(202, 165, 84, 0.4));
  font-size: 14px;
  letter-spacing: 0.4em;
}

.ia-fallback {
  width: min(560px, 80vw);
  height: auto;
  max-height: 70vh;
}

.ia-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ia-label {
  position: absolute;
  display: grid;
  grid-template-columns: auto auto 1fr;
  grid-template-areas:
    "pip ordinal title"
    ".   .       sub";
  gap: 2px 8px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dawn, #ebe3d6);
  transition: opacity 220ms ease-out;
  max-width: 200px;
}
.ia-label__pip {
  grid-area: pip;
  align-self: center;
  width: 8px;
  height: 8px;
  background: var(--label-color, var(--gold));
  transform: rotate(45deg);
  margin-top: 2px;
}
.ia-label__ordinal {
  grid-area: ordinal;
  align-self: center;
  font-size: 9px;
  color: var(--label-color, var(--gold));
  letter-spacing: 0.22em;
}
.ia-label__title {
  grid-area: title;
  align-self: center;
  font-size: 14px;
  color: var(--label-color, var(--gold));
  letter-spacing: 0.08em;
}
.ia-label__sub {
  grid-area: sub;
  font-size: 10px;
  color: var(--dawn-50, rgba(235, 227, 214, 0.5));
  letter-spacing: 0.06em;
  text-transform: none;
}
/* Three zones around the artifact's natural composition area.
   Mirroring the deck composition the same anchor points read across
   variants. */
.ia-label--sources { top: 38%; left: 6%; }
.ia-label--substrate { bottom: 26%; left: 50%; transform: translateX(-50%); text-align: center; }
.ia-label--substrate .ia-label__sub { text-align: center; }
.ia-label--surfaces { top: 38%; right: 6%; text-align: right; }
.ia-label--surfaces { grid-template-columns: 1fr auto auto; grid-template-areas: "title ordinal pip" "sub . ."; }

.ia-controls {
  position: absolute;
  left: 50%;
  bottom: 36px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: min(640px, 86vw);
  pointer-events: auto;
}
.ia-controls__tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.ia-tab {
  background: transparent;
  border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
  color: var(--dawn-50, rgba(235, 227, 214, 0.5));
  font-family: inherit;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 160ms, border-color 160ms, background 160ms;
}
.ia-tab:hover {
  color: var(--gold, #caa554);
  border-color: var(--gold-40, rgba(202, 165, 84, 0.4));
}
.ia-tab.is-on {
  color: var(--void, #0a0908);
  background: var(--gold, #caa554);
  border-color: var(--gold, #caa554);
}

.ia-scrub {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 2px;
  background: var(--dawn-15, rgba(235, 227, 214, 0.15));
  outline: none;
  cursor: pointer;
}
.ia-scrub::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  background: var(--gold, #caa554);
  border: 0;
  transform: rotate(45deg);
  cursor: pointer;
}
.ia-scrub::-moz-range-thumb {
  width: 10px;
  height: 10px;
  background: var(--gold, #caa554);
  border: 0;
  cursor: pointer;
  transform: rotate(45deg);
}

.ia-controls__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dawn-30, rgba(235, 227, 214, 0.3));
}
.ia-auto {
  background: transparent;
  border: 1px solid var(--gold-40, rgba(202, 165, 84, 0.4));
  color: var(--gold, #caa554);
  font-family: inherit;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 160ms;
}
.ia-auto.is-on { background: var(--gold-15, rgba(202, 165, 84, 0.15)); }
.ia-controls__hint { flex: 1; text-align: center; }
.ia-controls__readout {
  color: var(--gold, #caa554);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 760px) {
  .ia-rail { display: none; }
  .ia-variants { top: 96px; }
  .ia-variant { min-width: 84px; padding: 4px 8px 6px 8px; }
  .ia-variant__sub { display: none; }
  .ia-label--sources { top: auto; bottom: 36%; left: 6%; max-width: 140px; }
  .ia-label--surfaces { top: auto; bottom: 36%; right: 6%; max-width: 140px; }
  .ia-label--substrate { bottom: 22%; }
  .ia-header__build { display: none; }
}
`;
