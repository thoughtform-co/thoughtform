"use client";

/* Embed · encode · run, read on the scroll the way unsiloed.ai's "how it
   works" reads (owner, 2026-10-12: "this one is better, where we already show
   the three parts, but then you just scroll through them"). It replaces the
   Griffin pin: no pinned stage, no step rail, no vertical divider.

   Left, all three steps at once, sticky, the one in view in full ink and the
   others receding. Right, one long drawing that scrolls past: each step's
   caption over its plate, the three plates on one gold thread, top to bottom
   upstream to downstream. Your team (green, people), the layer (gold, the
   kit's own LayerSlab with the mark etched on it), your agents (dawn, what
   runs). The plate in view lights and letters its callouts; the others dim.

   One IntersectionObserver picks the step in view (a band at the middle of
   the frame); no scroll listener, no writer. The head is the services
   masthead's grammar, the same as the flow above it. */

import { useEffect, useRef, useState } from "react";

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { GLYPH, type GlyphName } from "../glyphs";
import { boxFaces, makeIso, tint, type Box } from "../iso";
import { LayerSlab } from "../LayerSlab";
import { Masthead, type MastheadCopy } from "../Masthead";
import { PLUG_STEPS, stepAnchor } from "../plugSteps";

const VB_W = 700;
const VB_H = 330;
const U = 26;
const OX = 350;
const OY = 70;
const iso = makeIso(U, OX, OY);
const S = 8;

const GOLD = "var(--xb-gold)";
const GREEN = "var(--es-green)";
const DAWN = "var(--xb-text)";

const HEAD: MastheadCopy = {
  lines: ["Embed, encode,", "run."],
  brief:
    "Thoughtform embeds in your team, encodes how it works into a layer your team owns, and your people run their own agents on it.",
  survey: {
    title: "XB / STEPS · 02",
    brief: "XB / BRIEF · 02",
    state: "Live",
    titleCoord: "0120 / 1180",
    briefCoord: "1460 / 1180",
  },
};

/* The names and tones are the flow's (`PLUG_STEPS`, one record); the line
   and the caption live here. */
const LINE: Record<(typeof PLUG_STEPS)[number]["id"], string> = {
  embed: "Embed in your team.",
  encode: "Encode how it works.",
  run: "Run your own agents.",
};
const BODY: Record<(typeof PLUG_STEPS)[number]["id"], string> = {
  embed:
    "Thoughtform works inside your four creative workstreams, on real briefs, statics and reviews, in the Claude Enterprise and the tools you already have.",
  encode:
    "How each team works is written into a layer an agent can read: the context, the skills, the evals. Your team writes it with Thoughtform and keeps it after, self-sufficient.",
  run: "Each person runs their own agents on that layer, in the tools they work in. The team reviews what comes back and spends its time upstream.",
};

const PLATE: Box = { x0: 0, x1: S, y0: 0, y1: S, z0: 0, z1: 0.4 };

/* ── the three plates, each drawn at z 0 and moved by its group ────────── */

function Slab({ b, stroke, fill }: { b: Box; stroke: string; fill: string }) {
  const f = boxFaces(iso, b);
  return (
    <g>
      <polygon points={f.left} fill={fill} stroke={stroke} strokeWidth={1} />
      <polygon points={f.right} fill={fill} stroke={stroke} strokeWidth={1} />
      <polygon points={f.top} fill="var(--xb-ground)" stroke={stroke} strokeWidth={1} />
    </g>
  );
}

const quad = (x0: number, y0: number, x1: number, y1: number, z: number) =>
  [iso.p(x0, y0, z), iso.p(x1, y0, z), iso.p(x1, y1, z), iso.p(x0, y1, z)]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

function TeamPlate() {
  const z = PLATE.z1;
  const tiles: { id: GlyphName; x: number; y: number }[] = [
    { id: "strategy", x: 1.6, y: 0.5 },
    { id: "production", x: 4.8, y: 0.5 },
    { id: "review", x: 1.6, y: 3.7 },
    { id: "ops", x: 4.8, y: 3.7 },
  ];
  return (
    <g>
      <Slab b={PLATE} stroke={GREEN} fill="var(--xb-ground-2)" />
      {/* the hatched rail along one edge: the tools the team already has */}
      {Array.from({ length: 11 }, (_, i) => {
        const y = 0.5 + i * 0.68;
        const [a, b] = [iso.p(0.35, y, z), iso.p(1.15, y + 0.4, z)];
        return (
          <line
            key={i}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={GREEN}
            strokeOpacity={0.55}
          />
        );
      })}
      <polygon
        points={quad(0.25, 0.3, 1.25, 7.7, z)}
        fill="none"
        stroke={GREEN}
        strokeOpacity={0.7}
      />
      {tiles.map((t) => (
        <g key={t.id}>
          <polygon
            points={quad(t.x, t.y, t.x + 2.8, t.y + 2.8, z)}
            fill={tint("var(--es-green)", 0.12)}
            stroke={GREEN}
          />
          <path
            d={GLYPH[t.id]}
            transform={iso.plane(t.x + 0.7, t.y + 0.7, z, 1.4 / 24)}
            fill="none"
            stroke={GREEN}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
      <polygon
        points={quad(1.6, 7.0, 7.6, 7.6, z)}
        fill="none"
        stroke={GREEN}
        strokeOpacity={0.6}
      />
    </g>
  );
}

function LayerPlate() {
  const g = { x0: 0, x1: S, y0: 0, y1: S, z0: 0, t: 0.28, gap: 0.12 };
  const top = g.z0 + 2 * (g.t + g.gap) + g.t;
  const mk = BRANDMARK_VIEWBOX;
  const k = 3.2 / mk.h;
  return (
    <g>
      <LayerSlab iso={iso} g={g} />
      <g transform={iso.plane(S / 2 - (mk.w * k) / 2, S / 2 - 1.6, top, k)}>
        {BRANDMARK_PATHS.map((d, i) => (
          <path key={i} d={d} fill={GOLD} fillOpacity={0.9} />
        ))}
      </g>
    </g>
  );
}

function AgentPlate() {
  const z = PLATE.z1;
  const bars = [
    [0.8, 4.6],
    [1.5, 3.4],
    [2.2, 5.2],
    [2.9, 2.6],
    [3.6, 4.2],
    [4.3, 3.0],
  ];
  return (
    <g>
      <Slab b={PLATE} stroke={DAWN} fill="var(--xb-ground-2)" />
      {bars.map(([y, len]) => {
        const a = iso.p(0.8, y, z);
        const b = iso.p(0.8 + len, y, z);
        return (
          <line
            key={y}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={DAWN}
            strokeOpacity={0.55}
            strokeWidth={5}
            strokeLinecap="butt"
          />
        );
      })}
      {[0.8, 3.2, 5.6].map((x) => {
        const b: Box = { x0: x, x1: x + 1.8, y0: 5.6, y1: 7.4, z0: z, z1: z + 0.35 };
        const f = boxFaces(iso, b);
        return (
          <g key={x}>
            <polygon points={f.left} fill="var(--xb-ground-2)" stroke={DAWN} />
            <polygon points={f.right} fill="var(--xb-ground-2)" stroke={DAWN} />
            <polygon points={f.top} fill="var(--xb-ground)" stroke={DAWN} />
            <path
              d="M9 7l8 5-8 5z"
              transform={iso.plane(x + 0.3, 5.9, b.z1, 1.2 / 24)}
              fill="none"
              stroke={DAWN}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </g>
  );
}

/* ── callouts: a dot, two mono lines, a leader to the part it names ───── */

type Callout = {
  side: "l" | "r";
  lines: [string, string];
  at: [number, number, number];
  y: number;
};

const CALLOUTS: Callout[][] = [
  [
    { side: "l", lines: ["THE STACK", "YOU HAVE"], at: [0.75, 5.6, 0.4], y: 150 },
    { side: "r", lines: ["FOUR", "WORKSTREAMS"], at: [6.2, 1.9, 0.4], y: -10 },
  ],
  [
    { side: "l", lines: ["CONTEXT, SKILLS", "AND EVALS"], at: [0, 6.8, 0.6], y: 168 },
    { side: "r", lines: ["OWNED BY", "YOUR TEAM"], at: [4.6, 4.0, 1.12], y: -10 },
  ],
  [
    { side: "l", lines: ["YOUR OWN", "AGENTS"], at: [1.7, 6.5, 0.75], y: 210 },
    { side: "r", lines: ["REVIEWED BY", "THE TEAM"], at: [3.4, 1.5, 0.4], y: -10 },
  ],
];
const TONE = [GREEN, GOLD, DAWN];

function Callouts({ i }: { i: number }) {
  return (
    <g className="es-callouts">
      {CALLOUTS[i].map((c) => {
        const [ax, ay] = iso.p(...c.at);
        const ly = OY + c.y;
        const lx = c.side === "l" ? 14 : VB_W - 34;
        const knee = c.side === "l" ? 196 : VB_W - 176;
        return (
          <g key={c.lines.join()}>
            <path
              d={`M${c.side === "l" ? knee - 8 : knee + 8} ${ly - 5}H${ax}V${ay}`}
              fill="none"
              stroke={TONE[i]}
              strokeOpacity={0.55}
            />
            <circle cx={ax} cy={ay} r={2.5} fill={TONE[i]} />
            <rect
              x={c.side === "l" ? lx : lx - 6}
              y={ly - 14}
              width={6}
              height={6}
              fill={TONE[i]}
            />
            {c.lines.map((t, k) => (
              <text
                key={t}
                x={c.side === "l" ? lx + 14 : lx - 14}
                y={ly - 5 + k * 19}
                textAnchor={c.side === "l" ? "start" : "end"}
                className="es-callout"
              >
                {t}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* ── the section ───────────────────────────────────────────────────────── */

const PLATES = [TeamPlate, LayerPlate, AgentPlate];

export function EmbedStack() {
  const parts = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    parts.current.forEach((p) => p && io.observe(p));
    return () => io.disconnect();
  }, []);

  return (
    <div className="es">
      <Masthead copy={HEAD} />
      <div className="es-body">
        <div className="es-left">
          <ol className="es-lines">
            {PLUG_STEPS.map((st, i) => (
              <li key={st.id} data-on={i === active ? "" : undefined} data-tone={st.tone}>
                <a href={`#${stepAnchor(st.id)}`}>
                  <span className="es-n">
                    <i aria-hidden />
                    {st.n} · {st.step}
                  </span>
                  <span className="es-line">{LINE[st.id]}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <div className="es-right">
          <span className="es-thread" aria-hidden />
          {PLUG_STEPS.map((st, i) => {
            const Plate = PLATES[i];
            return (
              <section
                key={st.id}
                id={stepAnchor(st.id)}
                ref={(el) => {
                  parts.current[i] = el;
                }}
                data-i={i}
                data-on={i === active ? "" : undefined}
                className="es-part"
                aria-label={`${st.n} ${st.step}: ${LINE[st.id]}`}
              >
                <p className="es-cap">{BODY[st.id]}</p>
                <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="es-svg" aria-hidden>
                  <g className="es-plate">
                    <Plate />
                  </g>
                  <g className="es-call">
                    <Callouts i={i} />
                  </g>
                </svg>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
