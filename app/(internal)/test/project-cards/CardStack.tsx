"use client";

import { useRef, type ComponentType, type CSSProperties } from "react";
import {
  NotchOutline,
  PROJECT_CASES,
  ToolCardConsole,
  useStackedCardsScroll,
  type Corner,
  type ProjectCase,
} from "@/components/landing/v7/tools-cards";
import { CardV1 } from "./CardV1";
import { CardV3 } from "./CardV3";
import { CardV4 } from "./CardV4";
import { CardV5 } from "./CardV5";

export interface ProjectCardProps {
  data: ProjectCase;
  index: number;
}

export type VariantId = "v1" | "v2" | "v3" | "v4" | "v5";

export interface VariantChrome {
  id: VariantId;
  /** Chip label in the switcher. */
  label: string;
  corner: Corner;
  /** Chamfer size in px → `--ch` on `.pcl-card`. */
  notch: number;
  stroke: "solid" | "dashed";
  Card: ComponentType<ProjectCardProps>;
}

/** Registry: variant id → chrome geometry + skin. */
export const VARIANT_CHROME: Record<VariantId, VariantChrome> = {
  v1: { id: "v1", label: "V1 Dossier", corner: "tr", notch: 40, stroke: "solid", Card: CardV1 },
  // V2 is the SHIPPED landing skin (ToolCardConsole, promoted per ADR-030);
  // the lab mounts the production component so look-dev never drifts.
  v2: {
    id: "v2",
    label: "V2 Console",
    corner: "bl",
    notch: 24,
    stroke: "solid",
    Card: ToolCardConsole,
  },
  v3: { id: "v3", label: "V3 Terminal", corner: "tr", notch: 32, stroke: "solid", Card: CardV3 },
  v4: { id: "v4", label: "V4 Spec", corner: "br", notch: 48, stroke: "dashed", Card: CardV4 },
  v5: { id: "v5", label: "V5 Ledger", corner: "tr", notch: 24, stroke: "solid", Card: CardV5 },
};

export const VARIANT_IDS = Object.keys(VARIANT_CHROME) as VariantId[];

/** Lab-only geometry. Production geometry is CSS-owned (ADR-030 Update 2). */
const LAB_STACK = { count: PROJECT_CASES.length, topBase: 16, peek: 48 } as const;

/**
 * CardStack — the vorszk-style sticky-sibling stack.
 *
 * Each `.pcl-slot` is `position: sticky` with a cascading top offset; the
 * covering card is literally the next sibling scrolling up. Slots carry
 * explicit z-index (never rely on tree-order painting of sticky elements)
 * and are POSITIONING ONLY — the recession transform and the notch clip
 * live on `.pcl-card` inside, so sticky never sits under a transform.
 */
export function CardStack({ variant }: { variant: VariantId }) {
  const runwayRef = useRef<HTMLElement | null>(null);
  useStackedCardsScroll(runwayRef);

  const chrome = VARIANT_CHROME[variant];
  const { Card } = chrome;

  return (
    <section
      ref={runwayRef}
      className={`pcl-stack pcl-stack--${variant}`}
      data-pc-active="0"
      aria-label={`${chrome.label} card stack`}
      style={
        {
          "--pc-top-base": `${LAB_STACK.topBase}px`,
          "--pc-peek": `${LAB_STACK.peek}px`,
          "--pc-n": LAB_STACK.count,
        } as CSSProperties
      }
    >
      {PROJECT_CASES.map((data, i) => (
        <div
          key={data.id}
          className="pcl-slot"
          data-pc-slot
          data-pc-index={i}
          style={{ "--i": i, zIndex: i + 1 } as CSSProperties}
        >
          <article
            className="pcl-card"
            data-corner={chrome.corner}
            data-stroke={chrome.stroke}
            aria-label={`${data.codename}: ${data.tagline}`}
            style={{ "--ch": `${chrome.notch}px` } as CSSProperties}
          >
            <Card data={data} index={i} />
            <NotchOutline corner={chrome.corner} notch={chrome.notch} />
            <div className="pcl-card__dim" aria-hidden="true" />
          </article>
        </div>
      ))}

      <div className="pcl-stack__tail" aria-hidden="true" />
    </section>
  );
}
