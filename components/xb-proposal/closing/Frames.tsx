"use client";

/* Round two of the closing run (owner, 2026-10-12: "I find the font sizes of
   the headers too dominant. I really want them to be in frames", pointing at
   primeintellect.ai and voidzero.dev). Each section is ONE hairline frame
   whose cells share edges; a cell's title is a sentence at reading size, its
   lead in full ink and the rest a step down; items are numbered 1.1, 1.2.
   Same sheet as round one (`closing.css`, the `.xf` block). */

import { useState } from "react";

import type { ArcListGroup } from "@/lib/arcs/types";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";

import { Masthead, type MastheadCopy } from "../Masthead";

function section(id: string) {
  const s = X_BIONIC_PROPOSAL_ARC.sections.find((x) => x.id === id);
  if (!s) throw new Error(`x-bionic proposal: no section ${id}`);
  return s as unknown as {
    head: { sub?: string };
    groups?: readonly ArcListGroup[];
    actions?: readonly { href?: string }[];
    footerLine?: string;
  };
}

const PHASES = section("phases");
const WHO = section("how-we-work");
const CLOSE = section("close");
const EMAIL = CLOSE.actions?.[0]?.href ?? "mailto:vince@thoughtform.co";
const ADDRESS = EMAIL.replace(/^mailto:/, "");

const HEAD_WEEKS: MastheadCopy = {
  lines: ["The four", "weeks."],
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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function split(name: string): [string, string] {
  const i = name.indexOf(" · ");
  return i < 0 ? [name, ""] : [name.slice(0, i), cap(name.slice(i + 3))];
}
function label(l: string) {
  const [a, b = ""] = l.split(" · ");
  return `${a} · ${b}`;
}

/** A frame cell's title: the lead in full ink, the rest a step down. */
function Lead({ lead, rest }: { lead: string; rest?: string }) {
  return (
    <h3 className="xf-lead">
      {lead}
      {rest && <span> {rest}</span>}
    </h3>
  );
}

function PhaseItems({ g, n }: { g: ArcListGroup; n: number }) {
  return (
    <ol className="xf-list">
      {g.items.map((it, i) => (
        <li key={it.id}>
          <span className="xf-list__n">
            {n}.{i + 1}
          </span>
          <span className="xf-list__t">{it.tag}</span>
          <span className="xf-list__d">{it.name}</span>
        </li>
      ))}
    </ol>
  );
}

function PhaseFoot({ g }: { g: ArcListGroup }) {
  if (!g.foot) return null;
  return (
    <div className="xf-foot">
      <span className="xf-mono xf-gold">{g.foot.label}</span>
      <ul>
        {g.foot.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

/* ── the four weeks ───────────────────────────────────────────────────── */

/** D · one frame, three columns: the phase as a sentence, its numbered
    steps, done when at the floor. */
export function WeeksFrame() {
  const groups = PHASES.groups ?? [];
  return (
    <div className="xc xf">
      <Masthead copy={HEAD_WEEKS} />
      <div className="xf-frame xf-frame--3">
        {groups.map((g, gi) => (
          <article key={g.id} className="xf-cell xf-phase" data-later={gi === 2 || undefined}>
            <span className="xf-mono">{label(g.label)}</span>
            <Lead lead={`${g.blurb}.`} />
            <PhaseItems g={g} n={gi + 1} />
            <PhaseFoot g={g} />
          </article>
        ))}
      </div>
    </div>
  );
}

/** E · one frame, voidzero's index: the phases listed on the left, the
    chosen one open beside it, done when in its own cell. */
export function WeeksIndex() {
  const groups = PHASES.groups ?? [];
  const [on, setOn] = useState(0);
  const g = groups[on];
  return (
    <div className="xc xf">
      <Masthead copy={HEAD_WEEKS} />
      <div className="xf-frame xf-index">
        <nav className="xf-cell xf-index__nav" aria-label="Phases">
          {groups.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className="xf-index__btn"
              aria-pressed={i === on}
              onClick={() => setOn(i)}
            >
              <span className="xf-mono">{label(x.label)}</span>
              <span className="xf-index__name">{x.blurb}</span>
            </button>
          ))}
        </nav>
        <div className="xf-cell xf-index__body">
          <span className="xf-mono">{label(g.label)}</span>
          <Lead lead={`${g.blurb}.`} />
          <PhaseItems g={g} n={on + 1} />
        </div>
        <div className="xf-cell xf-index__foot">
          <PhaseFoot g={g} />
        </div>
      </div>
    </div>
  );
}

/* ── who takes part ───────────────────────────────────────────────────── */

/** One frame, two cells: X-Bionic's six seats numbered, Thoughtform's one
    seat and what it needs. */
export function WhoFrame() {
  const [xb, tf] = WHO.groups ?? [];
  const [who, what] = split(tf.items[0].name);
  return (
    <div className="xc xf">
      <Masthead copy={HEAD_WHO} />
      <div className="xf-frame xf-who">
        <div className="xf-cell">
          <span className="xf-mono">{xb.label}</span>
          <Lead lead={`${xb.label.replace(/^From /, "")}.`} rest={xb.blurb} />
          <ol className="xf-rows">
            {xb.items.map((it, i) => {
              const [role, duty] = split(it.name);
              return (
                <li key={it.id}>
                  <span className="xf-list__n">1.{i + 1}</span>
                  <span className="xf-rows__t">
                    {role}
                    <span> {duty}</span>
                  </span>
                  <span className="xf-mono xf-rows__m">{it.meta}</span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="xf-cell xf-who__tf">
          <span className="xf-mono">{tf.label}</span>
          <Lead lead={`${who}.`} rest={what} />
          <ol className="xf-rows">
            <li>
              <span className="xf-list__n">2.1</span>
              <span className="xf-rows__t">{tf.blurb?.replace(/\.$/, "")}</span>
              <span className="xf-mono xf-rows__m">{tf.items[0].meta}</span>
            </li>
          </ol>
          {tf.sub && (
            <div className="xf-foot">
              <span className="xf-mono xf-gold">
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
    </div>
  );
}

/* ── the contact ──────────────────────────────────────────────────────── */

/** One frame: the line and the way in on the left, the three facts on the
    right, the page's sign-off as the frame's floor. */
export function ContactFrame() {
  return (
    <div className="xc xf xf-contact">
      <div className="xf-frame xf-cf">
        <div className="xf-cell xf-cf__lead">
          <span className="xf-mono">X-Bionic · contact</span>
          <h2 className="xf-lead xf-lead--xl">
            Talk it through.
            <span> Questions on any of it, or dates for week one.</span>
          </h2>
          <div className="xf-actions">
            <a className="xf-btn" href={EMAIL}>
              Write to Vince <span aria-hidden>›</span>
            </a>
            <a className="xf-btn xf-btn--ghost" href={EMAIL}>
              {ADDRESS}
            </a>
          </div>
        </div>
        <dl className="xf-cell xf-cf__facts">
          <div>
            <dt className="xf-mono">Who</dt>
            <dd>Vince Buyssens</dd>
          </div>
          <div>
            <dt className="xf-mono">Base</dt>
            <dd>Antwerp, Belgium</dd>
          </div>
          <div>
            <dt className="xf-mono">For</dt>
            <dd>Ganesh, X-Bionic</dd>
          </div>
        </dl>
        <p className="xf-cell xf-mono xf-cf__sign">{CLOSE.footerLine}</p>
      </div>
    </div>
  );
}
