"use client";

import { useRef } from "react";

/**
 * ConsoleRail — the one strip every evidence plate switches on.
 *
 * Lifted from the Intelligence Map's reading rail (ADR-063: diamonds, mono
 * caps, a hairline spine, and ONE lit segment that TRAVELS to the station it
 * opened) and given to all four plates, so the panel reads as one instrument
 * changing what it displays rather than four boxes with four switches.
 *
 * ⚠ THE LABEL IS THE FUNCTION, AND NOTHING ELSE (owner, 2026-08-06). No
 * ordinal, no codename. The tools rail printed `01 · MÍMIR` over
 * `BRIEFING AGENT` and the films rail printed `01 / 02` — internal naming and
 * a position marker, on a surface where a visitor cannot know either. This
 * reverses the chrome half of ADR-056 U9's own ruling while keeping the half
 * that mattered: the functional name leads. That removal is also what made the
 * rails unifiable at all, since the two-line tools tab was ADR-064's stated
 * reason for keeping them apart.
 *
 * ⚠ ONE MARKER, NOT N. `.fl-con__spine` is a single element positioned off
 * `--rail-i` / `--rail-n` — giving each station its own underline is banned by
 * `.claude/rules/proof.md`, because a marker that reappears elsewhere is a
 * selected tab, and a marker that travels is an instrument pointing into the
 * field. Both custom properties come from `stations.length` / `activeIdx`, so
 * the strip works at two, three or four entries with no CSS per plate.
 *
 * ⚠ `data-n` IS THE TYPE RUNG. The map's station type (`clamp(10px, 1.75cqw,
 * 11.5px)` at `.16em`) is set for THREE centred stations; four-across with a
 * 22-character name is a different measurement, and the rung at `data-n="4"`
 * is the tools tab's own proven pair. The lever is always tracking and the
 * LABEL, never the size — the type law starts a tab at 10px.
 *
 * It is a `role="tablist"` with roving tabindex, which the map's `<nav>` was
 * not. Switching what a panel displays IS a tablist; "not a web tab strip"
 * (pda.css) is a statement about the LOOK — diamonds and a spine rather than
 * underlined text — and that look is preserved exactly.
 */

export interface ConsoleStation {
  /** Stable key. Not rendered. */
  id: string;
  /** The functional name. Rendered in mono caps, one line, ellipsised. */
  name: string;
}

interface ConsoleRailProps {
  stations: readonly ConsoleStation[];
  activeIdx: number;
  onActive: (idx: number) => void;
  /** Accessible name for the tablist — what this rail selects between. */
  label: string;
}

export function ConsoleRail({ stations, activeIdx, onActive, label }: ConsoleRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  const move = (i: number) => {
    if (i < 0 || i >= stations.length) return;
    onActive(i);
    railRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[i]?.focus();
  };

  return (
    <div
      className="fl-con__rail"
      role="tablist"
      aria-label={label}
      ref={railRef}
      data-n={stations.length}
      style={
        {
          "--rail-n": stations.length,
          "--rail-i": Math.max(0, Math.min(activeIdx, stations.length - 1)),
        } as React.CSSProperties
      }
    >
      {stations.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          className="fl-con__stn"
          data-on={i === activeIdx || undefined}
          aria-selected={i === activeIdx}
          tabIndex={i === activeIdx ? 0 : -1}
          onClick={() => onActive(i)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              move(i + 1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              move(i - 1);
            } else if (e.key === "Home") {
              e.preventDefault();
              move(0);
            } else if (e.key === "End") {
              e.preventDefault();
              move(stations.length - 1);
            }
          }}
        >
          <i aria-hidden="true" />
          <b>{s.name}</b>
        </button>
      ))}
      <i className="fl-con__spine" aria-hidden="true" />
    </div>
  );
}
