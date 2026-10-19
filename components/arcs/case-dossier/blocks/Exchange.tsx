import type { Figure } from "../types";

const RECOMMENDED = /\s*\(Recommended\)\s*$/i;

/**
 * The ask (and the next one): the person's message, the model's one line of
 * thinking, the question card as Claude shows it (numbered options, the
 * recommended one marked, the picked one drawn at datum weight), then the
 * answers and the line they led to, the case's one lit object in this view.
 */
export function Exchange({ figure }: { figure: Extract<Figure, { kind: "exchange" }> }) {
  const q = figure.question;
  return (
    <div className="csd-ex" data-answers={figure.answers ? "" : undefined}>
      <div className="csd-ex__app">
        {figure.crumb?.length ? (
          <p className="csd-ex__crumb">
            {figure.crumb.map((c, i) => (
              <span key={c}>
                {i ? (
                  <span className="csd-ex__sep" aria-hidden="true">
                    ›
                  </span>
                ) : null}
                {c}
              </span>
            ))}
          </p>
        ) : null}
        <div className="csd-ex__msg">
          <p className="csd-ex__who">
            <i className="csd-dia" aria-hidden="true" />
            {figure.who}
          </p>
          <p className="csd-ex__text">{figure.message}</p>
        </div>
        {figure.thought ? (
          <p className="csd-ex__thought">
            <span aria-hidden="true">›</span>
            {figure.thought}
          </p>
        ) : null}
        {q ? (
          <div className="csd-ex__q">
            <p className="csd-ex__qt">
              <b>{q.title}</b>
              <span>{q.of}</span>
            </p>
            <ol className="csd-ex__opts">
              {q.options.map((o, i) => (
                <li key={o} data-on={i === q.selected ? "" : undefined}>
                  <span className="csd-ex__n">{i + 1}</span>
                  <span className="csd-ex__o">{o.replace(RECOMMENDED, "")}</span>
                  {RECOMMENDED.test(o) ? <small>Recommended</small> : null}
                </li>
              ))}
            </ol>
            {figure.illustrative ? (
              <p className="csd-ex__ill">
                The options are illustrative; the answers are the ones picked.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      {figure.answers ? (
        <div className="csd-ex__ans">
          <p className="csd-k">{figure.answers.label}</p>
          <ol className="csd-ex__rows">
            {figure.answers.rows.map((r) => (
              <li key={r.k}>
                <span>{r.k}</span>
                <b>{r.v}</b>
                {r.tag ? <small>{r.tag}</small> : null}
              </li>
            ))}
          </ol>
          {figure.result ? (
            <div className="csd-ex__result">
              <span>{figure.result.k}</span>
              <b>{figure.result.v}</b>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
