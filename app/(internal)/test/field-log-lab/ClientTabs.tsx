"use client";

import { useRef } from "react";

import { FIELD_LOG_CHROME, type FlClient } from "./fieldLogData";

/**
 * ClientTabs — the type-only client index seated on the section rule.
 *
 * No boxes: the active client is marked by gold ink plus an underline that
 * lands ON the rule below (the handoff's W2 cut — "underlined into the
 * rule"). The rule itself is drawn by the casefile, not here, so variant `c`
 * can delete it without touching the tab strip.
 *
 * Roving tabindex: exactly one tab is focusable, ←/→ and Home/End move the
 * selection and the focus together.
 */
interface ClientTabsProps {
  clients: readonly FlClient[];
  activeSlug: string;
  onSelect: (slug: string) => void;
  /** Id of the region the tabs govern. */
  controls: string;
}

export function ClientTabs({ clients, activeSlug, onSelect, controls }: ClientTabsProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const activeIdx = Math.max(
    0,
    clients.findIndex((c) => c.slug === activeSlug)
  );

  const move = (next: number) => {
    const i = (next + clients.length) % clients.length;
    onSelect(clients[i].slug);
    stripRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[i]?.focus();
  };

  return (
    <div className="fll-tabs" role="tablist" aria-label="Client casefiles" ref={stripRef}>
      {clients.map((c, i) => {
        const on = i === activeIdx;
        return (
          <button
            key={c.slug}
            type="button"
            role="tab"
            id={`fll-tab-${c.slug}`}
            className="fll-tabs__tab"
            data-on={on || undefined}
            aria-selected={on}
            aria-controls={controls}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(c.slug)}
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
                move(clients.length - 1);
              }
            }}
          >
            <span className="fll-tabs__ix">{c.ix}</span>
            <span className="fll-tabs__name">{c.tab}</span>
          </button>
        );
      })}

      {/* Not a tab: there is no archive surface yet, and a disabled tab in
          the tablist would break the roving index for no gain. */}
      <span className="fll-tabs__archive" aria-hidden="true">
        {FIELD_LOG_CHROME.archive}
      </span>
    </div>
  );
}
