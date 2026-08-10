// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC — the ritual register. Types for the bind composer.
//
// A BIND is the drawn record of a configuration: what was summoned,
// what it is bound to, and how far it may act alone. "Sigil" is an
// occupied term in LANGUAGE.md (the brand geometric mark) — nothing in
// this module is called a sigil. Canon: the warlock line is summon,
// bind, send (worldbuilding canon.md — "Recognition, never addition").
//
// The kernel is pure: no React, no DOM, no Date, no Math.random. Every
// mark is DERIVED from the record — the bind is a reading, never
// decoration.
// ═══════════════════════════════════════════════════════════════════

/** The house stroke enum (celestial-diagram-grammar parity). */
export const STROKE_WEIGHTS = [0.3, 0.5, 0.7, 1, 1.5, 2] as const;
export type StrokeWeight = (typeof STROKE_WEIGHTS)[number];

export type BindClass = "agent" | "tool" | "skill" | "person-led";
export type BindAutonomy = "bounded" | "wide" | "decides-alone";

/** One configuration record — the subject of a bind. */
export interface BindRecord {
  /** Stable id; namespaces the layout RNG and prints as the catalog no. */
  id: string;
  /** The prime name. THE NAME IS THE SEED: renaming redraws its glyphs. */
  name: string;
  class: BindClass;
  /** The summoned intelligence lane (the crown station). */
  lane: string;
  skills: readonly string[];
  connectors: readonly string[];
  contexts: readonly string[];
  autonomy: BindAutonomy;
  /** Escape hatch: bump to re-roll this record's glyphs on a fingerprint
   *  collision without renaming it. */
  seedTag?: string;
}

/** What a mark is FOR — drives inscription order and sampling degrade
 *  (furniture drops out of the particle pass first). */
export type MarkRole =
  | "containment"
  | "armature"
  | "spoke"
  | "seal"
  | "glyph"
  | "ideogram"
  | "furniture";

interface MarkBase {
  weight: StrokeWeight;
  /** Inscription order — ascending; the particle rank rides this. */
  order: number;
  role: MarkRole;
}

/** Full circle, drawn from `phase` (radians) for inscription ordering. */
export interface CircleMark extends MarkBase {
  kind: "circle";
  cx: number;
  cy: number;
  r: number;
  phase: number;
}

/** Circular arc from a0 to a1 (radians, drawn in increasing-angle
 *  direction; a1 > a0). */
export interface ArcMark extends MarkBase {
  kind: "arc";
  cx: number;
  cy: number;
  r: number;
  a0: number;
  a1: number;
}

export interface LineMark extends MarkBase {
  kind: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Quadratic bezier — the one curve the script register writes with. */
export interface QuadMark extends MarkBase {
  kind: "quad";
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  x2: number;
  y2: number;
}

export type MarkPrimitive = CircleMark | ArcMark | LineMark | QuadMark;

/** A leader-line note in the apparatus ink — the record explaining its
 *  own bind. Never sampled into particles. */
export interface Annotation {
  /** PT Mono caps, ≤28 chars (guarded). */
  text: string;
  /** Label anchor point (plate coordinates). */
  lx: number;
  ly: number;
  align: "left" | "right";
  /** Polyline from the annotated mark to the label, 45° jogs. */
  leader: readonly (readonly [number, number])[];
}

export interface BindMeta {
  /** Archival catalog number, e.g. `N.4f2a·t`. */
  catalogNo: string;
  /** Plate designation, e.g. `BIND · AGENT`. */
  figLabel: string;
}

/** The composed drawing: every mark derived from the record. */
export interface BindComposition {
  record: BindRecord;
  marks: readonly MarkPrimitive[];
  apparatus: readonly Annotation[];
  meta: BindMeta;
}

/** Bind marks live in the celestial canvas convention. */
export const BIND_CANVAS = { x: -120, y: -120, width: 240, height: 240 } as const;

/** The plate wraps the bind with annotation margin. */
export const PLATE_CANVAS = { x: -170, y: -170, width: 340, height: 340 } as const;
