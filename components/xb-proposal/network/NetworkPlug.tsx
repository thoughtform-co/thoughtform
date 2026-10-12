"use client";

/* The stack plugs in (owner, 2026-10-12): after "Embed, encode, run." the
   closed stack of three plates turns to face the reader, and the module it
   becomes wires out to the five creative workstreams. The first one lights
   with Thoughtform beside it; by the last frame all five are run by the team.

   One camera, one object. The plates are the steps section's own (8 units
   square, team green, layer gold, agents dawn, the closed stack's spacing at
   the same unit), projected by a true orthographic camera whose yaw and pitch
   run from the isometric (45°, 35.26°: exactly the kit's `makeIso`) to 0, so
   the turn is a rotation, never a crossfade. As it turns the plates thicken
   into the three courses of one module, which then rises to its seat.

   The wires leave the module's front edges computed from the same camera at
   rest, so every line starts and ends on the edge it names. Line work is SVG
   in a 1200 × 520 frame; every word is DOM seated in percent of the same
   frame and sized in `cqw` of it, so type and drawing scale together. One
   scroll reader; reduced motion reads the last frame. */

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { MastheadTitle } from "../Masthead";

export type NetLayout = "bus" | "hub" | "spine";

const W = 1200;
const H = 520;
const S = 8;
/* The steps section's unit (u 26): the stack arrives at the size it left. */
const SCALE = 26;
const ISO_YAW = Math.PI / 4;
const ISO_PITCH = Math.atan(1 / Math.SQRT2); // 35.26°
/* The closed stack's spacing there (72 drawing px), and the module's. */
const GAP0 = 72 / 26;
const H0 = 0.4;
const GAP1 = 1.24;
const H1 = 1.0;
const CENTRE: P = [600, 250];
/* The module at rest is drawn larger than the stack it turned from: it is
   the subject of this frame. */
const ZOOM = 1.35;

const GREEN = "var(--xn-green)";
const GOLD = "var(--xb-gold)";
const DAWN = "var(--xb-text)";
const TONES = [GREEN, GOLD, DAWN] as const;
const COURSE = ["Your team", "The layer", "Your agents"] as const;

const TITLE = ["Every workstream,", "run by your team."] as const;

/* The five workstreams, in the order they plug in. */
const STREAMS = ["Production", "Ops", "Review", "Strategy", "Technology"] as const;
const FIRST = "With Thoughtform";
const OWNED = "Run by your team";

const NODE_W = 200;
const NODE_H = 88;

type P = [number, number];
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (t: number) => {
  const c = clamp01(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f = (n: number) => n.toFixed(1);
const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(5), "--py": (y / H).toFixed(5) }) as CSSProperties;

/* ── the camera ────────────────────────────────────────────────────────── */

type Cam = { yaw: number; pitch: number; cx: number; cy: number; zc: number; k: number };

function project(c: Cam, x: number, y: number, z: number): P {
  const X = x - S / 2;
  const Y = y - S / 2;
  const Z = z - c.zc;
  const cy = Math.cos(c.yaw);
  const sy = Math.sin(c.yaw);
  const u = SCALE * c.k;
  return [
    c.cx + u * (X * cy - Y * sy),
    c.cy + u * ((X * sy + Y * cy) * Math.sin(c.pitch) - Z * Math.cos(c.pitch)),
  ];
}
const poly = (list: P[]) => list.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

/** The courses at turn `e`: each plate's top z, its thickness, the centre. */
function courses(e: number) {
  const g = lerp(GAP0, GAP1, e);
  const h = lerp(H0, H1, e);
  return { h, tops: [0, -g, -2 * g], zc: (-2 * g - h) / 2 };
}

type ModBox = { l: number; r: number; t: number; b: number; mid: number; rows: number[] };

/** The module's front at rest, from the same camera the turn ends on. */
function restBox(seat: P): ModBox {
  const { tops, h, zc } = courses(1);
  const cam: Cam = { yaw: 0, pitch: 0, cx: seat[0], cy: seat[1], zc, k: ZOOM };
  const [l, t] = project(cam, 0, S, tops[0]);
  const [r, b] = project(cam, S, S, tops[2] - h);
  const rows = tops.map((z) => project(cam, 0, S, z - h / 2)[1]);
  return { l, r, t, b, mid: rows[1], rows };
}

/* ── the layouts: the module's seat, the nodes, the wires ─────────────── */

type Node = { x: number; y: number };
type Layout = { seat: P; nodes: Node[]; wires: (m: ModBox, nodes: Node[]) => string[] };

const LAYOUTS: Record<NetLayout, Layout> = {
  /* A: the module above, one bus under it, the five in a row */
  bus: {
    seat: [600, 132],
    nodes: (() => {
      const gap = 20;
      const x0 = (W - (5 * NODE_W + 4 * gap)) / 2;
      const row = [0, 1, 2, 3, 4].map((i) => ({ x: x0 + i * (NODE_W + gap), y: 392 }));
      /* production under the module, the rest outward */
      return [row[2], row[1], row[3], row[0], row[4]];
    })(),
    wires: (m, nodes) => nodes.map((n) => `M600 ${f(m.b)}V300H${f(n.x + NODE_W / 2)}V${f(n.y)}`),
  },
  /* B: the module at the centre, two either side, one under */
  hub: {
    seat: [600, 220],
    nodes: [
      { x: 40, y: 96 },
      { x: W - 40 - NODE_W, y: 96 },
      { x: 40, y: 300 },
      { x: W - 40 - NODE_W, y: 300 },
      { x: 600 - NODE_W / 2, y: 412 },
    ],
    wires: (m, nodes) =>
      nodes.map((n, i) => {
        const ny = n.y + NODE_H / 2;
        if (i === 4) return `M600 ${f(m.b)}V${f(n.y)}`;
        if (n.x < 600) return `M${f(m.l)} ${f(m.mid)}H330V${f(ny)}H${f(n.x + NODE_W)}`;
        return `M${f(m.r)} ${f(m.mid)}H870V${f(ny)}H${f(n.x)}`;
      }),
  },
  /* C: the module at the left, one spine, the five branching off it */
  spine: {
    seat: [160, 260],
    nodes: [440, 595, 750, 905, 1060].map((cx, i) => ({
      x: cx - NODE_W / 2,
      y: i % 2 ? 330 : 102,
    })),
    wires: (m, nodes) =>
      nodes.map((n) => {
        const cx = n.x + NODE_W / 2;
        const end = n.y > 260 ? n.y : n.y + NODE_H;
        return `M${f(m.r)} ${f(m.mid)}H${f(cx)}V${f(end)}`;
      }),
  },
};

/* ── the moment ────────────────────────────────────────────────────────── */

const WIRE_AT = 0.42;
const WIRE_STEP = 0.07;
const WIRE_LEN = 0.11;
function moment(p: number) {
  return {
    turn: ease(seg(p, 0.02, 0.3)),
    rise: ease(seg(p, 0.3, 0.4)),
    ports: seg(p, 0.38, 0.42),
    wire: (i: number) => ease(seg(p, WIRE_AT + i * WIRE_STEP, WIRE_AT + i * WIRE_STEP + WIRE_LEN)),
    on: (i: number) => p >= WIRE_AT + i * WIRE_STEP + WIRE_LEN - 0.005,
    handed: p >= 0.9,
  };
}

/* ── the drawing ───────────────────────────────────────────────────────── */

function Module({ seat, e }: { seat: P; e: number }) {
  const { tops, h, zc } = courses(e);
  const cam: Cam = {
    yaw: lerp(ISO_YAW, 0, e),
    pitch: lerp(ISO_PITCH, 0, e),
    cx: seat[0],
    cy: seat[1],
    zc,
    k: lerp(1, ZOOM, e),
  };
  const pr = (x: number, y: number, z: number) => project(cam, x, y, z);
  const topFade = 1 - seg(e, 0.5, 0.9);
  /* painted bottom plate first: the upper plate sits in front */
  return (
    <g>
      {[2, 1, 0].map((i) => {
        const z1 = tops[i];
        const z0 = z1 - h;
        const tone = TONES[i];
        const quad = (x0: number, y0: number, x1: number, y1: number) =>
          poly([pr(x0, y0, z1), pr(x1, y0, z1), pr(x1, y1, z1), pr(x0, y1, z1)]);
        const [fr] = pr(S, S, z1);
        const fy = pr(S, S, z1 - h / 2)[1];
        return (
          <g key={i} stroke={tone} strokeWidth={1}>
            <polygon
              className="xn-face"
              points={poly([pr(S, 0, z1), pr(S, S, z1), pr(S, S, z0), pr(S, 0, z0)])}
            />
            <polygon className="xn-top" points={quad(0, 0, S, S)} />
            {topFade > 0.01 && (
              <g opacity={topFade} fill="none">
                {i === 0 &&
                  [
                    [1.6, 0.6],
                    [4.6, 1.9],
                    [1.6, 3.8],
                    [4.6, 5.0],
                  ].map(([x, y]) => (
                    <polygon key={`${x}${y}`} points={quad(x, y, x + 2.6, y + 2.6)} />
                  ))}
                {i === 1 &&
                  [2.25, 2.8, 3.35].map((r, k) => (
                    <polygon
                      key={r}
                      strokeOpacity={k === 1 ? 0.85 : 0.4}
                      strokeDasharray={k === 2 ? "2 4" : undefined}
                      points={poly(
                        Array.from({ length: 64 }, (_, a) => {
                          const t = (a / 64) * Math.PI * 2;
                          return pr(S / 2 + r * Math.cos(t), S / 2 + r * Math.sin(t), z1);
                        })
                      )}
                    />
                  ))}
                {i === 2 && (
                  <>
                    <polygon points={quad(3, 3, 5, 5)} />
                    {[
                      [0.7, 0.7],
                      [5.4, 1.4],
                      [0.9, 5.5],
                      [5.7, 5.6],
                    ].map(([x, y]) => (
                      <polygon
                        key={`${x}${y}`}
                        points={quad(x, y, x + 1.4, y + 1.4)}
                        strokeOpacity={0.6}
                      />
                    ))}
                  </>
                )}
              </g>
            )}
            <polygon
              className="xn-face"
              points={poly([pr(0, S, z1), pr(S, S, z1), pr(S, S, z0), pr(0, S, z0)])}
            />
            {/* the course's own lamp, on the front's right end */}
            <line x1={fr - 30} x2={fr - 12} y1={fy} y2={fy} strokeOpacity={seg(e, 0.75, 1) * 0.8} />
          </g>
        );
      })}
    </g>
  );
}

function Stack3({ x, y }: { x: number; y: number }) {
  return (
    <g className="xn-mini">
      {TONES.map((t, i) => (
        <rect key={i} x={x} y={y + i * 8} width={22} height={4} fill={t} />
      ))}
    </g>
  );
}

export function NetworkPlug({ layout: fixed = "hub" }: { layout?: NetLayout }) {
  const runway = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [layout, setLayout] = useState<NetLayout>(fixed);

  /* `?net=bus|hub|spine` and `?netp=0..1` pin a layout and a moment, for
     stills; reduced motion reads the last frame. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("net");
    if (v === "bus" || v === "hub" || v === "spine") setLayout(v);
    const fp = q.get("netp");
    if (fp !== null) {
      setP(clamp01(Number(fp)));
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      return;
    }
    const el = runway.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      setP(clamp01(-r.top / Math.max(1, r.height - vh)));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const L = LAYOUTS[layout];
  const m = restBox(L.seat);
  const wires = L.wires(m, L.nodes);
  const st = moment(p);
  const seat: P = [lerp(CENTRE[0], L.seat[0], st.rise), lerp(CENTRE[1], L.seat[1], st.rise)];
  const dy = seat[1] - L.seat[1];
  const dx = seat[0] - L.seat[0];
  const labels = seg(p, 0.3, 0.36);

  return (
    <div className="xn" ref={runway} data-layout={layout}>
      <div className="xn-pin">
        <MastheadTitle lines={TITLE} />
        <div className="xn-fig">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="xn-svg"
            role="img"
            aria-label="The stack of three plates turns to face the reader and becomes one module, which wires out to five creative workstreams: production, ops, review, strategy and technology. Production plugs in first, with Thoughtform; by the end all five are run by the team."
          >
            {/* the tracks the wires will run, faint from the start */}
            {wires.map((d, i) => (
              <path key={`t${i}`} d={d} className="xn-track" />
            ))}
            {wires.map((d, i) => (
              <path
                key={`w${i}`}
                d={d}
                pathLength={1}
                className="xn-wire"
                style={{ strokeDashoffset: 1 - st.wire(i) }}
              />
            ))}
            {L.nodes.map((n, i) => (
              <g
                key={STREAMS[i]}
                className="xn-node"
                data-on={st.on(i) ? "" : undefined}
                data-first={i === 0 && st.on(0) && !st.handed ? "" : undefined}
              >
                <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} className="xn-card" />
                <line x1={n.x} x2={n.x + NODE_W} y1={n.y + 58} y2={n.y + 58} className="xn-rule" />
                <Stack3 x={n.x + 16} y={n.y + 19} />
              </g>
            ))}
            <Module seat={seat} e={st.turn} />
            <g className="xn-ports" opacity={st.ports}>
              {wires.map((d, i) => {
                const [, x, y] = /^M([\d.]+) ([\d.]+)/.exec(d)!;
                return <rect key={i} x={+x - 3} y={+y - 3} width={6} height={6} />;
              })}
            </g>
          </svg>

          {/* every word, seated in the frame */}
          <div className="xn-words">
            {COURSE.map((c, i) => (
              <span
                key={c}
                className="xn-course"
                data-tone={i}
                style={{ ...at(m.l + 16 + dx, m.rows[i] + dy), opacity: labels }}
              >
                {c}
              </span>
            ))}
            {L.nodes.map((n, i) => {
              const on = st.on(i);
              return (
                <div
                  key={STREAMS[i]}
                  className="xn-label"
                  data-on={on ? "" : undefined}
                  data-first={i === 0 && on && !st.handed ? "" : undefined}
                  style={at(n.x + 52, n.y + 15)}
                >
                  <span className="xn-kick">Creative</span>
                  <span className="xn-name">{STREAMS[i]}</span>
                </div>
              );
            })}
            {L.nodes.map((n, i) => {
              const on = st.on(i);
              return (
                <span
                  key={`s${i}`}
                  className="xn-status"
                  data-first={i === 0 && on && !st.handed ? "" : undefined}
                  style={{ ...at(n.x + 16, n.y + 73), opacity: on ? 1 : 0 }}
                >
                  {i === 0 && !st.handed ? FIRST : OWNED}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
