"use client";

import type { CSSProperties } from "react";

import {
  CHIP_WORD,
  IDLE_LINES,
  VERDICT_INDEX,
  VERDICT_WORDS,
  blockReason,
  blockState,
  boldLead,
  checkState,
  failReason,
  isSettled,
  revealIndex,
  strangerLine,
  verdictLine,
  verdictTone,
  votes,
  type Block,
} from "./derive";
import type { Check, Job } from "./types";

/**
 * THE CHECKS — the dark rail, the one object that joins the run to the
 * rubric (Moira's bench grammar, live). One row per rubric block, each a
 * state and one line of reasoning; a row opens to its checks and their
 * three votes. The verdict closes the rail, in the rubric's own word.
 *
 * ⚠ ROWS ARE ALWAYS MOUNTED, BUILT FROM THE RUBRIC, NOT FROM THE JOB. Each
 * carries `data-settled` and an inline `--i`; the sheet swaps two stacked
 * faces on the flag, delayed by the index, so the rows settle one after
 * another however the 400 ms poll re-renders them. A new run clears the
 * job, every row unsettles at once, and only the way back in is staggered.
 */
export function Checks({
  blocks,
  checks,
  job,
  open,
  onToggle,
  runsExpected,
  perFrame,
}: {
  blocks: Block[];
  checks: Check[];
  job: Job | null;
  open: string | null;
  onToggle: (letter: string) => void;
  runsExpected: number;
  perFrame: number;
}) {
  const f = job?.status === "done" ? job.final : null;
  const errored = job?.status === "error";
  const settledVerdict = !!f || errored;
  const vTone = errored ? "na" : verdictTone(f?.verdict);
  const stranger = strangerLine(job);

  return (
    <aside className="tb-rail" aria-label="The checks">
      <div className="tb-cellhead">
        <span className="tb-label">The checks</span>
        <span className="tb-rail__meta">
          {perFrame || "–"} per frame · {runsExpected} runs
        </span>
      </div>

      <ol className="tb-blocks">
        {blocks.map((b) => {
          const t = blockState(b, job);
          const settled = isSettled(t);
          const isOpen = open === b.letter;
          const idleTone = t === "running" ? "running" : "pending";
          return (
            <li
              key={b.letter}
              className="tb-block"
              data-tone={t}
              data-settled={settled ? "true" : "false"}
              style={{ "--i": revealIndex(b) } as CSSProperties}
            >
              <button
                type="button"
                className="tb-block__btn"
                aria-expanded={isOpen}
                aria-controls={`tb-block-${b.letter}`}
                onClick={() => onToggle(b.letter)}
              >
                <span className="tb-block__name">{b.name}</span>
                <span className="tb-block__chips">
                  <span
                    className="tb-chip"
                    data-when="idle"
                    data-tone={idleTone}
                    aria-hidden={settled}
                  >
                    {CHIP_WORD[idleTone]}
                  </span>
                  <span className="tb-chip" data-when="done" data-tone={t} aria-hidden={!settled}>
                    {CHIP_WORD[t]}
                  </span>
                </span>
                <span className="tb-block__line" data-when="idle" aria-hidden={settled}>
                  {IDLE_LINES[b.letter] ?? ""}
                </span>
                <span className="tb-block__line" data-when="done" aria-hidden={!settled}>
                  {settled ? blockReason(b, job) : ""}
                </span>
                {b.letter === "A" && stranger && (
                  <span className="tb-block__extra">{stranger}</span>
                )}
              </button>
              <ul id={`tb-block-${b.letter}`} className="tb-checklist" hidden={!isOpen}>
                {b.checks.map((c) => {
                  const ct = checkState(c, job);
                  const off = ct === "fail" || ct === "review";
                  const v = votes(c.id, job?.runs ?? [], runsExpected);
                  return (
                    <li key={c.id} className="tb-check" data-tone={ct}>
                      <span className="tb-check__id">{c.id}</span>
                      <span className="tb-check__text">
                        {off ? failReason(c) : boldLead(c.check)}
                      </span>
                      {c.computed ? (
                        <span className="tb-votes tb-votes--code">in code</span>
                      ) : (
                        <span className="tb-votes" role="img" aria-label={`Votes: ${v.join(", ")}`}>
                          {v.map((x, i) => (
                            <i key={i} data-vote={x} />
                          ))}
                        </span>
                      )}
                      <span className="tb-chip tb-chip--mini" data-tone={ct}>
                        {CHIP_WORD[ct]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      {settledVerdict ? (
        <div
          key={job?.id}
          className="tb-verdict"
          data-tone={vTone}
          style={{ "--i": VERDICT_INDEX } as CSSProperties}
        >
          <div className="tb-verdict__top">
            <span className="tb-verdict__word">
              {errored ? "Error" : (VERDICT_WORDS[f?.verdict ?? ""] ?? f?.verdict)}
            </span>
            {!errored && (
              <span className="tb-verdict__runs" aria-label="The three runs">
                {(f?.run_verdicts ?? []).map((r, i) => (
                  <span key={i} className="tb-chip tb-chip--mini" data-tone={verdictTone(r)}>
                    {r === "PASS_WITH_NOTES" ? "Note" : (VERDICT_WORDS[r] ?? r)}
                  </span>
                ))}
              </span>
            )}
          </div>
          <p className="tb-verdict__line">{verdictLine(job, checks)}</p>
          <p className="tb-verdict__foot">Reporting only. A person is the gate.</p>
        </div>
      ) : job ? (
        <p className="tb-rail__idle">
          Three grades, the majority per check. The colour settles first: it is measured, not
          judged.
        </p>
      ) : (
        <p className="tb-rail__idle">
          Nothing has looked yet. Generate or drop an image, then run the checks: each says pass,
          review or fail. Never a raw score.
        </p>
      )}
    </aside>
  );
}
