import type { CSSProperties } from "react";

import type { Figure } from "../types";

type ScreenFigure = Extract<Figure, { kind: "screen" }>;

/* a seeded value per tile, so the grain differs from tile to tile and never
   between renders */
const seed = (i: number) => ((i * 7919 + 104729) % 97) / 97;

/**
 * Screen: an interface the work shipped, drawn in the house grammar from its
 * own layout and labels. Pictures are grain, never footage (the client's
 * frames and people stay private), and the one lit thing is the result the
 * screen exists for: the matched moment.
 *
 *   search  the sidebar, the search bar with its question, the filters, the
 *           results line, and a grid of results with the best match lit
 *   review  one clip open: the player, its scenes as the scrubber with the
 *           matched scene lit and a person's note pinned on it, and the panel
 *           of status, tabs and what the model read
 */
export function Screen({ figure }: { figure: ScreenFigure }) {
  return figure.layout === "search" ? <Search f={figure} /> : <Review f={figure} />;
}

function Search({ f }: { f: ScreenFigure }) {
  const tiles = f.tiles ?? [];
  return (
    <div className="csd-scr" data-layout="search">
      <aside className="csd-scr__side">
        <p className="csd-scr__app">{f.app}</p>
        <ul className="csd-scr__nav">
          {(f.nav ?? []).map((n, i) => (
            <li key={n} data-on={i === 0 ? "" : undefined}>
              {n}
            </li>
          ))}
          {/* the rest of the sidebar, unlettered */}
          {[0.7, 0.5, 0.62, 0.44, 0.56].map((w, i) => (
            <li key={`b${i}`} className="csd-scr__blank" style={{ "--w": w } as CSSProperties} />
          ))}
        </ul>
        {f.foot ? <p className="csd-scr__foot">{f.foot}</p> : null}
      </aside>
      <div className="csd-scr__main">
        <div className="csd-scr__search">
          <p className="csd-scr__query">
            <i className="csd-scr__lens" aria-hidden="true" />
            {f.query}
          </p>
          {f.action ? <span className="csd-scr__btn">{f.action}</span> : null}
        </div>
        <ul className="csd-scr__facets">
          {(f.facets ?? []).map((x) => (
            <li key={x}>{x}</li>
          ))}
          {[0, 1].map((i) => (
            <li key={`b${i}`} className="csd-scr__blank" />
          ))}
        </ul>
        {f.status ? <p className="csd-scr__status">{f.status}</p> : null}
        <ol className="csd-scr__grid">
          {tiles.map((t, i) => (
            <li key={i} className="csd-scr__tile" data-lit={t.lit ? "" : undefined}>
              <span
                className="csd-scr__pic"
                style={
                  {
                    "--r": t.ratio.replace("/", " / "),
                    "--g": 5 + Math.round(seed(i) * 4),
                    "--a": 0.12 + seed(i + 3) * 0.14,
                  } as CSSProperties
                }
              >
                {t.badge ? <b className="csd-scr__badge">{t.badge}</b> : null}
                {t.verdict ? <b className="csd-scr__verdict">{t.verdict}</b> : null}
              </span>
              {t.hit ? (
                <span className="csd-scr__hit">{t.hit}</span>
              ) : (
                <i className="csd-scr__name" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Review({ f }: { f: ScreenFigure }) {
  const scenes = f.scenes ?? 8;
  const lit = f.sceneLit ?? 0;
  return (
    <div className="csd-scr" data-layout="review">
      <div className="csd-scr__stage">
        <span className="csd-scr__player" style={{ "--g": 6, "--a": 0.2 } as CSSProperties}>
          {f.open ? <b className="csd-scr__badge">{f.open}</b> : null}
        </span>
        <div className="csd-scr__scenes" aria-hidden="true">
          {Array.from({ length: scenes }, (_, i) => (
            <span
              key={i}
              data-lit={i === lit ? "" : undefined}
              style={{ flexGrow: 1 + seed(i + 11) * 2 }}
            >
              {i === lit && f.pin ? <i className="csd-dia" /> : null}
            </span>
          ))}
        </div>
        <div className="csd-scr__strip" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} style={{ "--a": 0.1 + seed(i + 5) * 0.12 } as CSSProperties} />
          ))}
        </div>
        {f.pin ? (
          <p className="csd-scr__pin">
            <i className="csd-dia" aria-hidden="true" />
            {f.pin}
          </p>
        ) : null}
      </div>
      <aside className="csd-scr__panel">
        {f.title ? <p className="csd-scr__title">{f.title}</p> : null}
        <ul className="csd-scr__states">
          {(f.states ?? []).map((s, i) => (
            <li key={s} data-on={i === (f.stateOn ?? 0) ? "" : undefined}>
              {s}
            </li>
          ))}
        </ul>
        <ul className="csd-scr__tabs">
          {(f.tabs ?? []).map((t, i) => (
            <li key={t} data-on={i === (f.tabOn ?? 0) ? "" : undefined}>
              {t}
            </li>
          ))}
        </ul>
        <dl className="csd-scr__lines">
          {(f.lines ?? []).map((k, i) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd style={{ "--w": 0.55 + seed(i + 2) * 0.4 } as CSSProperties} />
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
