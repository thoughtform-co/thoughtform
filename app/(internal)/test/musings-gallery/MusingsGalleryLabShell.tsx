"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MusingsStation } from "@/components/landing/home-v2/musings/MusingsStation";
import { RailInstruments } from "@/components/landing/v7/rail-instruments/RailInstruments";
import { SettingsCluster } from "@/components/landing/v7/rail-instruments/SettingsCluster";
import { RAIL_INSTRUMENTS } from "@/components/landing/v7/rail-instruments/flags";
import { THEME_TOGGLE } from "@/components/landing/v7/themeToggle";
import { useThemeStore } from "@/lib/stores/themeStore";

import { HudFrame } from "../hud-panel-lab/HudFrame";

import type { GalleryPost } from "./directions/kit";
import { COVER_KINDS, type CoverKind } from "./directions/NoteCover";
import {
  MG_DIRECTIONS,
  MG_DIRECTION_IDS,
  MG_GALLERIES,
  isDirectionId,
  type MgDirectionId,
} from "./directions/registry";

/**
 * MusingsGalleryLabShell — the frame, the bus, and the PRODUCTION station with
 * a direction in its `gallery` slot.
 *
 * Everything but the directions is `../musings-row/`'s shell, and for the
 * same reasons (read its header): the document really scrolls, because the
 * station's writer is a scroll writer that pins the stage, decodes the head
 * and arms the arrival; the era's mode is supplied as one hidden marker so the
 * station goes transparent over the lab's BED; the frame's bus is written on
 * `<html>` and restored on unmount.
 *
 * ── THE STATION IS RE-KEYED ON THE DIRECTION ─────────────────────────────
 * ⚠ The writer's listeners bind at MOUNT, against the row it finds then. A
 * direction swapped under a mounted station would leave the shipped row, on
 * the way back to `v0`, with no listeners at all — so the key carries the
 * direction, the source and the count.
 *
 * ── THE STAMP ─────────────────────────────────────────────────────────────
 * `data-mg-stamp` = `v|src|n|theme`, rendered from ADOPTED state. The capture
 * waits on it, never on a number it could satisfy itself (the substrate lab's
 * lesson: a wait on `location.search` passed before the page had read it).
 *
 * ── THE URL ───────────────────────────────────────────────────────────────
 * `?v=v0…v5` · `?src=live|lab` · `?n=3|5|7` · `?theme=light` · `?console=0`,
 * adopted in a MOUNT EFFECT (never `useSearchParams`, a CSR bailout of the
 * whole route), each setter writing only its own parameter.
 */

const COUNTS = [3, 5, 7] as const;
type LabCount = (typeof COUNTS)[number];
type LabSource = "live" | "lab";
type LabTheme = "dark" | "light";

interface ShellProps {
  hudHtml: string;
  bodyClass: string;
  live: readonly GalleryPost[];
  lab: readonly GalleryPost[];
  today: string;
}

export function MusingsGalleryLabShell({ hudHtml, bodyClass, live, lab, today }: ShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [v, setV] = useState<MgDirectionId>("v1");
  const [src, setSrc] = useState<LabSource>("live");
  const [n, setN] = useState<LabCount>(5);
  const [theme, setTheme] = useState<LabTheme>("dark");
  const [cover, setCover] = useState<CoverKind>("dial");
  const [thumbs, setThumbs] = useState(true);
  const [consoleMounted, setConsoleMounted] = useState(true);
  const [adopted, setAdopted] = useState(false);
  const setMode = useThemeStore((s) => s.setMode);

  /* ── Deep link, adopted once ─────────────────────────────────────────── */
  /* eslint-disable react-hooks/set-state-in-effect -- the sanctioned lab
     exception: the URL IS the external system, read exactly once per mount. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const qv = q.get("v");
    if (isDirectionId(qv)) setV(qv);
    if (q.get("src") === "lab") setSrc("lab");
    const qn = Number(q.get("n"));
    if (qn === 3 || qn === 5 || qn === 7) setN(qn);
    if (q.get("theme") === "light") setTheme("light");
    const qc = q.get("cover") as CoverKind | null;
    if (qc && COVER_KINDS.includes(qc)) setCover(qc);
    if (q.get("thumbs") === "0") setThumbs(false);
    if (q.get("console") === "0") setConsoleMounted(false);
    setAdopted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const writeParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState(null, "", url.toString());
  }, []);

  /* ── The theme, through the production store ─────────────────────────── */
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
    const t = window.setTimeout(() => {
      if (window.scrollY < window.innerHeight * 0.55) {
        window.scrollTo({ top: Math.ceil(window.innerHeight * 0.62), behavior: "auto" });
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const shown = src === "live" ? live : lab.slice(0, n);
  const Gallery = v === "v0" ? null : MG_GALLERIES[v];
  const stamp = adopted
    ? `${v}|${src}|${src === "live" ? live.length : n}|${theme}|${cover}|${thumbs ? 1 : 0}`
    : undefined;
  const knobs = { cover, thumbs: thumbs ? "1" : "0" };

  return (
    <div
      ref={rootRef}
      className={`mrl ${bodyClass}`}
      data-mrl=""
      data-mg-lab=""
      data-mg-v={v}
      data-mg-stamp={stamp}
    >
      <HudFrame hudHtml={hudHtml} />
      {RAIL_INSTRUMENTS && <RailInstruments containerRef={rootRef} />}
      {THEME_TOGGLE && <SettingsCluster />}

      <div className="mrl__bed" aria-hidden="true" />
      <div id="voidwalker" data-vw-mode="hologram" hidden />
      <div className="mrl__lead" aria-hidden="true" />

      <main className="stations mrl__stations">
        <section id="musings" className="station" data-station="musings">
          <MusingsStation
            key={`${v}|${src}|${n}`}
            posts={shown}
            gallery={Gallery ? <Gallery posts={shown} today={today} knobs={knobs} /> : undefined}
          />
        </section>
      </main>

      <div className="mrl__tail" aria-hidden="true" />

      {consoleMounted ? (
        <aside className="mrl-console mg-console" role="group" aria-label="Musings gallery lab">
          <span className="mrl-console__title">{MG_DIRECTIONS[v].label}</span>
          <div className="mrl-console__row">
            {MG_DIRECTION_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className="mrl-btn"
                title={MG_DIRECTIONS[id].thesis}
                data-on={id === v || undefined}
                aria-pressed={id === v}
                onClick={() => {
                  setV(id);
                  writeParam("v", id);
                }}
              >
                {id}
              </button>
            ))}
          </div>
          <div className="mrl-console__row">
            {(["live", "lab"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="mrl-btn"
                data-on={s === src || undefined}
                aria-pressed={s === src}
                onClick={() => {
                  setSrc(s);
                  writeParam("src", s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {src === "lab" ? (
            <div className="mrl-console__row">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="mrl-btn"
                  data-on={c === n || undefined}
                  aria-pressed={c === n}
                  onClick={() => {
                    setN(c);
                    writeParam("n", String(c));
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
          {v === "v4" ? (
            <div className="mrl-console__row">
              {COVER_KINDS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="mrl-btn"
                  data-on={c === cover || undefined}
                  aria-pressed={c === cover}
                  onClick={() => {
                    setCover(c);
                    writeParam("cover", c);
                  }}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                className="mrl-btn"
                data-on={thumbs || undefined}
                aria-pressed={thumbs}
                onClick={() => {
                  setThumbs(!thumbs);
                  writeParam("thumbs", thumbs ? "0" : "1");
                }}
              >
                thumbs
              </button>
            </div>
          ) : null}
          <div className="mrl-console__row">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="mrl-btn"
                data-on={t === theme || undefined}
                aria-pressed={t === theme}
                onClick={() => {
                  setTheme(t);
                  writeParam("theme", t);
                }}
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
