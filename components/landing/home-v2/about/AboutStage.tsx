"use client";

import { useRef } from "react";

import { ABOUT_STAGE, type BioSegment } from "./aboutStageData";
import { useAboutStageScroll } from "../hooks/useAboutStageScroll";
import { ABOUT_DECK_STAGE } from "../unifiedServicesInstrument";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/**
 * AboutStage — the pinned #about deck-flip stage (ADR-047, capable
 * desktop only).
 *
 * A 300svh runway (`.about-stage-root`, the portal slot) pins this
 * sticky, TRANSPARENT stage over the still-live corridor canvas. Beats
 * (windows in `lib/services-ring/aboutDeckMath.ts`, mirrored to CSS vars
 * by `useAboutStageScroll`):
 *
 *   0 FLIP  — the WebGL card deck flips π to the portrait and lands on
 *             `.about-stage__slot` (a pure measurement element — the deck
 *             IS the portrait); the orbit cluster materializes around it,
 *             centered in the viewport.
 *   1 SHIFT — the cluster translates right to its grid slot (the deck
 *             stays welded via the per-frame slot rect) while the copy
 *             column reveals on the left.
 *   2 HOLD  — the reading state; the tail then restores the fail-opaque
 *             shield and everything dies together under #continuum.
 *
 * The orbit cluster reuses the static fallback's `.voidwalker__orbit*`
 * class grammar (landing.css) so the two surfaces can never drift
 * visually — minus the `data-m` reveal attributes (the stage's reveals
 * are scrubbed CSS-var functions, reversible under scroll; the one-shot
 * IntersectionObserver grammar stays on the fallback). Copy strings live
 * in `aboutStageData.ts`, lockstep with the fallback markup.
 */

function BioText({ segments }: { segments: readonly BioSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (typeof seg === "string") return <span key={i}>{seg}</span>;
        if ("em" in seg) return <em key={i}>{seg.em}</em>;
        return <strong key={i}>{seg.strong}</strong>;
      })}
    </>
  );
}

function LinkIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.6 0h4.37v1.92h.06c.61-1.15 2.1-2.37 4.32-2.37 4.62 0 5.47 3.04 5.47 7v7.45h-4.56v-6.6c0-1.58-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.5V22H7.82V8z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.88l-5.4-7.04L4.5 22H1.24l8.02-9.16L1 2h7.04l4.88 6.43L18.244 2zm-2.41 18h1.86L7.25 4H5.25l10.58 16z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="1" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
  }
}

/** The 12-dot particle halo — the fallback's authored `--a/--r/--o` set. */
const HALO: ReadonlyArray<{ a: number; r: number; o?: number; d?: boolean }> = [
  { a: 12, r: 46, o: 0.8 },
  { a: 38, r: 42, d: true },
  { a: 68, r: 48, o: 0.6 },
  { a: 96, r: 40, d: true },
  { a: 126, r: 45, o: 0.7 },
  { a: 158, r: 43, d: true },
  { a: 192, r: 47, o: 0.9 },
  { a: 224, r: 41, d: true },
  { a: 256, r: 46, o: 0.6 },
  { a: 288, r: 44, d: true },
  { a: 318, r: 48, o: 0.75 },
  { a: 348, r: 42, d: true },
];

export function AboutStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
  useAboutStageScroll(stageRef, slotRef, clusterRef);

  // Below the gate the static .voidwalker fallback owns the section — no
  // duplicate DOM (the hook also never engages, so `data-about-mode`
  // stays absent and the runway stays flat).
  if (!ABOUT_DECK_STAGE || !capable) return null;

  return (
    <div className="about-stage" ref={stageRef} data-about-step="0">
      <div className="about-stage__grid">
        {/* LEFT — the copy column (beat 1). Reuses the voidwalker type
            grammar; reveals via --about-copy-in with per-child --ci-off
            scrubbed stagger (about-stage.css) — NOT useRevealMotion (it
            snapshots [data-m] at mount and its .is-in is one-shot; the
            stage needs reversible, portal-safe reveals). */}
        <div className="about-stage__copy voidwalker__copy">
          <h2 className="voidwalker__name" style={{ ["--ci-off" as string]: 0 }}>
            {ABOUT_STAGE.name}
            <br />
            <em>{ABOUT_STAGE.nameEm}</em>
          </h2>
          <div className="voidwalker__role" style={{ ["--ci-off" as string]: 0.08 }}>
            {ABOUT_STAGE.role}
          </div>
          {ABOUT_STAGE.bios.map((bio, i) => (
            <p
              key={i}
              className="voidwalker__bio"
              style={{ ["--ci-off" as string]: 0.16 + i * 0.08 }}
            >
              <BioText segments={bio} />
            </p>
          ))}
          <div className="voidwalker__meta" style={{ ["--ci-off" as string]: 0.4 }}>
            {ABOUT_STAGE.meta.map((cell) => (
              <div key={cell.k} className="voidwalker__meta__cell">
                <span className="voidwalker__meta__k">{cell.k}</span>
                <span className="voidwalker__meta__v">{cell.v}</span>
              </div>
            ))}
          </div>
          <div
            className="voidwalker__links"
            aria-label="Elsewhere"
            style={{ ["--ci-off" as string]: 0.48 }}
          >
            {ABOUT_STAGE.links.map((link) => (
              <a key={link.label} href={link.href} aria-label={link.label} title={link.label}>
                <LinkIcon icon={link.icon} />
              </a>
            ))}
          </div>
        </div>

        {/* RIGHT — the orbit cluster (beat 0 reveal, beat 1 translate).
            Decorative: the readable copy lives on the left. The WebGL
            deck's flipped portrait is the visual centre; the slot below
            is its pure-measurement seat. */}
        <div className="about-stage__cluster voidwalker__orbit" aria-hidden="true" ref={clusterRef}>
          <div className="voidwalker__orbit__label voidwalker__orbit__label--tl">
            <span className="k">SUBJECT</span>
            <br />
            VB · 0001
          </div>
          <div className="voidwalker__orbit__label voidwalker__orbit__label--tr">
            <span className="k">BEARING</span>
            <br />N · 000 · lock
          </div>
          <div className="voidwalker__orbit__label voidwalker__orbit__label--bl">
            <span className="k">FIELD</span>
            <br />
            VOIDWALKER
          </div>
          <div className="voidwalker__orbit__label voidwalker__orbit__label--br">
            <span className="k">MODE</span>
            <br />
            navigate
          </div>

          <svg
            className="voidwalker__orbit__svg"
            viewBox="-200 -200 400 400"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <g fill="none" strokeWidth="0.7">
              <circle r="192" stroke="var(--dawn-15)" strokeDasharray="1 7" />
              <circle r="172" stroke="var(--dawn-08)" />
              <circle r="150" stroke="var(--gold)" strokeOpacity="0.18" strokeDasharray="2 8" />
              <circle r="124" stroke="var(--gold)" strokeOpacity="0.3" />
              <circle r="104" stroke="var(--gold)" strokeOpacity="0.15" strokeDasharray="1 3" />
              <circle r="82" stroke="var(--dawn-30)" strokeDasharray="1 4" />
            </g>
            <g stroke="var(--dawn-50)" strokeWidth="0.8">
              <path d="M0 -192 L0 -178" />
              <path d="M0 192 L0 178" />
              <path d="M-192 0 L-178 0" />
              <path d="M192 0 L178 0" />
            </g>
            <g stroke="var(--dawn-30)" strokeWidth="0.5">
              {[
                15, 30, 45, 60, 75, 105, 120, 135, 150, 165, 195, 210, 225, 240, 255, 285, 300, 315,
                330, 345,
              ].map((deg) => (
                <path key={deg} d="M0 -192 L0 -184" transform={`rotate(${deg})`} />
              ))}
            </g>
            <g stroke="var(--gold)" strokeOpacity="0.22" strokeWidth="0.5">
              <path d="M0 -150 L0 -82" />
              <path d="M0 150 L0 82" />
              <path d="M-150 0 L-82 0" />
              <path d="M150 0 L82 0" />
            </g>
            <g style={{ transformOrigin: "0 0", animation: "rotate 50s linear infinite" }}>
              <circle cx="0" cy="-150" r="3.5" fill="var(--gold)" />
              <rect
                x="-3"
                y="147"
                width="6"
                height="6"
                fill="var(--gold)"
                transform="rotate(45 0 150)"
              />
            </g>
            <g style={{ transformOrigin: "0 0", animation: "rotateRev 90s linear infinite" }}>
              <circle cx="172" cy="0" r="1.8" fill="var(--dawn)" opacity="0.6" />
              <circle cx="-172" cy="0" r="1.4" fill="var(--dawn)" opacity="0.4" />
            </g>
            <g style={{ transformOrigin: "0 0", animation: "rotate 120s linear infinite" }}>
              <circle cx="124" cy="0" r="1.6" fill="var(--gold)" opacity="0.7" />
            </g>
            <g
              fontFamily="var(--font-pt-mono)"
              fontSize="8"
              fill="var(--dawn-50)"
              textAnchor="middle"
              letterSpacing="1.5"
            >
              <text x="0" y="-198">
                N · 000
              </text>
              <text x="198" y="3" textAnchor="start">
                090
              </text>
              <text x="0" y="205">
                180
              </text>
              <text x="-198" y="3" textAnchor="end">
                270
              </text>
            </g>
            <g
              fontFamily="var(--font-pt-mono)"
              fontSize="6"
              fill="var(--dawn-30)"
              letterSpacing="1.2"
            >
              <text x="-188" y="-156">
                FIG · 04a
              </text>
              <text x="120" y="-172">
                VB · FIELD MAP
              </text>
              <text x="-188" y="178">
                CH · 01 / VOIDWALKER
              </text>
              <text x="120" y="188" textAnchor="start">
                ∂ · 0.001
              </text>
            </g>
          </svg>

          <div className="voidwalker__orbit__particles">
            {HALO.map((p, i) => (
              <span
                key={i}
                className={p.d ? "d" : undefined}
                style={
                  {
                    "--a": `${p.a}deg`,
                    "--r": `${p.r}%`,
                    ...(p.o !== undefined ? { "--o": p.o } : null),
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          {/* The deck's seat — pure measurement, no visual (the flipped
              WebGL card IS the portrait; its chrome is baked). Card
              aspect, not the fallback's 3/4. */}
          <div className="about-stage__slot" ref={slotRef} />
        </div>
      </div>
    </div>
  );
}
