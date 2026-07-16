"use client";

/**
 * /test/services-wordmark
 *
 * Alternative wordmark-placement lab for the Services section. Same faithful
 * Services centerpiece (real hologram mark + armillary + orbits + bloom) and
 * HUD chrome as production, but the two corner brand elements are SWAPPED and
 * a rail-aligned masthead is added:
 *
 *   - TOP-LEFT   : just the plain corner bracket ("the corner we used to
 *                  have") — the wordmark vacates it, nothing replaces it.
 *   - BOTTOM-LEFT: the wordmark lockup (moved down from the top-left; grows
 *                  upward from the corner). Its corner bracket is OMITTED —
 *                  the same rule production applies to whichever corner the
 *                  wordmark occupies.
 *   - LEFT       : a full-caps Services title, pulled inboard from the rail
 *                  toward a Linear-style centered band (`?inset=` vw).
 *   - RIGHT      : an intro paragraph in the right column of that band —
 *                  which by default REPLACES the SOURCE BUS · 04 register (a
 *                  deliberate, lab-only ADR-031 departure; `?register=on`
 *                  restores it for side-by-side comparison).
 *
 * The rails are hand-authored static markup on the real classes/tokens, frozen
 * at the "SERVICES active" state (no live controllers / scroll plumbing). Every
 * placement decision is a deep-linkable toggle — see DEFAULTS.
 */

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import "@/components/landing/v7/landing.css";
import "@/components/landing/home-v2/services/services.css";

import {
  ServicesCardRing,
  ServicesHologramScene,
} from "@/components/landing/home-v2/services/hologram";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { TENSOR_ACCENT, TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import type { ServicesRingProgress } from "@/lib/services-ring/ringProgressRef";
import { buildLeftRailTicksHtml, buildRightRailTicksHtml } from "@/lib/v7-parse/hudTicks";

const PALETTE = {
  void: "#050403",
  gold: "#caa554",
  faint: "rgba(235, 227, 214, 0.42)",
  dim: "rgba(235, 227, 214, 0.26)",
};

/** Centerpiece scale + camera — the calm services-demo composition. */
const INSTRUMENT_SCALE = 0.72;
const CAM_Z = 3.65;

/** Right-rail register slots (verbatim from ServicesRailRegister.tsx) — four
 *  rows straddle mid-rail at the shared `--rail-register-pitch` step. */
const ROW_TOPS = [
  "calc(50% - 1.5 * var(--rail-register-pitch, 30px))",
  "calc(50% - 0.5 * var(--rail-register-pitch, 30px))",
  "calc(50% + 0.5 * var(--rail-register-pitch, 30px))",
  "calc(50% + 1.5 * var(--rail-register-pitch, 30px))",
] as const;

/** Default right-column paragraph — mirrors the production
 *  `SERVICES_MASTHEAD.intro` (2026-07-16 copy sweep). Editable via `?para=`. */
const DEFAULT_PARA =
  "A keynote, a workshop, standing advice, or a fixed-term embed inside your teams. Four depths of the same work: making AI capability your own.";

/** Default title. A leading `|` splits the display lines; the LAST line renders
 *  in gold (the emphasis segment). Editable via `?title=`. */
const DEFAULT_TITLE = "ONE PRACTICE.|FOUR WAYS IN.";

type TitleFont = "mono" | "sans";

interface LabConfig {
  /** "mono" = PT Mono 700 (the Arc case-title face); "sans" = PP Neue Montreal
   *  400 (the editorial station-header face). */
  font: TitleFont;
  /** Title font-size scalar over the base clamp. */
  size: number;
  /** Title letter-spacing, em. */
  track: number;
  /** How far the text band pulls inboard from the rail guides, vw. 0 = flush
   *  to the rails (the first pass, rejected as too close); ~8 = the more
   *  centered Linear read. */
  inset: number;
  /** Show the SOURCE BUS · 04 register (default off — the paragraph replaces it). */
  register: boolean;
  /** Draw the rail → text leader hairlines (span the whole inset). */
  connectors: boolean;
  /** Mount the four orbiting service cards (default off — they'd cross the band). */
  ring: boolean;
  title: string;
  para: string;
}

const DEFAULTS: LabConfig = {
  font: "mono",
  size: 1,
  track: 0.08,
  inset: 8,
  register: false,
  connectors: false,
  ring: false,
  title: DEFAULT_TITLE,
  para: DEFAULT_PARA,
};

function clampNum(raw: string | null, min: number, max: number, fallback: number): number {
  const n = raw === null ? NaN : Number.parseFloat(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** The two title recipes: `base` styles the title block, `em` recolours the
 *  emphasis (last) line. `mono` mirrors caseCardBake.ts; `sans` mirrors
 *  .home-v2-station-header__title. */
function titleRecipe(
  font: TitleFont,
  sizeScalar: number,
  track: number
): { base: CSSProperties; em: CSSProperties } {
  // Linear-scale display size — a section title, not a poster (the first
  // pass's clamp(40px,7vw,104px) was rejected as far too large).
  const fontSize = `calc(clamp(28px, 3vw, 48px) * ${sizeScalar})`;
  if (font === "mono") {
    return {
      base: {
        fontFamily: 'var(--font-pt-mono, "PT Mono", ui-monospace, monospace)',
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: `${track}em`,
        lineHeight: 1.02,
        color: "var(--dawn, #ebe3d6)",
        fontSize,
      },
      em: { color: "var(--gold, #caa554)" },
    };
  }
  return {
    base: {
      fontFamily: "var(--font-pp-neue-montreal, system-ui, sans-serif)",
      fontWeight: 400,
      textTransform: "uppercase",
      letterSpacing: `${track}em`,
      lineHeight: 1.1,
      color: "var(--dawn, #ebe3d6)",
      fontSize,
      textShadow: "0 0 22px rgba(202, 165, 84, 0.18)",
    },
    em: { color: "var(--gold, #caa554)", fontWeight: 500 },
  };
}

/* ── Compact control bar (services-orbit lab conventions) ──────────────── */

const PANEL_FONT = 'var(--font-ibm-plex-mono, "IBM Plex Mono"), ui-monospace, monospace';

function LabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: PANEL_FONT,
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: "4px 9px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        color: active ? "#0a0908" : PALETTE.gold,
        background: active ? PALETTE.gold : "transparent",
        border: `1px solid ${active ? PALETTE.gold : "rgba(202, 165, 84, 0.4)"}`,
      }}
    >
      {label}
    </button>
  );
}

function Slider({
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
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.08em", color: PALETTE.faint }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        style={{ width: 96, accentColor: PALETTE.gold }}
      />
      <span style={{ width: 34, fontSize: 10, color: PALETTE.gold, textAlign: "right" }}>
        {value.toFixed(step < 0.01 ? 3 : 2)}
      </span>
    </div>
  );
}

export default function ServicesWordmarkLabPage() {
  // Deep-link every placement decision; read lazily so the page needs no
  // useSearchParams/Suspense (services-orbit lab convention).
  const [cfg, setCfg] = useState<LabConfig>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    const q = new URLSearchParams(window.location.search);
    return {
      font: q.get("font") === "sans" ? "sans" : "mono",
      size: clampNum(q.get("size"), 0.6, 1.4, DEFAULTS.size),
      track: clampNum(q.get("track"), 0, 0.14, DEFAULTS.track),
      inset: clampNum(q.get("inset"), 0, 16, DEFAULTS.inset),
      register: q.get("register") === "on",
      connectors: q.get("rails") === "on",
      ring: q.get("ring") === "on",
      title: q.get("title") ?? DEFAULTS.title,
      para: q.get("para") ?? DEFAULTS.para,
    };
  });
  const set = (patch: Partial<LabConfig>) => setCfg((c) => ({ ...c, ...patch }));

  // Fixed progress for the optional card ring (production reads this per frame
  // from useServicesStageScroll; the lab parks it at beat-1 midpoint).
  const progressRef = useRef<ServicesRingProgress>({ progress: 0.3 });

  // Late-mount canvas sizing nudge (services-demo convention).
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  const recipe = titleRecipe(cfg.font, cfg.size, cfg.track);
  const titleLines = cfg.title.split("|");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: `radial-gradient(130% 100% at 42% 45%, #0d0a07 0%, ${PALETTE.void} 72%)`,
        overflow: "hidden",
        fontFamily: PANEL_FONT,
      }}
    >
      {/* ── Centerpiece (z1) — real Services hologram instrument ────────── */}
      <Canvas
        camera={{ position: [0, 0, CAM_Z], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        <ServicesHologramScene
          activeServiceId={SERVICES[0].id}
          accentColor={TENSOR_ACCENT}
          blending="normal"
          color={TENSOR_GOLD}
          density={0.9}
          depthStrutCount={2200}
          edgeThresholdDeg={5}
          flyIn={1}
          opacity={0.74}
          pointSize={4.3}
          scale={INSTRUMENT_SCALE}
          scanGain={0.24}
          showShell
          shellCount={120}
          surfaceCount={160}
          wireCount={6800}
          wireStroke={0.084}
        >
          {cfg.ring && (
            <ServicesCardRing scale={INSTRUMENT_SCALE} progressRef={progressRef} entrance="off" />
          )}
        </ServicesHologramScene>
        <EffectComposer>
          <Bloom intensity={0.3} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>

      {/* ── Masthead band (z30): title left, paragraph right. Both columns
          pull `inset` vw inboard from the rail guides toward a Linear-style
          centered band; the optional connectors become full-span leader
          hairlines from each guide to its column. ─────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: `calc(var(--hud-margin) + ${cfg.inset}vw)`,
          top: "calc(var(--hud-rail-y-start) + clamp(24px, 6vh, 72px))",
          zIndex: 30,
          maxWidth: "40vw",
          paddingLeft: 14,
        }}
      >
        {cfg.connectors && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: `calc(${cfg.inset}vw * -1)`,
              top: 7,
              width: `calc(${cfg.inset}vw + 14px)`,
              height: 1,
              background: "var(--hud-rail-line, rgba(235,227,214,0.55))",
              opacity: 0.5,
            }}
          />
        )}
        <div
          style={{
            fontFamily: 'var(--font-pt-mono, "PT Mono", ui-monospace, monospace)',
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--gold, #caa554)",
            marginBottom: 16,
          }}
        >
          Services · 04
        </div>
        <h1 style={{ margin: 0, ...recipe.base }}>
          {titleLines.map((line, i) => (
            <span
              key={i}
              style={{
                display: "block",
                ...(titleLines.length > 1 && i === titleLines.length - 1 ? recipe.em : {}),
              }}
            >
              {line}
            </span>
          ))}
        </h1>
      </div>

      <div
        style={{
          position: "absolute",
          right: `calc(var(--hud-margin) + ${cfg.inset}vw)`,
          // +34px clears the eyebrow row so the paragraph's first line aligns
          // with the H1's first line, the Linear masthead read.
          top: "calc(var(--hud-rail-y-start) + clamp(24px, 6vh, 72px) + 34px)",
          zIndex: 30,
          maxWidth: "min(38ch, 32vw)",
          paddingRight: 14,
          // Left-aligned ragged-right, like the Linear right column — the
          // right-anchored flush-right read was rejected with the first pass.
          textAlign: "left",
          fontFamily: "var(--font-pp-neue-montreal, system-ui, sans-serif)",
          fontWeight: 400,
          fontSize: "clamp(15px, 1.15vw, 18px)",
          lineHeight: 1.5,
          color: "rgba(235, 227, 214, 0.72)",
        }}
      >
        {cfg.connectors && (
          <span
            aria-hidden
            style={{
              position: "absolute",
              right: `calc(${cfg.inset}vw * -1)`,
              top: 11,
              width: `calc(${cfg.inset}vw + 14px)`,
              height: 1,
              background: "var(--hud-rail-line, rgba(235,227,214,0.55))",
              opacity: 0.5,
            }}
          />
        )}
        {cfg.para}
      </div>

      {/* ── HUD chrome (z50): corners, rails, swapped brand elements ─────── */}
      <div className="hud" aria-hidden="false">
        {/* Corner brackets. The wordmark's corner never carries a bracket
            (production omits the TOP-left bracket for exactly this reason) —
            with the wordmark moved to the BOTTOM-left, the bracket rule moves
            with it: TL gets its plain bracket back, BL loses its bracket. */}
        <div className="hud__corner hud__corner--tl" />
        <div className="hud__corner hud__corner--br" />

        {/* BOTTOM-LEFT: the wordmark lockup, moved down and grown upward. */}
        <a
          className="hud__brand"
          href="#"
          aria-label="Thoughtform — home"
          style={{
            top: "auto",
            bottom: "var(--hud-margin)",
            left: "var(--hud-margin)",
            transformOrigin: "bottom left",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/Thoughtform_Wordmark_Lockup-Vertical%20(Dual).svg" alt="Thoughtform" />
        </a>

        {/* LEFT rail — track + 13-tick ladder + the journey detent diamond
            (ADR-031 Update 9), parked at a representative Services detent. The
            title chip reveals "Services" on hover, as in production. */}
        <aside className="hud__rail hud__rail--l">
          <div className="hud__rail__track" />
          <div id="leftTicks" dangerouslySetInnerHTML={{ __html: buildLeftRailTicksHtml() }} />
          <nav
            data-rail-manifest-root
            data-ready
            data-has-title
            aria-label="Page manifest"
            style={{ "--rail-diamond-top": "60%" } as CSSProperties}
          >
            <button
              type="button"
              className="rail-manifest__diamond"
              data-rail-manifest-diamond
              aria-label="Journey position — Services"
            />
            <span className="rail-manifest__title" data-rail-manifest-title aria-hidden="true">
              Services
            </span>
          </nav>
        </aside>

        {/* RIGHT rail — track + 13-tick ladder + (optional) SOURCE BUS register. */}
        <aside className="hud__rail hud__rail--r">
          <div className="hud__rail__track" />
          <div id="rightTicks" dangerouslySetInnerHTML={{ __html: buildRightRailTicksHtml() }} />
          <div data-tools-rail-root>
            {cfg.register && (
              <div className="tools-rail-register" data-register-mode="services">
                <span className="tools-rail-register__heading tools-rail-register__heading--services">
                  SOURCE BUS · 04
                </span>
                {SERVICES.map((service, i) => (
                  <div
                    key={service.id}
                    className="tools-rail-register__row tools-rail-register__row--service"
                    data-service-id={service.id}
                    data-active={i === 0 ? "" : undefined}
                    style={{ top: ROW_TOPS[i] } as CSSProperties}
                  >
                    <i className="tools-rail-register__marker" />
                    <span className="tools-rail-register__index">{service.index}</span>
                    <span className="tools-rail-register__name">{service.verb}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Control bar (z60, bottom-center) ────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 60,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          maxWidth: "min(760px, 92vw)",
          padding: "10px 14px",
          background: "rgba(8, 7, 6, 0.92)",
          border: "1px solid rgba(202, 165, 84, 0.22)",
        }}
      >
        <div style={{ display: "flex", gap: 5 }}>
          <LabButton
            label="MONO"
            active={cfg.font === "mono"}
            onClick={() => set({ font: "mono" })}
          />
          <LabButton
            label="SANS"
            active={cfg.font === "sans"}
            onClick={() => set({ font: "sans" })}
          />
        </div>
        <Slider
          label="size"
          value={cfg.size}
          min={0.6}
          max={1.4}
          step={0.01}
          onChange={(v) => set({ size: v })}
        />
        <Slider
          label="track"
          value={cfg.track}
          min={0}
          max={0.14}
          step={0.005}
          onChange={(v) => set({ track: v })}
        />
        <Slider
          label="inset"
          value={cfg.inset}
          min={0}
          max={16}
          step={0.5}
          onChange={(v) => set({ inset: v })}
        />
        <LabButton
          label={cfg.register ? "REGISTER ON" : "REGISTER OFF"}
          active={cfg.register}
          onClick={() => set({ register: !cfg.register })}
        />
        <LabButton
          label={cfg.connectors ? "RAILS ON" : "RAILS OFF"}
          active={cfg.connectors}
          onClick={() => set({ connectors: !cfg.connectors })}
        />
        <LabButton
          label={cfg.ring ? "CARDS ON" : "CARDS OFF"}
          active={cfg.ring}
          onClick={() => set({ ring: !cfg.ring })}
        />
        <LabButton label="RESET" onClick={() => setCfg(DEFAULTS)} />
      </div>

      <Link
        href="/test/services-orbit"
        style={{
          position: "absolute",
          bottom: 18,
          right: 22,
          zIndex: 60,
          fontSize: 11,
          letterSpacing: "0.08em",
          color: PALETTE.faint,
          textDecoration: "none",
        }}
      >
        {"services orbit ->"}
      </Link>
    </div>
  );
}
