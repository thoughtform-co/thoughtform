import { FigureView } from "./blocks/Figure";
import { CaseRun, type Words } from "./CaseRun";
import { ordinal } from "./story";
import type { Case } from "./types";

/** The anchor a case answers to, for the menu and the index. */
export const caseAnchor = (c: Pick<Case, "id">) => `case-${c.id}`;

/**
 * The case dossier: an index of the cases in one ruled strip, then each case
 * as its own run, the words held on the left and one framed figure per
 * chapter on the right. Server; the figures are drawn here and handed to the
 * run as nodes, so only the run's observer and the film's switch are client.
 *
 * Self-contained (the lab rule, 2026-10-12): no component from the arcs, the
 * landing or the lattice; the map's data is read by name in `blocks/Field`.
 */
export function CaseDossier({ cases, still }: { cases: readonly Case[]; still: boolean }) {
  return (
    <div className="csd" data-still={still ? "" : undefined}>
      <nav className="csd-index" aria-label="The cases">
        <ol>
          {cases.map((c, i) => (
            <li key={c.id}>
              <a href={`#${caseAnchor(c)}`}>
                <span className="csd-index__n">{ordinal(i + 1)}</span>
                <span className="csd-index__client">{c.client}</span>
                <span className="csd-index__piece">{c.piece}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {cases.map((c, i) => {
        const anchor = caseAnchor(c);
        const words: Words[] = [
          {
            id: `${anchor}-piece`,
            n: 0,
            kick: c.opening.head,
            title: c.title,
            sub: c.sub,
            thought: [],
          },
          ...c.chapters.map((ch) => ({
            id: `${anchor}-${ch.id}`,
            n: ch.n,
            kick: ch.kick,
            title: ch.title,
            sub: ch.sub,
            thought: ch.thought,
            call: ch.call,
          })),
        ];
        const figures = [
          <FigureView key="piece" n={0} framed={c.opening} still={still} />,
          ...c.chapters.map((ch) => (
            <FigureView key={ch.id} n={ch.n} framed={ch.frame} still={still} />
          )),
        ];
        return (
          <CaseRun
            key={c.id}
            id={anchor}
            ordinal={ordinal(i + 1)}
            client={c.client}
            workstream={c.workstream}
            piece={c.piece}
            date={c.date}
            number={c.number}
            words={words}
            figures={figures}
            still={still}
          />
        );
      })}
    </div>
  );
}
