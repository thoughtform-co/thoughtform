"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { ArcMenuItem } from "./ArcShell";

/**
 * ArcMenu — the left reel TOC for a detail arc page. It carries the
 * corridor section-menu grammar, copied into `.arc-menu` with its own
 * visibility gate (the corridor version keyed off `html[data-corridor-*]`
 * attributes no arc page writes, so this one shows once the page scrolls
 * past the hero — `data-arc-scrolled` on the arc root, written by
 * useArcScroll — at desktop sizes only).
 *
 * NOTE: the corridor original is RETIRED (ADR-055 moved the landing's
 * journey indicator into the nav corner, because the reel only existed
 * above 1101×760). This copy is now the sole owner of the grammar. The
 * same complaint applies here and porting the corner readout to /arcs is
 * the open follow-up — deck pages may genuinely want a TOC, so it was
 * left as a separate decision rather than swept along.
 * Active index comes from one IntersectionObserver over the section
 * elements (a mid-viewport band), never a scroll listener.
 */
export function ArcMenu({ items }: { items: readonly ArcMenuItem[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    // Under terminal motion (ADR-057) the section is a RUNWAY several
    // viewports tall, so watch its sticky stage instead: the stage is
    // what the reader is actually looking at, and the flip then lands
    // when the next beat parks rather than half a runway early. Reveal
    // pages have no stage and fall back to the section itself.
    const watched = new Map<Element, number>();
    items.forEach((item, idx) => {
      const section = document.getElementById(item.id);
      if (!section) return;
      watched.set(section.querySelector(".arc-stage") ?? section, idx);
    });
    if (watched.size === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = watched.get(entry.target);
          if (idx !== undefined && idx !== activeRef.current) {
            activeRef.current = idx;
            setActiveIdx(idx);
          }
        }
      },
      // A thin band at the viewport midline — the section crossing it
      // is the active one.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    watched.forEach((_, el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const active = items[activeIdx];

  return (
    <nav
      className="arc-menu"
      aria-label="Page sections"
      style={{ "--active-row": activeIdx } as CSSProperties}
    >
      <div className="arc-menu__highlight" aria-hidden="true">
        <span className="arc-menu__name">{active?.label}</span>
        <span className="arc-menu__disc">▸</span>
      </div>
      <ul className="arc-menu__list">
        {items.map((item, i) => (
          <li key={item.id} className="arc-menu__item" data-active={i === activeIdx || undefined}>
            <button
              type="button"
              className="arc-menu__row"
              aria-current={i === activeIdx ? "true" : undefined}
              onClick={() => scrollTo(item.id)}
            >
              <span className="arc-menu__name">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
