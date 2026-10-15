"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";

import {
  CARD,
  VB,
  mindDots,
  mindLabel,
  plateLabel,
  sheetPoses,
  smooth,
  tendril,
  type M6,
} from "@/components/arcs/figures/foundation/scene";
import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { UX_MEETUP_ARC } from "@/lib/arcs/content/ux-meetup";

/**
 * FoundationAct — one scene across two beats (ADR-156 U5): what it can make,
 * then the new interface. The examples face the reader one by one and join a
 * stack of standing sheets to the side; then the sheets tip over into the
 * foundations, a machine mind assembles above them from particles, and its
 * tendrils plug into every plate.
 *
 * ⚠ A READER on the talk's scroll (one passive listener, one rAF) that
 * writes only its own layer. It is shown only while one of its two beats is
 * the beat up (`data-uxm-active`, the tail's reader), above the terminal tier.
 * The sheets are SVG on exact plane matrices (`scene.ts`); the mind and the
 * pulses are a canvas over the same box; the words are DOM.
 */

const CUT = 22;
const W = CARD.w;
const H = CARD.h;
const chamfer = `M0 0 L${W - CUT} 0 L${W} ${CUT} L${W} ${H} L${CUT} ${H} L0 ${H - CUT} Z`;
const mat = (m: M6) => `matrix(${m.map((v) => v.toFixed(4)).join(" ")})`;
const pct = (x: number, y: number) => ({ "--ax": x / VB.w, "--at": y / VB.h }) as CSSProperties;

type Card = {
  id: string;
  kind: string;
  year: string;
  title: string;
  caption: string;
  media?: { type: "image" | "video"; src: string; poster?: string; alt: string };
};

function findSpecs() {
  const cap = UX_MEETUP_ARC.sections.find((s) => s.id === "capability");
  const ifc = UX_MEETUP_ARC.sections.find((s) => s.id === "the-interface");
  const cards: readonly Card[] =
    cap?.kind === "figure" && cap.figure.id === "capability" ? cap.figure.cards : [];
  const mind =
    ifc?.kind === "figure" && ifc.figure.id === "interface"
      ? ifc.figure
      : { mind: "", line: "" };
  /* The beats' own labels: the act carries them, since it draws over the
     beats' label rows. */
  const eyebrows = [cap, ifc].map((s) => (s?.kind === "figure" ? (s.eyebrow ?? "") : ""));
  return { cards, mind, eyebrows };
}

export function FoundationAct() {
  const { cards, mind, eyebrows } = useMemo(() => findSpecs(), []);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetRefs = useRef<(SVGGElement | null)[]>([]);
  const ghostRefs = useRef<(SVGGElement | null)[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const n = cards.length;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (!window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const talk = root.closest<HTMLElement>(".arc-root");
    talk?.setAttribute("data-act", "live");
    const dots = mindDots(n);
    const wires = cards.map((_, i) => tendril(i, n));
    const jobs: ScrambleJob[] = [];
    let scrambleRaf = 0;
    const tick = () => {
      scrambleRaf = 0;
      advanceScrambles(jobs, performance.now() / 1000);
      if (jobs.length) scrambleRaf = requestAnimationFrame(tick);
    };
    let facingIdx = -1;
    let phase = -1;
    let dpr = 1;
    let ink = "rgb(235, 227, 214)";
    let gold = "rgb(202, 165, 84)";

    const size = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const cs = getComputedStyle(canvas);
      ink = cs.color || ink;
      gold = cs.getPropertyValue("--fa-gold").trim() || gold;
    };

    const clocks = () => {
      const cap = document.getElementById("capability");
      const ifc = document.getElementById("the-interface");
      if (!cap || !ifc) return null;
      let next = ifc.nextElementSibling as HTMLElement | null;
      while (next && !next.hasAttribute("data-arc-beat")) next = next.nextElementSibling as HTMLElement | null;
      const rc = cap.getBoundingClientRect();
      const ri = ifc.getBoundingClientRect();
      const rn = next?.getBoundingClientRect();
      const up = cap.hasAttribute("data-uxm-active") || ifc.hasAttribute("data-uxm-active");
      const a = ri.top - rc.top > 0 ? -rc.top / (ri.top - rc.top) : 0;
      const b = rn && rn.top - ri.top > 0 ? -ri.top / (rn.top - ri.top) : 0;
      return { up, a, b };
    };

    const frame = (now: number) => {
      const c = clocks();
      if (!c) return;
      root.toggleAttribute("data-fa-up", c.up);
      if (!c.up) return;
      const ph = c.b > 0 ? 1 : 0;
      if (ph !== phase && eyebrowRef.current) {
        phase = ph;
        eyebrowRef.current.textContent = "";
        queueScramble(jobs, eyebrowRef.current, eyebrows[ph], performance.now() / 1000);
        if (!scrambleRaf) scrambleRaf = requestAnimationFrame(tick);
      }
      const poses = sheetPoses(n, c.a, Math.max(0, c.b));
      poses.forEach((p, i) => {
        const g = sheetRefs.current[i];
        const gh = ghostRefs.current[i];
        if (!g || !gh) return;
        g.setAttribute("transform", mat(p.m));
        g.style.visibility = p.shown ? "" : "hidden";
        // The ghosts: the same outline a little behind, for depth.
        const back: M6 = [p.m[0], p.m[1], p.m[2], p.m[3], p.m[4] + 6, p.m[5] - 4];
        gh.setAttribute("transform", mat(back));
        gh.style.visibility = p.shown ? "" : "hidden";
      });
      const f = c.b > 0 ? -1 : poses.findIndex((p) => p.facing);
      root.toggleAttribute("data-fa-facing", f >= 0);
      if (f !== facingIdx) {
        facingIdx = f;
        const card = cards[f];
        if (card && titleRef.current && lineRef.current && yearRef.current) {
          yearRef.current.textContent = `${String(f + 1).padStart(2, "0")} · ${card.year}`;
          lineRef.current.textContent = card.caption;
          titleRef.current.textContent = "";
          queueScramble(jobs, titleRef.current, card.title, performance.now() / 1000);
          if (!scrambleRaf) scrambleRaf = requestAnimationFrame(tick);
        }
      }
      // The second beat: the mind and its tendrils.
      const b = Math.max(0, c.b);
      root.toggleAttribute("data-fa-mind", b > 0.5);
      root.toggleAttribute("data-fa-plates", b > 0.38);
      const k = canvas.width / VB.w;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (b <= 0.36) return;
      const assemble = (b - 0.36) / 0.3;
      for (const d of dots) {
        const t = smooth((assemble - d.delay * 0.6) / 0.6);
        if (t <= 0) continue;
        const x = d.sx + (d.x - d.sx) * t;
        const y = d.sy + (d.y - d.sy) * t;
        const lit = d.trace && t >= 1;
        ctx.globalAlpha = Math.max(0.12, Math.min(1, 0.35 + 0.6 * d.front)) * (lit ? 1 : 0.75) * Math.min(1, t * 1.4);
        ctx.fillStyle = lit ? gold : ink;
        const s = (lit ? 2.2 : 1.4) * dpr;
        ctx.fillRect(x * k - s / 2, y * k - s / 2, s, s);
      }
      // Tendrils grow down from the mind, then carry pulses: the commands.
      const grow = smooth((b - 0.62) / 0.2);
      if (grow > 0) {
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = gold;
        ctx.lineWidth = 1 * dpr;
        wires.forEach((pts, i) => {
          const upto = Math.max(1, Math.floor(grow * (pts.length - 1)));
          ctx.beginPath();
          ctx.setLineDash([4 * dpr, 4 * dpr]);
          ctx.moveTo(pts[0].x * k, pts[0].y * k);
          for (let j = 1; j <= upto; j++) ctx.lineTo(pts[j].x * k, pts[j].y * k);
          ctx.stroke();
          ctx.setLineDash([]);
          if (grow >= 1) {
            // A socket where it plugs in, and two pulses running down.
            const end = pts[pts.length - 1];
            ctx.fillStyle = gold;
            ctx.fillRect(end.x * k - 3 * dpr, end.y * k - 3 * dpr, 6 * dpr, 6 * dpr);
            for (const off of [0, 0.5]) {
              const t = (now / 1800 + i * 0.17 + off) % 1;
              const q = pts[Math.floor(t * (pts.length - 1))];
              ctx.fillRect(q.x * k - 2 * dpr, q.y * k - 2 * dpr, 4 * dpr, 4 * dpr);
            }
          }
        });
      }
      ctx.globalAlpha = 1;
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
  }, [cards, n, eyebrows]);

  return (
    <div ref={rootRef} className="fa" aria-hidden="true">
      <div className="fa__box">
        <svg className="fa__svg" viewBox={`0 0 ${VB.w} ${VB.h}`}>
          <defs>
            <clipPath id="fa-cut">
              <path d={chamfer} />
            </clipPath>
          </defs>
          {cards.map((c, i) => (
            <g key={`g${c.id}`} ref={(el) => void (ghostRefs.current[i] = el)} className="fa__ghost">
              <path d={chamfer} />
            </g>
          ))}
          {cards.map((c, i) => (
            <g key={c.id} ref={(el) => void (sheetRefs.current[i] = el)} className="fa__sheet" data-kind={c.kind}>
              <path className="fa__ground" d={chamfer} />
              <g clipPath="url(#fa-cut)">
                {c.media?.type === "image" ? (
                  <image href={c.media.src} x="0" y="0" width={W} height={H} preserveAspectRatio="xMidYMid slice" />
                ) : null}
                {c.media?.type === "video" ? (
                  <foreignObject x="0" y="0" width={W} height={H}>
                    <video className="fa__video" src={c.media.src} poster={c.media.poster} muted loop autoPlay playsInline preload="metadata" />
                  </foreignObject>
                ) : null}
                {c.kind === "worlds" ? <WorldsPlaceholder /> : null}
                {c.kind === "mathematics" ? <ProofTree /> : null}
              </g>
              <path className="fa__edge" d={chamfer} />
              {[
                [0, 0],
                [W, H],
                [0, H],
              ].map(([x, y], k) => (
                <path key={k} className="fa__cross" d={`M${x - 7} ${y} L${x + 7} ${y} M${x} ${y - 7} L${x} ${y + 7}`} />
              ))}
              <text className="fa__tag" x="14" y="24">
                {String(i + 1).padStart(2, "0")} · {c.kind.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
        <canvas ref={canvasRef} className="fa__dots" />
        <p className="arc-inter__marks fa__marks">
          <i className="arc-inter__x arc-inter__x--origin" />
          <span className="arc-inter__mrule" />
          <span ref={eyebrowRef} className="arc-desig" />
          <span className="arc-inter__mrule" />
          <i className="arc-inter__x arc-inter__x--close" />
        </p>
        <div className="fa__words" style={pct(600, 535)}>
          <span ref={yearRef} className="fa__year" />
          <h3 ref={titleRef} className="fa__title" />
          <p ref={lineRef} className="fa__line" />
        </div>
        {cards.map((c, i) => (
          <span key={c.id} className="fa__plate" style={pct(plateLabel(i).x - 14, plateLabel(i).y)}>
            {String(i + 1).padStart(2, "0")} · {c.title}
          </span>
        ))}
        <span className="fa__mind" style={pct(mindLabel(n).x, mindLabel(n).y)}>
          <span className="fa__mind-name">{mind.mind}</span>
          {mind.line}
        </span>
      </div>
    </div>
  );
}

/** Game worlds built from assets: a placeholder until the owner's video. */
function WorldsPlaceholder() {
  const lines = [];
  for (let x = 0; x <= W; x += 28) lines.push(`M${x} 0 L${x} ${H}`);
  for (let y = 0; y <= H; y += 28) lines.push(`M0 ${y} L${W} ${y}`);
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
