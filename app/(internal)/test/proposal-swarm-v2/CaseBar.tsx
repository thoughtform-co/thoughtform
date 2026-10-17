/* The lab's bar: which cut of the cases, which case, and the swarm's own
   switches carried along untouched. The switches are links; the page reads
   them on the server. It wears the swarm bar's sheet (`.psw-bar`). */

import type { Fly } from "../proposal-swarm/engine/flight";
import type { Mark } from "../proposal-swarm/engine/mark";
import { CASE_IDS } from "./dossier/cases";
import type { Cut } from "./dossier/types";

const CUTS: readonly Cut[] = ["short", "full"];

export function CaseBar({
  cut,
  only,
  fly,
  n,
  mark,
}: {
  cut: Cut;
  only?: string;
  fly: Fly;
  n?: number;
  mark: Mark;
}) {
  const href = (next: { cut?: Cut; only?: string | null }) => {
    const c = next.cut ?? cut;
    const o = next.only === null ? undefined : (next.only ?? only);
    const q = new URLSearchParams();
    if (c !== "short") q.set("cut", c);
    if (o) q.set("case", o);
    if (fly !== "fall") q.set("fly", fly);
    if (n) q.set("n", String(n));
    if (mark !== "engrave") q.set("mark", mark);
    const s = q.toString();
    return `${s ? `?${s}` : "?"}#cases`;
  };

  return (
    <nav className="psw-bar" aria-label="Proposal cases">
      <span className="psw-bar__title">The cases</span>
      <span className="psw-bar__set">
        <b>Cut</b>
        {CUTS.map((c) => (
          <a key={c} href={href({ cut: c })} data-on={c === cut ? "" : undefined}>
            {c}
          </a>
        ))}
      </span>
      <span className="psw-bar__set">
        <b>Case</b>
        <a href={href({ only: null })} data-on={only ? undefined : ""}>
          all
        </a>
        {CASE_IDS.map((id) => (
          <a key={id} href={href({ only: id })} data-on={id === only ? "" : undefined}>
            {id}
          </a>
        ))}
      </span>
      <output id="psw-fact" />
    </nav>
  );
}
