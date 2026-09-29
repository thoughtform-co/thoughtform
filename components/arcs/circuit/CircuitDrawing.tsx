import type { CSSProperties } from "react";

import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { band, housing } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

import type { ProofGlyph } from "@/components/landing/home-v2/services/casefile/proofGlyphData";

import { CIRCUIT_GLYPHS, PERSON_MARK } from "./circuitGlyphData";
import {
  CIRCUIT_STATES,
  type CirLetter,
  type CirMark,
  type CirModule,
  type CirPart,
  type CirWire,
  type CircuitGeom,
  type Ink,
  type PadTone,
  type Pose,
} from "./circuitLayout";

/**
 * CircuitDrawing — THE CIRCUIT's marks (ADR-133), one SVG. Server-safe: no
 * hooks, no state. The map and the crew both draw with these primitives.
 *
 * ⚠ EVERY PART CARRIES ITS POSES AS CUSTOM PROPERTIES and the sheet picks one
 * by `data-cir-state`. Since U2 retired the pinned scene nothing travels, so
 * every pose is identity and the figure rests at state `a`; the record stays
 * because the crew's wires read it.
 * ⚠ NO `transform` ATTRIBUTE ANYWHERE: the pose is the CSS property, identity
 * where the fit test reads it.
 *
 * ⚠ EVERY COLOUR IS A `--cir-*` TOKEN, declared on `.arc-cir` as an alias of
 * the ADR-077 ramp (the board's own idiom), never a literal.
 */

const INK: Record<Ink, string> = {
  ink: "var(--cir-ink)",
  ink2: "var(--cir-ink-2)",
  ink3: "var(--cir-ink-3)",
  "gold-ink": "var(--cir-gold-ink)",
  "green-ink": "var(--cir-green-ink)",
  "on-gold": "var(--cir-on-gold)",
  "on-gold-2": "var(--cir-on-gold-2)",
};

const px = (n: number) => `${Math.round(n * 100) / 100}px`;
const poseTransform = (p: Pose) => `translate(${px(p.tx)}, ${px(p.ty)}) scale(${p.k})`;

function partVars(part: CirPart): CSSProperties {
  const v: Record<string, string> = {};
  for (const s of CIRCUIT_STATES) {
    const p = part.poses[s];
    v[`--p${s}`] = poseTransform(p);
    v[`--o${s}`] = String(p.o);
    v[`--c${s}`] = p.shut
      ? "inset(0 50% 0 50%)"
      : p.fold
        ? `inset(0 0 ${Math.round((1 - p.fold) * 1000) / 10}% 0)`
        : "inset(0 0 0 0)";
    v[`--d${s}`] = `${part.delays[s]}ms`;
    if (part.morph) v[`--x${s}`] = `path("${part.morph[s]}")`;
  }
  return v as CSSProperties;
}

function wireVars(w: CirWire): CSSProperties {
  const v: Record<string, string | number> = { "--l": w.len };
  for (const s of CIRCUIT_STATES) {
    // Drawn or not, and how loud: a receded wire is fully drawn and faint.
    v[`--w${s}`] = w.on[s] > 0 ? 1 : 0;
    v[`--wo${s}`] = w.on[s] > 0 ? w.on[s] : 1;
    v[`--d${s}`] = `${w.delays[s]}ms`;
  }
  return v as CSSProperties;
}

interface CircuitDrawingProps {
  geom: CircuitGeom;
  /** Unique per instance on the page — the dot bed's pattern id. */
  uid: string;
  label: string;
}

export function CircuitDrawing({ geom, uid, label }: CircuitDrawingProps) {
  const dots = `cir-dots-${uid}`;
  return (
    <svg
      className="arc-cir__svg"
      viewBox={`0 0 ${geom.vb.w} ${geom.vb.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      <defs>
        <pattern id={dots} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="8" cy="8" r="1.1" fill="var(--cir-dot)" />
        </pattern>
      </defs>
      {/* The bed first, then the ribbons, then the objects — R4's order: an
          object's opaque plate hides the entry of the wire that feeds it. */}
      {geom.parts
        .filter((p) => p.group === "bed")
        .map((p) => (
          <g key={p.id} className="cq cq--bed" data-cir-part={p.id} style={partVars(p)}>
            {p.modules.map((m) => (
              <rect
                key={m.id}
                x={m.rect.x}
                y={m.rect.y}
                width={m.rect.w}
                height={m.rect.h}
                fill={`url(#${dots})`}
              />
            ))}
          </g>
        ))}
      {geom.wires.map((w) => (
        <Wire key={w.id} w={w} />
      ))}
      {geom.parts
        .filter((p) => p.group !== "bed")
        .map((p) => (
          <Part key={p.id} part={p} />
        ))}
    </svg>
  );
}

export function Wire({ w }: { w: CirWire }) {
  const stroke = w.paint === "green" ? "var(--cir-green)" : "var(--cir-gold-line)";
  return (
    <g
      className={`cw cw--${w.wires === 8 ? "bus" : "tap"}`}
      data-cir-wire={w.id}
      style={wireVars(w)}
      stroke={stroke}
      fill="none"
      strokeWidth="1"
    >
      {ribbonPaths(w.pts, w.wires, w.pitch).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

function Part({ part }: { part: CirPart }) {
  return (
    <g className={`cq cq--${part.group}`} data-cir-part={part.id} style={partVars(part)}>
      {part.modules.map((m, i) => (
        <Module key={m.id} m={m} morph={i === 0 && Boolean(part.morph)} />
      ))}
      {part.marks.map((mark, i) => (
        <Mark key={i} mark={mark} />
      ))}
      {part.letters.map((l) => (
        <Letter key={l.slot} l={l} />
      ))}
    </g>
  );
}

interface Paint {
  fill: string;
  wash?: string;
  stroke: string;
  rule?: boolean;
  dash?: string;
}
const PAINT: Record<Exclude<CirModule["paint"], "row">, Paint> = {
  plate: { fill: "var(--cir-plate)", stroke: "var(--cir-edge)", rule: true },
  gold: {
    fill: "var(--cir-plate)",
    wash: "var(--cir-gold-wash)",
    stroke: "var(--cir-gold-line)",
    rule: true,
  },
  "gold-fill": { fill: "var(--cir-gold)", stroke: "var(--cir-gold-line)" },
  green: {
    fill: "var(--cir-plate)",
    wash: "var(--cir-green-wash)",
    stroke: "var(--cir-green)",
    rule: true,
  },
  future: { fill: "var(--cir-plate)", stroke: "var(--cir-edge-strong)", dash: "5 5" },
  well: { fill: "var(--cir-well)", stroke: "var(--cir-edge)" },
  "well-gold": { fill: "var(--cir-gold-wash)", stroke: "var(--cir-gold-line)" },
  "gold-future": { fill: "var(--cir-plate)", stroke: "var(--cir-gold-line)", dash: "5 5" },
  frame: { fill: "var(--cir-gold-wash)", stroke: "var(--cir-gold-line)", dash: "5 5" },
  die: { fill: "none", stroke: "var(--cir-rule)", dash: "3 5" },
};

export function Module({ m, morph = false }: { m: CirModule; morph?: boolean }) {
  const { x, y, w, h } = m.rect;
  if (m.paint === "row") {
    return (
      <line
        className="arc-cir__row"
        x1={x}
        y1={y + h}
        x2={x + w}
        y2={y + h}
        stroke="var(--cir-line)"
      />
    );
  }
  const p = PAINT[m.paint];
  if (m.shape === "dodecagon") return <Dodecagon m={m} p={p} />;
  /* ⚠ `band` IS THE TOP-RIGHT-ONLY HOUSING: the board chip's silhouette,
     which the map's workflow cards copy exactly (ADR-133 U2). */
  const d =
    m.notch === "tr"
      ? band(x, y, w, h, m.cut)
      : m.cut > 0
        ? housing(x, y, w, h, m.cut)
        : `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  /* ⚠ THE MORPHING PLATE IS ONE PATH, fill and stroke together, so its `d`
     is the one property the sheet transitions — two paths would be two
     morphs that can drift a frame apart. */
  if (morph) {
    return (
      <path
        className="arc-cir__morph"
        data-cir-module={m.id}
        d={d}
        fill={p.fill}
        stroke={p.stroke}
      />
    );
  }
  return (
    <g data-cir-module={m.id}>
      <path d={d} fill={p.fill} />
      {p.wash ? <path d={d} fill={p.wash} /> : null}
      {p.fill === "var(--cir-plate)" ? <path d={d} fill="var(--cir-sheen)" /> : null}
      <path d={d} fill="none" stroke={p.stroke} strokeDasharray={p.dash} />
      {p.rule ? (
        <line x1={x} y1={y + 1} x2={x + w - m.cut} y2={y + 1} stroke={p.stroke} strokeWidth="2" />
      ) : null}
      {m.head ? (
        <>
          <path d={band(x, y, w, m.head, m.cut)} fill="var(--cir-band)" />
          <line x1={x} y1={y + m.head} x2={x + w} y2={y + m.head} stroke="var(--cir-line)" />
        </>
      ) : null}
    </g>
  );
}

/** A twelve-sided outline inscribed in radius `r` about (cx, cy), a vertex
 *  at each cardinal. */
const dodecagon = (cx: number, cy: number, r: number) =>
  Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    const px = Math.round((cx + r * Math.cos(a)) * 100) / 100;
    const py = Math.round((cy - r * Math.sin(a)) * 100) / 100;
    return `${i === 0 ? "M" : "L"}${px},${py}`;
  }).join(" ") + " Z";

/** THE MARKETING OS (ADR-133 U2): the one plate on the map that is not a card
 *  — the carrier's twelve-sided housing (ADR-070 U34), a 2px outline and a
 *  bezel inset inside it (the services cards' device), the plate's ground and
 *  its wash. It carries no top rule: a rule is a card's, and it would run
 *  across a vertex. */
function Dodecagon({ m, p }: { m: CirModule; p: Paint }) {
  const r = m.rect.w / 2;
  const cx = m.rect.x + r;
  const cy = m.rect.y + r;
  const d = dodecagon(cx, cy, r);
  return (
    <g data-cir-module={m.id}>
      <path d={d} fill={p.fill} />
      {p.wash ? <path d={d} fill={p.wash} /> : null}
      <path d={d} fill="var(--cir-sheen)" />
      <path d={d} fill="none" stroke={p.stroke} strokeWidth="2" />
      <path d={dodecagon(cx, cy, r - 12)} fill="none" stroke={p.stroke} opacity={0.55} />
    </g>
  );
}

const TONE: Record<PadTone, { fill: string; stroke?: string }> = {
  gold: { fill: "var(--cir-gold)" },
  dawn: { fill: "var(--cir-ink-3)" },
  "on-gold": { fill: "var(--cir-on-gold)" },
  green: { fill: "var(--cir-green)" },
  "ring-gold": { fill: "var(--cir-gold-wash)", stroke: "var(--cir-gold-line)" },
  "ring-dawn": { fill: "none", stroke: "var(--cir-edge-strong)" },
};

function Pixels({
  g,
  x,
  y,
  c,
  human,
}: {
  g: ProofGlyph;
  x: number;
  y: number;
  c: number;
  human?: boolean;
}) {
  return (
    <g className="arc-cir__glyph">
      {g.sk.map(([col, row]) => (
        <rect
          key={`sk-${col}-${row}`}
          x={x + col * c}
          y={y + row * c}
          width={c}
          height={c}
          fill={human ? "var(--cir-green)" : "var(--cir-ink)"}
          opacity={0.85}
        />
      ))}
      {g.dr.map(([col, row]) => (
        <rect
          key={`dr-${col}-${row}`}
          x={x + col * c}
          y={y + row * c}
          width={c}
          height={c}
          fill="var(--cir-ink)"
          opacity={0.28}
        />
      ))}
      {g.sig.map(([col, row]) => (
        <rect
          key={`sig-${col}-${row}`}
          x={x + col * c}
          y={y + row * c}
          width={c}
          height={c}
          fill={human ? "var(--cir-green)" : "var(--cir-gold)"}
        />
      ))}
    </g>
  );
}

export function Mark({ mark }: { mark: CirMark }) {
  switch (mark.kind) {
    case "person":
      return <Pixels g={PERSON_MARK} x={mark.x} y={mark.y} c={mark.cell} human />;
    case "glyph": {
      const g = CIRCUIT_GLYPHS[mark.key];
      const c = mark.cell;
      return (
        <g className="arc-cir__glyph">
          {g.sk.map(([col, row]) => (
            <rect
              key={`sk-${col}-${row}`}
              x={mark.x + col * c}
              y={mark.y + row * c}
              width={c}
              height={c}
              fill="var(--cir-ink)"
              opacity={0.85}
            />
          ))}
          {g.dr.map(([col, row]) => (
            <rect
              key={`dr-${col}-${row}`}
              x={mark.x + col * c}
              y={mark.y + row * c}
              width={c}
              height={c}
              fill="var(--cir-ink)"
              opacity={0.28}
            />
          ))}
          {g.sig.map(([col, row]) => (
            <rect
              key={`sig-${col}-${row}`}
              x={mark.x + col * c}
              y={mark.y + row * c}
              width={c}
              height={c}
              fill="var(--cir-gold)"
            />
          ))}
        </g>
      );
    }
    case "pad": {
      const t = TONE[mark.tone];
      return (
        <rect
          x={mark.x}
          y={mark.y}
          width={mark.w}
          height={mark.h}
          fill={t.fill}
          stroke={t.stroke}
        />
      );
    }
    case "rule":
      return (
        <line
          x1={mark.x1}
          y1={mark.y1}
          x2={mark.x2}
          y2={mark.y2}
          stroke={mark.tone === "on-gold" ? "var(--cir-on-gold-2)" : "var(--cir-line)"}
        />
      );
    case "via":
      return (
        <circle cx={mark.cx} cy={mark.cy} r={mark.r} fill="none" stroke="var(--cir-edge-strong)" />
      );
  }
}

/** One lettered string. Size and tracking are ATTRIBUTES, outside the CSS
 *  ratchet; the face is a class the sheet resolves to the house's fonts. */
export function Letter({ l }: { l: CirLetter }) {
  return (
    <text
      /* ⚠ THE LIT WEIGHT IS A CLASS, NOT THE ATTRIBUTE: the sheet sets the
         face's weight on `text`, and CSS beats a presentation attribute. */
      className={
        [l.face === "sans" ? "arc-cir__sans" : "", l.lit ? "arc-cir__lit" : ""]
          .filter(Boolean)
          .join(" ") || undefined
      }
      x={l.x}
      y={l.y}
      fontSize={l.fs}
      letterSpacing={l.face === "mono" ? `${l.track}em` : undefined}
      textAnchor={l.anchor === "middle" ? "middle" : undefined}
      fill={INK[l.ink]}
    >
      {l.text}
    </text>
  );
}
