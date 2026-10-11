"use client";

/* Flow · S1 A into P3 B, one pinned section (owner, 2026-10-11: "build a
   flow where we can have elements move from one artifact into the other in
   an elegant way, like a nice keyframe flow"; "yes" to the SVG route).

   Both drawings already live in one isometric world (the kit's `iso.ts`):
   S1 A's assembly and P3 B's board are just two sets of positions for the
   same objects. So the section draws ONE scene, every object carries a
   pose for each keyframe, and scroll interpolates between them:

     K0 → K2   S1 A builds as it does on its own: the team, then the layer
               drawn out of their work, then the layer seated in Claude
               Enterprise beside Shopify and analytics.
     K2 → K3   the same objects travel to P3 B: the four team plates come
               down onto the board as its modules, the three strata press
               into the configuration chip (and the mark is etched in),
               Claude Enterprise's broad board draws in to its block,
               Shopify and analytics rise and stand up as windows, agents
               and models open beside them, and the X-Bionic board, the
               traces and the labels draw in around them.

   The camera is the viewBox, interpolated from S1 A's crop to P3 B's.
   Nothing here is drawn twice: what moves is one element from start to
   finish. Labels are the one thing that hand over by opacity, since a
   label's place in one drawing is not its place in the other. */

import { useEffect, useRef, useState } from "react";

import { OFFER, STRATA, TOOLS, WORKSTREAMS } from "../copy";
import { Stage } from "../Frame";
import { GLYPH } from "../glyphs";
import { boxFaces, C30, ease, lerp, makeIso, tint, type Box, type Pt } from "../iso";
import { EtchedMark } from "../substrate/SubstrateBoardB";

const GOLD = "var(--gold-line, #caa554)";
const WASH = "var(--gold, #caa554)";
const TEXT = "rgb(var(--dawn-rgb, 235, 227, 214))";

/* One camera for the whole flow: S1 A's scale (23px a unit), origin 0. P3 B
   was drawn at 31px a unit, so its fixed offsets and type scale by S. */
const U = 23;
const S = 23 / 31;
const iso = makeIso(U, 0, 0);

/* the two crops, in this camera: S1 A's ink and P3 B's frame */
const VB_A = [-203, -353, 593, 474];
const VB_B = [-371, -199, 638, 334];
const FS_A = 14.5;
const FS_B = 14.5 * S;

/* ---- S1 A's poses (Assembly.tsx) ---- */
const A_BASE: Box = { x0: -6.4, x1: 6.4, y0: -3.4, y1: 3.4, z0: 0, z1: 0.5 };
const A_TOOLS: Box[] = [
  { x0: 3.1, x1: 5.7, y0: -2.9, y1: -0.5, z0: 0.5, z1: 1.25 },
  { x0: 3.1, x1: 5.7, y0: 0.5, y1: 2.9, z0: 0.5, z1: 1.25 },
];
const A_TEAM_Z = 10.4;
const A_PLATE = 1.45;
const A_TEAM_X = [-4.65, -2.75, -0.85, 1.05];
const A_SLAB = { x0: -5.6, x1: 2.0, y0: -2.6, y1: 2.6, t: 0.4 };
const A_LABEL_X = 214;

/* ---- P3 B's poses (SubstrateBoardB.tsx) ---- */
const B_BOARD = { x0: -8.4, x1: 5.0, y0: -4.4, y1: 4.4 };
const B_CHIP: Box = { x0: -2.8, x1: 1.4, y0: -2.1, y1: 2.1, z0: 0, z1: 0.42 };
const B_TEAM_Y = [-3.0, -1.0, 1.0, 3.0];
const B_TEAM_X = -6.8;
const B_CL: Box = { x0: 2.2, x1: 4.0, y0: -2.2, y1: 2.2, z0: 0, z1: 0.85 };
const WIN_X = 8.4;
const WIN_W = 3.4;
const WIN_H = 1.55;
const WIN_GAP = 0.35;
const WIN_Z0 = 0.75;
const WIN_MID = -1.4;
const WIN_COLS = [WIN_MID - (WIN_W + WIN_GAP / 2), WIN_MID + WIN_GAP / 2];
/* Shopify and analytics are S1 A's two tools; agents and models open new */
const WINDOWS = [
  { name: "SHOPIFY", col: 0, row: 0, from: 0 },
  { name: "ANALYTICS", col: 1, row: 0, from: 1 },
  { name: "AGENTS", col: 0, row: 1, from: -1 },
  { name: "MODELS", col: 1, row: 1, from: -1 },
];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerpBox = (a: Box, b: Box, u: number): Box => ({
  x0: lerp(a.x0, b.x0, u),
  x1: lerp(a.x1, b.x1, u),
  y0: lerp(a.y0, b.y0, u),
  y1: lerp(a.y1, b.y1, u),
  z0: lerp(a.z0, b.z0, u),
  z1: lerp(a.z1, b.z1, u),
});
const pts = (l: readonly Pt[]) => l.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const line = (a: Pt, b: Pt) =>
  `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;

function Solid({
  b,
  c = TEXT,
  tintA = 0.05,
  o = 0.6,
  ghost = 0,
}: {
  b: Box;
  c?: string;
  tintA?: number;
  o?: number;
  ghost?: number;
}) {
  const f = boxFaces(iso, b);
  return (
    <g>
      {ghost > 0.001 && (
        <polygon
          points={f.outline}
          fill="none"
          stroke={c}
          strokeOpacity={0.3}
          strokeDasharray="3 5"
          opacity={ghost}
        />
      )}
      {ghost < 0.999 && (
        <g opacity={1 - ghost}>
          <polygon points={f.left} fill={tint(c, tintA * 1.4)} stroke={c} strokeOpacity={o} />
          <polygon points={f.right} fill={tint(c, tintA)} stroke={c} strokeOpacity={o} />
          <polygon points={f.top} fill={tint(c, tintA * 2)} stroke={c} strokeOpacity={o} />
        </g>
      )}
    </g>
  );
}

/* A flat drawing on the upright plane x = xd (P3 B's windows). */
const onWindow = (xd: number, yl: number, zt: number) => {
  const [e, f] = iso.p(xd, yl, zt);
  return `matrix(${C30} -0.5 0 1 ${e.toFixed(2)} ${f.toFixed(2)})`;
};

function Label({
  x,
  y,
  text,
  fs,
  fill = TEXT,
  anchor = "start",
  o = 1,
  sans,
}: {
  x: number;
  y: number;
  text: string;
  fs: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  o?: number;
  sans?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      fillOpacity={o}
      className={sans ? "xb-t-sans" : undefined}
      style={{ fontSize: fs, letterSpacing: sans ? 0 : "0.08em" }}
    >
      {text}
    </text>
  );
}

/** The whole scene at build progress p (1 → 3) and flow progress u (0 → 1). */
function Scene({ p, u }: { p: number; u: number }) {
  /* S1 A's own clocks */
  const a2 = ease(p - 1);
  const d = ease(p - 2);
  const enterprise = 0.18 + 0.82 * d;

  /* the flow's clocks, overlapped so it reads as one gesture */
  const aOut = 1 - seg(u, 0, 0.16); // S1 A's labels and traces leave first
  const mTeam = ease(seg(u, 0.04, 0.6));
  const mLayer = ease(seg(u, 0.14, 0.66));
  const mBase = ease(seg(u, 0.22, 0.74));
  const mWin = ease(seg(u, 0.36, 0.86));
  const mNew = ease(seg(u, 0.5, 0.92));
  const bBoard = seg(u, 0.46, 0.86);
  const bTrace = seg(u, 0.6, 0.92);
  const bChip = seg(u, 0.62, 0.94);
  const bLabel = seg(u, 0.84, 1);

  /* Claude Enterprise: S1 A's broad board draws in to P3 B's block */
  const cl = lerpBox(A_BASE, B_CL, mBase);
  /* the layer: three strata, seated, pressed into the chip */
  const zA = lerp(3.9, A_BASE.z1, d);
  const gapA = lerp(0.5, 0.05, d);
  const strata = STRATA.map((_, i) => {
    const za = zA + i * (A_SLAB.t + gapA);
    const A: Box = {
      x0: A_SLAB.x0,
      x1: A_SLAB.x1,
      y0: A_SLAB.y0,
      y1: A_SLAB.y1,
      z0: za,
      z1: za + A_SLAB.t,
    };
    const t = (B_CHIP.z1 - B_CHIP.z0) / 3;
    const B: Box = { ...B_CHIP, z0: B_CHIP.z0 + i * t, z1: B_CHIP.z0 + (i + 1) * t };
    return lerpBox(A, B, mLayer);
  });
  const slabTop = strata[2].z1;
  /* the team: S1 A's plates high over the layer, P3 B's modules on the board */
  const team = WORKSTREAMS.map((_, i) => {
    const cx = A_TEAM_X[i];
    const A: Box = {
      x0: cx - A_PLATE / 2,
      x1: cx + A_PLATE / 2,
      y0: -A_PLATE / 2,
      y1: A_PLATE / 2,
      z0: A_TEAM_Z,
      z1: A_TEAM_Z + 0.16,
    };
    const y = B_TEAM_Y[i];
    const B: Box = {
      x0: B_TEAM_X - 0.8,
      x1: B_TEAM_X + 0.8,
      y0: y - 0.6,
      y1: y + 0.6,
      z0: 0,
      z1: 0.3,
    };
    return lerpBox(A, B, mTeam);
  });
  /* the windows: two of them are S1 A's tools standing up; two open new
     out of Claude Enterprise's front face */
  const windows = WINDOWS.map((w) => {
    const y0 = WIN_COLS[w.col];
    const z0 = WIN_Z0 + w.row * (WIN_H + WIN_GAP);
    const B: Box = { x0: WIN_X, x1: WIN_X + 0.06, y0, y1: y0 + WIN_W, z0, z1: z0 + WIN_H };
    if (w.from >= 0) return { ...w, b: lerpBox(A_TOOLS[w.from], B, mWin), on: 1 };
    const seed: Box = {
      x0: B_CL.x1,
      x1: B_CL.x1 + 0.06,
      y0: y0 + WIN_W / 2 - 0.05,
      y1: y0 + WIN_W / 2 + 0.05,
      z0: 0.4,
      z1: 0.5,
    };
    return { ...w, b: lerpBox(seed, B, mNew), on: mNew };
  });

  /* P3 B's board, laid in under everything */
  const board: Pt[] = [
    iso.p(B_BOARD.x0, B_BOARD.y0, 0),
    iso.p(B_BOARD.x1, B_BOARD.y0, 0),
    iso.p(B_BOARD.x1, B_BOARD.y1, 0),
    iso.p(B_BOARD.x0, B_BOARD.y1, 0),
  ];
  const bDots: Pt[] = [];
  for (let x = B_BOARD.x0 + 0.7; x <= B_BOARD.x1 - 0.5; x += 1)
    for (let y = -3.9; y <= 3.9; y += 1) bDots.push(iso.p(x, y, 0));
  const aDots: Pt[] = [];
  for (let x = Math.ceil(A_BASE.x0 + 0.5); x <= A_BASE.x1 - 0.5; x += 1)
    for (let y = Math.ceil(A_BASE.y0 + 0.5); y <= A_BASE.y1 - 0.5; y += 1)
      aDots.push(iso.p(x, y, A_BASE.z1));

  const bundle = (route: [number, number][], gold: boolean) =>
    [-0.13, 0, 0.13].map((dd) => (
      <path
        key={dd}
        d={route
          .map(([x, y], i) => {
            const n = route[Math.min(i + 1, route.length - 1)];
            const pr = route[Math.max(i - 1, 0)];
            const horiz = Math.abs(n[0] - pr[0]) > Math.abs(n[1] - pr[1]);
            const q = iso.p(x + (horiz ? 0 : dd), y + (horiz ? dd : 0), 0.01);
            return `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
          })
          .join("")}
        fill="none"
        stroke={gold ? GOLD : TEXT}
        strokeOpacity={gold ? 0.8 : 0.55}
      />
    ));

  /* the chip's pins and its etched mark, P3 B's */
  const chipW = B_CHIP.x1 - B_CHIP.x0;
  const pins: string[] = [];
  for (let i = 0; i < 9; i++) {
    const t = B_CHIP.y0 + 0.3 + ((B_CHIP.y1 - B_CHIP.y0 - 0.6) * i) / 8;
    const tx = B_CHIP.x0 + 0.3 + ((chipW - 0.6) * i) / 8;
    pins.push(
      line(iso.p(B_CHIP.x0 - 0.25, t, 0), iso.p(B_CHIP.x0, t, 0)),
      line(iso.p(B_CHIP.x1, t, 0), iso.p(B_CHIP.x1 + 0.25, t, 0)),
      line(iso.p(tx, B_CHIP.y0 - 0.25, 0), iso.p(tx, B_CHIP.y0, 0)),
      line(iso.p(tx, B_CHIP.y1, 0), iso.p(tx, B_CHIP.y1 + 0.25, 0))
    );
  }
  const markU = Math.min(chipW, B_CHIP.y1 - B_CHIP.y0) * 0.72;
  const chipCx = (B_CHIP.x0 + B_CHIP.x1) / 2;
  const markT = iso.plane(chipCx - markU / 2, -markU / 2, B_CHIP.z1, markU / 430.99);

  return (
    <g>
      {/* P3 B's board */}
      <g opacity={bBoard}>
        <polygon points={pts(board)} fill="none" stroke={TEXT} strokeOpacity={0.3} />
        <g fill={TEXT} fillOpacity={0.22}>
          {bDots.map(([x, y], i) => (
            <rect key={i} x={x - 0.6} y={y - 0.6} width={1.2} height={1.2} />
          ))}
        </g>
      </g>
      <g opacity={bTrace}>
        {B_TEAM_Y.map((y, i) => {
          const ey = [-1.2, -0.4, 0.4, 1.2][i];
          const jx = [-4.4, -5.2, -5.2, -4.4][i];
          return (
            <g key={y}>
              {bundle(
                [
                  [B_TEAM_X + 0.8, y],
                  [jx, y],
                  [jx, ey],
                  [B_CHIP.x0 - 0.25, ey],
                ],
                false
              )}
            </g>
          );
        })}
        {[-1.1, 0, 1.1].map((y) => (
          <g key={y}>
            {bundle(
              [
                [B_CHIP.x1 + 0.25, y],
                [B_CL.x0, y],
              ],
              true
            )}
          </g>
        ))}
      </g>

      {/* Claude Enterprise: S1 A's board → P3 B's block */}
      <Solid b={cl} tintA={0.05} o={lerp(0.5, 0.7, mBase)} ghost={1 - enterprise} />
      <g opacity={0.5 * enterprise * aOut} fill={TEXT} fillOpacity={0.5}>
        {aDots.map(([x, y], i) => (
          <rect key={i} x={x - 0.75} y={y - 0.75} width={1.5} height={1.5} />
        ))}
      </g>
      {/* S1 A's traces from the layer's seat to the tools */}
      <g opacity={d * aOut}>
        {[-1.7, 1.7].map((y) => (
          <path
            key={y}
            d={line(iso.p(A_SLAB.x1, y, A_BASE.z1), iso.p(A_TOOLS[0].x0, y, A_BASE.z1))}
            stroke={GOLD}
          />
        ))}
      </g>

      {/* the layer → the chip */}
      <g opacity={bChip}>
        <path d={pins.join("")} stroke={GOLD} strokeOpacity={0.8} />
      </g>
      {a2 < 0.999 && (
        <polygon
          points={boxFaces(iso, { ...strata[0], z1: strata[2].z1 }).outline}
          fill="none"
          stroke={GOLD}
          strokeDasharray="3 5"
          opacity={(1 - a2) * 0.55}
        />
      )}
      <g opacity={a2}>
        {strata.map((b, i) => {
          const f = boxFaces(iso, b);
          const lift = 0.06 * i * (1 - mLayer);
          return (
            <g key={STRATA[i].id}>
              <polygon
                points={f.left}
                fill={tint(WASH, 0.1 + lift + 0.07 * mLayer)}
                stroke={GOLD}
              />
              <polygon
                points={f.right}
                fill={tint(WASH, 0.05 + lift + 0.05 * mLayer)}
                stroke={GOLD}
              />
              <polygon
                points={f.top}
                fill={tint(WASH, 0.16 + lift + 0.08 * mLayer)}
                stroke={GOLD}
                strokeOpacity={i < 2 ? 1 - mLayer : 1}
              />
            </g>
          );
        })}
      </g>
      <g opacity={bChip}>
        <EtchedMark transform={markT} id="flow-mark" />
      </g>

      {/* S1 A's drop lines: each workstream's work going into the layer */}
      <g opacity={a2 * aOut}>
        {A_TEAM_X.map((cx) => {
          const s = iso.p(cx, 0, A_TEAM_Z);
          const e = iso.p(cx, 0, slabTop);
          return (
            <g key={cx}>
              <path d={line(s, e)} stroke={GOLD} strokeOpacity={0.7} strokeDasharray="2 4" />
              <rect x={e[0] - 2.5} y={e[1] - 2.5} width={5} height={5} fill={GOLD} />
            </g>
          );
        })}
      </g>

      {/* the team: plates high → modules on the board */}
      {team.map((b, i) => {
        const strong = p < 1.5 && u === 0;
        const g0 = iso.plane(
          b.x0 + lerp(0.2, 0.35, mTeam),
          b.y0 + lerp(0.2, 0.1, mTeam),
          b.z1,
          lerp((A_PLATE - 0.4) / 24, 1 / 24, mTeam)
        );
        return (
          <g
            key={WORKSTREAMS[i].id}
            opacity={lerp(0.38 + 0.62 * Math.max(p < 1.5 ? 1 : 0.62, 0.62), 1, mTeam)}
          >
            <Solid b={b} o={strong ? 0.85 : 0.6} />
            <path
              d={GLYPH[WORKSTREAMS[i].id]}
              transform={g0}
              fill="none"
              stroke={TEXT}
              strokeOpacity={0.85}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}

      {/* Claude Enterprise → the windows, the flow continued */}
      <g opacity={seg(u, 0.8, 1)}>
        {[-1.6, -0.5, 0.6].map((y) => {
          const a = iso.p(B_CL.x1, y, 0.01);
          const b = iso.p(WIN_X, y, 0.01);
          const c = iso.p(WIN_X, y, WIN_Z0);
          return (
            <g key={y}>
              <path
                d={`${line(a, b)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`}
                fill="none"
                stroke={GOLD}
                strokeOpacity={0.8}
                strokeDasharray="2 4"
              />
              <rect x={c[0] - 2} y={c[1] - 2} width={4} height={4} fill={GOLD} />
            </g>
          );
        })}
      </g>

      {/* the tools stand up as windows; two more open */}
      {windows.map((w) => {
        if (w.on <= 0.001) return null;
        const tool = w.from >= 0;
        const chrome = seg(u, 0.84, 1);
        const wpx = WIN_W * U;
        const hpx = WIN_H * U;
        return (
          <g key={w.name} opacity={tool ? (w.from === 0 || w.from === 1 ? enterprise : 1) : w.on}>
            <Solid b={w.b} tintA={0.05} o={0.7} />
            {tool && (
              <path
                d={GLYPH[TOOLS[w.from].id]}
                transform={iso.plane(w.b.x0 + 0.5, w.b.y0 + 0.5, w.b.z1, 1.4 / 24)}
                fill="none"
                stroke={TEXT}
                strokeOpacity={1 - seg(u, 0.36, 0.6)}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <g opacity={chrome} transform={onWindow(w.b.x1, w.b.y1, w.b.z1)}>
              <rect
                x={0}
                y={0}
                width={wpx}
                height={22 * S}
                fill={tint(TEXT, 0.12)}
                stroke={TEXT}
                strokeOpacity={0.75}
              />
              <text
                x={9 * S}
                y={16 * S}
                fill={TEXT}
                style={{ fontSize: FS_B, letterSpacing: "0.08em" }}
              >
                {w.name}
              </text>
              {[0, 1].map((r) => (
                <rect
                  key={r}
                  x={9 * S}
                  y={(31 + r * 8) * S}
                  width={[wpx - 30, wpx - 43][r]}
                  height={3 * S}
                  fill={TEXT}
                  fillOpacity={0.3}
                />
              ))}
              <rect
                x={wpx - 18}
                y={hpx - 10}
                width={11}
                height={5}
                fill={GOLD}
                fillOpacity={0.85}
              />
            </g>
          </g>
        );
      })}

      {/* S1 A's labels */}
      <g opacity={aOut}>
        {A_TEAM_X.map((cx, i) => {
          const at = iso.p(cx - A_PLATE / 2, -A_PLATE / 2, A_TEAM_Z + 0.16);
          return (
            <g key={`al${i}`} opacity={p < 1.5 ? 1 : 0.55}>
              <path
                d={line([at[0], at[1] - 4], [at[0], at[1] - 14])}
                stroke={TEXT}
                strokeOpacity={0.4}
              />
              <Label
                x={at[0]}
                y={at[1] - 20}
                text={WORKSTREAMS[i].name.toUpperCase()}
                fs={FS_A}
                o={0.85}
              />
            </g>
          );
        })}
        <g opacity={a2 * (1 - d)}>
          {strata.map((b, i) => (
            <LeaderA
              key={STRATA[i].id}
              at={iso.p(b.x1, b.y0, (b.z0 + b.z1) / 2)}
              text={STRATA[i].name.toUpperCase()}
              gold
            />
          ))}
        </g>
        <g opacity={a2}>
          <LeaderA
            at={iso.p(A_SLAB.x1, A_SLAB.y0, slabTop)}
            dy={d > 0.5 ? 0 : -26}
            text="X-BIONIC LAYER"
            gold
            strong
          />
        </g>
        <g opacity={enterprise}>
          <LeaderA at={iso.p(A_TOOLS[0].x1, A_TOOLS[0].y0, A_TOOLS[0].z1)} text="SHOPIFY" />
          <LeaderA
            at={iso.p(
              A_TOOLS[1].x1,
              (A_TOOLS[1].y0 + A_TOOLS[1].y1) / 2,
              (A_TOOLS[1].z0 + A_TOOLS[1].z1) / 2
            )}
            text="ANALYTICS"
          />
          <LeaderA at={iso.p(A_BASE.x1, 2.2, 0.25)} text="CLAUDE ENTERPRISE" strong />
        </g>
      </g>

      {/* P3 B's labels */}
      <g opacity={bLabel}>
        {B_TEAM_Y.map((y, i) => {
          const at = iso.p(B_TEAM_X - 0.8, y + 0.6, 0.15);
          const to = iso.p(B_BOARD.x0, B_BOARD.y1, 0)[0] - 18 * S;
          return (
            <g key={`bl${i}`}>
              <rect x={at[0] - 1.5} y={at[1] - 1.5} width={3} height={3} fill={TEXT} />
              <path d={line(at, [to, at[1]])} stroke={TEXT} strokeOpacity={0.45} />
              <Label
                x={to - 8}
                y={at[1] + 3.5}
                anchor="end"
                text={WORKSTREAMS[i].name.replace("Creative ", "").toUpperCase()}
                fs={FS_B}
              />
            </g>
          );
        })}
        <Label
          x={iso.p(B_BOARD.x0, B_BOARD.y1, 0)[0] - 28 * S}
          y={iso.p(B_TEAM_X - 0.8, B_TEAM_Y[0] + 0.6, 0.15)[1] - 34 * S}
          anchor="end"
          text="THE TEAM"
          fs={FS_B}
          o={0.5}
        />
        {(() => {
          const a = iso.p(chipCx, B_CHIP.y0 + 0.2, B_CHIP.z1);
          const top = (66 - 268) * S;
          return (
            <g>
              <rect x={a[0] - 1.5} y={a[1] - 1.5} width={3} height={3} fill={GOLD} />
              <path d={line(a, [a[0], top])} stroke={GOLD} strokeOpacity={0.5} />
              <Label
                x={a[0]}
                y={(26 - 268) * S}
                anchor="middle"
                text="THE CONFIGURATION"
                fs={FS_B}
                fill="var(--gold-ink, #caa554)"
              />
              <Label
                x={a[0]}
                y={(50 - 268) * S}
                anchor="middle"
                text="Written with the team"
                fs={16 * S}
                o={0.6}
                sans
              />
            </g>
          );
        })()}
        {(() => {
          const a = iso.p(B_CL.x1, B_CL.y1 - 0.3, 0.3);
          const base = (450 - 12 - 268) * S;
          return (
            <g>
              <rect x={a[0] - 1.5} y={a[1] - 1.5} width={3} height={3} fill={TEXT} />
              <path d={line(a, [a[0], base - 22 * S])} stroke={TEXT} strokeOpacity={0.45} />
              <Label x={a[0]} y={base} anchor="middle" text="CLAUDE ENTERPRISE" fs={FS_B} />
            </g>
          );
        })()}
      </g>
    </g>
  );
}

/** S1 A's label on a leader into its right-hand column. */
function LeaderA({
  at,
  text,
  gold,
  strong,
  dy = 0,
}: {
  at: Pt;
  text: string;
  gold?: boolean;
  strong?: boolean;
  dy?: number;
}) {
  const c = gold ? GOLD : TEXT;
  const y = at[1] + dy;
  const d =
    dy === 0
      ? `M${at[0] + 4} ${at[1]}H${A_LABEL_X - 8}`
      : `M${at[0] + 4} ${at[1]}V${y}H${A_LABEL_X - 8}`;
  return (
    <g>
      <rect x={at[0] - 2} y={at[1] - 2} width={4} height={4} fill={c} />
      <path d={d} fill="none" stroke={c} strokeOpacity={0.45} />
      <Label
        x={A_LABEL_X}
        y={y + 4}
        text={text}
        fs={FS_A}
        fill={gold ? "var(--gold-ink, #caa554)" : TEXT}
        o={strong ? 1 : 0.72}
      />
    </g>
  );
}

/* The runway: S1 A builds over the first 42 %, holds, flows over the next
   42 %, holds. `t` fixes a point for a still. */
const RUNWAY = "600svh";
export function FlowAtoB({ t: fixed }: { t?: number }) {
  const runway = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(fixed ?? 0);

  useEffect(() => {
    if (fixed !== undefined) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = runway.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      setT(span > 0 ? clamp01(-r.top / span) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fixed]);

  const p = 1 + 2 * seg(t, 0, 0.42);
  const u = ease(seg(t, 0.5, 0.92));
  const cam = VB_A.map((a, i) => lerp(a, VB_B[i], u));
  const active = p < 1.5 ? 1 : p < 2.5 ? 2 : 3;

  return (
    <div ref={runway} style={{ height: RUNWAY }} data-flow-t={t.toFixed(3)}>
      <div className="xbA-pin">
        <Stage route="Flow · S1 A into P3 B">
          <div className="xbP">
            <header className="xbP__head">
              <div>
                <div className="xb-eyebrow">{OFFER.eyebrow}</div>
                <h2 className="xb-title xbP__title">
                  {OFFER.title[0]} <span>{OFFER.title[1]}</span>
                </h2>
              </div>
              <ol className="xbF__steps">
                {OFFER.steps.map((s, i) => (
                  <li key={s.n} className="xbF__step" data-on={active === i + 1 || undefined}>
                    <span className="xbF__n">{s.n}</span>
                    {s.head}
                  </li>
                ))}
              </ol>
            </header>
            <div className="xbP__fig">
              <svg
                viewBox={cam.map((v) => v.toFixed(2)).join(" ")}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="The team, the layer and Claude Enterprise assemble, then move into one board: the team's four workstreams wired into the configuration, the configuration into Claude Enterprise, and four windows (Shopify, analytics, agents, models) standing up out of it."
                style={{ overflow: "visible" }}
              >
                <Scene p={p} u={u} />
              </svg>
            </div>
          </div>
        </Stage>
      </div>
    </div>
  );
}
