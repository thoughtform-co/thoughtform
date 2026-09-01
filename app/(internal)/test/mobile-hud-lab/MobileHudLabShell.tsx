"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Astrolabe } from "./instruments/Astrolabe";
import { BearingStrip, snapDetents } from "./instruments/BearingStrip";
import { Runway } from "./Runway";
import {
  ALL_KNOBS,
  DIAL_SIZE,
  FRAME_WIDTHS,
  JOURNEY_ROWS,
  MOBILE_HUD_VARIANTS,
  NEEDLE,
  STRIP_ALPHA,
  STRIP_GLIDE,
  type Knob,
  type MobileHudVariantId,
  type NeedleStyle,
} from "./variants";

/**
 * The lab shell — it owns the two CLOCKS both candidates read, the runway,
 * production's surviving ≤960 chrome, and the knobs.
 *
 * ── The two clocks, and why they are two ──────────────────────────────
 *
 * WHERE THE SECTIONS ARE is layout: a measured table of normalised depths,
 * recomputed on mount and on layout change (`ResizeObserver`) and NEVER per
 * scroll frame. That is ADR-031 U9 §2 verbatim — "the detent TABLE is
 * recomputed only on mount / resize; the controller writes the position on
 * the active-index change; scroll only re-resolves WHICH index is active,
 * never geometry."
 *
 * WHICH SECTION YOU ARE IN is an `IntersectionObserver` — a rect the reader
 * can see, per `.claude/rules/mobile-sections.md` law 2, whose worked
 * counter-example is `MobileEpilogueSignal` keying its exit off a module
 * ref that defaults to "not started yet" and stranding the epilogue over
 * `#services`. The band is `[0, 0.45·vh]` (rootMargin `0 0 -55% 0`) and the
 * active row is the LAST part intersecting it, which makes it reversible in
 * both directions by construction rather than by a second latch.
 *
 * HOW DEEP YOU ARE is the third and only scrubbed channel, and it belongs
 * to the astrolabe's needle alone: one passive listener, one rAF, one custom
 * property. It reads `scrollY` and never a rect — mobile-sections law 2's
 * "no per-frame layout read", which on this page is not a style preference
 * but the difference between a phone that scrolls and one that does not.
 *
 * ⚠ `--hero-lift: 1` IS DECLARED HERE, AND `/test/hud-instruments-lab`
 * FORBIDS EXACTLY THAT. The difference is which writer is mounted. That lab
 * runs the real `useLandingScroll`, so pinning the value would shadow a
 * live write and fake the ADR-031 U16 curtain reveal it exists to judge.
 * This lab mounts no scroll writer at all, so without the pin the corner
 * brackets compute `inset(44px …)` on a 28px box and paint NOTHING — the
 * control would be missing two of the four things it is the control for.
 * The pin says "the curtain has fully lifted", which is the state every
 * station past the hero is in and the only state this runway models.
 * ⚠ WHAT THAT LEAVES OPEN, AND IT IS A PROMOTION QUESTION: neither
 * candidate is choreographed to the curtain here. In production a strip
 * across the top of the hero would break the U16 uncover, so a winner needs
 * either the corners' clip expression or a `--hero-lift` gate of its own.
 */

/* ⚠ NO PROPS, WHICH IS THE DELTA FROM `HudInstrumentsLabShell`. That shell
   takes `hudHtml` because its subject IS the parse-injected frame; here the
   surviving chrome is four production classes with no markup to inject, so
   a prop would only be a slot for a slice nothing produces. */

/** Read a knob's chosen value out of the index map. */
function valueOf<T>(knob: Knob<T>, picked: Record<string, number>): T {
  const i = picked[knob.id] ?? knob.fallback;
  return (knob.options[i] ?? knob.options[knob.fallback]).value;
}

export function MobileHudLabShell() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [variantIdx, setVariantIdx] = useState(0);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [depths, setDepths] = useState<readonly number[]>(() => JOURNEY_ROWS.map(() => 0));
  const [activeRow, setActiveRow] = useState(0);
  const [ready, setReady] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);

  const variant = MOBILE_HUD_VARIANTS[variantIdx];

  /* ── Deep link ────────────────────────────────────────────────────────
     Read in a MOUNT EFFECT and written back through `history.replaceState`.
     NEVER `useSearchParams`, which forces a CSR bailout of the whole
     route (the `/test/hud-instruments-lab` note, and it is not a
     preference — the bailout takes the server-rendered first paint with
     it, and first paint is what a chrome lab is looking at). */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("v");
    if (v) {
      const i = MOBILE_HUD_VARIANTS.findIndex((a) => a.id === v);
      if (i >= 0) setVariantIdx(i);
    }
    if (q.get("console") === "0") setConsoleOpen(false);

    const next: Record<string, number> = {};
    for (const knob of ALL_KNOBS) {
      const raw = q.get(knob.param);
      if (raw == null) continue;
      const i = knob.options.findIndex((o) => o.id === raw);
      if (i >= 0) next[knob.id] = i;
    }
    if (Object.keys(next).length) setPicked(next);
  }, []);

  /* ── Clock 1 · the detent table ───────────────────────────────────────
     One normalised depth per journey ROW, taken from the FIRST part that
     carries it — two parts sharing a row (hero + corridor both resolve to
     THE ARC, `sectionLabel.ts`) is a section with two stretches, not two
     sections, and the table has to agree with the observer about that.

     ⚠ IT NORMALISES BY THE SCROLL RANGE, NOT BY THE DOCUMENT HEIGHT. The
     last row's part begins inside the final viewport, i.e. past
     `maxScroll` — clamped to 1, which is correct: it says "the needle
     reaches this tick exactly when the document ends", where dividing by
     `scrollHeight` would leave the last section permanently unreachable
     by a needle that can only travel as far as the reader can. */
  const measure = useCallback(() => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const next = JOURNEY_ROWS.map((r) => {
      const el = document.querySelector<HTMLElement>(`[data-mhl-row="${r.id}"]`);
      if (!el) return 0;
      const top = el.getBoundingClientRect().top + window.scrollY;
      return Math.max(0, Math.min(1, top / max));
    });
    setDepths((prev) => (prev.every((v, i) => Math.abs(v - next[i]) < 0.0005) ? prev : next));
    setReady(true);
  }, []);

  useEffect(() => {
    // One frame for layout: the runway's blocks are `min-height: 100dvh`
    // and the fonts are still swapping on the first tick, so a table
    // measured synchronously here is measured against a shorter document.
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(() => measure());
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  /* ── Clock 2 · which row owns the screen ──────────────────────────────
     `rootMargin: "0px 0px -55% 0px"` makes the observation band the top
     45 % of the viewport, so `isIntersecting` reads exactly "this part's
     top has crossed 45 % of the screen" — the live kill condition
     `MobileEpilogueSignal` ended up with, reused rather than reinvented.
     The last intersecting part wins, so scrolling back up hands the row
     back with no second code path. */
  useEffect(() => {
    const parts = [...document.querySelectorAll<HTMLElement>("[data-mhl-row]")];
    if (!parts.length) return;
    const live = new Set<HTMLElement>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) live.add(e.target as HTMLElement);
          else live.delete(e.target as HTMLElement);
        }
        let last = -1;
        for (let i = 0; i < parts.length; i += 1) if (live.has(parts[i])) last = i;
        if (last < 0) return;
        const id = parts[last].dataset.mhlRow;
        const row = JOURNEY_ROWS.findIndex((r) => r.id === id);
        if (row >= 0) setActiveRow((prev) => (prev === row ? prev : row));
      },
      { rootMargin: "0px 0px -55% 0px", threshold: 0 }
    );
    for (const p of parts) io.observe(p);
    return () => io.disconnect();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* ── Clock 3 · depth, the one scrubbed channel ────────────────────────
     Written IMPERATIVELY, never through state: this fires on every scroll
     frame and a `setState` here would re-render the runway's five hundred
     lines of copy sixty times a second to move one needle.

     `data-mhl-frame` is the capture's OBSERVABLE — it counts committed
     reads, so "the lab has re-measured since you scrolled" is a fact the
     script can wait on instead of sleeping. A predicate on the depth value
     itself would be satisfiable by the script's own `scrollTo` before this
     handler had run at all, which is the class of wait that made
     `capture-hud-instruments` sample the corner mid-decode. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    let frame = 0;
    const write = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const d = Math.max(0, Math.min(1, window.scrollY / max));
      root.style.setProperty("--mdial-depth", d.toFixed(4));
      root.dataset.mhlDepth = d.toFixed(3);
      frame += 1;
      root.dataset.mhlFrame = String(frame);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(write);
    };
    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ── URL sync ─────────────────────────────────────────────────────── */
  const push = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const commitVariant = useCallback(
    (i: number) => {
      setVariantIdx(i);
      push("v", MOBILE_HUD_VARIANTS[i].id);
    },
    [push]
  );

  /* `Knob<unknown>`, not a generic `<T>`: the console renders a FILTERED
     union of knob types and a generic would have to infer one `T` for all
     of them. The commit only ever touches `id` / `param` / `options[i].id`,
     none of which are `T` — so the value type is genuinely irrelevant here
     and saying so is honest rather than a cast. */
  const commitKnob = useCallback(
    (knob: Knob<unknown>, i: number) => {
      setPicked((prev) => ({ ...prev, [knob.id]: i }));
      push(knob.param, knob.options[i].id);
    },
    [push]
  );

  const detents = snapDetents(depths);
  const alpha = valueOf(STRIP_ALPHA, picked);
  const glide = valueOf(STRIP_GLIDE, picked);
  const dialSize = valueOf(DIAL_SIZE, picked);
  const needle = valueOf(NEEDLE, picked) as NeedleStyle;
  const frameWidth = valueOf(FRAME_WIDTHS, picked);
  const row = JOURNEY_ROWS[activeRow];

  return (
    <div
      ref={rootRef}
      className="mhl"
      data-mhl-variant={variant.id}
      data-mhl-ready={ready || undefined}
      /* ⚠ `data-mhl-active`, NEVER `data-mhl-row` — the runway's parts carry
         that one, and the root is an ANCESTOR of all of them. Naming the
         root's readout the same thing put the root into
         `querySelectorAll("[data-mhl-row]")`, which both this file's
         IntersectionObserver and the capture's runway-complete gate walk:
         nine "parts" for eight, an observer watching the whole document as
         if it were a section, and a wait that could never be satisfied.
         Neither failed loudly — the count was simply one too many. */
      data-mhl-active={row.id}
      data-mhl-rowidx={activeRow}
      data-mhl-detent={detents[activeRow]}
      data-mhl-detents={detents.join(",")}
      style={{ "--mhl-frame-w": `${frameWidth}px` } as React.CSSProperties}
    >
      {/* ── v0 · production's surviving ≤960 chrome ─────────────────────
          The REAL class names, not lookalikes. `.hud-nav-overlay`,
          `.hud__nav__btn`, `.rin-settings` and the two brackets take their
          geometry, their z-indices, their curtain clips and the TR scrim
          straight from landing.css and rail-instruments.css — so the mock
          cannot drift from the thing it stands for, and the capture's band
          gate measures the same four selectors
          `mobile-section-seams.spec.ts` does.

          What is mocked is only the BEHAVIOUR behind them: the readout's
          text is written from this lab's own clock instead of
          `useActiveSection`, and neither control opens anything.
          `tabIndex={-1}` + `aria-hidden` because a dead trigger in the tab
          order is worse than no trigger. */}
      <div className="hud" aria-hidden="true">
        <div className="hud__corner hud__corner--tl" />
        <div className="hud__corner hud__corner--br" />
      </div>

      <div className="hud-nav-overlay" aria-hidden="true">
        <nav className="hud__nav hud__nav--inline is-collapsed">
          <div className="hud__nav__inline" />
          <button type="button" className="hud__nav__btn" tabIndex={-1}>
            <span className="hud__nav__sector">
              <span className="hud__nav__sector__detail" />
              <span className="hud__nav__sector__name">{row.label}</span>
            </span>
            <span className="bars">
              <span />
              <span />
              <span />
            </span>
          </button>
        </nav>
      </div>

      <div className="rin-settings" data-rin-settings aria-hidden="true">
        <span className="rin-settings__ctl">
          {/* The theme switch's silhouette. The real control is
              `ThemeToggleButton`, which owns a store write this lab has no
              business making — the theme is switched by the link in the
              console instead, through the same `?theme=` the pre-paint
              bootstrap in `app/layout.tsx` already reads on every route. */}
          <span className="mhl-ctl-mock" />
        </span>
      </div>

      <Runway />

      {/* ── The candidates ─────────────────────────────────────────────
          Mounted OVER the v0 chrome rather than instead of it: the whole
          question is whether the addition reads as one instrument with
          what is already there, and a candidate judged on an empty frame
          is a candidate judged against nothing. */}
      {variant.id === "c1" && (
        <BearingStrip detents={detents} activeRow={activeRow} alpha={alpha} glideMs={glide} />
      )}
      {variant.id === "c2" && (
        <Astrolabe
          depths={depths}
          activeRow={activeRow}
          size={dialSize}
          needle={needle}
          glideMs={glide}
        />
      )}

      {/* ── Console ────────────────────────────────────────────────────
          Docked BOTTOM-CENTRE, and on this surface that is not a free
          choice: the top band is candidate 1, the bottom-left corner is
          candidate 2 and the bottom-right is the settings cluster. Centre
          is the only bottom real estate nothing under study occupies —
          and it still overlaps the runway, which is why it collapses. */}
      <div className="mhl-console" data-open={consoleOpen || undefined}>
        <div className="mhl-console__head">
          <button
            type="button"
            className="mhl-caret"
            aria-expanded={consoleOpen}
            onClick={() => setConsoleOpen((o) => !o)}
          >
            {consoleOpen ? "▾" : "▴"} Mobile HUD
          </button>
          <span className="mhl-readout">
            <b>{row.label}</b> · rung {detents[activeRow]}/12
          </span>
        </div>

        {consoleOpen && (
          <>
            <div className="mhl-chips" role="tablist" aria-label="Candidate">
              {MOBILE_HUD_VARIANTS.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  role="tab"
                  aria-selected={i === variantIdx}
                  className="mhl-chip"
                  data-on={i === variantIdx || undefined}
                  onClick={() => commitVariant(i)}
                >
                  {v.label}
                </button>
              ))}
              <a className="mhl-chip mhl-chip--link" href="?theme=light">
                Light
              </a>
              <a className="mhl-chip mhl-chip--link" href="?theme=dark">
                Dark
              </a>
            </div>

            <p className="mhl-thesis">{variant.thesis}</p>

            {/* Knobs, filtered to the route in view — a control that cannot
                change anything on screen is a control that teaches the
                owner the wrong thing about what the drawing depends on. */}
            {ALL_KNOBS.filter(
              (k) => k.routes.length === 0 || k.routes.includes(variant.id as MobileHudVariantId)
            ).map((knob) => (
              <div key={knob.id} className="mhl-knob">
                <span className="mhl-knob__label">{knob.label}</span>
                <span className="mhl-chips">
                  {knob.options.map((o, i) => (
                    <button
                      key={o.id}
                      type="button"
                      className="mhl-chip mhl-chip--sm"
                      data-on={(picked[knob.id] ?? knob.fallback) === i || undefined}
                      onClick={() => commitKnob(knob, i)}
                    >
                      {o.label}
                    </button>
                  ))}
                </span>
              </div>
            ))}

            <p className="mhl-prov">
              <i className="mhl-prov__diamond" />
              {variant.provenance}
            </p>
          </>
        )}
      </div>

      {/* Above the gate both candidates are `display: none` (they key off
          the SAME 961 boundary `.hud__rail`'s hide uses), so a desktop
          window shows the runway and nothing else with no explanation. */}
      <p className="mhl-gate-warn">
        Out of tier — above 960px the rail, its ladder and the journey diamond are back, and neither
        candidate has a job. Narrow the window to 430 or less.
      </p>
    </div>
  );
}
