"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { LatticeOverlay } from "@/components/lattice";
import { measureLattice, summariseLattice, type LatticeReport } from "@/lib/lattice/measure";
import {
  LAT_BOARDS,
  LAT_DEFAULTS,
  LAT_DIRECTIONS,
  LAT_KNOB_KEYS,
  LAT_KNOB_LIST,
  directionOf,
  knobString,
  knobsFor,
  parseLatQuery,
  type LatBoard,
  type LatKnobs,
  type LatTheme,
} from "@/lib/lattice/variants";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { useThemeStore } from "@/lib/stores/themeStore";

/* The REAL frame, borrowed rather than re-drawn (the interface kit's own
   import): the rungs are being judged for whether they sit on THIS rail, so a
   lab-drawn approximation would be measuring the tokens against a different
   ladder. */
import { HudFrame } from "../hud-panel-lab/HudFrame";
import { FramesBoard } from "./boards/FramesBoard";
import { GridBoard } from "./boards/GridBoard";
import { PageBoard } from "./boards/PageBoard";
import { SectionsBoard } from "./boards/SectionsBoard";
import { TypeBoard } from "./boards/TypeBoard";

/**
 * LatticeShell — the frame, the bus, the console, and one board.
 *
 * The interface kit's shell skeleton (ADR-091), with its traps carried:
 *
 * ── WHY THE DOCUMENT REALLY SCROLLS ──────────────────────────────────────
 * ⚠ THE ROOT IS NOT `position: fixed; inset: 0`. `HudNav` prints the
 * nav-corner readout only once `scrollY > innerHeight / 2`, and that readout
 * is one instrument the page has to feel part of. So on the three STAGED
 * boards (grid, frames, type) the stage is sticky over a runway and a mount
 * task scrolls past the collapse; on the two FLOWING boards (sections, page)
 * the content is a document under the fixed frame and scrolls by itself.
 *
 * ── THE BUS ───────────────────────────────────────────────────────────────
 * Three writes, restored on unmount, in this order for a stated reason:
 * `--hero-lift` / `--hero-cover` = 1 (ADR-031 U16 reveals the frame by
 * clipping the rails to the hero's bottom edge; with no hero the property is
 * absent and the frame is invisible), then `servicesRingProgressRef` BEFORE
 * `data-active-station` (`useActiveSection` reads the ref inside the update
 * the attribute mutation wakes). ⚠ `data-corridor-engaged` IS NEVER WRITTEN,
 * not even as `"false"`.
 *
 * ── THE URL ───────────────────────────────────────────────────────────────
 * Adopted in a MOUNT EFFECT, never through `useSearchParams` (a CSR bailout
 * of the whole route). Each setter writes only ITS OWN parameter through
 * `history.replaceState`. Query: `?board=` · `?k=` · each knob by name ·
 * `?theme=` · `?grid=1` · `?console=0` (REMOVES the console).
 */

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/** What the capture drives, so a still need not be a re-navigation. */
export interface LatticeHandle {
  setBoard(next: LatBoard): void;
  setKnobs(partial: Partial<LatKnobs>): void;
  setDirection(id: string): void;
  setTheme(next: LatTheme): void;
  setGrid(on: boolean): void;
  /** ONE measurement — the lab prints it, the capture asserts on it. */
  measure(): LatticeReport;
}

declare global {
  interface Window {
    __lattice?: LatticeHandle;
  }
}

/* The frames board flows too: the capture hit-tests every corner and reads
   every ring off the viewport, which an inner scroller hides from it. */
const FLOWING: ReadonlySet<LatBoard> = new Set<LatBoard>(["sections", "page", "frames"]);

interface Read {
  sector: string;
  rail: number;
  ticks: number;
  rung0: number;
}

export function LatticeShell({ hudHtml, bodyClass }: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [board, setBoardState] = useState<LatBoard>("page");
  const [knobs, setKnobsState] = useState<LatKnobs>(LAT_DEFAULTS);
  const [theme, setThemeState] = useState<LatTheme>("dark");
  const [grid, setGridState] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  /* ⚠ `?console=0` REMOVES THE CONSOLE, it does not collapse it: a folded
     console still leaves a row of controls over the foot of the page being
     scored. */
  const [consoleMounted, setConsoleMounted] = useState(true);
  const [readout, setReadout] = useState("");
  /** What the PAGE decided, read back off the live DOM — never re-derived. */
  const [read, setRead] = useState<Read>({ sector: "—", rail: 0, ticks: 0, rung0: 0 });

  const setMode = useThemeStore((s) => s.setMode);
  const dirId = directionOf(knobs);
  const dirDef = LAT_DIRECTIONS.find((d) => d.id === dirId);
  const flowing = FLOWING.has(board);

  /* ── Deep link, adopted once ─────────────────────────────────────────── */
  /* eslint-disable react-hooks/set-state-in-effect -- the sanctioned lab
     exception: the URL IS the external system, read exactly once per mount. */
  useEffect(() => {
    const q = parseLatQuery(new URLSearchParams(window.location.search));
    setKnobsState(q.knobs);
    setBoardState(q.board);
    setThemeState(q.theme);
    setGridState(q.grid);
    if (!q.consoleOn) setConsoleMounted(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const writeParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, "", url.toString());
  }, []);

  /* ⚠ THE URL CARRIES EVERY KNOB, ALWAYS, AND `k` FOLLOWS THE KNOBS — `k` is
     written as the empty string when the set is not a direction, so the
     parameter never lies about what is on screen. */
  const applyKnobs = useCallback((partial: Partial<LatKnobs>) => {
    setKnobsState((prev) => {
      const next = { ...prev, ...partial };
      const url = new URL(window.location.href);
      for (const key of LAT_KNOB_KEYS) url.searchParams.set(key, next[key]);
      url.searchParams.set("k", directionOf(next));
      window.history.replaceState(null, "", url.toString());
      return next;
    });
  }, []);

  const applyDirection = useCallback(
    (id: string) => {
      applyKnobs(knobsFor(id));
    },
    [applyKnobs]
  );

  const applyTheme = useCallback(
    (next: LatTheme) => {
      setThemeState(next);
      writeParam("theme", next);
      /* ⚠ THROUGH THE PRODUCTION STORE, never a raw attribute write: the real
         `ThemeToggleButton` is mounted in the corner and only the store
         notifies it. */
      setMode(next);
    },
    [setMode, writeParam]
  );

  const applyBoard = useCallback(
    (next: LatBoard) => {
      setBoardState(next);
      writeParam("board", next);
    },
    [writeParam]
  );

  const applyGrid = useCallback(
    (on: boolean) => {
      setGridState(on);
      writeParam("grid", on ? "1" : "0");
    },
    [writeParam]
  );

  const measure = useCallback(() => measureLattice(document), []);

  /* ── The theme, on first adoption ────────────────────────────────────── */
  useEffect(() => {
    setMode(theme);
  }, [theme, setMode]);

  /* ── The frame's document bus ────────────────────────────────────────── */
  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty("--hero-lift", "1");
    html.style.setProperty("--hero-cover", "1");

    const restore = { ...servicesRingProgressRef.current };
    servicesRingProgressRef.current = { progress: 0, proofRelease: 0, proofPresence: 1 };
    html.setAttribute("data-active-station", "services");

    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
      html.removeAttribute("data-active-station");
      // Module-global and shared with production paths: nothing may leave this
      // at 0 as a resting state.
      servicesRingProgressRef.current = restore;
    };
  }, []);

  /* ── Past the nav's collapse threshold, on a STAGED board ────────────── */
  useEffect(() => {
    // A TASK, not a frame: rAF stalls in a hidden document.
    const t = window.setTimeout(() => {
      if (flowing) {
        if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: "auto" });
      } else if (window.scrollY < window.innerHeight * 0.55) {
        window.scrollTo({ top: Math.ceil(window.innerHeight * 0.62), behavior: "auto" });
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, [flowing]);

  /* ── The readout mirror ──────────────────────────────────────────────── */
  /**
   * Sampled TWO rAFs after any state change, off the live DOM, with a timer
   * beside it (rAF stalls in a hidden document). The stamp's TAIL is the nav
   * sector, the live rail height, the tick count and the first tick's seat —
   * values the script cannot set itself (`ticks === 13 && rail !== 0` is the
   * capture's readiness; a wait a script can satisfy by itself is no wait).
   */
  useEffect(() => {
    let raf = 0;
    const sample = () => {
      const sector =
        document.querySelector<HTMLElement>(".hud__nav__sector__name")?.textContent?.trim() || "—";
      const rail = Math.round(
        document.querySelector<HTMLElement>(".hud__rail")?.getBoundingClientRect().height ?? 0
      );
      const tickEls = document.querySelectorAll<HTMLElement>("#leftTicks .hud__rail__tick");
      const ticks = tickEls.length;
      const rung0 = ticks ? Math.round(tickEls[0].getBoundingClientRect().top) : 0;
      setRead((prev) =>
        prev.sector === sector && prev.rail === rail && prev.ticks === ticks && prev.rung0 === rung0
          ? prev
          : { sector, rail, ticks, rung0 }
      );
    };
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(sample);
    });
    const t = window.setTimeout(sample, 48);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [board, knobs, theme, grid]);

  /* ── The capture handle ──────────────────────────────────────────────── */
  useEffect(() => {
    window.__lattice = {
      setBoard: applyBoard,
      setKnobs: applyKnobs,
      setDirection: applyDirection,
      setTheme: applyTheme,
      setGrid: applyGrid,
      measure,
    };
    return () => {
      delete window.__lattice;
    };
  }, [applyBoard, applyKnobs, applyDirection, applyTheme, applyGrid, measure]);

  const runMeasure = useCallback(() => {
    setReadout(summariseLattice(measure()));
  }, [measure]);

  const stamp = [
    board,
    knobString(knobs),
    theme,
    grid ? 1 : 0,
    read.sector,
    read.rail,
    read.ticks,
    read.rung0,
  ].join("|");

  /* ⚠ EVERY KNOB IS AN ATTRIBUTE, INCLUDING ITS DEFAULT, so a rule can be read
     in both directions and a still can always be traced to the set that drew
     it. The boards ALSO pass the knobs into the components as props — the
     attribute is the stamp's witness, the prop is what paints. */
  const knobAttrs = Object.fromEntries(
    LAT_KNOB_KEYS.map((k) => [`data-lat-${k}`, knobs[k]])
  ) as Record<string, string>;

  const boardNode =
    board === "grid" ? (
      <GridBoard />
    ) : board === "frames" ? (
      <FramesBoard knobs={knobs} />
    ) : board === "sections" ? (
      <SectionsBoard knobs={knobs} />
    ) : board === "type" ? (
      <TypeBoard knobs={knobs} />
    ) : (
      <PageBoard knobs={knobs} />
    );

  return (
    <div
      ref={rootRef}
      className={`lat-lab ${bodyClass}`}
      data-lat=""
      data-lat-board={board}
      data-lat-grid={grid || board === "grid" ? "1" : "0"}
      data-lat-dir={dirId}
      {...knobAttrs}
    >
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}

      {/* The overlay is drawn FROM the tokens, so a token that drifts from
          the live tick shows as a doubled line. On the grid board it is
          forced on; elsewhere `?grid=1` mounts it. */}
      {grid || board === "grid" ? <LatticeOverlay /> : null}

      {flowing ? (
        <div className="lat-doc" data-lat-doc={board}>
          {boardNode}
        </div>
      ) : (
        <>
          <div className="lat-stage" data-lat-stage={board}>
            {boardNode}
          </div>
          {/* The runway. Its only job is to make the document scroll so the
              nav corner collapses and prints its readout. */}
          <div className="lat-runway" aria-hidden="true" />
        </>
      )}

      {/* ── Lab console ──────────────────────────────────────────────── */}
      {consoleMounted ? (
        <aside
          className="lat-console"
          data-open={consoleOpen || undefined}
          role="group"
          aria-label="Lattice lab controls"
        >
          <div className="lat-console__row">
            <span className="lat-console__title">Board</span>
            {LAT_BOARDS.map((b) => (
              <button
                key={b}
                type="button"
                className="lat-btn"
                data-on={board === b || undefined}
                aria-pressed={board === b}
                onClick={() => applyBoard(b)}
              >
                {b}
              </button>
            ))}

            <span className="lat-console__rule" aria-hidden="true" />

            <span className="lat-console__title">Theme</span>
            <button
              type="button"
              className="lat-btn"
              data-on={theme === "dark" || undefined}
              aria-pressed={theme === "dark"}
              onClick={() => applyTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className="lat-btn"
              data-on={theme === "light" || undefined}
              aria-pressed={theme === "light"}
              onClick={() => applyTheme("light")}
            >
              Light
            </button>

            <span className="lat-console__rule" aria-hidden="true" />

            <span className="lat-console__title">Grid</span>
            <button
              type="button"
              className="lat-btn"
              data-on={grid || undefined}
              aria-pressed={grid}
              title="The overlay: thirteen column edges and thirteen rungs, drawn from the tokens"
              onClick={() => applyGrid(true)}
            >
              on
            </button>
            <button
              type="button"
              className="lat-btn"
              data-on={!grid || undefined}
              aria-pressed={!grid}
              onClick={() => applyGrid(false)}
            >
              off
            </button>

            <button
              type="button"
              className="lat-btn lat-btn--fold"
              onClick={() => setConsoleOpen((v) => !v)}
              aria-expanded={consoleOpen}
            >
              {consoleOpen ? "Hide" : "Show"}
            </button>
          </div>

          <div className="lat-console__row">
            <span className="lat-console__title">Direction</span>
            {LAT_DIRECTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                className="lat-btn"
                data-on={dirId === d.id || undefined}
                aria-pressed={dirId === d.id}
                title={d.question}
                onClick={() => applyDirection(d.id)}
              >
                {d.id} · {d.name}
              </button>
            ))}
          </div>

          {LAT_KNOB_LIST.map(({ key, def }) => (
            <div className="lat-console__row" key={key}>
              <span className="lat-console__title">{def.label}</span>
              {def.values.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="lat-btn"
                  data-on={knobs[key] === v || undefined}
                  aria-pressed={knobs[key] === v}
                  title={def.note}
                  onClick={() => applyKnobs({ [key]: v } as Partial<LatKnobs>)}
                >
                  {v}
                </button>
              ))}
            </div>
          ))}

          <div className="lat-console__row">
            <span className="lat-console__title">Measure</span>
            <button
              type="button"
              className="lat-btn"
              title="window.__lattice.measure(): columns and rungs against the live rail, every frame's edges"
              onClick={runMeasure}
            >
              Measure
            </button>
            <output className="lat-console__readout" aria-live="polite">
              {readout}
            </output>
          </div>

          <p className="lat-thesis">
            <b>{dirDef ? `${dirDef.id} · ${dirDef.name}` : "Mixed"}</b>
            {dirDef
              ? dirDef.question
              : "a hand-mixed set — no direction claims it, and the stamp says so."}
          </p>
        </aside>
      ) : null}

      {/* ⚠ THE MACHINE MIRROR IS ALWAYS MOUNTED. Every wait in the capture
          hangs on `data-stamp`; an observable a presentation flag can remove
          is not an observable. */}
      <p
        className="lat-read"
        data-stamp={stamp}
        data-board={board}
        data-dir={dirId}
        data-knobs={knobString(knobs)}
        data-theme={theme}
        data-grid={grid ? "1" : "0"}
        data-sector={read.sector}
        data-rail={read.rail}
        data-ticks={read.ticks}
        data-rung0={read.rung0}
        aria-hidden="true"
      />
    </div>
  );
}
