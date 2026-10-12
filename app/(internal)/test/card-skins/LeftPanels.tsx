import { Glyph } from "@/components/arcs/ArcLeverage";
import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";

import type { Job } from "../proof-cards/parts";
import { resultLabel } from "../proof-cards/parts";
import { Figure } from "../proof-cards/RoundFour";

/**
 * The left panel, four ways (owner, 2026-10-12, on the double-hairline
 * card): more air, no "Solve it together" label, and the Claude steps and
 * the tools connected in the manner of the references. Read off the owner's
 * video (`docs/video-reads/226ae64e-cards-1-1-v1-2160p-a6d4e79c.cdaf`:
 * orthogonal stems into a bus, one line on to a box with a filled header)
 * and Unsiloed's sorter (curves converging on a node, a bracketed list).
 *
 *   spread  the rail as now, the panel spread top to bottom
 *   bus     the steps side by side, stems into a bus, one centre line on
 *   group   the steps in a box with a filled header, centre connectors
 *   curves  the steps' curves converge on a node, then the tools as a list
 *
 * Every word is the live record's (`X_BIONIC_JOBS`).
 */
export type Panel = "spread" | "bus" | "group" | "curves" | "unified" | "arc";

export function LeftPanelCard({ job, panel }: { job: Job; panel: Panel }) {
  const d = disciplineOf(job.bucket);
  const tools = job.scale?.tools ?? [];
  return (
    <article
      className={`pk-card pk-c pk-h pk-i pk-i--band pk-i--r-cards pk-i--s-inset pk-l pk-l--${panel}`}
      aria-label={job.title}
    >
      <header className="pk-c__head pk-h__head">
        <span className="pk-h__client">{job.client}</span>
        <span className="pk-h__name">{job.title}</span>
        <span className="pk-h__ws">
          <Glyph kind={d.glyph} />
          {d.long}
        </span>
      </header>
      <div className="pk-i__body">
        <div className="pk-l__words">
          {panel === "arc" ? null : (
            <div className="pk-c__box pk-i__brief pk-l__brief">
              <p className="pk-c__tab">The brief</p>
              <p className="pk-lede">{job.ask}</p>
            </div>
          )}
          {panel === "spread" || panel === "unified" || panel === "arc" ? null : (
            <div className="pk-c__box pk-i__big pk-l__embed">
              <p className="pk-c__tab">Embed</p>
              <p className="pk-body">{job.embed}</p>
            </div>
          )}
          {panel === "spread" ? <Spread job={job} tools={tools} /> : null}
          {panel === "bus" ? <Bus job={job} tools={tools} /> : null}
          {panel === "group" ? <Group job={job} tools={tools} /> : null}
          {panel === "curves" ? <Curves job={job} tools={tools} /> : null}
          {panel === "unified" ? <Unified job={job} tools={tools} /> : null}
          {panel === "arc" ? <ArcFlow job={job} tools={tools} /> : null}
        </div>
        <Figure job={job} wide ba={false} />
      </div>
      <div className="pk-i__band">
        <p className="pk-i__band-head" aria-hidden="true">
          <i />
          The result
          <span />
        </p>
        <section className="pk-i__cell">
          <Glyph kind="clock" />
          <p className="pk-i__cell-k">
            {resultLabel(job)}
            {job.result.label === "The return" ? null : " · estimated"}
          </p>
          <div className="pk-i__bars">
            <p className="pk-i__bar-row">
              <span className="pk-i__bar-k">Before</span>
              <i className="pk-i__bar" data-w="long" aria-hidden="true" />
              <span className="pk-i__bar-v">{job.result.before}</span>
            </p>
            <p className="pk-i__bar-row" data-lit="true">
              <span className="pk-i__bar-k">Now</span>
              <i className="pk-i__bar" data-w="short" aria-hidden="true" />
              <span className="pk-i__bar-v">{job.result.now}</span>
            </p>
          </div>
        </section>
        <section className="pk-i__cell">
          <Glyph kind={d.glyph} />
          <p className="pk-i__cell-k">What it now allows</p>
          <p className="pk-i__cell-v">{job.result.allows}</p>
        </section>
      </div>
    </article>
  );
}

function Tools({ tools }: { tools: readonly string[] }) {
  return (
    <ul className="pk-i__tools pk-l__tools" aria-label="Plugs into">
      {tools.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/** The rail as on the page, spread to the panel's height. */
function Spread({ job, tools }: { job: Job; tools: readonly string[] }) {
  return (
    <ol className="pk-l__rail" aria-label="The work">
      <li className="pk-c__box pk-i__big pk-l__embed">
        <p className="pk-c__tab">Embed</p>
        <p className="pk-body">{job.embed}</p>
      </li>
      {job.did.map((t, i) => (
        <li key={t} className="pk-i__small">
          <span className="pk-i__small-tab">Claude {i + 1}</span>
          <span className="pk-i__small-text">{t}</span>
        </li>
      ))}
      <li className="pk-l__rail-tools">
        <Tools tools={tools} />
      </li>
    </ol>
  );
}

/** The video's first frame: the steps side by side, a stem from each into
 *  a bus, one line down the centre to the tools. */
function Bus({ job, tools }: { job: Job; tools: readonly string[] }) {
  return (
    <div className="pk-l__busbox">
      <ol className="pk-l__cols" aria-label="Claude did">
        {job.did.map((t, i) => (
          <li key={t}>
            <span className="pk-l__col-tab">Claude {i + 1}</span>
            <span className="pk-l__col-text">{t}</span>
          </li>
        ))}
      </ol>
      <i className="pk-l__bus" aria-hidden="true" />
      <Tools tools={tools} />
    </div>
  );
}

/** The video's summary box: the steps in one box with a filled header,
 *  square bullets and dashed dividers; centre lines between the boxes. */
function Group({ job, tools }: { job: Job; tools: readonly string[] }) {
  return (
    <>
      <div className="pk-l__group">
        <p className="pk-l__group-head">Claude</p>
        <ol aria-label="Claude did">
          {job.did.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </div>
      <Tools tools={tools} />
    </>
  );
}

/** Unsiloed's sorter: each step's curve converges on one node, and one line
 *  goes on to the tools as a bracketed list. */
function Curves({ job, tools }: { job: Job; tools: readonly string[] }) {
  return (
    <div className="pk-l__curves">
      <ol className="pk-l__steps" aria-label="Claude did">
        {job.did.map((t, i) => (
          <li key={t}>
            <span className="pk-l__col-tab">Claude {i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
      <svg
        className="pk-l__wires"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {[16.7, 50, 83.3].map((y) => (
          <path key={y} d={`M0 ${y} C 45 ${y}, 45 50, 80 50`} />
        ))}
        <path d="M80 50 H100" />
      </svg>
      <i className="pk-l__node" aria-hidden="true" />
      <div className="pk-l__list">
        <p className="pk-l__list-head">[ Plugs into ]</p>
        <ul>
          {tools.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Block 11 (owner, 2026-10-12, on 8): adoption and automation in ONE
 *  frame, "Embed and build": the embed line, then the three steps on the
 *  bus inside it; from the frame one line drops to a bus with a stem into
 *  every tool. */
function Unified({ job, tools }: { job: Job; tools: readonly string[] }) {
  return (
    <>
      <div className="pk-c__box pk-l__unit">
        <section className="pk-l__part">
          <p className="pk-l__part-tab" data-kind="embed">
            Embed
          </p>
          <p className="pk-l__part-line">{job.embed}</p>
        </section>
        <section className="pk-l__part">
          <p className="pk-l__part-tab">Build</p>
          <ol className="pk-l__cols" aria-label="Claude did">
            {job.did.map((t, i) => (
              <li key={t}>
                <span className="pk-l__col-tab">Claude {i + 1}</span>
                <span className="pk-l__col-text">{t}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <ul className="pk-l__fan" aria-label="Plugs into">
        {tools.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </>
  );
}

/** Block 12 (owner, 2026-10-12, on 9): the card reads the Arc and ends on
 *  the vision section's plug-in. 01 Navigate holds the brief, 02 Encode the
 *  embed (green, the team's, as the vision's "Embed in your team"), 03 Build
 *  what Claude did, 04 the stack it plugs into; every label in the vision
 *  section's own form (a square, the number, the word), none filled. */
function ArcFlow({ job, tools }: { job: Job; tools: readonly string[] }) {
  return (
    <>
      <div className="pk-c__box pk-l__arc-box">
        <p className="pk-l__arc-tab">
          <i />
          01 · Navigate
        </p>
        <p className="pk-lede">{job.ask}</p>
      </div>
      <div className="pk-c__box pk-l__arc-box" data-kind="team">
        <p className="pk-l__arc-tab">
          <i />
          02 · Encode
        </p>
        <p className="pk-body">{job.embed}</p>
      </div>
      <div className="pk-c__box pk-l__arc-box">
        <p className="pk-l__arc-tab">
          <i />
          03 · Build with Claude
        </p>
        <ol className="pk-l__arc-steps" aria-label="Claude did">
          {job.did.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
      </div>
      <div className="pk-l__arc-stack">
        <p className="pk-l__arc-tab pk-l__arc-tab--bare">
          <i />
          04 · Plug into {job.client}&apos;s stack
        </p>
        <ul className="pk-i__tools pk-l__tools" aria-label="Plugs into">
          {tools.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
