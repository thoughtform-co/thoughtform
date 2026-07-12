"use client";

import { useEffect } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { CORRIDOR_MOUNT_ID, MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";

/**
 * RailManifestController — the left rail's station manifest (ADR-031).
 *
 * The manifest markup (one bracketed slot per journey entry) is
 * injected at PARSE time by `lib/v7-parse/railManifest.ts`, so the
 * rail paints its sockets on first load with no client reflow. This
 * controller is a null-rendering component that MUTATES that injected
 * DOM — never `createRoot` into `[data-rail-manifest-root]` (it would
 * clobber the server skeleton). Precedent: `useLandingScroll` writing
 * `#depthIndicator`.
 *
 * Entry states are a pure function of scroll position — one integer
 * `activeIdx`: entries before it are `seated` (module in its bay),
 * after it `upcoming` (empty socket), at it `active` (the only entry
 * that materializes its number + name, scramble-decoded — absorbing
 * the retired RailStationLabel). Reverse scroll reconstructs by
 * construction; the seat garnish (quantized snap + gold blink) is
 * forward-only, time-boxed via `data-just-seated`.
 *
 * activeIdx resolution (all existing single-writer attributes):
 *   1. `data-corridor-engaged` → the entry matching
 *      `data-corridor-phase` (thesis fallback — the WebGL fallback has
 *      no corridor writer);
 *   2. else `data-active-station` → its station entry;
 *   3. seam-gap fix: if that yields hero but the corridor mount sits
 *      above viewport-mid, the corridor has been PASSED → Arc. (The
 *      mount is not a `.station`, so `data-active-station` lags at
 *      "hero" between corridor disengage and the services crossing.)
 *
 * Wake sources: one MutationObserver on <html> + a passive scroll
 * listener that only works while in the hero/corridor regime (rule 3
 * is geometric) + resize. rAF alive only while a scramble runs — the
 * ToolsRailRegister discipline.
 *
 * The services→tools crossing is the hero moment: the same
 * `data-active-station` flip that drives the tools header type-on and
 * the right register's handover (HANDOVER_FADE_S) seats the services
 * module — the layered-stack glyph (the folded card ring) snaps into
 * its bay. One clock, three consumers.
 */

const SEAT_GARNISH_MS = 950;
/** Forward fast-travel: crossed entries seat in a cascade. */
const GARNISH_STAGGER_MS = 90;

const THESIS_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "thesis");
const ARC_IDX = MANIFEST_ENTRIES.findIndex((e) => e.id === "arc");

interface RailManifestControllerProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

export function RailManifestController({ containerRef }: RailManifestControllerProps) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Absent shell (e.g. /claude-workshop parses a prototype without
    // the manifest nav) → clean no-op.
    const nav = container.querySelector<HTMLElement>("[data-rail-manifest-root]");
    if (!nav) return;
    const entries = Array.from(nav.querySelectorAll<HTMLButtonElement>(".rail-manifest__entry"));
    if (entries.length !== MANIFEST_ENTRIES.length) return;
    const labels = entries.map((el) => el.querySelector<HTMLElement>(".rail-manifest__label"));
    const names = entries.map((el) => el.querySelector<HTMLElement>(".rail-manifest__name"));

    const html = document.documentElement;
    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let scrollRaf = 0;
    const garnishTimers = new Map<number, number>();
    let activeIdx = -1; // forces the first update() to paint
    let hoverIdx: number | null = null;
    let seamWatch = true; // scroll listener works only in the hero/corridor regime

    const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      raf = jobs.length ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf && jobs.length) raf = requestAnimationFrame(tick);
    };

    const clearText = (i: number) => {
      const label = labels[i];
      const name = names[i];
      if (label) label.textContent = "";
      if (name) name.textContent = "";
    };

    const decodeActive = (i: number) => {
      const entry = MANIFEST_ENTRIES[i];
      const label = labels[i];
      const name = names[i];
      if (!label || !name) return;
      // Hero canon: the first viewport shows no rail title at all.
      const no = entry.hideActiveName ? "" : entry.label;
      const nm = entry.hideActiveName ? "" : entry.name;
      if (prm()) {
        label.textContent = no;
        name.textContent = nm;
        return;
      }
      const now = performance.now() / 1000;
      queueScramble(jobs, label, no, now + 0.05);
      queueScramble(jobs, name, nm, now + 0.12);
      kick();
    };

    const garnish = (i: number, delayMs: number) => {
      const existing = garnishTimers.get(i);
      if (existing !== undefined) window.clearTimeout(existing);
      const start = window.setTimeout(() => {
        entries[i].setAttribute("data-just-seated", "");
        const off = window.setTimeout(() => {
          entries[i].removeAttribute("data-just-seated");
          garnishTimers.delete(i);
        }, SEAT_GARNISH_MS);
        garnishTimers.set(i, off);
      }, delayMs);
      garnishTimers.set(i, start);
    };

    const clearGarnish = () => {
      garnishTimers.forEach((t) => window.clearTimeout(t));
      garnishTimers.clear();
      entries.forEach((el) => el.removeAttribute("data-just-seated"));
    };

    const resolveActiveIdx = (): number => {
      if (html.getAttribute("data-corridor-engaged") === "true") {
        const phase = html.getAttribute("data-corridor-phase");
        const idx = phase ? MANIFEST_ENTRIES.findIndex((e) => e.corridorPhase === phase) : -1;
        return idx >= 0 ? idx : THESIS_IDX;
      }
      const key = html.getAttribute("data-active-station") || "hero";
      let idx = MANIFEST_ENTRIES.findIndex((e) => e.kind === "station" && e.targetId === key);
      if (idx < 0) idx = 0;
      if (idx === 0) {
        // Rule 3 — seam gap (see docblock). Single batched rect read,
        // active only in the hero/corridor regime.
        const mount = document.getElementById(CORRIDOR_MOUNT_ID);
        if (mount && mount.getBoundingClientRect().top < window.innerHeight / 2) return ARC_IDX;
      }
      return idx;
    };

    const update = () => {
      const next = resolveActiveIdx();
      // The geometric rule needs scroll wake-ups only until services
      // takes over the attribute clock.
      seamWatch = next <= ARC_IDX;
      if (next === activeIdx) return;
      const prev = activeIdx;
      activeIdx = next;

      // Reverse travel: instant state flips, garnish killed (the end
      // states are the attributes' static styles — interruption-safe).
      if (prev >= 0 && next < prev) clearGarnish();

      entries.forEach((el, i) => {
        const state = i < next ? "seated" : i === next ? "active" : "upcoming";
        if (el.getAttribute("data-state") !== state) el.setAttribute("data-state", state);
        if (i === next) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });

      // Forward travel: every entry crossed seats with the quantized
      // snap, cascade-staggered (fast-scroll-past reads as the rack
      // populating). prev < 0 is the first paint / mid-page reload —
      // states reconstruct silently, no garnish replay.
      if (prev >= 0 && next > prev && !prm()) {
        for (let i = prev; i < next; i++) garnish(i, (i - prev) * GARNISH_STAGGER_MS);
      }

      if (hoverIdx === next) hoverIdx = null;
      entries.forEach((el, i) => {
        if (el.hasAttribute("data-ghost") && i !== hoverIdx) el.removeAttribute("data-ghost");
      });
      if (prev >= 0 && prev !== hoverIdx) clearText(prev);
      decodeActive(next);
    };

    // Hover ghost — the diegetic tooltip for marker-only slots: the
    // name scrambles in at low opacity (CSS [data-ghost]).
    const entryFromEvent = (ev: Event): number => {
      const btn = (ev.target as HTMLElement).closest?.(".rail-manifest__entry");
      return btn ? entries.indexOf(btn as HTMLButtonElement) : -1;
    };
    const onPointerOver = (ev: PointerEvent) => {
      const i = entryFromEvent(ev);
      if (i < 0 || i === activeIdx || i === hoverIdx) return;
      if (hoverIdx != null) {
        entries[hoverIdx].removeAttribute("data-ghost");
        if (hoverIdx !== activeIdx) clearText(hoverIdx);
      }
      hoverIdx = i;
      entries[i].setAttribute("data-ghost", "");
      const name = names[i];
      if (!name) return;
      if (prm()) {
        name.textContent = MANIFEST_ENTRIES[i].name;
      } else {
        queueScramble(jobs, name, MANIFEST_ENTRIES[i].name, performance.now() / 1000 + 0.03);
        kick();
      }
    };
    const onPointerOut = (ev: PointerEvent) => {
      const i = entryFromEvent(ev);
      if (i < 0 || i !== hoverIdx) return;
      const related = ev.relatedTarget as Node | null;
      if (related && entries[i].contains(related)) return;
      hoverIdx = null;
      entries[i].removeAttribute("data-ghost");
      if (i !== activeIdx) clearText(i);
    };

    // Click → scroll: the manifest is diegetic navigation. Stations
    // use the HudNav canon; corridor entries land a tuned fraction
    // into the mount runway. PRM jumps.
    const onClick = (ev: MouseEvent) => {
      const i = entryFromEvent(ev);
      if (i < 0) return;
      const entry = MANIFEST_ENTRIES[i];
      const behavior: ScrollBehavior = prm() ? "auto" : "smooth";
      if (entry.kind === "corridor") {
        const mount = document.getElementById(CORRIDOR_MOUNT_ID);
        if (!mount) return;
        const runway = Math.max(0, mount.offsetHeight - window.innerHeight);
        window.scrollTo({ top: mount.offsetTop + (entry.scrollFraction ?? 0) * runway, behavior });
      } else {
        document.getElementById(entry.targetId)?.scrollIntoView({ behavior, block: "start" });
      }
    };

    const observer = new MutationObserver(update);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-active-station", "data-corridor-engaged", "data-corridor-phase"],
    });

    // Rule 3 is geometric — attribute mutations alone can't see the
    // corridor mount crossing viewport-mid, so a passive scroll
    // listener re-resolves, gated to the hero/corridor regime and
    // rAF-coalesced.
    const onScroll = () => {
      if (!seamWatch || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        update();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    nav.addEventListener("pointerover", onPointerOver);
    nav.addEventListener("pointerout", onPointerOut);
    nav.addEventListener("click", onClick);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      nav.removeEventListener("pointerover", onPointerOver);
      nav.removeEventListener("pointerout", onPointerOut);
      nav.removeEventListener("click", onClick);
      if (raf) cancelAnimationFrame(raf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      jobs.length = 0;
      clearGarnish();
    };
  }, [containerRef]);

  return null;
}
