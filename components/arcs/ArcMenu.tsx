"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type { ArcMenuItem } from "./ArcShell";

/**
 * ArcMenu — the left reel TOC for a detail arc page. The corridor
 * section-menu grammar (home-v2.css `.home-v2-section-menu`) copied to
 * `.arc-menu` with its own visibility gate: the corridor version keys
 * off `html[data-corridor-*]` attributes no arc page writes, so this
 * one shows once the page scrolls past the hero (`data-arc-scrolled`
 * on the arc root, written by useArcScroll) at desktop sizes only.
 * Active index comes from one IntersectionObserver over the section
 * elements (a mid-viewport band), never a scroll listener.
 */
export function ArcMenu({ items }: { items: readonly ArcMenuItem[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).id;
          const idx = items.findIndex((item) => item.id === id);
          if (idx >= 0 && idx !== activeRef.current) {
            activeRef.current = idx;
            setActiveIdx(idx);
          }
        }
      },
      // A thin band at the viewport midline — the section crossing it
      // is the active one.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((section) => io.observe(section));
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
