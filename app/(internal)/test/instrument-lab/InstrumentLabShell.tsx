"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { measureInstrument, summariseInstrument, type InsReport } from "@/lib/instrument/measure";
import {
  INS_BOARDS,
  INS_DEFAULTS,
  INS_DIRECTIONS,
  INS_KNOB_KEYS,
  INS_KNOB_LIST,
  directionOf,
  knobString,
  knobsFor,
  parseInsQuery,
  type InsBoard,
  type InsKnobs,
  type InsTheme,
} from "@/lib/instrument/variants";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { useThemeStore } from "@/lib/stores/themeStore";

import { HudFrame } from "../hud-panel-lab/HudFrame";
import { AltitudesBoard } from "./boards/AltitudesBoard";
import { PhoneBoard } from "./boards/PhoneBoard";
import { SurfacesBoard } from "./boards/SurfacesBoard";
import { ZoomBoard } from "./boards/ZoomBoard";

/**
 * InstrumentLabShell — the lattice lab's shell (ADR-149), copied for the
 * instrument (ADR-154): the real HUD frame, the document bus, the URL as
 * the state, one console, one board, one stamp the capture waits on.
 *
 * Every board FLOWS (a document under the fixed frame): the capture reads
 * every box off the viewport, which an inner scroller would hide.
 */

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

export interface InstrumentHandle {
  setBoard(next: InsBoard): void;
  setKnobs(partial: Partial<InsKnobs>): void;
  setDirection(id: string): void;
  setTheme(next: InsTheme): void;
  measure(): InsReport;
}

declare global {
  interface Window {
    __instrument?: InstrumentHandle;
  }
}

export function InstrumentLabShell({ hudHtml, bodyClass }: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [board, setBoardState] = useState<InsBoard>("altitudes");
  const [knobs, setKnobsState] = useState<InsKnobs>(INS_DEFAULTS);
  const [theme, setThemeState] = useState<InsTheme>("dark");
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleMounted, setConsoleMounted] = useState(true);
  const [readout, setReadout] = useState("");
  /** What the page drew, read off the live DOM: the stamp's tail. */
  const [read, setRead] = useState({ figures: 0, boxes: 0 });

  const setMode = useThemeStore((s) => s.setMode);
  const dirId = directionOf(knobs);
  const dirDef = INS_DIRECTIONS.find((d) => d.id === dirId);

  /* eslint-disable react-hooks/set-state-in-effect -- the URL is read once per mount. */
  /* The mirror below must not write the defaults over a deep link before the
     adopted state has landed (React's dev double-effect reads the URL twice),
     so the first mirror run after adoption is skipped. */
  const adopting = useRef(false);
  useEffect(() => {
    const q = parseInsQuery(new URLSearchParams(window.location.search));
    adopting.current = true;
    setKnobsState(q.knobs);
    setBoardState(q.board);
    setThemeState(q.theme);
    if (!q.consoleOn) setConsoleMounted(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* Handlers only set state. ONE effect mirrors the state into the URL and
     the theme store, so no updater carries a side effect. */
  const applyKnobs = useCallback((partial: Partial<InsKnobs>) => {
    setKnobsState((prev) => ({ ...prev, ...partial }));
  }, []);
  const applyDirection = useCallback((id: string) => setKnobsState(knobsFor(id)), []);
  const applyTheme = setThemeState;
  const applyBoard = setBoardState;

  useEffect(() => {
    if (adopting.current) {
      adopting.current = false;
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("board", board);
    for (const key of INS_KNOB_KEYS) url.searchParams.set(key, knobs[key]);
    url.searchParams.set("k", directionOf(knobs));
    url.searchParams.set("theme", theme);
    window.history.replaceState(null, "", url.toString());
  }, [board, knobs, theme]);

  const measure = useCallback(() => measureInstrument(document), []);

  useEffect(() => {
    setMode(theme);
  }, [theme, setMode]);

  /* The frame's document bus, restored on unmount (the lattice lab's). */
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
      servicesRingProgressRef.current = restore;
    };
  }, []);

  /* The readout mirror: two rAFs after any change, off the live DOM. */
  useEffect(() => {
    let raf = 0;
    const sample = () => {
      const r = measureInstrument(document);
      setRead((prev) =>
        prev.figures === r.figures.length && prev.boxes === r.boxes.length
          ? prev
          : { figures: r.figures.length, boxes: r.boxes.length }
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
  }, [board, knobs, theme]);

  useEffect(() => {
    window.__instrument = {
      setBoard: applyBoard,
      setKnobs: applyKnobs,
      setDirection: applyDirection,
      setTheme: applyTheme,
      measure,
    };
    return () => {
      delete window.__instrument;
    };
  }, [applyBoard, applyKnobs, applyDirection, applyTheme, measure]);

  const runMeasure = useCallback(() => setReadout(summariseInstrument(measure())), [measure]);

  const stamp = [board, knobString(knobs), theme, read.figures, read.boxes].join("|");
  const knobAttrs = Object.fromEntries(
    INS_KNOB_KEYS.map((k) => [`data-ins-knob-${k}`, knobs[k]])
  ) as Record<string, string>;

  const boardNode =
    board === "zoom" ? (
      <ZoomBoard knobs={knobs} />
    ) : board === "surfaces" ? (
      <SurfacesBoard knobs={knobs} />
    ) : board === "phone" ? (
      <PhoneBoard knobs={knobs} />
    ) : (
      <AltitudesBoard knobs={knobs} />
    );

  return (
    <div
      ref={rootRef}
      className={`lat-lab ins-lab arc-root ${bodyClass}`}
      data-ins-lab=""
      data-ins-board={board}
      data-ins-dir={dirId}
      {...knobAttrs}
    >
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}

      <div className="lat-doc ins-doc" data-ins-doc={board}>
        {boardNode}
      </div>

      {consoleMounted ? (
        <aside
          className="lat-console"
          data-open={consoleOpen || undefined}
          role="group"
          aria-label="Instrument lab controls"
        >
          <div className="lat-console__row">
            <span className="lat-console__title">Board</span>
            {INS_BOARDS.map((b) => (
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
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="lat-btn"
                data-on={theme === t || undefined}
                aria-pressed={theme === t}
                onClick={() => applyTheme(t)}
              >
                {t}
              </button>
            ))}
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
            {INS_DIRECTIONS.map((d) => (
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

          {INS_KNOB_LIST.map(({ key, def }) => (
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
                  onClick={() => applyKnobs({ [key]: v } as Partial<InsKnobs>)}
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
              title="window.__instrument.measure(): every panel, chip, pin and node; collisions, overflow, text under 10px"
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

      {/* The machine mirror: always mounted; every wait in the capture hangs on it. */}
      <p
        className="lat-read ins-read"
        data-stamp={stamp}
        data-board={board}
        data-dir={dirId}
        data-knobs={knobString(knobs)}
        data-theme={theme}
        data-figures={read.figures}
        data-boxes={read.boxes}
        aria-hidden="true"
      />
    </div>
  );
}
