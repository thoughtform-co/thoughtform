// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC LAB — the specimen sheet. The forged alphabet as a tome
// plate: MAJOR {GLYPH} / MINOR {GLYPH} tables with Fig. numbering,
// after the references' N.0567c specimen pages.
//
// The sheet is an HONEST CATALOG: it renders exactly the glyphs the
// loaded records forge (name-local, no re-rolls), so what letters on a
// bind is what the catalog shows.
// ═══════════════════════════════════════════════════════════════════

import { useMemo } from "react";

import { forgeGlyph, type GlyphSpec } from "@/lib/daemoniac/glyphForge";
import { primitiveD } from "@/lib/daemoniac/primitives";
import type { BindRecord } from "@/lib/daemoniac/types";

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
  "XXII",
  "XXIII",
  "XXIV",
  "XXV",
  "XXVI",
  "XXVII",
  "XXVIII",
  "XXIX",
  "XXX",
];

function roman(n: number): string {
  return ROMAN[n] ?? String(n + 1);
}

interface SpecimenEntry {
  spec: GlyphSpec;
  /** Entity names sharing this glyph (same name = same glyph, so
   *  duplicates across records collapse to one figure). */
  usedBy: string;
}

/** Every Major/Minor glyph the record set forges, deduped by identity. */
function collectGlyphs(records: readonly BindRecord[]): {
  major: SpecimenEntry[];
  minor: SpecimenEntry[];
} {
  const major = new Map<string, SpecimenEntry>();
  const minor = new Map<string, SpecimenEntry>();
  for (const r of records) {
    const add = (map: Map<string, SpecimenEntry>, name: string, grade: "major" | "minor") => {
      const k = name.toLowerCase();
      if (!map.has(k)) map.set(k, { spec: forgeGlyph(name, grade, r.seedTag), usedBy: name });
    };
    add(major, r.lane, "major");
    if (r.class !== "skill") add(major, r.name, "major");
    for (const s of r.skills) add(minor, s, "minor");
    for (const c of r.connectors) add(minor, c, "minor");
    for (const c of r.contexts) add(minor, c, "minor");
  }
  return { major: [...major.values()], minor: [...minor.values()] };
}

function GlyphFigure({ spec, size = 56 }: { spec: GlyphSpec; size?: number }) {
  return (
    <svg
      viewBox="-8 -10 16 20"
      width={size}
      height={size * 1.25}
      fill="none"
      aria-label={spec.name}
    >
      <g stroke="var(--gold-line)" strokeLinecap="round">
        {spec.primitives.map((p, i) => (
          <path key={i} d={primitiveD(p)} strokeWidth={p.weight} />
        ))}
      </g>
    </svg>
  );
}

function SpecimenTable({
  title,
  entries,
  figOffset = 0,
}: {
  title: string;
  entries: SpecimenEntry[];
  figOffset?: number;
}) {
  return (
    <section className="dae-sheet__table">
      <h2 className="dae-sheet__title">{title}</h2>
      <div className="dae-sheet__grid">
        {entries.map((e, i) => (
          <figure key={e.spec.fingerprint + e.usedBy} className="dae-sheet__cell">
            <figcaption className="dae-sheet__fig">Fig. {roman(figOffset + i)}</figcaption>
            <GlyphFigure spec={e.spec} />
            <figcaption className="dae-sheet__name">{e.usedBy}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function SpecimenSheet({
  records,
  active,
}: {
  records: readonly BindRecord[];
  active: BindRecord;
}) {
  const { major, minor } = useMemo(() => collectGlyphs(records), [records]);
  const primeName = active.class === "skill" ? active.lane : active.name;
  const primeSpec = useMemo(
    () => forgeGlyph(primeName, "major", active.seedTag),
    [primeName, active.seedTag]
  );

  return (
    <div className="dae-sheet">
      <header className="dae-sheet__head">
        <span>Glyphs</span>
        <span>N.{(major.length * 100 + minor.length).toString().padStart(4, "0")}c</span>
      </header>
      <SpecimenTable title="MAJOR {GLYPH}" entries={major} />
      <SpecimenTable title="MINOR {GLYPH}" entries={minor} figOffset={0} />
      <section className="dae-sheet__table">
        <h2 className="dae-sheet__title">SETTING — {primeName.toUpperCase()}</h2>
        <div className="dae-sheet__strip">
          {[48, 24, 16].map((s) => (
            <figure key={s} className="dae-sheet__cell">
              <GlyphFigure spec={primeSpec} size={s} />
              <figcaption className="dae-sheet__name">{s}px</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
