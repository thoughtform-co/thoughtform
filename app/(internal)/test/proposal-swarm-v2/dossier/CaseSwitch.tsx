"use client";

import { useEffect } from "react";

import { CaseRun, type Run } from "./CaseRun";
import type { Head } from "./types";

/**
 * The cases, one after the other in a single scroll (owner, 2026-10-17: "when
 * you finish with Loop 1 client, you immediately scroll into the other one,
 * where the pattern and the gradient also change"). No row of client names
 * above them: each case's held column carries a quiet index of the three
 * beside its step dashes, and each case brings its own field.
 *
 * The case in view is in the address (`#case-samako`), which the browser
 * scrolls to by itself; the server's `?case=` opens on a case the same way.
 */
export function CaseSwitch({
  runs,
  initial,
  head,
  still,
}: {
  runs: readonly Run[];
  initial: string;
  /** The case head's type (`?head=`), read by the sheet. */
  head: Head;
  still: boolean;
}) {
  /* `?case=` names a case further down: open there, once */
  useEffect(() => {
    if (initial === runs[0]?.key || window.location.hash) return;
    document.getElementById(`case-${initial}`)?.scrollIntoView({ block: "start" });
  }, [initial, runs]);

  const index = runs.map((r) => ({ id: r.id, ordinal: r.ordinal, client: r.client }));
  return (
    <div className="csd" data-head={head} data-still={still ? "" : undefined}>
      {runs.map((run, i) => (
        <CaseRun key={run.key} run={run} index={index} place={i} />
      ))}
    </div>
  );
}
