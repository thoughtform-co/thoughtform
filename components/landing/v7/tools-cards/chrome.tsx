"use client";

import type { ReactNode } from "react";
import type { CaseMode, ProjectCase, TitleSegment } from "./toolCardData";

/**
 * chrome — stateless retrofuturistic primitives shared by the five card
 * skins. All deterministic (no Math.random — hydration safety); diamonds
 * not circles; zero border-radius; emphasis upright gold.
 */

/** Deterministic tiny hash → stable pseudo-random stream per seed. */
function seedStream(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Stable digit string for readouts (`23 35 0013` grammar). */
export function seedDigits(seed: string, groups: number[] = [2, 2, 4]): string {
  const rnd = seedStream(seed);
  return groups
    .map((n) => Array.from({ length: n }, () => Math.floor(rnd() * 10)).join(""))
    .join(" ");
}

/** Title segments — `em` renders upright gold via `.pcl em`. */
export function TitleSegs({ segs }: { segs: TitleSegment[] }) {
  return (
    <>
      {segs.map((seg, i) =>
        seg.em ? <em key={i}>{seg.text}</em> : <span key={i}>{seg.text}</span>
      )}
    </>
  );
}

/** Microcap chip. Filled = active state language; inverted = ink on gold. */
export function LabelChip({
  children,
  tone = "dawn",
}: {
  children: ReactNode;
  tone?: "dawn" | "gold" | "inverted" | "mint" | "rust";
}) {
  return <span className={`pcl-chip pcl-chip--${tone}`}>{children}</span>;
}

/** Caption above an outlined value box (Petrochem field grammar). */
export function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="pcl-field">
      <span className="pcl-field__label">{label}</span>
      <span className="pcl-field__value">{value}</span>
    </div>
  );
}

/** Horizontal tick strip, emphasis every 5th (nav-terminal axis grammar). */
export function TickRuler({ ticks = 41 }: { ticks?: number }) {
  return (
    <svg
      className="pcl-ruler"
      viewBox={`0 0 ${(ticks - 1) * 8} 14`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {Array.from({ length: ticks }, (_, i) => (
        <line
          key={i}
          x1={i * 8}
          x2={i * 8}
          y1={0}
          y2={i % 5 === 0 ? 14 : 7}
          className={i % 5 === 0 ? "pcl-ruler__major" : "pcl-ruler__minor"}
        />
      ))}
    </svg>
  );
}

/** Four L-brackets over a locked target (mint reticle, Alien grammar). */
export function ReticleBrackets() {
  return (
    <span className="pcl-reticle" aria-hidden="true">
      <i className="pcl-reticle__c pcl-reticle__c--tl" />
      <i className="pcl-reticle__c pcl-reticle__c--tr" />
      <i className="pcl-reticle__c pcl-reticle__c--bl" />
      <i className="pcl-reticle__c pcl-reticle__c--br" />
    </span>
  );
}

/** Deterministic fake barcode (SVG bars seeded from the case id). */
function barcodeGeometry(
  seed: string,
  bars: number
): { defs: { x: number; w: number }[]; width: number } {
  const rnd = seedStream(seed);
  const defs: { x: number; w: number }[] = [];
  let cursor = 0;
  for (let i = 0; i < bars; i++) {
    const w = rnd() < 0.32 ? 3 : 1;
    defs.push({ x: cursor, w });
    cursor += w + (rnd() < 0.25 ? 3 : 2);
  }
  return { defs, width: cursor };
}

export function BarcodeStrip({ seed, bars = 36 }: { seed: string; bars?: number }) {
  const { defs, width } = barcodeGeometry(seed, bars);
  return (
    <svg
      className="pcl-barcode"
      viewBox={`0 0 ${width} 12`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {defs.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.w} height={12} />
      ))}
    </svg>
  );
}

/** Index readout — `01 / 04`. */
export function IndexReadout({ index, total = "04" }: { index: string; total?: string }) {
  return (
    <span className="pcl-index">
      <span className="pcl-index__now">{index}</span>
      <span className="pcl-index__sep">/</span>
      <span className="pcl-index__total">{total}</span>
    </span>
  );
}

/** Workflow-mode badge — filled diamond marker + microcap word. */
export function ModeBadge({ mode }: { mode: CaseMode }) {
  return (
    <span className="pcl-mode" data-mode={mode}>
      <i className="pcl-mode__dia" aria-hidden="true" />
      {mode}
    </span>
  );
}

/** The case screenshot. Card 1 loads eagerly at high priority; cards 3–4
 *  lazy — the stack is ~4 viewports deep. */
export function CaseImage({ image, index }: { image: ProjectCase["image"]; index: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- raw public asset, hand-rolled per repo lab convention
    <img
      className="pcl-media__img"
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      decoding="async"
      loading={index >= 2 ? "lazy" : "eager"}
      fetchPriority={index === 0 ? "high" : "auto"}
    />
  );
}
