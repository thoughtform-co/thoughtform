"use client";

import { useEffect, useState } from "react";
import { HeroVariants, type HeroVariantId } from "./HeroVariants";

interface HeroMockupLabProps {
  hudHtml: string;
  bodyClass: string;
}

/**
 * HeroMockupLab — switchable hero-composition lab for `/test/hero-mockups`.
 *
 * Renders the production v7 HUD (rails, brandmark slot, corner brackets,
 * gateway backdrop) parsed from the prototype HTML, then layers the
 * active variant's foreground composition on top. V0 reproduces the
 * current production hero verbatim. V1-V4 explore new directions with
 * the leader-line panels removed and content placed in protected safe
 * zones around the key visual.
 *
 * The variant switcher is a slim top bar — explicitly NOT a fixed
 * bottom-right panel, so the bottom-right corner of the hero stays
 * evaluable.
 */
export function HeroMockupLab({ hudHtml, bodyClass }: HeroMockupLabProps) {
  const [variant, setVariant] = useState<HeroVariantId>("V0");

  // Quiet any global brandmark/corridor listeners so the lab renders
  // statically. The /test layout is dev-only so the attribute reset
  // is cosmetic insurance, not load-bearing.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-brandmark-mode", "off");
    html.setAttribute("data-theme", "dark");
    return () => {
      html.removeAttribute("data-brandmark-mode");
    };
  }, []);

  return (
    <div className={`hero-mock-lab ${bodyClass}`} data-theme="dark" data-variant={variant}>
      {/* Production v7 HUD (gateway + rails + corner brackets + brandmark
          slot). Rendered exactly as `/test/navigate-copy-lab` does it so
          the lab inherits the real chrome instead of approximating it. */}
      <div
        className="hero-mock-lab__hud"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: hudHtml }}
      />

      <HeroStage variant={variant} />

      <HeroMockupTopBar variant={variant} onVariantChange={setVariant} />
    </div>
  );
}

interface HeroStageProps {
  variant: HeroVariantId;
}

/**
 * HeroStage — the shared shell every variant renders inside.
 *
 * Owns the looping key-visual video + dimming overlay. The HUD chrome
 * is mounted as a sibling at the lab root (not inside the stage) so
 * the production `.hud { position: fixed; inset: 0 }` rules apply
 * verbatim and the rails/brandmark/corners land at their canonical
 * coordinates.
 */
function HeroStage({ variant }: HeroStageProps) {
  return (
    <section className="hero-mock" data-variant={variant} aria-label="Hero mockup stage">
      <div className="hero-mock__video" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/videos/thoughtform-key-visual-2-poster.jpg"
          disablePictureInPicture
          disableRemotePlayback
        >
          <source src="/videos/thoughtform-key-visual-2-web.mp4" type="video/mp4" />
        </video>
        <div className="hero-mock__video__overlay" />
      </div>

      <HeroVariants variant={variant} />
    </section>
  );
}

interface HeroMockupTopBarProps {
  variant: HeroVariantId;
  onVariantChange: (v: HeroVariantId) => void;
}

const VARIANTS: { id: HeroVariantId; label: string; sub: string }[] = [
  { id: "V0", label: "V0", sub: "Current" },
  { id: "V1", label: "V1", sub: "Clear offer" },
  { id: "V2", label: "V2", sub: "HUD instrument" },
  { id: "V3", label: "V3", sub: "Annotated object" },
  { id: "V4", label: "V4", sub: "Foundry split" },
];

/**
 * HeroMockupTopBar — slim status-bar-style switcher fixed to the top
 * edge of the viewport.
 *
 * Sits ABOVE the production HUD layer (z:9001 vs HUD z:50) so the
 * variant pills are always reachable, and DOES NOT occupy any
 * compositional zone of the hero (top-left identity, top-right menu,
 * bottom-right readout, etc.). This is the deliberate fix for the
 * previous fixed bottom-right panel that overlapped the proof and
 * services modules.
 */
function HeroMockupTopBar({ variant, onVariantChange }: HeroMockupTopBarProps) {
  return (
    <header className="hero-mock-bar" role="toolbar" aria-label="Hero mockup variant switcher">
      <span className="hero-mock-bar__title">HERO · MOCKUP LAB</span>
      <div className="hero-mock-bar__variants">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`hero-mock-bar__variant${variant === v.id ? " is-on" : ""}`}
            onClick={() => onVariantChange(v.id)}
            aria-pressed={variant === v.id}
          >
            <span className="hero-mock-bar__variant-id">{v.label}</span>
            <span className="hero-mock-bar__variant-sub">{v.sub}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
