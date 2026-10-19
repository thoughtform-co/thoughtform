import type { Figure } from "../types";

type ScreenFigure = Extract<Figure, { kind: "screen" }>;

/**
 * A conversation in Claude, redrawn in its warm light look at a 720-wide
 * window scaled to the frame (`--u`): the person's ask on the right, the
 * reply on the left, and the drafts it returned as cards, each with the
 * sources it read; the one the person keeps is lit.
 */
export function ClaudeScreen({ figure }: { figure: ScreenFigure }) {
  const drafts = figure.drafts ?? [];
  return (
    <div className="cld">
      <header className="cld-top">
        <span className="cld-mark" aria-hidden="true">
          ✳
        </span>
        <span>{figure.app}</span>
      </header>
      <div className="cld-thread">
        {figure.ask ? <p className="cld-ask">{figure.ask}</p> : null}
        {figure.reply ? <p className="cld-reply">{figure.reply}</p> : null}
        <ol className="cld-drafts" style={{ gridTemplateColumns: `repeat(${drafts.length}, minmax(0, 1fr))` }}>
          {drafts.map((d) => (
            <li key={d.title} data-lit={d.lit ? "" : undefined}>
              <p className="cld-draft__t">{d.title}</p>
              <dl>
                {d.lines.map((l) => (
                  <div key={l.k}>
                    <dt>{l.k}</dt>
                    <dd>{l.v}</dd>
                  </div>
                ))}
              </dl>
              <ul className="cld-refs">
                {d.refs.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {figure.close ? <p className="cld-reply">{figure.close}</p> : null}
      </div>
      <p className="cld-input">Reply to Claude…</p>
    </div>
  );
}
