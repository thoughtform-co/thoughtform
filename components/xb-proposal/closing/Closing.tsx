/* The proposal's closing run (owner, 2026-10-12): the two weeks, who takes
   part, and the contact, redrawn at the page's own scale. Self-contained:
   one sheet (`closing.css`, `.xc`), the uniform head (`Masthead`), and the
   words read from the proposal's own record so no fact is restated here. */

import type { ArcListGroup, ArcListItem } from "@/lib/arcs/types";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";

import { Masthead, MastheadTitle, type MastheadCopy } from "../Masthead";

/* ── the record ───────────────────────────────────────────────────────── */

function section(id: string) {
  const s = X_BIONIC_PROPOSAL_ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`x-bionic proposal: no section ${id}`);
  return s as unknown as {
    head: { sub?: string; title: { pre: string; em?: string } };
    groups?: readonly ArcListGroup[];
    actions?: readonly { id: string; label: string; href?: string }[];
    footerLine?: string;
    signature?: string;
  };
}

const PHASES = section("phases");
const WHO = section("how-we-work");
const CLOSE = section("close");

const HEAD_WEEKS: MastheadCopy = {
  lines: ["The two", "weeks."],
  brief: PHASES.head.sub ?? "",
  survey: {
    title: "XB / PLAN · 05",
    brief: "XB / BRIEF · 05",
    state: "Phase one",
    titleCoord: "0040 / 1180",
    briefCoord: "1460 / 0240",
  },
};

const HEAD_WHO: MastheadCopy = {
  lines: ["Who takes", "part."],
  brief: WHO.head.sub ?? "",
  survey: {
    title: "XB / CREW · 06",
    brief: "XB / BRIEF · 06",
    state: "Phase one",
    titleCoord: "0040 / 1420",
    briefCoord: "1460 / 0480",
  },
};

/** "Digital lead · owns the result" → role, duty. */
function split(name: string): [string, string] {
  const i = name.indexOf(" · ");
  if (i < 0) return [name, ""];
  const duty = name.slice(i + 3);
  return [name.slice(0, i), duty.charAt(0).toUpperCase() + duty.slice(1)];
}

/** "Phase one · week one" → "Phase one", "Week one" */
function label(l: string): [string, string] {
  const [a, b = ""] = l.split(" · ");
  return [a, b.charAt(0).toUpperCase() + b.slice(1)];
}

const pad = (n: number) => String(n + 1).padStart(2, "0");

/* ── the two weeks ────────────────────────────────────────────────────── */

function Items({ items }: { items: readonly ArcListItem[] }) {
  return (
    <ol className="xc-items">
      {items.map((it, i) => (
        <li key={it.id} className="xc-item">
          <span className="xc-mono xc-item__n">{pad(i)}</span>
          <span className="xc-mono xc-item__tag">{it.tag}</span>
          <span className="xc-item__name">{it.name}</span>
        </li>
      ))}
    </ol>
  );
}

function Foot({ foot }: { foot?: ArcListGroup["foot"] }) {
  if (!foot) return null;
  return (
    <div className="xc-foot">
      <span className="xc-mono xc-foot__label">{foot.label}</span>
      <ul className="xc-foot__lines">
        {foot.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/** A · three columns on shared edges, one ruled field (unsiloed's
    "how it is built"). */
export function WeeksColumns() {
  const groups = PHASES.groups ?? [];
  return (
    <div className="xc xc-weeks xc-weeks--cols">
      <Masthead copy={HEAD_WEEKS} />
      <div className="xc-cols">
        {groups.map((g, gi) => {
          const [k, w] = label(g.label);
          return (
            <article key={g.id} className="xc-col" data-later={gi === 2 || undefined}>
              <header className="xc-col__head">
                <span className="xc-mono xc-col__k">
                  {k} · {w}
                </span>
                <h3 className="xc-col__name">{g.blurb}</h3>
              </header>
              <Items items={g.items} />
              <Foot foot={g.foot} />
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** B · a time axis: phase one's two weeks a solid run, the quarter after a
    break, then the work hung under each mark. */
export function WeeksAxis() {
  const groups = PHASES.groups ?? [];
  return (
    <div className="xc xc-weeks xc-weeks--axis">
      <Masthead copy={HEAD_WEEKS} />
      <div className="xc-axis" aria-hidden>
        <i className="xc-axis__run" />
        <i className="xc-axis__gap" />
        {groups.map((g, gi) => (
          <span key={g.id} className="xc-axis__mark" data-later={gi === 2 || undefined} />
        ))}
      </div>
      <div className="xc-axis-cols">
        {groups.map((g, gi) => {
          const [k, w] = label(g.label);
          return (
            <article key={g.id} className="xc-acol" data-later={gi === 2 || undefined}>
              <span className="xc-mono xc-col__k">
                {k} · {w}
              </span>
              <h3 className="xc-acol__name">{g.blurb}</h3>
              <Items items={g.items} />
              <Foot foot={g.foot} />
            </article>
          );
        })}
      </div>
    </div>
  );
}

/** C · three ruled rows read left to right: when, what, done when. */
export function WeeksRows() {
  const groups = PHASES.groups ?? [];
  return (
    <div className="xc xc-weeks xc-weeks--rows">
      <Masthead copy={HEAD_WEEKS} />
      <div className="xc-rows">
        {groups.map((g, gi) => {
          const [k, w] = label(g.label);
          return (
            <article key={g.id} className="xc-row" data-later={gi === 2 || undefined}>
              <header className="xc-row__when">
                <span className="xc-mono xc-col__k">
                  {k} · {w}
                </span>
                <h3 className="xc-row__name">{g.blurb}</h3>
              </header>
              <ol className="xc-row__items">
                {g.items.map((it, i) => (
                  <li key={it.id}>
                    <span className="xc-mono xc-item__tag">
                      {pad(i)} · {it.tag}
                    </span>
                    <span className="xc-item__name">{it.name}</span>
                  </li>
                ))}
              </ol>
              <Foot foot={g.foot} />
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ── who takes part ───────────────────────────────────────────────────── */

function ThoughtformPanel({ group }: { group: ArcListGroup }) {
  const v = group.items[0];
  const [who, what] = split(v.name);
  return (
    <aside className="xc-tf">
      <span className="xc-mono xc-tf__k">{group.label}</span>
      <h3 className="xc-tf__name">{who}</h3>
      <p className="xc-tf__what">{what}</p>
      <p className="xc-mono xc-tf__time">{v.meta}</p>
      {group.sub && (
        <div className="xc-tf__needs">
          <span className="xc-mono xc-tf__k">
            {group.sub.label} · {group.sub.blurb}
          </span>
          <ul>
            {group.sub.items.map((n) => (
              <li key={n.id}>
                <span className="xc-mono xc-tf__tag">{n.tag}</span>
                <span>{n.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

/** A · a roster: six ruled rows (role, what it is for, the time it costs),
    Thoughtform in its own panel beside it. */
export function WhoRoster() {
  const [xb, tf] = WHO.groups ?? [];
  return (
    <div className="xc xc-who xc-who--roster">
      <Masthead copy={HEAD_WHO} />
      <div className="xc-roster">
        <div className="xc-roster__list">
          <div className="xc-roster__head">
            <span className="xc-mono">{xb.label}</span>
            <span className="xc-mono">{xb.blurb}</span>
          </div>
          <ul>
            {xb.items.map((it) => {
              const [role, duty] = split(it.name);
              return (
                <li key={it.id} className="xc-roster__row">
                  <span className="xc-roster__role">{role}</span>
                  <span className="xc-roster__duty">{duty}</span>
                  <span className="xc-mono xc-roster__time">{it.meta}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <ThoughtformPanel group={tf} />
      </div>
    </div>
  );
}

/** B · six cells on shared edges, one per seat, Thoughtform a band under
    them. */
export function WhoGrid() {
  const [xb, tf] = WHO.groups ?? [];
  const v = tf.items[0];
  const [who, what] = split(v.name);
  return (
    <div className="xc xc-who xc-who--grid">
      <Masthead copy={HEAD_WHO} />
      <div className="xc-grid__k">
        <span className="xc-mono">{xb.label}</span>
        <span className="xc-mono xc-dim">{xb.blurb}</span>
      </div>
      <ul className="xc-grid">
        {xb.items.map((it) => {
          const [role, duty] = split(it.name);
          return (
            <li key={it.id} className="xc-cell">
              <span className="xc-mono xc-cell__time">{it.meta}</span>
              <span className="xc-cell__role">{role}</span>
              <span className="xc-cell__duty">{duty}</span>
            </li>
          );
        })}
      </ul>
      <div className="xc-band">
        <div className="xc-band__who">
          <span className="xc-mono xc-tf__k">{tf.label}</span>
          <span className="xc-band__name">
            {who} <span className="xc-dim">· {what}</span>
          </span>
          <span className="xc-mono xc-tf__time">{v.meta}</span>
        </div>
        {tf.sub && (
          <div className="xc-band__needs">
            <span className="xc-mono xc-tf__k">
              {tf.sub.label} · {tf.sub.blurb}
            </span>
            <ul>
              {tf.sub.items.map((n) => (
                <li key={n.id}>{n.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── the contact ──────────────────────────────────────────────────────── */

const EMAIL = CLOSE.actions?.[0]?.href ?? "mailto:vince@thoughtform.co";
const ADDRESS = EMAIL.replace(/^mailto:/, "");

/** A · the line large on the left, a card with the way in on the right. */
export function ContactSplit() {
  return (
    <div className="xc xc-contact xc-contact--split">
      <div className="xc-cs">
        <div className="xc-cs__lead">
          <h2 className="xc-big" aria-label="Talk it through.">
            <span aria-hidden>Talk it</span>
            <span className="xc-big__em" aria-hidden>
              through.
            </span>
          </h2>
          <p className="xc-cs__sub">{CLOSE.head.sub}</p>
        </div>
        <div className="xc-card">
          <span className="xc-mono xc-card__k">Write to</span>
          <a className="xc-card__mail" href={EMAIL}>
            {ADDRESS}
          </a>
          <dl className="xc-card__rows">
            <div>
              <dt className="xc-mono">Who</dt>
              <dd>Vince Buyssens</dd>
            </div>
            <div>
              <dt className="xc-mono">Base</dt>
              <dd>Antwerp, Belgium</dd>
            </div>
            <div>
              <dt className="xc-mono">For</dt>
              <dd>Ganesh, X-Bionic</dd>
            </div>
          </dl>
          <a className="xc-btn" href={EMAIL}>
            <span>Write to Vince</span>
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
      <p className="xc-mono xc-sign">{CLOSE.footerLine}</p>
    </div>
  );
}

/** B · the masthead title centred, then one ruled strip: the address, the
    base, who it is for. */
export function ContactStrip() {
  return (
    <div className="xc xc-contact xc-contact--strip">
      <MastheadTitle lines={["Talk it", "through."]} />
      <p className="xc-strip__sub">{CLOSE.head.sub}</p>
      <ul className="xc-strip">
        <li>
          <span className="xc-mono">Write to</span>
          <a href={EMAIL}>{ADDRESS}</a>
        </li>
        <li>
          <span className="xc-mono">Based in</span>
          <span>Antwerp, Belgium</span>
        </li>
        <li>
          <span className="xc-mono">Prepared for</span>
          <span>Ganesh, X-Bionic</span>
        </li>
      </ul>
      <a className="xc-btn xc-btn--c" href={EMAIL}>
        <span>Write to Vince</span>
        <span aria-hidden>→</span>
      </a>
      <p className="xc-mono xc-sign">{CLOSE.footerLine}</p>
    </div>
  );
}
