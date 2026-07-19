"use client";

import { type CSSProperties, useEffect, useState } from "react";

import { scrollToManifestEntry } from "@/lib/rail-manifest/clickToNavigate";
import { MANIFEST_ENTRIES, type ManifestEntryId } from "@/lib/rail-manifest/entries";
import {
  ACTIVE_IDX_ATTRIBUTES,
  LAST_CORRIDOR_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";
import { activeServiceForProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

import { SERVICES } from "./services/serviceData";

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
 * LAYOUT (ADR-031 Update 14 — the U7/U8 split; reel refinement Update 15):
 * both panels are vertical REELS pinned to a fixed centre line. The LEFT
 * rail's SECTIONS translate so the ACTIVE section sits inside a fixed gold
 * highlight at centre (the highlight never moves; the titles move to it).
 * The RIGHT rail's SUBSECTIONS — THE ARC's Navigate/Encode/Build, or the four
 * #services verbs, each `NAME NN` (index on the rail side), active sub lit
 * gold — translate so the ACTIVE sub lands on the SAME centre line, so the
 * highlighted section and its active subsection are horizontally aligned.
 * e.g. the centre line reads `THE ARC ▸ · · NAVIGATE 01`. Both panels are one
 * component; the reel offsets are the `--active-row` / `--active-sub` props.
 *
 * VISIBILITY: both panels are a section-contextual overlay — visible ONLY
 * while the reader is inside a section that carries subsections: the
 * corridor's Navigate/Encode/Build beats (THE ARC) OR #services. They fade
 * out everywhere else. The gate is pure CSS off the `<html>` bus
 * (`data-corridor-phase` / `data-active-station`, see home-v2.css); this
 * component keeps rendering + tracking so its content is correct the instant
 * it fades in. Outside those sections the left rail's detent diamond is the
 * indicator again (its desktop hide is scoped to the same windows).
 *
 * State is a pure read of existing single-writer signals — `resolveActiveIdx`
 * off the `<html>` attribute bus (no new scroll writer, ADR-002), plus the
 * services ring progress ref (`servicesRingProgressRef`, the register's
 * `activeServiceForProgress` source) polled on scroll while in #services
 * (the active service changes as the ring rotates, not via any attribute).
 * Desktop-only via CSS (register parity, ≥1101×760).
 */

const ARC_BEAT_IDS = new Set<ManifestEntryId>(["navigate", "encode", "build"]);
const SERVICES_ENTRY_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "services");

interface TreeSub {
  /** Beat `ManifestEntryId` or `ServiceId`. */
  id: string;
  num: string;
  name: string;
  /** MANIFEST_ENTRIES index a click scrolls to — a beat's own park, or
   *  #services for a service verb (the ring has no per-service scroll spot). */
  targetIdx: number;
}
interface TreeNode {
  id: string;
  num: string;
  name: string;
  entryIdx: number;
  subs?: TreeSub[];
}

/** Sections the menu does NOT list (owner, ADR-031 U16 rev a): the hero
 *  and the thesis are the approach — the journey menu starts at THE ARC.
 *  They stay in MANIFEST_ENTRIES (resolveActiveIdx still tracks them);
 *  they just never render as reel rows. While the reader is inside one
 *  of them the menu is CSS-hidden anyway (the section-contextual gate). */
const MENU_HIDDEN_IDS = new Set<ManifestEntryId>(["hero", "thesis"]);

/** Fold MANIFEST_ENTRIES into the display tree (THE ARC → CONTACT). The
 *  three Arc beats become THE ARC's subsections; #services carries the
 *  four service verbs as its own. Positional numbering for the top level. */
const JOURNEY_TREE: readonly TreeNode[] = (() => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const out: TreeNode[] = [];
  let pos = 0;
  MANIFEST_ENTRIES.forEach((entry, i) => {
    if (MENU_HIDDEN_IDS.has(entry.id)) return;
    if (ARC_BEAT_IDS.has(entry.id)) {
      if (entry.id === "navigate") {
        pos += 1;
        const subs: TreeSub[] = MANIFEST_ENTRIES.map((m, mi) => ({ m, mi }))
          .filter(({ m }) => ARC_BEAT_IDS.has(m.id))
          .map(({ m, mi }, j) => ({
            id: m.id,
            num: pad(j + 1),
            name: m.name.toUpperCase(),
            targetIdx: mi,
          }));
        out.push({ id: "arc", num: pad(pos), name: "THE ARC", entryIdx: i, subs });
      }
      return;
    }
    pos += 1;
    const node: TreeNode = {
      id: entry.id,
      num: pad(pos),
      name: entry.name.toUpperCase(),
      entryIdx: i,
    };
    if (entry.id === "services") {
      // The four service verbs (SOURCE BUS), in ring order — all scroll to
      // #services (the ring has no distinct per-service scroll target).
      node.subs = SERVICES.map((s) => ({
        id: s.id,
        num: s.index,
        name: s.verb,
        targetIdx: i,
      }));
    }
    out.push(node);
  });
  return out;
})();

const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function CorridorSectionMenu() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [serviceIdx, setServiceIdx] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    let scrollRaf = 0;
    // Scroll re-resolves while in the hero/corridor seam regime (the
    // geometric seam rule) OR while in #services (where the active service
    // changes on scroll as the ring rotates, not via any attribute).
    let watch = true;

    const update = () => {
      const next = resolveActiveIdx(html);
      watch = next <= LAST_CORRIDOR_IDX || next === SERVICES_ENTRY_IDX;
      setActiveIdx((prev) => (prev === next ? prev : next));
      if (next === SERVICES_ENTRY_IDX) {
        const svc = activeServiceForProgress(servicesRingProgressRef.current.progress);
        setServiceIdx((prev) => (prev === svc ? prev : svc));
      }
    };

    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: [...ACTIVE_IDX_ATTRIBUTES] });

    const onScroll = () => {
      if (!watch || scrollRaf) return;
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
  const activeIsServices = activeEntry?.id === "services";
  const activeTopId = activeIsBeat ? "arc" : (activeEntry?.id ?? "hero");
  // The section whose subsections unfold — THE ARC in the corridor, SERVICES
  // in #services; nothing elsewhere.
  const expandedTopId = activeIsBeat ? "arc" : activeIsServices ? "services" : null;
  const activeSubId = activeIsBeat
    ? activeEntry.id
    : activeIsServices
      ? (SERVICES[serviceIdx]?.id ?? null)
      : null;

  const go = (entryIdx: number) => {
    const entry = MANIFEST_ENTRIES[entryIdx];
    if (entry) scrollToManifestEntry(entry, prm());
  };

  // The section whose subsections fill the RIGHT panel (THE ARC or SERVICES).
  const expandedNode = expandedTopId
    ? (JOURNEY_TREE.find((n) => n.id === expandedTopId) ?? null)
    : null;

  // Reel offsets — both panels translate so the ACTIVE row lands on the fixed
  // centre line (the highlight stays put; the titles move to it). The active
  // section and its active subsection then share one horizontal line.
  const activeRowIdx = Math.max(
    0,
    JOURNEY_TREE.findIndex((n) => n.id === activeTopId)
  );
  const activeSubIdx = expandedNode
    ? Math.max(
        0,
        expandedNode.subs!.findIndex((s) => s.id === activeSubId)
      )
    : 0;

  return (
    <>
      {/* LEFT — the journey's sections, a vertical REEL: the list translates
          so the ACTIVE section sits on the fixed centre line inside the gold
          highlight (the highlight never moves; the titles move to it). A `▸`
          marks the two sections whose detail shows on the RIGHT panel. */}
      <nav
        className="home-v2-section-menu"
        aria-label="Journey sections"
        style={{ "--active-row": activeRowIdx } as CSSProperties}
      >
        <ul className="home-v2-section-menu__list">
          {JOURNEY_TREE.map((node) => {
            const active = node.id === activeTopId;
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
                  <span className="home-v2-section-menu__name">{node.name}</span>
                  {node.subs && (
                    <span className="home-v2-section-menu__disc" aria-hidden="true">
                      ▸
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* RIGHT — the active section's subsections (THE ARC's beats, or the
          four #services verbs), also a REEL: the active sub lands on the SAME
          centre line as the left highlight, so section ↔ subsection align.
          Empty (and CSS-hidden) outside the Arc / #services. */}
      <nav
        className="home-v2-section-submenu"
        aria-label="Section detail"
        aria-hidden={expandedNode ? undefined : true}
        style={{ "--active-sub": activeSubIdx } as CSSProperties}
      >
        {expandedNode && (
          <ul className="home-v2-section-submenu__list">
            {expandedNode.subs!.map((sub) => {
              const sActive = sub.id === activeSubId;
              return (
                <li
                  key={sub.id}
                  className="home-v2-section-submenu__item"
                  data-active={sActive || undefined}
                >
                  <button
                    type="button"
                    className="home-v2-section-submenu__row"
                    aria-current={sActive ? "true" : undefined}
                    onClick={() => go(sub.targetIdx)}
                  >
                    <span className="home-v2-section-submenu__name">{sub.name}</span>
                    <span className="home-v2-section-submenu__num" aria-hidden="true">
                      {sub.num}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </>
  );
}
