"use client";

/* Embed · encode · run, read the way unsiloed.ai's "how it works" reads
   (owner, 2026-10-12): the three steps listed and sticky on the left, the
   one in view in full ink; the drawing on the right. Then, the same day:
   "the distance between the elements on the right is too long … by the end,
   when you enter 'Run your own agents', they're all stacked together."

   So the drawing is one pinned stage: the three plates start apart, the one
   in view centred and lit with its callouts, and they close into a single
   stack as Run arrives, the whole stack lit. No caption over the plates
   (owner: "it's really creating dead space"); the stage is never clipped or
   faded, a plate leaves only by the frame's bottom edge, and the steps sit
   in the stage's vertical middle, level with the plate in view. Top to
   bottom is upstream to
   downstream: your team (green, people), the layer (gold, the kit's own
   LayerSlab, the mark etched on it), your agents (dawn, what runs).

   The instrument's anatomy (instrument-grammar.md), in the isometric plane:
   the agents' plate is a minimal circuit board, one chip, four ribbons on
   45° jogs to four module plates, never a row of play buttons. The plates
   carry no notch (owner: it read as "cutting off").

   One scroll reader (rAF-throttled) writes the plates' offsets and the
   stage's translate; React re-renders only when the step changes. Reduced
   motion reads the closed stack, every step and caption listed. */

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";

import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { GLYPH, type GlyphName } from "../glyphs";
import { clamp01, ease, makeIso, tint, type Box } from "../iso";
import { LayerSlab } from "../LayerSlab";
import { Masthead, type MastheadCopy } from "../Masthead";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

import { PLUG_STEPS, stepAnchor } from "../plugSteps";
import { arrivalQ, arrive as arriveAt, HERO_BOX, poseIn, STACK } from "../stack/travel";

const VB_W = 700;
const VB_H = 760;
const U = 26;
const OX = 350;
const OY = 70;
const iso = makeIso(U, OX, OY);
const S = 8;
/* No notch on these plates (owner, 2026-10-12: the notched corners read as
   "cutting off"). `NotchedBox` keeps the parameter, at 0. */
const NOTCH = 0;
const FACE_MID = OY + S * 0.5 * U;
/* The plates' spacing: apart while a step is read (room enough that the
   next plate rises in from below the frame, owner: "it should never be cut
   off"), closed at Run. The open gap is a CEILING: on a short stage it
   shrinks to what fits above the centred plate, never below `min`. */
export const GAP = { open: 300, min: 170, closed: 72 };
/* The highest ink on a plate (the team plate's upper callout) and the air
   kept between it and the stage's top edge, both in drawing units. Nothing
   rises past that line (owner, 2026-10-12: the steps sit in the middle "so
   we don't have to fade out the top visualization"), so the stage needs no
   mask: a plate leaves only by the frame's bottom edge. */
export const INK_TOP = 44;
export const AIR = 16;

const GOLD = "var(--xb-gold)";
const GREEN = "var(--es-green)";
const DAWN = "var(--xb-text)";

const HEAD: MastheadCopy = {
  lines: ["Navigate, encode,", "build."],
  brief:
    "Your team learns Claude on its own work with Thoughtform, writes down how it works into a layer it owns, and hands that to its own agents.",
  survey: {
    title: "XB / STEPS · 02",
    brief: "XB / BRIEF · 02",
    state: "Live",
    titleCoord: "0120 / 1180",
    briefCoord: "1460 / 1180",
  },
};

/* The house's own page (the cases page, 2026-10-19) letters the same
   section for no client: its survey marks are the house's, and the first
   step names no count of workstreams. */
const HEAD_HOUSE: MastheadCopy = {
  ...HEAD,
  survey: { ...HEAD.survey, title: "TF / STEPS · 02", brief: "TF / BRIEF · 02" },
};

type StepId = (typeof PLUG_STEPS)[number]["id"];
const LINE: Record<StepId, string> = {
  embed: "Learn with Claude in your own work.",
  encode: "Write down how it works.",
  run: "Hand it to your own agents.",
};
/* One sentence under each step, open under the step in view (owner,
   2026-10-12: "one sentence of explanation … revealed and then collapse
   open when you scroll through it"). Reduced motion lists all three open. */
const BODY: Record<StepId, string> = {
  embed:
    "Thoughtform works inside your four creative workstreams while the team uses Claude on real briefs.",
  encode:
    "How each team works is written into a layer an agent can read: the context, the skills and the evals.",
  run: "Each person hands the work to their own agents on that layer, and the team reviews what comes back.",
};
const BODY_HOUSE: Record<StepId, string> = {
  ...BODY,
  embed:
    "Thoughtform works inside your creative workstreams while the team uses Claude on real briefs.",
};

/* ── geometry helpers ──────────────────────────────────────────────────── */

type P = readonly [number, number];
const pts = (list: P[]) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const quad = (x0: number, y0: number, x1: number, y1: number, z: number) =>
  pts([iso.p(x0, y0, z), iso.p(x1, y0, z), iso.p(x1, y1, z), iso.p(x0, y1, z)]);

/** A box, its (x1, y0) corner notched: the house's single TR notch laid in
    the plane. The cut's own face is edge-on here, so the outline carries it. */
function NotchedBox({
  b,
  c = NOTCH,
  stroke,
  side,
  top = "var(--xb-ground)",
}: {
  b: Box;
  c?: number;
  stroke: string;
  side: string;
  top?: string;
}) {
  const p = iso.p;
  const left = pts([
    p(b.x0, b.y1, b.z1),
    p(b.x1, b.y1, b.z1),
    p(b.x1, b.y1, b.z0),
    p(b.x0, b.y1, b.z0),
  ]);
  const right = pts([
    p(b.x1, b.y0 + c, b.z1),
    p(b.x1, b.y1, b.z1),
    p(b.x1, b.y1, b.z0),
    p(b.x1, b.y0 + c, b.z0),
  ]);
  const face = pts([
    p(b.x0, b.y0, b.z1),
    p(b.x1 - c, b.y0, b.z1),
    p(b.x1, b.y0 + c, b.z1),
    p(b.x1, b.y1, b.z1),
    p(b.x0, b.y1, b.z1),
  ]);
  return (
    <g>
      <polygon points={left} fill={side} stroke={stroke} strokeWidth={1} />
      <polygon points={right} fill={side} stroke={stroke} strokeWidth={1} />
      <polygon points={face} fill={top} stroke={stroke} strokeWidth={1} />
    </g>
  );
}

const PLATE: Box = { x0: 0, x1: S, y0: 0, y1: S, z0: 0, z1: 0.4 };

/* ── the three plates, each drawn at z 0 and moved by its group ────────── */

function TeamPlate() {
  const z = PLATE.z1;
  const tiles: { id: GlyphName; x: number; y: number }[] = [
    { id: "strategy", x: 1.6, y: 0.6 },
    { id: "production", x: 4.6, y: 1.9 },
    { id: "review", x: 1.6, y: 3.8 },
    { id: "ops", x: 4.6, y: 5.0 },
  ];
  return (
    <g>
      <NotchedBox b={PLATE} stroke={GREEN} side="var(--xb-ground-2)" />
      {/* the rail of the tools the team already has, along one edge */}
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
            points={quad(t.x, t.y, t.x + 2.6, t.y + 2.6, z)}
            fill={tint("var(--es-green)", 0.12)}
            stroke={GREEN}
          />
          <path
            d={GLYPH[t.id]}
            transform={iso.plane(t.x + 0.6, t.y + 0.6, z, 1.4 / 24)}
            fill="none"
            stroke={GREEN}
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </g>
  );
}

/* The layer's face, after the flow's core above it (owner, 2026-10-12: "add
   some circles, like diagrams, around the brand mark … make it look as if
   the brand mark is engraved in it, with a bit more depth"). Three rings in
   the plane round the mark, the middle one gold with the layer's three parts
   on it (context, skills, evals), the outer one dashed; and the mark CUT into
   the top course: its opening drawn as the lit far wall, its floor one depth
   down and darker, clipped to the opening, so only the wall's upper edge
   shows. The floor darkens toward black in both themes (a recess is a
   shadow either way); the wall is the gold. */
const MARK_H = 3.2;
const CUT = 0.11;
const RINGS = [2.25, 2.8, 3.35] as const;
const PART_DEG = [-140, -38, 62];
const WASH = "var(--gold, #caa554)";

function LayerPlate() {
  const g = { x0: 0, x1: S, y0: 0, y1: S, z0: 0, t: 0.28, gap: 0.12 };
  const top = g.z0 + 2 * (g.t + g.gap) + g.t;
  const mk = BRANDMARK_VIEWBOX;
  const k = MARK_H / mk.h;
  const mx = S / 2 - (mk.w * k) / 2;
  const my = S / 2 - MARK_H / 2;
  const at = (z: number) => iso.plane(mx, my, z, k);
  const clip = `es-cut-${useId().replace(/:/g, "")}`;
  const surface = tint(WASH, 0.28);
  return (
    <g>
      <LayerSlab iso={iso} g={g} />
      {/* the rings, in the plane, round the mark */}
      <g transform={iso.plane(S / 2, S / 2, top, 1)}>
        {RINGS.map((r, i) => (
          <circle
            key={r}
            r={r}
            fill="none"
            stroke={GOLD}
            strokeOpacity={i === 1 ? 0.85 : 0.4}
            strokeDasharray={i === 2 ? "2 4" : undefined}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {PART_DEG.map((d) => {
          const a = (d * Math.PI) / 180;
          return (
            <circle
              key={d}
              cx={RINGS[1] * Math.cos(a)}
              cy={RINGS[1] * Math.sin(a)}
              r={0.12}
              fill={GOLD}
            />
          );
        })}
      </g>
      {/* the mark, cut into the top course */}
      <defs>
        <clipPath id={clip}>
          {BRANDMARK_PATHS.map((d, i) => (
            <path key={i} d={d} transform={at(top)} />
          ))}
        </clipPath>
      </defs>
      <g transform={at(top)}>
        {BRANDMARK_PATHS.map((d, i) => (
          <path key={i} d={d} fill={tint(WASH, 0.72)} />
        ))}
      </g>
      <g clipPath={`url(#${clip})`}>
        <g transform={at(top - CUT)}>
          {BRANDMARK_PATHS.map((d, i) => (
            <path key={i} d={d} fill={`color-mix(in srgb, ${surface} 55%, #000)`} />
          ))}
        </g>
      </g>
      <g transform={at(top)}>
        {BRANDMARK_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.55}
            strokeWidth={0.75}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </g>
  );
}

/** Four parallel wires, one ribbon: along one axis, a 45° jog in the plane,
    then along the other, the instrument's `ribbonPaths` grammar. */
function Ribbon({ from, to, axis }: { from: P; to: P; axis: "x" | "y" }) {
  const z = PLATE.z1;
  const wires = [-0.24, -0.08, 0.08, 0.24];
  return (
    <g>
      {wires.map((o) => {
        const sx = Math.sign(to[0] - from[0]) || 1;
        const sy = Math.sign(to[1] - from[1]) || 1;
        let path: P[];
        if (axis === "x") {
          const [x0, y0] = [from[0], from[1] + o];
          const [x1, y1] = [to[0] + o, to[1]];
          const jog = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5;
          path = [
            [x0, y0],
            [x1 - sx * jog, y0],
            [x1, y0 + sy * jog],
            [x1, y1],
          ];
        } else {
          const [x0, y0] = [from[0] + o, from[1]];
          const [x1, y1] = [to[0], to[1] + o];
          const jog = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5;
          path = [
            [x0, y0],
            [x0, y1 - sy * jog],
            [x0 + sx * jog, y1],
            [x1, y1],
          ];
        }
        const d = path
          .map(([x, y], i) => {
            const [qx, qy] = iso.p(x, y, z);
            return `${i ? "L" : "M"}${qx.toFixed(1)} ${qy.toFixed(1)}`;
          })
          .join("");
        return <path key={o} d={d} fill="none" stroke={DAWN} strokeOpacity={0.6} strokeWidth={1} />;
      })}
    </g>
  );
}

/* The agents' plate: one chip at the centre, four agent modules, each on
   its own ribbon. The chip is notched like every plate; the modules are the
   agents your people run. */
const CHIP: Box = { x0: 3.0, x1: 5.0, y0: 3.0, y1: 5.0, z0: 0.4, z1: 0.75 };
const MODULES: Box[] = [
  { x0: 0.7, x1: 2.1, y0: 0.7, y1: 2.1, z0: 0.4, z1: 0.62 },
  { x0: 5.4, x1: 6.8, y0: 1.4, y1: 2.8, z0: 0.4, z1: 0.62 },
  { x0: 0.9, x1: 2.3, y0: 5.5, y1: 6.9, z0: 0.4, z1: 0.62 },
  { x0: 5.7, x1: 7.1, y0: 5.6, y1: 7.0, z0: 0.4, z1: 0.62 },
];

function AgentPlate() {
  const z = PLATE.z1;
  return (
    <g>
      <NotchedBox b={PLATE} stroke={DAWN} side="var(--xb-ground-2)" />
      {/* ribbons first, so the chip and the modules sit on them */}
      <Ribbon from={[3.0, 3.6]} to={[1.4, 2.1]} axis="x" />
      <Ribbon from={[4.4, 3.0]} to={[5.4, 2.1]} axis="y" />
      <Ribbon from={[3.6, 5.0]} to={[2.3, 6.2]} axis="y" />
      <Ribbon from={[5.0, 4.4]} to={[6.4, 5.6]} axis="x" />
      {/* the chip's pins, a short comb on its two front edges */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = 3.2 + i * 0.32;
        const a = iso.p(5.0, y, z);
        const b = iso.p(5.25, y, z);
        return (
          <line
            key={`p${i}`}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={DAWN}
            strokeOpacity={0.5}
          />
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const x = 3.2 + i * 0.32;
        const a = iso.p(x, 5.0, z);
        const b = iso.p(x, 5.25, z);
        return (
          <line
            key={`q${i}`}
            x1={a[0]}
            y1={a[1]}
            x2={b[0]}
            y2={b[1]}
            stroke={DAWN}
            strokeOpacity={0.5}
          />
        );
      })}
      <NotchedBox b={CHIP} stroke={DAWN} side="var(--xb-ground-2)" />
      <polygon
        points={quad(3.45, 3.45, 4.55, 4.55, CHIP.z1)}
        fill="none"
        stroke={DAWN}
        strokeOpacity={0.5}
      />
      {MODULES.map((m, i) => (
        <g key={i}>
          <NotchedBox b={m} stroke={DAWN} side="var(--xb-ground-2)" />
          <polygon
            points={quad(m.x0 + 0.35, m.y0 + 0.35, m.x1 - 0.35, m.y1 - 0.35, m.z1)}
            fill={tint("var(--xb-text)", 0.1)}
            stroke="none"
          />
        </g>
      ))}
      {/* a row of pads along the front edge, the board's own texture */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = 3.0 + i * 0.36;
        return (
          <polygon
            key={`d${i}`}
            points={quad(x, 7.35, x + 0.2, 7.6, z)}
            fill={DAWN}
            fillOpacity={0.35}
          />
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

export const CALLOUTS: Callout[][] = [
  [
    { side: "l", lines: ["THE STACK", "YOU HAVE"], at: [0.75, 5.6, 0.4], y: 150 },
    { side: "r", lines: ["FOUR", "WORKSTREAMS"], at: [5.9, 3.2, 0.4], y: -10 },
  ],
  [
    { side: "l", lines: ["CONTEXT, SKILLS", "AND EVALS"], at: [0, 6.8, 0.6], y: 168 },
    { side: "r", lines: ["OWNED BY", "YOUR TEAM"], at: [4.6, 4.0, 1.12], y: -10 },
  ],
  [
    { side: "l", lines: ["YOUR OWN", "AGENTS"], at: [1.6, 6.9, 0.62], y: 200 },
    { side: "r", lines: ["REVIEWED BY", "THE TEAM"], at: [7.1, 6.3, 0.62], y: 150 },
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
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/* Where each step reads on the runway (its anchor): Embed at the start,
   Encode at the half, Run with the stack closed at the end. */
export const TRAVEL_END = 0.5;
const STEP_AT = [0, TRAVEL_END, 0.97];

/** The scroll's reading, CONTINUOUS (owner: "the diagrams … should scroll
    into view smoothly … it locks at different scroll positions"): every
    scroll tick moves the plates, with no plateau a reader has to scroll
    through. Two moves, end to end: the stack travels up until the layer is
    centred, then it closes about the layer, which is what brings the agents'
    plate up from the frame's bottom edge. The stack never travels past the
    layer, so the team plate never rises past the stage's top. */
export function read(
  p: number,
  open: number
): { step: 0 | 1 | 2; gap: number; centre: number; stacked: boolean } {
  const centre = seg(p, 0, TRAVEL_END);
  const close = ease(seg(p, TRAVEL_END, 1));
  const gap = open - (open - GAP.closed) * close;
  const step = centre < 0.5 ? 0 : close < 0.5 ? 1 : 2;
  return { step, gap, centre, stacked: close > 0.98 };
}

/* How far into the arrival the stack keeps the donor's lighting (every
   plate lit, no callouts) before it takes this section's own. */
export const ARRIVE_LIT = 0.82;
/* The head's brief rises through the stack's path while the stack travels,
   so on the arrival it comes in late, once the stack has cleared it. */
const BRIEF_IN = 0.78;

/**
 * `arrive` (opt-in, the stack-first page): the stack is handed in from the
 * section above (`StackHero`), closed, and arrives here OPENED, which is this
 * section's own state at the top of its pin (`stack/travel.ts`). Absent, the
 * section is exactly as the proposal ships it.
 */
export function EmbedStack({
  arrive = false,
  house = false,
}: {
  arrive?: boolean;
  /** Lettered for no client (the cases page). */
  house?: boolean;
} = {}) {
  const runway = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const travel = useRef<SVGGElement>(null);
  const plates = useRef<(SVGGElement | null)[]>([]);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [stacked, setStacked] = useState(false);
  const [arriving, setArriving] = useState(false);
  /* Below the frame tier too (owner, 2026-10-21, on a phone): a pinned
     stage of two columns does not fit a phone's screen, so there it reads
     as reduced motion does, the steps listed and the stack closed, with no
     runway and no hand-over (`embed.css` lays it out in one column). */
  const plain = useMediaQuery("(prefers-reduced-motion: reduce), (max-width: 960px)");

  useEffect(() => {
    const el = runway.current;
    const s = svg.current;
    if (!el || !s) return;
    if (plain) {
      plates.current.forEach((g, i) =>
        g?.setAttribute("transform", `translate(0 ${i * GAP.closed})`)
      );
      s.style.transform = "";
      /* and nothing the arrival wrote before the query matched (hydration
         reads it false first): the brief's clock, the donor's hand-over */
      if (arrive) {
        travel.current?.removeAttribute("transform");
        el.parentElement?.style.removeProperty("--es-brief");
        const donor = document.querySelector<HTMLElement>(".sh");
        donor?.removeAttribute("data-handed");
        donor?.style.removeProperty("--sh-away");
      }
      return;
    }
    let raf = 0;
    let last = { step: -1, stacked: false, arriving: false };
    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      const col = s.parentElement!.getBoundingClientRect();
      const k = col.width / VB_W;
      /* half the stage, in drawing units: what the centred layer leaves
         above it for the team plate */
      const room = col.height / (2 * k) - (FACE_MID - INK_TOP) - AIR;
      const open = Math.min(GAP.open, Math.max(GAP.min, room));
      const st = read(p, open);
      /* the plate in view centred, unless that would lift the team plate's
         ink past the stage's top; then the stack sits lower instead */
      const centred = col.height * 0.5 - k * (FACE_MID + st.centre * st.gap);
      const ty = Math.max(centred, k * (AIR - INK_TOP));
      let gap = st.gap;
      if (arrive) {
        /* THE ARRIVAL. While the runway rises through the screen this
           section draws the stack out of its own box, from the donor's seat
           to its own, and the donor's drawing is hidden: two drawings matched
           at the seam, as `NetworkPlug` takes the stack one section later. */
        const q = arrivalQ(r.top, vh);
        const donor = document.querySelector<HTMLElement>(".sh");
        const dsvg = donor?.querySelector<SVGSVGElement>(".sh-svg") ?? null;
        if (q > 0 && q < 1 && donor && dsvg) {
          const d = dsvg.getBoundingClientRect();
          const kH = d.width / HERO_BOX.w;
          /* the donor's seat where it stood when the hand-over began: the
             page has scrolled `vh - r.top` since */
          const from = {
            x: d.left + (STACK.ref[0] - HERO_BOX.x) * kH,
            y: d.top + (vh - r.top) + (STACK.ref[1] - HERO_BOX.y) * kH,
            k: kH,
          };
          /* this section's own seat at the top of its pin */
          const to = {
            x: col.left + STACK.ref[0] * k,
            y: col.top - r.top + ty + STACK.ref[1] * k,
            k,
          };
          const a = arriveAt(q, from, to, open);
          gap = a.gap;
          const pose = poseIn(a.seat, { x: col.left, y: col.top + ty }, k);
          /* on an inner group, never on the svg: `NetworkPlug` reads the
             svg's own width for its scale */
          travel.current?.setAttribute(
            "transform",
            `translate(${pose.tx.toFixed(2)} ${pose.ty.toFixed(2)}) scale(${pose.s.toFixed(4)})`
          );
          donor.setAttribute("data-handed", "");
          /* the arrival's clock, for the donor's own lines: the stack holds
             its place on screen while the page leaves, so they let go at once */
          donor.style.setProperty("--sh-away", q.toFixed(4));
        } else {
          travel.current?.removeAttribute("transform");
          donor?.removeAttribute("data-handed");
          donor?.style.removeProperty("--sh-away");
        }
        const root = el.parentElement;
        if (q < 1) root?.style.setProperty("--es-brief", seg(q, BRIEF_IN, 1).toFixed(3));
        else root?.style.removeProperty("--es-brief");
        const donorLit = q < ARRIVE_LIT;
        if (donorLit !== last.arriving) {
          last.arriving = donorLit;
          setArriving(donorLit);
        }
      }
      plates.current.forEach((g, i) =>
        g?.setAttribute("transform", `translate(0 ${(i * gap).toFixed(1)})`)
      );
      s.style.transform = `translateY(${ty.toFixed(1)}px)`;
      if (st.step !== last.step || st.stacked !== last.stacked) {
        last = { ...last, step: st.step, stacked: st.stacked };
        setStep(st.step);
        setStacked(st.stacked);
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
  }, [plain, arrive]);

  const lit = (i: number) => plain || stacked || arriving || step === i;
  /* painted bottom plate first: the upper plate sits in front */
  const drawn = PLATES.map((Plate, i) => ({ Plate, i }))
    .reverse()
    .map(({ Plate, i }) => (
      <g
        key={i}
        ref={(g) => {
          plates.current[i] = g;
        }}
      >
        <g className="es-plate" data-on={lit(i) ? "" : undefined}>
          <Plate />
        </g>
        <g
          className="es-call"
          data-on={!plain && !arriving && step === i && (i === 2 || !stacked) ? "" : undefined}
        >
          <Callouts i={i} />
        </g>
      </g>
    ));

  return (
    <div className="es" data-plain={plain ? "" : undefined}>
      <div className="es-runway" ref={runway}>
        {/* one anchor per step on the runway, for the flow's labels */}
        {PLUG_STEPS.map((st, i) => (
          <span
            key={st.id}
            id={stepAnchor(st.id)}
            className="es-anchor"
            style={{ "--at": STEP_AT[i] } as CSSProperties}
            aria-hidden
          />
        ))}
        <div className="es-pin">
          {/* the head and the steps hold still through the section (owner:
              "once you enter … the title should remain static") */}
          <Masthead copy={house ? HEAD_HOUSE : HEAD} />
          <div className="es-body">
            <div className="es-left">
              <ol className="es-lines">
                {PLUG_STEPS.map((st, i) => (
                  <li
                    key={st.id}
                    data-on={plain || step === i ? "" : undefined}
                    data-tone={st.tone}
                  >
                    <a href={`#${stepAnchor(st.id)}`}>
                      <span className="es-n">
                        <i aria-hidden />
                        {st.n} · {st.step}
                      </span>
                      <span className="es-line">{LINE[st.id]}</span>
                      <span className="es-say">
                        <span className="es-say__in">{(house ? BODY_HOUSE : BODY)[st.id]}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>

            <div className="es-right">
              <div className="es-stage">
                <svg
                  ref={svg}
                  viewBox={`0 0 ${VB_W} ${VB_H}`}
                  className="es-svg"
                  role="img"
                  aria-label="Three plates closing into one stack: your team, the layer, your agents"
                >
                  {arrive ? <g ref={travel}>{drawn}</g> : drawn}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
