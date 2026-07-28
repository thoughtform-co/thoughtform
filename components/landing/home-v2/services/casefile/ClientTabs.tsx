"use client";

import { useRef } from "react";

/**
 * ClientTabs — the type-only client index seated on the section rule.
 *
 * No boxes: the active client is marked by gold ink plus an underline that
 * lands ON the rule below (the handoff's W2 cut — "underlined into the
 * rule"). The rule itself is drawn by the casefile, not here.
 *
 * Roving tabindex: exactly one tab is focusable, ←/→ and Home/End move the
 * selection and the focus together. With a single case in the registry this
 * is a one-row tablist — correct, and it makes the series legible without
 * shipping a placeholder client.
 */
export interface CasefileTab {
  slug: string;
  /** Tab ordinal, e.g. "01". */
  ix: string;
  /** Tab label, rendered in mono caps. */
  tab: string;
}

interface ClientTabsProps {
  tabs: readonly CasefileTab[];
  activeSlug: string;
  onSelect: (slug: string) => void;
  /** Id of the region the tabs govern. */
  controls: string;
}

export function ClientTabs({ tabs, activeSlug, onSelect, controls }: ClientTabsProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const activeIdx = Math.max(
    0,
    tabs.findIndex((t) => t.slug === activeSlug)
  );

  const move = (next: number) => {
    if (tabs.length < 2) return;
    const i = (next + tabs.length) % tabs.length;
    onSelect(tabs[i].slug);
    stripRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[i]?.focus();
  };

  return (
    <div className="fl-tabs" role="tablist" aria-label="Client case files" ref={stripRef}>
      {tabs.map((t, i) => {
        const on = i === activeIdx;
        return (
          <button
            key={t.slug}
            type="button"
            role="tab"
            id={`fl-tab-${t.slug}`}
            className="fl-tabs__tab"
            data-on={on || undefined}
            aria-selected={on}
            aria-controls={controls}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(t.slug)}
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
                move(tabs.length - 1);
              }
            }}
          >
            <span className="fl-tabs__ix">{t.ix}</span>
            <span className="fl-tabs__name">{t.tab}</span>
          </button>
        );
      })}

      {/* Not a tab: there is no archive surface yet, and a disabled tab in
          the tablist would break the roving index for no gain. It marks the
          format as a series, which is the whole reason the strip survives a
          single-case registry. */}
      <span className="fl-tabs__archive" aria-hidden="true">
        + Archive
      </span>
    </div>
  );
}
