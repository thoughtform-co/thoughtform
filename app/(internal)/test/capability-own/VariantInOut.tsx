"use client";

/* D · IN, THEN OUT. The language the proposal's stack speaks now (S4·E, a
   dot to a site), told as the engagement: Thoughtform comes in as its mark
   in gold dots, settles inside every workstream, gathers round each in turn
   and leaves a core of gold in it, hangs back thinned, and leaves the frame.
   The cores stay; the workstreams pass work along a line between them on
   their own. The choreography is `inout.ts`; this paints it. */

import { type CSSProperties, useEffect, useRef } from "react";

import { CROWD_DOTS, D, newSwarm, swarmAt } from "./inout";
import { held, seg, STREAMS, W } from "./model";
import { Chip, Word } from "./shared";

const READOUT = {
  enter: { when: "Week 1", what: "Thoughtform comes in" },
  embed: { when: "Week 1 · on site", what: "Inside every workstream" },
  coach: { when: "Weeks 2–3 · remote", what: "One owner at a time" },
  lead: { when: "Week 4 · remote", what: "Your team leads" },
  leave: { when: "After", what: "On its own" },
} as const;

/** The page's tones, read off the section (they follow the theme). */
function tones(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    green: v("--co-green", "#7a9e6a"),
    gold: v("--co-gold", "#caa554"),
    dawn: v("--co-dawn", "#ebe3d6"),
  };
}

export function VariantInOut({ p, still }: { p: number; still: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clock = useRef(p);
  useEffect(() => {
    clock.current = p;
  }, [p]);

  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;
    const S = newSwarm();
    let raf = 0;
    let t0 = -1;
    let dpr = 1;
    let col = tones(el);

    const size = () => {
      const r = el.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(2, Math.round(r.width * dpr));
      cv.height = Math.max(2, Math.round(r.height * dpr));
      cv.style.width = `${cv.width / dpr}px`;
      cv.style.height = `${cv.height / dpr}px`;
      col = tones(el);
    };

    const paint = (time: number) => {
      const u = cv.width / W;
      const X = (x: number) => Math.round(x * u);
      const Y = (y: number) => Math.round(y * u);
      const dot = (x: number, y: number, s: number) => ctx.fillRect(X(x) - s / 2, Y(y) - s / 2, s, s);
      ctx.clearRect(0, 0, cv.width, cv.height);
      swarmAt(clock.current, S);
      const after = S.gone;
      const sz = Math.max(2, Math.round(2.4 * u));
      const sz2 = Math.max(2, Math.round(3.2 * u));

      /* the line the crowds pass work along, and its taps, after */
      if (after > 0) {
        ctx.globalAlpha = 0.5 * seg(after, 0.3, 0.8);
        ctx.fillStyle = col.dawn;
        for (let x = D.crowds[0]; x <= D.crowds[3]; x += 6) dot(x, D.busY, Math.max(1, Math.round(u)));
        for (const cx of D.crowds)
          for (let y = D.crowdY + D.crowdR * 0.82 + 6; y < D.busY; y += 6) dot(cx, y, Math.max(1, Math.round(u)));
        /* work passing along it, on the clock */
        ctx.globalAlpha = seg(after, 0.5, 1);
        for (let i = 0; i < 5; i++) {
          const f = (time * 0.18 + i / 5) % 1;
          dot(D.crowds[0] + (D.crowds[3] - D.crowds[0]) * f, D.busY, sz2);
        }
      }

      /* the four crowds */
      CROWD_DOTS.forEach((dots, k) => {
        const owned = S.kept[k];
        ctx.fillStyle = col.green;
        for (const [x, y] of dots) {
          ctx.globalAlpha = 0.38 + 0.5 * owned;
          dot(x, y, sz);
        }
      });

      /* week four: thin lines from the huddle down to every crowd */
      if (S.remote > 0) {
        ctx.globalAlpha = 0.45 * S.remote;
        ctx.fillStyle = col.gold;
        for (const cx of D.crowds) {
          const [x0, y0] = D.hover;
          const steps = 26;
          for (let s = 1; s < steps; s += 2) {
            const f = s / steps;
            dot(x0 + (cx - x0) * f, y0 + 18 + (D.crowdY - D.crowdR - 8 - (y0 + 18)) * f, Math.max(1, Math.round(u)));
          }
        }
      }

      /* the gold: keepers in their cores pulse a little once kept */
      ctx.fillStyle = col.gold;
      for (let d = 0; d < D.swarm; d++) {
        const keeper = d < 4 * D.keep ? Math.floor(d / D.keep) : -1;
        const pulse = keeper >= 0 && S.kept[keeper] >= 1 && !still ? 0.82 + 0.18 * Math.sin(time * 2.2 + keeper) : 1;
        ctx.globalAlpha = S.a[d] * pulse;
        dot(S.x[d], S.y[d], keeper >= 0 && S.kept[keeper] >= 1 ? sz2 : sz);
      }
      ctx.globalAlpha = 1;
    };

    const frame = (ts: number) => {
      if (t0 < 0) t0 = ts;
      paint(still ? 0 : (ts - t0) / 1000);
      raf = requestAnimationFrame(frame);
    };
    size();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(size);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [still]);

  const S = swarmAt(p);
  const now = READOUT[S.stretch];
  const t = held(p, 0.04, 0.06);

  return (
    <figure
      className="co-fig"
      aria-label="Four workstreams as four crowds of green dots. Thoughtform comes in as its mark in gold dots, settles inside every workstream in week one, gathers round each in turn and leaves a core of gold in it in weeks two and three, hangs back thinned in week four, and leaves the frame; the workstreams keep their gold and pass work between them on their own."
    >
      <div className="co-canvas" ref={box}>
        <canvas ref={canvas} aria-hidden />
      </div>
      <Word x={12} y={30} className="co-mono co-tag--l">
        <b className="co-mono__key">{now.when}</b>
      </Word>
      <Word x={12} y={52} className="co-readout co-tag--l">
        {now.what}
      </Word>
      {STREAMS.map((s, i) => (
        <Chip
          key={s.id}
          id={s.id}
          name={s.name}
          x={D.crowds[i] - 100}
          y={372}
          owned={S.kept[i] >= 1}
          className="co-chip--under"
        />
      ))}
      {STREAMS.map((s, i) => (
        <Word
          key={s.id}
          x={D.crowds[i]}
          y={410}
          className="co-mono co-tag co-tag--c co-tag--green"
          style={{ opacity: S.kept[i] } as CSSProperties}
        >
          Skill · owner
        </Word>
      ))}
      <Word
        x={1188}
        y={30}
        className="co-mono co-mono--gold co-tag--r"
        style={{ opacity: seg(t, 0.9, 0.97) } as CSSProperties}
      >
        Thoughtform has moved on
      </Word>
      <Word
        x={1188}
        y={52}
        className="co-readout co-tag--r"
        style={{ opacity: seg(t, 0.92, 1) } as CSSProperties}
      >
        The layer stays with your team
      </Word>
    </figure>
  );
}
