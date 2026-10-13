/* S2 · PRINT. The stack as printed hardware, after Marathon's graphic
   realism: flat opaque planes and no outline anywhere, an edge being only
   where one flat colour stops and the next begins. What makes a plate more
   than a block is what is PRINTED on it, and that the three differ in kind:

     · the team: a thin printed sheet. Its four workstreams are one fat bone
       circuit with four round terminals, the tools' rail down one edge;
     · the layer, the one lit plate: a laminate of three strata, each lettered
       on its own wall (they are its three courses), a hazard-striped flank,
       and the one giant stepped numeral in the ground's black on its face;
     · the agents: a board with blocks standing on it, the black chip and four
       bone modules, wired in fat bone traces.

   Every plate carries a black title band along its front-left edge with its
   number, its step and a ticked box for each thing it holds: the strip a
   closed stack still shows, so closed it reads as three labelled trays.
   Ducts cross the gaps as the stack opens (the team's four down onto the
   layer, the layer's four down onto the agents' modules). Outside, a bracket
   and a label a plate, the height and one pitch ruled to scale, and a code
   plate: every figure on it is the stack's own (`factsOf`).

   A giant numeral on EVERY face was tried four ways (under the pictogram,
   over it, knocked out of it, as a tone-on-tone livery) and each time the
   two fought until neither could be read: the team's terminals sit where
   its figures would. So the numerals moved to the band and, large, to the
   labels; only the layer, whose face is free, keeps a giant one.

   Brand tones only. Nothing moves. */

import { useId } from "react";

import {
  type Box,
  boxFaces,
  factsOf,
  fitFrame,
  type FormProps,
  type Frame,
  leftMatrix,
  over,
  planeMatrix,
  type Plate,
  plateFrame,
  PLATES,
  poseAt,
  project,
  ptsOf,
  rightMatrix,
  SIDE,
  type Tone,
  toneVar,
} from "../model";

import { numeralPath, numeralSize } from "./numerals";

const W = 1600;
const H = 1000;
/* seated for the opened pose, left of the middle: the labels stand on its right */
const FRAME = fitFrame(W, H, poseAt(1), { pad: 50, cx: 760 });
/** Face artwork is drawn a hundred to the plate unit, so type sets at whole sizes. */
const K = 0.01;
const A = 100;

const VOID = "var(--sf-void)";
const BONE = "var(--sf-bone)";

/** A plate's three flat colours. */
interface Skin {
  plane: string;
  left: string;
  right: string;
}
const skinOf = (tone: Tone, a: number): Skin => ({
  plane: over(tone, a),
  left: over(tone, a * 0.64),
  right: over(tone, a * 0.4),
});
const SKIN: readonly [Skin, Skin, Skin] = [
  skinOf("green", 1),
  skinOf("gold", 1),
  skinOf("bone", 0.56),
];

/* -- flat solids ----------------------------------------------------------- */

/** One box as three flat faces. The silhouette goes down first in the darkest
    face's colour, so no hairline of ground shows through the seams. */
function Solid({ f, b, skin, right }: { f: Frame; b: Box; skin: Skin; right?: string }) {
  const faces = boxFaces(f, b);
  return (
    <g>
      <polygon points={ptsOf(faces.outline)} fill={skin.right} />
      <polygon points={ptsOf(faces.left)} fill={skin.left} />
      <polygon points={ptsOf(faces.right)} fill={right ?? skin.right} />
      <polygon points={ptsOf(faces.top)} fill={skin.plane} />
    </g>
  );
}

/** A duct between two plates: only its two walls are ever seen. */
function Duct({
  x,
  y,
  z0,
  z1,
  tone,
}: {
  x: number;
  y: number;
  z0: number;
  z1: number;
  tone: Tone;
}) {
  if (z1 - z0 < 0.05) return null;
  const r = 0.16;
  const foot = 0.32;
  const faces = boxFaces(FRAME, { x0: x - r, x1: x + r, y0: y - r, y1: y + r, z0, z1 });
  /* a flange where it lands, so it stands on the plate instead of ending in it */
  const flange = boxFaces(FRAME, {
    x0: x - foot,
    x1: x + foot,
    y0: y - foot,
    y1: y + foot,
    z0,
    z1: Math.min(z1, z0 + 0.12),
  });
  return (
    <g>
      <polygon points={ptsOf(flange.outline)} fill={over(tone, 0.5)} />
      <polygon points={ptsOf(flange.left)} fill={over(tone, 0.78)} />
      <polygon points={ptsOf(flange.top)} fill={over(tone, 1)} />
      <polygon points={ptsOf(faces.left)} fill={over(tone, 0.78)} />
      <polygon points={ptsOf(faces.right)} fill={over(tone, 0.5)} />
    </g>
  );
}

/* -- what is printed on a face --------------------------------------------- */

const STROKE = 40;
const TERMINAL = 68;

const centre = (b: Box): [number, number] => [((b.x0 + b.x1) / 2) * A, ((b.y0 + b.y1) / 2) * A];

/** What a plate's pictogram is made of: fat runs, and the round terminals
    they end in. One weight throughout. */
interface Glyph {
  runs: string;
  /** Finer strokes: a rail's teeth. */
  teeth: string;
  terminals: [number, number][];
}

/* the team: four terminals on one circuit, the tools' rail down its edge */
function teamGlyph(plate: Plate): Glyph {
  const terminals = plate.features.filter((t) => t.kind === "tile").map((t) => centre(t.box));
  const [strategy, production, review, ops] = terminals;
  const rail = plate.features.find((t) => t.kind === "rail")!.box;
  const rx = ((rail.x0 + rail.x1) / 2) * A;
  const top = rail.y0 * A + 40;
  const link = (strategy[1] + review[1]) / 2 + 60;
  return {
    runs: [
      `M${strategy[0]} ${strategy[1]}V${review[1]}`,
      `M${production[0]} ${production[1]}V${ops[1]}`,
      `M${strategy[0]} ${link}H${production[0]}`,
      /* the tools the team already has: a rail, a tooth a tool, tied in */
      `M${rx} ${top}V${review[1]}H${review[0]}`,
    ].join(""),
    teeth: Array.from({ length: 5 }, (_, i) => `M${rx} ${top + i * 92}h-46`).join(""),
    terminals,
  };
}

/* the layer has no pictogram printed on it: its three courses are the three
   strata themselves, each lettered on its own wall. Its face carries the one
   giant numeral instead (below). */
const NO_GLYPH: Glyph = { runs: "", teeth: "", terminals: [] };

/* the agents: the wires from the chip to each module (the chip and the
   modules themselves stand on the board as blocks) */
function agentsGlyph(plate: Plate): Glyph {
  return {
    runs: plate.traces
      .map((t) => t.pts.map(([x, y], i) => `${i ? "L" : "M"}${x * A} ${y * A}`).join(""))
      .join(""),
    teeth: "",
    terminals: [],
  };
}

const GLYPH: readonly [Glyph, Glyph, Glyph] = [
  teamGlyph(PLATES[0]),
  NO_GLYPH,
  agentsGlyph(PLATES[2]),
];

/** A pictogram in one ink. */
function Circuit({ glyph, ink }: { glyph: Glyph; ink: string }) {
  return (
    <g>
      {glyph.runs && (
        <path d={glyph.runs} fill="none" stroke={ink} strokeWidth={STROKE} strokeLinejoin="miter" />
      )}
      {glyph.teeth && <path d={glyph.teeth} fill="none" stroke={ink} strokeWidth={22} />}
      {glyph.terminals.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={TERMINAL} fill={ink} />
      ))}
    </g>
  );
}

/** The small registration crosses a printed face carries in its back corners. */
function Crosses() {
  const at = [
    [58, 58],
    [742, 58],
  ];
  return (
    <path
      d={at.map(([x, y]) => `M${x - 16} ${y - 4}h32v8h-32zM${x - 4} ${y - 16}h8v32h-8z`).join("")}
      fill={VOID}
    />
  );
}

/* the title band: a black strip along the face's front-left edge, the one
   part of a plate a closed stack still shows, so it carries what the plate is */
const BAND = { x0: 16, x1: 784, y0: 704, y1: 784 };
const BAND_NUM = 9;
const TICK = 32;
/* the lit plate's giant numeral: stepped figures in the ground's black,
   filling the face above its band */
const GIANT = 64;
const GIANT_AT = `translate(${(SIDE * A - numeralSize("00", GIANT).w) / 2} ${
  BAND.y0 - numeralSize("00", GIANT).h - 22
})`;

/**
 * A top face's print: the pictogram in bone, and the title band in the
 * ground's black with the plate's number, its step and a ticked box for each
 * thing it holds knocked out of it in the plane's own colour.
 */
function FacePrint({ plate, plane }: { plate: Plate; plane: string }) {
  const glyph = GLYPH[plate.i];
  const mid = (BAND.y0 + BAND.y1) / 2;
  const n = plate.holds.length;
  return (
    <g>
      {plate.lit && <path d={numeralPath(plate.n, GIANT)} transform={GIANT_AT} fill={VOID} />}
      <Circuit glyph={glyph} ink={BONE} />
      {/* a terminal's eye */}
      {glyph.terminals.map(([x, y], i) => (
        <rect key={i} x={x - 15} y={y - 15} width={30} height={30} fill={VOID} />
      ))}
      <Crosses />

      <rect
        x={BAND.x0}
        y={BAND.y0}
        width={BAND.x1 - BAND.x0}
        height={BAND.y1 - BAND.y0}
        fill={VOID}
      />
      <path
        d={numeralPath(plate.n, BAND_NUM)}
        transform={`translate(${BAND.x0 + 18} ${mid - (7 * BAND_NUM) / 2})`}
        fill={plane}
      />
      <text className="sfp-band" x={BAND.x0 + 144} y={mid + 17} fontSize={48}>
        {plate.step.toUpperCase()}
      </text>
      {Array.from({ length: n }, (_, i) => {
        const x = BAND.x1 - 22 - (n - i) * (TICK + 12) + 12;
        return (
          <g key={i}>
            <rect x={x} y={mid - TICK / 2} width={TICK} height={TICK} fill={plane} />
            <rect x={x + 10} y={mid - 6} width={12} height={12} fill={VOID} />
          </g>
        );
      })}
    </g>
  );
}

/* -- one plate ------------------------------------------------------------- */

const WALL_TYPE = 27;

/** Type along a wall, in the ground's black: the left wall reads down toward
    the front corner, the right wall up away from it. */
function WallType({
  f,
  side,
  z1,
  depth,
  children,
}: {
  f: Frame;
  side: "left" | "right";
  z1: number;
  depth: number;
  children: string;
}) {
  const m = side === "left" ? leftMatrix(f, 0, SIDE, z1, K) : rightMatrix(f, SIDE, SIDE, z1, K);
  return (
    <text
      className="sfp-wall"
      transform={m}
      x={44}
      y={(depth * A + WALL_TYPE * 0.7) / 2}
      fontSize={WALL_TYPE}
    >
      {children}
    </text>
  );
}

function PlateSolid({ plate, f, hazard }: { plate: Plate; f: Frame; hazard: string }) {
  const skin = SKIN[plate.i];
  const topZ = plate.body[plate.body.length - 1].z1;
  return (
    <g>
      {plate.body.map((b, k) => (
        <Solid key={k} f={f} b={b} skin={skin} right={plate.lit ? `url(#${hazard})` : undefined} />
      ))}

      {/* the print on the top face */}
      <g transform={planeMatrix(f, 0, 0, topZ, K)}>
        <FacePrint plate={plate} plane={skin.plane} />
      </g>

      {/* its name along its walls; the layer letters each stratum instead */}
      {plate.key === "layer" ? (
        plate.features.map((s) => (
          <WallType key={s.id} f={f} side="left" z1={s.box.z1} depth={s.box.z1 - s.box.z0}>
            {s.label.toUpperCase()}
          </WallType>
        ))
      ) : (
        <>
          <WallType f={f} side="left" z1={topZ} depth={topZ}>
            {plate.name.toUpperCase()}
          </WallType>
        </>
      )}

      {/* what stands on the agents' board: the chip, black; the modules, bone */}
      {plate.key === "agents" &&
        [...plate.features]
          .sort((a, b) => a.box.x0 + a.box.y0 - (b.box.x0 + b.box.y0))
          .map((t) => {
            const chip = t.kind === "chip";
            const [cx, cy] = [(t.box.x0 + t.box.x1) / 2, (t.box.y0 + t.box.y1) / 2];
            const eye = chip ? 0.36 : 0.2;
            return (
              <g key={t.id}>
                <Solid f={f} b={t.box} skin={chip ? skinOf("bone", 0.17) : skinOf("bone", 1)} />
                <polygon
                  points={ptsOf(
                    boxFaces(f, {
                      x0: cx - eye,
                      x1: cx + eye,
                      y0: cy - eye,
                      y1: cy + eye,
                      z0: t.box.z1,
                      z1: t.box.z1,
                    }).top
                  )}
                  fill={chip ? BONE : VOID}
                />
              </g>
            );
          })}
    </g>
  );
}

/* -- the column of labels -------------------------------------------------- */

const COL_X = 1128;

const labelCols = (plate: Plate) => (plate.holds.length > 3 ? 2 : 3);
const labelH = (plate: Plate) => 70 + Math.ceil(plate.holds.length / labelCols(plate)) * 24;
/** Where the leader meets a label, below the label's top. */
const LABEL_ARM = 26;

function Label({ plate, top }: { plate: Plate; top: number }) {
  const tone = toneVar(plate.tone);
  const cols = labelCols(plate);
  const colW = cols === 2 ? 196 : 124;
  const h = labelH(plate);
  return (
    <g transform={`translate(${COL_X} ${top})`}>
      {/* the bracket: a bar the label's height, a foot at each end */}
      <path d={`M0 0h16v6h-10v${h - 12}h10v6h-16z`} fill={tone} />
      <path d={numeralPath(plate.n, 7)} transform="translate(34 2)" fill={tone} />
      <text className="sfp-step" x={126} y={40} style={{ fill: plate.lit ? tone : BONE }}>
        {plate.step.toUpperCase()}
      </text>
      <text className="sfp-name" x={128} y={64}>
        {plate.name.toUpperCase()}
      </text>
      {plate.holds.map((name, i) => {
        const x = 36 + (i % cols) * colW;
        const ly = 80 + Math.floor(i / cols) * 24;
        return (
          <g key={name}>
            <rect x={x} y={ly} width={14} height={14} fill={tone} />
            <rect x={x + 4.5} y={ly + 4.5} width={5} height={5} fill={VOID} />
            <text className="sfp-hold" x={x + 24} y={ly + 12.5}>
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* -- the drawing ----------------------------------------------------------- */

export function Print({ open }: FormProps) {
  const uid = useId().replace(/:/g, "");
  const hazard = `sfp-hazard-${uid}`;
  const pose = poseAt(open);
  const facts = factsOf(pose);
  const frames = [0, 1, 2].map((i) => plateFrame(FRAME, pose, i as 0 | 1 | 2));
  const [team, layer, agents] = PLATES;

  /* the hazard flank: its stripes lie in the layer's right wall */
  const stripe = 14;
  const hazardAt = rightMatrix(frames[1], SIDE, SIDE, layer.top, K);

  /* the ducts: between one plate's top and the next one's floor */
  const teamDucts = team.features
    .filter((t) => t.kind === "tile")
    .map((t) => ({ x: (t.box.x0 + t.box.x1) / 2, y: (t.box.y0 + t.box.y1) / 2 }))
    .sort((a, b) => a.x + a.y - (b.x + b.y));
  const layerDucts = agents.features
    .filter((t) => t.kind === "module")
    .map((t) => ({ x: (t.box.x0 + t.box.x1) / 2, y: (t.box.y0 + t.box.y1) / 2, z: t.box.z1 }))
    .sort((a, b) => a.x + a.y - (b.x + b.y));

  /* the labels: level with each plate's right corner where there is room,
     pushed apart about the layer's where the stack is closed */
  const corners = PLATES.map((plate) => project(frames[plate.i], SIDE, 0, plate.top));
  const want = corners.map(([, y]) => y - LABEL_ARM);
  const GAP = 14;
  const tops = [
    Math.min(want[0], want[1] - labelH(team) - GAP),
    want[1],
    Math.max(want[2], want[1] + labelH(layer) + GAP),
  ];

  /* the rule on the left: the stack's own height and pitch, to scale */
  const leftX = project(FRAME, 0, SIDE, 0)[0];
  const yTop = project(frames[0], 0, SIDE, team.top)[1];
  const yBot = project(frames[2], 0, SIDE, 0)[1];
  const yF0 = project(frames[0], 0, SIDE, 0)[1];
  const yF1 = project(frames[1], 0, SIDE, 0)[1];
  const hx = leftX - 96;
  const px = leftX - 44;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="sf-svg sfp"
      role="img"
      aria-label="The stack as printed hardware: three flat-coloured plates with a black title band each, 01 Navigate, 02 Encode and 03 Build. The team's plate is printed with a circuit of four terminals, the layer's with a giant 02 over three lettered strata, and the agents' board carries a chip and four modules. A label for each stands on the right; the stack's height and pitch are ruled on the left."
    >
      <defs>
        <pattern
          id={hazard}
          patternUnits="userSpaceOnUse"
          width={stripe * 2}
          height={stripe * 2}
          patternTransform={hazardAt}
        >
          <rect width={stripe * 2} height={stripe * 2} fill={over("gold", 1)} />
          <path
            d={`M0 ${stripe * 2}L${stripe * 2} 0H${stripe}L0 ${stripe}ZM${stripe * 2} ${stripe}L${stripe} ${stripe * 2}H${stripe * 2}Z`}
            fill={VOID}
          />
        </pattern>
      </defs>

      {/* back to front: the board, what drops onto it, the layer, what drops
          onto that, the team */}
      <PlateSolid plate={agents} f={frames[2]} hazard={hazard} />
      {layerDucts.map((d, i) => (
        <Duct key={i} x={d.x} y={d.y} z0={pose.lift[2] + d.z} z1={pose.lift[1]} tone="gold" />
      ))}
      <PlateSolid plate={layer} f={frames[1]} hazard={hazard} />
      {teamDucts.map((d, i) => (
        <Duct
          key={i}
          x={d.x}
          y={d.y}
          z0={pose.lift[1] + layer.top}
          z1={pose.lift[0]}
          tone="green"
        />
      ))}
      <PlateSolid plate={team} f={frames[0]} hazard={hazard} />

      {/* a bracket and a label a plate, on a leader from its right corner */}
      {PLATES.map((plate) => {
        const [cx, cy] = corners[plate.i];
        const ly = tops[plate.i] + LABEL_ARM;
        const jog = COL_X - 44;
        return (
          <g key={plate.key}>
            <path
              d={`M${cx + 14} ${cy}H${jog}V${ly}H${COL_X - 10}`}
              fill="none"
              stroke={toneVar(plate.tone)}
              strokeWidth={4}
              strokeLinejoin="miter"
            />
            <Label plate={plate} top={tops[plate.i]} />
          </g>
        );
      })}

      {/* the height, top of the team to the agents' floor, and one pitch */}
      <path
        d={`M${hx - 2} ${yTop}h4v${yBot - yTop}h-4zM${hx - 12} ${yTop}h24v4h-24zM${hx - 12} ${yBot - 4}h24v4h-24z`}
        fill={BONE}
      />
      <path
        d={`M${px - 2} ${yF0}h4v${yF1 - yF0}h-4zM${px - 10} ${yF0}h20v4h-20zM${px - 10} ${yF1 - 4}h20v4h-20z`}
        fill={toneVar("gold")}
      />
      <text
        className="sfp-rule"
        transform={`translate(${hx - 14} ${(yTop + yBot) / 2}) rotate(-90)`}
      >
        {`HEIGHT ${facts.height.toFixed(2)}`}
      </text>
      <text
        className="sfp-rule sfp-rule--gold"
        transform={`translate(${px - 12} ${(yF0 + yF1) / 2}) rotate(-90)`}
      >
        {`PITCH ${facts.pitch.toFixed(2)}`}
      </text>

      {/* the code plate: bone, printed in black, every figure the stack's own */}
      <g transform="translate(56 772)">
        <rect width={308} height={176} fill={BONE} />
        <rect width={308} height={40} fill={VOID} />
        <rect x={4} y={4} width={300} height={32} fill={BONE} />
        <text className="sfp-code sfp-code--head" x={16} y={27}>
          THE STACK
        </text>
        <path d={numeralPath(String(facts.plates), 11)} transform="translate(18 62)" fill={VOID} />
        <text className="sfp-code" x={96} y={78}>
          {`PLATES   ${facts.plates}`}
        </text>
        <text className="sfp-code" x={96} y={102}>
          {`SIDE     ${facts.side} × ${facts.side}`}
        </text>
        <text className="sfp-code" x={96} y={126}>
          {`PITCH    ${facts.pitch.toFixed(2)}`}
        </text>
        <text className="sfp-code" x={96} y={150}>
          {`OPEN     ${facts.openPct}%`}
        </text>
      </g>
    </svg>
  );
}
