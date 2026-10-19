import type { Figure } from "../types";

/**
 * Ledger: what it cost, what it bought, what it replaced. The bar's first
 * part is the one lit thing; before and now are two kinds of object (the old
 * way a struck mono row, the new way the result band in Tensor Gold).
 */
export function Ledger({ figure }: { figure: Extract<Figure, { kind: "ledger" }> }) {
  const sum = figure.bar?.parts.reduce((n, p) => n + p.value, 0) ?? 0;
  return (
    <div className="csd-ledger">
      {figure.bar ? (
        <div className="csd-ledger__bar">
          <p className="csd-k">{figure.bar.label}</p>
          <div
            className="csd-bar"
            role="img"
            aria-label={figure.bar.parts.map((p) => `${p.name} ${p.shown}`).join(", ")}
          >
            {figure.bar.parts.map((p, i) => (
              <span
                key={p.name}
                data-lit={i === 0 ? "" : undefined}
                style={{ width: `${(p.value / sum) * 100}%` }}
              />
            ))}
          </div>
          <ol className="csd-ledger__legend">
            {figure.bar.parts.map((p, i) => (
              <li key={p.name} data-lit={i === 0 ? "" : undefined}>
                <i aria-hidden="true" />
                <span>{p.name}</span>
                <b>{p.shown}</b>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {figure.before && figure.now ? (
        <div className="csd-ledger__bn">
          <p className="csd-ledger__before">
            <span>{figure.before.k}</span>
            <s>{figure.before.v}</s>
          </p>
          <p className="csd-ledger__now">
            <span>{figure.now.k}</span>
            <b>{figure.now.v}</b>
          </p>
        </div>
      ) : null}
      {figure.rows?.length ? (
        <dl className="csd-ledger__rows">
          {figure.rows.map((r) => (
            <div key={r.k}>
              <dt>{r.k}</dt>
              <dd>{r.v}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {figure.total ? (
        <p className="csd-ledger__total">
          <span>{figure.total.k}</span>
          <b>{figure.total.v}</b>
        </p>
      ) : null}
      {figure.estimated ? <p className="csd-ledger__est">Estimated</p> : null}
    </div>
  );
}
