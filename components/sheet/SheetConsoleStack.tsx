"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import { useStackedCardsScroll } from "@/components/landing/v7/tools-cards/useStackedCardsScroll";

/**
 * SheetConsoleStack — the pile's runway (ADR-114).
 *
 * The MECHANISM is shared (`useStackedCardsScroll` is three-free and already
 * drives the proof stack and the project-cards lab); the SKIN is the sheet's
 * own, copied into `sheet.css` as `--sh-*`. The hook reads each slot's
 * computed `position`/`top` and writes `--pc-enter` / `--pc-cover` /
 * `--pc-depth` inline; on the inert rung (≤960, ≤680 tall, reduced motion)
 * the slots resolve static and every card parks pinned.
 */
export function SheetConsoleStack({ n, children }: { n: number; children: ReactNode }) {
  const runwayRef = useRef<HTMLDivElement>(null);
  useStackedCardsScroll(runwayRef);
  return (
    <div ref={runwayRef} className="sh-console__stack" style={{ "--sh-n": n } as CSSProperties}>
      {children}
      <div className="sh-console__tail" aria-hidden="true" />
    </div>
  );
}
