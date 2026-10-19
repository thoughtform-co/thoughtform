/* eslint-disable @next/next/no-img-element -- the redrawn app: published stills at thumbnail size in fixed boxes */
import type { CSSProperties, ReactNode } from "react";

import type { Figure } from "../types";

type ScreenFigure = Extract<Figure, { kind: "screen" }>;

/* lucide's strokes, the app's own icon set (`lucide-react`) */
function Ico({ d, size = 18 }: { d: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      style={{ width: `calc(${size} * var(--u))`, height: `calc(${size} * var(--u))` }}
      aria-hidden="true"
    >
      {d}
    </svg>
  );
}
const I = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  video: (
    <>
      <path d="m16 13 5.2 3.1a.5.5 0 0 0 .8-.4V8.3a.5.5 0 0 0-.8-.4L16 11" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </>
  ),
  doc: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  imageUp: (
    <>
      <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10" />
      <path d="m14 19.5 3-3 3 3" />
      <path d="M17 22v-5.5" />
      <circle cx="9" cy="9" r="2" />
    </>
  ),
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
    </>
  ),
};

/**
 * The Suri asset library as it is built (suri-intelligence-architect/
 * suri-dam, `library/app/src`: `App.tsx`, `AppSidebar`, `SearchBar`,
 * `FacetBar`, `Results`, `review/ReviewSheet`), redrawn at its own sizes in
 * a 1280-wide window and scaled to the frame (`--u`, one app pixel). Its
 * counts are the live library's; its pictures are Suri's own published
 * campaign stills (`public/arcs/suri/`), never frames from the library,
 * which the repo keeps private.
 *
 *   search  the sidebar, the search bar (a question in words, or a
 *           picture), the filters, the results line and the grid, each
 *           result opening at its matching second
 *   review  the dark sheet: the player at the moment with a pinned note,
 *           the scenes, and the panel of status, tags and the file name
 *           the tags write
 */
export function SuriScreen({ figure }: { figure: ScreenFigure }) {
  return figure.layout === "search" ? <Library f={figure} /> : <Review f={figure} />;
}

const NAV: readonly { label: string; count: string; icon: ReactNode }[] = [
  { label: "All assets", count: "47,201", icon: I.grid },
  { label: "Video", count: "14,485", icon: I.video },
  { label: "Photo", count: "32,585", icon: I.photo },
  { label: "Document", count: "41", icon: I.doc },
];
const REVIEW: readonly { label: string; count: string; dot: string }[] = [
  { label: "Needs review", count: "1", dot: "#b19b6b" },
  { label: "Changes", count: "1", dot: "#bc8767" },
  { label: "Approved", count: "0", dot: "#4e624d" },
];
const STAGE: readonly { label: string; count: string }[] = [
  { label: "Raw", count: "26,803" },
  { label: "Selects", count: "10,006" },
  { label: "Edit", count: "1,131" },
  { label: "Final", count: "9,110" },
];
const FACETS = ["Product", "Colourway", "Asset type", "Scene", "Shot", "Talent"];
const SIGNALS: readonly [string, string][] = [
  ["Hook", "2,359"],
  ["Hands only", "2,100"],
];

function Library({ f }: { f: ScreenFigure }) {
  const tiles = f.tiles ?? [];
  const more = f.more ?? [];
  return (
    <div className="sdm" data-layout="search">
      <aside className="sdm-side">
        <p className="sdm-brand">
          <b>SURI</b>
          <span>{f.app}</span>
        </p>
        <ul className="sdm-nav">
          {NAV.map((n, i) => (
            <li key={n.label} data-on={i === 0 ? "" : undefined}>
              <Ico d={n.icon} />
              <span>{n.label}</span>
              <em>{n.count}</em>
            </li>
          ))}
        </ul>
        <p className="sdm-sec">Review</p>
        <ul className="sdm-nav">
          {REVIEW.map((n) => (
            <li key={n.label}>
              <i className="sdm-dot" style={{ background: n.dot }} />
              <span>{n.label}</span>
              <em>{n.count}</em>
            </li>
          ))}
        </ul>
        <p className="sdm-sec">Stage</p>
        <ul className="sdm-nav sdm-nav--stage">
          {STAGE.map((n) => (
            <li key={n.label}>
              <span>{n.label}</span>
              <em>{n.count}</em>
            </li>
          ))}
        </ul>
      </aside>

      <div className="sdm-main">
        <header className="sdm-top">
          <p className="sdm-search" data-full="">
            <Ico d={I.search} />
            {f.picture ? (
              <>
                {f.pictureSrc ? <img className="sdm-search__pic" src={f.pictureSrc} alt="" /> : null}
                <span className="sdm-search__t">
                  Like this picture <span className="sdm-quiet">· {f.picture}</span>
                </span>
                <span className="sdm-search__x">
                  <Ico d={I.x} size={16} />
                </span>
              </>
            ) : (
              <>
                <span className="sdm-search__t">{f.query}</span>
                <span className="sdm-quiet">
                  <Ico d={I.imageUp} />
                </span>
                <kbd className="sdm-kbd">/</kbd>
              </>
            )}
          </p>
          <span className="sdm-role">
            Creative strategist <Ico d={I.x} size={14} />
          </span>
          <span className="sdm-btn">
            <Ico d={I.chat} size={16} />
            Ask
          </span>
        </header>
        <ul className="sdm-facets">
          {FACETS.map((x) => (
            <li key={x}>
              {x} <Ico d={I.chevron} size={14} />
            </li>
          ))}
          {SIGNALS.map(([k, v]) => (
            <li key={k} className="sdm-sig">
              {k} <b>{v}</b>
            </li>
          ))}
        </ul>
        <div className="sdm-bar-row">
          <p>{f.results}</p>
          <span className="sdm-sort">
            Best match <Ico d={I.chevron} size={14} />
          </span>
        </div>
        <div className="sdm-rows">
          <ol className="sdm-grid">
            {tiles.map((t, i) => (
              <li
                key={i}
                className="sdm-tile"
                style={{ flexGrow: ratioOf(t.ratio) } as CSSProperties}
                data-lit={t.lit ? "" : undefined}
              >
                <span className="sdm-pic" style={{ aspectRatio: t.ratio.replace("/", " / ") }}>
                  {t.src ? <img src={t.src} alt="" loading="lazy" /> : null}
                  {t.badge ? <b className="sdm-dur">{t.badge}</b> : null}
                  {t.versions ? (
                    <b className="sdm-ver">
                      <Ico d={I.layers} size={12} />
                      {t.versions}
                    </b>
                  ) : null}
                </span>
                {t.name ? <span className="sdm-name">{t.name}</span> : null}
                {t.meta ? <span className="sdm-meta">{t.meta}</span> : null}
                {t.hit ? (
                  <span className="sdm-moment">
                    <b>{t.hit.split(" ")[0]}</b> Matching moment →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          {more.length ? (
            <ol className="sdm-grid sdm-grid--more" aria-hidden="true">
              {more.map((src, i) => (
                <li key={i} className="sdm-tile" style={{ flexGrow: 0.5625 } as CSSProperties}>
                  <span className="sdm-pic" style={{ aspectRatio: "9 / 16" }}>
                    <img src={src} alt="" loading="lazy" />
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const ratioOf = (r: string) => {
  const [a, b] = r.split("/").map(Number);
  return a && b ? a / b : 1;
};

function Review({ f }: { f: ScreenFigure }) {
  const scenes = f.scenes ?? 4;
  const lit = f.sceneLit ?? 0;
  const strip = f.strip ?? [];
  return (
    <div className="sdm" data-layout="review">
      <div className="sdm-stage">
        <header className="sdm-stage__top">
          <Ico d={I.x} />
          <Ico d={<path d="m15 18-6-6 6-6" />} />
          <Ico d={<path d="m9 18 6-6-6-6" />} />
          {f.crumb ? <span className="sdm-crumb">{f.crumb}</span> : null}
          <span className="sdm-ghost">
            Open in Drive at {f.open} <Ico d={<path d="M5 12h14M12 5l7 7-7 7" />} size={14} />
          </span>
        </header>
        <div className="sdm-player">
          {f.playerSrc ? <img src={f.playerSrc} alt="" /> : null}
          {f.pin ? (
            <>
              <i className="sdm-pinmark" aria-hidden="true" />
              <span className="sdm-pinnote">{f.pin}</span>
            </>
          ) : null}
          {f.open ? <b className="sdm-dur">{f.open}</b> : null}
        </div>
        {f.scene ? <p className="sdm-scene">{f.scene}</p> : null}
        <div className="sdm-scrub" aria-hidden="true">
          {Array.from({ length: scenes }, (_, i) => (
            <span key={i} data-lit={i === lit ? "" : undefined} />
          ))}
        </div>
        <div className="sdm-strip" aria-hidden="true">
          {strip.map((s, i) => (
            <span key={i} data-lit={i === lit ? "" : undefined}>
              <img src={s.src} alt="" loading="lazy" />
              <b>{s.at}</b>
            </span>
          ))}
        </div>
      </div>
      <aside className="sdm-panel">
        <div className="sdm-panel__head">
          {f.title ? <p className="sdm-panel__title">{f.title}</p> : null}
          {f.sub ? <p className="sdm-panel__sub">{f.sub}</p> : null}
          <ul className="sdm-seg">
            {(f.states ?? []).map((s, i) => (
              <li key={s} data-on={i === (f.stateOn ?? 0) ? "" : undefined}>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <ul className="sdm-tabs">
          {(f.tabs ?? []).map((t, i) => (
            <li key={t} data-on={i === (f.tabOn ?? 0) ? "" : undefined}>
              {t}
            </li>
          ))}
        </ul>
        <div className="sdm-panel__body">
          {f.summary ? (
            <div className="sdm-tags">
              <p>Summary, as a model read it</p>
              <p className="sdm-summary">{f.summary}</p>
            </div>
          ) : null}
          {(f.tags ?? []).map((g) => (
            <div key={g.label} className="sdm-tags">
              <p>{g.label}</p>
              <ul>
                {g.chips.map((c) => (
                  <li key={c}>
                    {c} <Ico d={I.x} size={12} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {f.naming ? (
            <div className="sdm-tags">
              <p>{f.naming.label}</p>
              <code className="sdm-naming">{f.naming.value}</code>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
