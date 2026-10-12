import type React from "react";

import { Glyph } from "@/components/arcs/ArcLeverage";
import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";

import { type Job, resultLabel } from "./parts";
import { PRACTICE } from "./practice";
import { Figure } from "./RoundFour";

/**
 * Round six (owner, 2026-10-12): 12's information architecture (every word
 * on the left, the wide before and after on the right) harmonised with 3C.
 *
 *   the boxes   3C's own: the tab INSIDE the frame at its top-left corner
 *   the rail    one unbroken gold line from the brief box's bottom edge down
 *               to the last step, a tick into every step
 *   the steps   Embed and Empower as 3C's boxes; Claude 1 to 3 as smaller
 *               intermediate steps between them, set further in
 *   the foot    what it now allows, then the time saved, stacked vertically
 *               under the steps, one flow
 */
export function DirectionI({
  job,
  ba = true,
  left,
  phases = false,
  scale = false,
  center = false,
  band = false,
  refine,
}: {
  job: Job;
  /** Two panes (before and after) or the one visual. */
  ba?: boolean;
  /** The left column's share of the body, e.g. "55%"; 14 keeps its 42/58. */
  left?: string;
  /** U3 (owner, 2026-10-12, on 15): no gate, a divider over the time saved,
   *  and the steps in the vision's own words: embed to identify the
   *  problem, solve it together, plug it into their system. */
  phases?: boolean;
  /** U4 (owner, 2026-10-12, on 18): every step open, the last step named
   *  Scale with what plugs in set as code, the brief and its answer a size
   *  smaller. */
  scale?: boolean;
  /** U6 (owner, 2026-10-12, block 20): the visual in the CENTRE, the brief
   *  and the steps on the left, what it now allows and the time saved on
   *  the right; everything else block 19's. */
  center?: boolean;
  /** U8 (owner, 2026-10-12, block 21, after Atomic Tessellator's case
   *  cards): the process left, the visual right, and the time saved and
   *  what it now allows side by side in a quiet band under both. */
  band?: boolean;
  /** U9 (owner, 2026-10-12, blocks 22 to 24): three finishing passes on 21. */
  refine?: "index" | "cards" | "ledger";
}) {
  const p = PRACTICE[job.id];
  const d = disciplineOf(job.bucket);
  return (
    <article
      className={`pk-card pk-c pk-h pk-i${scale ? " pk-i--scale" : ""}${center ? " pk-i--center" : ""}${band ? " pk-i--band" : ""}${refine ? ` pk-i--r-${refine}` : ""}`}
      aria-label={p.name}
      style={left ? ({ "--pk-left": left } as React.CSSProperties) : undefined}
    >
      <header className="pk-c__head pk-h__head">
        <span className="pk-h__client">{job.client}</span>
        <span className="pk-h__name">{p.name}</span>
        <span className="pk-h__ws">
          <Glyph kind={d.glyph} />
          {d.long}
        </span>
      </header>
      {band ? (
        <BandBody job={job} ba={ba} />
      ) : center ? (
        <div className="pk-i__body pk-i__body--center">
          <div className="pk-i__words pk-i__words--left">
            <div className="pk-c__box pk-i__brief">
              <p className="pk-c__tab">The brief</p>
              <p className="pk-lede">{p.problem}</p>
            </div>
            <ol className="pk-i__flow" aria-label="The work">
              <li className="pk-c__box pk-i__big">
                <p className="pk-c__tab">Embed</p>
                <p className="pk-body">{phases ? p.identify : p.embed}</p>
              </li>
              {phases ? <li className="pk-i__label">Solve it together</li> : null}
              {job.did.map((t, i) => (
                <li key={t} className="pk-i__small">
                  <span className="pk-i__small-tab">Claude {i + 1}</span>
                  <span className="pk-i__small-text">{t}</span>
                </li>
              ))}
              <li className="pk-c__box pk-i__big">
                <p className="pk-c__tab">{scale ? "Scale" : phases ? "Plug in" : "Empower"}</p>
                {scale ? (
                  <p className="pk-i__code">
                    <code>skill</code> <span>+</span> <code>evals</code> <span>+</span>{" "}
                    <code>tool</code> <span className="pk-i__code-to">→</span>{" "}
                    <span className="pk-i__code-dest">{job.client}&apos;s own system</span>
                  </p>
                ) : (
                  <p className="pk-body">{phases ? p.plug : p.empower}</p>
                )}
              </li>
            </ol>
          </div>
          <Figure job={job} wide ba={ba} />
          <div className="pk-i__words pk-i__words--right">
            {phases ? <hr className="pk-i__rule" /> : null}
            <div className="pk-c__box pk-i__saved">
              <p className="pk-c__tab">
                {resultLabel(job)}
                {job.result.label === "The return" ? null : " · estimated"}
              </p>
              <div className="pk-i__bars">
                <p className="pk-i__bar-row">
                  <span className="pk-i__bar-k">Before</span>
                  <i className="pk-i__bar" data-w="long" aria-hidden="true" />
                  <span className="pk-i__bar-v">{p.before}</span>
                </p>
                <p className="pk-i__bar-row" data-lit="true">
                  <span className="pk-i__bar-k">Now</span>
                  <i className="pk-i__bar" data-w="short" aria-hidden="true" />
                  <span className="pk-i__bar-v">{p.now}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="pk-c__box pk-c__box--lit pk-i__allows">
            <p className="pk-c__tab">What it now allows</p>
            <p className="pk-lede">{job.result.allows}</p>
          </div>
        </div>
      ) : (
        <div className="pk-i__body">
          <div className="pk-i__words">
            <div className="pk-c__box pk-i__brief">
              <p className="pk-c__tab">The brief</p>
              <p className="pk-lede">{p.problem}</p>
            </div>
            <ol className="pk-i__flow" aria-label="The work">
              <li className="pk-c__box pk-i__big">
                <p className="pk-c__tab">Embed</p>
                <p className="pk-body">{phases ? p.identify : p.embed}</p>
              </li>
              {phases ? <li className="pk-i__label">Solve it together</li> : null}
              {job.did.map((t, i) => (
                <li key={t} className="pk-i__small">
                  <span className="pk-i__small-tab">Claude {i + 1}</span>
                  <span className="pk-i__small-text">{t}</span>
                </li>
              ))}
              <li className="pk-c__box pk-i__big">
                <p className="pk-c__tab">{scale ? "Scale" : phases ? "Plug in" : "Empower"}</p>
                {scale ? (
                  <p className="pk-i__code">
                    <code>skill</code> <span>+</span> <code>evals</code> <span>+</span>{" "}
                    <code>tool</code> <span className="pk-i__code-to">→</span>{" "}
                    <span className="pk-i__code-dest">{job.client}&apos;s own system</span>
                  </p>
                ) : (
                  <p className="pk-body">{phases ? p.plug : p.empower}</p>
                )}
              </li>
            </ol>
            {phases ? <hr className="pk-i__rule" /> : null}
            <div className="pk-c__box pk-i__saved">
              <p className="pk-c__tab">
                {resultLabel(job)}
                {job.result.label === "The return" ? null : " · estimated"}
              </p>
              <div className="pk-i__bars">
                <p className="pk-i__bar-row">
                  <span className="pk-i__bar-k">Before</span>
                  <i className="pk-i__bar" data-w="long" aria-hidden="true" />
                  <span className="pk-i__bar-v">{p.before}</span>
                </p>
                <p className="pk-i__bar-row" data-lit="true">
                  <span className="pk-i__bar-k">Now</span>
                  <i className="pk-i__bar" data-w="short" aria-hidden="true" />
                  <span className="pk-i__bar-v">{p.now}</span>
                </p>
              </div>
            </div>
            <div className="pk-c__box pk-c__box--lit pk-i__allows">
              <p className="pk-c__tab">What it now allows</p>
              <p className="pk-lede">{job.result.allows}</p>
            </div>
          </div>
          <Figure job={job} wide ba={ba} />
        </div>
      )}
      {phases ? null : (
        <p className="pk-gate">
          <span className="pk-gate__key">The gate</span>
          <span className="pk-gate__who">{job.gate.who}</span>
          {job.gate.line ? <span className="pk-gate__line">{job.gate.line}</span> : null}
        </p>
      )}
    </article>
  );
}

function BandBody({ job, ba }: { job: Job; ba: boolean }) {
  const p = PRACTICE[job.id];
  return (
    <>
      <div className="pk-i__body">
        <div className="pk-i__words">
          <div className="pk-c__box pk-i__brief">
            <p className="pk-c__tab">The brief</p>
            <p className="pk-lede">{p.problem}</p>
          </div>
          <ol className="pk-i__flow" aria-label="The work">
            <li className="pk-c__box pk-i__big">
              <p className="pk-c__tab">Embed</p>
              <p className="pk-body">{p.identify}</p>
            </li>
            <li className="pk-i__label">Solve it together</li>
            {job.did.map((t, i) => (
              <li key={t} className="pk-i__small">
                <span className="pk-i__small-tab">Claude {i + 1}</span>
                <span className="pk-i__small-text">{t}</span>
              </li>
            ))}
            <li className="pk-c__box pk-i__big">
              <p className="pk-c__tab">Scale</p>

              <ul className="pk-i__tools" aria-label="Plugs into">
                {job.scale?.tools.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </li>
          </ol>
        </div>
        <Figure job={job} wide ba={ba} />
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
              <span className="pk-i__bar-v">{p.before}</span>
            </p>
            <p className="pk-i__bar-row" data-lit="true">
              <span className="pk-i__bar-k">Now</span>
              <i className="pk-i__bar" data-w="short" aria-hidden="true" />
              <span className="pk-i__bar-v">{p.now}</span>
            </p>
          </div>
        </section>
        <section className="pk-i__cell">
          <Glyph kind={disciplineOf(job.bucket).glyph} />
          <p className="pk-i__cell-k">What it now allows</p>
          <p className="pk-i__cell-v">{job.result.allows}</p>
        </section>
      </div>
    </>
  );
}
