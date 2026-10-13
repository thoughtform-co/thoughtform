"use client";

/* S4 · SWARM. The stack with no line in it: square dots on one lattice, and
   nothing else (owner, 2026-10-13: "we can tap into cyberpunk and a particle
   system"; his own note of 2026-10-01 on what he keeps pointing at:
   "populated with dense luminous dots").

   The three plates are three kinds of population (`dots.ts`): the team a
   loose, drifting field that thickens into its four workstreams; the layer
   every site of the lattice in order, swelling to a white-hot core; the
   agents a sparse board with a dense chip and modules and dots strung on
   its traces. Dots fall from plate to plate across the gaps, more of them
   the wider the stack is opened.

   One canvas, Canvas 2D. Every dot is a whole number of device pixels on a
   lattice of whole device pixels. `motion === "hold"` paints the frame at
   t = 0 once and schedules nothing; that frame is the still. Every figure
   lettered here is read off the drawing: the dots are counted as they are
   painted. */

import { useEffect, useRef } from "react";

import { factsOf, type FormProps, PLATES, poseAt } from "../model";

import { buildScene, LEAD_STEPS, type Scene } from "./dots";
import { paintScene } from "./paint";

/** How far a plate's words stand past the end of its run of dots, CSS px. */
const WORDS_OFF = 14;

const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");

export function Swarm({ open, motion }: FormProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const openRef = useRef(open);
  const repaint = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const total = el.querySelector<HTMLElement>("[data-sfs-fact='dots']");
    const grid = el.querySelector<HTMLElement>("[data-sfs-fact='grid']");
    const rights = [...el.querySelectorAll<HTMLElement>("[data-sfs-right]")];
    const lefts = [...el.querySelectorAll<HTMLElement>("[data-sfs-left]")];
    const counts = [...el.querySelectorAll<HTMLElement>("[data-sfs-fact='plate']")];

    let scene: Scene | null = null;
    let dpr = 1;
    let raf = 0;
    let t0 = -1;
    let tLast = 0;
    let shownDots = -1;
    let seated = "";

    const size = () => {
      const box = el.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(box.width * dpr));
      const h = Math.max(2, Math.round(box.height * dpr));
      cv.width = w;
      cv.height = h;
      /* one canvas pixel to one device pixel, whatever the box rounds to */
      cv.style.width = `${w / dpr}px`;
      cv.style.height = `${h / dpr}px`;
      const built = buildScene(w, h, dpr);
      scene = built;
      seated = "";
      if (grid) grid.textContent = `${built.L.a * built.L.g} × ${built.L.b * built.L.g} px`;
      counts.forEach((c, i) => {
        c.textContent = fmt(built.plates[i].dots);
      });
    };

    const draw = (t: number) => {
      if (!scene) return;
      /* a tab left in the background comes back a long frame later: the
         falling dots take one ordinary step, not the whole absence */
      const dt = Math.min(0.1, Math.max(0, t - tLast));
      tLast = t;
      const { dots, off } = paintScene(ctx, scene, poseAt(openRef.current), t, dt);
      if (dots !== shownDots) {
        shownDots = dots;
        if (total) total.textContent = fmt(dots);
      }
      /* the words keep level with their plate; they only move when it does */
      const key = off.join(",");
      if (key !== seated) {
        seated = key;
        const reach = (LEAD_STEPS * scene.L.a * scene.L.g) / dpr + WORDS_OFF;
        scene.plates.forEach((p, i) => {
          const r = rights[i];
          const l = lefts[i];
          if (r) {
            r.style.left = `${p.right.x / dpr + reach}px`;
            r.style.top = `${(p.right.y + off[i]) / dpr}px`;
          }
          if (l) {
            l.style.left = `${p.left.x / dpr - reach}px`;
            l.style.top = `${(p.left.y + off[i]) / dpr}px`;
          }
        });
      }
    };

    const frame = (ts: number) => {
      if (t0 < 0) t0 = ts;
      draw((ts - t0) / 1000);
      raf = requestAnimationFrame(frame);
    };

    size();
    if (motion === "run") raf = requestAnimationFrame(frame);
    else draw(0);
    /* held, a change of pose still has to be painted */
    repaint.current = () => {
      if (motion !== "run") draw(0);
    };
    const ro = new ResizeObserver(() => {
      size();
      if (motion !== "run") draw(0);
    });
    ro.observe(el);
    el.setAttribute("data-sfs-painted", "");
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      repaint.current = null;
    };
  }, [motion]);

  useEffect(() => {
    openRef.current = open;
    repaint.current?.();
  }, [open]);

  const facts = factsOf(poseAt(open));

  return (
    <div className="sfs" ref={wrap}>
      <canvas ref={canvas} className="sfs-canvas" aria-hidden />

      <div
        className="sfs-words"
        role="img"
        aria-label="Three square plates stacked, each made only of dots: your team, the layer and your agents"
      >
        {PLATES.map((p) => (
          <div key={p.key} className="sfs-name" data-sfs-right data-tone={p.tone}>
            <span className="sfs-name__step">
              <i aria-hidden />
              {p.n} · {p.step}
            </span>
            <span className="sfs-name__what">{p.name}</span>
            <span className="sfs-name__count">
              <b data-sfs-fact="plate">0</b> dots
            </span>
          </div>
        ))}
        {PLATES.map((p) => (
          <ul key={p.key} className="sfs-holds" data-sfs-left data-tone={p.tone}>
            {p.holds.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        ))}

        <dl className="sfs-read">
          <div>
            <dt>Dots</dt>
            <dd data-sfs-fact="dots">0</dd>
          </div>
          <div>
            <dt>Lattice</dt>
            <dd data-sfs-fact="grid">0</dd>
          </div>
          <div>
            <dt>Plates</dt>
            <dd>
              {facts.plates} · {facts.side} × {facts.side}
            </dd>
          </div>
          <div>
            <dt>Pitch</dt>
            <dd>{facts.pitch.toFixed(2)} u</dd>
          </div>
          <div>
            <dt>Open</dt>
            <dd>{facts.openPct}%</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
