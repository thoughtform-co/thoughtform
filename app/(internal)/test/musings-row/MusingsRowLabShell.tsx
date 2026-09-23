"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MusingsStation } from "@/components/landing/home-v2/musings/MusingsStation";
import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import type { MusingCardData } from "@/lib/musings/types";
import { useThemeStore } from "@/lib/stores/themeStore";

/* The REAL frame, borrowed rather than re-drawn — the row is being judged for
   whether it belongs to THIS. If the hud-panel-lab is ever deleted this moves
   to `test/_shared/`. */
import { HudFrame } from "../hud-panel-lab/HudFrame";

/**
 * MusingsRowLabShell — the frame, the bus, and the production station on a
 * stand-in for the corridor.
 *
 * ── WHY THE DOCUMENT REALLY SCROLLS ──────────────────────────────────────
 * ⚠ THE ROOT IS NOT `position: fixed; inset: 0`. `HudNav` prints its corner
 * readout only past `innerHeight / 2`, and the station's own writer is a
 * SCROLL writer: it pins the stage on a runway, decodes the head once the
 * stage is parked and arms the row after it. A lab that fixed the station in
 * place would show a head that never decodes over cards that never arrive. So
 * the station sits in flow under a one-viewport lead, exactly as it does on
 * the landing under the era stage, and the reader scrolls into it.
 *
 * ── THE STATION IS THE PRODUCTION ONE, AND SO IS ITS RUNG ─────────────────
 * `useMusingsScroll` reads the era's mode OFF THE DOM (`#voidwalker
 * [data-vw-mode]`) to decide whether the station is a transparent stage over
 * a live corridor. This lab supplies that DOM — one hidden marker — the way
 * every lab supplies `data-active-station`: the writer is reading an answer,
 * and here the lab is the one answering. With the mode and the corridor-exit
 * stamp both present, `home-v2.css`'s own promotion rule makes the station
 * transparent at z 6, the sheet's own band closes it, and the glass has the
 * lab's BED to blur — a fixed stand-in for the corridor's light, so the
 * material can be read on a still. Below 1101px there is no stage mode and
 * the station is opaque, as on the landing.
 *
 * ── THE BUS ───────────────────────────────────────────────────────────────
 * `--hero-lift` / `--hero-cover` = 1 (ADR-031 U16 clips the frame to the hero's
 * bottom edge; with no hero the frame is invisible), `data-active-station` =
 * `musings` (what the nav corner prints), `data-corridor-exit` = `true` (the
 * promotion rule's other key). All restored on unmount.
 *
 * ── THE URL ───────────────────────────────────────────────────────────────
 * `?theme=light` · `?n=3|5|7` · `?console=0`. Adopted in a MOUNT EFFECT, never
 * through `useSearchParams` (a CSR bailout of the whole route). Each setter
 * writes only its own parameter.
 */

const COUNTS = [3, 5, 7] as const;
type LabCount = (typeof COUNTS)[number];
type LabTheme = "dark" | "light";

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
  posts: readonly MusingCardData[];
}

export function MusingsRowLabShell({ hudHtml, bodyClass, posts }: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<LabTheme>("dark");
  const [n, setN] = useState<LabCount>(5);
  const [consoleMounted, setConsoleMounted] = useState(true);
  const setMode = useThemeStore((s) => s.setMode);

  /* ── Deep link, adopted once ─────────────────────────────────────────── */
  /* eslint-disable react-hooks/set-state-in-effect -- the sanctioned lab
     exception: the URL IS the external system, read exactly once per mount. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("theme") === "light") setTheme("light");
    const qn = Number(q.get("n"));
    if (qn === 3 || qn === 5 || qn === 7) setN(qn);
    if (q.get("console") === "0") setConsoleMounted(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const writeParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const applyTheme = useCallback(
    (next: LabTheme) => {
      setTheme(next);
      writeParam("theme", next);
      /* ⚠ THROUGH THE PRODUCTION STORE, never a raw attribute write: the real
         theme toggle is mounted in the corner beside this control, and only
         the store notifies it. */
      setMode(next);
    },
    [setMode, writeParam]
  );

  const applyCount = useCallback(
    (next: LabCount) => {
      setN(next);
      writeParam("n", String(next));
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
    html.setAttribute("data-active-station", "musings");
    html.setAttribute("data-corridor-exit", "true");
    return () => {
      html.style.removeProperty("--hero-lift");
      html.style.removeProperty("--hero-cover");
      html.removeAttribute("data-active-station");
      html.removeAttribute("data-corridor-exit");
    };
  }, []);

  /* ── Past the nav's collapse threshold ───────────────────────────────── */
  useEffect(() => {
    // A TASK, not a frame: rAF stalls in a hidden document.
    const t = window.setTimeout(() => {
      if (window.scrollY < window.innerHeight * 0.55) {
        window.scrollTo({ top: Math.ceil(window.innerHeight * 0.62), behavior: "auto" });
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const shown = posts.slice(0, n);

  return (
    <div ref={rootRef} className={`mrl ${bodyClass}`} data-mrl="" data-mrl-n={n}>
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}

      {/* The stand-in for the corridor's light: what the glass blurs. */}
      <div className="mrl__bed" aria-hidden="true" />

      {/* ⚠ THE ERA'S MODE, SUPPLIED. The writer reads `#voidwalker
          [data-vw-mode]` per frame to know whether it is a stage over a live
          corridor; this is the DOM it reads. Hidden, empty, inert. */}
      <div id="voidwalker" data-vw-mode="hologram" hidden />

      {/* One viewport of lead, so the station arrives by scrolling — as it does
          under the era stage — and the nav corner has collapsed by then. */}
      <div className="mrl__lead" aria-hidden="true" />

      <main className="stations mrl__stations">
        {/* ⚠ THE STATION'S OWN MARKUP: `#musings.station`, the id every rule in
            the sheet and the writer's `closest("#musings")` climb key on. The
            landing mounts the station through a nested root into a
            `[data-musings-root]` slot inside it; here it renders in place —
            same station, same subtree, one root fewer. */}
        <section id="musings" className="station" data-station="musings">
          {/* Re-keyed on the count so a change re-renders a fresh row with the
              newest post open, rather than React patching cards in place under
              an attribute the writer has moved. */}
          <MusingsStation key={n} posts={shown} />
        </section>
      </main>

      {/* Room to scroll the station out, so the exit can be read too. */}
      <div className="mrl__tail" aria-hidden="true" />

      {consoleMounted ? (
        <aside className="mrl-console" role="group" aria-label="Musings row lab controls">
          <span className="mrl-console__title">Musings row · placeholder copy</span>
          <div className="mrl-console__row">
            {COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                className="mrl-btn"
                data-on={c === n || undefined}
                aria-pressed={c === n}
                onClick={() => applyCount(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mrl-console__row">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="mrl-btn"
                data-on={t === theme || undefined}
                aria-pressed={t === theme}
                onClick={() => applyTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
