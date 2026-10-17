import { FigureView } from "./blocks/Figure";
import type { Claim, Run, Words } from "./CaseRun";
import { CaseSwitch } from "./CaseSwitch";
import { ordinal } from "./story";
import type { Case } from "./types";

/** The anchor a case answers to, for the address and its own links. */
export const caseAnchor = (c: Pick<Case, "id">) => `case-${c.id}`;

/** The Loop story shows at most four claims under a line. */
const CLAIMS = 4;

/** A step's claims: what the model reasoned, then where a person decided. */
function stepClaims(thought: readonly string[], call?: { who: string; said: string }): Claim[] {
  const lines: Claim[] = thought
    .slice(0, call ? CLAIMS - 1 : CLAIMS)
    .map((t) => ({ glyph: "model", text: t }));
  if (call) lines.push({ person: true, text: `${call.who}: ${call.said}` });
  return lines;
}

/**
 * The case dossier: every case drawn once on the server, its figures handed to
 * the switch as nodes, one case shown at a time. Only the switch, the run's
 * observer and the film's sound are client.
 *
 * The first figure's words are the case's header (its numbers and its
 * briefing); every other figure's are its step. Steps and figures are
 * numbered by their place in the cut shown, so a step's number and its
 * figure's `FIG.` number are always the same.
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
    const header: Omit<Words, "n"> & { frame: Case["opening"] } = {
      id: `${anchor}-piece`,
      kick: "The brief",
      title: c.title,
      stats: c.stats,
      brief: c.brief,
      frame: c.opening,
    };
    const steps = c.chapters.map((ch) => ({
      id: `${anchor}-${ch.id}`,
      kick: ch.kick,
      title: ch.title,
      lede: ch.sub,
      claims: stepClaims(ch.thought, ch.call),
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
      words,
      figures: all.map((s, k) => (
        <FigureView key={s.id} n={k + 1} framed={s.frame} still={still} />
      )),
    };
  });
  const tints = Object.fromEntries(cases.map((c) => [c.id, c.tint]));
  const first = runs.some((r) => r.key === initial) ? (initial as string) : runs[0].key;
  return <CaseSwitch runs={runs} tints={tints} initial={first} still={still} />;
}
