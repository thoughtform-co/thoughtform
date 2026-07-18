"use client";

import { useEffect, useState } from "react";

import { scrollToManifestEntry } from "@/lib/rail-manifest/clickToNavigate";
import { MANIFEST_ENTRIES, type ManifestEntryId } from "@/lib/rail-manifest/entries";
import {
  ACTIVE_IDX_ATTRIBUTES,
  LAST_CORRIDOR_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";

/**
 * CorridorSectionMenu — the left-side journey overview (ADR-031 Update 12).
 *
 * A detached terminal-tree section menu that returns the section +
 * subsection overview to the LEFT of the corridor, near the rail but not
 * on it. It replaces the right-rail Arc register (`CorridorProgressRail`)
 * and, on desktop, the left rail's detent diamond — the tree is now the
 * journey indicator (Updates 7–9 are superseded; the reversal is
 * deliberate and owner-driven).
 *
 * The full 8-station journey is always shown; the ACTIVE section is an
 * inverse-video block while every other section RECEDES (smaller, tighter,
 * dim) so the active context dominates. The Arc unfolds its three beats
 * (Navigate / Encode / Build) ONLY while the reader is inside the corridor
 * arc, with the active beat lit and a blinking cursor.
 *
 * State is a pure read of the same single-writer `<html>` attribute bus
 * the rail manifest uses (`resolveActiveIdx`) — no new scroll writer
 * (ADR-002). Wake sources mirror `RailManifestController`: a
 * MutationObserver on the active-index attributes + a hero/corridor-gated
 * passive scroll listener for the seam-gap geometric rule. Desktop-only
 * via CSS (register parity, ≥1101×760).
 */

const ARC_BEAT_IDS = new Set<ManifestEntryId>(["navigate", "encode", "build"]);

interface TreeSub {
  id: ManifestEntryId;
  num: string;
  name: string;
  entryIdx: number;
}
interface TreeNode {
  id: string;
  num: string;
  name: string;
  entryIdx: number;
  hideActiveName?: boolean;
  subs?: TreeSub[];
}

/** Fold MANIFEST_ENTRIES into the 8-station display tree — the three Arc
 *  beats become THE ARC's subsections; positional numbering (01..08). */
const JOURNEY_TREE: readonly TreeNode[] = (() => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const out: TreeNode[] = [];
  let pos = 0;
  MANIFEST_ENTRIES.forEach((entry, i) => {
    if (ARC_BEAT_IDS.has(entry.id)) {
      if (entry.id === "navigate") {
        pos += 1;
        const subs = MANIFEST_ENTRIES.map((m, mi) => ({ m, mi }))
          .filter(({ m }) => ARC_BEAT_IDS.has(m.id))
          .map(({ m, mi }, j) => ({
            id: m.id,
            num: pad(j + 1),
            name: m.name.toUpperCase(),
            entryIdx: mi,
          }));
        out.push({ id: "arc", num: pad(pos), name: "THE ARC", entryIdx: i, subs });
      }
      return;
    }
    pos += 1;
    out.push({
      id: entry.id,
      num: pad(pos),
      name: entry.name.toUpperCase(),
      entryIdx: i,
      hideActiveName: entry.hideActiveName,
    });
  });
  return out;
})();

const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function CorridorSectionMenu() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    let scrollRaf = 0;
    let seamWatch = true; // scroll re-resolve only in the hero/corridor regime

    const update = () => {
      const next = resolveActiveIdx(html);
      seamWatch = next <= LAST_CORRIDOR_IDX;
      setActiveIdx((prev) => (prev === next ? prev : next));
    };

    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: [...ACTIVE_IDX_ATTRIBUTES] });

    // The seam-gap rule is geometric — attribute mutations can't see the
    // corridor mount crossing viewport-mid, so a passive scroll listener
    // re-resolves, gated to the hero/corridor regime and rAF-coalesced.
    const onScroll = () => {
      if (!seamWatch || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
    };
  }, []);

  const activeEntry = MANIFEST_ENTRIES[activeIdx];
  const activeIsBeat = !!activeEntry && ARC_BEAT_IDS.has(activeEntry.id);
  const activeTopId = activeIsBeat ? "arc" : (activeEntry?.id ?? "hero");
  const activeSubId = activeIsBeat ? activeEntry.id : null;
  const expanded = activeIsBeat; // subsections show ONLY while inside the Arc

  const go = (entryIdx: number) => {
    const entry = MANIFEST_ENTRIES[entryIdx];
    if (entry) scrollToManifestEntry(entry, prm());
  };

  const lastIdx = JOURNEY_TREE.length - 1;

  return (
    <nav className="home-v2-section-menu" aria-label="Journey sections">
      <div className="home-v2-section-menu__head" aria-hidden="true">
        TF://JOURNEY — {String(JOURNEY_TREE.length).padStart(2, "0")} STN
      </div>
      <ul className="home-v2-section-menu__list">
        {JOURNEY_TREE.map((node, i) => {
          const active = node.id === activeTopId;
          const isArc = node.id === "arc";
          const showSubs = isArc && expanded && node.subs;
          return (
            <li
              key={node.id}
              className="home-v2-section-menu__item"
              data-active={active || undefined}
            >
              <button
                type="button"
                className="home-v2-section-menu__row"
                aria-current={active ? "true" : undefined}
                onClick={() => go(node.entryIdx)}
              >
                <span className="home-v2-section-menu__branch" aria-hidden="true">
                  {i === lastIdx ? "└─" : "├─"}
                </span>
                <span className="home-v2-section-menu__name">
                  {node.hideActiveName && active ? "····" : node.name}
                </span>
                {isArc && (
                  <span className="home-v2-section-menu__disc" aria-hidden="true">
                    {expanded ? "▾" : "▸"}
                  </span>
                )}
              </button>

              {showSubs && (
                <ul className="home-v2-section-menu__subs">
                  {node.subs!.map((sub, j) => {
                    const sActive = sub.id === activeSubId;
                    const subLast = j === node.subs!.length - 1;
                    return (
                      <li
                        key={sub.id}
                        className="home-v2-section-menu__subitem"
                        data-active={sActive || undefined}
                      >
                        <button
                          type="button"
                          className="home-v2-section-menu__subrow"
                          aria-current={sActive ? "true" : undefined}
                          onClick={() => go(sub.entryIdx)}
                        >
                          <span className="home-v2-section-menu__pipe" aria-hidden="true">
                            {`│   ${subLast ? "└─" : "├─"}`}
                          </span>
                          <span className="home-v2-section-menu__subname">
                            ·{sub.num} {sub.name}
                          </span>
                          {sActive && (
                            <span className="home-v2-section-menu__cursor" aria-hidden="true">
                              █
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
