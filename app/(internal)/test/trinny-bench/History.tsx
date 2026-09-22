"use client";

import type { HistoryRow } from "./types";
import { VERDICT_WORDS } from "./types";

const img = (p: string) => `/api/trinny-bench/img?p=${encodeURIComponent(p)}`;

/** The session so far: every finished job as a thumbnail with its verdict.
 *  Click one to put it back on the stage without re-running anything. */
export function History({
  rows,
  currentId,
  onPick,
}: {
  rows: HistoryRow[];
  currentId: string | null;
  onPick: (id: string) => void;
}) {
  const done = rows.filter((r) => r.status === "done" && r.file);
  if (done.length === 0) return null;
  return (
    <div className="tb-history">
      <div className="tb-history__head">This session · {done.length} graded</div>
      <div className="tb-history__strip">
        {done.map((r) => (
          <button
            type="button"
            key={r.id}
            className="tb-history__item"
            data-verdict={r.verdict ?? ""}
            data-current={r.id === currentId ? "1" : undefined}
            onClick={() => onPick(r.id)}
            title={`${r.subject} · ${r.type} · ${r.verdict ?? ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Drive files through a guarded route */}
            <img src={img(r.file!)} alt="" loading="lazy" />
            <span className="tb-history__verdict">
              {VERDICT_WORDS[r.verdict ?? ""] ?? r.verdict}
            </span>
            <span className="tb-history__meta">
              {r.origin === "upload" ? "dropped" : "drawn"} · {r.subject}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
