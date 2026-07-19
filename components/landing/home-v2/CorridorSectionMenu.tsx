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
 * VISIBILITY: it is a section-contextual overlay — visible ONLY while the
 * reader is inside a section that carries subsections: the corridor's
 * Navigate/Encode/Build beats (THE ARC) OR #services (the four service
 * verbs). It fades out everywhere else. The gate is pure CSS off the
 * `<html>` bus (`data-corridor-phase` / `data-active-station`, see
 * home-v2.css); this component keeps rendering + tracking so its content is
 * correct the instant it fades in. Outside those sections the left rail's
 * detent diamond is the indicator again (its desktop hide is scoped to the
 * same windows). The full 8-station journey is shown while visible; the
 * ACTIVE section is an inverse-video block while every other section
 * RECEDES on a shallow 3D rolodex wheel (Update 13): each row tilts on X
 * and falls back on Z by its distance from the active row (`rolodexStyle`),
 * so the section you're in sits forward + flat + crisp and the rest curve
 * away and dim. The active section unfolds its subsections with the active
 * one lit + a blinking cursor.
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
  hideActiveName?: boolean;
  subs?: TreeSub[];
}

/** Fold MANIFEST_ENTRIES into the 8-station display tree. The three Arc
 *  beats become THE ARC's subsections; #services carries the four service
 *  verbs as its own. Positional numbering (01..08) for the top level. */
const JOURNEY_TREE: readonly TreeNode[] = (() => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const out: TreeNode[] = [];
  let pos = 0;
  MANIFEST_ENTRIES.forEach((entry, i) => {
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
      hideActiveName: entry.hideActiveName,
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

/**
 * Rolodex depth for a row, keyed to its signed distance from the ACTIVE row.
 * The section you're in sits forward and flat (offset 0 → no transform); every
 * other row tilts on X and recedes on Z (a shallow wheel) and dims, so the
 * further a section is from where you are, the more it falls away. Squared
 * depth/dim give the wheel its foreshortened curve; the rotation is capped so
 * far rows stay legible rather than folding edge-on. Flattened under
 * prefers-reduced-motion in CSS.
 */
function rolodexStyle(offset: number): CSSProperties {
  const rot = Math.max(-40, Math.min(40, offset * -10));
  const depth = -Math.min(150, offset * offset * 8);
  const dim = Math.max(0.3, 1 - offset * offset * 0.07);
  return {
    "--row-rot": `${rot}deg`,
    "--row-depth": `${depth}px`,
    "--row-dim": `${dim}`,
  } as CSSProperties;
}

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

  // The active row's position in the display tree — the rolodex pivots around
  // it (its row is offset 0 → forward + flat).
  const activeDisplayIdx = JOURNEY_TREE.findIndex((n) => n.id === activeTopId);

  return (
    <nav className="home-v2-section-menu" aria-label="Journey sections">
      <ul className="home-v2-section-menu__list">
        {JOURNEY_TREE.map((node, i) => {
          const active = node.id === activeTopId;
          const expanded = node.id === expandedTopId;
          const showSubs = !!node.subs && expanded;
          return (
            <li
              key={node.id}
              className="home-v2-section-menu__item"
              data-active={active || undefined}
              style={rolodexStyle(i - activeDisplayIdx)}
            >
              <button
                type="button"
                className="home-v2-section-menu__row"
                aria-current={active ? "true" : undefined}
                onClick={() => go(node.entryIdx)}
              >
                <span className="home-v2-section-menu__name">
                  {node.hideActiveName && active ? "····" : node.name}
                </span>
                {node.subs && (
                  <span className="home-v2-section-menu__disc" aria-hidden="true">
                    {expanded ? "▾" : "▸"}
                  </span>
                )}
              </button>

              {showSubs && (
                <ul className="home-v2-section-menu__subs">
                  {node.subs!.map((sub) => {
                    const sActive = sub.id === activeSubId;
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
                          onClick={() => go(sub.targetIdx)}
                        >
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
