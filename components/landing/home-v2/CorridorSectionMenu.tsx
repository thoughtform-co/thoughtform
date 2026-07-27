"use client";

import { type CSSProperties, useEffect, useState } from "react";

import { scrollToElementTop, scrollToManifestEntry } from "@/lib/rail-manifest/clickToNavigate";
import { MANIFEST_ENTRIES, type ManifestEntryId } from "@/lib/rail-manifest/entries";
import {
  ACTIVE_IDX_ATTRIBUTES,
  LAST_CORRIDOR_IDX,
  resolveActiveIdx,
} from "@/lib/rail-manifest/resolveActiveIdx";
import { activeServiceForProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { scrambleText } from "@/lib/home-v2/terminalReveal";

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
 * #services verbs, each `NAME NN` (index on the rail side), the active sub lit
 * gold with a GOLD UNDERLINE (the lighter subsection analog of the left's
 * inverse-video block — see home-v2.css) — translate so the ACTIVE sub lands on
 * the SAME centre line, so the highlighted section and its active subsection are
 * horizontally aligned.
 * e.g. the centre line reads `ARC ▸ · · NAVIGATE 01`. Both panels are one
 * component; the reel offsets are the `--active-row` / `--active-sub` props.
 *
 * TERMINAL REVEAL (Update 17): each time the menu ENTERS a section it belongs
 * to (the Arc or #services), its nav items "boot in" — the names decode-
 * scramble through random glyphs and resolve left-to-right, staggered
 * top-to-bottom (`scrambleText`, lib/home-v2/terminalReveal.ts) — instead of
 * a plain fade. Driven by a `menuVisible` effect that re-runs on every
 * (re-)entry and restores the text on leave; skipped under reduced motion.
 *
 * VISIBILITY (owner, 2026-07-19 — the menu PERSISTS across the journey):
 * the LEFT section reel is visible the whole way down, from THE ARC through
 * #contact — the active section keeps reeling to the fixed centre highlight
 * so the journey nav never disappears mid-scroll. The RIGHT subsection panel
 * stays section-contextual — shown ONLY where subsections exist (the
 * corridor's Navigate/Encode/Build beats, or #services). Both fade out in the
 * pre-Arc regime (hero / thesis). The gate is pure CSS off the `<html>` bus
 * (`data-corridor-phase` / `data-active-station`, see home-v2.css); this
 * component keeps rendering + tracking (its MutationObserver re-resolves the
 * active section on every `data-active-station` flip) so its content is
 * correct the instant it shows. The left rail's detent diamond remains the
 * indicator only in the pre-Arc regime.
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
const PROOF_ENTRY_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "proof");

/**
 * The `#proof` beats as menu rows — the deliberate mirror of THE ARC's
 * Navigate / Encode / Build (ADR-054). Duplicated from `lib/cases`
 * rather than imported: this is a client component, and importing the
 * registry would ship every case's copy in the landing bundle for three
 * labels. LOCKSTEP with `caseBeatMenu(PROOF_CASE)`, pinned by
 * `tests/lib/cases-registry.test.ts`.
 */
export const PROOF_SUBS: readonly { id: string; num: string; name: string }[] = [
  { id: "proof-navigate", num: "01", name: "NAVIGATE" },
  { id: "proof-encode", num: "02", name: "ENCODE" },
  { id: "proof-build", num: "03", name: "BUILD" },
];

/** Viewport fraction a beat's centre is measured against when resolving
 *  which `#proof` beat is active — the `pickActivePhase` seat. */
const PROOF_BEAT_SEAT = 0.4;

interface TreeSub {
  /** Beat `ManifestEntryId`, `ServiceId`, or a `#proof` beat id. */
  id: string;
  num: string;
  name: string;
  /** MANIFEST_ENTRIES index a click scrolls to — a beat's own park, or
   *  #services for a service verb (the ring has no per-service scroll spot). */
  targetIdx: number;
  /** DOM id a click scrolls to instead, for subsections that live INSIDE
   *  a station and so have no manifest entry (the `#proof` beats). */
  anchorId?: string;
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
        out.push({ id: "arc", num: pad(pos), name: "ARC", entryIdx: i, subs });
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
    if (entry.id === "proof") {
      // The case's three Arc beats. Unlike the service verbs these DO
      // have distinct scroll targets — each beat is a full-height block
      // with its own DOM id — so they carry an anchorId (ADR-054).
      node.subs = PROOF_SUBS.map((s) => ({
        id: s.id,
        num: s.num,
        name: s.name,
        targetIdx: i,
        anchorId: s.id,
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
  const [proofIdx, setProofIdx] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    let scrollRaf = 0;
    // Scroll re-resolves while in the hero/corridor seam regime (the
    // geometric seam rule), while in #services (where the active service
    // changes on scroll as the ring rotates, not via any attribute), or
    // while in #proof (whose active beat is a rect read, same reason).
    let watch = true;

    const update = () => {
      const next = resolveActiveIdx(html);
      watch = next <= LAST_CORRIDOR_IDX || next === SERVICES_ENTRY_IDX || next === PROOF_ENTRY_IDX;
      setActiveIdx((prev) => (prev === next ? prev : next));
      if (next === SERVICES_ENTRY_IDX) {
        const svc = activeServiceForProgress(servicesRingProgressRef.current.progress);
        setServiceIdx((prev) => (prev === svc ? prev : svc));
      }
      if (next === PROOF_ENTRY_IDX) {
        // The beat whose centre sits nearest the reading seat. A pure
        // rect READ on an existing scroll callback — no new writer
        // (ADR-002), same class as resolveActiveIdx's own seam rule.
        const seat = window.innerHeight * PROOF_BEAT_SEAT;
        let best = 0;
        let bestDist = Infinity;
        PROOF_SUBS.forEach((sub, i) => {
          const el = document.getElementById(sub.id);
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.top + rect.height / 2 - seat);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });
        setProofIdx((prev) => (prev === best ? prev : best));
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
  const activeIsProof = activeEntry?.id === "proof";
  const activeTopId = activeIsBeat ? "arc" : (activeEntry?.id ?? "hero");

  // Terminal decode-in: each time the menu ENTERS a section it belongs to
  // (the Arc or #services — where it fades in), its nav items "boot" by
  // scrambling through random glyphs and resolving left-to-right, staggered
  // top-to-bottom (a console decode, not a plain fade). Re-runs on every
  // (re-)entry via the `menuVisible` dependency; cleans up (restores text)
  // on leave / re-trigger. Skipped under reduced motion. Mono font ⇒ no
  // layout thrash (see terminalReveal.ts).
  //
  // SCOPED TO THE REEL LISTS — never the pinned highlights (bug, owner
  // 2026-07-20: "the left menu is missing About; Arc is shown twice").
  // `scrambleText` CAPTURES textContent at call time and its cleanup
  // force-writes that captured string back. That is only safe on nodes whose
  // text is CONSTANT — the reel rows, one fixed section name each. Both
  // highlights are the opposite: their text is React-owned and re-renders on
  // every section change (`activeTopNode.name` / `activeSubNode`). An
  // unscoped selector therefore staled the highlight — leaving #services for
  // #about, React committed "ABOUT", then this effect's cleanup (deps
  // [menuVisible], which flips false on that same transition, so cleanup runs
  // AFTER the commit) wrote the captured "THE ARC" back over it. React never
  // repaired it: its vdom already read "ABOUT", so no further mutation. With
  // the live ABOUT reel row `visibility: hidden` (it is `[data-active]`, U19),
  // the section vanished and THE ARC appeared twice. Keep the highlights out
  // of any textContent-writing effect; they read as the LOCKED readout and do
  // not decode.
  const menuVisible = activeIsBeat || activeIsServices || activeIsProof;
  useEffect(() => {
    if (!menuVisible || prm()) return;
    const STAGGER_MS = 45;
    const DUR_MS = 330;
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".home-v2-section-menu__list .home-v2-section-menu__name, .home-v2-section-submenu__list .home-v2-section-submenu__num, .home-v2-section-submenu__list .home-v2-section-submenu__name"
      )
    );
    const cleanups = nodes.map((el, i) => scrambleText(el, i * STAGGER_MS, DUR_MS));
    return () => cleanups.forEach((fn) => fn());
  }, [menuVisible]);

  // The section whose subsections unfold — THE ARC in the corridor,
  // SERVICES in #services, the case's beats in #proof; nothing elsewhere.
  const expandedTopId = activeIsBeat
    ? "arc"
    : activeIsServices
      ? "services"
      : activeIsProof
        ? "proof"
        : null;
  const activeSubId = activeIsBeat
    ? activeEntry.id
    : activeIsServices
      ? (SERVICES[serviceIdx]?.id ?? null)
      : activeIsProof
        ? (PROOF_SUBS[proofIdx]?.id ?? null)
        : null;

  const go = (entryIdx: number) => {
    const entry = MANIFEST_ENTRIES[entryIdx];
    if (entry) scrollToManifestEntry(entry, prm());
  };

  /** Subsection click: an in-station beat scrolls to its own anchor;
   *  everything else falls back to its manifest entry. */
  const goSub = (sub: TreeSub) => {
    if (sub.anchorId) scrollToElementTop(sub.anchorId, prm());
    else go(sub.targetIdx);
  };

  // The section whose subsections fill the RIGHT panel (THE ARC or SERVICES).
  const expandedNode = expandedTopId
    ? (JOURNEY_TREE.find((n) => n.id === expandedTopId) ?? null)
    : null;

  // Reel offsets — both panels translate so the ACTIVE row lands on the fixed
  // centre line. The highlight itself is a SEPARATE element pinned to that
  // line (see below); the reel just glides the names behind it.
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

  // The node whose content the FIXED highlight mirrors. The highlight is
  // decoupled from the reel so it can never ride the list translate — the
  // reason the gold block used to briefly jump a row and glide back on every
  // section change (the `data-active` swap is instant; the reel transform
  // eases over 320ms, so a highlight painted on the active row lagged behind
  // it). Pinned on the centre line, it only ever changes its TEXT.
  const activeTopNode = JOURNEY_TREE[activeRowIdx];
  const activeSubNode = expandedNode?.subs?.[activeSubIdx] ?? null;

  return (
    <>
      {/* LEFT — the journey's sections, a vertical REEL. The list translates so
          the active section rides to the fixed centre line; the gold highlight
          is a SEPARATE element pinned on that line (never in the reel), so the
          names glide THROUGH it and it can't jump. A `▸` marks the sections
          whose detail shows on the RIGHT panel. */}
      <nav
        className="home-v2-section-menu"
        aria-label="Journey sections"
        style={{ "--active-row": activeRowIdx } as CSSProperties}
      >
        {/* Pinned highlight — mirrors the active section, centre-line only. */}
        <div className="home-v2-section-menu__highlight" aria-hidden="true">
          <span className="home-v2-section-menu__name">{activeTopNode.name}</span>
          {activeTopNode.subs && <span className="home-v2-section-menu__disc">▸</span>}
        </div>
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
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* RIGHT — the active section's subsections (THE ARC's beats, or the
          four #services verbs), also a REEL with a pinned highlight on the SAME
          centre line as the left one, so section ↔ subsection align. Empty
          (and CSS-hidden) outside the Arc / #services. */}
      <nav
        className="home-v2-section-submenu"
        aria-label="Section detail"
        aria-hidden={expandedNode ? undefined : true}
        style={{ "--active-sub": activeSubIdx } as CSSProperties}
      >
        {expandedNode && (
          <>
            {/* Pinned highlight — mirrors the active subsection. */}
            <div className="home-v2-section-submenu__highlight" aria-hidden="true">
              <span className="home-v2-section-submenu__name">{activeSubNode?.name}</span>
              <span className="home-v2-section-submenu__num">{activeSubNode?.num}</span>
            </div>
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
                      onClick={() => goSub(sub)}
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
          </>
        )}
      </nav>
    </>
  );
}
