"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { useThemeStore } from "@/lib/stores/themeStore";
import { CHARACTER_ERAS, type CharacterEraId } from "@/lib/voidwalker/characterEras";
import { PROOF_CASE } from "@/lib/cases/registry";

import { ErasSurface } from "./eras/ErasSurface";
import { HudFrame } from "./HudFrame";
import { ProofSurface } from "./proof/ProofSurface";
import {
  HPL_DIRECTION_LIST,
  HPL_DIRECTIONS,
  HPL_FOOT_RULES,
  HPL_MATERIALS,
  hplDirection,
  parseHplQuery,
  type HplDirectionId,
  type HplFootRule,
  type HplMaterial,
  type HplSurfaceId,
  type HplTheme,
} from "./variants";

/**
 * HudPanelLabShell — the frame, the bus, the console, and one surface.
 *
 * ── WHY THE DOCUMENT REALLY SCROLLS ──────────────────────────────────────
 * ⚠ THE ROOT IS NOT `position: fixed; inset: 0` like most frame labs.
 * `HudNav` prints the nav-corner readout ONLY once `scrollY > innerHeight/2`
 * (it renders the span empty and writes every character imperatively), and the
 * readout is the one instrument that says which section the reader is in —
 * which is exactly what the panels below have to feel part of. Under a fixed
 * root it reads 0 forever, with no error. So the root carries a runway, the
 * stage is sticky inside it, and a mount effect scrolls past the collapse.
 *
 * ── THE BUS ───────────────────────────────────────────────────────────────
 * Three writes, all restored on unmount:
 *
 *   `--hero-lift` / `--hero-cover` = 1 — ADR-031 U16 reveals the frame by
 *     CLIPPING the rails, both corner clusters and the settings row to the
 *     hero's bottom edge. With no hero the property is absent, every clip
 *     resolves to the full viewport and the frame is invisible.
 *   `servicesRingProgressRef` — written BEFORE the attribute, because
 *     `useActiveSection` reads the ref inside the update the attribute
 *     mutation wakes. Resting `proofRelease: 1` prints SERVICES where
 *     production prints PROOF for the whole casefile dwell.
 *   `data-active-station` — the attribute bus `resolveActiveIdx` reads, and
 *     the thing that makes the corner say PROOF / VOIDWALKER.
 *
 * ⚠ `data-corridor-engaged` IS NEVER WRITTEN, not even as `"false"`: a
 * statically-present attribute routes the resolver down the corridor branch
 * and lights the wrong row (the anchor lab and the synthetic journey both
 * carry this warning).
 *
 * ── THE URL ───────────────────────────────────────────────────────────────
 * Adopted in a MOUNT EFFECT, never through `useSearchParams` (a CSR bailout of
 * the whole route). Each setter writes only ITS OWN parameter through
 * `history.replaceState`, so no setter needs to know another's value and there
 * is no write effect for Strict Mode's double-invoke to race against — the
 * hour the client-stack lab lost to exactly that.
 */

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
}

/** What the capture script drives, so a still is never a re-navigation. */
export interface HudPanelLabHandle {
  setSurface(next: HplSurfaceId): void;
  setDirection(next: HplDirectionId): void;
  setEra(next: CharacterEraId): void;
  setRow(next: string): void;
  setProofIn(next: number): void;
  setMaterial(next: HplMaterial): void;
  setFootRule(next: HplFootRule): void;
}

declare global {
  interface Window {
    __hudPanelLab?: HudPanelLabHandle;
  }
}

const TRACKS = PROOF_CASE.casefile.tracks;

export function HudPanelLabShell({ hudHtml, bodyClass }: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [surface, setSurface] = useState<HplSurfaceId>("proof");
  const [dir, setDir] = useState<HplDirectionId>("v0");
  const [theme, setTheme] = useState<HplTheme>("dark");
  const [era, setEra] = useState<CharacterEraId>(CHARACTER_ERAS[0].id);
  const [row, setRow] = useState<string>(TRACKS[0].id);
  const [proofIn, setProofIn] = useState(1);
  const [mat, setMat] = useState<HplMaterial>("line");
  const [footRule, setFootRule] = useState<HplFootRule>("none");
  const [consoleOpen, setConsoleOpen] = useState(true);
  /* ⚠ `?console=0` REMOVES THE CONSOLE, it does not collapse it. Collapsed
     still leaves one row of controls sitting on the era reel and the
     casefile's directory — the two things at the foot of each surface — so a
     still shot that way is a photograph of the lab, not of the composition. */
  const [consoleMounted, setConsoleMounted] = useState(true);
  /** What the SURFACE decided, read back off the live DOM — never re-derived. */
  const [read, setRead] = useState({ sector: "—", stamp: "" });

  const definition = hplDirection(dir);
  const setMode = useThemeStore((s) => s.setMode);

  /* ── Deep link, adopted once ─────────────────────────────────────────── */
  /* eslint-disable react-hooks/set-state-in-effect -- the sanctioned lab
     exception: the URL IS the external system, read exactly once per mount. */
  useEffect(() => {
    const q = parseHplQuery(new URLSearchParams(window.location.search));
    setSurface(q.s);
    setDir(q.v);
    setTheme(q.theme);
    setEra(q.era);
    setRow(q.row);
    setProofIn(q.proofIn);
    setMat(q.mat);
    setFootRule(q.footRule);
    if (new URLSearchParams(window.location.search).get("console") === "0")
      setConsoleMounted(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const writeParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const applySurface = useCallback(
    (next: HplSurfaceId) => {
      setSurface(next);
      writeParam("s", next);
    },
    [writeParam]
  );

  const applyDirection = useCallback(
    (next: HplDirectionId) => {
      setDir(next);
      writeParam("v", next);
      /* ⚠ THE MATERIAL FOLLOWS THE DIRECTION'S OWN DEFAULT unless the URL
         pinned one. `v2` argues WITH its ground; every other direction opens
         on line work. Reading the live URL rather than state is what keeps
         this setter dependency-free. */
      const pinned = new URL(window.location.href).searchParams.get("mat");
      if (pinned !== "line" && pinned !== "glass") {
        setMat(HPL_DIRECTIONS[next].id === "v2" ? "glass" : "line");
      }
    },
    [writeParam]
  );

  const applyTheme = useCallback(
    (next: HplTheme) => {
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

  const applyEra = useCallback(
    (next: CharacterEraId) => {
      setEra(next);
      writeParam("era", next);
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

  const applyProofIn = useCallback(
    (next: number) => {
      const v = Math.min(1, Math.max(0, next));
      setProofIn(v);
      writeParam("in", v.toFixed(3));
    },
    [writeParam]
  );

  const applyMaterial = useCallback(
    (next: HplMaterial) => {
      setMat(next);
      writeParam("mat", next);
    },
    [writeParam]
  );

  const applyFootRule = useCallback(
    (next: HplFootRule) => {
      setFootRule(next);
      writeParam("foot", next);
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

    // The ring bridge FIRST — `useActiveSection` reads it inside the update the
    // attribute mutation below wakes, and its resting `proofRelease: 1` would
    // print SERVICES over a casefile.
    const restore = { ...servicesRingProgressRef.current };
    if (surface === "proof") {
      servicesRingProgressRef.current = { progress: 0, proofRelease: 0, proofPresence: 1 };
    }
    html.setAttribute("data-active-station", surface === "proof" ? "services" : "voidwalker");

    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
      html.removeAttribute("data-active-station");
      // Module-global and shared with production paths: "Nothing may ever
      // leave this at 0 as a resting state."
      servicesRingProgressRef.current = restore;
    };
  }, [surface]);

  /* ── Past the nav's collapse threshold ───────────────────────────────── */
  useEffect(() => {
    // `HudNav` collapses on `scrollY > innerHeight * 0.5` and the readout
    // stays blank below it. A TASK, not a frame: rAF stalls in a hidden
    // document, and the readout is the instrument the panels are judged
    // against — it may not depend on somebody watching.
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
   * script waits on `data-stamp`, which is only written after that sample —
   * so it is a wait the script cannot satisfy by itself (the substrate-lab
   * lesson: a gate that waits on a number the script set is not a gate).
   */
  useEffect(() => {
    let raf = 0;
    const sample = () => {
      const sector =
        document.querySelector<HTMLElement>(".hud__nav__sector__name")?.textContent?.trim() || "—";
      const stamp = `${surface}|${dir}|${theme}|${era}|${row}|${proofIn.toFixed(3)}|${mat}|${footRule}`;
      setRead((prev) =>
        prev.sector === sector && prev.stamp === stamp ? prev : { sector, stamp }
      );
    };
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(sample);
    });
    /* ⚠ AND A TIMER BESIDE IT, BECAUSE rAF STALLS IN A HIDDEN DOCUMENT. The
       stamp is what every wait in the capture script hangs on; if the only
       path to it is a frame, a hidden pane turns a wait into a hang. Both
       paths run the same idempotent sample and `setRead` no-ops on an equal
       value, so whichever arrives first wins and the other costs nothing. */
    const t = window.setTimeout(sample, 48);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [surface, dir, theme, era, row, proofIn, mat, footRule]);

  /* ── The capture handle ──────────────────────────────────────────────── */
  useEffect(() => {
    window.__hudPanelLab = {
      setSurface: applySurface,
      setDirection: applyDirection,
      setEra: applyEra,
      setRow: applyRow,
      setProofIn: applyProofIn,
      setMaterial: applyMaterial,
      setFootRule: applyFootRule,
    };
    return () => {
      delete window.__hudPanelLab;
    };
  }, [
    applySurface,
    applyDirection,
    applyEra,
    applyRow,
    applyProofIn,
    applyMaterial,
    applyFootRule,
  ]);

  return (
    <div
      ref={rootRef}
      className={`hpl ${bodyClass}`}
      data-hpl-surface={surface}
      data-hpl-dir={dir}
      data-hpl-mat={mat}
      data-hpl-foot={footRule}
    >
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}

      <div className="hpl-stage">
        {surface === "proof" ? (
          <ProofSurface
            chrome={definition.chrome}
            dir={dir}
            row={row}
            onRow={applyRow}
            proofIn={proofIn}
          />
        ) : (
          <ErasSurface chrome={definition.chrome} dir={dir} era={era} onEra={applyEra} />
        )}
      </div>

      {/* The runway. Its only job is to make the document scroll so the nav
          corner collapses and prints its readout; nothing is drawn in it. */}
      <div className="hpl-runway" aria-hidden="true" />

      {/* ── Lab console ──────────────────────────────────────────────── */}
      {consoleMounted ? (
        <aside
          className="hpl-console"
          data-open={consoleOpen || undefined}
          role="group"
          aria-label="HUD panel lab controls"
        >
          <div className="hpl-console__row">
            <span className="hpl-console__title">Surface</span>
            <button
              type="button"
              className="hpl-btn"
              data-on={surface === "proof" || undefined}
              aria-pressed={surface === "proof"}
              onClick={() => applySurface("proof")}
            >
              Proof
            </button>
            <button
              type="button"
              className="hpl-btn"
              data-on={surface === "eras" || undefined}
              aria-pressed={surface === "eras"}
              onClick={() => applySurface("eras")}
            >
              Eras
            </button>

            <span className="hpl-console__rule" aria-hidden="true" />

            <span className="hpl-console__title">Theme</span>
            <button
              type="button"
              className="hpl-btn"
              data-on={theme === "dark" || undefined}
              aria-pressed={theme === "dark"}
              onClick={() => applyTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              className="hpl-btn"
              data-on={theme === "light" || undefined}
              aria-pressed={theme === "light"}
              onClick={() => applyTheme("light")}
            >
              Light
            </button>

            <span className="hpl-console__rule" aria-hidden="true" />

            <span className="hpl-console__title">Material</span>
            {HPL_MATERIALS.map((m) => (
              <button
                key={m}
                type="button"
                className="hpl-btn"
                data-on={mat === m || undefined}
                aria-pressed={mat === m}
                title={
                  m === "glass"
                    ? "The console's own ground (void-deep .86) on every enclosure"
                    : "Line work only — no fills anywhere"
                }
                onClick={() => applyMaterial(m)}
              >
                {m}
              </button>
            ))}

            <button
              type="button"
              className="hpl-btn hpl-btn--fold"
              onClick={() => setConsoleOpen((v) => !v)}
              aria-expanded={consoleOpen}
            >
              {consoleOpen ? "Hide" : "Show"}
            </button>
          </div>

          <div className="hpl-console__row">
            <span className="hpl-console__title">Direction</span>
            {HPL_DIRECTION_LIST.map((d) => (
              <button
                key={d.id}
                type="button"
                className="hpl-btn"
                data-on={dir === d.id || undefined}
                aria-pressed={dir === d.id}
                title={d.thesis}
                onClick={() => applyDirection(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>

          {surface === "proof" ? (
            <div className="hpl-console__row">
              <span className="hpl-console__title">Row</span>
              {TRACKS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="hpl-btn"
                  data-on={row === t.id || undefined}
                  aria-pressed={row === t.id}
                  onClick={() => applyRow(t.id)}
                >
                  {t.project}
                </button>
              ))}
              <span className="hpl-console__rule" aria-hidden="true" />
              <label className="hpl-slider">
                <span className="hpl-console__title">in {proofIn.toFixed(2)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={proofIn}
                  aria-label="Arrival clock"
                  onChange={(e) => applyProofIn(Number(e.target.value))}
                />
              </label>
            </div>
          ) : (
            <div className="hpl-console__row">
              <span className="hpl-console__title">Era</span>
              {CHARACTER_ERAS.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="hpl-btn"
                  data-on={era === e.id || undefined}
                  aria-pressed={era === e.id}
                  onClick={() => applyEra(e.id)}
                >
                  {e.short}
                </button>
              ))}
              <span className="hpl-console__rule" aria-hidden="true" />
              <span className="hpl-console__title">Foot rule</span>
              {HPL_FOOT_RULES.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="hpl-btn"
                  data-on={footRule === f || undefined}
                  aria-pressed={footRule === f}
                  title={
                    f === "rule"
                      ? "The band rule the owner deleted twice, band-inset — an amendment to look at, not a default"
                      : "No rule under the reel (what ships)"
                  }
                  onClick={() => applyFootRule(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          <p className="hpl-thesis">
            <b>{definition.label}</b>
            {definition.thesis}
          </p>
        </aside>
      ) : null}

      {/* ⚠ THE MACHINE MIRROR IS ALWAYS MOUNTED, AND THAT IS THE POINT. Every
          wait in the capture script hangs on `data-stamp`; while it lived
          inside the console, `?console=0` — the flag the capture itself
          passes to get the chrome out of the shot — deleted the observable and
          every cell timed out. An observable that a presentation flag can
          remove is not an observable. */}
      <p
        className="hpl-read"
        data-stamp={read.stamp}
        data-surface={surface}
        data-dir={dir}
        data-theme={theme}
        data-era={era}
        data-row={row}
        data-in={proofIn.toFixed(3)}
        data-mat={mat}
        data-foot={footRule}
        data-sector={read.sector}
        aria-hidden="true"
      />

      <p className="hpl-gate-warn">
        Widen to at least 1281px with reduced motion OFF — below 981px the casefile is a static
        document and below 1101px the era stage is the middle rung.
      </p>
    </div>
  );
}
