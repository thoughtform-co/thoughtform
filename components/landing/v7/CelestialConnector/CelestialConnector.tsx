"use client";

import { useCallback } from "react";
import type { CelestialConfig } from "@/lib/celestial/schema";
import { LinesSvg } from "./LinesSvg";
import { DiagramSvg } from "./DiagramSvg";

interface CelestialConnectorProps {
  config: CelestialConfig;
  slotId?: string;
}

const VARIANT_CLASS: Record<string, string> = {
  squareCascade: "celestial-connector--square",
  heroOrb: "celestial-connector--hero-orb",
};

const SIZE_CLASS: Record<string, string> = {
  lg: "celestial-connector__diagram--large",
};

/**
 * Parametric celestial connector rendered between landing page sections.
 * Mirrors the exact HTML/CSS grammar from the existing .celestial-connector
 * blocks so all landing.css styles apply without changes.
 */
export function CelestialConnector({ config, slotId }: CelestialConnectorProps) {
  const { labels, lines, orientation, size, preset } = config;

  const wrapperCls = [
    "celestial-connector",
    VARIANT_CLASS[preset] ?? "",
    orientation === "vertical" ? "celestial-connector--vertical" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const diagramCls = ["celestial-connector__diagram", SIZE_CLASS[size] ?? ""]
    .filter(Boolean)
    .join(" ");

  const needsInner = preset === "heroOrb";

  // Reveal: the global useRevealMotion observer in LandingPage queries
  // [data-m] once at mount, before these portal-mounted connectors exist.
  // A callback ref attached to this wrapper runs synchronously on commit
  // and sets up a per-instance IntersectionObserver that adds `.is-in`
  // when the connector enters view, unlocking the inner diagram reveal.
  const attachReveal = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    if (el.classList.contains("is-in")) return;

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -4% 0px" }
    );
    obs.observe(el);
  }, []);

  return (
    <div
      ref={attachReveal}
      className={wrapperCls}
      aria-hidden="true"
      data-m="instrument"
      data-celestial-slot={slotId}
      data-orientation={orientation}
    >
      <Label position="tl" entry={labels.tl} />
      <Label position="tr" entry={labels.tr} />
      <Label position="bl" entry={labels.bl} />
      <Label position="br" entry={labels.br} />

      <LinesSvg pattern={lines.topPattern} position="top" />

      {needsInner ? (
        <div className={diagramCls} aria-hidden="true">
          <div className="celestial-connector__diagram-inner" aria-hidden="true">
            <DiagramSvg config={config} />
          </div>
        </div>
      ) : (
        <div className={diagramCls} aria-hidden="true">
          <DiagramSvg config={config} />
        </div>
      )}

      <LinesSvg pattern={lines.bottomPattern} position="bot" />
    </div>
  );
}

function Label({
  position,
  entry,
}: {
  position: "tl" | "tr" | "bl" | "br";
  entry: { text: string; emphasis?: string };
}) {
  if (!entry.text && !entry.emphasis) return null;
  return (
    <span className={`celestial-connector__label celestial-connector__label--${position}`}>
      {entry.emphasis && <span className="k">{entry.emphasis}</span>}
      {entry.emphasis && entry.text ? " " : ""}
      {entry.text}
    </span>
  );
}
