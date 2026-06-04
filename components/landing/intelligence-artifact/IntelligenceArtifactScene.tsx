"use client";

/**
 * IntelligenceArtifactScene — the lab-page shell around the artifact:
 *
 *   - Canvas wrapper with camera + WebGL settings.
 *   - Capability gate: probes WebGL on mount, listens to
 *     `prefers-reduced-motion`, and degrades gracefully when either
 *     fails (or when the viewport is too narrow for the 3D composition
 *     to read).
 *   - Scrub slider, phase tabs, and an autoplay toggle so the reveal
 *     can be inspected without wiring real scroll input.
 *   - HUD-style chrome: corner brackets, station readout, phase
 *     labels at the resolved view.
 *
 * This page is mounted at `/test/intelligence-artifact` and stays
 * inside the existing `(internal)` group so production traffic never
 * reaches it (middleware blocks `/test/*` in production).
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { probeWebGL } from "@/lib/webgl/probe";
import { IntelligenceArtifact } from "./IntelligenceArtifact";
import {
  ARTIFACT_LABELS,
  CAMERA_FOV,
  CAMERA_LOOK_AT,
  CAMERA_POSITION,
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

  // ── Progress (slider, tabs, autoplay, wheel) ────────────────────
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

  // Wheel scrub: hold the wheel over the stage to scrub through the
  // phases. Disabled while autoplay is on.
  useEffect(() => {
    if (autoplay) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setProgress((prev) => clamp01(prev + e.deltaY * 0.0008));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [autoplay]);

  const handleTabClick = useCallback(
    (p: number) => {
      setAutoplay(false);
      setProgress(p);
    },
    [setAutoplay, setProgress]
  );

  // ── Phase labels (resolved view) ────────────────────────────────
  const resolvedP = phasePresence(progress, PHASES.resolved);
  const sourcesP = phasePresence(progress, PHASES.sources);
  const substrateP = phasePresence(progress, PHASES.substrate);
  const surfacesP = phasePresence(progress, PHASES.surfaces);

  const labelOpacity = useMemo(
    () => ({
      sources: sourcesP * smoothstep(0.55, 0.88, progress),
      substrate: substrateP * smoothstep(0.55, 0.88, progress),
      surfaces: surfacesP * smoothstep(0.6, 0.92, progress),
    }),
    [progress, sourcesP, substrateP, surfacesP]
  );

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
          <span className="ia-header__build">v0.1 · /test/intelligence-artifact</span>
        </header>

        <div className="ia-telemetry">
          <span className="ia-telemetry__code">{telemetry.code}</span>
          <span className="ia-telemetry__sep" aria-hidden>
            ◆
          </span>
          <span className="ia-telemetry__status">{telemetry.status}</span>
        </div>
      </div>

      <div className="ia-canvas-wrap">
        {useStaticFallback ? (
          <StaticArtifactFallback progress={progress} />
        ) : webglOk === null ? (
          <div className="ia-loading" aria-hidden>
            <span>· · · · ·</span>
          </div>
        ) : (
          <Canvas
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
            <IntelligenceArtifact progress={progress} reducedMotion={reducedMotion} />
          </Canvas>
        )}

        {/* Resolved-view labels — show only when the artifact is fully
            built. Three short callouts, not a card grid. */}
        <div className="ia-labels" aria-hidden={resolvedP < 0.5}>
          <div className="ia-label ia-label--sources" style={{ opacity: labelOpacity.sources }}>
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[0].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[0].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[0].sub}</span>
          </div>
          <div className="ia-label ia-label--substrate" style={{ opacity: labelOpacity.substrate }}>
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[1].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[1].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[1].sub}</span>
          </div>
          <div className="ia-label ia-label--surfaces" style={{ opacity: labelOpacity.surfaces }}>
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
}

/** SVG-only schematic shown when WebGL is unavailable or the device is
 *  flagged reduced-motion + mobile. Same semantic layers (sources →
 *  substrate → surfaces) at rest. Reveals are still progress-driven so
 *  the scrubber stays useful on the fallback. */
function StaticArtifactFallback({ progress }: StaticFallbackProps) {
  const sourcesP = phasePresence(progress, PHASES.sources);
  const substrateP = phasePresence(progress, PHASES.substrate);
  const surfacesP = phasePresence(progress, PHASES.surfaces);

  return (
    <svg
      className="ia-fallback"
      viewBox="-200 -160 400 320"
      role="img"
      aria-label="Intelligence layer artifact (static schematic)"
    >
      {/* Deck */}
      <polygon
        points={polygonPoints(0, 0, 160, 12)}
        fill="none"
        stroke="#caa554"
        strokeOpacity={0.55}
        strokeWidth={0.8}
      />
      <polygon
        points={polygonPoints(0, 0, 120, 12)}
        fill="none"
        stroke="#ebe3d6"
        strokeOpacity={0.3}
        strokeWidth={0.7}
      />
      <polygon
        points={polygonPoints(0, 0, 80, 24)}
        fill="none"
        stroke="#caa554"
        strokeOpacity={0.5}
        strokeWidth={0.7}
      />

      {/* Substrate */}
      <circle
        cx={0}
        cy={0}
        r={40}
        fill="none"
        stroke="#caa554"
        strokeOpacity={0.6 * substrateP}
        strokeWidth={0.9}
      />
      <polygon
        points={polygonPoints(0, 0, 40, 6)}
        fill="none"
        stroke="#caa554"
        strokeOpacity={0.45 * substrateP}
        strokeWidth={0.7}
      />
      <polygon
        points={polygonPoints(0, 0, 25, 8)}
        fill="none"
        stroke="#ebe3d6"
        strokeOpacity={0.35 * substrateP}
        strokeWidth={0.6}
      />

      {/* Sources */}
      {sourcePips(8).map(([x, y], i) => (
        <g key={`src-${i}`} opacity={sourcesP}>
          <line
            x1={x}
            y1={y}
            x2={x * 0.75}
            y2={y * 0.75}
            stroke="#caa554"
            strokeOpacity={0.65}
            strokeWidth={0.7}
          />
          <polygon points={diamondAt(x, y, 4)} fill="#caa554" fillOpacity={0.85} />
        </g>
      ))}

      {/* Surfaces */}
      {sourcePips(6).map(([x, y], i) => (
        <g key={`srf-${i}`} opacity={surfacesP}>
          <polygon
            points={diamondAt(x * 0.83, y * 0.83, 4.5)}
            fill="none"
            stroke="#caa554"
            strokeOpacity={0.85}
            strokeWidth={0.8}
          />
          <polygon points={diamondAt(x * 0.83, y * 0.83, 2.4)} fill="#e9c97a" fillOpacity={0.9} />
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

function sourcePips(count: number): Array<[number, number]> {
  const r = 160;
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
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dawn, #ebe3d6);
  transition: opacity 220ms ease-out;
  max-width: 180px;
}
.ia-label__ordinal {
  font-size: 9px;
  color: var(--gold, #caa554);
  letter-spacing: 0.22em;
}
.ia-label__title {
  font-size: 14px;
  color: var(--gold, #caa554);
  letter-spacing: 0.08em;
}
.ia-label__sub {
  font-size: 10px;
  color: var(--dawn-50, rgba(235, 227, 214, 0.5));
  letter-spacing: 0.06em;
  text-transform: none;
}
.ia-label--sources { top: 36%; left: 8%; }
.ia-label--substrate { bottom: 28%; left: 50%; transform: translateX(-50%); text-align: center; align-items: center; }
.ia-label--surfaces { top: 36%; right: 8%; text-align: right; align-items: flex-end; }

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
  .ia-label--sources { top: auto; bottom: 36%; left: 6%; max-width: 140px; }
  .ia-label--surfaces { top: auto; bottom: 36%; right: 6%; max-width: 140px; }
  .ia-label--substrate { bottom: 22%; }
  .ia-header__build { display: none; }
}
`;
