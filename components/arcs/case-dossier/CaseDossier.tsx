import { FigureView } from "./blocks/Figure";
import type { Run, Words } from "./CaseRun";
import { CaseSwitch } from "./CaseSwitch";
import { ordinal } from "./story";
import type { Case, Head } from "./types";

/** The anchor a case answers to, for the address and its own links. */
export const caseAnchor = (c: Pick<Case, "id">) => `case-${c.id}`;

/**
 * The case dossier: every case drawn once on the server, its figures handed to
 * the switch as nodes, one case shown at a time. Only the switch, the run's
 * observer and the film's sound are client.
 *
 * The first figure's words are the case's header (the result: before and
 * now, what it now allows, its facts); every other figure's are its step,
 * one sentence. Steps are numbered by their place in the cut shown.
 *
 * Self-contained (the lab rule, 2026-10-12): no component from the arcs, the
 * landing or the lattice; the map's data is read by name in `blocks/Field`.
 */
export function CaseDossier({
  cases,
  initial,
  head,
  still,
}: {
  cases: readonly Case[];
  /** The case shown first (`?case=`), else the first. */
  initial?: string;
  /** The case head's type (`?head=`). */
  head: Head;
  still: boolean;
}) {
  const runs: Run[] = cases.map((c, i) => {
    const anchor = caseAnchor(c);
    const header: Omit<Words, "n"> & { frame: Case["opening"] } = {
      id: `${anchor}-piece`,
      kick: "The result",
      title: c.result.title,
      result: c.result,
      stats: c.stats,
      frame: c.opening,
    };
    const steps = c.chapters.map((ch) => ({
      id: `${anchor}-${ch.id}`,
      kick: ch.kick,
      title: ch.title,
      lede: ch.sub,
      points: ch.points,
      frame: ch.frame,
    }));
    const all = [header, ...steps];
    const words: Words[] = all.map(({ frame: _frame, ...w }, k) => ({ ...w, n: k + 1 }));
    return {
      key: c.id,
      id: anchor,
      ordinal: ordinal(i + 1),
      client: c.client,
      project: c.project,
      glyph: c.glyph,
      workstream: c.workstream,
      logo: c.logo,
      tint: c.tint,
      intro: c.intro,
      words,
      figures: all.map((s, k) => (
        <FigureView key={s.id} n={k + 1} client={c.client} framed={s.frame} still={still} />
      )),
    };
  });
  const first = runs.some((r) => r.key === initial) ? (initial as string) : runs[0].key;
  return <CaseSwitch runs={runs} initial={first} head={head} still={still} />;
}
