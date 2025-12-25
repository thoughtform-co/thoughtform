"use client";

import type { RefObject } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

interface MorphingCTAButtonsProps {
  /** Hero to definition transition progress (0-1) */
  tHeroToDef: number;
  /** Definition to manifesto transition progress (0-1) */
  tDefToManifesto: number;
  /** Whether we're on mobile */
  isMobile: boolean;
  /** Navigation handler */
  onNavigate: (sectionId: string) => void;
  /** Source elements in the Interface section (for true morphing) */
  journeyButtonRef: RefObject<HTMLElement>;
  contactButtonRef: RefObject<HTMLElement>;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const GOLD = "var(--gold, #caa554)";
const DAWN = "var(--dawn, #ece3d6)";
const VOID = "var(--void, #0a0908)";

const items = [
  { id: "services", label: "START YOUR JOURNEY", kind: "primary" as const },
  { id: "contact", label: "CONTACT", kind: "secondary" as const },
];

function toRect(rect: DOMRect): Rect {
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function padIndex(i: number) {
  return String(i).padStart(2, "0");
}

/**
 * True morph (movement + format change):
 * - At the moment `tDefToManifesto` starts, these buttons take over the exact Interface CTA positions
 * - They then travel to the bottom-left HUD grid, shrink, add indices, and fade arrows away
 */
export function MorphingCTAButtons({
  tHeroToDef,
  tDefToManifesto,
  isMobile,
  onNavigate,
  journeyButtonRef,
  contactButtonRef,
}: MorphingCTAButtonsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [sourceRects, setSourceRects] = useState<{
    journey: Rect | null;
    contact: Rect | null;
  }>({ journey: null, contact: null });

  const [targetRects, setTargetRects] = useState<{
    journey: Rect | null;
    contact: Rect | null;
  }>({ journey: null, contact: null });

  const measureJourneyRef = useRef<HTMLButtonElement>(null);
  const measureContactRef = useRef<HTMLButtonElement>(null);

  const enabled = tHeroToDef > 0.75 && !isMobile;
  const rawT = clamp01(tDefToManifesto);
  const tMove = easeOutCubic(rawT); // movement starts immediately
  const tStyle = easeInOutCubic(rawT);

  const arrowT = clamp01(1 - tStyle / 0.22); // arrows gone early
  const arrowOpacity = arrowT;
  const arrowWidth = lerp(32, 0, 1 - arrowT);

  const indexT = clamp01((tStyle - 0.1) / 0.28);
  const indexOpacity = easeOutCubic(indexT);
  const indexWidth = lerp(0, 34, indexOpacity);

  // Keep source rects warm while we are in Interface state (before the morph begins)
  useLayoutEffect(() => {
    if (!enabled) return;
    if (tDefToManifesto > 0.001) return;

    const j = journeyButtonRef.current?.getBoundingClientRect();
    const c = contactButtonRef.current?.getBoundingClientRect();
    if (!j || !c) return;

    setSourceRects({ journey: toRect(j), contact: toRect(c) });
  }, [enabled, tDefToManifesto, journeyButtonRef, contactButtonRef]);

  const measureTargets = () => {
    const j = measureJourneyRef.current?.getBoundingClientRect();
    const c = measureContactRef.current?.getBoundingClientRect();
    if (!j || !c) return;
    setTargetRects({ journey: toRect(j), contact: toRect(c) });
  };

  useLayoutEffect(() => {
    if (!enabled) return;
    measureTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs are stable
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const onResize = () => {
      measureTargets();
      if (tDefToManifesto <= 0.001) {
        const j = journeyButtonRef.current?.getBoundingClientRect();
        const c = contactButtonRef.current?.getBoundingClientRect();
        if (j && c) setSourceRects({ journey: toRect(j), contact: toRect(c) });
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled, tDefToManifesto, journeyButtonRef, contactButtonRef]);

  const canMorph =
    !!sourceRects.journey &&
    !!sourceRects.contact &&
    !!targetRects.journey &&
    !!targetRects.contact;

  const rectFor = useMemo(() => {
    if (!canMorph) return null;
    const journey = {
      left: lerp(sourceRects.journey!.left, targetRects.journey!.left, tMove),
      top: lerp(sourceRects.journey!.top, targetRects.journey!.top, tMove),
      width: lerp(sourceRects.journey!.width, targetRects.journey!.width, tMove),
      height: lerp(sourceRects.journey!.height, targetRects.journey!.height, tMove),
    };
    const contact = {
      left: lerp(sourceRects.contact!.left, targetRects.contact!.left, tMove),
      top: lerp(sourceRects.contact!.top, targetRects.contact!.top, tMove),
      width: lerp(sourceRects.contact!.width, targetRects.contact!.width, tMove),
      height: lerp(sourceRects.contact!.height, targetRects.contact!.height, tMove),
    };
    return { journey, contact };
  }, [canMorph, sourceRects, targetRects, tMove]);

  if (!enabled) return null;

  // Only show the moving buttons during/after the Interface→Manifesto transition.
  const showMoving = tDefToManifesto > 0;

  const fontSize = lerp(13, 10, tStyle);
  const letterSpacing = lerp(0.15, 0.08, tStyle);
  const fontWeight = Math.round(lerp(700, 520, tStyle));
  const paddingY = lerp(14, 6, tStyle);
  // Both button types converge to same padding for consistent alignment
  const paddingXPrimary = lerp(18, 12, tStyle);
  const paddingXSecondary = lerp(14, 12, tStyle);

  // Content slides from centered → left-aligned as it becomes "telemetry-like"
  // Both buttons use same left alignment at end state for visual consistency
  const contentLeftPct = lerp(50, 0, tStyle);
  const contentTranslateXPct = lerp(-50, 0, tStyle);
  const contentGap = `${lerp(10, 8, tStyle)}px`;

  // Fixed index width ensures text alignment between both buttons
  const finalIndexWidth = 38; // Enough for "[00] " with consistent spacing

  const baseTextShadow = "0 0 2px rgba(202, 165, 84, 0.35), 0 0 4px rgba(202, 165, 84, 0.18)";

  const renderButton = (opts: {
    id: string;
    index: number;
    label: string;
    kind: "primary" | "secondary";
    rect: Rect;
  }) => {
    const isHovered = hoveredId === opts.id;
    const isPrimary = opts.kind === "primary";
    const bgFade = 1 - tStyle;

    const background = isHovered
      ? GOLD
      : isPrimary
        ? `linear-gradient(135deg, rgba(202, 165, 84, ${0.15 * bgFade}) 0%, rgba(202, 165, 84, ${
            0.05 * bgFade
          }) 50%, rgba(202, 165, 84, ${0.1 * bgFade}) 100%)`
        : `rgba(10, 9, 8, ${0.35 * bgFade})`;

    const borderColor = isPrimary
      ? `rgba(202, 165, 84, ${0.3 * bgFade})`
      : `rgba(236, 227, 214, ${0.28 * bgFade})`;

    const textColor = isHovered ? VOID : tStyle > 0.45 ? GOLD : isPrimary ? GOLD : DAWN;

    return (
      <button
        key={opts.id}
        onClick={() => onNavigate(opts.id)}
        onMouseEnter={() => setHoveredId(opts.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          position: "fixed",
          left: `${opts.rect.left}px`,
          top: `${opts.rect.top}px`,
          width: `${opts.rect.width}px`,
          height: `${opts.rect.height}px`,
          zIndex: 60,
          boxSizing: "border-box",
          display: "block",
          padding: `${paddingY}px ${isPrimary ? paddingXPrimary : paddingXSecondary}px`,
          borderRadius: "2px",
          border: `1px solid ${borderColor}`,
          background,
          cursor: "pointer",
          fontFamily: "var(--font-data, 'PT Mono', monospace)",
          fontSize: `${fontSize}px`,
          fontWeight,
          letterSpacing: `${letterSpacing}em`,
          textTransform: "uppercase",
          lineHeight: 1,
          color: textColor,
          textShadow: isHovered ? "none" : baseTextShadow,
          // Prevent accidental clicks while the morph hasn't started
          pointerEvents: showMoving ? "auto" : "none",
          // Smooth hover only (scroll drives everything else)
          transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
          overflow: "hidden",
        }}
        aria-label={`${opts.label}`}
      >
        <span style={{ position: "relative", display: "block", width: "100%", height: "100%" }}>
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: `${contentLeftPct}%`,
              transform: `translate(${contentTranslateXPct}%, -50%)`,
              display: "flex",
              alignItems: "center",
              gap: contentGap,
              whiteSpace: "nowrap",
            }}
          >
            {/* Primary arrows (fade + collapse away) */}
            {isPrimary && (
              <span
                className="journey-arrow-pulse"
                style={{
                  width: `${arrowWidth}px`,
                  overflow: "hidden",
                  opacity: arrowOpacity,
                  fontSize: `${lerp(16, 10, tStyle)}px`,
                  lineHeight: 1,
                  background:
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.9) 0%, rgba(202, 165, 84, 0.6) 50%, rgba(202, 165, 84, 0.8) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                aria-hidden="true"
              >
                ›››
              </span>
            )}

            {/* Index reveals (00/01) - fixed width for consistent alignment */}
            <span
              style={{
                width: `${indexWidth}px`,
                minWidth: tStyle > 0.7 ? `${finalIndexWidth}px` : undefined,
                overflow: "hidden",
                opacity: indexOpacity,
                fontSize: `${lerp(12, 10, tStyle)}px`,
                fontWeight: 400,
                letterSpacing: "0.02em",
                color: textColor,
                textAlign: "left",
              }}
              aria-hidden="true"
            >
              [{padIndex(opts.index)}]
            </span>

            {/* Label stays consistent */}
            <span>{opts.label}</span>

            {/* Right arrows for primary */}
            {isPrimary && (
              <span
                className="journey-arrow-pulse"
                style={{
                  width: `${arrowWidth}px`,
                  overflow: "hidden",
                  opacity: arrowOpacity,
                  fontSize: `${lerp(16, 10, tStyle)}px`,
                  lineHeight: 1,
                  background:
                    "linear-gradient(135deg, rgba(202, 165, 84, 0.9) 0%, rgba(202, 165, 84, 0.6) 50%, rgba(202, 165, 84, 0.8) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
                aria-hidden="true"
              >
                ‹‹‹
              </span>
            )}
          </span>
        </span>
      </button>
    );
  };

  return (
    <>
      {/* Hidden measuring layout for stable target rects (compact menu endpoint) */}
      <div
        style={{
          position: "fixed",
          // Position closer to left rail and lower toward corner
          left: "calc(var(--hud-padding, 32px) + var(--rail-width, 60px) + 8px)",
          bottom: "calc(var(--hud-padding, 32px) + var(--corner-size, 40px) + 8px)",
          zIndex: -1,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          visibility: "hidden",
          pointerEvents: "none",
          fontFamily: "var(--font-data, 'PT Mono', monospace)",
        }}
        aria-hidden="true"
      >
        <button
          ref={measureJourneyRef}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            fontSize: "10px",
            fontWeight: 520,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: GOLD,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ minWidth: "38px", letterSpacing: "0.02em", textAlign: "left" }}>
            [{padIndex(0)}]
          </span>
          <span>START YOUR JOURNEY</span>
        </button>
        <button
          ref={measureContactRef}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            background: "transparent",
            border: "none",
            fontSize: "10px",
            fontWeight: 520,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: GOLD,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ minWidth: "38px", letterSpacing: "0.02em", textAlign: "left" }}>
            [{padIndex(1)}]
          </span>
          <span>CONTACT</span>
        </button>
      </div>

      {/* Visible moving buttons (only once the Interface→Manifesto transition begins) */}
      {showMoving && canMorph && rectFor && (
        <>
          {renderButton({
            id: items[0].id,
            index: 0,
            label: items[0].label,
            kind: items[0].kind,
            rect: rectFor.journey,
          })}
          {renderButton({
            id: items[1].id,
            index: 1,
            label: items[1].label,
            kind: items[1].kind,
            rect: rectFor.contact,
          })}
        </>
      )}
    </>
  );
}
