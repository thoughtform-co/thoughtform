"use client";

/* The lab's one bar: how the dots fly, how fine they are, how the mark is
   set on the layer, and a button that
   plays the act, so the flow can be watched whole without scrolling it.

   The switches are links (the page reads them on the server). Play scrolls
   the page itself at one even pace, from the opening at rest to the last
   team, and lets go the moment the reader touches the wheel or a key. */

import { useEffect, useRef, useState } from "react";

import { FLIES, type Fly } from "./engine/flight";
import { GRAINS } from "./engine/lattice";
import { type Mark, MARKS } from "./engine/mark";

/** Screens a second. */
const PACE = 0.42;
/** A breath before the page starts to move, seconds. */
const HOLD = 0.3;

export function LabBar({ fly, n, mark }: { fly: Fly; n?: number; mark: Mark }) {
  const [playing, setPlaying] = useState(false);
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => () => stop.current?.(), []);

  const href = (next: { fly?: Fly; n?: number | null; mark?: Mark }) => {
    const f = next.fly ?? fly;
    const grain = next.n === null ? undefined : (next.n ?? n);
    const k = next.mark ?? mark;
    const q = new URLSearchParams();
    if (f !== "fall") q.set("fly", f);
    if (grain) q.set("n", String(grain));
    if (k !== "lit") q.set("mark", k);
    const s = q.toString();
    return s ? `?${s}` : "?";
  };

  const play = () => {
    if (playing) {
      stop.current?.();
      return;
    }
    const es = document.querySelector<HTMLElement>(".psw .es-runway");
    const xn = document.querySelector<HTMLElement>(".psw .xn");
    if (!es || !xn) return;
    const vh = window.innerHeight;
    /* from where the opening comes to rest: the top of its hold */
    const hold = document.querySelector<HTMLElement>(".psw-hold");
    const from =
      (hold ? hold.getBoundingClientRect().top : es.getBoundingClientRect().top - vh) +
      window.scrollY;
    const xnBox = xn.getBoundingClientRect();
    const to = xnBox.top + window.scrollY + xnBox.height - vh;
    const span = (to - from) / (vh * PACE);
    let raf = 0;
    let t0 = -1;
    const end = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", end);
      window.removeEventListener("touchstart", end);
      window.removeEventListener("keydown", end);
      stop.current = null;
      setPlaying(false);
    };
    const step = (ts: number) => {
      if (t0 < 0) t0 = ts;
      const t = (ts - t0) / 1000 - HOLD;
      const k = Math.min(1, Math.max(0, t / span));
      window.scrollTo({ top: from + (to - from) * k, behavior: "instant" });
      if (k >= 1) end();
      else raf = requestAnimationFrame(step);
    };
    window.addEventListener("wheel", end, { passive: true });
    window.addEventListener("touchstart", end, { passive: true });
    window.addEventListener("keydown", end);
    stop.current = end;
    setPlaying(true);
    window.scrollTo({ top: from, behavior: "instant" });
    raf = requestAnimationFrame(step);
  };

  return (
    <nav className="psw-bar" aria-label="Proposal swarm">
      <span className="psw-bar__title">Proposal swarm</span>
      <span className="psw-bar__set">
        <b>Fly</b>
        {FLIES.map((f) => (
          <a key={f} href={href({ fly: f })} data-on={f === fly ? "" : undefined}>
            {f}
          </a>
        ))}
      </span>
      <span className="psw-bar__set">
        <b>Grain</b>
        <a href={href({ n: null })} data-on={n ? undefined : ""}>
          fit
        </a>
        {GRAINS.slice(0, 2).map((g) => (
          <a key={g} href={href({ n: g })} data-on={g === n ? "" : undefined}>
            {g}
          </a>
        ))}
      </span>
      <span className="psw-bar__set">
        <b>Mark</b>
        {MARKS.map((k) => (
          <a key={k} href={href({ mark: k })} data-on={k === mark ? "" : undefined}>
            {k}
          </a>
        ))}
      </span>
      <button type="button" onClick={play} data-on={playing ? "" : undefined}>
        {playing ? "Stop" : "Play"}
      </button>
      <output id="psw-fact" />
    </nav>
  );
}
