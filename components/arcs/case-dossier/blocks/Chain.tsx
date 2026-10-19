import type { Figure } from "../types";

type ChainFigure = Extract<Figure, { kind: "chain" }>;

/**
 * Chain: a few links read left to right, each a step with what it holds and
 * where that comes from; the lit link is the one the case turns on. Joined
 * by one level hairline, never arrows in boxes.
 */
export function Chain({ figure }: { figure: ChainFigure }) {
  return (
    <ol className="csd-chain" style={{ gridTemplateColumns: `repeat(${figure.links.length}, minmax(0, 1fr))` }}>
      {figure.links.map((l, i) => (
        <li key={l.k} data-lit={l.lit ? "" : undefined}>
          <span className="csd-chain__n">{String(i + 1).padStart(2, "0")}</span>
          <i className="csd-chain__node" aria-hidden="true" />
          <span className="csd-chain__k">{l.k}</span>
          <span className="csd-chain__v">{l.v}</span>
          {l.src ? <span className="csd-chain__src">{l.src}</span> : null}
        </li>
      ))}
    </ol>
  );
}
