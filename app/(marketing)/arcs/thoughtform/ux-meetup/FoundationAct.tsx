"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  EDGE,
  ISO_PHI,
  ISO_S,
  basisOf,
  coreModel,
  dot3,
  orbitAt,
  projP,
  ringAround,
  type Camera,
  type CoreModel,
} from "@/components/arcs/figures/foundation/mind";
import {
  CARD,
  FACING,
  SCREEN_X,
  STACK_L,
  VB,
  axesAt,
  cable,
  capabilityTop,
  lerp,
  plateCorner,
  plateOrigin,
  plateSocket,
  sheetPoses,
  smooth,
  U,
  type M6,
  type P2,
  type V3,
} from "@/components/arcs/figures/foundation/scene";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { UX_MEETUP_ARC } from "@/lib/arcs/content/ux-meetup";

/**
 * FoundationAct — one scene across three beats (ADR-156 U5 to U8): what it
 * can make, intelligence as the interface, an intelligence. The examples face
 * the reader one by one as framed slabs under their own head, as Unsiloed
 * sets its words over its drawing, and lie down in the stack on the left,
 * whose capability axis grows with it; on the way to the next beat the floor
 * and the axis fall away and the stack cascades to the centre; the model's
 * core stands over it and its cords plug into every plate the moment the
 * beat lands. After the line about software the core alone faces the reader,
 * between a tool and a collaborator.
 *
 * ⚠ A READER on the talk's scroll (one passive listener, one rAF) that
 * writes only its own layer. It is shown only while one of its beats is the
 * beat up (`data-uxm-active`, the tail's reader), above the terminal tier.
 * The sheets are SVG on exact plane matrices (`scene.ts`); the core
 * (`mind.ts`) is drawn ONCE per pose into an offscreen layer, depth-sorted,
 * in perspective, with its glow, and only its signals move on top; the cords
 * and runs are the live canvas; the words are DOM.
 */

const CUT = 22;
const W = CARD.w;
const H = CARD.h;
const INSET = 12;
const chamferPts = (w: number, h: number, cut: number, x = 0, y = 0): [number, number][] => [
  [x, y],
  [x + w - cut, y],
  [x + w, y + cut],
  [x + w, y + h],
  [x + cut, y + h],
  [x, y + h - cut],
];
const chamferOf = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
const OUTER = chamferPts(W, H, CUT);
const chamfer = chamferOf(OUTER);
const inner = chamferOf(chamferPts(W - 2 * INSET, H - 2 * INSET, CUT - 6, INSET, INSET));
const mat = (m: M6) => `matrix(${m.map((v) => v.toFixed(4)).join(" ")})`;
const apply = (m: M6, x: number, y: number): P2 => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

/** The tray a plate sits on: its little grid, a margin past its edges. */
const TRAY = 26;
const trayPath = (() => {
  const d: string[] = [chamferOf(chamferPts(W + 2 * TRAY, H + 2 * TRAY, CUT + 10, -TRAY, -TRAY))];
  for (let x = -TRAY; x <= W + TRAY; x += 35) d.push(`M${x} ${-TRAY} L${x} ${H + TRAY}`);
  for (let y = -TRAY; y <= H + TRAY; y += 35) d.push(`M${-TRAY} ${y} L${W + TRAY} ${y}`);
  return d.join(" ");
})();

/** The cords: no two alike (owner: "not all be the same size ... gold,
    green, white, red"). Width in viewBox px. */
const CORDS = [
  { tone: "gold", w: 3.4 },
  { tone: "green", w: 1.4 },
  { tone: "ink", w: 2.4 },
  { tone: "red", w: 1.1 },
  { tone: "gold", w: 2.2 },
  { tone: "green", w: 2.8 },
] as const;

/** The interface beat's core: three-quarters, at the isometric's pitch,
    over the stack; a pose it holds. */
const MIND_IFC: Camera = { psi: 0.62, phi: ISO_PHI, s: ISO_S * 0.74, o: { x: 806, y: 254 } };
/** The intelligence beat's core: one face to the reader, near level,
    centred, larger. It appears there; it never turns there. */
const MIND_MID: Camera = { psi: 0, phi: 0.12, s: ISO_S * 1.04, o: { x: 720, y: 438 } };
/** The middle beat's two terminals: a pin header each, in the viewBox. */
const TERM = { tool: 318, collab: 1122, y: 438, half: 34 } as const;

type Card = {
  id: string;
  kind: string;
  year: string;
  title: string;
  caption: string;
  media?: { type: "image" | "video"; src: string; poster?: string; alt: string };
};

const IDS = ["capability", "the-interface", "an-intelligence"] as const;

function findSpecs() {
  const [cap, ifc, mid] = IDS.map((id) => UX_MEETUP_ARC.sections.find((s) => s.id === id));
  const cards: readonly Card[] =
    cap?.kind === "figure" && cap.figure.id === "capability" ? cap.figure.cards : [];
  const title = ifc?.kind === "figure" && ifc.figure.id === "interface" ? ifc.figure.mind : "";
  const middle =
    mid?.kind === "figure" && mid.figure.id === "middle"
      ? mid.figure
      : { line: "", tool: { label: "", line: "" }, collaborator: { label: "", line: "" } };
  const eyebrows = [cap, ifc, mid].map((s) =>
    s?.kind === "figure" ? (s.eyebrow ?? s.head?.eyebrow ?? "") : ""
  );
  return { cards, title, middle, eyebrows };
}

export function FoundationAct() {
  const { cards, title, middle, eyebrows } = useMemo(() => findSpecs(), []);
  const n = cards.length;
  const axes = useMemo(() => axesAt(n, STACK_L), [n]);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRefs = useRef<(SVGGElement | null)[]>([]);
  const backRefs = useRef<(SVGGElement | null)[]>([]);
  const ghostRefs = useRef<(SVGGElement | null)[]>([]);
  const trayRefs = useRef<(SVGGElement | null)[]>([]);
  const joinRefs = useRef<(SVGPathElement | null)[]>([]);
  const tickRefs = useRef<(SVGGElement | null)[]>([]);
  const floorRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGPathElement>(null);
  const yNameRef = useRef<SVGTextElement>(null);
  const leaderRef = useRef<SVGPathElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (!window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const talk = root.closest<HTMLElement>(".arc-root");
    talk?.setAttribute("data-act", "live");
    const model = coreModel();
    const walks = walksOf(model);
    const jobs: ScrambleJob[] = [];
    let scrambleRaf = 0;
    const tick = () => {
      scrambleRaf = 0;
      advanceScrambles(jobs, performance.now() / 1000);
      if (jobs.length) scrambleRaf = requestAnimationFrame(tick);
    };
    const scramble = (el: HTMLElement | null, text: string) => {
      if (!el) return;
      el.textContent = "";
      if (!text) return;
      queueScramble(jobs, el, text, performance.now() / 1000);
      if (!scrambleRaf) scrambleRaf = requestAnimationFrame(tick);
    };
    let facingIdx = -1;
    let phase = -1;
    let axisZ = capabilityTop(0);
    let landed = 0;
    let dpr = 1;
    let light = false;
    const tone = { ink: "rgb(235, 227, 214)", gold: "rgb(202, 165, 84)", lit: "rgb(240, 200, 106)", green: "rgb(122, 158, 106)", red: "rgb(255, 107, 53)" };
    const layers = new Map<string, HTMLCanvasElement>();

    const size = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const cs = getComputedStyle(canvas);
      tone.ink = cs.color || tone.ink;
      tone.gold = cs.getPropertyValue("--fa-gold").trim() || tone.gold;
      tone.lit = cs.getPropertyValue("--fa-lit").trim() || tone.lit;
      tone.green = cs.getPropertyValue("--fa-green").trim() || tone.green;
      tone.red = cs.getPropertyValue("--fa-red").trim() || tone.red;
      light = document.documentElement.dataset.theme === "light";
      layers.clear();
    };
    /** The core in one pose, drawn once at this size and in this theme. */
    const layerOf = (key: string, cam: Camera, split: number) => {
      let l = layers.get(key);
      if (!l) {
        l = document.createElement("canvas");
        l.width = canvas.width;
        l.height = canvas.height;
        const c = l.getContext("2d");
        if (c) bakeCore(c, model, cam, { k: canvas.width / VB.w, dpr, tone, split, light });
        layers.set(key, l);
      }
      return l;
    };

    const clocks = () => {
      const els = IDS.map((id) => document.getElementById(id));
      const [cap, ifc] = els;
      if (!cap || !ifc) return null;
      const rc = cap.getBoundingClientRect();
      const ri = ifc.getBoundingClientRect();
      const a = ri.top - rc.top > 0 ? -rc.top / (ri.top - rc.top) : 0;
      const up = els.findIndex((el) => el?.hasAttribute("data-uxm-active"));
      return { up, a: Math.max(0, a) };
    };

    const frame = (now: number) => {
      const c = clocks();
      if (!c) return;
      root.toggleAttribute("data-fa-up", c.up >= 0);
      if (c.up < 0) {
        phase = -1;
        return;
      }
      if (c.up !== phase) {
        phase = c.up;
        landed = now;
        facingIdx = -1;
        root.dataset.faPhase = String(phase);
        const eb = eyebrows[phase];
        // The interface's head is its title alone: the number, then the words.
        scramble(eyebrowRef.current, phase === 1 ? eb.split(" · ")[0] : eb);
        if (countRef.current) countRef.current.textContent = "";
        if (lineRef.current) lineRef.current.textContent = "";
        if (phase === 1) scramble(titleRef.current, title);
        if (phase === 2) scramble(titleRef.current, middle.line);
      }
      const since = (now - landed) / 1000;
      const k = canvas.width / VB.w;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (phase < 2) {
        const a = phase === 1 ? Math.max(1, c.a) : c.a;
        const poses = sheetPoses(n, a);
        const o0 = plateOrigin(0, a);
        // The floor, its axis and the trays fall away as the stack leaves.
        const floor = 1 - smooth((a - 0.855) / 0.05);
        const fl = floorRef.current;
        if (fl) {
          fl.setAttribute("transform", `translate(${(o0.x - STACK_L.x).toFixed(1)} ${(o0.y - STACK_L.y).toFixed(1)})`);
          fl.style.opacity = floor.toFixed(3);
        }
        if (leaderRef.current) leaderRef.current.style.opacity = floor.toFixed(3);
        root.toggleAttribute("data-fa-floor", poses[0].seated && floor > 0.01);
        // The capability axis grows with the stack, a plate at a time.
        const inStack = poses.filter((p) => p.shown && !p.facing).length;
        axisZ += (capabilityTop(inStack) - axisZ) * 0.12;
        const tip = { x: axes.foot.x, y: axes.foot.y - axisZ * U };
        yAxisRef.current?.setAttribute(
          "d",
          `M${axes.foot.x} ${axes.foot.y} L${tip.x} ${tip.y.toFixed(1)} M${tip.x - 5} ${(tip.y + 9).toFixed(1)} L${tip.x} ${tip.y.toFixed(1)} L${tip.x + 5} ${(tip.y + 9).toFixed(1)}`
        );
        const yName = yNameRef.current;
        if (yName) {
          yName.setAttribute("transform", `translate(${axes.foot.x - 12} ${(tip.y + 4).toFixed(1)}) rotate(-90)`);
          yName.style.opacity = smooth((axisZ - 3.6) / 1.4).toFixed(3);
        }
        const leaders: string[] = [];
        poses.forEach((p, i) => {
          const g = sheetRefs.current[i];
          const back = backRefs.current[i];
          const ghost = ghostRefs.current[i];
          const tray = trayRefs.current[i];
          const join = joinRefs.current[i];
          const tk = tickRefs.current[i];
          if (!g || !back || !ghost || !tray || !join || !tk) return;
          const vis = p.shown ? "" : "hidden";
          g.setAttribute("transform", mat(p.m));
          g.style.visibility = vis;
          const bm: M6 = [p.m[0], p.m[1], p.m[2], p.m[3], p.m[4] + p.depth.x, p.m[5] + p.depth.y];
          back.setAttribute("transform", mat(bm));
          back.style.visibility = vis;
          // The slab's sides: each corner of the face joined to its back.
          join.setAttribute(
            "d",
            p.shown
              ? OUTER.map(([x, y]) => {
                  const f = apply(p.m, x, y);
                  return `M${f.x.toFixed(1)} ${f.y.toFixed(1)} l${p.depth.x.toFixed(1)} ${p.depth.y.toFixed(1)}`;
                }).join(" ")
              : ""
          );
          ghost.setAttribute("transform", mat(p.m));
          ghost.style.visibility = p.shown && p.ghosts > 0.01 ? "" : "hidden";
          ghost.style.opacity = p.ghosts.toFixed(3);
          tray.setAttribute("transform", mat(p.m));
          tray.style.visibility = p.seated && floor > 0.01 ? "" : "hidden";
          tray.style.opacity = floor.toFixed(3);
          tk.style.visibility = p.seated ? "" : "hidden";
          if (p.seated) {
            const t = axes.ticks[i];
            const corner = plateCorner(i, plateOrigin(i, a));
            leaders.push(`M${(t.x + o0.x - STACK_L.x).toFixed(1)} ${(t.y + o0.y - STACK_L.y).toFixed(1)} L${corner.x.toFixed(1)} ${corner.y.toFixed(1)}`);
          }
        });
        leaderRef.current?.setAttribute("d", leaders.join(" "));
        const f = phase === 0 ? poses.findIndex((p) => p.facing) : -1;
        root.toggleAttribute("data-fa-facing", f >= 0);
        root.toggleAttribute("data-fa-video", f >= 0 && cards[f]?.media?.type === "video");
        if (phase === 0 && f !== facingIdx) {
          facingIdx = f;
          const card = cards[f];
          if (card && lineRef.current && countRef.current) {
            countRef.current.textContent = `${String(f + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")} · ${card.year}`;
            lineRef.current.textContent = card.caption;
            scramble(titleRef.current, card.title);
          }
        }
        if (phase === 1) {
          const shown = paintCore(ctx, layerOf(`ifc|${light}`, MIND_IFC, 0), model, walks, MIND_IFC, { k, dpr, tone, since, now, light });
          if (shown) paintCords(ctx, model, MIND_IFC, { k, dpr, tone, since, now, n, a });
        }
      } else {
        root.toggleAttribute("data-fa-facing", false);
        root.toggleAttribute("data-fa-video", false);
        const shown = paintCore(ctx, layerOf(`mid|${light}`, MIND_MID, 1), model, walks, MIND_MID, { k, dpr, tone, since, now, light });
        root.toggleAttribute("data-fa-poles", shown);
        if (shown) paintRuns(ctx, model, MIND_MID, { k, dpr, tone, since: since - 1.1, now });
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // Full screen with sound: the facing film, played as itself.
    const player = playerRef.current;
    const play = playRef.current;
    const onPlay = () => {
      const card = cards[facingIdx];
      if (!player || !card?.media || card.media.type !== "video") return;
      player.src = card.media.src;
      player.muted = false;
      player.currentTime = 0;
      root.toggleAttribute("data-fa-playing", true);
      void player.requestFullscreen?.().catch(() => undefined);
      void player.play().catch(() => undefined);
    };
    const onFull = () => {
      if (document.fullscreenElement || !player) return;
      player.pause();
      player.removeAttribute("src");
      player.load();
      root.toggleAttribute("data-fa-playing", false);
    };
    play?.addEventListener("click", onPlay);
    document.addEventListener("fullscreenchange", onFull);

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      frame(t);
    };
    size();
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    // The canvas holds its colours; a theme switch must reach it too.
    const mo = new MutationObserver(size);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(raf);
      if (scrambleRaf) cancelAnimationFrame(scrambleRaf);
      ro.disconnect();
      mo.disconnect();
      play?.removeEventListener("click", onPlay);
      document.removeEventListener("fullscreenchange", onFull);
      talk?.removeAttribute("data-act");
    };
  }, [cards, n, title, middle, eyebrows, axes]);

  const [pre, post] = [FACING.x / VB.w, FACING.y / VB.h];
  return (
    <div ref={rootRef} className="fa">
      <div className="fa__box">
        <svg className="fa__svg" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
          <defs>
            <clipPath id="fa-cut">
              <path d={inner} />
            </clipPath>
          </defs>
          <g className="fa__stack">
            <g ref={floorRef} className="fa__floor">
              <path className="fa__grid" d={axes.grid} />
              <path className="fa__axis" d={`M${axes.x[0].x} ${axes.x[0].y} L${axes.x[1].x} ${axes.x[1].y}`} />
              <path ref={yAxisRef} className="fa__axis fa__axis--y" />
              <text ref={yNameRef} className="fa__axis-name" textAnchor="end">
                MODEL CAPABILITIES
              </text>
              {cards.map((c, i) => (
                <g key={c.id} ref={(el) => void (tickRefs.current[i] = el)}>
                  <path className="fa__axis" d={`M${axes.ticks[i].x - 6} ${axes.ticks[i].y} L${axes.ticks[i].x + 6} ${axes.ticks[i].y}`} />
                </g>
              ))}
            </g>
            <path ref={leaderRef} className="fa__leader" />
            {cards.map((c, i) => (
              <g key={c.id} data-kind={c.kind}>
                <g ref={(el) => void (trayRefs.current[i] = el)} className="fa__tray">
                  <path d={trayPath} />
                </g>
                <g ref={(el) => void (ghostRefs.current[i] = el)} className="fa__ghost">
                  <path d={chamfer} transform="translate(36 -27)" />
                  <path d={chamfer} transform="translate(24 -18)" />
                </g>
                <g ref={(el) => void (backRefs.current[i] = el)} className="fa__back">
                  <path d={chamfer} />
                </g>
                <path ref={(el) => void (joinRefs.current[i] = el)} className="fa__join" />
                <g ref={(el) => void (sheetRefs.current[i] = el)} className="fa__sheet">
                  <path className="fa__ground" d={chamfer} />
                  <g clipPath="url(#fa-cut)">
                    {c.media?.type === "image" ? (
                      <image href={c.media.src} x={INSET} y={INSET} width={W - 2 * INSET} height={H - 2 * INSET} preserveAspectRatio="xMidYMid slice" />
                    ) : null}
                    {c.media?.type === "video" ? (
                      <foreignObject x={INSET} y={INSET} width={W - 2 * INSET} height={H - 2 * INSET}>
                        <video className="fa__video" src={c.media.src} poster={c.media.poster} muted loop autoPlay playsInline preload="metadata" />
                      </foreignObject>
                    ) : null}
                    {c.kind === "worlds" ? <WorldsPlaceholder /> : null}
                    {c.kind === "mathematics" ? <MathBoard /> : null}
                  </g>
                  <path className="fa__inset" d={inner} />
                  <path className="fa__edge" d={chamfer} />
                  {[
                    [0, 0],
                    [W, H],
                    [0, H],
                  ].map(([x, y], j) => (
                    <path key={j} className="fa__cross" d={`M${x - 7} ${y} L${x + 7} ${y} M${x} ${y - 7} L${x} ${y + 7}`} />
                  ))}
                </g>
              </g>
            ))}
          </g>
          <g className="fa__poles">
            {[TERM.tool, TERM.collab].map((x) => (
              <g key={x}>
                <path className="fa__header" d={`M${x} ${TERM.y - TERM.half} L${x} ${TERM.y + TERM.half}`} />
                {[-TERM.half, TERM.half].map((dy) => (
                  <path key={dy} className="fa__cross" d={`M${x - 6} ${TERM.y + dy} L${x + 6} ${TERM.y + dy} M${x} ${TERM.y + dy - 6} L${x} ${TERM.y + dy + 6}`} />
                ))}
              </g>
            ))}
          </g>
        </svg>
        <canvas ref={canvasRef} className="fa__dots" aria-hidden="true" />
        <div className="fa__head" aria-hidden="true">
          <p className="fa__eyebrow">
            <span ref={eyebrowRef} />
            <span ref={countRef} className="fa__count" />
          </p>
          <h3 ref={titleRef} className="fa__title" />
          <p ref={lineRef} className="fa__line" />
        </div>
        <div className="fa__term" data-side="tool" aria-hidden="true">
          <span className="fa__term-name">{middle.tool.label}</span>
          <span className="fa__term-line">{middle.tool.line}</span>
        </div>
        <div className="fa__term" data-side="collab" aria-hidden="true">
          <span className="fa__term-name">{middle.collaborator.label}</span>
          <span className="fa__term-line">{middle.collaborator.line}</span>
        </div>
        <button
          ref={playRef}
          type="button"
          className="fa__play"
          style={{ left: `${pre * 100}%`, top: `calc(${post * 100}% + ${((H * FACING.s) / VB.h) * 100}% + 18px)` }}
        >
          <span aria-hidden="true">▶</span> Play with sound
        </button>
        <video ref={playerRef} className="fa__player" controls playsInline />
      </div>
    </div>
  );
}

type Tone = { ink: string; gold: string; lit: string; green: string; red: string };

/** Seven signals walking the shell's edges, each a fixed walk of 240 steps. */
function walksOf(m: CoreModel): V3[][] {
  const key = (p: V3) => `${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)}`;
  const nbr = new Map<string, V3[]>();
  for (const e of m.edges) {
    if (e.kind !== EDGE.shell) continue;
    for (const [a, b] of [
      [e.a, e.b],
      [e.b, e.a],
    ]) {
      const list = nbr.get(key(a)) ?? [];
      list.push(b);
      nbr.set(key(a), list);
    }
  }
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 7 }, (_, w) => {
    let at = m.shell[(w * 3) % m.shell.length];
    let prev: V3 | null = null;
    const out = [at];
    for (let s = 0; s < 240; s++) {
      const options = (nbr.get(key(at)) ?? []).filter((p) => !prev || key(p) !== key(prev));
      const next = options[Math.floor(rnd() * options.length)];
      prev = at;
      at = next;
      out.push(at);
    }
    return out;
  });
}

/**
 * The core, drawn once per pose: every line and particle in perspective,
 * sorted far to near, faded and thinned with depth as a long lens would see
 * it, each line under its own halo. On the void the light adds ("lighter");
 * on parchment it lays down as ink. `split` gives the middle beat its two
 * sides: the tool's (left) crisp and lit, the collaborator's (right) loose
 * particles in green.
 */
function bakeCore(
  ctx: CanvasRenderingContext2D,
  m: CoreModel,
  cam: Camera,
  o: { k: number; dpr: number; tone: Tone; split: number; light: boolean }
) {
  const B = basisOf(cam);
  const v = B.view;
  const { k, dpr, tone, split, light } = o;
  const R = 6.3;
  const fog = (d: number) => 0.18 + 0.82 * Math.min(1, Math.max(0, (d + R) / (2 * R)));
  type Prim = { d: number; draw: () => void };
  const prims: Prim[] = [];
  const P = (p: V3) => projP(p, B, cam.o);
  const right = (x: number) => (x > cam.o.x ? split : 0);
  const left = (x: number) => (x < cam.o.x ? split : 0);

  const seg = (a: V3, b: V3, col: string, w: number, alpha: number, halo = true) => {
    const pa = P(a);
    const pb = P(b);
    const d = (pa.d + pb.d) / 2;
    const f = fog(d);
    const mx = (pa.x + pb.x) / 2;
    prims.push({
      d,
      draw: () => {
        const al = alpha * f * (1 - 0.55 * right(mx)) * (1 + 0.4 * left(mx));
        if (halo && !light) {
          ctx.globalAlpha = Math.min(1, al * 0.16);
          ctx.lineWidth = (w + 3.2) * f * dpr;
          ctx.strokeStyle = col;
          ctx.beginPath();
          ctx.moveTo(pa.x * k, pa.y * k);
          ctx.lineTo(pb.x * k, pb.y * k);
          ctx.stroke();
        }
        ctx.globalAlpha = Math.min(1, al);
        ctx.lineWidth = Math.max(0.6, w * (0.6 + 0.6 * f)) * dpr;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.moveTo(pa.x * k, pa.y * k);
        ctx.lineTo(pb.x * k, pb.y * k);
        ctx.stroke();
      },
    });
  };
  const dot = (p: V3, col: string, size: number, alpha: number) => {
    const q = P(p);
    const f = fog(q.d);
    prims.push({
      d: q.d,
      draw: () => {
        const loose = right(q.x);
        ctx.globalAlpha = Math.min(1, alpha * f * (1 + 0.5 * loose) * (1 - 0.4 * left(q.x)));
        ctx.fillStyle = loose > 0.5 ? tone.green : col;
        const s = size * q.k * (1 + 0.5 * loose) * dpr;
        ctx.fillRect(q.x * k - s / 2, q.y * k - s / 2, s, s);
      },
    });
  };
  const ring = (pts: V3[], col: string, w: number, alpha: number, dash = false) => {
    for (let j = 0; j + 1 < pts.length; j++) {
      if (dash && j % 2) continue;
      seg(pts[j], pts[j + 1], col, w, alpha, false);
    }
  };

  // The shell and the lattice, as lines and as the particles on them.
  for (const e of m.edges) {
    if (e.kind === EDGE.shell) seg(e.a, e.b, tone.gold, 1.1, 0.75);
    else if (e.kind === EDGE.lattice) seg(e.a, e.b, tone.ink, 0.8, 0.42, false);
    else if (e.kind === EDGE.spoke) seg(e.a, e.b, tone.ink, 0.6, 0.22, false);
  }
  for (const d of m.dust) dot(d.p, d.kind === EDGE.shell ? tone.lit : tone.ink, d.kind === EDGE.shell ? 1.5 : 1.2, d.kind === EDGE.shell ? 0.8 : 0.5);
  // The face circuits: lit where the face looks at the reader.
  const facing = (n: V3) => dot3(n, v);
  for (const e of m.edges) {
    if (e.kind !== EDGE.circuit) continue;
    const mid = { x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2, z: (e.a.z + e.b.z) / 2 };
    const face = m.faces.reduce((best, f) => (dot3(f.n, mid) > dot3(best.n, mid) ? f : best), m.faces[0]);
    const lit = facing(face.n) > 0.05;
    seg(e.a, e.b, tone.lit, lit ? 1.2 : 0.8, lit ? 0.95 : 0.16, lit);
  }
  for (const via of m.vias) {
    const lit = facing(via.n) > 0.05;
    ring(ringAround(via.p, via.n, 0.09, 10), tone.lit, 1, lit ? 0.95 : 0.15);
  }
  // The shell's corners: a node and a ring on each near one.
  for (const p of m.shell) {
    dot(p, tone.lit, 3.2, 0.95);
    const n = { x: p.x / 4.3, y: p.y / 4.3, z: p.z / 4.3 };
    if (facing(n) > 0.2) ring(ringAround(p, n, 0.2, 14), tone.gold, 0.8, 0.6);
  }
  // The core: a sphere of particles and its three rings.
  for (const p of m.core.dots) dot(p, tone.ink, 1.3, 0.7);
  for (const r of m.core.rings) {
    const pts: V3[] = [];
    for (let j = 0; j <= 64; j++) pts.push(orbitAt(r, (j / 64) * Math.PI * 2));
    ring(pts, tone.gold, 0.9, 0.7);
  }
  // The hologram's orbits outside.
  for (const ob of m.orbits) {
    const pts: V3[] = [];
    for (let j = 0; j <= 160; j++) pts.push(orbitAt(ob, (j / 160) * Math.PI * 2, 0.2));
    ring(pts, ob.dashed ? tone.ink : tone.gold, ob.dashed ? 0.8 : 1.2, ob.dashed ? 0.45 : 0.7, ob.dashed);
  }
  // The sockets.
  for (const s of m.sockets) dot(s, tone.lit, 6, 1);

  prims.sort((a, b) => a.d - b.d);
  ctx.globalCompositeOperation = light ? "source-over" : "lighter";
  ctx.lineCap = "round";
  for (const p of prims) p.draw();
  // The core's light, at its centre.
  if (!light) {
    const c = P({ x: 0, y: 0, z: 0 });
    const r = 1.9 * cam.s * k;
    const g = ctx.createRadialGradient(c.x * k, c.y * k, 0, c.x * k, c.y * k, r);
    g.addColorStop(0, "rgba(240, 200, 106, 0.32)");
    g.addColorStop(1, "rgba(240, 200, 106, 0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(c.x * k - r, c.y * k - r, 2 * r, 2 * r);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/**
 * The core in its pose: it boots top to bottom behind a scanline, then
 * holds, and only its signals move, walking the shell's edges, with the
 * orbits' nodes. Returns whether it is up (the cords wait for it).
 */
function paintCore(
  ctx: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  m: CoreModel,
  walks: V3[][],
  cam: Camera,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean }
): boolean {
  const { k, dpr, tone } = o;
  const B = basisOf(cam);
  const P = (p: V3) => projP(p, B, cam.o);
  const half = 6.6 * cam.s;
  const top = cam.o.y - half;
  const boot = smooth(o.since / 1.0);
  const edge = top + 2 * half * boot;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ctx.canvas.width, edge * k);
  ctx.clip();
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
  if (boot < 1) {
    ctx.globalAlpha = 0.7 * (1 - boot);
    ctx.fillStyle = tone.lit;
    ctx.fillRect((cam.o.x - half) * k, edge * k - dpr, 2 * half * k, 1.5 * dpr);
    return false;
  }
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  // Signals: each walks a shell edge in 0.7 s, with a short trail.
  walks.forEach((w, i) => {
    const t = o.now / 700 + i * 13.7;
    const s = Math.floor(t) % (w.length - 1);
    const f = t - Math.floor(t);
    for (let tail = 0; tail < 5; tail++) {
      const u = f - tail * 0.07;
      if (u < 0) break;
      const a = P(w[s]);
      const b = P(w[s + 1]);
      const x = lerp(a.x, b.x, u);
      const y = lerp(a.y, b.y, u);
      const r = (3.4 - tail * 0.5) * dpr;
      ctx.globalAlpha = 1 - tail * 0.2;
      ctx.fillStyle = tone.lit;
      ctx.fillRect(x * k - r / 2, y * k - r / 2, r, r);
    }
  });
  // A node drifting on each orbit.
  m.orbits.forEach((ob, i) => {
    const q = P(orbitAt(ob, o.now / (9000 + i * 5000) + i * 2.4, 0.2));
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = tone.lit;
    ctx.beginPath();
    ctx.arc(q.x * k, q.y * k, 3 * dpr, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalCompositeOperation = "source-over";
  return true;
}

const toneOf = (tone: Tone, name: string) =>
  name === "gold" ? tone.gold : name === "green" ? tone.green : name === "red" ? tone.red : tone.ink;

function strokePath(ctx: CanvasRenderingContext2D, pts: P2[], k: number, upto = pts.length - 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x * k, pts[0].y * k);
  for (let j = 1; j <= upto; j++) ctx.lineTo(pts[j].x * k, pts[j].y * k);
  ctx.stroke();
}

/** The cords: from the base's sockets out and round into every plate. */
function paintCords(
  ctx: CanvasRenderingContext2D,
  m: CoreModel,
  cam: Camera,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number; n: number; a: number }
) {
  const B = basisOf(cam);
  const { k, dpr, tone, n } = o;
  for (let i = 0; i < n; i++) {
    const cord = CORDS[i % CORDS.length];
    const from = projP(m.sockets[i % m.sockets.length], B, cam.o);
    const to = plateSocket(i, n, plateOrigin(i, o.a));
    const reachOut = 80 + i * 26;
    // Out wide to the right first, round the stack's corner, and in from
    // outside its right edge: a cord never crosses a plate's face.
    const pts = cable(from, to, { x: 200 + i * 30, y: 30 + i * 12 }, { x: SCREEN_X.x * reachOut, y: SCREEN_X.y * reachOut }, 40);
    const grow = smooth((o.since - 1.0 - i * 0.06) / 0.5);
    if (grow <= 0) continue;
    const upto = Math.max(1, Math.floor(grow * (pts.length - 1)));
    const col = toneOf(tone, cord.tone);
    ctx.strokeStyle = col;
    ctx.lineCap = "round";
    if (cord.w > 2) {
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = (cord.w + 5) * dpr;
      strokePath(ctx, pts, k, upto);
    }
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = cord.w * dpr;
    strokePath(ctx, pts, k, upto);
    ctx.lineCap = "butt";
    if (grow >= 1) {
      const end = pts[pts.length - 1];
      const s = (cord.w + 5) * dpr;
      ctx.fillStyle = col;
      ctx.fillRect(end.x * k - s / 2, end.y * k - s / 2, s, s);
      for (const off of [0, 0.34, 0.67]) {
        const t = (o.now / (1300 + i * 170) + off + i * 0.11) % 1;
        const q = pts[Math.floor(t * (pts.length - 1))];
        const r = (cord.w + 2.5) * dpr;
        ctx.globalAlpha = 1;
        ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
      }
    }
  }
}

/**
 * The middle beat's runs: from the core's left to the tool's pin header,
 * routed square as a board routes, the commands one way; from its right to
 * the collaborator's, loose streams of particles running both ways.
 */
function paintRuns(
  ctx: CanvasRenderingContext2D,
  m: CoreModel,
  cam: Camera,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number }
) {
  const B = basisOf(cam);
  const { k, dpr, tone } = o;
  const grow = smooth(o.since / 0.8);
  if (grow <= 0) return;
  const widths = [2.4, 1.2, 1.8];
  const pinY = [-22, 0, 22];
  m.flanks.tool.forEach((p, j) => {
    const a = projP(p, B, cam.o);
    const end = { x: TERM.tool, y: TERM.y + pinY[j] };
    const bend = 400 - j * 24;
    const pts: P2[] = [a, { x: bend, y: a.y }, { x: bend, y: end.y }, end];
    const dense: P2[] = [];
    for (let s = 0; s + 1 < pts.length; s++) {
      for (let q = 0; q < 12; q++) dense.push({ x: lerp(pts[s].x, pts[s + 1].x, q / 12), y: lerp(pts[s].y, pts[s + 1].y, q / 12) });
    }
    dense.push(end);
    ctx.strokeStyle = tone.gold;
    ctx.fillStyle = tone.gold;
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = widths[j] * dpr;
    strokePath(ctx, dense, k, Math.max(1, Math.floor(grow * (dense.length - 1))));
    if (grow >= 1) {
      ctx.fillRect(end.x * k - 3 * dpr, end.y * k - 3 * dpr, 6 * dpr, 6 * dpr);
      for (const off of [0, 0.5]) {
        const t = (o.now / 1500 + off + j * 0.2) % 1;
        const q = dense[Math.floor(t * (dense.length - 1))];
        const r = (widths[j] + 3) * dpr;
        ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
      }
    }
  });
  m.flanks.collab.forEach((p, j) => {
    const a = projP(p, B, cam.o);
    const end = { x: TERM.collab, y: TERM.y + pinY[j] };
    const pts = cable(a, end, { x: 120, y: (j - 1) * 70 }, { x: -120, y: (1 - j) * 40 }, 40);
    const col = j === 1 ? tone.ink : tone.green;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1 * dpr;
    strokePath(ctx, pts, k, Math.max(1, Math.floor(grow * (pts.length - 1))));
    if (grow < 1) return;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(end.x * k - 3 * dpr, end.y * k - 3 * dpr, 6 * dpr, 6 * dpr);
    // A stream of particles, both ways: a conversation, not a command.
    for (let s = 0; s < 22; s++) {
      const dir = s % 2 ? 1 : -1;
      const base = (s / 22 + (dir * o.now) / (5200 + j * 600)) % 1;
      const t = base < 0 ? base + 1 : base;
      const q = pts[Math.floor(t * (pts.length - 1))];
      const jx = 4 * Math.sin(s * 12.9 + o.now / 600);
      const jy = 4 * Math.cos(s * 7.3 + o.now / 700);
      const r = (1.4 + (s % 3) * 0.7) * dpr;
      ctx.globalAlpha = 0.85;
      ctx.fillRect((q.x + jx) * k - r / 2, (q.y + jy) * k - r / 2, r, r);
    }
  });
}

/** Game worlds built from assets: the slot for the owner's Halo mods video.
    Until it comes, a low-poly terrain stands in, lettered as the slot. */
function WorldsPlaceholder() {
  const cols = 15;
  const rows = 8;
  const h = (i: number, j: number) => 26 * Math.sin(j * 0.55 + i * 0.3) * Math.cos(i * 0.7 - j * 0.2) + 12 * Math.sin(j * 1.3 + i * 1.1);
  const at = (i: number, j: number): [number, number] => [70 + j * 30 + i * 12, 118 + i * 20 - h(i, j)];
  const d: string[] = [];
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const [x, y] = at(i, j);
      if (j + 1 < cols) d.push(`M${x.toFixed(1)} ${y.toFixed(1)} L${at(i, j + 1).map((v) => v.toFixed(1)).join(" ")}`);
      if (i + 1 < rows) d.push(`M${x.toFixed(1)} ${y.toFixed(1)} L${at(i + 1, j).map((v) => v.toFixed(1)).join(" ")}`);
      if (i + 1 < rows && j + 1 < cols) d.push(`M${x.toFixed(1)} ${y.toFixed(1)} L${at(i + 1, j + 1).map((v) => v.toFixed(1)).join(" ")}`);
    }
  }
  return (
    <g className="fa__worlds">
      <path d={d.join(" ")} />
      <text x={W / 2} y={H - 34} textAnchor="middle">
        HALO MODS · VIDEO TO COME
      </text>
    </g>
  );
}

/** Flow past a cylinder, its true stream function psi = y (1 - R^2 / r^2):
    each streamline solved for y along x, by bisection. */
const FLOW = (() => {
  const R = 22;
  const cx = 458;
  const cy = 166;
  const lines: string[] = [];
  for (const c of [-72, -48, -30, -15, -5, 5, 15, 30, 48, 72]) {
    const pts: string[] = [];
    for (let x = -76; x <= 76; x += 4) {
      const lo0 = Math.sqrt(Math.max(0, R * R - x * x)) + 1e-6;
      let lo = lo0;
      let hi = Math.abs(c) + R + 60;
      for (let k = 0; k < 30; k++) {
        const m = (lo + hi) / 2;
        const f = m * (1 - (R * R) / (x * x + m * m)) - Math.abs(c);
        if (f > 0) hi = m;
        else lo = m;
      }
      const y = Math.sign(c) * lo;
      pts.push(`${pts.length ? "L" : "M"}${(cx + x).toFixed(1)} ${(cy - y).toFixed(1)}`);
    }
    lines.push(pts.join(" "));
  }
  return { R, cx, cy, lines };
})();

/** Mathematics, as it is written: the Navier–Stokes equations and the flow
    they govern, an Erdős equation, the Olympiad and FrontierMath. */
function MathBoard() {
  return (
    <g className="fa__math">
      <text className="fa__math-key" x="34" y="58">NAVIER–STOKES</text>
      <text className="fa__math-eq" x="34" y="94">∂ₜu + (u · ∇)u = −∇p + νΔu</text>
      <text className="fa__math-eq" x="34" y="128">∇ · u = 0</text>
      <text className="fa__math-note" x="34" y="154">A MILLENNIUM PRIZE PROBLEM</text>
      <path className="fa__math-rule" d="M34 178 L300 178" />
      <text className="fa__math-key" x="34" y="206">ERDŐS</text>
      <text className="fa__math-eq" x="34" y="242">4/n = 1/x + 1/y + 1/z</text>
      <text className="fa__math-chip" x="34" y="282">IMO 2025 · GOLD</text>
      <text className="fa__math-chip" x="200" y="282">FRONTIERMATH</text>
      <g className="fa__flow">
        {FLOW.lines.map((d, i) => (
          <path key={i} d={d} data-lit={i === 6 ? "" : undefined} />
        ))}
        <path d={`M${FLOW.cx - 76} ${FLOW.cy} L${FLOW.cx - FLOW.R} ${FLOW.cy} M${FLOW.cx + FLOW.R} ${FLOW.cy} L${FLOW.cx + 76} ${FLOW.cy}`} />
        <circle cx={FLOW.cx} cy={FLOW.cy} r={FLOW.R} />
        <text className="fa__math-note" x={FLOW.cx} y={FLOW.cy + 116} textAnchor="middle">FLOW PAST A CYLINDER</text>
      </g>
    </g>
  );
}
