"use client";

import type { Check, Job, RailState } from "./types";

/**
 * The rail of named checks — the one object that joins the run to the
 * rubric (the bench grammar, ADR-043 in Moira; here it is live). One row
 * per per-frame check, grouped by the rubric's block; a state, never a
 * score. `unsure` is shown when the three runs split on a check, with the
 * vote verbatim: that is the "it even says I'm not really sure" beat, and
 * it comes straight from the harness's `split_answers`.
 */
export function railState(check: Check, job: Job | null): { state: RailState; note: string } {
  if (!job || job.status === "queued" || job.status === "drawing" || job.status === "measuring") {
    return { state: "pending", note: "" };
  }
  const final = job.final;
  if (final && (job.status === "done" || job.status === "error")) {
    if (final.split_answers && final.split_answers[check.id]) {
      return { state: "unsure", note: final.split_answers[check.id] };
    }
    if (final.unanswered?.includes(check.id)) return { state: "unsure", note: "not answered" };
    if (!(check.id in (final.checks ?? {}))) return { state: "na", note: "" };
    return {
      state: final.checks[check.id] ? "pass" : "fail",
      note: check.computed ? "in code" : "",
    };
  }
  const runs = job.runs ?? [];
  if (runs.length === 0) return { state: "running", note: "run 0/3" };
  const votes = runs
    .map((r) => r.checks?.[check.id])
    .filter((v) => typeof v === "boolean") as boolean[];
  const yes = votes.filter(Boolean).length;
  return { state: "running", note: `run ${runs.length}/3 · ${yes}/${votes.length} pass` };
}

export function Rail({
  checks,
  job,
  compact = false,
}: {
  checks: Check[];
  job: Job | null;
  compact?: boolean;
}) {
  const perFrame = checks.filter((c) => !c.set_level);
  const blocks: Array<[string, Check[]]> = [];
  for (const c of perFrame) {
    const last = blocks[blocks.length - 1];
    if (last && last[0] === c.block) last[1].push(c);
    else blocks.push([c.block, [c]]);
  }
  return (
    <div
      className={`tb-rail${compact ? " tb-rail--compact" : ""}`}
      role="list"
      aria-label="the rubric's checks"
    >
      {blocks.map(([block, rows]) => (
        <div className="tb-rail__block" key={block}>
          <div className="tb-rail__blockname">
            {block.replace(/\.\s.*$/, ".")}{" "}
            <span>{block.replace(/^[A-Z]\.\s*/, "").replace(/[.,].*$/, "")}</span>
          </div>
          {rows.map((c) => {
            const { state, note } = railState(c, job);
            return (
              <div
                className="tb-rail__row"
                role="listitem"
                key={c.id}
                data-state={state}
                data-severity={c.severity}
              >
                <span className="tb-rail__id">{c.id}</span>
                <span className="tb-rail__caption">
                  {c.caption || c.check.replace(/\*\*/g, "")}
                </span>
                <span className="tb-rail__state">
                  {state === "pending" && "—"}
                  {state === "running" && (note || "running")}
                  {state === "pass" && (c.computed ? "pass · in code" : "pass")}
                  {state === "fail" && (c.computed ? "fail · in code" : "fail")}
                  {state === "unsure" && `unsure · ${note}`}
                  {state === "na" && "n/a"}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
