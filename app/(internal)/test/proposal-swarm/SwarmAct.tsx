"use client";

/* The swarm's canvas, and the few words that stand beside it.

   One track, laid over the three sections the stack crosses; inside it one
   sticky screen, and on that one canvas. The track is this section's first
   child and reaches a screen above it, so the canvas scrolls in with the
   opening, holds through both hops and both pins, and leaves with the
   network's last screen: it is never moved by script.

   The three sections are mounted as they are, their drawings hidden by the
   lab's sheet. They keep their own scroll readers; this one reads the scroll
   too and writes only what is its own: the canvas, and the six phrases the
   steps set beside their plates (`EmbedStack`'s callouts, by reference; their
   leader lines went with the drawing).

   No per-frame React state: the engine is plain functions over typed
   arrays, built once a size (`engine/world.ts`). */

import { useEffect, useRef, useSyncExternalStore } from "react";

import { CALLOUTS } from "@/components/xb-proposal/embed/EmbedStack";

import { clocksAt, type Stop, STOPS, stopY } from "./engine/clocks";
import { type Fly, frameAt, newFrame } from "./engine/flight";
import { measure, readTones, trackBox } from "./engine/measure";
import { newPaint, paint } from "./engine/paint";
import { buildWorld, widthOf, type World } from "./engine/world";

/* The frame tier and up, and only for a reader who has not asked for less
   motion: below either, the lab's sheet hides nothing and the page is the
   travelling copy as it stands. */
const LIVE = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";
const subscribe = (notify: () => void) => {
  const mq = window.matchMedia(LIVE);
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
};
const liveNow = () => window.matchMedia(LIVE).matches;

const TONES = ["green", "gold", "bone"] as const;
const WORDS = CALLOUTS.flatMap((pair, plate) =>
  pair.map((c) => ({ plate: plate as 0 | 1 | 2, side: c.side, lines: c.lines }))
);
/** How far a phrase stands off its plate's side corner, CSS px. */
const WORD_OFF = 28;

export function SwarmAct({
  fly,
  n,
  still,
  at,
}: {
  fly: Fly;
  /** Sites a unit, held; absent, the lattice that fits. */
  n?: number;
  /** A still: nothing rides the clock, so a shoot is repeatable. */
  still: boolean;
  /** A named stop to open on. */
  at?: Stop;
}) {
  const live = useSyncExternalStore(subscribe, liveNow, () => false);
  const track = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!live) return;
    const tr = track.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!tr || !cv || !ctx) return;

    let world: World | null = null;
    let F = newFrame(0);
    const P = newPaint(readTones(tr));
    let raf = 0;
    let t0 = -1;
    let onScreen = true;
    let opened = false;
    const said: string[] = [];

    const build = () => {
      const m = measure(tr);
      if (!m) return;
      const box = trackBox(tr, m);
      tr.style.top = `${box.top.toFixed(2)}px`;
      tr.style.height = `${box.height.toFixed(2)}px`;
      const w = Math.max(2, Math.round(tr.clientWidth * m.dpr));
      const h = Math.max(2, Math.round(m.vh * m.dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
        /* one canvas pixel to one device pixel, whatever the box rounds to */
        cv.style.width = `${w / m.dpr}px`;
        cv.style.height = `${h / m.dpr}px`;
      }
      world = buildWorld(m, { n });
      F = newFrame(world.pool.count);
      said.length = 0;
      /* the page's facts, all true: what the lab's bar and a shoot read */
      const { pick } = world;
      tr.dataset.pswDots = String(world.dots);
      tr.dataset.pswLattice = `${pick.a}:${pick.b} x${pick.n}`;
      tr.dataset.pswWidth = widthOf(world).toFixed(0);
      tr.dataset.pswStops = JSON.stringify(
        Object.fromEntries(STOPS.map((s) => [s, Math.round(stopY(s, m.vh, m.runways))]))
      );
      const fact = document.getElementById("psw-fact");
      if (fact)
        fact.textContent = `${world.dots.toLocaleString("en-US").replace(/,/g, " ")} dots · ${pick.a}:${pick.b} · ${widthOf(world).toFixed(0)} px`;
      if (at && !opened) {
        opened = true;
        window.scrollTo({ top: stopY(at, m.vh, m.runways), behavior: "instant" });
      }
    };

    const seatWords = (W: World) => {
      const steps = F.state === "steps" && F.whole ? W.steps(F.p1) : null;
      const seat = F.whole;
      WORDS.forEach((word, i) => {
        const el = words.current[i];
        if (!el) return;
        const on = !!steps && steps.step === word.plate && (word.plate === 2 || !steps.stacked);
        let pose = "";
        if (steps && seat) {
          const corner = W.scene.plates[word.plate][word.side === "l" ? "left" : "right"];
          const x =
            (seat.ox + corner.x) / W.metrics.dpr + (word.side === "l" ? -WORD_OFF : WORD_OFF);
          const y = (seat.oy + corner.y + seat.lift[word.plate]) / W.metrics.dpr;
          pose = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        }
        const key = `${on ? 1 : 0}${pose}`;
        if (said[i] === key) return;
        said[i] = key;
        if (pose) el.style.transform = pose;
        el.toggleAttribute("data-on", on);
      });
    };

    const draw = (ts: number) => {
      if (!world) return;
      const t = still || t0 < 0 ? 0 : (ts - t0) / 1000;
      const c = clocksAt(window.scrollY, world.metrics.vh, world.metrics.runways);
      frameAt(world, c, t, fly, F);
      paint(ctx, world, F, t, P, cv.width, cv.height);
      seatWords(world);
      tr.dataset.pswState = F.state;
    };
    const frame = (ts: number) => {
      if (t0 < 0) t0 = ts;
      draw(ts);
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    };

    build();
    run();
    tr.setAttribute("data-psw-ready", "1");

    /* a size is a new world: the seats move, and the lattice with them */
    let again = 0;
    const rebuild = () => {
      cancelAnimationFrame(again);
      again = requestAnimationFrame(() => {
        build();
        run();
      });
    };
    const ro = new ResizeObserver(rebuild);
    ro.observe(document.documentElement);
    if (tr.offsetParent) ro.observe(tr.offsetParent);
    window.addEventListener("resize", rebuild);
    void document.fonts.ready.then(rebuild);

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      run();
    });
    io.observe(tr);
    document.addEventListener("visibilitychange", run);

    /* the theme's switch: the same dots in the page's other four colours */
    const theme = new MutationObserver(() => {
      P.tones = readTones(tr);
      P.key = "";
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(again);
      ro.disconnect();
      io.disconnect();
      theme.disconnect();
      window.removeEventListener("resize", rebuild);
      document.removeEventListener("visibilitychange", run);
      tr.removeAttribute("data-psw-ready");
    };
  }, [live, fly, n, still, at]);

  if (!live) return null;
  return (
    <div
      className="psw-track"
      ref={track}
      data-psw-fly={fly}
      data-psw-still={still ? "" : undefined}
    >
      <div className="psw-pin">
        <canvas className="psw-canvas" ref={canvas} aria-hidden />
        <div className="psw-words" aria-hidden>
          {WORDS.map((word, i) => (
            <span
              key={word.lines.join(" ")}
              className="psw-word"
              data-side={word.side}
              data-tone={TONES[word.plate]}
              ref={(el) => {
                words.current[i] = el;
              }}
            >
              <span className="psw-word__in">
                <i />
                {word.lines[0]}
                <br />
                {word.lines[1]}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
