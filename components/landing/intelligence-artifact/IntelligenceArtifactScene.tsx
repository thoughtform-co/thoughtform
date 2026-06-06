"use client";

/**
 * IntelligenceArtifactScene — the lab-page shell around the artifact.
 *
 *   - Canvas wrapper with camera + WebGL settings.
 *   - Capability gate: probes WebGL on mount, listens to
 *     `prefers-reduced-motion`, and degrades gracefully when either
 *     fails (or when the viewport is too narrow for the 3D composition
 *     to read).
 *   - Variant switcher: toggles between six structural metaphors
 *     (Armillary / Shell / Orbital / Strata / Funnel / Constellation).
 *     Wraps to a second row on narrow viewports.
 *   - Scrub slider, phase tabs, autoplay.
 *   - Leader-line labels: three role labels (Sources / Substrate /
 *     Surfaces) anchored to fixed slots in the chrome with hairline
 *     SVG leaders that connect each label to a point inside the
 *     artifact geometry. `AnchorProjector` (mounted inside each
 *     variant) updates the geometry-end of each leader every frame.
 *
 * Internal-only: production blocks `/test/*` via `middleware.ts`.
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import { probeWebGL } from "@/lib/webgl/probe";
import { IntelligenceArtifact } from "./IntelligenceArtifact";
import {
  APERTURE_WINDOWS,
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

const VARIANT_GROUPS = [
  {
    label: "Core studies",
    items: ARTIFACT_VARIANTS.filter((v) => !v.key.startsWith("corridor-")),
  },
  {
    label: "Home shells",
    items: ARTIFACT_VARIANTS.filter((v) => v.key.startsWith("corridor-")),
  },
] as const;

/** Cycle length when autoplay is on (seconds for a single 0 → 1 sweep). */
const AUTOPLAY_DURATION_SEC = 14;

/** Pixel offsets for the leader line's label-end relative to the
 *  label box. Each entry picks the side of the box that faces the
 *  centre of the canvas, so the line emerges from the label edge
 *  pointing toward the artifact. */
const LABEL_CONNECTION_SIDE: Record<
  "sources" | "substrate" | "surfaces",
  "left" | "right" | "top" | "bottom"
> = {
  sources: "right", // sources sits on the left, line goes right
  substrate: "top", // substrate sits at bottom, line goes up
  surfaces: "left", // surfaces sits on the right, line goes left
};

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

  // ── Phase scalars / opacities ───────────────────────────────────
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

  // ── Leader line / label slot bookkeeping ───────────────────────
  // Each role label sits at a fixed slot in the chrome. We compute
  // the label-end of its leader line once per layout (mount, resize,
  // variant change) by reading the label's bounding rect and picking
  // a connection side. AnchorProjector updates the geometry-end
  // (`x1`/`y1`) of each line every frame.
  const wrapRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const leaderLineRefs = useRef<Record<string, SVGLineElement | null>>({});

  const recomputeLabelEnds = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();

    for (const role of ["sources", "substrate", "surfaces"] as const) {
      const labelEl = labelRefs.current[role];
      const line = leaderLineRefs.current[role];
      if (!labelEl || !line) continue;
      const r = labelEl.getBoundingClientRect();
      const side = LABEL_CONNECTION_SIDE[role];
      let x2: number;
      let y2: number;
      if (side === "left") {
        x2 = r.left - wrapRect.left;
        y2 = r.top - wrapRect.top + r.height / 2;
      } else if (side === "right") {
        x2 = r.right - wrapRect.left;
        y2 = r.top - wrapRect.top + r.height / 2;
      } else if (side === "top") {
        x2 = r.left - wrapRect.left + r.width / 2;
        y2 = r.top - wrapRect.top;
      } else {
        x2 = r.left - wrapRect.left + r.width / 2;
        y2 = r.bottom - wrapRect.top;
      }
      line.setAttribute("x2", x2.toFixed(1));
      line.setAttribute("y2", y2.toFixed(1));
    }
  }, []);

  useLayoutEffect(() => {
    recomputeLabelEnds();
    const onResize = () => recomputeLabelEnds();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [recomputeLabelEnds, variant]);

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
          <span className="ia-header__build">v0.3 · /test/intelligence-artifact</span>
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

        <aside className="ia-variants" aria-label="Artifact variant groups">
          <span className="ia-variants__eyebrow">Variant map</span>
          {VARIANT_GROUPS.map((group) => (
            <div key={group.label} className="ia-variant-group">
              <span className="ia-variant-group__label">{group.label}</span>
              <div className="ia-variant-group__items" role="tablist" aria-label={group.label}>
                {group.items.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    role="tab"
                    aria-selected={v.key === variant}
                    className={`ia-variant${v.key === variant ? " is-on" : ""}`}
                    onClick={() => setVariant(v.key)}
                    title={v.sub}
                  >
                    <span className="ia-variant__label">{v.label.replace("Home · ", "")}</span>
                    <span className="ia-variant__sub">{v.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>
      </div>

      <div className="ia-canvas-wrap" ref={wrapRef}>
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
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
              pointerEvents: "none",
            }}
          >
            <IntelligenceArtifact
              progress={progress}
              reducedMotion={reducedMotion}
              variant={variant}
            />
          </Canvas>
        )}

        {/* Leader-line overlay. Three SVG lines, one per role. The
            geometry-end (x1/y1) is updated each frame by
            `AnchorProjector` inside the active variant. The label-end
            (x2/y2) is updated on mount + resize from the label box's
            position. The overlay is non-interactive. */}
        <svg className="ia-leaders" aria-hidden>
          <line
            className="ia-leader ia-leader--sources"
            ref={(el) => {
              leaderLineRefs.current.sources = el;
            }}
            x1="0"
            y1="0"
            x2="0"
            y2="0"
            style={{ stroke: COLOR_SOURCES_CSS, opacity: labelOpacity.sources }}
          />
          <line
            className="ia-leader ia-leader--substrate"
            ref={(el) => {
              leaderLineRefs.current.substrate = el;
            }}
            x1="0"
            y1="0"
            x2="0"
            y2="0"
            style={{ stroke: COLOR_SUBSTRATE_CSS, opacity: labelOpacity.substrate }}
          />
          <line
            className="ia-leader ia-leader--surfaces"
            ref={(el) => {
              leaderLineRefs.current.surfaces = el;
            }}
            x1="0"
            y1="0"
            x2="0"
            y2="0"
            style={{ stroke: COLOR_SURFACES_CSS, opacity: labelOpacity.surfaces }}
          />
        </svg>

        {/* Label boxes at fixed chrome slots. Diamond pips on each
            label face the artifact centre — the leader line attaches
            at this side. */}
        <div className="ia-labels">
          <div
            ref={(el) => {
              labelRefs.current.sources = el;
            }}
            className="ia-label ia-label--sources"
            style={
              {
                opacity: labelOpacity.sources,
                "--label-color": COLOR_SOURCES_CSS,
              } as React.CSSProperties
            }
          >
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[0].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[0].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[0].sub}</span>
            <span className="ia-label__pip ia-label__pip--right" aria-hidden />
          </div>
          <div
            ref={(el) => {
              labelRefs.current.substrate = el;
            }}
            className="ia-label ia-label--substrate"
            style={
              {
                opacity: labelOpacity.substrate,
                "--label-color": COLOR_SUBSTRATE_CSS,
              } as React.CSSProperties
            }
          >
            <span className="ia-label__pip ia-label__pip--top" aria-hidden />
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[1].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[1].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[1].sub}</span>
          </div>
          <div
            ref={(el) => {
              labelRefs.current.surfaces = el;
            }}
            className="ia-label ia-label--surfaces"
            style={
              {
                opacity: labelOpacity.surfaces,
                "--label-color": COLOR_SURFACES_CSS,
              } as React.CSSProperties
            }
          >
            <span className="ia-label__pip ia-label__pip--left" aria-hidden />
            <span className="ia-label__ordinal">{ARTIFACT_LABELS[2].ordinal}</span>
            <span className="ia-label__title">{ARTIFACT_LABELS[2].title}</span>
            <span className="ia-label__sub">{ARTIFACT_LABELS[2].sub}</span>
          </div>
        </div>

        {/* Aperture variant: per-facet interface window badges.
            Rendered for every variant but only positioned by the
            Aperture variant's R3F useFrame (the badges sit invisibly
            in the corner otherwise). The variant queries each via
            `[data-aperture-window]` and writes left/top/opacity. */}
        {variant === "aperture" && (
          <div className="ia-windows" aria-hidden>
            {APERTURE_WINDOWS.map((w) => (
              <div
                key={w.id}
                data-aperture-window={w.id}
                className="ia-window"
                style={{ "--label-color": COLOR_SURFACES_CSS } as React.CSSProperties}
              >
                {w.label}
              </div>
            ))}
          </div>
        )}
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

function StaticArtifactFallback({ progress, variant }: StaticFallbackProps) {
  const sourcesP = phasePresence(progress, PHASES.sources);
  const substrateP = phasePresence(progress, PHASES.substrate);
  const surfacesP = phasePresence(progress, PHASES.surfaces);

  return (
    <svg
      className="ia-fallback"
      viewBox="-200 -160 400 320"
      role="img"
      aria-label={`Intelligence layer artifact (static schematic: ${variant})`}
    >
      <polygon
        points={polygonPoints(0, 0, 160, variant === "armillary" ? 12 : 24)}
        fill="none"
        stroke={COLOR_SURFACES_CSS}
        strokeOpacity={0.45 * surfacesP + 0.15}
        strokeWidth={0.8}
      />
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
      {sourcePips(8, 101).map(([x, y], i) => (
        <polygon
          key={`src-${i}`}
          points={diamondAt(x, y, 4)}
          fill={COLOR_SOURCES_CSS}
          fillOpacity={0.9 * sourcesP}
        />
      ))}
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
  top: 118px;
  left: 84px;
  width: 168px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 264px);
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--dawn-10, rgba(235, 227, 214, 0.1));
  background:
    linear-gradient(180deg, rgba(10, 9, 8, 0.68), rgba(10, 9, 8, 0.42)),
    rgba(10, 9, 8, 0.38);
  backdrop-filter: blur(6px);
  scrollbar-width: thin;
  scrollbar-color: var(--gold-30, rgba(202, 165, 84, 0.3)) transparent;
}
.ia-variants__eyebrow {
  color: var(--gold, #caa554);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.ia-variant-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.ia-variant-group__label {
  color: var(--dawn-30, rgba(235, 227, 214, 0.3));
  font-size: 8px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.ia-variant-group__items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ia-variant {
  background: transparent;
  border: 1px solid var(--dawn-15, rgba(235, 227, 214, 0.15));
  color: var(--dawn-50, rgba(235, 227, 214, 0.5));
  font-family: inherit;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 5px 7px 6px 7px;
  cursor: pointer;
  transition: color 160ms, border-color 160ms, background 160ms;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  text-align: left;
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
.ia-variant__label { font-size: 9px; }
.ia-variant__sub {
  font-size: 7px;
  letter-spacing: 0.08em;
  text-transform: none;
  opacity: 0.7;
  line-height: 1.15;
}

.ia-canvas-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Pass clicks through to the chrome variant switcher beneath. */
  pointer-events: none;
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

/* Leader-line SVG overlay. Sits above the canvas, below the labels.
   The line endpoints are updated imperatively (x1/y1 from
   AnchorProjector, x2/y2 from useLayoutEffect). */
.ia-leaders {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}
.ia-leader {
  stroke-width: 1;
  stroke-dasharray: 4 3;
  fill: none;
  transition: opacity 220ms ease-out;
}

.ia-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ia-label {
  position: absolute;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "ordinal title"
    ".       sub";
  gap: 2px 8px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dawn, #ebe3d6);
  transition: opacity 220ms ease-out;
  max-width: 180px;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--label-color) 35%, transparent);
  background: rgba(10, 9, 8, 0.55);
  backdrop-filter: blur(4px);
}
.ia-label__pip {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--label-color, var(--gold));
  transform: rotate(45deg);
}
.ia-label__pip--right { right: -3px; top: 50%; margin-top: -3px; }
.ia-label__pip--left { left: -3px; top: 50%; margin-top: -3px; }
.ia-label__pip--top { left: 50%; top: -3px; margin-left: -3px; }
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
  font-size: 13px;
  color: var(--label-color, var(--gold));
  letter-spacing: 0.08em;
}
.ia-label__sub {
  grid-area: sub;
  font-size: 9px;
  color: var(--dawn-50, rgba(235, 227, 214, 0.5));
  letter-spacing: 0.06em;
  text-transform: none;
}
/* Three fixed slots. Sources sits on the left, Surfaces on the right,
   Substrate at the bottom. The leader line connects each label to a
   visible point inside the artifact. */
/* Aperture interface window badges. Floating mono-uppercase chips
   that the Aperture variant projects onto each highlighted facet. */
.ia-windows {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.ia-window {
  position: absolute;
  left: -200px;
  top: -200px;
  transform: translate(-50%, -50%);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--label-color, var(--dawn));
  background: rgba(10, 9, 8, 0.7);
  border: 1px solid color-mix(in srgb, var(--label-color) 40%, transparent);
  padding: 3px 8px;
  white-space: nowrap;
  transition: opacity 220ms ease-out;
  opacity: 0;
}

.ia-label--sources { top: 38%; left: 64px; }
.ia-label--substrate {
  /* Clear of the phase-tabs row + scrubber row at the bottom of the
     viewport (controls sit at bottom: 36px and stack ~108px tall). */
  bottom: 168px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  grid-template-areas: "ordinal title" ". sub";
}
.ia-label--surfaces { top: 38%; right: 64px; text-align: right; grid-template-areas: "title ordinal" "sub ."; grid-template-columns: 1fr auto; }

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
  .ia-variants {
    top: 92px;
    left: 50%;
    width: min(92vw, 520px);
    max-height: 132px;
    transform: translateX(-50%);
    flex-direction: row;
    align-items: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .ia-variant-group {
    min-width: 180px;
  }
  .ia-variant { padding: 4px 8px 5px 8px; }
  .ia-variant__sub { display: none; }
  .ia-label { max-width: 130px; padding: 4px 8px; font-size: 10px; }
  .ia-label__title { font-size: 11px; }
  .ia-label--sources { top: auto; bottom: 36%; left: 16px; }
  .ia-label--surfaces { top: auto; bottom: 36%; right: 16px; }
  .ia-label--substrate { bottom: 22%; }
  .ia-header__build { display: none; }
}
`;
