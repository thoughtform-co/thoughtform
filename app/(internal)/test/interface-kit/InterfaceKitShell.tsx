"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { PROOF_CASE } from "@/lib/cases/registry";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { useThemeStore } from "@/lib/stores/themeStore";

/* The REAL frame, borrowed rather than re-drawn — the panel is being judged for
   whether it belongs to THIS, so a lab-drawn approximation of the rails would
   be judging it against a different frame. If the hud-panel-lab is ever deleted
   this moves to `test/_shared/`. */
import { HudFrame } from "../hud-panel-lab/HudFrame";
import { KitProofPanel } from "./panel/KitProofPanel";
import { KitSheet } from "./sheet/KitSheet";
import {
  IK_DEFAULTS,
  IK_DIRECTIONS,
  IK_KNOB_KEYS,
  IK_KNOB_LIST,
  directionOf,
  knobString,
  knobsFor,
  parseIkQuery,
  type IkKnobs,
  type IkMount,
  type IkTheme,
  type IkView,
} from "./variants";

/**
 * InterfaceKitShell — the frame, the bus, the console, and one view.
 *
 * ── WHY THE DOCUMENT REALLY SCROLLS ──────────────────────────────────────
 * ⚠ THE ROOT IS NOT `position: fixed; inset: 0`. `HudNav` prints the nav-corner
 * readout only once `scrollY > innerHeight / 2` (it renders the span empty and
 * writes every character imperatively), and that readout is the one instrument
 * saying which section the reader is in — exactly what the panel below has to
 * feel part of. Under a fixed root it reads blank forever, with no error. So
 * the root carries a runway, the stage is sticky inside it, and a mount task
 * scrolls past the collapse.
 *
 * ── THE BUS ───────────────────────────────────────────────────────────────
 * Three writes, all restored on unmount, in this order for a stated reason:
 *
 *   `--hero-lift` / `--hero-cover` = 1 — ADR-031 U16 reveals the frame by
 *     CLIPPING the rails, both corner clusters and the settings row to the
 *     hero's bottom edge. With no hero the property is absent, every clip
 *     resolves to the full viewport and the frame is invisible.
 *   `servicesRingProgressRef` — written BEFORE the attribute, because
 *     `useActiveSection` reads the ref inside the update the attribute
 *     mutation wakes. Its resting `proofRelease: 1` would print SERVICES over
 *     a casefile.
 *   `data-active-station` — the attribute bus `resolveActiveIdx` reads.
 *
 * ⚠ `data-corridor-engaged` IS NEVER WRITTEN, not even as `"false"`: a
 * statically-present attribute routes the resolver down the corridor branch and
 * lights the wrong row.
 *
 * ── THE URL ───────────────────────────────────────────────────────────────
 * Adopted in a MOUNT EFFECT, never through `useSearchParams` (a CSR bailout of
 * the whole route). Each setter writes only ITS OWN parameter through
 * `history.replaceState`, so no setter needs to know another's value and there
 * is no write effect for Strict Mode's double-invoke to race against.
 */

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/** What the capture drives, so a still need not be a re-navigation. */
export interface InterfaceKitHandle {
  setKnobs(partial: Partial<IkKnobs>): void;
  setDirection(id: string): void;
  setTheme(next: IkTheme): void;
  setMount(next: IkMount): void;
  setView(next: IkView): void;
  setRow(next: string): void;
}

declare global {
  interface Window {
    __interfaceKit?: InterfaceKitHandle;
  }
}

const TRACKS = PROOF_CASE.casefile.tracks;

export function InterfaceKitShell({ hudHtml, bodyClass }: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [knobs, setKnobsState] = useState<IkKnobs>(IK_DEFAULTS);
  const [view, setView] = useState<IkView>("panel");
  const [mount, setMount] = useState<IkMount>("kit");
  const [theme, setTheme] = useState<IkTheme>("dark");
  const [row, setRow] = useState<string>(TRACKS[0].id);
  const [consoleOpen, setConsoleOpen] = useState(true);
  /* ⚠ `?console=0` REMOVES THE CONSOLE, it does not collapse it. Collapsed
     still leaves a row of controls sitting over the directory — the foot of the
     surface being judged — so a still shot that way is a photograph of the lab
     rather than of the composition. */
  const [consoleMounted, setConsoleMounted] = useState(true);
  /** What the PAGE decided, read back off the live DOM — never re-derived. */
  const [read, setRead] = useState({ sector: "—", rail: 0 });

  const setMode = useThemeStore((s) => s.setMode);
  const dirId = directionOf(knobs);
  const dirDef = IK_DIRECTIONS.find((d) => d.id === dirId);

  /* ── Deep link, adopted once ─────────────────────────────────────────── */
  /* eslint-disable react-hooks/set-state-in-effect -- the sanctioned lab
     exception: the URL IS the external system, read exactly once per mount. */
  useEffect(() => {
    const q = parseIkQuery(new URLSearchParams(window.location.search));
    setKnobsState(q.knobs);
    setView(q.view);
    setMount(q.mount);
    setTheme(q.theme);
    if (q.row && TRACKS.some((t) => t.id === q.row)) setRow(q.row);
    if (!q.consoleOn) setConsoleMounted(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const writeParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, "", url.toString());
  }, []);

  /**
   * ⚠ THE URL CARRIES EVERY KNOB, ALWAYS, AND `k` FOLLOWS THE KNOBS.
   * A direction is a named point in the knob space, not a mode: writing the
   * whole set means a hand-mixed URL survives a reload and a shared link never
   * depends on which defaults were current when it was made. `k` is written as
   * the empty string when the set is not a direction, so the parameter never
   * lies about what is on screen.
   */
  const applyKnobs = useCallback((partial: Partial<IkKnobs>) => {
    setKnobsState((prev) => {
      const next = { ...prev, ...partial };
      const url = new URL(window.location.href);
      for (const key of IK_KNOB_KEYS) url.searchParams.set(key, next[key]);
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
    (next: IkTheme) => {
      setTheme(next);
      writeParam("theme", next);
      /* ⚠ THROUGH THE PRODUCTION STORE, never a raw attribute write. The real
         `ThemeToggleButton` is mounted in the corner beside this control, and
         only the store notifies — a bare `setAttribute` would flip the CSS
         while leaving that button reading the old mode. */
      setMode(next);
    },
    [setMode, writeParam]
  );

  const applyView = useCallback(
    (next: IkView) => {
      setView(next);
      writeParam("view", next);
    },
    [writeParam]
  );

  const applyMount = useCallback(
    (next: IkMount) => {
      setMount(next);
      writeParam("mount", next);
    },
    [writeParam]
  );

  const applyRow = useCallback(
    (next: string) => {
      setRow(next);
      writeParam("row", next);
    },
    [writeParam]
  );

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

  /* ── Past the nav's collapse threshold ───────────────────────────────── */
  useEffect(() => {
    // A TASK, not a frame: rAF stalls in a hidden document, and the readout is
    // the instrument the panel is judged against — it may not depend on
    // somebody watching.
    const t = window.setTimeout(() => {
      if (window.scrollY < window.innerHeight * 0.55) {
        window.scrollTo({ top: Math.ceil(window.innerHeight * 0.62), behavior: "auto" });
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  /* ── The readout mirror ──────────────────────────────────────────────── */
  /**
   * Sampled TWO rAFs after any state change, off the live DOM. The capture
   * waits on `data-stamp`, which is only written after that sample — and the
   * stamp's TAIL is the nav sector and the live rail height, two things the
   * script cannot set itself. A gate that waits on a value the script provided
   * is not a gate (the substrate lab lost a whole round to exactly that).
   */
  useEffect(() => {
    let raf = 0;
    const sample = () => {
      const sector =
        document.querySelector<HTMLElement>(".hud__nav__sector__name")?.textContent?.trim() || "—";
      const rail = Math.round(
        document.querySelector<HTMLElement>(".hud__rail")?.getBoundingClientRect().height ?? 0
      );
      setRead((prev) => (prev.sector === sector && prev.rail === rail ? prev : { sector, rail }));
    };
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(sample);
    });
    /* ⚠ AND A TIMER BESIDE IT, BECAUSE rAF STALLS IN A HIDDEN DOCUMENT. Both
       paths run the same idempotent sample and `setRead` no-ops on an equal
       value, so whichever arrives first wins and the other costs nothing. */
    const t = window.setTimeout(sample, 48);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [knobs, view, mount, theme, row]);

  /* ── The capture handle ──────────────────────────────────────────────── */
  useEffect(() => {
    window.__interfaceKit = {
      setKnobs: applyKnobs,
      setDirection: applyDirection,
      setTheme: applyTheme,
      setMount: applyMount,
      setView: applyView,
      setRow: applyRow,
    };
    return () => {
      delete window.__interfaceKit;
    };
  }, [applyKnobs, applyDirection, applyTheme, applyMount, applyView, applyRow]);

  const stamp = `${mount}|${view}|${knobString(knobs)}|${theme}|${row}`;

  /* ⚠ EVERY KNOB IS AN ATTRIBUTE, INCLUDING ITS DEFAULT. The sheet selects on
     `[data-ik-line="single"]`, never on the absence of an attribute, so a rule
     can be read in both directions and a still can always be traced to the
     exact set that drew it. */
  const knobAttrs = Object.fromEntries(
    IK_KNOB_KEYS.map((k) => [`data-ik-${k}`, knobs[k]])
  ) as Record<string, string>;

  return (
    <div
      ref={rootRef}
      className={`ik ${bodyClass}`}
      data-ik=""
      data-ik-view={view}
      data-ik-mount={mount}
      {...knobAttrs}
    >
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}

      <div className="ik-stage">
        {view === "panel" ? (
          <KitProofPanel mount={mount} row={row} onRow={applyRow} />
        ) : (
          <KitSheet />
        )}
      </div>

      {/* The runway. Its only job is to make the document scroll so the nav
          corner collapses and prints its readout; nothing is drawn in it. */}
      <div className="ik-runway" aria-hidden="true" />

      {/* ── Lab console ──────────────────────────────────────────────── */}
      {consoleMounted ? (
        <aside
          className="ik-console"
          data-open={consoleOpen || undefined}
          role="group"
          aria-label="Interface kit controls"
        >
          <div className="ik-console__row">
            <span className="ik-console__title">View</span>
            <button
              type="button"
              className="ik-btn"
              data-on={view === "panel" || undefined}
              aria-pressed={view === "panel"}
              onClick={() => applyView("panel")}
            >
              Panel
            </button>
            <button
              type="button"
              className="ik-btn"
              data-on={view === "sheet" || undefined}
              aria-pressed={view === "sheet"}
              onClick={() => applyView("sheet")}
            >
              Sheet
            </button>

            <span className="ik-console__rule" aria-hidden="true" />

            <span className="ik-console__title">Mount</span>
            <button
              type="button"
              className="ik-btn"
              data-on={mount === "kit" || undefined}
              aria-pressed={mount === "kit"}
              title="The panel recomposed from the production leaves, under the knobs"
              onClick={() => applyMount("kit")}
            >
              kit
            </button>
            <button
              type="button"
              className="ik-btn"
              data-on={mount === "shipped" || undefined}
              aria-pressed={mount === "shipped"}
              title="The real ServicesCasefile, untouched — the control every candidate is shown beside"
              onClick={() => applyMount("shipped")}
            >
              shipped
            </button>

            <span className="ik-console__rule" aria-hidden="true" />

            <span className="ik-console__title">Theme</span>
            <button
              type="button"
              className="ik-btn"
              data-on={theme === "dark" || undefined}
              aria-pressed={theme === "dark"}
              onClick={() => applyTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className="ik-btn"
              data-on={theme === "light" || undefined}
              aria-pressed={theme === "light"}
              onClick={() => applyTheme("light")}
            >
              Light
            </button>

            <button
              type="button"
              className="ik-btn ik-btn--fold"
              onClick={() => setConsoleOpen((v) => !v)}
              aria-expanded={consoleOpen}
            >
              {consoleOpen ? "Hide" : "Show"}
            </button>
          </div>

          <div className="ik-console__row">
            <span className="ik-console__title">Direction</span>
            {IK_DIRECTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                className="ik-btn"
                data-on={dirId === d.id || undefined}
                aria-pressed={dirId === d.id}
                title={d.question}
                onClick={() => applyDirection(d.id)}
              >
                {d.id} · {d.name}
              </button>
            ))}
          </div>

          {IK_KNOB_LIST.map(({ key, def }) => (
            <div className="ik-console__row" key={key}>
              <span className="ik-console__title">{def.label}</span>
              {def.values.map((v) => (
                <button
                  key={v}
                  type="button"
                  className="ik-btn"
                  data-on={knobs[key] === v || undefined}
                  aria-pressed={knobs[key] === v}
                  title={def.note}
                  onClick={() => applyKnobs({ [key]: v } as Partial<IkKnobs>)}
                >
                  {v}
                </button>
              ))}
              {key === "tab" ? (
                <>
                  <span className="ik-console__rule" aria-hidden="true" />
                  <span className="ik-console__title">Row</span>
                  {TRACKS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="ik-btn"
                      data-on={row === t.id || undefined}
                      aria-pressed={row === t.id}
                      onClick={() => applyRow(t.id)}
                    >
                      {t.project}
                    </button>
                  ))}
                </>
              ) : null}
            </div>
          ))}

          <p className="ik-thesis">
            <b>{dirDef ? `${dirDef.id} · ${dirDef.name}` : "Mixed"}</b>
            {dirDef
              ? dirDef.question
              : "a hand-mixed set — no direction claims it, and the stamp says so."}
          </p>
        </aside>
      ) : null}

      {/* ⚠ THE MACHINE MIRROR IS ALWAYS MOUNTED, AND THAT IS THE POINT. Every
          wait in the capture hangs on `data-stamp`; while it lived inside the
          console, `?console=0` — the flag the capture itself passes to get the
          chrome out of the shot — deleted the observable and every cell timed
          out. An observable a presentation flag can remove is not an
          observable. */}
      <p
        className="ik-read"
        data-stamp={`${stamp}|${read.sector}|${read.rail}`}
        data-mount={mount}
        data-view={view}
        data-dir={dirId}
        data-knobs={knobString(knobs)}
        data-theme={theme}
        data-row={row}
        data-sector={read.sector}
        data-rail={read.rail}
        aria-hidden="true"
      />

      <p className="ik-gate-warn">
        Widen to at least 1281px with reduced motion OFF — below 981px the casefile is a static
        document and the panel view is not the composition being judged.
      </p>
    </div>
  );
}
