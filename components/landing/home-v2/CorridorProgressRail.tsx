"use client";

import { useEffect, useRef } from "react";
import { epilogueBand } from "@/lib/home-v2/epilogueTimeline";
import { overlayToggleOpacity, resolveOverlayAuto } from "@/lib/home-v2/corridorReveals";
import { useCorridorOverlayStore } from "@/lib/stores/corridorOverlayStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";

/**
 * CorridorProgressRail — the Arc's right-rail register.
 *
 * The Navigate → Encode → Build flywheel, shown on the RIGHT HUD rail as
 * a vertical register — deliberately uniform with the Services
 * (`SOURCE BUS`) and Products (`TOOL UNITS`) registers, so each pillar
 * reads the same way: the pillar name on the left rolodex, its sub-items
 * on the right rail (owner, 2026-07-13; this replaced the old
 * top-centre breadcrumb).
 *
 * Three fixed rows (Navigate / Encode / Build) seat on the rail guide at
 * the register's row datums. The row for the current stage is lit gold
 * with a filled marker; the others stay dim. The active stage is a pure
 * read of the corridor's `paintProgress` (the same clock the old
 * breadcrumb scrubbed) — no time-based tween that could desync from the
 * wheel. The whole register fades in as the Arc's Navigate stage lands
 * and leaves on the epilogue `BUILD_OUT` band with the Build chapter,
 * before the "billions" title claims the frame.
 *
 * Desktop-only, matching the right-rail register's capability gate (the
 * mobile composition uses the world-anchored straddle in `CopyAnchors`).
 */

interface Stage {
  key: "navigate" | "encode" | "build";
  label: string;
  /** Where this stage becomes the active row, in `paintProgress`
   *  (Navigate park ≈0.40, Encode ≈0.636, Build ≈0.923 — the band start
   *  is the hand-off point). */
  band: readonly [number, number];
}

const STAGES: readonly Stage[] = [
  { key: "navigate", label: "Navigate", band: [0.2, 0.32] },
  { key: "encode", label: "Encode", band: [0.48, 0.6] },
  { key: "build", label: "Build", band: [0.78, 0.9] },
];

/** Row datums on the rail guide. The register now hangs off mid-rail
 *  (50%) at the shared `--rail-register-pitch` step — the middle stage
 *  (Encode) sits on the same centre line as the left rolodex's centred
 *  active pillar, so the two rails read as a matched pair, and the three
 *  stages form one tight block instead of the old airy 8.334%vh gauge.
 *  Kept uniform with the Services/Products register (same token). */
const ROW_TOPS = [
  "calc(50% - var(--rail-register-pitch, 30px))",
  "50%",
  "calc(50% + var(--rail-register-pitch, 30px))",
] as const;

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function CorridorProgressRail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const rowsRef = useRef<Record<Stage["key"], HTMLDivElement | null>>({
    navigate: null,
    encode: null,
    build: null,
  });

  // Armed drives `aria-pressed` — a re-render here is fine (the rAF effect
  // has stable [] deps and never restarts).
  const armed = useCorridorOverlayStore((s) => s.armed);

  // Last-written values, to suppress redundant DOM writes on frames where
  // the scrub didn't move enough to change anything.
  const last = useRef<{ opacity: number; active: Stage["key"] | null; toggleOp: number } | null>(
    null
  );

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = useDepthGatewayStore.getState().transform;
      const engaged = t.active || t.armed;
      const p = engaged ? t.paintProgress : 0;

      // Fade in as the Arc's Navigate stage lands (so the register does
      // NOT show during the thesis), and leave with the Build chapter as
      // the epilogue's BUILD_OUT band runs.
      const buildOut = epilogueBand(t.epilogueProgress, "BUILD_OUT");
      const opacity = engaged ? smoothstep(0.14, 0.22, p) * Math.max(0, 1 - buildOut) : 0;

      // Active stage — the last one whose hand-off point has passed.
      let active: Stage["key"] | null = null;
      if (p >= STAGES[2].band[0]) active = "build";
      else if (p >= STAGES[1].band[0]) active = "encode";
      else if (p >= STAGES[0].band[0]) active = "navigate";

      // Overlay toggle — visible Encode→Build (ADR-032 U1), read-only.
      const toggleOp = overlayToggleOpacity(t.paintProgress, t.epilogueProgress, engaged);

      // Auto-collapse the armed overlays on stage-band exit / epilogue /
      // disengage (write-on-change only — the action booleans + a current-
      // state guard keep this from firing every frame).
      const ov = useCorridorOverlayStore.getState();
      const auto = resolveOverlayAuto(
        ov.expandedCardinal !== null,
        ov.expandedSurface,
        t.paintProgress,
        t.epilogueProgress,
        engaged
      );
      if (auto.reset) {
        if (ov.armed || ov.expandedCardinal !== null || ov.expandedSurface) ov.reset();
      } else if (auto.collapseCardinal || auto.collapseSurface) {
        ov.collapseExpanded();
      }

      const prev = last.current;
      if (!prev || Math.abs(prev.opacity - opacity) > 0.002) {
        if (containerRef.current) containerRef.current.style.opacity = opacity.toFixed(3);
      }
      if (!prev || Math.abs(prev.toggleOp - toggleOp) > 0.002) {
        if (toggleRef.current) {
          toggleRef.current.style.opacity = toggleOp.toFixed(3);
          toggleRef.current.toggleAttribute("data-live", toggleOp > 0.35);
        }
      }
      if (!prev || prev.active !== active) {
        for (const stage of STAGES) {
          rowsRef.current[stage.key]?.toggleAttribute("data-active", stage.key === active);
        }
      }
      last.current = { opacity, active, toggleOp };
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setRow = (key: Stage["key"]) => (el: HTMLDivElement | null) => {
    rowsRef.current[key] = el;
  };

  return (
    <>
      <div ref={containerRef} className="home-v2-progress-rail" aria-hidden="true">
        <span className="home-v2-progress-rail__heading">THE ARC · 03</span>
        {STAGES.map((stage, i) => (
          <div
            key={stage.key}
            ref={setRow(stage.key)}
            className="home-v2-progress-rail__row"
            style={{ top: ROW_TOPS[i] }}
          >
            <i className="home-v2-progress-rail__marker" aria-hidden="true" />
            <span className="home-v2-progress-rail__index">{String(i + 1).padStart(2, "0")}</span>
            <span className="home-v2-progress-rail__name">{stage.label}</span>
          </div>
        ))}
      </div>

      {/* Detail overlay toggle (ADR-032 U1) — new rail surface below the
          Build row (the register block above is pinned by ADR-031 U8).
          Arms the Encode / Build diegetic overlays. */}
      <button
        ref={toggleRef}
        type="button"
        className="home-v2-overlay-toggle"
        aria-pressed={armed}
        aria-label="Toggle detail overlays for Encode and Build"
        style={{ opacity: 0 }}
        onClick={() => useCorridorOverlayStore.getState().toggleArmed()}
      >
        <i className="home-v2-overlay-toggle__tick" aria-hidden="true" />
        <span className="home-v2-overlay-toggle__name">Detail</span>
      </button>
    </>
  );
}
