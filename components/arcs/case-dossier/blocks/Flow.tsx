import type { Figure } from "../types";

/**
 * Flow: a run as stations down one line, joined by plumb connectors (straight
 * by law), each station a mono key over its title, its note and a short list.
 * A person's station has a green node; one station may be lit.
 */
export function Flow({ figure }: { figure: Extract<Figure, { kind: "flow" }> }) {
  return (
    <ol className="csd-flow" aria-label={figure.stations.map((s) => s.title).join(", then ")}>
      {figure.stations.map((s, i) => (
        <li
          key={s.k}
          className="csd-stn"
          data-lit={s.lit ? "" : undefined}
          data-person={s.person ? "" : undefined}
        >
          <p className="csd-stn__k">
            <span>{String(i + 1).padStart(2, "0")}</span>
            {s.k}
          </p>
          <div className="csd-stn__body">
            <p className="csd-stn__title">{s.title}</p>
            {s.note ? <p className="csd-stn__note">{s.note}</p> : null}
            {s.items?.length ? (
              <ul className="csd-stn__items">
                {s.items.map((it) => (
                  <li key={it.t} data-hit={it.hit ? "" : undefined}>
                    {it.t}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
