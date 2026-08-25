"use client";

/**
 * HoloLabShell — the harness around the real artifact.
 *
 * It mounts production's `HoloProgramCanvas` (never a lab copy), lets you
 * DRAG the object, and draws the tracked DOM labels exactly as the beat will.
 *
 * ⚠ ROUND 2: THE OBJECT IS FREE AND THE LABELS FOLLOW IT. Round 1's harness
 * drew stations at fixed `left: var(--at)` percentages and the scene was
 * solved to sit under them — which is what forced one camera pose and made
 * the whole thing read flat. Here the scene publishes anchors every frame
 * (`holoAnchorsRef`) and this layer positions the labels from them.
 */

import dynamic from "next/dynamic";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { readHoloAnchors } from "@/components/holo-program/holoAnchorsRef";
import { POST, type HoloWaypoint } from "@/components/holo-program/holoProgramGeom";
import { useThemeStore } from "@/lib/stores/themeStore";

/* Dynamic even here: the lab must exercise the same lazy seam production
   uses, or it proves the drawing and not the mount. */
const HoloProgramCanvas = dynamic(
  () => import("@/components/holo-program/HoloProgramCanvas").then((m) => m.HoloProgramCanvas),
  { ssr: false }
);

/**
 * Stage shapes. The object is no longer bound to the flat board's plot box —
 * `full` is the shape Phase B gives it on the page (a full-bleed band), while
 * the two smaller ones check that it still reads when boxed.
 */
const PRESETS = [
  { id: "full", label: "Full bleed", w: 1440, h: 760 },
  { id: "p1280", label: "1280 band", w: 1160, h: 560 },
  { id: "plot", label: "Old plot box", w: 1020, h: 266 },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

export interface HoloLabShellProps {
  waypoints: readonly HoloWaypoint[];
  priors: readonly string[];
  headTitle: string;
}

function fromUrl<T extends string = string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return (new URLSearchParams(window.location.search).get(key) as T) || fallback;
}

export function HoloLabShell({ waypoints, priors, headTitle }: HoloLabShellProps) {
  const [preset, setPreset] = useState<PresetId>(() => fromUrl<PresetId>("preset", "full"));
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    fromUrl<"dark" | "light">("theme", "dark")
  );
  const [still, setStill] = useState(
    () => typeof window !== "undefined" && fromUrl<string>("still", "0") === "1"
  );
  const [autoRotate, setAutoRotate] = useState(
    () => typeof window === "undefined" || fromUrl<string>("auto", "1") === "1"
  );
  const [labels, setLabels] = useState(true);
  const [replay, setReplay] = useState(0);
  const [ready, setReady] = useState(false);
  const [fps, setFps] = useState(0);
  const [bloom, setBloom] = useState<number>(POST.bloom);
  const [aberration, setAberration] = useState<number>(POST.aberration);

  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const shape = PRESETS.find((p) => p.id === preset) ?? PRESETS[0];

  /**
   * ⚠ THROUGH THE STORE, NEVER BY WRITING `data-theme` DIRECTLY.
   * A raw attribute write flips the CSS and NOTHING else: it does not bump
   * `themeModeRef`, and it does not notify subscribers — so the WebGL layer,
   * which resolves its palette from the store, would keep painting the old
   * theme while the page around it changed. `setMode` writes the ref, the
   * attribute and the notification in one task, which is exactly why it
   * exists (ADR-058). The repo already records this trap for the services
   * card ring's bake.
   */
  useEffect(() => {
    useThemeStore.getState().setMode(theme);
  }, [theme]);

  /* The label layer. Reads the anchors the scene publishes and writes a
     transform — no React state per frame, which is the only way this stays
     cheap while the object spins. */
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      const stage = stageRef.current;
      if (stage) {
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        for (const a of readHoloAnchors()) {
          const el = labelRefs.current[a.id];
          if (!el) continue;
          if (!a.visible) {
            el.style.opacity = "0";
            continue;
          }
          el.style.transform = `translate3d(${(a.x * w).toFixed(1)}px, ${(a.y * h).toFixed(1)}px, 0)`;
          el.style.opacity = String(0.25 + a.frontness * 0.75);
          el.style.zIndex = String(Math.round(a.frontness * 100));
          if (el.dataset.side !== a.side) el.dataset.side = a.side;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* The measurement mirror the capture script waits on — the identity AND
     the numbers in one write, so a stale pair cannot be observed. */
  useEffect(() => {
    const root = document.querySelector("main.hpl");
    if (!root) return;
    root.setAttribute("data-stamp", `${preset}|${theme}|${still ? "rest" : "live"}`);
    root.setAttribute("data-ready", ready ? "1" : "0");
    root.setAttribute("data-labels", String(readHoloAnchors().length));
  }, [preset, theme, still, ready]);

  return (
    <main className="hpl">
      <header className="hpl__bar">
        <span className="hpl__title">HOLO ARTIFACT LAB</span>
        <div className="hpl__grp">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="hpl__btn"
              data-on={p.id === preset ? "" : undefined}
              onClick={() => setPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="hpl__grp">
          <button
            type="button"
            className="hpl__btn"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "DARK" : "LIGHT"}
          </button>
          <button
            type="button"
            className="hpl__btn"
            data-on={autoRotate ? "" : undefined}
            onClick={() => setAutoRotate((v) => !v)}
          >
            AUTO-ROTATE
          </button>
          <button
            type="button"
            className="hpl__btn"
            data-on={still ? "" : undefined}
            onClick={() => setStill((s) => !s)}
          >
            {still ? "HELD STILL" : "ALIVE"}
          </button>
          <button
            type="button"
            className="hpl__btn"
            data-on={labels ? "" : undefined}
            onClick={() => setLabels((v) => !v)}
          >
            LABELS
          </button>
          <button type="button" className="hpl__btn" onClick={() => setReplay((n) => n + 1)}>
            REPLAY INTRO
          </button>
        </div>
        <label className="hpl__slider">
          BLOOM {bloom.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={bloom}
            onChange={(e) => setBloom(Number(e.target.value))}
          />
        </label>
        <label className="hpl__slider">
          ABERR {aberration.toFixed(4)}
          <input
            type="range"
            min={0}
            max={0.004}
            step={0.0002}
            value={aberration}
            onChange={(e) => setAberration(Number(e.target.value))}
          />
        </label>
        <span className="hpl__readout">
          {fps} fps · {ready ? "LIVE" : "…"} · drag to rotate
        </span>
      </header>

      <div className="hpl__wrap">
        <div
          className="hpl__stage"
          ref={stageRef}
          style={{ "--w": `${shape.w}px`, "--h": `${shape.h}px` } as CSSProperties}
        >
          <HoloProgramCanvas
            waypoints={waypoints}
            armed
            still={still}
            autoRotate={autoRotate}
            replayToken={replay}
            onReady={() => setReady(true)}
            className="hpl__gl"
            post={{ bloom, aberration }}
          />

          {/* THE TRACKED LABELS — real DOM, following the object. */}
          {labels ? (
            <div className="hpl__labels" aria-hidden="true">
              {waypoints.map((wp) => (
                <div
                  key={wp.id}
                  className="hpl__lbl"
                  data-seat={wp.seat ? "" : undefined}
                  ref={(el) => {
                    labelRefs.current[wp.id] = el;
                  }}
                >
                  <span className="hpl__lbl-date">{wp.sub}</span>
                  <span className="hpl__lbl-name">{wp.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <p className="hpl__note">
        {headTitle} — drag the object to rotate it. Priors: {priors.join(" · ")}. The seven rings
        are the record (radius = adoption reach at that date); the shells, dust and core are the
        machine it sits in.
      </p>
    </main>
  );
}
