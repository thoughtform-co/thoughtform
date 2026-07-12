"use client";

import { useEffect } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { CORRIDOR_MOUNT_ID, MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";

/**
 * RailManifestController — the left rail's section rolodex (ADR-031,
 * Update 3).
 *
 * The manifest markup (a masked window holding a flow-stacked reel of
 * every journey entry) is injected at PARSE time by
 * `lib/v7-parse/railManifest.ts`, so the rail paints its section list
 * on first load with no client reflow. This controller is a
 * null-rendering component that MUTATES that injected DOM — never
 * `createRoot` into `[data-rail-manifest-root]` (it would clobber the
 * server skeleton). Precedent: `useLandingScroll` writing
 * `#depthIndicator`.
 *
 * The reel is a rolodex: the active row always sits at the fixed
 * mid-rail anchor, and section changes slide the WHOLE reel through
 * one custom property (`--rail-manifest-idx`) — a 350ms detent glide,
 * the owner-approved narrowing of the "never smooth tweening" canon
 * (position stays a pure function of `activeIdx`; it is never
 * scroll-scrubbed). Everything derives from that one integer:
 *   - per entry: `data-state` (seated / active / upcoming) and
 *     `data-dist` (clamped |i − active| → distance dimming);
 *   - on the nav: `data-dormant` while hero is active (hero canon: no
 *     rail title) and the detent property itself;
 *   - the active row's text morphs "SERVICES" ↔ "08 SERVICES"
 *     (scramble-decoded) — authored numbers stay off every other row
 *     because the production sequence is non-monotonic.
 * `data-ready` is set only after the first sync + a reflow flush, so
 * a mid-page reload fades in at the correct detent instead of sliding
 * up from hero.
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
 */

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
    const names = entries.map((el) => el.querySelector<HTMLElement>(".rail-manifest__name"));

    const html = document.documentElement;
    const jobs: ScrambleJob[] = [];
    let raf = 0;
    let scrollRaf = 0;
    let activeIdx = -1; // forces the first update() to paint
    let seamWatch = true; // scroll listener works only in the hero/corridor regime

    const prm = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const tick = () => {
      advanceScrambles(jobs, performance.now() / 1000);
      raf = jobs.length ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf && jobs.length) raf = requestAnimationFrame(tick);
    };

    /** A row's text: the authored number rides only the ACTIVE row
     *  ("08 SERVICES"); every other row shows the bare name. The
     *  prefix shift re-decodes the whole row through the scramble
     *  kernel (it restarts from the currently displayed text, so fast
     *  back-and-forth chains naturally). */
    const setRowText = (i: number, active: boolean, instant = false) => {
      const name = names[i];
      if (!name) return;
      const entry = MANIFEST_ENTRIES[i];
      // Hero canon: no number even if the (dormant) row were shown.
      const text = active && !entry.hideActiveName ? `${entry.label} ${entry.name}` : entry.name;
      if (instant || prm()) {
        name.textContent = text;
        return;
      }
      queueScramble(jobs, name, text, performance.now() / 1000 + (active ? 0.05 : 0.02));
      kick();
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

      // The reel detent + hero dormancy — both pure functions of next.
      // CSS transitions retarget mid-glide on every write, so fast
      // travel reads as one redirected slide, never a queued chain.
      nav.style.setProperty("--rail-manifest-idx", String(next));
      if (next === 0) nav.setAttribute("data-dormant", "");
      else nav.removeAttribute("data-dormant");

      entries.forEach((el, i) => {
        const state = i < next ? "seated" : i === next ? "active" : "upcoming";
        if (el.getAttribute("data-state") !== state) el.setAttribute("data-state", state);
        const dist = String(Math.min(Math.abs(i - next), 4));
        if (el.getAttribute("data-dist") !== dist) el.setAttribute("data-dist", dist);
        if (i === next) el.setAttribute("aria-current", "true");
        else el.removeAttribute("aria-current");
      });

      // prev < 0 is the first paint / mid-page reload: the reel
      // reconstructs silently (no scramble) behind the data-ready gate.
      if (prev >= 0) setRowText(prev, false);
      setRowText(next, true, prev < 0);
    };

    // Click → scroll: the manifest is diegetic navigation. Stations
    // use the HudNav canon; corridor entries land a tuned fraction
    // into the mount runway. PRM jumps.
    const onClick = (ev: MouseEvent) => {
      const btn = (ev.target as HTMLElement).closest?.(".rail-manifest__entry");
      const i = btn ? entries.indexOf(btn as HTMLButtonElement) : -1;
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
    nav.addEventListener("click", onClick);
    update();
    // Enable transitions only after the first sync has been flushed —
    // a mid-page reload fades in at its detent, never slides from hero.
    void nav.offsetWidth;
    nav.setAttribute("data-ready", "");

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      nav.removeEventListener("click", onClick);
      if (raf) cancelAnimationFrame(raf);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      jobs.length = 0;
      nav.removeAttribute("data-ready");
    };
  }, [containerRef]);

  return null;
}
