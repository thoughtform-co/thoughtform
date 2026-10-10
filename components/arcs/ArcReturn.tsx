import type { CSSProperties } from "react";

import type { ArcJobResult, ArcJobTally } from "@/lib/arcs/types";

/** Chrome, never content: the return column's label. */
export const RESULT_LABEL = "The return";

/**
 * ArcReturn — what a piece of work returned (ADR-153 U3), as ONE block the
 * page draws wherever a return is lettered: a job's right column and, since
 * the proposal system (2026-10-10), each row of Loop's return. One number,
 * large and neutral; one line a decision maker reads; the count drawn under
 * it in the gold's tints when it is a count (Tensorlake's bar codes: the
 * gold is the data). The value's length rides the column (`--case-len`), so
 * the number is as large as the column allows.
 *
 * ⚠ SERVER, NO STATE, DOM ONLY. The classes are the job's (`.arc-case__*`)
 * because the job drew it first; the crew's returns layout reads them too.
 */
export function ArcReturn({
  result,
  label = RESULT_LABEL,
  className = "",
}: {
  result: ArcJobResult;
  label?: string;
  className?: string;
}) {
  return (
    <section
      className={`arc-case__result ${className}`.trim()}
      aria-label={label}
      style={{ "--case-len": result.value.length } as CSSProperties}
    >
      <p className="arc-case__result-label">{label}</p>
      <div className="arc-case__result-body">
        <p className="arc-case__num">{result.value}</p>
        <p className="arc-case__result-line">{result.line}</p>
        {result.tally ? <Tally groups={result.tally} /> : null}
      </div>
    </section>
  );
}

/** A count as Tensorlake draws one: segments, the counted ones in gold. Each
 *  group's width follows its count, so a segment is one width across groups. */
export function Tally({ groups }: { groups: readonly ArcJobTally[] }) {
  return (
    <span className="arc-case__tally" aria-hidden="true">
      {groups.map((g, gi) => (
        <span
          key={gi}
          className="arc-case__tally-group"
          data-job-dim={g.dim ? "" : undefined}
          style={{ "--case-of": g.of } as CSSProperties}
        >
          {Array.from({ length: g.of }, (_, i) => (
            <i key={i} data-job-lit={i < g.lit ? "" : undefined} />
          ))}
        </span>
      ))}
    </span>
  );
}
