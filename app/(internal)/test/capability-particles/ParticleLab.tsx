"use client";

/* The lab's canvas, laid over the opening's figure, and its bar.

   The section's title and its four workstream chips are the opening's own
   (`StackFlow`, by reference); the lab's sheet hides what it draws besides
   them. One canvas sits exactly over the figure, so a sketch draws in the
   figure's own frame. A sketch plays once from the moment the page opens,
   then rests; Replay plays it again. No scroll drives it. */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { DARK, paletteOf, parseRgb } from "../proposal-swarm/engine/palette";

import { geomOf, newDots, type Sketch } from "./sketch/core";
import { SKETCHES, type SketchId, sketchOf } from "./sketch";

const LIVE = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";
const subscribe = (notify: () => void) => {
  const mq = window.matchMedia(LIVE);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};
const liveNow = () => window.matchMedia(LIVE).matches;

/** The page's four colours, as the theme has them now. */
function tonesOf(el: HTMLElement) {
  const css = getComputedStyle(el);
  const v = (name: string) => css.getPropertyValue(name);
  return {
    ground: parseRgb(v("--void-rgb"), DARK.ground),
    bone: parseRgb(v("--dawn-rgb"), DARK.bone),
    gold: parseRgb(v("--gold-ink"), DARK.gold),
    green: parseRgb(v("--atreides-ink"), DARK.green),
  };
}

export function ParticleLab({ v, at, still }: { v: SketchId; at: number | null; still: boolean }) {
  const live = useSyncExternalStore(subscribe, liveNow, () => false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef<HTMLOutputElement>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const cv = canvas.current;
    const root = cv?.parentElement;
    const ctx = cv?.getContext("2d");
    const fig = root?.querySelector<HTMLElement>(".pl-fig");
    if (!cv || !root || !ctx || !fig) return;
    let sketch: Sketch | null = null;
    let palette: string[] = [];
    let D = newDots(16384);
    let raf = 0;
    let t0 = -1;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = root.getBoundingClientRect();
      const r = fig.getBoundingClientRect();
      const w = Math.max(2, Math.round(r.width * dpr));
      const h = Math.max(2, Math.round(r.height * dpr));
      cv.style.left = `${(r.left - box.left).toFixed(2)}px`;
      cv.style.top = `${(r.top - box.top).toFixed(2)}px`;
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        cv.style.width = `${w / dpr}px`;
        cv.style.height = `${h / dpr}px`;
      }
      sketch = sketchOf(v).build(geomOf(w, h, dpr));
      palette = paletteOf([1, 1, 1], tonesOf(root));
      D = newDots(16384);
      root.setAttribute("data-cp-ready", "1");
    };
    const draw = (ts: number) => {
      if (!sketch) return;
      if (t0 < 0) t0 = ts;
      /* a still, or the moment the address asks for, stands; so does the
         rest, for a reader who asked for less motion; otherwise the sketch
         plays from the page's opening */
      const t = at ?? (still || !live ? sketch.rest : (ts - t0) / 1000);
      sketch.frame(t, D);
      ctx.clearRect(0, 0, cv.width, cv.height);
      let style = -1;
      for (let i = 0; i < D.n; i++) {
        if (D.style[i] !== style) {
          style = D.style[i];
          ctx.fillStyle = palette[style];
        }
        const s = D.size[i];
        ctx.fillRect(D.x[i] - (s >> 1), D.y[i] - (s >> 1), s, s);
      }
      if (clock.current) clock.current.textContent = `${t.toFixed(1)} s`;
    };
    const frame = (ts: number) => {
      draw(ts);
      raf = requestAnimationFrame(frame);
    };
    build();
    raf = requestAnimationFrame(frame);

    let again = 0;
    const rebuild = () => {
      cancelAnimationFrame(again);
      again = requestAnimationFrame(build);
    };
    const ro = new ResizeObserver(rebuild);
    ro.observe(root);
    void document.fonts.ready.then(rebuild);
    const theme = new MutationObserver(() => {
      palette = paletteOf([1, 1, 1], tonesOf(root));
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(again);
      ro.disconnect();
      theme.disconnect();
      root.removeAttribute("data-cp-ready");
    };
  }, [live, v, at, still, run]);

  return (
    <>
      <canvas className="cp-canvas" ref={canvas} aria-hidden />
      {still ? null : (
        <nav className="psw-bar cp-bar" aria-label="Capability, in particles">
          <span className="psw-bar__title">Capability</span>
          <span className="psw-bar__set">
            {SKETCHES.map((s) => (
              <a key={s.id} href={`?v=${s.id}`} data-on={s.id === v ? "" : undefined}>
                {s.id.toUpperCase()} · {s.name}
              </a>
            ))}
          </span>
          <button type="button" onClick={() => setRun((n) => n + 1)}>
            Replay
          </button>
          <output ref={clock} />
        </nav>
      )}
    </>
  );
}
