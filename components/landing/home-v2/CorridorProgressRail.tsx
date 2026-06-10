"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * CorridorProgressRail — persistent HUD breadcrumb for the Navigate →
 * Encode → Build flywheel.
 *
 * A single fixed element on the top HUD frame line (the same chrome the
 * left/right depth rails belong to). It is NOT a per-station eyebrow:
 * it stays put through the whole corridor and APPENDS each stage as the
 * camera arrives at it, so the read is the progression itself —
 *
 *   NAVIGATE              (entering the flywheel)
 *   NAVIGATE ◆ ENCODE     (arrived at Encode)
 *   NAVIGATE ◆ ENCODE ◆ BUILD
 *
 * The current stage is lit gold; stages already passed stay on the
 * trail, dimmed. Every value is scrubbed off the corridor's
 * `paintProgress`, so the trail grows on the way down and recedes on
 * the way up in lock-step with scroll — no time-based tween that could
 * desync from the wheel. The whole rail rides the corridor's
 * engagement and leaves on the epilogue `BUILD_OUT` band with the
 * Build chapter, before the "billions" title claims top-centre.
 *
 * Desktop-only, mirroring `CorridorStationHeaders` (mobile uses the
 * world-anchored straddle in `CopyAnchors`).
 */

interface Stage {
  key: "navigate" | "encode" | "build";
  label: string;
  /** Reveal band in `paintProgress` — where this stage appends. Tuned
   *  to land just before each station's title types in (Navigate park
   *  ≈0.40, Encode ≈0.636, Build ≈0.923). */
  band: readonly [number, number];
  /** Whether a leading diamond divider appends with this stage. The
   *  first stage has none. */
  divider: boolean;
}

const STAGES: readonly Stage[] = [
  { key: "navigate", label: "Navigate", band: [0.2, 0.32], divider: false },
  { key: "encode", label: "Encode", band: [0.48, 0.6], divider: true },
  { key: "build", label: "Build", band: [0.78, 0.9], divider: true },
];

/** Color the trail lerps between: a dim warm grey for visited stages
 *  and gold for the active one. Opaque endpoints so the lerp never
 *  fights an alpha channel. */
const VISITED_RGB: readonly [number, number, number] = [150, 143, 128];
const ACTIVE_RGB: readonly [number, number, number] = [202, 165, 84];

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function mixChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

interface UnitRefs {
  unit: HTMLSpanElement | null;
  label: HTMLSpanElement | null;
  /** Full natural width of the unit (divider + label) once laid out,
   *  cached so the per-frame grow can map reveal 0..1 → 0..width
   *  without a layout read inside the rAF loop. */
  width: number;
}

export function CorridorProgressRail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const unitsRef = useRef<Record<Stage["key"], UnitRefs>>({
    navigate: { unit: null, label: null, width: 0 },
    encode: { unit: null, label: null, width: 0 },
    build: { unit: null, label: null, width: 0 },
  });

  // Last-written values, to suppress redundant DOM writes on frames
  // where the scrub didn't move enough to change a pixel.
  const last = useRef<{
    container: number;
    reveal: Record<Stage["key"], number>;
    active: Record<Stage["key"], number>;
  } | null>(null);

  // Measure each unit's natural width once laid out, and re-measure on
  // resize / font load. Runs in a layout effect so the first paint
  // already has correct widths (units start clipped at max-width: 0 via
  // CSS, so there is no full-width flash before the rAF loop engages).
  useLayoutEffect(() => {
    const measure = () => {
      for (const stage of STAGES) {
        const refs = unitsRef.current[stage.key];
        const el = refs.unit;
        if (!el) continue;
        const prev = el.style.maxWidth;
        el.style.maxWidth = "none";
        refs.width = el.scrollWidth;
        el.style.maxWidth = prev || "0px";
      }
    };
    measure();
    window.addEventListener("resize", measure);
    // Fonts can land after first layout and shift the widths; re-measure
    // once they're ready so the grow maps to the final glyph metrics.
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready?.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const engaged = t.active || t.armed;
      const p = engaged ? t.paintProgress : 0;

      // The rail leaves with the Build chapter: as the epilogue's
      // BUILD_OUT band runs, fade the whole trail out before the
      // "billions" title rises into top-centre.
      const buildOut = epilogueBand(t.epilogueProgress, "BUILD_OUT");
      const containerOpacity = engaged ? Math.max(0, 1 - buildOut) : 0;

      // Per-stage reveal (append) + active (current-stage highlight).
      // A stage is active once it has appended and until the NEXT stage
      // appends; the last stage stays active to the end of the corridor.
      const revNav = smoothstep(STAGES[0].band[0], STAGES[0].band[1], p);
      const revEnc = smoothstep(STAGES[1].band[0], STAGES[1].band[1], p);
      const revBld = smoothstep(STAGES[2].band[0], STAGES[2].band[1], p);
      const reveal = { navigate: revNav, encode: revEnc, build: revBld };
      const active = {
        navigate: revNav * (1 - revEnc),
        encode: revEnc * (1 - revBld),
        build: revBld,
      };

      const prev = last.current;
      const containerChanged = !prev || Math.abs(prev.container - containerOpacity) > 0.002;
      if (containerChanged && containerRef.current) {
        containerRef.current.style.opacity = containerOpacity.toFixed(3);
      }

      for (const stage of STAGES) {
        const refs = unitsRef.current[stage.key];
        if (!refs.unit) continue;
        const rev = reveal[stage.key];
        const act = active[stage.key];
        const revChanged = !prev || Math.abs(prev.reveal[stage.key] - rev) > 0.002;
        const actChanged = !prev || Math.abs(prev.active[stage.key] - act) > 0.002;

        if (revChanged) {
          // Width grows from 0 → natural (the append); opacity leads the
          // grow slightly so glyphs aren't faint while the box widens.
          const width = refs.width || 200;
          refs.unit.style.maxWidth = `${(rev * width).toFixed(1)}px`;
          refs.unit.style.opacity = Math.min(1, rev * 1.5).toFixed(3);
        }
        if (actChanged) {
          const r = mixChannel(VISITED_RGB[0], ACTIVE_RGB[0], act);
          const g = mixChannel(VISITED_RGB[1], ACTIVE_RGB[1], act);
          const b = mixChannel(VISITED_RGB[2], ACTIVE_RGB[2], act);
          refs.unit.style.color = `rgb(${r}, ${g}, ${b})`;
          if (refs.label) {
            refs.label.style.textShadow =
              act > 0.01
                ? `0 0 ${(10 * act).toFixed(1)}px rgba(202, 165, 84, ${(0.5 * act).toFixed(3)})`
                : "none";
          }
        }
      }

      if (containerChanged || !prev) {
        last.current = { container: containerOpacity, reveal, active };
      } else {
        last.current = { ...last.current, reveal, active };
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setUnit = (key: Stage["key"]) => (el: HTMLSpanElement | null) => {
    unitsRef.current[key].unit = el;
  };
  const setLabel = (key: Stage["key"]) => (el: HTMLSpanElement | null) => {
    unitsRef.current[key].label = el;
  };

  return (
    <div ref={containerRef} className="home-v2-progress-rail" aria-hidden="true">
      {STAGES.map((stage) => (
        <span key={stage.key} ref={setUnit(stage.key)} className="home-v2-progress-rail__unit">
          {stage.divider && <span className="home-v2-progress-rail__div" aria-hidden="true" />}
          <span ref={setLabel(stage.key)} className="home-v2-progress-rail__label">
            {stage.label}
          </span>
        </span>
      ))}
    </div>
  );
}
