"use client";

/* Embed · encode · run, as one exploded stack read on the scroll (owner,
   2026-10-12, after griffin.com: "as you scroll through it, you can see
   different parts appear and are being explained … 1. We embed in your team
   using the stack that you have. 2. We encode their ways of working into a
   machine-readable layer, making them self-sufficient. 3. People can run
   their own agent").

   Griffin's grammar: a pinned stage. Left, a step rail: the open step is
   centred and spelled out, the passed ones sit collapsed above it, the next
   ones below. Right, one isometric stack, compact at first, then exploded,
   travelling so the open step's plate sits in the middle, lit, with dotted
   callouts on leaders; the other plates dim.

   Top to bottom is upstream to downstream: your teams (green, people), the
   layer (gold, the kit's own LayerSlab with the mark etched on it), your
   agents (dawn, what runs). One scroll reader, rAF-throttled, writing
   transforms and attributes; React re-renders only when the step changes.
   Under reduced motion the section reads as three plain steps. */

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { GLYPH, type GlyphName } from "../glyphs";
import { boxFaces, clamp01, ease, makeIso, tint, type Box } from "../iso";
import { LayerSlab } from "../LayerSlab";
import { PLUG_STEPS, stepAnchor } from "../plugSteps";

const VB_W = 700;
const VB_H = 940;
const U = 26;
const OX = 350;
const OY = 70;
const iso = makeIso(U, OX, OY);
/* A plate's footprint and the screen height of its top face's centre. */
const S = 8;
const FACE_MID = OY + S * 0.5 * U;
const GAP = { compact: 70, open: 300 };

const GOLD = "var(--xb-gold)";
const GREEN = "var(--es-green)";
const DAWN = "var(--xb-text)";

type Step = 0 | 1 | 2 | 3;

/* The names and tones are the plug flow's (`PLUG_STEPS`, one record); only
   the explanation lives here. */
const BODY: Record<(typeof PLUG_STEPS)[number]["id"], string> = {
  embed:
    "Thoughtform works inside your four creative workstreams, on real briefs, statics and reviews, in the Claude Enterprise and the tools you already have.",
  encode:
    "How each team works is written into a layer an agent can read: the context, the skills, the evals. Your team writes it with Thoughtform and keeps it after, self-sufficient.",
  run: "Each person runs their own agents on that layer, in the tools they work in. The team reviews what comes back and spends its time upstream.",
};
const STEPS = PLUG_STEPS.map((st) => ({
  id: st.id,
  key: st.key,
  title: st.step,
  tone: st.tone,
  body: BODY[st.id],
}));
/* Where each step is fully open on the runway (the scroll fraction), for its
   anchor: the plug flow's step links land here. */
const STEP_AT = [0.33, 0.6, 0.88];

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

const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** The scroll's reading: which step is open, how far the stack has
    exploded, and which plate sits at the middle (continuous). */
function read(p: number): { step: Step; gap: number; centre: number } {
  const step: Step = p < 0.2 ? 0 : p < 0.47 ? 1 : p < 0.73 ? 2 : 3;
  const open = ease(seg(p, 0.08, 0.24));
  const gap = GAP.compact + (GAP.open - GAP.compact) * open;
  const centre = 1 - open + ease(seg(p, 0.42, 0.52)) + ease(seg(p, 0.68, 0.78));
  return { step, gap, centre };
}

export function EmbedStack() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const plates = useRef<(SVGGElement | null)[]>([]);
  const [step, setStep] = useState<Step>(0);
  const stepRef = useRef<Step>(0);

  useEffect(() => {
    const el = root.current;
    const s = svg.current;
    if (!el || !s) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.setAttribute("data-static", "");
      return;
    }
    let raf = 0;
    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      const { step: st, gap, centre } = read(p);
      plates.current.forEach((g, i) =>
        g?.setAttribute("transform", `translate(0 ${(i * gap).toFixed(1)})`)
      );
      const col = s.parentElement!.getBoundingClientRect();
      const k = col.width / VB_W;
      const ty = col.height / 2 - k * (FACE_MID + centre * gap);
      s.style.transform = `translateY(${ty.toFixed(1)}px)`;
      el.style.setProperty("--es-fill", String(p));
      if (st !== stepRef.current) {
        stepRef.current = st;
        setStep(st);
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frame();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const past = step === 0 ? [] : STEPS.slice(0, step - 1).map((s, i) => ({ s, i }));
  const next = STEPS.map((s, i) => ({ s, i })).slice(step);

  return (
    <div className="es" ref={root} data-step={step}>
      {/* one anchor per step on the runway, for the plug flow's links */}
      {STEPS.map((st, i) => (
        <span
          key={st.id}
          id={stepAnchor(st.id)}
          className="es-anchor"
          style={{ "--at": STEP_AT[i] } as CSSProperties}
          aria-hidden
        />
      ))}
      <div className="es-pin">
        <div className="es-left">
          <span className="es-rail" aria-hidden />
          <div className="es-past">
            {past.map(({ s, i }) => (
              <div key={s.key} className="es-row" data-tone={s.tone}>
                <span className="es-node" />
                <span className="es-n">0{i + 1}</span> {s.title.toUpperCase()} ·{" "}
                {s.key.toUpperCase()}
              </div>
            ))}
          </div>

          <div className="es-open" key={step}>
            {step === 0 ? (
              <>
                <div className="xb-eyebrow">The flow, step by step</div>
                <h2 className="xb-title">
                  Embed, encode,
                  <br />
                  <span>run.</span>
                </h2>
                <p className="xb-body es-body">
                  The three parts of the flow above, one at a time: your teams, the layer, your
                  agents.
                </p>
              </>
            ) : (
              <div className="es-step" data-tone={STEPS[step - 1].tone}>
                <span className="es-node es-node--open" />
                <div className="es-key">
                  <span className="es-n">0{step}</span> {STEPS[step - 1].key.toUpperCase()}
                </div>
                <h3 className="es-title">{STEPS[step - 1].title}</h3>
                <p className="xb-body es-body">{STEPS[step - 1].body}</p>
              </div>
            )}
          </div>

          <div className="es-next">
            {(step === 0 ? STEPS.map((s, i) => ({ s, i })) : next).map(({ s, i }) => (
              <div key={s.key} className="es-row" data-tone={s.tone}>
                <span className="es-node" />
                <span className="es-n">0{i + 1}</span> {s.title.toUpperCase()} ·{" "}
                {s.key.toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <div className="es-right">
          <svg
            ref={svg}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="es-svg"
            role="img"
            aria-label="Three plates: your teams, the layer, your agents"
          >
            {/* painted bottom plate first: the upper plate sits in front */}
            {[TeamPlate, LayerPlate, AgentPlate]
              .map((Plate, i) => ({ Plate, i }))
              .reverse()
              .map(({ Plate, i }) => (
                <g
                  key={i}
                  ref={(g) => {
                    plates.current[i] = g;
                  }}
                >
                  <g className="es-plate" data-on={step === 0 || step === i + 1 ? "" : undefined}>
                    <Plate />
                  </g>
                  <g className="es-call" data-on={step === i + 1 ? "" : undefined}>
                    <Callouts i={i} />
                  </g>
                </g>
              ))}
          </svg>
        </div>
      </div>

      {/* reduced motion and no JS: the three steps, plainly */}
      <ol className="es-plain">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <span className="es-n">0{i + 1}</span> {s.key} · <strong>{s.title}</strong>. {s.body}
          </li>
        ))}
      </ol>
    </div>
  );
}
