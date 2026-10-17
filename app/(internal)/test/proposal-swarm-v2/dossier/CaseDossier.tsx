import { FigureView } from "./blocks/Figure";
import type { Run, Words } from "./CaseRun";
import { CaseSwitch } from "./CaseSwitch";
import { ordinal } from "./story";
import type { Case } from "./types";

/** The anchor a case answers to, for the address and its own links. */
export const caseAnchor = (c: Pick<Case, "id">) => `case-${c.id}`;

/**
 * The case dossier: every case drawn once on the server, its figures handed to
 * the switch as nodes, one case shown at a time. Only the switch, the run's
 * observer and the film's sound are client.
 *
 * Steps and figures are numbered by their place in the cut being shown, so a
 * step's number and its figure's `FIG.` number are always the same.
 *
 * Self-contained (the lab rule, 2026-10-12): no component from the arcs, the
 * landing or the lattice; the map's data is read by name in `blocks/Field`.
 */
export function CaseDossier({
  cases,
  initial,
  still,
}: {
  cases: readonly Case[];
  /** The case shown first (`?case=`), else the first. */
  initial?: string;
  still: boolean;
}) {
  const runs: Run[] = cases.map((c, i) => {
    const anchor = caseAnchor(c);
    const steps = [
      { id: "piece", kick: c.opening.head, title: c.title, frame: c.opening },
      ...c.chapters.map((ch) => ({ id: ch.id, kick: ch.kick, title: ch.title, frame: ch.frame })),
    ];
    const words: Words[] = steps.map((s, k) => ({
      id: `${anchor}-${s.id}`,
      n: k + 1,
      kick: s.kick,
      title: s.title,
    }));
    return {
      key: c.id,
      id: anchor,
      ordinal: ordinal(i + 1),
      client: c.client,
      project: c.project,
      glyph: c.glyph,
      workstream: c.workstream,
      saved: c.saved,
      words,
      figures: steps.map((s, k) => (
        <FigureView key={s.id} n={k + 1} framed={s.frame} still={still} />
      )),
    };
  });
  const first = runs.some((r) => r.key === initial) ? (initial as string) : runs[0].key;
  return <CaseSwitch runs={runs} initial={first} still={still} />;
}
