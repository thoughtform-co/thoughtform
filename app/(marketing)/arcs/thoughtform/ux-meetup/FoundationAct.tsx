"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { BRAIN3D_BOX, brainModel, type BrainModel } from "@/components/arcs/figures/foundation/brain";
import { bakeBrain, flankAt, paintSignals, portAt, type Place, type Tone } from "@/components/arcs/figures/foundation/paintBrain";
import {
  CARD,
  FACING,
  MEDIA,
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
} from "@/components/arcs/figures/foundation/scene";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { UX_MEETUP_ARC } from "@/lib/arcs/content/ux-meetup";

import type { Brain3D } from "./brain3d";

/**
 * FoundationAct — one scene across six beats (ADR-156 U5 to U9): what it can
 * make, intelligence as the interface, the middle, every desk, the
 * shoggoth, latent space. The examples face the reader one by one as
 * modules, their head in the frame over their picture as Unsiloed builds its
 * cards, and lie down in the stack on the left, whose capability axis grows
 * with it; the floor falls away and the stack cascades to the centre; the
 * machine brain (`brain.ts`) hangs over it and its cables plug into every
 * plate the moment the beat lands. After the line about software the brain
 * returns: between a tool and a collaborator, inside the rings of the
 * knowledge work it is growing into, as the shoggoth with its tentacles and
 * mask. Last, latent space: a field of particles round a line.
 *
 * ⚠ A READER on the talk's scroll (one passive listener, one rAF) that
 * writes only its own layer. It is shown only while one of its beats is the
 * beat up (`data-uxm-active`, the tail's reader), above the terminal tier.
 * The modules are SVG on exact plane matrices (`scene.ts`); the brain is
 * baked ONCE per pose into a layer and only its signals move; the cords,
 * rings, tentacles and the field are the live canvas; the words are DOM.
 */

const CUT = 22;
const W = CARD.w;
const H = CARD.h;
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
const media = chamferOf(chamferPts(MEDIA.w, MEDIA.h, 14, MEDIA.x, MEDIA.y));
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
  { tone: "ink", w: 1.6 },
] as const;

/** Where the brain stands in each beat that has it. */
const PLACE: Record<number, Place> = {
  1: { x: 806, y: 208, s: 0.68 },
  2: { x: 720, y: 352, s: 0.95 },
  3: { x: 720, y: 360, s: 0.74 },
  4: { x: 720, y: 330, s: 0.78 },
};
/** The middle beat's two cards, in the viewBox. */
const SIDE = { w: 300, h: 196, y: 352, tool: 98, collab: 1042 } as const;

type Card = {
  id: string;
  kind: string;
  year: string;
  title: string;
  caption: string;
  media?: { type: "image" | "video"; src: string; poster?: string; alt: string };
};

const IDS = ["capability", "the-interface", "an-intelligence", "every-desk", "shoggoth", "latent-space"] as const;

function findSpecs() {
  const s = IDS.map((id) => UX_MEETUP_ARC.sections.find((x) => x.id === id));
  const fig = <T extends string>(i: number, id: T) => {
    const x = s[i];
    return x?.kind === "figure" && x.figure.id === id ? x.figure : null;
  };
  const cap = fig(0, "capability");
  const cards: readonly Card[] = cap && cap.id === "capability" ? cap.cards : [];
  const ifc = fig(1, "interface");
  const mid = fig(2, "middle");
  const know = fig(3, "knowledge");
  const shog = fig(4, "shoggoth");
  const lat = fig(5, "latent");
  const middle = mid && mid.id === "middle" ? mid : null;
  const knowledge = know && know.id === "knowledge" ? know : null;
  const shoggoth = shog && shog.id === "shoggoth" ? shog : null;
  const latent = lat && lat.id === "latent" ? lat : null;
  const eyebrows = s.map((x) => (x?.kind === "figure" ? (x.eyebrow ?? x.head?.eyebrow ?? "") : ""));
  const heads: { title: string; line: string }[] = [
    { title: "", line: "" },
    { title: ifc && ifc.id === "interface" ? ifc.mind : "", line: "" },
    { title: middle?.line ?? "", line: "" },
    { title: knowledge?.line ?? "", line: "" },
    { title: shoggoth?.title ?? "", line: shoggoth?.line ?? "" },
    { title: "", line: "" },
  ];
  return { cards, middle, knowledge, latent, eyebrows, heads };
}

export function FoundationAct() {
  const { cards, middle, knowledge, latent, eyebrows, heads } = useMemo(() => findSpecs(), []);
  const n = cards.length;
  const capEyebrow = eyebrows[0];
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const theatreRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (!window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const talk = root.closest<HTMLElement>(".arc-root");
    talk?.setAttribute("data-act", "live");
    const model = brainModel();
    const field = latentField(latent?.nodes ?? []);
    const jobs: ScrambleJob[] = [];
    let scrambleRaf = 0;
    const tick = () => {
      scrambleRaf = 0;
      advanceScrambles(jobs, performance.now() / 1000);
      if (jobs.length) scrambleRaf = requestAnimationFrame(tick);
    };
    const scramble = (el: HTMLElement | null, text: string) => {
      if (!el) return;
      // A new word for this element cancels the one still decoding into it.
      for (let j = jobs.length - 1; j >= 0; j--) if (jobs[j].el === el) jobs.splice(j, 1);
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
    const tone: Tone = { ink: "rgb(235, 227, 214)", gold: "rgb(202, 165, 84)", lit: "rgb(240, 200, 106)", green: "rgb(122, 158, 106)", red: "rgb(255, 107, 53)" };
    const layers = new Map<string, HTMLCanvasElement>();
    /* The brain in depth (owner, 2026-10-15): three.js, loaded on demand so
       the route's first load stays three-free. Until it lands, or where
       WebGL is missing, the painter draws the whole brain in 2D. */
    let b3: Brain3D | null = null;
    let gone = false;
    void import("./brain3d").then(({ createBrain3D }) => {
      if (gone) return;
      b3 = createBrain3D(model);
      layers.clear();
    });

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
    /** The brain in one pose, drawn once at this size and in this theme. */
    const layerOf = (ph: number) => {
      const key = `${ph}|${light}`;
      let l = layers.get(key);
      if (!l) {
        l = document.createElement("canvas");
        l.width = canvas.width;
        l.height = canvas.height;
        const c = l.getContext("2d");
        if (c) bakeBrain(c, model, PLACE[ph], { k: canvas.width / VB.w, dpr, tone, light, split: ph === 2 ? 1 : 0, cables: ph === 2 || ph === 3, body: !b3 });
        layers.set(key, l);
      }
      return l;
    };
    /** The brain boots top to bottom behind a scanline, then holds. */
    const paintBrain = (ph: number, since: number, now: number) => {
      const pl = PLACE[ph];
      const k = canvas.width / VB.w;
      const top = pl.y - 215 * pl.s;
      const bottom = pl.y + 470 * pl.s;
      const boot = smooth(since / 1.0);
      const edge = top + (bottom - top) * boot;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, edge * k);
      ctx.clip();
      ctx.drawImage(layerOf(ph), 0, 0);
      if (b3) {
        const B = BRAIN3D_BOX;
        const x = (pl.x + B.x0 * pl.s) * k;
        const y = (pl.y + B.y0 * pl.s) * k;
        const w = Math.round((B.x1 - B.x0) * pl.s * k);
        const h = Math.round((B.y1 - B.y0) * pl.s * k);
        ctx.drawImage(b3.render({ w, h, now, split: ph === 2 ? 1 : 0, light, tone }), x, y, w, h);
      }
      ctx.restore();
      if (boot < 1) {
        ctx.globalAlpha = 0.7 * (1 - boot);
        ctx.fillStyle = tone.lit;
        ctx.fillRect((pl.x - 240 * pl.s) * k, edge * k - dpr, 480 * pl.s * k, 1.5 * dpr);
        ctx.globalAlpha = 1;
        return false;
      }
      paintSignals(ctx, model, pl, { k, dpr, tone, now, light });
      return true;
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
        scramble(eyebrowRef.current, phase === 1 ? eb.split(" · ")[0] : eb);
        scramble(titleRef.current, heads[phase].title);
        if (lineRef.current) lineRef.current.textContent = heads[phase].line;
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
        root.toggleAttribute("data-fa-video", f >= 0 && cards[f]?.media?.type === "video");
        facingIdx = f;
        if (phase === 1) {
          const shown = paintBrain(1, since, now);
          if (shown) paintCords(ctx, model, PLACE[1], { k, dpr, tone, since, now, n, a });
        }
      } else if (phase === 2) {
        const shown = paintBrain(2, since, now);
        root.toggleAttribute("data-fa-cards", shown);
        if (shown) paintRuns(ctx, PLACE[2], { k, dpr, tone, since: since - 1.0, now });
      } else if (phase === 3) {
        paintRings(ctx, knowledge?.layers ?? [], PLACE[3], { k, dpr, tone, since, now, light }, false);
        paintBrain(3, since, now);
        paintRings(ctx, knowledge?.layers ?? [], PLACE[3], { k, dpr, tone, since, now, light }, true);
      } else if (phase === 4) {
        paintTentacles(ctx, PLACE[4], { k, dpr, tone, since, now, light }, false);
        const shown = paintBrain(4, since, now);
        paintTentacles(ctx, PLACE[4], { k, dpr, tone, since, now, light }, true);
        if (shown) paintMask(ctx, PLACE[4], { k, dpr, tone, since: since - 1.0, light });
      } else if (phase === 5) {
        paintField(ctx, field, { k, dpr, tone, since, now, light });
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // The film, played as itself: over the viewport with its sound. The
    // theatre is portalled to the body (no stacking context of the page's
    // can sit over it), so it is read at the moment of the click.
    const onPlay = () => {
      const theatre = theatreRef.current;
      const player = playerRef.current;
      const card = cards[facingIdx];
      if (!player || !theatre || !card?.media || card.media.type !== "video") return;
      player.src = card.media.src;
      player.muted = false;
      player.currentTime = 0;
      theatre.toggleAttribute("data-open", true);
      void player.play().catch(() => undefined);
      closeRef.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && theatreRef.current?.hasAttribute("data-open")) closeTheatre();
    };
    const playBtn = playRef.current;
    playBtn?.addEventListener("click", onPlay);
    window.addEventListener("keydown", onKey);

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      frame(t);
    };
    size();
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const mo = new MutationObserver(size);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      gone = true;
      b3?.dispose();
      cancelAnimationFrame(raf);
      if (scrambleRaf) cancelAnimationFrame(scrambleRaf);
      ro.disconnect();
      mo.disconnect();
      playBtn?.removeEventListener("click", onPlay);
      window.removeEventListener("keydown", onKey);
      talk?.removeAttribute("data-act");
    };
  }, [cards, n, middle, knowledge, latent, eyebrows, heads, axes]);

  /** Leave the theatre: the film stops and lets go of its source. */
  function closeTheatre() {
    const player = playerRef.current;
    player?.pause();
    player?.removeAttribute("src");
    player?.load();
    theatreRef.current?.toggleAttribute("data-open", false);
  }
  const client = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const s = FACING.s;
  const playAt = { left: `${((FACING.x + (MEDIA.x + 14) * s) / VB.w) * 100}%`, top: `${((FACING.y + (MEDIA.y + MEDIA.h - 14) * s) / VB.h) * 100}%` };
  return (
    <div ref={rootRef} className="fa">
      <div className="fa__box">
        <svg className="fa__svg" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
          <defs>
            <clipPath id="fa-media">
              <path d={media} />
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
                  <Module card={c} index={i} count={n} eyebrow={capEyebrow} />
                </g>
              </g>
            ))}
          </g>
          {middle ? (
            <g className="fa__cards">
              <SideCard x={SIDE.tool} y={SIDE.y - SIDE.h / 2} mark="A" spec={middle.tool} kind="tool" />
              <SideCard x={SIDE.collab} y={SIDE.y - SIDE.h / 2} mark="B" spec={middle.collaborator} kind="collab" />
            </g>
          ) : null}
        </svg>
        <canvas ref={canvasRef} className="fa__dots" aria-hidden="true" />
        <div className="fa__head" aria-hidden="true">
          <p className="fa__eyebrow">
            <span ref={eyebrowRef} />
          </p>
          <h3 ref={titleRef} className="fa__title" />
          <p ref={lineRef} className="fa__line" />
        </div>
        {latent ? (
          <figure className="fa__quote" aria-hidden="true">
            <blockquote>{latent.quote}</blockquote>
            <figcaption>{latent.source.label}</figcaption>
          </figure>
        ) : null}
        <button ref={playRef} type="button" className="fa__play" style={playAt}>
          <span aria-hidden="true">▶</span> Play with sound
        </button>
      </div>
      {client
        ? createPortal(
            <div
              ref={theatreRef}
              className="fa-theatre"
              role="dialog"
              aria-label="Film"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeTheatre();
              }}
            >
              <video ref={playerRef} className="fa-theatre__video" controls playsInline />
              <button ref={closeRef} type="button" className="fa-theatre__close" onClick={closeTheatre}>
                Close <span aria-hidden="true">×</span>
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

/** One example as one module: its head in the frame, its picture under it. */
function Module({ card, index, count, eyebrow }: { card: Card; index: number; count: number; eyebrow: string }) {
  return (
    <>
      <path className="fa__ground" d={chamfer} />
      <text className="fa__mod-eyebrow" x="24" y="34">
        {eyebrow.toUpperCase()}
      </text>
      <text className="fa__mod-count" x={W - 24} y="34" textAnchor="end">
        {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")} · {card.year}
      </text>
      <text className="fa__mod-title" x="24" y="72">
        {card.title}
      </text>
      <text className="fa__mod-line" x="24" y="94">
        {card.caption}
      </text>
      <g clipPath="url(#fa-media)">
        {card.media?.type === "image" ? (
          <image href={card.media.src} x={MEDIA.x} y={MEDIA.y} width={MEDIA.w} height={MEDIA.h} preserveAspectRatio="xMidYMid slice" />
        ) : null}
        {card.media?.type === "video" ? (
          <foreignObject x={MEDIA.x} y={MEDIA.y} width={MEDIA.w} height={MEDIA.h}>
            <video className="fa__video" src={card.media.src} poster={card.media.poster} muted loop autoPlay playsInline preload="metadata" />
          </foreignObject>
        ) : null}
        {(card.kind === "worlds" && !card.media) || card.kind === "mathematics" ? (
          <g transform={`translate(${MEDIA.x} ${MEDIA.y}) scale(${MEDIA.w / 560} ${MEDIA.h / 315})`}>
            {card.kind === "worlds" ? <WorldsPlaceholder /> : <MathBoard />}
          </g>
        ) : null}
      </g>
      <path className="fa__inset" d={media} />
      <path className="fa__edge" d={chamfer} />
      {[
        [0, 0],
        [W, H],
        [0, H],
      ].map(([x, y], j) => (
        <path key={j} className="fa__cross" d={`M${x - 7} ${y} L${x + 7} ${y} M${x} ${y - 7} L${x} ${y + 7}`} />
      ))}
    </>
  );
}

/** A card of the middle beat, in the modules' own make: a slab with its head
    and its rows, the tool's an instruction log, the collaborator's a talk. */
function SideCard({
  x,
  y,
  mark,
  spec,
  kind,
}: {
  x: number;
  y: number;
  mark: string;
  spec: { label: string; line: string; rows: readonly string[] };
  kind: "tool" | "collab";
}) {
  const w = SIDE.w;
  const h = SIDE.h;
  const outer = chamferPts(w, h, 16, x, y);
  const back = chamferPts(w, h, 16, x + 12, y - 9);
  return (
    <g className="fa__side" data-kind={kind}>
      <path className="fa__side-back" d={chamferOf(back)} />
      <path className="fa__join" d={outer.map(([px, py]) => `M${px} ${py} l12 -9`).join(" ")} />
      <path className="fa__ground" d={chamferOf(outer)} />
      <path className="fa__edge" d={chamferOf(outer)} />
      <text className="fa__mod-eyebrow" x={x + 18} y={y + 28}>
        {mark} · {spec.label.toUpperCase()}
      </text>
      <text className="fa__side-title" x={x + 18} y={y + 60}>
        {spec.line}
      </text>
      <path className="fa__inset" d={`M${x + 18} ${y + 78} L${x + w - 18} ${y + 78}`} />
      {spec.rows.map((r, i) =>
        kind === "tool" ? (
          <g key={r}>
            <text className="fa__side-row" x={x + 18} y={y + 104 + i * 26}>
              <tspan className="fa__side-mark">›</tspan> {r}
            </text>
            <text className="fa__side-ok" x={x + w - 18} y={y + 104 + i * 26} textAnchor="end">
              DONE
            </text>
          </g>
        ) : (
          <text
            key={r}
            className="fa__side-row"
            data-voice={i % 2 ? "b" : "a"}
            x={i % 2 ? x + w - 18 : x + 18}
            y={y + 108 + i * 34}
            textAnchor={i % 2 ? "end" : "start"}
          >
            {r}
          </text>
        )
      )}
      {[
        [x, y],
        [x + w, y + h],
        [x, y + h],
      ].map(([cx, cy], j) => (
        <path key={j} className="fa__cross" d={`M${cx - 6} ${cy} L${cx + 6} ${cy} M${cx} ${cy - 6} L${cx} ${cy + 6}`} />
      ))}
    </g>
  );
}

const toneOf = (tone: Tone, name: string) =>
  name === "gold" ? tone.gold : name === "green" ? tone.green : name === "red" ? tone.red : tone.ink;

function strokePath(ctx: CanvasRenderingContext2D, pts: P2[], k: number, upto = pts.length - 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x * k, pts[0].y * k);
  for (let j = 1; j <= upto; j++) ctx.lineTo(pts[j].x * k, pts[j].y * k);
  ctx.stroke();
}

/** The cords: from the manifold's ports out and round into every plate. */
function paintCords(
  ctx: CanvasRenderingContext2D,
  m: BrainModel,
  pl: Place,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number; n: number; a: number }
) {
  const { k, dpr, tone, n } = o;
  for (let i = 0; i < n; i++) {
    const cord = CORDS[i % CORDS.length];
    const from = portAt(m, pl, i);
    const to = plateSocket(i, n, plateOrigin(i, o.a));
    const reachOut = 80 + i * 22;
    // Down out of the manifold first, then round the stack's corner and in
    // from outside its right edge: a cord never crosses a plate's face.
    const pts = cable(from, to, { x: 60 + i * 26, y: 110 }, { x: SCREEN_X.x * reachOut, y: SCREEN_X.y * reachOut }, 40);
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

/** The middle beat's runs: from the brain's left to the tool's card, squared
    as a board routes; from its right to the collaborator's, loose streams of
    particles running both ways. */
function paintRuns(ctx: CanvasRenderingContext2D, pl: Place, o: { k: number; dpr: number; tone: Tone; since: number; now: number }) {
  const { k, dpr, tone } = o;
  const grow = smooth(o.since / 0.8);
  if (grow <= 0) return;
  const widths = [2.2, 1.2, 1.8];
  const pinY = [-40, 0, 40];
  for (let j = 0; j < 3; j++) {
    const a = flankAt(pl, -1, j);
    const end = { x: SIDE.tool + SIDE.w + 1, y: SIDE.y + pinY[j] };
    const bend = (a.x + end.x) / 2 + (j - 1) * 14;
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
  }
  for (let j = 0; j < 3; j++) {
    const a = flankAt(pl, 1, j);
    const end = { x: SIDE.collab - 1, y: SIDE.y + pinY[j] };
    const pts = cable(a, end, { x: 80, y: (j - 1) * 60 }, { x: -80, y: (1 - j) * 30 }, 40);
    const col = j === 1 ? tone.ink : tone.green;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1 * dpr;
    strokePath(ctx, pts, k, Math.max(1, Math.floor(grow * (pts.length - 1))));
    if (grow < 1) continue;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(end.x * k - 3 * dpr, end.y * k - 3 * dpr, 6 * dpr, 6 * dpr);
    for (let s = 0; s < 20; s++) {
      const dir = s % 2 ? 1 : -1;
      const base = (s / 20 + (dir * o.now) / (5200 + j * 600)) % 1;
      const t = base < 0 ? base + 1 : base;
      const q = pts[Math.floor(t * (pts.length - 1))];
      const jx = 3.5 * Math.sin(s * 12.9 + o.now / 600);
      const jy = 3.5 * Math.cos(s * 7.3 + o.now / 700);
      const r = (1.4 + (s % 3) * 0.7) * dpr;
      ctx.globalAlpha = 0.85;
      ctx.fillRect((q.x + jx) * k - r / 2, (q.y + jy) * k - r / 2, r, r);
    }
  }
}

/**
 * Every desk: three rings of knowledge work round the brain, nearest first,
 * near level as the homepage's orbits are, a node and its name for every
 * kind of work, drifting slowly round. Drawn in two passes: the far halves
 * under the brain, the near halves over it.
 */
function paintRings(
  ctx: CanvasRenderingContext2D,
  layers: readonly { label: string; domains: readonly string[] }[],
  pl: Place,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean },
  near: boolean
) {
  const { k, dpr, tone } = o;
  const RX = [300, 420, 540];
  const tilt = 0.34;
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  ctx.font = `${11 * k}px "PT Mono", ui-monospace, monospace`;
  layers.forEach((layer, li) => {
    const rx = RX[li];
    const ry = rx * tilt;
    const cy = pl.y + 10;
    const show = smooth((o.since - 1.0 - li * 0.35) / 0.7);
    if (show <= 0) return;
    // The ring, its far or near half.
    ctx.strokeStyle = li === 0 ? tone.gold : tone.ink;
    ctx.lineWidth = (li === 0 ? 1.3 : 1) * dpr;
    ctx.setLineDash(li === 2 ? [3 * dpr, 6 * dpr] : []);
    ctx.globalAlpha = (near ? 0.75 : 0.22) * show * (li === 2 ? 0.8 : 1);
    ctx.beginPath();
    const from = near ? 0 : Math.PI;
    for (let j = 0; j <= 80; j++) {
      const t = from + (j / 80) * Math.PI;
      const x = pl.x + Math.cos(t) * rx;
      const y = cy + Math.sin(t) * ry;
      if (j) ctx.lineTo(x * k, y * k);
      else ctx.moveTo(x * k, y * k);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // Its nodes and their names.
    const m = layer.domains.length;
    layer.domains.forEach((d, j) => {
      const t = (j / m) * Math.PI * 2 + o.now / (60000 + li * 30000) * (li % 2 ? -1 : 1) + li * 0.4;
      const front = Math.sin(t) > 0;
      if (front !== near) return;
      const x = pl.x + Math.cos(t) * rx;
      const y = cy + Math.sin(t) * ry;
      const depth = 0.45 + 0.55 * (Math.sin(t) + 1) / 2;
      ctx.globalAlpha = show * depth;
      ctx.fillStyle = li === 0 ? tone.lit : tone.ink;
      const r = (li === 0 ? 4 : 3) * dpr;
      ctx.fillRect(x * k - r / 2, y * k - r / 2, r, r);
      ctx.globalAlpha = show * depth * 0.9;
      ctx.fillStyle = li === 0 ? tone.gold : tone.ink;
      ctx.textAlign = Math.cos(t) < 0 ? "right" : "left";
      ctx.fillText(d.toUpperCase(), (x + (Math.cos(t) < 0 ? -10 : 10)) * k, (y + 4) * k);
    });
    // The ring's name, in the legend under the figure.
    if (near) {
      const lx = pl.x - 260 + li * 190;
      const ly = 700;
      ctx.globalAlpha = 0.8 * show;
      ctx.strokeStyle = li === 0 ? tone.gold : tone.ink;
      ctx.lineWidth = (li === 0 ? 1.3 : 1) * dpr;
      ctx.setLineDash(li === 2 ? [3 * dpr, 6 * dpr] : []);
      ctx.beginPath();
      ctx.moveTo(lx * k, ly * k);
      ctx.lineTo((lx + 36) * k, ly * k);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = li === 0 ? tone.gold : tone.ink;
      ctx.textAlign = "left";
      ctx.fillText(layer.label.toUpperCase(), (lx + 46) * k, (ly + 4) * k);
    }
  });
  ctx.restore();
}

/**
 * The shoggoth's tentacles: twelve from under and around the brain, each a
 * chain that tapers to its tip and curls, a slow wave running out along it,
 * suckers in gold along its underside. Far ones first, under the brain.
 */
function paintTentacles(ctx: CanvasRenderingContext2D, pl: Place, o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean }, near: boolean) {
  const { k, dpr, tone } = o;
  const grow = smooth((o.since - 0.6) / 1.6);
  if (grow <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  ctx.lineCap = "round";
  const N = 12;
  for (let i = 0; i < N; i++) {
    const isNear = i % 3 !== 0;
    if (isNear !== near) continue;
    // Roots along the brain's underside, fanning out.
    const u = i / (N - 1);
    const root = isNear
      ? { x: pl.x + (u - 0.5) * 300 * pl.s, y: pl.y + (110 + 70 * Math.sin(u * Math.PI)) * pl.s }
      : { x: pl.x + (u - 0.5) * 380 * pl.s, y: pl.y - 40 * pl.s };
    const ang0 = isNear ? Math.PI / 2 - (u - 0.5) * 3.0 : -Math.PI / 2 + (u - 0.5) * 2.8;
    const len = (isNear ? 420 + 160 * Math.sin(i * 2.3) : 330 + 90 * Math.cos(i)) * pl.s * grow;
    const segs = 60;
    const step = len / segs;
    const pts: P2[] = [root];
    let p = root;
    for (let s = 1; s <= segs; s++) {
      const f = s / segs;
      // The heading is set, not summed: a wave travels out along it and the
      // tip curls, but the fan holds.
      const ang = ang0 + 0.32 * Math.sin(o.now / 1400 - f * 5 + i * 1.3) * (0.25 + f) + (f > 0.55 ? (i % 2 ? 1 : -1) * (f - 0.55) * 2.6 : 0);
      p = { x: p.x + Math.cos(ang) * step, y: p.y + Math.sin(ang) * step };
      pts.push(p);
    }
    const base = (isNear ? 8 : 5) * pl.s;
    for (let s = 1; s < pts.length; s++) {
      const f = s / segs;
      const w = base * (1 - f) + 0.6;
      ctx.strokeStyle = f > 0.55 ? tone.gold : tone.ink;
      ctx.globalAlpha = (isNear ? 0.38 : 0.18) * (1 - 0.5 * f);
      ctx.lineWidth = w * dpr;
      ctx.beginPath();
      ctx.moveTo(pts[s - 1].x * k, pts[s - 1].y * k);
      ctx.lineTo(pts[s].x * k, pts[s].y * k);
      ctx.stroke();
      // Suckers along the underside, in gold, shrinking to the tip.
      if (s % 4 === 0 && f < 0.85) {
        const a = pts[s - 1];
        const b = pts[s];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l = Math.hypot(dx, dy) || 1;
        const sx = b.x + (-dy / l) * w * 0.9;
        const sy = b.y + (dx / l) * w * 0.9;
        ctx.globalAlpha = (isNear ? 0.85 : 0.35) * (1 - f);
        ctx.strokeStyle = tone.gold;
        ctx.lineWidth = 0.9 * dpr;
        ctx.beginPath();
        ctx.arc(sx * k, sy * k, Math.max(0.8, w * 0.45) * k, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

/** The mask: a smiling face held in front of the brain, thin gold. */
function paintMask(ctx: CanvasRenderingContext2D, pl: Place, o: { k: number; dpr: number; tone: Tone; since: number; light: boolean }) {
  const { k, dpr, tone } = o;
  const show = smooth(o.since / 0.8);
  if (show <= 0) return;
  const c = { x: pl.x + 6 * pl.s, y: pl.y - 4 * pl.s };
  const rx = 62 * pl.s;
  const ry = 74 * pl.s;
  ctx.save();
  ctx.translate(c.x * k, c.y * k);
  ctx.rotate(-0.08);
  ctx.globalAlpha = show * (o.light ? 0.9 : 0.85);
  ctx.fillStyle = o.light ? "rgba(233, 225, 211, 0.9)" : "rgba(10, 9, 8, 0.82)";
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * k, ry * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tone.lit;
  ctx.lineWidth = 1.6 * dpr;
  ctx.stroke();
  // Two eyes and the smile.
  ctx.lineWidth = 1.8 * dpr;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * 22 * pl.s * k, -16 * pl.s * k, 8 * pl.s * k, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 6 * pl.s * k, 30 * pl.s * k, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  // Its strap, round behind the brain.
  ctx.globalAlpha = show * 0.5;
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(-rx * k, -8 * pl.s * k);
  ctx.lineTo(-rx * k - 110 * pl.s * k, -24 * pl.s * k);
  ctx.moveTo(rx * k, -8 * pl.s * k);
  ctx.lineTo(rx * k + 110 * pl.s * k, -24 * pl.s * k);
  ctx.stroke();
  ctx.restore();
}

/** Latent space: points in depth, in clusters, and the named nodes among
    them, each tied to its nearest neighbours. */
type Field = { pts: { x: number; y: number; z: number; c: number }[]; nodes: { i: number; name: string; near: number[] }[] };
function latentField(names: readonly string[]): Field {
  let seed = 9;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const centres = Array.from({ length: 11 }, () => ({ x: (rnd() - 0.5) * 2.8, y: (rnd() - 0.5) * 1.2, z: (rnd() - 0.5) * 2.4 }));
  const pts = Array.from({ length: 1600 }, () => {
    const c = Math.floor(rnd() * centres.length);
    const s = 0.16 + rnd() * 0.18;
    return { x: centres[c].x + gauss() * s, y: centres[c].y + gauss() * s * 0.7, z: centres[c].z + gauss() * s, c };
  });
  const nodes = names.map((name, j) => {
    const i = Math.floor((j + 0.5) * (pts.length / names.length));
    const p = pts[i];
    const near = pts
      .map((q, qi) => ({ qi, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2 }))
      .sort((a, b) => a.d - b.d)
      .slice(1, 6)
      .map((x) => x.qi);
    return { i, name, near };
  });
  return { pts, nodes };
}

function paintField(ctx: CanvasRenderingContext2D, f: Field, o: { k: number; dpr: number; tone: Tone; since: number; now: number; light: boolean }) {
  const { k, dpr, tone } = o;
  const show = smooth(o.since / 1.2);
  const yaw = o.now / 26000;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const C = { x: 720, y: 430 };
  const S = 330;
  const proj = (p: { x: number; y: number; z: number }) => {
    const x = p.x * cy - p.z * sy;
    const z = p.x * sy + p.z * cy;
    const persp = 3.2 / (3.2 - z);
    return { x: C.x + x * S * persp, y: C.y + p.y * S * persp, z, persp };
  };
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  const P = f.pts.map(proj);
  // The ties first, faint.
  ctx.strokeStyle = tone.gold;
  ctx.lineWidth = 0.7 * dpr;
  for (const n of f.nodes) {
    const a = P[n.i];
    for (const qi of n.near) {
      const b = P[qi];
      ctx.globalAlpha = 0.35 * show;
      ctx.beginPath();
      ctx.moveTo(a.x * k, a.y * k);
      ctx.lineTo(b.x * k, b.y * k);
      ctx.stroke();
    }
  }
  // The field, faded with depth, and kept quiet round the line at its centre.
  for (let i = 0; i < P.length; i++) {
    const q = P[i];
    const dx = (q.x - C.x) / 380;
    const dy = (q.y - C.y) / 150;
    const hush = Math.min(1, Math.sqrt(dx * dx + dy * dy));
    ctx.globalAlpha = show * (0.15 + 0.6 * ((q.z + 1.4) / 2.8)) * (0.25 + 0.75 * hush);
    ctx.fillStyle = f.pts[i].c % 3 === 0 ? tone.gold : tone.ink;
    const r = 1.6 * q.persp * dpr;
    ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
  }
  // The named nodes: a ring, a point, a name.
  ctx.font = `${11 * k}px "PT Mono", ui-monospace, monospace`;
  for (const n of f.nodes) {
    const q = P[n.i];
    const dx = (q.x - C.x) / 300;
    const dy = (q.y - C.y) / 140;
    const clear = smooth((Math.sqrt(dx * dx + dy * dy) - 0.9) / 0.4);
    if (clear <= 0) continue;
    ctx.globalAlpha = show * clear;
    ctx.strokeStyle = tone.lit;
    ctx.lineWidth = 1.2 * dpr;
    ctx.beginPath();
    ctx.arc(q.x * k, q.y * k, 7 * q.persp * k, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = tone.lit;
    ctx.fillRect(q.x * k - 2 * dpr, q.y * k - 2 * dpr, 4 * dpr, 4 * dpr);
    ctx.globalAlpha = show * 0.9 * clear;
    ctx.fillStyle = tone.ink;
    ctx.textAlign = "left";
    ctx.fillText(n.name.toUpperCase(), (q.x + 12) * k, (q.y + 4) * k);
  }
  ctx.restore();
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
      <text x={560 / 2} y={315 - 34} textAnchor="middle">
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
