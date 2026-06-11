"use client";

import type { CSSProperties } from "react";
import { stationById } from "@/lib/home-v2/corridorMap";

export type VariantId = "V0" | "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7";
export type CopyMode = "full" | "condensed";
export type TitleSize = "S" | "M" | "L";

interface NavigateCopyVariantsProps {
  variant: VariantId;
  mirror: boolean;
  copyMode: CopyMode;
  /** Title scale for the V5 bottom stack (S/M/L exploration). */
  titleSize: TitleSize;
}

/** Copy bundle for the Navigate station — title pulled directly from
 *  the canonical `corridorMap`; full + condensed support strings live
 *  here so the lab can A/B between them without editing the map. */
function useNavigateCopy(copyMode: CopyMode) {
  const content = stationById("navigate")?.content;
  const titleHtml = content?.titleHtml ?? "Navigate the <em>intelligence</em>.";
  const fullHtml =
    content?.supportHtml ??
    "Trained on us, but it doesn't think like us.<br>So you stop commanding and start <em>navigating</em> — where it leads, and where you do.";
  // Tightened to ~60% length while keeping the trained-on-us / command
  // → navigate beat. Used by V3 (unified cartouche) and offered as a
  // toggle for every variant so we can A/B the cropped-feel question.
  const condensedHtml = "Trained on us, but alien.<br>Stop commanding — start <em>navigating</em>.";
  const supportHtml = copyMode === "full" ? fullHtml : condensedHtml;
  const telemetry = {
    sector: content?.telemetry?.sector ?? "STATION 01",
    callsign: content?.telemetry?.callsign ?? "NAV-01",
    status: content?.telemetry?.status ?? "LOCKED",
    metric: content?.telemetry?.metric ?? "BRG 312°",
  };
  return { titleHtml, supportHtml, telemetry };
}

export function NavigateCopyVariants({
  variant,
  mirror,
  copyMode,
  titleSize,
}: NavigateCopyVariantsProps) {
  const copy = useNavigateCopy(copyMode);

  switch (variant) {
    case "V0":
      return <VariantBaseline {...copy} />;
    case "V1":
      return <VariantRailDock {...copy} mirror={mirror} />;
    case "V2":
      return <VariantCornerConsole {...copy} mirror={mirror} />;
    case "V3":
      return <VariantUnifiedCartouche {...copy} />;
    case "V4":
      return <VariantLimbCallout {...copy} mirror={mirror} />;
    case "V5":
      return <VariantBottomStack {...copy} copyMode={copyMode} titleSize={titleSize} />;
    case "V6":
      return <VariantTopStack {...copy} copyMode={copyMode} titleSize={titleSize} />;
    case "V7":
      return <VariantLimbWrap {...copy} mirror={mirror} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────

interface VariantContent {
  titleHtml: string;
  supportHtml: string;
  telemetry: {
    sector: string;
    callsign: string;
    status: string;
    metric: string;
  };
}

function TelemetryRow({ telemetry }: { telemetry: VariantContent["telemetry"] }) {
  return (
    <div className="ncl-telemetry">
      <span className="ncl-telemetry__diamond" />
      <span>{telemetry.sector}</span>
      <span className="ncl-telemetry__sep" />
      <span>{telemetry.callsign}</span>
      <span className="ncl-telemetry__sep" />
      <span className="ncl-telemetry__status">{telemetry.status}</span>
      <span className="ncl-telemetry__sep" />
      <span>{telemetry.metric}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// V0 — Baseline split (current production layout)
// ─────────────────────────────────────────────────────────────────

function VariantBaseline({ titleHtml, supportHtml }: VariantContent) {
  return (
    <div className="ncl-variant ncl-v0">
      <div className="ncl-v0__head">
        <h2 className="ncl-v0__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
      </div>
      <div className="ncl-v0__foot">
        <p className="ncl-v0__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// V1 — Rail card (top-left diagnostic card, dotted particle frames)
//
// Ship-diagnostic readout grammar (Earth–Mars cycler reference):
//   header band (diamond + kicker + status) → path breadcrumb →
//   dotted divider → title → support → telemetry footer readouts.
// The frame is PARTIAL: dotted particle segments on the top + left
// edges, a solid corner notch top-left, a short dotted run under the
// footer. A dotted tether welds the card's header line into the
// left HUD rail with a diamond node at the dock point.
// ─────────────────────────────────────────────────────────────────

function VariantRailDock({
  titleHtml,
  supportHtml,
  telemetry,
  mirror,
}: VariantContent & { mirror: boolean }) {
  return (
    <div className={`ncl-variant ncl-v1${mirror ? " is-mirrored" : ""}`}>
      {/* Dotted tether from the HUD rail into the card's header line.
          The diamond marks the dock point on the rail's tick grid. */}
      <div className="ncl-v1__tether" aria-hidden="true">
        <span className="ncl-v1__tether-diamond" />
        <span className="ncl-v1__tether-line" />
      </div>

      <div className="ncl-v1__card">
        {/* Partial particle-dot frame segments — not a closed box. */}
        <span className="ncl-v1__frame ncl-v1__frame--top" aria-hidden="true" />
        <span className="ncl-v1__frame ncl-v1__frame--left" aria-hidden="true" />
        <span className="ncl-v1__corner" aria-hidden="true" />
        <span className="ncl-v1__corner-br" aria-hidden="true" />

        <header className="ncl-v1__head">
          <span className="ncl-v1__head-diamond" />
          <span className="ncl-v1__head-kicker">01 · NAVIGATE</span>
          <span className="ncl-v1__head-status">{telemetry.status}</span>
        </header>

        <div className="ncl-v1__path">
          {`TF_OS//CORRIDOR//${telemetry.sector.replace(/\s+/g, ".")}//${telemetry.callsign}.DATA`}
        </div>

        <span className="ncl-v1__divider" aria-hidden="true" />

        <h2 className="ncl-v1__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <p className="ncl-v1__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />

        <footer className="ncl-v1__foot">
          <span className="ncl-v1__foot-item">
            <span className="ncl-v1__foot-label">BRG</span>
            <span className="ncl-v1__foot-value">312°</span>
          </span>
          <span className="ncl-v1__foot-item">
            <span className="ncl-v1__foot-label">DPT</span>
            <span className="ncl-v1__foot-value">0.40</span>
          </span>
          <span className="ncl-v1__foot-item">
            <span className="ncl-v1__foot-label">SIG</span>
            <span className="ncl-v1__foot-value">
              <span className="ncl-v1__sig">
                <span className="ncl-v1__sig-dot is-on" />
                <span className="ncl-v1__sig-dot is-on" />
                <span className="ncl-v1__sig-dot is-on" />
                <span className="ncl-v1__sig-dot" />
              </span>
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// V2 — Corner console (bottom-left mission card)
// ─────────────────────────────────────────────────────────────────

function VariantCornerConsole({
  titleHtml,
  supportHtml,
  telemetry,
  mirror,
}: VariantContent & { mirror: boolean }) {
  return (
    <div className={`ncl-variant ncl-v2${mirror ? " is-mirrored" : ""}`}>
      <div className="ncl-v2__card">
        {/* Four corner brackets (shape-law, zero radius). */}
        <span className="ncl-v2__bracket ncl-v2__bracket--tl" aria-hidden="true" />
        <span className="ncl-v2__bracket ncl-v2__bracket--tr" aria-hidden="true" />
        <span className="ncl-v2__bracket ncl-v2__bracket--bl" aria-hidden="true" />
        <span className="ncl-v2__bracket ncl-v2__bracket--br" aria-hidden="true" />

        <TelemetryRow telemetry={telemetry} />
        <h2 className="ncl-v2__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <p className="ncl-v2__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// V3 — Unified cartouche (centered, title + caption together)
// ─────────────────────────────────────────────────────────────────

function VariantUnifiedCartouche({ titleHtml, supportHtml, telemetry }: VariantContent) {
  return (
    <div className="ncl-variant ncl-v3">
      <div className="ncl-v3__card">
        <div className="ncl-v3__chrome">
          <span className="ncl-v3__rule" />
          <span className="ncl-v3__diamond" />
          <span className="ncl-v3__kicker">
            {telemetry.sector} · {telemetry.callsign}
          </span>
          <span className="ncl-v3__diamond" />
          <span className="ncl-v3__rule" />
        </div>
        <h2 className="ncl-v3__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <span className="ncl-v3__divider" aria-hidden="true">
          <span className="ncl-v3__divider-line" />
          <span className="ncl-v3__divider-diamond" />
          <span className="ncl-v3__divider-line" />
        </span>
        <p className="ncl-v3__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// V4 — Limb callout (overlapping sphere, leader line + scrim)
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// V5 — Bottom stack (minimal, centered, title above paragraph)
//
// The most restrained variant: a single centered block at the
// bottom of the viewport — tiny kicker, title, then a REWRITTEN
// to-the-point paragraph directly underneath. No card, no frame;
// just a short dotted rule above the kicker as the only chrome.
// Reading flow is unbroken (top → bottom in one block) and the
// sphere keeps the full stage. Title size is switchable S/M/L.
// ─────────────────────────────────────────────────────────────────

/** Shared rewritten copy for the minimal stack variants (V5 / V6). */
function stackSupportHtml(copyMode: CopyMode): string {
  return copyMode === "full"
    ? "Trained on us, but it doesn't think like us.<br>You don't command it — you <em>navigate</em> it."
    : "You don't command it — you <em>navigate</em> it.";
}

function VariantBottomStack({
  titleHtml,
  copyMode,
  titleSize,
}: VariantContent & { copyMode: CopyMode; titleSize: TitleSize }) {
  const supportHtml = stackSupportHtml(copyMode);
  return (
    <div className="ncl-variant ncl-v5" data-title-size={titleSize}>
      <div className="ncl-v5__stack">
        <span className="ncl-v5__rule" aria-hidden="true" />
        <span className="ncl-v5__kicker">01 · NAVIGATE</span>
        <h2 className="ncl-v5__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <p className="ncl-v5__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// V6 — Top stack (minimal, centered, anchored at top)
//
// Identical internal grammar to V5 but anchored to the TOP of the
// viewport. Same reading order (rule → kicker → title → paragraph)
// so the eye still flows downward from a clear entry point.
// ─────────────────────────────────────────────────────────────────

function VariantTopStack({
  titleHtml,
  copyMode,
  titleSize,
}: VariantContent & { copyMode: CopyMode; titleSize: TitleSize }) {
  const supportHtml = stackSupportHtml(copyMode);
  return (
    <div className="ncl-variant ncl-v6" data-title-size={titleSize}>
      <div className="ncl-v6__stack">
        <span className="ncl-v6__rule" aria-hidden="true" />
        <span className="ncl-v6__kicker">01 · NAVIGATE</span>
        <h2 className="ncl-v6__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <p className="ncl-v6__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// V7 — Scanner callout (unified left-anchored block + leader line
// pointing at the sphere)
//
// Title + paragraph render together as one block, anchored at the
// sphere's upper-left so the reading flow is unbroken. A dotted
// leader hairline extends from the block's right edge horizontally
// into the sphere and terminates in a gold diamond + reticle —
// reads like a celestial-scanner annotation targeting the
// substrate. Mirror flips the block + leader to the right side.
// ─────────────────────────────────────────────────────────────────

function VariantLimbWrap({ titleHtml, mirror }: VariantContent & { mirror: boolean }) {
  // Concise V7 copy — kept tight so the unified block hugs the
  // sphere instead of competing with it.
  const supportHtml =
    "Trained on us, but it doesn't think like us. You don't command it — you <em>navigate</em> it.";
  return (
    <div className={`ncl-variant ncl-v7${mirror ? " is-mirrored" : ""}`}>
      <div className="ncl-v7__block">
        <span className="ncl-v7__rule" aria-hidden="true" />
        <span className="ncl-v7__kicker">01 · NAVIGATE</span>
        <h2 className="ncl-v7__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <p className="ncl-v7__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />

        {/* Scanner leader — dotted hairline + reticle + diamond
            terminating inside the sphere. Anchored to the block's
            right edge at vertical middle so it always tracks the
            block's natural height. */}
        <span className="ncl-v7__leader" aria-hidden="true">
          <span className="ncl-v7__leader-tick" />
          <span className="ncl-v7__leader-line" />
          <span className="ncl-v7__leader-reticle">
            <span className="ncl-v7__leader-reticle-arm" />
            <span className="ncl-v7__leader-reticle-arm" />
          </span>
          <span className="ncl-v7__leader-diamond" />
        </span>
      </div>
    </div>
  );
}

function VariantLimbCallout({
  titleHtml,
  supportHtml,
  telemetry,
  mirror,
}: VariantContent & { mirror: boolean }) {
  // Local radial scrim sits under the text only — strong centre, soft
  // falloff so the text holds against the brightest substrate
  // particles without painting a visible card.
  const scrimStyle: CSSProperties = {
    backgroundImage:
      "radial-gradient(ellipse 70% 90% at center, rgba(10, 9, 8, 0.78) 0%, rgba(10, 9, 8, 0.55) 32%, rgba(10, 9, 8, 0.22) 60%, rgba(10, 9, 8, 0) 82%)",
  };
  return (
    <div className={`ncl-variant ncl-v4${mirror ? " is-mirrored" : ""}`}>
      <div className="ncl-v4__group">
        <div className="ncl-v4__scrim" style={scrimStyle} aria-hidden="true" />
        <div className="ncl-v4__leader" aria-hidden="true">
          <span className="ncl-v4__leader-line" />
          <span className="ncl-v4__leader-diamond" />
        </div>
        <div className="ncl-v4__head">
          <span className="ncl-v4__kicker">
            {telemetry.sector} · {telemetry.callsign}
          </span>
          <h2 className="ncl-v4__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        </div>
        <p className="ncl-v4__support" dangerouslySetInnerHTML={{ __html: supportHtml }} />
      </div>
    </div>
  );
}
