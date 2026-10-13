/* S3 · READOUT: the stack as an instrument panel reads it (after the one
   Evangelion screen in the owner's library, `Interfaces\evangelion-1.png`,
   and Vilimovský's Cyberpunk 2077 boards: buses that turn only at 45
   degrees, fanning to rows; chips with a corner cut).

   Not an object: a display of one. One hot hairline frame with a segmented
   tab and a scale down its edge; inside it each plate is its grid of capsule
   modules, the rows lying along the plate's two axes so they stack as
   chevrons; a bus of one wire for each thing a plate holds leaves its corner
   and fans to a register that names them; a plan of each plate stands on the
   other side. State is tone: a module that holds nothing is quiet, one that
   is held takes its plate's tone, the layer is lit throughout, and one
   module of its front row is white: it marks how far the stack is opened.

   The plates differ in kind, as they do in the model: the team is a full
   floor with four clusters on it, the layer is thick and lit with its three
   strata as three courses on its walls, the agents are a board with a chip
   and four modules standing on it, wired.

   Every figure printed is read off the model or counted from what is drawn
   (`geometry.ts`); nothing is a serial. */

import { useId } from "react";

import {
  factsOf,
  type Feature,
  type FormProps,
  boxFaces,
  pathOf,
  type Plate,
  PLATES,
  poseAt,
  project,
  type Pt,
  ptsOf,
  seg,
  SIDE,
} from "../model";

import {
  BOX,
  BUS_Y,
  busOf,
  COUNTS,
  COURSE,
  COURSES,
  dropsOf,
  FACES,
  FRAME,
  FRONT,
  H,
  LINK,
  type Module,
  modulesOf,
  PART_CUT,
  PARTS,
  PLAN,
  PLAN_LINK,
  PLAN_PAD,
  PLAN_SIDE,
  PLAN_X0,
  planAt,
  planLeadOf,
  RAILS,
  REG_X1,
  ROW_X,
  selectedOf,
  shiftOf,
  stateWord,
  TOTAL,
  W,
  zToY,
} from "./geometry";

/* -- what never moves: each plate drawn once, at lift 0 -------------------- */

const SLABS = PLATES.map((p) => {
  const top = p.key === "layer" ? p.top : p.body[0].z1;
  const faces = boxFaces(FRAME, { x0: 0, x1: SIDE, y0: 0, y1: SIDE, z0: 0, z1: top });
  return {
    outline: ptsOf(faces.outline),
    top: ptsOf(faces.top),
    left: ptsOf(faces.left),
    right: ptsOf(faces.right),
  };
});

const BOARD_Z = PLATES[2].body[0].z1;
/* the board's wires: the model's own runs, laid on the board */
const WIRES = PLATES[2].traces.map((t) =>
  pathOf(t.pts.map(([x, y]) => project(FRAME, x, y, BOARD_Z)))
);

/** What stands on the board, as a small solid: its top with one corner cut,
    its two near walls, a mark set into the top, and (the chip) its pins. */
function partOf(f: Feature, at: (x: number, y: number, z: number) => Pt, walls: boolean) {
  const { x0, x1, y0, y1, z0, z1 } = f.box;
  const c = PART_CUT;
  const m = f.kind === "chip" ? 0.45 : 0.32;
  const pins: string[] = [];
  if (f.kind === "chip")
    for (let k = 0; k < 6; k++) {
      const s = 0.2 + k * 0.32;
      pins.push(pathOf([at(x1, y0 + s, z0), at(x1 + 0.3, y0 + s, z0)]));
      pins.push(pathOf([at(x0 + s, y1, z0), at(x0 + s, y1 + 0.3, z0)]));
    }
  return {
    id: f.id,
    kind: f.kind,
    top: ptsOf([
      at(x0, y0, z1),
      at(x1 - c, y0, z1),
      at(x1, y0 + c, z1),
      at(x1, y1, z1),
      at(x0, y1, z1),
    ]),
    left: walls ? ptsOf([at(x0, y1, z1), at(x1, y1, z1), at(x1, y1, z0), at(x0, y1, z0)]) : null,
    right: walls
      ? ptsOf([at(x1, y0 + c, z1), at(x1, y1, z1), at(x1, y1, z0), at(x1, y0 + c, z0)])
      : null,
    mark: ptsOf([
      at(x0 + m, y0 + m, z1),
      at(x1 - m, y0 + m, z1),
      at(x1 - m, y1 - m, z1),
      at(x0 + m, y1 - m, z1),
    ]),
    pins: pins.join(""),
  };
}
const BOARD = PARTS.map((f) => partOf(f, (x, y, z) => project(FRAME, x, y, z), true));

/* each plate's plan: the same modules, and the same parts, seen from above */
const PLANS = PLATES.map((p, n) => modulesOf(p, planAt(n)));
const BOARD_PLAN = PARTS.map((f) => partOf(f, planAt(2), false));

const pad2 = (n: number) => String(n).padStart(2, "0");
const pad3 = (n: number) => String(n).padStart(3, "0");
const TONE_VAR = { green: "var(--sf-green)", gold: "var(--sf-gold)", bone: "var(--sf-bone)" };

/** One module: a capsule link (two joints and the bar between them) or the
    node where two rows meet. */
function ModuleShape({
  x,
  y,
  rot,
  kind,
  state,
  l,
  t,
  selected,
}: {
  x: number;
  y: number;
  rot: number;
  kind: Module["kind"];
  state: string;
  l: number;
  t: number;
  selected?: boolean;
}) {
  const cls = `sfr-mod${selected ? " sfr-mod--sel" : ""}`;
  if (kind === "node")
    return (
      <g
        transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
        className={cls}
        data-state={state}
      >
        <circle r={t * 0.56} className="sfr-mod__body" />
        <circle r={t * 0.2} className="sfr-mod__joint" />
      </g>
    );
  const j = l / 2 - t / 2;
  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot})`}
      className={cls}
      data-state={state}
    >
      <rect x={-l / 2} y={-t / 2} width={l} height={t} rx={t / 2} className="sfr-mod__body" />
      <line x1={-j} x2={j} className="sfr-mod__bar" />
      <circle cx={-j} r={t * 0.22} className="sfr-mod__joint" />
      <circle cx={j} r={t * 0.22} className="sfr-mod__joint" />
    </g>
  );
}

/** What stands on the board. */
function Part({ part }: { part: (typeof BOARD)[number] }) {
  return (
    <g className="sfr-part" data-kind={part.kind}>
      {part.pins && <path d={part.pins} className="sfr-part__pin" />}
      {part.left && <polygon points={part.left} className="sfr-part__wall" />}
      {part.right && <polygon points={part.right} className="sfr-part__wall sfr-part__wall--far" />}
      <polygon points={part.top} className="sfr-part__top" />
      <polygon points={part.mark} className="sfr-part__mark" />
    </g>
  );
}

/** Condensed lettering: the grotesk, bold, pressed to six tenths of its
    width, as the reference presses its titles. */
function Tight({
  x,
  y,
  size,
  children,
  className = "",
}: {
  x: number;
  y: number;
  size: number;
  children: string;
  className?: string;
}) {
  return (
    <text
      transform={`translate(${x} ${y}) scale(0.62 1)`}
      fontSize={size}
      className={`sfr-tight ${className}`}
    >
      {children}
    </text>
  );
}

/** A plate, drawn where it stands at lift 0; its group is moved by the pose. */
function PlateBody({ plate, selected }: { plate: Plate; selected: number }) {
  const n = plate.i;
  const slab = SLABS[n];
  const sel = FRONT[selected];
  const face = FACES[n].map((m) => (
    <ModuleShape
      key={`${m.i}-${m.j}`}
      x={m.x}
      y={m.y}
      rot={m.rot}
      kind={m.kind}
      state={m.state}
      l={LINK.l}
      t={LINK.t}
      selected={plate.lit && m.i === sel[0] && m.j === sel[1]}
    />
  ));
  return (
    <>
      {/* a plate hides what stands behind it */}
      <polygon points={slab.outline} className="sfr-plate__mask" />
      <polygon points={slab.left} className="sfr-plate__wall" />
      <polygon points={slab.right} className="sfr-plate__wall sfr-plate__wall--far" />
      <polygon points={slab.top} className="sfr-plate__top" />
      {plate.lit ? (
        <g className="sfr-lit">
          {COURSES.map((c, k) => (
            <ModuleShape
              key={`c${k}`}
              x={c.x}
              y={c.y}
              rot={c.rot}
              kind="link"
              state="lit"
              l={COURSE.l}
              t={COURSE.t}
            />
          ))}
          {face}
        </g>
      ) : (
        face
      )}
      {plate.key === "agents" && (
        <>
          {WIRES.map((d, k) => (
            <path key={k} d={d} className="sfr-wire" />
          ))}
          {BOARD.map((part) => (
            <Part key={part.id} part={part} />
          ))}
        </>
      )}
    </>
  );
}

export function Readout({ open, motion }: FormProps) {
  const uid = useId().replace(/:/g, "");
  const pose = poseAt(open);
  const facts = factsOf(pose);
  const selected = selectedOf(pose.open);
  const shift = ([0, 1, 2] as const).map((i) => shiftOf(pose, i));
  const buses = ([0, 1, 2] as const).map((i) => busOf(pose, i));

  /* the scale down the frame's edge: one tick a unit of height, the datum at
     the layer's floor */
  const scale = Array.from({ length: 15 }, (_, k) => k - 7);
  const cells: [string, string][] = [
    ["Plates", String(facts.plates)],
    ["Side", `${facts.side} × ${facts.side}`],
    ["Pitch", facts.pitch.toFixed(2)],
    ["Height", facts.height.toFixed(2)],
    ["Open", `${facts.openPct}%`],
    ["Modules", String(TOTAL)],
  ];
  /* what the tones mean, in two rows: three states, then the one mark */
  const legend = [
    { state: "nominal", tone: "bone", word: "Nominal", sel: false, x: 0, row: 0 },
    { state: "held", tone: "green", word: "Held", sel: false, x: 132, row: 0 },
    { state: "lit", tone: "gold", word: "Lit", sel: false, x: 232, row: 0 },
    {
      state: "lit",
      tone: "gold",
      word: `Open · mark ${pad2(selected + 1)} of ${FRONT.length}`,
      sel: true,
      x: 0,
      row: 1,
    },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="sf-svg sfr-root"
      data-sfr-motion={motion}
      role="img"
      aria-label={`A readout of the stack: three plates of capsule modules, ${stateWord(facts.openPct).toLowerCase()}, each on a bus to a register naming what it holds.`}
    >
      <defs>
        <pattern id={`sfr-dots-${uid}`} width={26} height={26} patternUnits="userSpaceOnUse">
          <rect x={12.5} y={12.5} width={1.2} height={1.2} className="sfr-dot" />
        </pattern>
      </defs>

      {/* -- the frame: a ground, a hot hairline, a tab, a scale ---------- */}
      <rect
        x={BOX.x0}
        y={BOX.y0}
        width={BOX.x1 - BOX.x0}
        height={BOX.y1 - BOX.y0}
        fill={`url(#sfr-dots-${uid})`}
      />
      <rect
        x={BOX.x0}
        y={BOX.y0}
        width={BOX.x1 - BOX.x0}
        height={BOX.y1 - BOX.y0}
        className="sfr-frame__halo"
      />
      <rect
        x={BOX.x0}
        y={BOX.y0}
        width={BOX.x1 - BOX.x0}
        height={BOX.y1 - BOX.y0}
        className="sfr-frame"
      />
      <path
        className="sfr-tick"
        d={Array.from({ length: Math.floor((BOX.x1 - BOX.x0) / 40) + 1 }, (_, k) => {
          const x = BOX.x0 + k * 40;
          const len = k % 5 === 0 ? 9 : 4;
          return `M${x} ${BOX.y0 - 6}v${-len}M${x} ${BOX.y1 + 6}v${len}`;
        }).join("")}
      />
      {[
        [BOX.x0 - 14, BOX.y0 - 14],
        [BOX.x1 + 10, BOX.y0 - 14],
        [BOX.x0 - 14, BOX.y1 + 10],
        [BOX.x1 + 10, BOX.y1 + 10],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={4} height={4} className="sfr-pip" />
      ))}

      {/* the tab: a segment a plate, the lit one lit */}
      <polygon
        className="sfr-tab"
        points={ptsOf([
          [BOX.x0, BOX.y0],
          [BOX.x0 + 178, BOX.y0],
          [BOX.x0 + 178, BOX.y0 + 12],
          [BOX.x0 + 166, BOX.y0 + 24],
          [BOX.x0, BOX.y0 + 24],
        ])}
      />
      {PLATES.map((p) => (
        <rect
          key={p.key}
          x={BOX.x0 + 14 + p.i * 50}
          y={BOX.y0 + 8}
          width={40}
          height={8}
          fill={TONE_VAR[p.tone]}
          className={`sfr-tab__seg${p.lit ? " sfr-tab__seg--lit" : ""}`}
        />
      ))}
      <Tight x={BOX.x0 + 24} y={BOX.y0 + 66} size={30} className="sfr-ink">
        Stack readout
      </Tight>
      <text x={BOX.x0 + 24} y={BOX.y0 + 88} className="sfr-t sfr-ink-2">
        {facts.plates} plates · side {facts.side} × {facts.side}
      </text>

      {/* the state, in a word a reader could check against the slider */}
      <polygon
        className="sfr-chip"
        points={ptsOf([
          [REG_X1 - 214, BOX.y0 + 30],
          [REG_X1 - 14, BOX.y0 + 30],
          [REG_X1, BOX.y0 + 44],
          [REG_X1, BOX.y0 + 78],
          [REG_X1 - 200, BOX.y0 + 78],
          [REG_X1 - 200, BOX.y0 + 70],
          [REG_X1 - 214, BOX.y0 + 70],
        ])}
      />
      <Tight x={REG_X1 - 198} y={BOX.y0 + 66} size={30} className="sfr-gold">
        {stateWord(facts.openPct)}
      </Tight>
      <text x={REG_X1 - 14} y={BOX.y0 + 61} textAnchor="end" className="sfr-t sfr-ink">
        {pad3(facts.openPct)}%
      </text>

      {/* the scale down the left edge, and where each plate's floor stands on it */}
      <path
        className="sfr-tick"
        d={scale
          .map((z) => `M${BOX.x0} ${zToY(z).toFixed(2)}h${z === 0 ? 18 : z % 2 === 0 ? 11 : 6}`)
          .join("")}
      />
      {scale
        .filter((z) => z % 2 === 0)
        .map((z) => (
          <text key={z} x={BOX.x0 + 24} y={zToY(z) + 4.5} className="sfr-t sfr-ink-3">
            {z > 0 ? `+${z}` : z}
          </text>
        ))}
      {PLATES.map((p) => {
        const y = zToY(pose.lift[p.i]);
        return (
          <g key={p.key} fill={TONE_VAR[p.tone]}>
            <polygon
              points={ptsOf([
                [BOX.x0 + 62, y],
                [BOX.x0 + 74, y - 6],
                [BOX.x0 + 74, y + 6],
              ])}
            />
          </g>
        );
      })}

      {/* -- left of the stack: a plan of each plate, on a lead from it ---- */}
      {PLATES.map((p) => {
        const b = BUS_Y[p.i];
        const c = COUNTS[p.i];
        const x0 = PLAN_X0 - PLAN_PAD;
        const y0 = b - PLAN_SIDE / 2 - PLAN_PAD;
        const y1 = b + PLAN_SIDE / 2 + PLAN_PAD;
        return (
          <g key={p.key} data-tone={p.tone} className="sfr-plan">
            <path d={pathOf(planLeadOf(pose, p.i))} className="sfr-lead" />
            <polygon
              className="sfr-plan__frame"
              points={ptsOf([
                [x0, y0],
                [PLAN.x1 - 12, y0],
                [PLAN.x1, y0 + 12],
                [PLAN.x1, y1],
                [x0 + 20, y1],
                [x0 + 20, y1 - 6],
                [x0, y1 - 6],
              ])}
            />
            <rect x={PLAN.x1 - 2.5} y={b - 2.5} width={5} height={5} className="sfr-end" />
            {PLANS[p.i].map((m) => (
              <ModuleShape
                key={`${m.i}-${m.j}`}
                x={m.x}
                y={m.y}
                rot={m.rot < 0 ? 90 : 0}
                kind={m.kind}
                state={m.state}
                l={PLAN_LINK.l}
                t={PLAN_LINK.t}
              />
            ))}
            {p.key === "agents" && BOARD_PLAN.map((part) => <Part key={part.id} part={part} />)}
            <text x={x0} y={y0 - 10} className="sfr-t sfr-tone">
              {p.n} plan
            </text>
            <text x={PLAN.x1} y={y0 - 10} textAnchor="end" className="sfr-t sfr-ink-3">
              {c.modules}
            </text>
          </g>
        );
      })}

      {/* -- right of the stack: a register for each plate, on its bus ----- */}
      {PLATES.map((p) => {
        const b = BUS_Y[p.i];
        const c = COUNTS[p.i];
        const bus = buses[p.i];
        const top = b - 134;
        const bottom = bus.rows[bus.rows.length - 1][1] + 16;
        const extra =
          p.key === "team"
            ? `Rail · ${p.features.find((f) => f.kind === "rail")!.label}`
            : p.key === "agents"
              ? `Chip · ${p.features.find((f) => f.kind === "chip")!.label}`
              : "Lit";
        return (
          <g key={p.key} data-tone={p.tone} className="sfr-reg">
            {bus.wires.map((w, k) => (
              <path key={k} d={pathOf(w)} className="sfr-bus" />
            ))}
            <path
              className="sfr-reg__bracket"
              d={`M${ROW_X + 8} ${top}H${ROW_X - 10}V${bottom}H${ROW_X + 8}M${ROW_X - 10} ${top}H${REG_X1}`}
            />
            <Tight x={ROW_X + 6} y={b - 78} size={62} className="sfr-tone">
              {p.n}
            </Tight>
            <Tight x={ROW_X + 62} y={b - 102} size={30} className="sfr-ink">
              {p.step}
            </Tight>
            <text x={ROW_X + 62} y={b - 80} className="sfr-t sfr-ink-2">
              {p.name}
            </text>
            <text x={REG_X1} y={b - 108} textAnchor="end" className="sfr-t sfr-ink-3">
              {c.modules} modules
            </text>
            <text x={REG_X1} y={b - 86} textAnchor="end" className="sfr-t sfr-ink-3">
              holds {p.holds.length}
            </text>
            <text x={ROW_X + 6} y={b - 56} className="sfr-t sfr-tone">
              {extra}
            </text>
            {p.holds.map((name, k) => {
              const [rx, ry] = bus.rows[k];
              /* how many modules stand for it on the plate */
              const f = p.features.find((x) => x.label === name);
              const count =
                p.key === "layer"
                  ? COURSES.filter((x) => x.stratum === k).length
                  : f
                    ? c.of(f.id)
                    : 0;
              return (
                <g key={name}>
                  <rect x={rx - 2.5} y={ry - 2.5} width={5} height={5} className="sfr-end" />
                  {p.key === "agents" ? (
                    <polygon
                      className="sfr-part__top"
                      points={ptsOf([
                        [rx + 17, ry - 6],
                        [rx + 28, ry - 6],
                        [rx + 31, ry - 3],
                        [rx + 31, ry + 6],
                        [rx + 17, ry + 6],
                      ])}
                    />
                  ) : (
                    <g className={p.lit ? "sfr-lit" : undefined}>
                      <ModuleShape
                        x={rx + 24}
                        y={ry}
                        rot={0}
                        kind="link"
                        state={p.lit ? "lit" : "held"}
                        l={24}
                        t={10}
                      />
                    </g>
                  )}
                  <text x={rx + 46} y={ry + 4.5} className="sfr-t sfr-ink">
                    {name}
                  </text>
                  <text x={REG_X1} y={ry + 4.5} textAnchor="end" className="sfr-t sfr-ink-3">
                    × {pad2(count)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* -- the two rails the stack rides, as long as its whole travel ---- */}
      {RAILS.map((rail) => {
        const out = rail.side === "left" ? -1 : 1;
        return (
          <g key={rail.side}>
            <path
              className="sfr-post"
              d={`M${rail.x.toFixed(2)} ${rail.y0.toFixed(2)}V${rail.y1.toFixed(2)}`}
            />
            <path
              className="sfr-tick"
              d={
                rail.ticks.map((y) => `M${rail.x.toFixed(2)} ${y.toFixed(2)}h${out * 7}`).join("") +
                `M${(rail.x - 5).toFixed(2)} ${rail.y0.toFixed(2)}h10M${(rail.x - 5).toFixed(2)} ${rail.y1.toFixed(2)}h10`
              }
            />
            {/* its two limits, in units of height: where the opened stack's
                top and floor stand */}
            {rail.side === "right" && (
              <>
                <text x={rail.x + 9} y={rail.y0 - 12} className="sfr-t sfr-ink-3">
                  +{rail.zTop.toFixed(2)}
                </text>
                <text x={rail.x + 9} y={rail.y1 + 24} className="sfr-t sfr-ink-3">
                  {rail.zBot.toFixed(2).replace("-", "−")}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* -- the stack: back plate first, and what crosses each gap ------- */}
      {([2, 1, 0] as const).map((n) => {
        const plate = PLATES[n];
        return (
          <g key={plate.key}>
            <g
              transform={`translate(0 ${shift[n].toFixed(2)})`}
              className="sfr-plate"
              data-tone={plate.tone}
              data-plate={plate.key}
            >
              <PlateBody plate={plate} selected={selected} />
            </g>
            {n > 0 && (
              <g
                className="sfr-gap"
                data-tone={PLATES[n - 1].tone}
                opacity={seg(pose.open, 0.3, 0.6)}
              >
                {dropsOf(pose, (n - 1) as 0 | 1).map((d, k) => (
                  <g key={k}>
                    <path
                      d={`M${d.x.toFixed(2)} ${d.y0.toFixed(2)}V${d.y1.toFixed(2)}`}
                      className="sfr-drop"
                    />
                    <rect x={d.x - 2.5} y={d.y1 - 2.5} width={5} height={5} className="sfr-end" />
                  </g>
                ))}
              </g>
            )}
          </g>
        );
      })}

      {/* -- under the stack: the figures, and what the tones mean -------- */}
      <polygon
        className="sfr-chip"
        points={ptsOf([
          [BOX.x0 + 16, BOX.y1 - 92],
          [BOX.x0 + 478, BOX.y1 - 92],
          [BOX.x0 + 492, BOX.y1 - 78],
          [BOX.x0 + 492, BOX.y1 - 18],
          [BOX.x0 + 36, BOX.y1 - 18],
          [BOX.x0 + 36, BOX.y1 - 26],
          [BOX.x0 + 16, BOX.y1 - 26],
        ])}
      />
      {cells.map(([label, value], k) => (
        <g key={label}>
          <text x={BOX.x0 + 34 + k * 76} y={BOX.y1 - 68} className="sfr-t sfr-ink-3">
            {label}
          </text>
          <Tight x={BOX.x0 + 34 + k * 76} y={BOX.y1 - 36} size={28} className="sfr-ink">
            {value}
          </Tight>
        </g>
      ))}
      {legend.map((it) => {
        const x = ROW_X + 14 + it.x;
        const y = BOX.y1 - 68 + it.row * 30;
        return (
          <g key={it.word} data-tone={it.tone}>
            <g className={it.state === "lit" ? "sfr-lit" : undefined}>
              <ModuleShape
                x={x}
                y={y}
                rot={0}
                kind="link"
                state={it.state}
                l={28}
                t={12}
                selected={it.sel}
              />
            </g>
            <text x={x + 24} y={y + 4.5} className="sfr-t sfr-ink-2">
              {it.word}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
