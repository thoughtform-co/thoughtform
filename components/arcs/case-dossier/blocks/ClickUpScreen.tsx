import type { CSSProperties, ReactNode } from "react";

import type { Figure } from "../types";

type ScreenFigure = Extract<Figure, { kind: "screen" }>;

/**
 * ClickUp, as the team works in it, redrawn at the app's own sizes in a
 * 960-wide window and scaled to the frame (`--u`, one app pixel): the light
 * sidebar of spaces and lists, the header with its path and views, and
 *
 *   list  the list grouped by status, the task names (the ad names the
 *         fields write) and the custom fields as columns
 *   task  one task open: the strategist's raw notes on the left as they
 *         went to Claude, and the task Claude filed: its name, status,
 *         fields, and the brief in the team's template, gaps in brackets
 *
 * People are roles and codes are placeholders; no client data is drawn.
 */
export function ClickUpScreen({ figure }: { figure: ScreenFigure }) {
  return figure.layout === "task" ? <Task f={figure} /> : <List f={figure} />;
}

function Chrome({ f, children }: { f: ScreenFigure; children: ReactNode }) {
  const crumbs = f.crumbs ?? [];
  return (
    <div className="cku" data-layout={f.layout}>
      <aside className="cku-side">
        <p className="cku-ws">
          <b>S</b>
          {f.app}
        </p>
        <ul className="cku-tree">
          <li className="cku-tree__space">Paid social</li>
          <li data-on={crumbs.at(-1)?.includes("register") ? "" : undefined}>📋 Launch register</li>
          <li data-on={crumbs.at(-1)?.includes("queue") ? "" : undefined}>🚀 Launch queue</li>
          <li>🇩🇪 Paid ads internal</li>
          <li>🇳🇱 Static ads creation</li>
        </ul>
      </aside>
      <div className="cku-main">
        <header className="cku-top">
          <p className="cku-crumbs">
            {crumbs.map((c, i) => (
              <span key={c}>
                {i ? <i>/</i> : null}
                {c}
              </span>
            ))}
          </p>
          {f.layout === "list" ? (
            <ul className="cku-views">
              <li data-on="">List</li>
              <li>Board</li>
              <li>Table</li>
            </ul>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}

function List({ f }: { f: ScreenFigure }) {
  const cols = f.columns ?? [];
  return (
    <Chrome f={f}>
      <div className="cku-toolbar">
        <span>Group: Status</span>
        <span>Subtasks</span>
        <span className="cku-search">Search tasks…</span>
      </div>
      <div className="cku-list" style={{ "--cols": cols.length } as CSSProperties}>
        {(f.groups ?? []).map((g) => (
          <section key={g.status} className="cku-group">
            <p className="cku-group__head">
              <span className="cku-pill" style={{ background: g.tone }}>
                {g.status}
              </span>
              <em>{g.rows.length}</em>
            </p>
            <div className="cku-row cku-row--head">
              <span>Name</span>
              {cols.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            {g.rows.map((r) => (
              <div key={r.name} className="cku-row" data-lit={r.lit ? "" : undefined}>
                <span className="cku-name">
                  <i className="cku-dot" style={{ borderColor: g.tone }} />
                  <span>{r.name}</span>
                </span>
                {r.cells.map((c, i) => (
                  <span key={i} className="cku-cell">
                    {c ? <b>{c}</b> : <i className="cku-empty">–</i>}
                  </span>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
    </Chrome>
  );
}

function Task({ f }: { f: ScreenFigure }) {
  return (
    <Chrome f={f}>
      <div className="cku-task">
        {f.raw ? (
          <aside className="cku-raw">
            <p className="cku-raw__who">{f.raw.who}</p>
            <p className="cku-raw__msg">{f.raw.text}</p>
            <p className="cku-raw__reply">
              Brief in the video template, name composed. File it in Paid ads internal?
            </p>
            <p className="cku-raw__yes">Yes</p>
          </aside>
        ) : null}
        <div className="cku-doc">
          <p className="cku-title">{f.title}</p>
          <div className="cku-meta">
            {f.status ? <span className="cku-pill cku-pill--status">{f.status}</span> : null}
          </div>
          <dl className="cku-fields">
            {(f.fields ?? []).map((x) => (
              <div key={x.k}>
                <dt>{x.k}</dt>
                <dd>
                  <Gap text={x.v} />
                </dd>
              </div>
            ))}
          </dl>
          <div className="cku-desc">
            {(f.sections ?? []).map((s) => (
              <div key={s.h} className="cku-sec">
                <p className="cku-sec__h">{s.h}</p>
                <ul>
                  {s.lines.map((l, i) => (
                    <li key={i}>
                      {l.k ? <b>{l.k}: </b> : null}
                      <Gap text={l.v} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Chrome>
  );
}

/** A value with its [bracketed] gaps marked, the template's own convention. */
function Gap({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("[") ? (
          <mark key={i} className="cku-gap">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}
