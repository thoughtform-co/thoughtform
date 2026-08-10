// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC — the bind composer. BindRecord → BindComposition.
//
// EVERY MARK IS DERIVED. The mapping (see docs/design/daemoniac/
// GRAMMAR.md for the full table):
//   class      → interior armature (agent triangle · tool diamond ·
//                person-led pentagram · skill none)
//   lane       → the crown station at 12 o'clock (the summoned
//                intelligence outranks the other bindings)
//   skills[]   → ring-station seals + spoke with crossbar tallies
//   connectors → seals with outward stems + terminal rings
//   contexts[] → double-hairline hollow seals (consulted, not commanded)
//   autonomy   → the containment ring itself: bounded = double ring,
//                wide = gated ring, decides-alone = broken ring
//   id         → catalog number + the bearing angle (the send vector)
//
// Inscription order IS the ritual: contain → structure → bind → name →
// orient. The particle rank rides `order`.
// ═══════════════════════════════════════════════════════════════════

import { hashString } from "@/lib/particle-geometry/rng";

import { forgeGlyph, forgeIdeogram, GLYPH_BOX, type GlyphSpec } from "./glyphForge";
import { transformPrimitive } from "./primitives";
import type { Annotation, BindComposition, BindRecord, MarkPrimitive, StrokeWeight } from "./types";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** Containment radius — crown seal (r 12) + bearing fork stay inside
 *  the ±120 bind canvas. */
const R = 100;
/** 12 o'clock in SVG coordinates (y down). */
const CROWN_A = -Math.PI / 2;
const CROWN_HALF = 12 * DEG;
const POLY_R = 68;
const PRIME_R = 20;
const SEAL_R = 8;
const CROWN_SEAL_R = 12;

/** Inscription chapter bases — contain → structure → bind → name → orient. */
const ORD = {
  containment: 0,
  gates: 10,
  armature: 20,
  spokes: 30,
  crown: 40,
  seals: 50,
  prime: 90,
  ideogram: 100,
  bearing: 110,
} as const;

/** Angular distance on the circle. */
function angDist(a: number, b: number): number {
  let d = Math.abs(a - b) % TAU;
  if (d > Math.PI) d = TAU - d;
  return d;
}

/** The send vector's angle — hash-derived, nudged off the crown arc. */
export function bearingAngle(id: string): number {
  let a = CROWN_A + ((hashString(id) % 360) / 360) * TAU;
  for (let i = 0; i < 12 && angDist(a, CROWN_A) < 30 * DEG; i++) a += 40 * DEG;
  return a;
}

interface DomainSector {
  domain: "skills" | "connectors" | "contexts";
  names: readonly string[];
  a0: number;
  a1: number;
}

/** Crown owns a fixed 24° arc at top; active domains split the rest
 *  proportionally to entity count with a 30° floor (empty domain = no
 *  sector — honest). Clockwise (increasing angle, y-down SVG) in fixed
 *  order for cross-plate comparability. */
export function layoutSectors(record: BindRecord): DomainSector[] {
  const domains = [
    { domain: "skills" as const, names: record.skills },
    { domain: "connectors" as const, names: record.connectors },
    { domain: "contexts" as const, names: record.contexts },
  ].filter((d) => d.names.length > 0);
  if (domains.length === 0) return [];

  const available = TAU - 2 * CROWN_HALF;
  const floor = 30 * DEG;
  const total = domains.reduce((s, d) => s + d.names.length, 0);
  let arcs = domains.map((d) => (available * d.names.length) / total);
  // Two-pass floor enforcement (≤3 domains, deterministic).
  for (let pass = 0; pass < domains.length; pass++) {
    const deficit = arcs.reduce((s, a) => s + Math.max(0, floor - a), 0);
    if (deficit <= 0) break;
    const surplus = arcs.reduce((s, a) => s + Math.max(0, a - floor), 0);
    arcs = arcs.map((a) =>
      a < floor ? floor : surplus > 0 ? a - ((a - floor) / surplus) * deficit : a
    );
  }

  let a = CROWN_A + CROWN_HALF;
  return domains.map((d, i) => {
    const sector = { ...d, a0: a, a1: a + arcs[i] };
    a += arcs[i];
    return sector;
  });
}

/** Station angles within a sector — even, half-step inset at the edges. */
function stationAngles(sector: DomainSector): number[] {
  const n = sector.names.length;
  const w = sector.a1 - sector.a0;
  return Array.from({ length: n }, (_, i) => sector.a0 + ((i + 0.5) / n) * w);
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  weight: StrokeWeight,
  order: number,
  role: MarkPrimitive["role"]
): MarkPrimitive {
  return { kind: "line", x1, y1, x2, y2, weight, order, role };
}

function circle(
  cx: number,
  cy: number,
  r: number,
  weight: StrokeWeight,
  order: number,
  role: MarkPrimitive["role"],
  phase = -Math.PI / 2
): MarkPrimitive {
  return { kind: "circle", cx, cy, r, phase, weight, order, role };
}

/** Seat a forged glyph at (cx, cy) with the given letter height —
 *  geometry scales, weights stay in the enumerated stroke set. */
function placeGlyph(
  spec: GlyphSpec,
  cx: number,
  cy: number,
  targetH: number,
  order: number,
  role: MarkPrimitive["role"] = "glyph"
): MarkPrimitive[] {
  const s = targetH / GLYPH_BOX.h;
  return spec.primitives.map((p) => ({
    ...transformPrimitive(p, cx, cy, s),
    order,
    role,
  }));
}

/** Radial tick-bar crossing the containment ring at angle `a`. */
function radialTick(a: number, order: number, inset = 5): MarkPrimitive {
  return line(
    (R - inset) * Math.cos(a),
    (R - inset) * Math.sin(a),
    (R + inset) * Math.cos(a),
    (R + inset) * Math.sin(a),
    0.7,
    order,
    "furniture"
  );
}

/** The containment ring, shaped by autonomy — the single most legible
 *  semantic in the system: the circle either contains or it does not. */
function containmentMarks(record: BindRecord, bearing: number): MarkPrimitive[] {
  const marks: MarkPrimitive[] = [];
  switch (record.autonomy) {
    case "bounded": {
      marks.push(circle(0, 0, R, 1, ORD.containment, "containment", bearing));
      marks.push(circle(0, 0, R - 6, 0.5, ORD.containment + 1, "containment", bearing));
      break;
    }
    case "wide": {
      // Three gate-gaps; the whole gate set rotates off the crown arc.
      const gapHalf = 5 * DEG;
      let base = bearing;
      for (
        let i = 0;
        i < 18 && [0, 1, 2].some((k) => angDist(base + (k * TAU) / 3, CROWN_A) < 26 * DEG);
        i++
      ) {
        base += 20 * DEG;
      }
      for (let k = 0; k < 3; k++) {
        const gapA = base + (k * TAU) / 3;
        const nextGapA = base + ((k + 1) * TAU) / 3;
        marks.push({
          kind: "arc",
          cx: 0,
          cy: 0,
          r: R,
          a0: gapA + gapHalf,
          a1: nextGapA - gapHalf,
          weight: 1,
          order: ORD.containment + k,
          role: "containment",
        });
        marks.push(radialTick(gapA + gapHalf, ORD.gates + k * 2));
        marks.push(radialTick(gapA - gapHalf, ORD.gates + k * 2 + 1));
      }
      break;
    }
    case "decides-alone": {
      // The ring breaks at the bearing — the will leaves through the gap.
      const breakHalf = 6 * DEG;
      marks.push({
        kind: "arc",
        cx: 0,
        cy: 0,
        r: R,
        a0: bearing + breakHalf,
        a1: bearing + TAU - breakHalf,
        weight: 1,
        order: ORD.containment,
        role: "containment",
      });
      for (const end of [bearing + breakHalf, bearing - breakHalf]) {
        marks.push(
          circle(R * Math.cos(end), R * Math.sin(end), 2.2, 0.5, ORD.gates, "furniture", end)
        );
      }
      break;
    }
  }
  return marks;
}

/** Interior armature by class. Vertex 1 points at the crown. */
function armatureMarks(record: BindRecord): MarkPrimitive[] {
  const vertsAt = (n: number): (readonly [number, number])[] =>
    Array.from({ length: n }, (_, i) => {
      const a = CROWN_A + (i * TAU) / n;
      return [POLY_R * Math.cos(a), POLY_R * Math.sin(a)] as const;
    });

  const edges: (readonly [readonly [number, number], readonly [number, number]])[] = [];
  switch (record.class) {
    case "agent": {
      // Triangle, apex at the crown — summon · bind · send.
      const v = vertsAt(3);
      for (let i = 0; i < 3; i++) edges.push([v[i], v[(i + 1) % 3]]);
      break;
    }
    case "tool": {
      // Diamond — the house instrument mark.
      const v = vertsAt(4);
      for (let i = 0; i < 4; i++) edges.push([v[i], v[(i + 1) % 4]]);
      break;
    }
    case "person-led": {
      // Pentagram {5/2}, apex up — the human holds prime.
      const v = vertsAt(5);
      for (let i = 0; i < 5; i++) edges.push([v[i], v[(i + 2) % 5]]);
      break;
    }
    case "skill":
      // No polygon: an inscription, not an entity.
      break;
  }
  return edges.map(([[x1, y1], [x2, y2]], i) =>
    line(x1, y1, x2, y2, 0.7, ORD.armature + i, "armature")
  );
}

/** Spoke from the prime toward a sector midpoint, carrying crossbar
 *  tallies — one per bound entity, the period tally-plus-medallion
 *  redundancy, both derived from the same field. */
function spokeMarks(sector: DomainSector, spokeIdx: number): MarkPrimitive[] {
  const marks: MarkPrimitive[] = [];
  const mid = (sector.a0 + sector.a1) / 2;
  const r0 = PRIME_R + 8;
  const r1 = R - SEAL_R - 4;
  const cos = Math.cos(mid);
  const sin = Math.sin(mid);
  const base = ORD.spokes + spokeIdx * 3;
  marks.push(line(r0 * cos, r0 * sin, r1 * cos, r1 * sin, 0.5, base, "spoke"));

  const n = sector.names.length;
  const bandLen = Math.min(24, n * 3.5);
  const rMid = (r0 + r1) / 2;
  const tickHalf = 3;
  // Perpendicular direction to the spoke.
  const px = -sin;
  const py = cos;
  for (let i = 0; i < n; i++) {
    const tr = n === 1 ? rMid : rMid - bandLen / 2 + (bandLen * i) / (n - 1);
    marks.push(
      line(
        tr * cos - tickHalf * px,
        tr * sin - tickHalf * py,
        tr * cos + tickHalf * px,
        tr * sin + tickHalf * py,
        0.7,
        base + 1,
        "spoke"
      )
    );
  }
  return marks;
}

/** Ring-station seals: skills plain, connectors stemmed + terminal ring
 *  (a connector touches outward), contexts double-hairline hollow
 *  (consulted, not commanded). Each seal letters its entity's Minor
 *  glyph — the name is the seed. */
function sealMarks(
  sector: DomainSector,
  sealBase: number,
  seedTag: string | undefined
): MarkPrimitive[] {
  const marks: MarkPrimitive[] = [];
  const angles = stationAngles(sector);
  angles.forEach((a, i) => {
    const cx = R * Math.cos(a);
    const cy = R * Math.sin(a);
    const order = sealBase + i;
    const glyph = forgeGlyph(sector.names[i], "minor", seedTag);
    switch (sector.domain) {
      case "skills":
        marks.push(circle(cx, cy, SEAL_R, 0.7, order, "seal", a));
        marks.push(...placeGlyph(glyph, cx, cy, 10, order + 0.5));
        break;
      case "connectors": {
        marks.push(circle(cx, cy, SEAL_R, 0.7, order, "seal", a));
        marks.push(...placeGlyph(glyph, cx, cy, 10, order + 0.5));
        const s0 = R + SEAL_R;
        const s1 = R + SEAL_R + 7;
        marks.push(
          line(
            s0 * Math.cos(a),
            s0 * Math.sin(a),
            s1 * Math.cos(a),
            s1 * Math.sin(a),
            0.5,
            order,
            "furniture"
          )
        );
        marks.push(
          circle((s1 + 2) * Math.cos(a), (s1 + 2) * Math.sin(a), 2, 0.5, order, "furniture", a)
        );
        break;
      }
      case "contexts":
        marks.push(circle(cx, cy, SEAL_R, 0.5, order, "seal", a));
        marks.push(circle(cx, cy, SEAL_R - 1.8, 0.3, order, "seal", a));
        marks.push(...placeGlyph(glyph, cx, cy, 9, order + 0.5));
        break;
    }
  });
  return marks;
}

/** The crown station: the lane seal at 12 o'clock, flanked by paired
 *  tick-bars — the summoned intelligence outranks the other bindings.
 *  The lane letters a MAJOR glyph: entity-grade, like the references'
 *  named evils at the ritual's points. */
function crownMarks(record: BindRecord): MarkPrimitive[] {
  const cx = R * Math.cos(CROWN_A);
  const cy = R * Math.sin(CROWN_A);
  return [
    circle(cx, cy, CROWN_SEAL_R, 1, ORD.crown, "seal", CROWN_A),
    ...placeGlyph(forgeGlyph(record.lane, "major", record.seedTag), cx, cy, 15, ORD.crown + 0.5),
    radialTick(CROWN_A - 15 * DEG, ORD.crown + 1),
    radialTick(CROWN_A + 15 * DEG, ORD.crown + 2),
  ];
}

/** The send vector: a trident on the ring exterior at the bearing. */
function bearingMarks(bearing: number): MarkPrimitive[] {
  const marks: MarkPrimitive[] = [];
  const cos = Math.cos(bearing);
  const sin = Math.sin(bearing);
  const r0 = R + 2;
  const rBranch = R + 8;
  marks.push(line(r0 * cos, r0 * sin, rBranch * cos, rBranch * sin, 0.7, ORD.bearing, "furniture"));
  const bx = rBranch * cos;
  const by = rBranch * sin;
  for (const off of [-14 * DEG, 0, 14 * DEG]) {
    const a = bearing + off;
    marks.push(
      line(bx, by, bx + 7 * Math.cos(a), by + 7 * Math.sin(a), 0.5, ORD.bearing + 1, "furniture")
    );
  }
  return marks;
}

/** The Scriptorium Anima column: Minor-grade marks threaded on a
 *  continuous hairline spine. */
function ideogramMarks(
  ideogram: readonly GlyphSpec[],
  x: number,
  letterH: number,
  pitch: number
): MarkPrimitive[] {
  const n = ideogram.length;
  const totalH = (n - 1) * pitch;
  const y0 = -totalH / 2;
  const marks: MarkPrimitive[] = [
    {
      kind: "line",
      x1: x,
      y1: y0 - pitch * 0.55,
      x2: x,
      y2: y0 + totalH + pitch * 0.55,
      weight: 0.3,
      order: ORD.ideogram,
      role: "ideogram",
    },
  ];
  ideogram.forEach((spec, i) => {
    marks.push(
      ...placeGlyph(spec, x, y0 + i * pitch, letterH, ORD.ideogram + 1 + i * 0.1, "ideogram")
    );
  });
  return marks;
}

// ── The apparatus — the record annotating its own bind ───────────

/** PT Mono is monospace, so label width is arithmetic, not a guess:
 *  6.5-unit type × (0.6 advance + 0.08 tracking) per character. */
const CHAR_W = 6.5 * 0.68;
const MARGIN_X = 150;

/** Drafting leader: source → 45° diagonal → horizontal tail ending at
 *  the label's text edge. */
function leader(
  sx: number,
  sy: number,
  lx: number,
  ly: number,
  align: "left" | "right",
  text: string
): (readonly [number, number])[] {
  const w = text.length * CHAR_W;
  const ex = align === "right" ? lx - w - 4 : lx + w + 4;
  const ey = ly - 2.2;
  const dirX = Math.sign(ex - sx) || 1;
  const mx = sx + dirX * Math.abs(ey - sy);
  if ((dirX > 0 && mx >= ex) || (dirX < 0 && mx <= ex)) {
    return [[sx, sy] as const, [ex, ey] as const];
  }
  return [[sx, sy] as const, [mx, ey] as const, [ex, ey] as const];
}

function note(
  text: string,
  sx: number,
  sy: number,
  lx: number,
  ly: number,
  align: "left" | "right"
): Annotation {
  return { text, lx, ly, align, leader: leader(sx, sy, lx, ly, align, text) };
}

const AUTONOMY_LABEL: Record<BindRecord["autonomy"], string> = {
  bounded: "BOUNDED",
  wide: "WIDE",
  "decides-alone": "DECIDES ALONE",
};

const DOMAIN_LABEL = {
  skills: (n: number) => `SKILLS · ${n} BOUND`,
  connectors: (n: number) => `CONNECTORS · ${n} BOUND`,
  contexts: (n: number) => `CONTEXTS · ${n} HELD`,
} as const;

/** ≤5 leaders: the crown, the containment, the prime, and the first two
 *  sectors — each label the record's own strings, ≤28 chars (guarded). */
function apparatusNotes(record: BindRecord, sectors: DomainSector[]): Annotation[] {
  const notes: Annotation[] = [];

  // The crown — from the lane seal to the top-right margin.
  const crownX = R * Math.cos(CROWN_A);
  const crownY = R * Math.sin(CROWN_A);
  notes.push(
    note(
      `LANE · ${record.lane.toUpperCase()}`,
      crownX + CROWN_SEAL_R * 0.8,
      crownY - CROWN_SEAL_R * 0.8,
      MARGIN_X,
      -140,
      "right"
    )
  );

  // The containment — from the ring's SW point to the bottom-left margin.
  const swA = (3 * Math.PI) / 4;
  notes.push(
    note(
      `AUTONOMY · ${AUTONOMY_LABEL[record.autonomy]}`,
      R * Math.cos(swA),
      R * Math.sin(swA),
      -MARGIN_X,
      146,
      "left"
    )
  );

  // The prime — from the seal (or the inscription's foot) to bottom-right.
  const primeSy = record.class === "skill" ? 46 : PRIME_R * 0.75;
  notes.push(
    note(
      `PRIME · ${record.name.toUpperCase()}`,
      record.class === "skill" ? 3 : PRIME_R * 0.75,
      primeSy,
      MARGIN_X,
      146,
      "right"
    )
  );

  // The sectors — first two, labelled at the margin their midpoint faces.
  const sectorNotes = sectors.slice(0, 2).map((s) => {
    const mid = (s.a0 + s.a1) / 2;
    const align: "left" | "right" = Math.cos(mid) >= 0 ? "right" : "left";
    const ly = Math.max(-126, Math.min(126, Math.sin(mid) * 132));
    // Launch outside the station hardware: stemmed connector seals reach
    // R + 19; plain seals R + 8.
    const srcR = s.domain === "connectors" ? R + 22 : R + 11;
    return note(
      DOMAIN_LABEL[s.domain](s.names.length),
      srcR * Math.cos(mid),
      srcR * Math.sin(mid),
      align === "right" ? MARGIN_X : -MARGIN_X,
      ly,
      align
    );
  });
  // Nudge same-side labels apart (deterministic, 16-unit floor).
  for (let i = 1; i < sectorNotes.length; i++) {
    const prev = sectorNotes[i - 1];
    const cur = sectorNotes[i];
    if (prev.align === cur.align && Math.abs(prev.ly - cur.ly) < 16) {
      sectorNotes[i] = { ...cur, ly: prev.ly + 16 * Math.sign(cur.ly - prev.ly || 1) };
    }
  }
  notes.push(...sectorNotes);

  return notes.slice(0, 5);
}

const CLASS_LETTER: Record<BindRecord["class"], string> = {
  agent: "a",
  tool: "t",
  skill: "s",
  "person-led": "p",
};

export function composeBind(record: BindRecord): BindComposition {
  const bearing = bearingAngle(record.id);
  const sectors = layoutSectors(record);

  const marks: MarkPrimitive[] = [...containmentMarks(record, bearing), ...armatureMarks(record)];
  sectors.forEach((sector, i) => {
    marks.push(...spokeMarks(sector, i));
  });
  marks.push(...crownMarks(record));
  sectors.forEach((sector, i) => {
    marks.push(...sealMarks(sector, ORD.seals + i * 12, record.seedTag));
  });

  // The prime — the subject. An entity gets the circled Major glyph
  // with its ideogram column beside it; a skill-class record is an
  // inscription, not an entity: the ideogram alone, at center, larger.
  const ideogram = forgeIdeogram(record.name, record.seedTag);
  if (record.class !== "skill") {
    marks.push(circle(0, 0, PRIME_R, 1, ORD.prime, "seal"));
    marks.push(
      ...placeGlyph(forgeGlyph(record.name, "major", record.seedTag), 0, 0, 24, ORD.prime + 1)
    );
    marks.push(...ideogramMarks(ideogram, 34, 8, 10.5));
  } else {
    marks.push(...ideogramMarks(ideogram, 0, 11, 13.5));
  }
  marks.push(...bearingMarks(bearing));

  const apparatus = apparatusNotes(record, sectors);

  const hex4 = (hashString(record.id) % 0x10000).toString(16).padStart(4, "0");
  return {
    record,
    marks,
    apparatus,
    meta: {
      catalogNo: `N.${hex4}·${CLASS_LETTER[record.class]}`,
      figLabel: `BIND · ${record.class.toUpperCase()}`,
    },
  };
}
