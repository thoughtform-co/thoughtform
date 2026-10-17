"use client";

import { type CSSProperties, useEffect, useState, useSyncExternalStore } from "react";

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
 * picks the next: from the row of client names above the case, or from
 * "Next case" at the foot of each case.
 *
 * The case in view is in the address (`#case-samako`), so a link opens on it;
 * the server's `?case=` picks the first one shown.
 */
export function CaseSwitch({
  runs,
  tints,
  initial,
  still,
}: {
  runs: readonly Run[];
  /** Each case's colour for the field behind it (rgb triples). */
  tints: Readonly<Record<string, { dots: string; glow: string }>>;
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
    /* the row of clients, so the case starts with its name in view */
    const run = document.getElementById(`case-${active}`);
    const el = run?.parentElement?.querySelector(".csd-switchbar") ?? run;
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

  /* the clients sit above the case, outside the held column, so the column
     stays the Loop story's one group; on a phone the row is held at the top.
     Behind it all, the client's field: a gradient of particles in its colour,
     held to the screen while the case scrolls (owner, 2026-10-17: "slightly
     changed the background color using a gradient particle system to match
     the client … That way it doesn't feel like too much of the same"). */
  const tint = tints[run.key];
  return (
    <div className="csd" data-still={still ? "" : undefined}>
      <div
        key={`field-${run.key}`}
        className="csd-field-bg"
        aria-hidden="true"
        style={
          tint
            ? ({ "--tint-dots": tint.dots, "--tint-glow": tint.glow } as CSSProperties)
            : undefined
        }
      />
      <div className="csd-switchbar">{clients}</div>
      <CaseRun
        key={run.key}
        run={run}
        next={after ? { run: after, go: () => choose(after.key) } : undefined}
      />
    </div>
  );
}
