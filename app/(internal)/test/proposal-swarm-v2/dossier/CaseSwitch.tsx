"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { CaseRun, type Run } from "./CaseRun";

/* the address's hash, read as a store: "" on the server and while hydrating */
const onHash = (tell: () => void) => {
  window.addEventListener("hashchange", tell);
  return () => window.removeEventListener("hashchange", tell);
};
const hashNow = () => window.location.hash;
const hashOnServer = () => "";

/**
 * Which case is shown. One at a time, switched in place (owner, 2026-10-17:
 * "I think we also need a toggle somewhere, or a bar, that allows us to
 * switch between clients"), so the page is one case long and the reader
 * picks the next: from the client names at the top of the held column, from
 * "Next case" at the foot of each case, or (on a phone) from the bar.
 *
 * The case in view is in the address (`#case-samako`), so a link opens on it;
 * the server's `?case=` picks the first one shown.
 */
export function CaseSwitch({
  runs,
  initial,
  still,
}: {
  runs: readonly Run[];
  initial: string;
  still: boolean;
}) {
  /* a link to one case opens on it; a reader's pick outranks the link */
  const hash = useSyncExternalStore(onHash, hashNow, hashOnServer);
  const [chosen, setChosen] = useState<string | null>(null);
  const [moved, setMoved] = useState(0);
  const active = chosen ?? runs.find((r) => `#${r.id}` === hash)?.key ?? initial;

  /* after a switch, start the case from its piece */
  useEffect(() => {
    if (!moved) return;
    const el = document.getElementById(`case-${active}`);
    if (!el) return;
    const calm = still || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
  }, [moved, active, still]);

  const choose = (key: string) => {
    if (key === active) return;
    setChosen(key);
    setMoved((m) => m + 1);
    window.history.replaceState(null, "", `#case-${key}`);
  };

  const i = Math.max(
    0,
    runs.findIndex((r) => r.key === active)
  );
  const run = runs[i];
  const after = runs.length > 1 ? runs[(i + 1) % runs.length] : undefined;

  const clients = (
    <ol className="csd-clients" aria-label="The cases">
      {runs.map((r) => (
        <li key={r.key}>
          <button
            type="button"
            aria-pressed={r.key === active}
            data-on={r.key === active ? "" : undefined}
            onClick={() => choose(r.key)}
          >
            <span className="csd-clients__n">{r.ordinal}</span>
            <span className="csd-clients__name">{r.client}</span>
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="csd" data-still={still ? "" : undefined}>
      <div className="csd-switchbar">{clients}</div>
      <CaseRun
        key={run.key}
        run={run}
        clients={clients}
        next={after ? { run: after, go: () => choose(after.key) } : undefined}
        still={still}
      />
    </div>
  );
}
