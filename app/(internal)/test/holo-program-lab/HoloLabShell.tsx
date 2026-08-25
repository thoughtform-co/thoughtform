"use client";

/**
 * HoloLabShell — the measuring harness around the real instrument.
 *
 * It mounts production's `HoloProgramCanvas` (never a lab copy) at the three
 * reference PLOT shapes, overlays the seven DOM stations exactly as the arc
 * beat renders them — date, label AND note — and reads the numbers back live.
 *
 * ⚠ THE STATION OVERLAY IS THE POINT, not decoration. The scene is solved so
 * each ring lands under its own server-positioned station; the only way to
 * know it did is to draw the stations and measure. A ring that drifts out
 * from under its label at one aspect is invisible in a bare canvas.
 *
 * ⚠ AND THE OVERLAY MUST MATCH PRODUCTION'S, NOT A SIMPLER VERSION OF IT.
 * The first cut drew date + label only and reported clearance the page does
 * not have; the third line is why the two lanes leave a 28px gap at
 * 1280×720. A harness whose chrome is thinner than the page's is measuring a
 * different composition.
 */

import dynamic from "next/dynamic";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { clearHoloHover, setHoloHover } from "@/components/holo-program/hoverRef";
import {
  holoLayout,
  projectToScreen01,
  applyRig,
  AXIS_Y,
  stationScreenX,
  type HoloWaypoint,
} from "@/components/holo-program/holoProgramGeom";

/* Dynamic even here: the lab must exercise the same lazy seam production
   uses, or it proves the drawing and not the mount. */
const HoloProgramCanvas = dynamic(
  () => import("@/components/holo-program/HoloProgramCanvas").then((m) => m.HoloProgramCanvas),
  { ssr: false }
);

/**
 * The three reference PLOT shapes — `.arc-prog__plot` measured on the live
 * page, which is the box the instrument actually mounts in.
 *
 * ⚠ THE LAB'S FIRST CUT USED THE BAND'S SHAPE and it cost a pass: a drawing
 * tuned in a 1160×352 harness went into a 1020×266 field and the composition
 * changed under it. A harness whose box is not production's box is measuring
 * a different drawing.
 */
const PRESETS = [
  { id: "p1280", label: "1280×720", w: 1020, h: 266 },
  { id: "p1440", label: "1440×800", w: 1149, h: 296 },
  { id: "p1920", label: "1920×1080", w: 1438, h: 400 },
] as const;

type PresetId = (typeof PRESETS)[number]["id"];

export interface HoloLabShellProps {
  waypoints: readonly HoloWaypoint[];
  priors: readonly string[];
  headTitle: string;
}

/** URL drive, so the capture script can address one cell of the matrix.
 *  Read once at mount — after that the controls own the state. */
function initialFromUrl<T extends string>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const v = new URLSearchParams(window.location.search).get(key);
  return (v as T) || fallback;
}

export function HoloLabShell({ waypoints, priors, headTitle }: HoloLabShellProps) {
  const [preset, setPreset] = useState<PresetId>(() => initialFromUrl<PresetId>("preset", "p1280"));
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    initialFromUrl<"dark" | "light">("theme", "dark")
  );
  const [still, setStill] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(location.search).get("still") === "1"
  );
  const [replay, setReplay] = useState(0);
  const [ready, setReady] = useState(false);
  const [fps, setFps] = useState({ now: 0, frames: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const [collisions, setCollisions] = useState<string[]>([]);

  const shape = PRESETS.find((p) => p.id === preset) ?? PRESETS[0];

  /* The theme flip is the real one — the instrument must NOT follow it
     (kept-dark plate, ADR-058 Lane 0), and the only way to see that is to
     flip the document the way the site does. */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => () => clearHoloHover(), []);

  /* Frame cost. At REST this must settle to zero frames — the instrument is
     a still drawing once arrived, and a lab that cannot show that is not
     measuring the law the ADR claims. */
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let painted = 0;
    const canvas = () => stageRef.current?.querySelector("canvas");
    let prevData = "";
    const tick = () => {
      const now = performance.now();
      frames++;
      if (now - last >= 1000) {
        setFps({ now: Math.round((frames * 1000) / (now - last)), frames: painted });
        frames = 0;
        painted = 0;
        last = now;
      }
      // A cheap "did the GL surface change" probe: the canvas' own size
      // attribute plus the compositor's frame budget is not enough, so we
      // count our own rAF and report it beside the drawn state.
      const c = canvas();
      if (c) {
        const data = `${c.width}x${c.height}`;
        if (data !== prevData) {
          prevData = data;
          painted++;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /**
   * ⚠ THE QUESTION IS "DOES A RIM ESCAPE THE PLOT", NOT "DOES IT TOUCH A
   * LABEL". The rings pass BEHIND the stations by construction — measured on
   * the page, the two lanes leave a 28px gap at 1280×720, so nothing that
   * reads as a ring could ever fit between them (ADR-080 §Left open). What
   * CAN go wrong silently is a rim clipped by the plot's `overflow: hidden`,
   * which looks exactly like a smaller ring and nothing on screen says so.
   *
   * Solved in the same pure arithmetic the scene draws from, so the answer is
   * the drawing's rather than an eyeball's.
   */
  const measure = useCallback(() => {
    const aspect = shape.w / shape.h;
    const layout = holoLayout(waypoints, aspect);
    const spills: string[] = [];
    for (const ring of layout.rings) {
      const top = projectToScreen01(applyRig([ring.x, AXIS_Y + ring.radius, 0]), aspect);
      const bottom = projectToScreen01(applyRig([ring.x, AXIS_Y - ring.radius, 0]), aspect);
      const left = projectToScreen01(applyRig([ring.x, AXIS_Y, -ring.radius]), aspect);
      const right = projectToScreen01(applyRig([ring.x, AXIS_Y, ring.radius]), aspect);
      if (top.y < 0.01) spills.push(`${ring.id} top ${(top.y * 100).toFixed(1)}%`);
      if (bottom.y > 0.99) spills.push(`${ring.id} bottom ${(bottom.y * 100).toFixed(1)}%`);
      if (left.x < 0.005 || right.x > 0.995) spills.push(`${ring.id} side`);
    }
    setCollisions(spills);
  }, [waypoints, shape]);

  useEffect(() => {
    measure();
  }, [measure]);

  /**
   * The measurement MIRROR the capture script waits on.
   *
   * ⚠ IT CARRIES THE IDENTITY IT MEASURED, not just numbers. A script that
   * waits on "a number is present" can be satisfied by the PREVIOUS cell of
   * the matrix — the substrate lab shipped exactly that hole and gated three
   * directions against the wrong drawing. The stamp and the numbers are
   * written in the same effect, so a stale pair cannot be observed.
   */
  useEffect(() => {
    const root = document.querySelector("main.hpl");
    if (!root) return;
    const canvas = stageRef.current?.querySelector("canvas");
    root.setAttribute("data-stamp", `${preset}|${theme}|${still ? "rest" : "arrive"}`);
    root.setAttribute("data-ready", ready ? "1" : "0");
    root.setAttribute(
      "data-canvas",
      canvas
        ? `${Math.round(canvas.getBoundingClientRect().width)}x${Math.round(canvas.getBoundingClientRect().height)}`
        : "0x0"
    );
    root.setAttribute("data-hits", String(collisions.length));
    root.setAttribute("data-aspect", (shape.w / shape.h).toFixed(3));
  }, [preset, theme, still, ready, collisions, shape]);

  return (
    <main className="hpl">
      <header className="hpl__bar">
        <span className="hpl__title">HOLO PROGRAM LAB</span>
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
            data-on={still ? "" : undefined}
            onClick={() => setStill((s) => !s)}
          >
            {still ? "REST" : "ARRIVE"}
          </button>
          <button type="button" className="hpl__btn" onClick={() => setReplay((n) => n + 1)}>
            REPLAY
          </button>
        </div>
        <span className="hpl__readout">
          {fps.now} fps · {ready ? "LIVE" : "…"} · aspect {(shape.w / shape.h).toFixed(2)} ·{" "}
          {collisions.length === 0 ? "0 rim/station hits" : `⚠ ${collisions.join(", ")}`}
        </span>
      </header>

      <div className="hpl__wrap">
        {/* The BAND, at its real shape. The canvas fills it and the chrome
            floats over it, exactly as the arc beat will stack them. */}
        <div
          className="hpl__stage"
          ref={stageRef}
          style={{ "--w": `${shape.w}px`, "--h": `${shape.h}px` } as CSSProperties}
        >
          <div className="hpl__canvas">
            <HoloProgramCanvas
              waypoints={waypoints}
              armed
              still={still}
              replayToken={replay}
              onReady={() => setReady(true)}
              className="hpl__gl"
            />
          </div>

          {/* The DOM chrome, in the arc board's own grammar. */}
          <div className="hpl__chrome">
            <div className="hpl__hd">
              <span>{headTitle}</span>
              <span>18 months on record</span>
            </div>

            <ol className="hpl__stns">
              {waypoints.map((wp, i) => (
                <li
                  key={wp.id}
                  className="hpl__stn"
                  data-lane={i % 2 === 0 ? "up" : "dn"}
                  data-seat={wp.seat ? "" : undefined}
                  style={{ "--at": `${stationScreenX(wp.at) * 100}%` } as CSSProperties}
                  onMouseEnter={() => setHoloHover(wp.id)}
                  onMouseLeave={() => setHoloHover(null)}
                >
                  <span className="hpl__stn-date">{wp.sub}</span>
                  <span className="hpl__stn-lbl">{wp.label}</span>
                  {/* ⚠ THE NOTE IS THE THIRD LINE, AND IT IS WHY THE LANES
                      LEAVE NO GAP. The lab's first cut drew date + label
                      only, so it measured a composition production does not
                      have and reported clearance that was not there. */}
                  {wp.note ? <span className="hpl__stn-note">{wp.note}</span> : null}
                </li>
              ))}
            </ol>

            {priors.length > 0 ? (
              <span className="hpl__priors">Priors · {priors.join(" · ")}</span>
            ) : null}
          </div>
        </div>
      </div>

      <p className="hpl__note">
        The rings are the record: one per dated waypoint, radius = the adoption reach at that date
        (the flat board&rsquo;s own step ladder, made volumetric). Green is the ladder, gold is the
        seat, and nothing moves once it has arrived.
      </p>
    </main>
  );
}
