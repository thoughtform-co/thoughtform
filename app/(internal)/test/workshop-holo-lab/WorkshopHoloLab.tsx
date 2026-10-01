"use client";

/**
 * WorkshopHoloLab — the directions, side by side (ADR-140, round two).
 *
 * Each card mounts production's `HoloStageCanvas` (through the same lazy seam
 * the page uses) on one direction's spec and seats its words as DOM spans at
 * their anchors' crop fractions — nothing lettered on the object. The theme
 * flips through the STORE (never a stamped attribute: the painters read the
 * store), and the dials are the material's own.
 */

import dynamic from "next/dynamic";
import { type CSSProperties, useEffect, useMemo, useState } from "react";

import { DIRECTIONS, DIRECTION_IDS, type Direction } from "@/components/holo-stage/directions";
import { createAnchorChannel } from "@/components/holo-stage/stageAnchors";
import { stageToCrop, toThree, type StageCamera } from "@/components/holo-stage/stageFit";
import { useThemeStore } from "@/lib/stores/themeStore";

const HoloStageCanvas = dynamic(
  () => import("@/components/holo-stage/HoloStageCanvas").then((m) => m.HoloStageCanvas),
  { ssr: false }
);

function fromUrl(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

const WIDTHS = [1280, 1440, 1920] as const;

function DirectionCard({
  dir,
  scan,
  sweep,
  width,
  replay,
}: {
  dir: Direction;
  scan: number;
  sweep: boolean;
  width: number;
  replay: number;
}) {
  const channel = useMemo(() => createAnchorChannel(), []);
  const [live, setLive] = useState(false);
  const spec = useMemo(() => (sweep ? dir.spec : { ...dir.spec, sweep: undefined }), [dir, sweep]);
  const f = spec.frame;
  const view = spec.view ?? "stage";
  const seats = useMemo(
    () =>
      dir.labels.map((l) => {
        const p = stageToCrop(toThree(l.at.a, l.at.b, l.at.z), f, view);
        return { l, ax: p.x / f.w, at: p.y / f.h };
      }),
    [dir, f, view]
  );
  const vantage =
    view === "flat"
      ? "face-on"
      : view === "stage"
        ? "az 45 · el 22 (the stage)"
        : `az ${view.azimuthDeg} · el ${view.elevationDeg}`;
  /* The stage's px at this width, for the label offsets. */
  const stageW = Math.min(width, 1920) * 0.64;
  const scale = stageW / 1075;

  return (
    <section className="whd" id={`dir-${dir.id}`} data-holo={live ? "live" : "static"}>
      <header className="whd__head">
        <span className="whd__fig">{dir.figure}</span>
        <span className="whd__name">{dir.name}</span>
        <span className="whd__ref">← {dir.reference}</span>
        <p className="whd__claim">{dir.claim}</p>
        <span className="whd__fig">{vantage}</span>
      </header>
      <div
        className="whd__stage"
        style={{ aspectRatio: `${f.w} / ${f.h}`, width: `min(100%, ${stageW}px)` }}
      >
        <div className="whd__gl">
          <HoloStageCanvas
            key={`${dir.id}-${replay}-${sweep}-${vantage}`}
            spec={spec}
            channel={channel}
            armed
            scan={scan}
            onReady={() => setLive(true)}
          />
        </div>
        {seats.map(({ l, ax, at }) => (
          <span
            key={l.id}
            className="whd__lbl"
            data-kind={l.kind ?? "name"}
            data-lit={l.lit ? "" : undefined}
            data-anchor={l.anchor ?? "start"}
            style={
              {
                "--ax": ax,
                "--at": at,
                "--dx": `${(l.dx ?? 0) * scale}px`,
                "--dy": `${(l.dy ?? 0) * scale}px`,
                "--rot": `${l.rot ?? 0}deg`,
              } as CSSProperties
            }
          >
            {l.text}
          </span>
        ))}
      </div>
    </section>
  );
}

export function WorkshopHoloLab() {
  const [only] = useState(() => fromUrl("only", "").split(",").filter(Boolean));
  const [scan, setScan] = useState(() => Number(fromUrl("scan", "0.08")));
  const [sweep, setSweep] = useState(() => fromUrl("sweep", "on") !== "off");
  const [width, setWidth] = useState(() => Number(fromUrl("w", "1920")));
  /* A vantage override for every direction; "own" keeps each direction's. */
  const [az, setAz] = useState(() => fromUrl("az", "own"));
  const [el, setEl] = useState(() => fromUrl("el", "own"));
  const [replay, setReplay] = useState(0);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  /* `?theme=light` on arrival, through the store. */
  useEffect(() => {
    const t = fromUrl("theme", "");
    if (t === "light" || t === "dark") setMode(t);
  }, [setMode]);

  const override: StageCamera | undefined = useMemo(
    () =>
      az !== "own" && el !== "own"
        ? { azimuthDeg: Number(az), elevationDeg: Number(el) }
        : undefined,
    [az, el]
  );
  const dirs = useMemo(
    () =>
      DIRECTION_IDS.filter((id) => only.length === 0 || only.includes(id)).map((id) =>
        DIRECTIONS[id](override)
      ),
    [only, override]
  );

  return (
    <div className="whl">
      <div className="whl__bar">
        <span className="whl__title">WORKSHOP HOLO LAB · ADR-140 · ROUND TWO</span>
        <label>
          scan
          <select value={scan} onChange={(e) => setScan(Number(e.target.value))}>
            {[0, 0.05, 0.08, 0.12, 0.18].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          sweep
          <select value={sweep ? "on" : "off"} onChange={(e) => setSweep(e.target.value === "on")}>
            <option value="on">on</option>
            <option value="off">off</option>
          </select>
        </label>
        <label>
          width
          <select value={width} onChange={(e) => setWidth(Number(e.target.value))}>
            {WIDTHS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label>
          azimuth
          <select value={az} onChange={(e) => setAz(e.target.value)}>
            <option value="own">own</option>
            {[15, 22, 30, 38, 45, 55, 65].map((v) => (
              <option key={v} value={v}>
                {v}°
              </option>
            ))}
          </select>
        </label>
        <label>
          elevation
          <select value={el} onChange={(e) => setEl(e.target.value)}>
            <option value="own">own</option>
            {[10, 16, 22, 30, 40, 52, 65].map((v) => (
              <option key={v} value={v}>
                {v}°
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setMode(mode === "light" ? "dark" : "light")}>
          theme: {mode}
        </button>
        <button type="button" onClick={() => setReplay((n) => n + 1)}>
          replay arrival
        </button>
        <span className="whl__note">{dirs.length} directions · pick by name</span>
      </div>
      {dirs.map((d) => (
        <DirectionCard key={d.id} dir={d} scan={scan} sweep={sweep} width={width} replay={replay} />
      ))}
    </div>
  );
}
