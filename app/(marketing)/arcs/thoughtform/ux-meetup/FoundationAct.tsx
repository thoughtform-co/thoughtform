"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";

import {
  EDGE,
  ISO_PHI,
  ISO_PSI,
  ISO_S,
  basisOf,
  dot3,
  mindModel,
  projB,
  type Camera,
  type MindModel,
} from "@/components/arcs/figures/foundation/mind";
import {
  CARD,
  SCREEN_X,
  STACK_L,
  VB,
  axesAt,
  cable,
  lerp,
  plateCorner,
  plateOrigin,
  plateSocket,
  sheetPoses,
  smooth,
  type M6,
  type P2,
} from "@/components/arcs/figures/foundation/scene";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { UX_MEETUP_ARC } from "@/lib/arcs/content/ux-meetup";

/**
 * FoundationAct — one scene across three beats (ADR-156 U5, U6): what it can
 * make, the new interface, an intelligence. The examples face the reader one
 * by one as framed slabs and lie down in the stack on the left, on its grid
 * between its axes; the stack cascades to the centre, layer by layer; the
 * machine mind stands over it and its tendrils plug into every plate the
 * moment the beat lands. After the voice the mind alone turns to face the
 * reader, between a tool and a collaborator.
 *
 * ⚠ A READER on the talk's scroll (one passive listener, one rAF) that
 * writes only its own layer. It is shown only while one of its beats is the
 * beat up (`data-uxm-active`, the tail's reader), above the terminal tier.
 * The sheets are SVG on exact plane matrices (`scene.ts`); the mind
 * (`mind.ts`), its tendrils and runs are a canvas over the same box; the
 * words are DOM.
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
const pct = (x: number, y: number) => ({ "--ax": x / VB.w, "--at": y / VB.h }) as CSSProperties;
const apply = (m: M6, x: number, y: number): P2 => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

/** The tray a plate sits on: its little grid, a margin past its edges. */
const TRAY = 26;
const trayPath = (() => {
  const d: string[] = [chamferOf(chamferPts(W + 2 * TRAY, H + 2 * TRAY, CUT + 10, -TRAY, -TRAY))];
  for (let x = -TRAY; x <= W + TRAY; x += 35) d.push(`M${x} ${-TRAY} L${x} ${H + TRAY}`);
  for (let y = -TRAY; y <= H + TRAY; y += 35) d.push(`M${-TRAY} ${y} L${W + TRAY} ${y}`);
  return d.join(" ");
})();

/** The tendrils: no two alike (owner: "not all be the same size ... gold,
    green, white, red"). Width in viewBox px. */
const CORDS = [
  { tone: "gold", w: 3.4 },
  { tone: "green", w: 1.4 },
  { tone: "ink", w: 2.4 },
  { tone: "red", w: 1.1 },
  { tone: "gold", w: 2.2 },
  { tone: "green", w: 2.8 },
] as const;

/** The interface beat's mind: the scene's isometric, over the stack. */
const MIND_IFC: Camera = { psi: ISO_PSI, phi: ISO_PHI, s: ISO_S * 0.82, o: { x: 742, y: 244 } };
/** The intelligence beat's mind: face on, centred, larger. */
const MIND_MID: Camera = { psi: Math.PI / 2, phi: 0.24, s: ISO_S * 1.32, o: { x: 720, y: 400 } };
/** The two poles of the middle beat, in the viewBox. */
const POLE = { tool: { x: 214, y: 430 }, collab: { x: 1226, y: 430 }, w: 176, h: 124 } as const;

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
  const mind = ifc?.kind === "figure" && ifc.figure.id === "interface" ? ifc.figure.mind : "";
  const middle =
    mid?.kind === "figure" && mid.figure.id === "middle"
      ? mid.figure
      : { line: "", tool: { label: "", line: "" }, collaborator: { label: "", line: "" } };
  /* The beats' own labels: the act carries them, since it draws over the
     beats' label rows. */
  const eyebrows = [cap, ifc, mid].map((s) =>
    s?.kind === "figure" ? (s.eyebrow ?? s.head?.eyebrow ?? "") : ""
  );
  return { cards, mind, middle, eyebrows };
}

export function FoundationAct() {
  const { cards, mind, middle, eyebrows } = useMemo(() => findSpecs(), []);
  const n = cards.length;
  const axes = useMemo(() => axesAt(n, STACK_L), [n]);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRefs = useRef<(SVGGElement | null)[]>([]);
  const backRefs = useRef<(SVGGElement | null)[]>([]);
  const ghostRefs = useRef<(SVGGElement | null)[]>([]);
  const trayRefs = useRef<(SVGGElement | null)[]>([]);
  const joinRefs = useRef<(SVGPathElement | null)[]>([]);
  const tickRefs = useRef<(SVGGElement | null)[]>([]);
  const floorRef = useRef<SVGGElement>(null);
  const leaderRef = useRef<SVGPathElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const modelRef = useRef<HTMLSpanElement>(null);
  const statementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (!window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const talk = root.closest<HTMLElement>(".arc-root");
    talk?.setAttribute("data-act", "live");
    const model = mindModel();
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
      queueScramble(jobs, el, text, performance.now() / 1000);
      if (!scrambleRaf) scrambleRaf = requestAnimationFrame(tick);
    };
    let facingIdx = -1;
    let phase = -1;
    let landed = 0;
    let dpr = 1;
    const tone = { ink: "rgb(235, 227, 214)", gold: "rgb(202, 165, 84)", green: "rgb(122, 158, 106)", red: "rgb(255, 107, 53)" };

    const size = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const cs = getComputedStyle(canvas);
      tone.ink = cs.color || tone.ink;
      tone.gold = cs.getPropertyValue("--fa-gold").trim() || tone.gold;
      tone.green = cs.getPropertyValue("--fa-green").trim() || tone.green;
      tone.red = cs.getPropertyValue("--fa-red").trim() || tone.red;
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
        root.dataset.faPhase = String(phase);
        scramble(eyebrowRef.current, eyebrows[phase]);
        if (phase === 1) scramble(modelRef.current, mind);
        if (phase === 2) scramble(statementRef.current, middle.line);
      }
      const since = (now - landed) / 1000;
      const k = canvas.width / VB.w;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (phase < 2) {
        const a = phase === 1 ? Math.max(1, c.a) : c.a;
        const poses = sheetPoses(n, a);
        const o0 = plateOrigin(0, a);
        floorRef.current?.setAttribute("transform", `translate(${(o0.x - STACK_L.x).toFixed(1)} ${(o0.y - STACK_L.y).toFixed(1)})`);
        root.toggleAttribute("data-fa-floor", poses[0].seated);
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
          tray.style.visibility = p.seated ? "" : "hidden";
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
        if (f !== facingIdx) {
          facingIdx = f;
          const card = cards[f];
          if (card && titleRef.current && lineRef.current && yearRef.current) {
            yearRef.current.textContent = `${String(f + 1).padStart(2, "0")} · ${card.year}`;
            lineRef.current.textContent = card.caption;
            scramble(titleRef.current, card.title);
          }
        }
        if (phase === 1) {
          const cam: Camera = { ...MIND_IFC, psi: ISO_PSI + 0.12 * Math.sin(now / 2600) };
          const grown = paintMind(ctx, model, cam, { k, dpr, tone, since, split: 0, now });
          placeLabel(modelRef.current, cam);
          if (grown) paintCords(ctx, model, cam, { k, dpr, tone, since, now, n, a });
        }
      } else {
        // The middle: the mind turns to face the reader, then reaches out.
        const turn = smooth(since / 1.5);
        const cam: Camera = {
          psi: lerp(MIND_IFC.psi, MIND_MID.psi, turn) + 0.1 * turn * Math.sin(now / 3200),
          phi: lerp(MIND_IFC.phi, MIND_MID.phi, turn),
          s: lerp(MIND_IFC.s, MIND_MID.s, turn),
          o: { x: lerp(MIND_IFC.o.x, MIND_MID.o.x, turn), y: lerp(MIND_IFC.o.y, MIND_MID.o.y, turn) },
        };
        paintMind(ctx, model, cam, { k, dpr, tone, since, split: turn, now });
        root.toggleAttribute("data-fa-poles", since > 1.3);
        if (since > 1.3) paintRuns(ctx, model, cam, { k, dpr, tone, since: since - 1.3, now });
      }
      ctx.globalAlpha = 1;
    };

    const placeLabel = (el: HTMLElement | null, cam: Camera) => {
      if (!el) return;
      const p = projB({ x: 0, y: 0, z: 4.4 }, basisOf(cam), cam.o);
      el.style.setProperty("--ax", String(p.x / VB.w));
      el.style.setProperty("--at", String(p.y / VB.h));
    };

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
      talk?.removeAttribute("data-act");
    };
  }, [cards, n, mind, middle, eyebrows, axes]);

  return (
    <div ref={rootRef} className="fa" aria-hidden="true">
      <div className="fa__box">
        <svg className="fa__svg" viewBox={`0 0 ${VB.w} ${VB.h}`}>
          <defs>
            <clipPath id="fa-cut">
              <path d={inner} />
            </clipPath>
          </defs>
          <g className="fa__stack">
            <g ref={floorRef} className="fa__floor">
              <path className="fa__grid" d={axes.grid} />
              <path className="fa__axis" d={`M${axes.y[0].x} ${axes.y[0].y} L${axes.y[1].x} ${axes.y[1].y}`} />
              <path className="fa__axis" d={`M${axes.x[0].x} ${axes.x[0].y} L${axes.x[1].x} ${axes.x[1].y}`} />
              <path className="fa__axis" d={axes.arrow} />
              <text className="fa__axis-name" transform={mat(axes.label)}>
                MODEL CAPABILITIES
              </text>
              {cards.map((c, i) => (
                <g key={c.id} ref={(el) => void (tickRefs.current[i] = el)}>
                  <path className="fa__axis" d={`M${axes.ticks[i].x - 6} ${axes.ticks[i].y} L${axes.ticks[i].x} ${axes.ticks[i].y}`} />
                  <text className="fa__tick" x={axes.ticks[i].x - 12} y={axes.ticks[i].y + 4} textAnchor="end">
                    {String(i + 1).padStart(2, "0")} {c.kind.toUpperCase()}
                  </text>
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
                  <path d={chamfer} transform="translate(44 -33)" />
                  <path d={chamfer} transform="translate(30 -22)" />
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
                    {c.kind === "mathematics" ? <ProofTree /> : null}
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
                  <text className="fa__tag" x={INSET + 12} y={INSET + 22}>
                    {String(i + 1).padStart(2, "0")} · {c.kind.toUpperCase()}
                  </text>
                </g>
              </g>
            ))}
          </g>
          <g className="fa__poles">
            <path className="fa__spine" d={`M96 ${POLE.tool.y} L${VB.w - 96} ${POLE.tool.y}`} />
            <Pole at={POLE.tool} name={middle.tool.label} line={middle.tool.line} glyph="tool" />
            <Pole at={POLE.collab} name={middle.collaborator.label} line={middle.collaborator.line} glyph="collab" />
          </g>
        </svg>
        <canvas ref={canvasRef} className="fa__dots" />
        <p className="arc-inter__marks fa__marks">
          <i className="arc-inter__x arc-inter__x--origin" />
          <span className="arc-inter__mrule" />
          <span ref={eyebrowRef} className="arc-desig" />
          <span className="arc-inter__mrule" />
          <i className="arc-inter__x arc-inter__x--close" />
        </p>
        <div className="fa__words" style={pct(700, 520)}>
          <span ref={yearRef} className="fa__year" />
          <h3 ref={titleRef} className="fa__title" />
          <p ref={lineRef} className="fa__line" />
        </div>
        <span ref={modelRef} className="fa__model" />
        <p ref={statementRef} className="fa__statement" />
      </div>
    </div>
  );
}

type Tone = { ink: string; gold: string; green: string; red: string };

/**
 * The machine mind, painted: its seams as lines, its particles as the
 * texture, its dies, traces and bus in gold. `split` (0 to 1) gives the two
 * halves their two natures: the left a crisp machine, the right loose
 * particles. Returns whether it has assembled (the cords wait for it).
 */
function paintMind(
  ctx: CanvasRenderingContext2D,
  m: MindModel,
  cam: Camera,
  o: { k: number; dpr: number; tone: Tone; since: number; split: number; now: number }
): boolean {
  const B = basisOf(cam);
  const v = B.view;
  const { k, dpr, tone, split } = o;
  const t = o.since / 0.9;
  const pts = m.verts.map((p) => projB(p, B, cam.o));
  const under = smooth((t - 0.45) / 0.5);
  if (under > 0) {
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = tone.ink;
    for (const ed of m.edges) {
      if (ed.kind === EDGE.shell) continue;
      const f = dot3(ed.n, v);
      // The heatsink is the back's: seen from the front it would read as a
      // box over the face, so it fades as the mind turns.
      const fin = 0.38 * (1 - 0.92 * Math.abs(v.x));
      ctx.globalAlpha = (ed.kind === EDGE.fin ? fin : f > 0 ? 0.6 : 0.2) * under;
      ctx.strokeStyle = ed.kind === EDGE.port ? tone.gold : tone.ink;
      const a = pts[ed.a];
      const b = pts[ed.b];
      ctx.beginPath();
      ctx.moveTo(a.x * k, a.y * k);
      ctx.lineTo(b.x * k, b.y * k);
      ctx.stroke();
    }
  }
  // The particles: they fly in, then hold their seats; the right half
  // breathes once the mind has turned.
  for (const d of m.dots) {
    const e = smooth((t - d.delay) / 0.6);
    if (e <= 0) continue;
    const f = dot3(d.n, v);
    const lit = f > 0;
    const loose = d.side < 0 ? split : 0;
    const crisp = d.side > 0 ? split : 0;
    let alpha = lit ? 0.3 + 0.55 * f : 0.07;
    alpha *= d.seam ? 1 : 0.7;
    alpha *= 1 - 0.55 * crisp;
    alpha *= 1 + 0.5 * loose;
    const q = projB(d.p, B, cam.o);
    const wob = loose * 3 * Math.sin(o.now / 700 + d.delay * 40);
    const x = q.x + d.dx * (1 - e) + wob;
    const y = q.y + d.dy * (1 - e) + loose * 3 * Math.cos(o.now / 900 + d.delay * 30);
    ctx.globalAlpha = Math.min(1, alpha) * e;
    ctx.fillStyle = loose > 0.5 && d.seam ? tone.green : tone.ink;
    const s = (d.seam ? 1.6 : 1.3) * (1 + 0.6 * loose) * dpr;
    ctx.fillRect(x * k - s / 2, y * k - s / 2, s, s);
  }
  const wire = smooth((t - 0.45) / 0.5);
  if (wire <= 0) return false;
  // The seams: front ones bright, the far side faint, the left half gold
  // as it turns into the tool's side.
  ctx.lineWidth = 1 * dpr;
  for (const pass of [0, 1] as const) {
    for (const ed of m.edges) {
      if (ed.kind !== EDGE.shell) continue;
      const f = dot3(ed.n, v);
      const front = f > 0;
      if ((pass === 1) !== front) continue;
      const gold = ed.side > 0 ? split : 0;
      const loose = ed.side < 0 ? split : 0;
      let alpha = front ? 0.3 + 0.45 * f : 0.08;
      alpha *= 1 - 0.65 * loose;
      ctx.globalAlpha = Math.min(1, alpha * (1 + 0.6 * gold)) * wire;
      ctx.strokeStyle = gold > 0.5 ? tone.gold : tone.ink;
      const a = pts[ed.a];
      const b = pts[ed.b];
      ctx.beginPath();
      ctx.moveTo(a.x * k, a.y * k);
      ctx.lineTo(b.x * k, b.y * k);
      ctx.stroke();
    }
  }
  // Vertices: a node at every front corner of the shells.
  ctx.fillStyle = tone.ink;
  for (const ed of m.edges) {
    if (ed.kind !== EDGE.shell || dot3(ed.n, v) <= 0.2) continue;
    const a = pts[ed.a];
    ctx.globalAlpha = 0.75 * wire * (1 - 0.6 * (ed.side < 0 ? split : 0));
    ctx.fillRect(a.x * k - 1.5 * dpr, a.y * k - 1.5 * dpr, 3 * dpr, 3 * dpr);
  }
  // The circuits: dies with their pins, traces with a pulse, the bus.
  const chip = smooth((t - 0.75) / 0.4);
  if (chip > 0) {
    ctx.strokeStyle = tone.gold;
    ctx.fillStyle = tone.gold;
    for (const die of m.dies) {
      const f = dot3(die.n, v);
      const shown = f > 0 ? 1 : 0.18;
      const fade = die.side < 0 ? 1 - 0.6 * split : 1;
      const c = die.corners.map((p) => projB(p, B, cam.o));
      ctx.globalAlpha = 0.28 * shown * chip * fade;
      ctx.beginPath();
      c.forEach((p, i) => (i ? ctx.lineTo(p.x * k, p.y * k) : ctx.moveTo(p.x * k, p.y * k)));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.95 * shown * chip * fade;
      ctx.lineWidth = 1.3 * dpr;
      ctx.stroke();
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      for (const [p, q] of die.pins) {
        const a = projB(p, B, cam.o);
        const b = projB(q, B, cam.o);
        ctx.moveTo(a.x * k, a.y * k);
        ctx.lineTo(b.x * k, b.y * k);
      }
      ctx.globalAlpha = 0.7 * shown * chip * fade;
      ctx.stroke();
    }
    m.traces.forEach((tr, ti) => {
      const p = tr.pts.map((q) => projB(q, B, cam.o));
      const f = dot3(m.dies[Math.min(m.dies.length - 1, ti)].n, v);
      const fade = tr.side < 0 ? 1 - 0.6 * split : 1;
      ctx.globalAlpha = (f > 0 ? 0.85 : 0.15) * chip * fade;
      ctx.lineWidth = 1.4 * dpr;
      ctx.beginPath();
      p.forEach((q, i) => (i ? ctx.lineTo(q.x * k, q.y * k) : ctx.moveTo(q.x * k, q.y * k)));
      ctx.stroke();
      const run = (o.now / 1400 + ti * 0.23) % 1;
      const q = p[Math.min(p.length - 1, Math.floor(run * p.length))];
      ctx.globalAlpha = chip * fade;
      ctx.fillRect(q.x * k - 2 * dpr, q.y * k - 2 * dpr, 4 * dpr, 4 * dpr);
    });
    ctx.lineWidth = 1.2 * dpr;
    for (const w of m.bus) {
      const p = w.map((q) => projB(q, B, cam.o));
      ctx.globalAlpha = 0.8 * chip;
      ctx.beginPath();
      p.forEach((q, i) => (i ? ctx.lineTo(q.x * k, q.y * k) : ctx.moveTo(q.x * k, q.y * k)));
      ctx.stroke();
      for (const q of [p[0], p[p.length - 1]]) ctx.fillRect(q.x * k - 2 * dpr, q.y * k - 2 * dpr, 4 * dpr, 4 * dpr);
    }
    for (const s of m.sockets) {
      const q = projB(s, B, cam.o);
      ctx.globalAlpha = chip;
      ctx.fillRect(q.x * k - 3 * dpr, q.y * k - 3 * dpr, 6 * dpr, 6 * dpr);
    }
  }
  return chip >= 1;
}

const toneOf = (tone: Tone, name: string) =>
  name === "gold" ? tone.gold : name === "green" ? tone.green : name === "red" ? tone.red : tone.ink;

function strokePath(ctx: CanvasRenderingContext2D, pts: P2[], k: number, upto = pts.length - 1) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x * k, pts[0].y * k);
  for (let j = 1; j <= upto; j++) ctx.lineTo(pts[j].x * k, pts[j].y * k);
  ctx.stroke();
}

/** The tendrils: from the port's sockets out and round into every plate. */
function paintCords(
  ctx: CanvasRenderingContext2D,
  m: MindModel,
  cam: Camera,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number; n: number; a: number }
) {
  const B = basisOf(cam);
  const { k, dpr, tone, n } = o;
  for (let i = 0; i < n; i++) {
    const cord = CORDS[i % CORDS.length];
    const from = projB(m.sockets[i % m.sockets.length], B, cam.o);
    const to = plateSocket(i, n, plateOrigin(i, o.a));
    const reachOut = 80 + i * 26;
    // Out wide to the right first, round the stack's corner, and in from
    // outside its right edge: a cord never crosses a plate's face.
    const pts = cable(from, to, { x: 230 + i * 34, y: 20 + i * 12 }, { x: SCREEN_X.x * reachOut, y: SCREEN_X.y * reachOut }, 40);
    const grow = smooth((o.since - 0.9 - i * 0.07) / 0.5);
    if (grow <= 0) continue;
    const upto = Math.max(1, Math.floor(grow * (pts.length - 1)));
    const col = toneOf(tone, cord.tone);
    ctx.strokeStyle = col;
    ctx.lineCap = "round";
    // A halo under the heavier cords, then the cord.
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
      // The plug: a socket block on the plate's edge.
      const end = pts[pts.length - 1];
      const s = (cord.w + 5) * dpr;
      ctx.fillStyle = col;
      ctx.fillRect(end.x * k - s / 2, end.y * k - s / 2, s, s);
      // Commands running down it.
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
 * The middle beat's runs: from the left half to the tool, routed square as
 * a board routes, the commands one way; from the right half to the
 * collaborator, loose streams of particles running both ways.
 */
function paintRuns(
  ctx: CanvasRenderingContext2D,
  m: MindModel,
  cam: Camera,
  o: { k: number; dpr: number; tone: Tone; since: number; now: number }
) {
  const B = basisOf(cam);
  const { k, dpr, tone } = o;
  const grow = smooth(o.since / 0.8);
  const widths = [2.6, 1.3, 2];
  const pinY = [-26, 0, 26];
  m.flanks.tool.forEach((p, j) => {
    const a = projB(p, B, cam.o);
    const end = { x: POLE.tool.x + POLE.w / 2, y: POLE.tool.y + pinY[j] };
    const bend = 360 - j * 26;
    const pts: P2[] = [a, { x: bend, y: a.y }, { x: bend, y: end.y }, end];
    // Square runs: walk them as one polyline at constant speed.
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
      for (const off of [0, 0.5]) {
        const t = (o.now / 1500 + off + j * 0.2) % 1;
        const q = dense[Math.floor(t * (dense.length - 1))];
        const r = (widths[j] + 3) * dpr;
        ctx.fillRect(q.x * k - r / 2, q.y * k - r / 2, r, r);
      }
    }
  });
  m.flanks.collab.forEach((p, j) => {
    const a = projB(p, B, cam.o);
    const end = { x: POLE.collab.x - POLE.w / 2, y: POLE.collab.y + pinY[j] };
    const pts = cable(a, end, { x: 120, y: (j - 1) * 70 }, { x: -120, y: (1 - j) * 40 }, 40);
    const col = j === 1 ? tone.ink : tone.green;
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1 * dpr;
    strokePath(ctx, pts, k, Math.max(1, Math.floor(grow * (pts.length - 1))));
    if (grow < 1) return;
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

/** A pole of the middle beat: a framed glyph, its name and its line. */
function Pole({ at, name, line, glyph }: { at: P2; name: string; line: string; glyph: "tool" | "collab" }) {
  const x = at.x - POLE.w / 2;
  const y = at.y - POLE.h / 2;
  return (
    <g className="fa__pole" data-glyph={glyph}>
      <path className="fa__pole-back" d={chamferOf(chamferPts(POLE.w, POLE.h, 14, x + 10, y - 8))} />
      <path className="fa__pole-frame" d={chamferOf(chamferPts(POLE.w, POLE.h, 14, x, y))} />
      {glyph === "tool" ? (
        <g className="fa__glyph">
          {/* A pointer and the target it is told to hit. */}
          <path d={`M${at.x - 34} ${at.y - 30} L${at.x - 34} ${at.y + 12} L${at.x - 23} ${at.y + 1} L${at.x - 14} ${at.y + 20} L${at.x - 8} ${at.y + 17} L${at.x - 17} ${at.y - 2} L${at.x - 2} ${at.y - 2} Z`} />
          <circle cx={at.x + 28} cy={at.y - 6} r="16" />
          <path d={`M${at.x + 6} ${at.y - 6} L${at.x + 50} ${at.y - 6} M${at.x + 28} ${at.y - 28} L${at.x + 28} ${at.y + 16}`} />
        </g>
      ) : (
        <g className="fa__glyph">
          {/* Two minds, overlapping: what they make together is the middle. */}
          <circle cx={at.x - 14} cy={at.y - 4} r="26" />
          <circle cx={at.x + 14} cy={at.y - 4} r="26" />
        </g>
      )}
      <text className="fa__pole-name" x={at.x} y={at.y + POLE.h / 2 + 34} textAnchor="middle">
        {name.toUpperCase()}
      </text>
      <text className="fa__pole-line" x={at.x} y={at.y + POLE.h / 2 + 60} textAnchor="middle">
        {line}
      </text>
    </g>
  );
}

/** Game worlds built from assets: a placeholder until the owner's video. */
function WorldsPlaceholder() {
  const lines = [];
  for (let x = INSET; x <= W - INSET; x += 28) lines.push(`M${x} ${INSET} L${x} ${H - INSET}`);
  for (let y = INSET; y <= H - INSET; y += 28) lines.push(`M${INSET} ${y} L${W - INSET} ${y}`);
  return (
    <g className="fa__worlds">
      <path d={lines.join(" ")} />
      <text x={W / 2} y={H / 2 + 5} textAnchor="middle">
        VIDEO TO COME
      </text>
    </g>
  );
}

/** A proof, drawn: premises, steps branching and joining, one gold result. */
function ProofTree() {
  const nodes: [number, number][] = [
    [100, 70], [220, 70], [340, 70], [460, 70],
    [160, 145], [300, 145], [420, 145],
    [230, 215], [380, 215],
    [300, 280],
  ];
  const links: [number, number][] = [
    [0, 4], [1, 4], [1, 5], [2, 5], [3, 6], [2, 6],
    [4, 7], [5, 7], [5, 8], [6, 8],
    [7, 9], [8, 9],
  ];
  return (
    <g className="fa__proof">
      {links.map(([a, b]) => (
        <path key={`${a}-${b}`} d={`M${nodes[a][0]} ${nodes[a][1]} L${nodes[b][0]} ${nodes[b][1]}`} />
      ))}
      {nodes.map(([x, y], i) => (
        <rect key={i} x={x - 24} y={y - 11} width="48" height="22" data-qed={i === nodes.length - 1 ? "" : undefined} />
      ))}
    </g>
  );
}
