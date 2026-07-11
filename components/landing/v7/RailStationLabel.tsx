"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";

/**
 * RailStationLabel — the active section's identity, EMERGING FROM the
 * left HUD rail (ADR-030 Update 1: the rails become load-bearing
 * interface; section titles stop floating detached in content).
 *
 * A single fixed element docked mid-rail: gold station number + dawn
 * station name in the `.hud__rail__label` mono grammar. On section
 * change it scramble-decodes to the new label (captionScramble — the
 * terminal-text canon for mono microcopy) inside a clip-path wipe that
 * opens FROM the rail hairline.
 *
 * Data flow (all existing single-writers):
 *  - `useLandingScroll` publishes `data-active-station` on <html>
 *    (delta-gated, alongside its nav toggles);
 *  - the station's authored-but-previously-unused `data-screen-label`
 *    ("08A Tools") supplies the copy;
 *  - while `data-corridor-engaged` is true the label REDIRECTS to the
 *    corridor's section identity (ADR-030 Update 3):
 *    `CorridorStationHeaders`' rAF publishes a delta-gated
 *    `data-corridor-phase` on <html> and this component maps it to
 *    "02 Thesis" (the opening beat) / "03 Arc" (the whole
 *    Navigate→Encode→Build fly-through — one section). (On the WebGL
 *    fallback no corridor writer exists, so the corridor stretch simply
 *    keeps the label closed — the pre-Update-3 behavior.)
 *  - the hero shows NO rail title (the mark + wordmark own the first
 *    viewport); every later authored station keeps its
 *    `data-screen-label`.
 * Event-driven via one MutationObserver — zero per-frame work.
 *
 * Site-wide by design (Vince), desktop HUD only (the rails' own media
 * rules hide it below the HUD breakpoint). Reduced motion: text snaps,
 * wipe collapses (CSS).
 */
/** Corridor-phase → rail-label copy. The opening beat is the thesis; the
 *  whole Navigate→Encode→Build fly-through is ONE section, the Arc (owner,
 *  2026-07-11 — was per-stage navigate/encode/build). Numbers slot the
 *  corridor between "01 Hero" and "08 Services". */
const CORRIDOR_LABELS: Record<string, string> = {
  thesis: "02 Thesis",
  arc: "03 Arc",
};

function RailStationLabel() {
  const noRef = useRef<HTMLSpanElement | null>(null);
  const nameRef = useRef<HTMLSpanElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let lastShown = "";

    const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      raf = jobs.length ? requestAnimationFrame(tick) : 0;
    };

    const update = () => {
      const host = hostRef.current;
      const noEl = noRef.current;
      const nameEl = nameRef.current;
      if (!host || !noEl || !nameEl) return;

      const engaged = html.getAttribute("data-corridor-engaged") === "true";
      let label: string | null | undefined;
      if (engaged) {
        // Corridor: the phase owns the label (null hides — e.g. the WebGL
        // fallback where no corridor writer runs).
        const phase = html.getAttribute("data-corridor-phase");
        label = phase ? CORRIDOR_LABELS[phase] : null;
      } else {
        const key = html.getAttribute("data-active-station");
        // Hero shows no rail title — the first viewport is owned by the
        // mark + wordmark, not a station datum.
        label =
          key && key !== "hero"
            ? document
                .querySelector<HTMLElement>(`.station[data-station="${key}"]`)
                ?.getAttribute("data-screen-label")
            : null;
      }

      if (!label) {
        host.classList.remove("is-on");
        lastShown = "";
        return;
      }
      if (label === lastShown) {
        host.classList.add("is-on");
        return;
      }
      lastShown = label;

      // "08A Tools" → number chip + name run.
      const space = label.indexOf(" ");
      const no = space > 0 ? label.slice(0, space) : "";
      const name = space > 0 ? label.slice(space + 1) : label;

      host.classList.add("is-on");
      if (prm()) {
        noEl.textContent = no;
        nameEl.textContent = name;
        return;
      }
      const now = performance.now() / 1000;
      queueScramble(jobs, noEl, no, now + 0.05);
      queueScramble(jobs, nameEl, name, now + 0.12);
      if (!raf && jobs.length) raf = requestAnimationFrame(tick);
    };

    const observer = new MutationObserver(update);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-active-station", "data-corridor-engaged", "data-corridor-phase"],
    });
    update();

    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
      jobs.length = 0;
    };
  }, []);

  return (
    <div ref={hostRef} className="hud__rail__station" aria-hidden="true">
      <span ref={noRef} className="hud__rail__station__no" />
      <span ref={nameRef} className="hud__rail__station__name" />
    </div>
  );
}

interface RailStationPortalProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Mounts {@link RailStationLabel} into the `[data-rail-label-root]`
 * shell authored inside `.hud__rail--l` in the v7 prototype HTML, so
 * the label inherits the rail's exact positioning context. Same
 * nested-root lifecycle as ToolsPortal / ServicesPortal (root reuse
 * across Strict Mode remounts, deferred macrotask unmount).
 */
export function RailStationPortal({ containerRef }: RailStationPortalProps) {
  const rootRef = useRef<Root | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const slot = container.querySelector<HTMLElement>("[data-rail-label-root]");
    if (!slot) return;

    let root = rootRef.current;
    if (!root) {
      root = createRoot(slot);
      rootRef.current = root;
    }
    root.render(<RailStationLabel />);

    return () => {
      const r = rootRef.current;
      timerRef.current = window.setTimeout(() => {
        if (rootRef.current === r) {
          r?.unmount();
          rootRef.current = null;
        }
        timerRef.current = null;
      }, 0);
    };
  }, [containerRef]);

  return null;
}
