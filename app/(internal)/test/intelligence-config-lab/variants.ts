import type {
  CaseMapChain,
  CaseMapDistrict,
  CaseMapShape,
  CaseMapShapeKey,
  CaseMapWork,
  CaseSkillEntry,
} from "@/lib/cases/types";

import { skillSymbol } from "@/components/landing/home-v2/services/casefile/skillSymbol";
import type { PdaWork } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";

/**
 * /test/intelligence-config-lab — the variant contract and the shared kit.
 *
 * Five drawings of ONE work stream's intelligence configuration, judged side
 * by side in the real console chrome. `shipped` is the ADR-069 reading 02,
 * mounted from production; the other four are archetypes answering the
 * owner's brief (2026-08-08): different SHAPES per configuration part,
 * different ways of CONNECTING them, motherboards / nodes / retrofuturistic
 * instruments, and the substrate drawn as CLUSTERS of skills.
 *
 * ⚠ THE LAB PAGE IS MECHANICALLY UNGUARDED. `cases-registry.test.ts` walks
 * `CASES` + `PROJECT_CASES` objects, never component code — so every string a
 * variant letters must come from the record or a derived count, and
 * `tests/lib/config-lab-fit.test.ts` re-checks the envelope over everything
 * `lettering()` declares. A lettered string that is not in `lettering()` is a
 * defect, not an economy.
 */

/* ── The variant registry (field-log-lab's 4-field contract) ───────────── */

export type IclVariantId = "shipped" | "die" | "chain" | "section" | "schematic";

export interface IclVariantDef {
  id: IclVariantId;
  label: string;
  thesis: string;
  provenance: string;
}

export const ICL_VARIANTS: readonly IclVariantDef[] = [
  {
    id: "shipped",
    label: "Shipped (the Switchboard)",
    thesis:
      "The baseline, and it is the SWITCHBOARD now — promoted out of this lab on 2026-08-09. Every experiment beside it is judged against the real thing, mounted from production, not against a copy.",
    provenance:
      "PdaConfiguration.ViewConfiguration, mounted from production at its own crop. The lab's local copy is deleted: two drawings claiming to be the same one is how a lab goes stale.",
  },
  {
    id: "die",
    label: "The Die",
    thesis:
      "The configuration as silicon: the work docked in a pin-grid socket, every part a different package — memory banks feed it, edge connectors leave the board, and the substrate is the ground plane below grade, clustered by shape.",
    provenance:
      "CP2077 inventory chipset (mega-chip → packages → bus bars → component banks; value carries hierarchy). Symbols on the ground plane are the 47 Skills' first render.",
  },
  {
    id: "chain",
    label: "The Signal Chain",
    thesis:
      "The configuration as a signal path: inherits IN on the left, the work and its skill + lane pair process in the middle, and the output physically passes through the gate before it reaches a surface. The substrate is a patch bay.",
    provenance:
      "Rack instrument / modular routing; MAP_CHAINS letter the upstream and downstream neighbours at the edges.",
  },
  {
    id: "section",
    label: "The Cutaway",
    thesis:
      "The configuration as a vertical section: authority above, the machine in the middle, and the five shapes as literal strata below grade — tapped ones trenched by risers. The bar is the bedplate the machine sits on.",
    provenance:
      "Technical cutaway / geological section; MapSheetGrade's below-grade treatment, redrawn orthographic.",
  },
  {
    id: "schematic",
    label: "The Schematic",
    thesis:
      "The configuration as a circuit diagram: every part its own drawn symbol, every relation an orthogonal net with a named run, and the substrate as five power rails along the bottom.",
    provenance:
      "CP2077 character sheet (a different silhouette per attribute) translated to flat schematic symbols in the house grammar.",
  },
];

export const iclVariant = (id: string | null): IclVariantDef =>
  ICL_VARIANTS.find((v) => v.id === id) ?? ICL_VARIANTS[0];

/* ── The record slice every variant draws from ─────────────────────────── */

export interface IclRecord {
  shapes: readonly CaseMapShape[];
  districts: readonly CaseMapDistrict[];
  works: readonly CaseMapWork[];
  chains: readonly CaseMapChain[];
  skills: readonly CaseSkillEntry[];
}

/** What every experimental variant receives: the projected drawing record
 *  (`toPdaWork` — the same projection the shipped reading letters), the raw
 *  record entry, and the full slice for substrate/chain derivations. */
export interface IclVariantProps {
  pda: PdaWork;
  work: CaseMapWork;
  record: IclRecord;
}

/* ── Fit arithmetic — the same model pdaGlyphs documents ───────────────────
   PT Mono's advance is ~0.6 em and TRACKING ADDS TO IT, so the factor is
   `0.6 + track`: 0.68 at the value tracking (.08em), 0.74 at the header
   tracking (.14em), 0.82 at the chrome tracking (.22em). `MONO_ADVANCE`
   (0.68) is this formula evaluated at .08em. */

export const adv = (fs: number, track: number) => fs * (0.6 + track);

/** One lettered string, declared so the fit test can measure the DRAWING'S
 *  OWN inputs rather than re-deriving its own. */
export interface LetterSpec {
  slot: string;
  text: string;
  fs: number;
  /** Tracking in em — the advance model needs it, see `adv`. */
  track: number;
  /** The measure the text must fit, in authoring units. */
  measure: number;
}

export const specWidth = (s: LetterSpec) => s.text.length * adv(s.fs, s.track);

/* ── Shared drawing helpers (pure) ─────────────────────────────────────── */

/** Orthogonal H→V→H run, the PCB trace shape. */
export const hvh = (x1: number, y1: number, x2: number, y2: number, midX: number) =>
  `M${x1},${y1} H${midX} V${y2} H${x2}`;

/** Orthogonal V→H→V run. */
export const vhv = (x1: number, y1: number, x2: number, y2: number, midY: number) =>
  `M${x1},${y1} V${midY} H${x2} V${y2}`;

/** Parallel offsets for an n-line bundle at the given pitch. */
export const bundleOffsets = (n: number, pitch: number): number[] =>
  Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * pitch);

/** 45° hatch ticks under a grade rule — hand-emitted lines, never a
 *  `<pattern>` (the instrument grammar is flat). */
export const hatchTicks = (
  x1: number,
  x2: number,
  y: number,
  pitch = 18,
  len = 7
): { x1: number; y1: number; x2: number; y2: number }[] => {
  const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let x = x1; x + len * 0.7 <= x2; x += pitch) {
    out.push({ x1: x + len * 0.7, y1: y, x2: x, y2: y + len * 0.7 });
  }
  return out;
};

/* ── Record derivations (all totals derived, none authored) ────────────── */

/** The Skills clustered under one shape — the substrate read. The cluster
 *  belongs to the SHAPE; a work reaches it transitively via `work.shapes`,
 *  and no variant may phrase it as the work's own skill list. */
export const shapeSkills = (
  skills: readonly CaseSkillEntry[],
  shape: CaseMapShape
): CaseSkillEntry[] => skills.filter((s) => s.engine === shape.label);

/** The 2–4 char marks for one shape's cluster (skillSymbol is the guarded
 *  derivation the lattice uses; uniqueness is pinned by the registry test). */
export const shapeSymbols = (skills: readonly CaseSkillEntry[], shape: CaseMapShape): string[] =>
  shapeSkills(skills, shape).map((s) => skillSymbol(s.name));

export const skillsTotal = (shapes: readonly CaseMapShape[]) =>
  shapes.reduce((n, s) => n + s.skills, 0);

/** `SUBSTRATE · 47 SKILLS · 5 SHAPES` — both numbers DERIVED, and the exact
 *  total (never `47+`): the clusters beneath it are arithmetic a reader can
 *  sum, and a hedge beside an exact sum reads as two different numbers. */
export const substrateCaption = (shapes: readonly CaseMapShape[]) =>
  `${skillsTotal(shapes)} SKILLS · ${shapes.length} SHAPES`;

export interface ChainNeighbours {
  from: { id: string; title: string } | null;
  to: { id: string; title: string } | null;
  /** Whether the work appears in any recorded chain at all. */
  inChain: boolean;
}

/** Upstream/downstream neighbours from MAP_CHAINS — 7 of the 27 works appear
 *  in a chain; everything else gets the honest empty state. */
export function chainNeighbours(
  chains: readonly CaseMapChain[],
  works: readonly CaseMapWork[],
  workId: string
): ChainNeighbours {
  const byId = (id: string) => {
    const w = works.find((x) => x.id === id);
    return w ? { id: w.id, title: w.title.toUpperCase() } : null;
  };
  for (const c of chains) {
    const i = c.steps.indexOf(workId);
    if (i < 0) continue;
    return {
      from: i > 0 ? byId(c.steps[i - 1]) : null,
      to: i < c.steps.length - 1 ? byId(c.steps[i + 1]) : null,
      inChain: true,
    };
  }
  return { from: null, to: null, inChain: false };
}

/** The edge lettering: a neighbour when there is one, the run's own end when
 *  the work heads or closes a chain, and the honest empty state otherwise. */
export const neighbourLine = (
  n: { id: string; title: string } | null,
  edge: "in" | "out",
  inChain: boolean
) =>
  n
    ? `${n.id} · ${n.title}`
    : !inChain
      ? "NOT IN A RECORDED CHAIN"
      : edge === "in"
        ? "RUN STARTS HERE"
        : "RUN ENDS HERE";

/** Whether a work taps the given shape. */
export const taps = (work: CaseMapWork, key: CaseMapShapeKey) => work.shapes.includes(key);
