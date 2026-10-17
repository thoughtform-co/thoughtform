/* The lab's bar: which cut of the cases, with the swarm's own switches
   carried along untouched. Which case is shown is the dossier's own switch,
   not the bar's. The switches are links; the page reads them on the server.
   It wears the swarm bar's sheet (`.psw-bar`). */

import type { Fly } from "../proposal-swarm/engine/flight";
import type { Mark } from "../proposal-swarm/engine/mark";
import type { Cut } from "./dossier/types";

const CUTS: readonly Cut[] = ["short", "full"];

export function CaseBar({ cut, fly, n, mark }: { cut: Cut; fly: Fly; n?: number; mark: Mark }) {
  const href = (c: Cut) => {
    const q = new URLSearchParams();
    if (c !== "short") q.set("cut", c);
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
          <a key={c} href={href(c)} data-on={c === cut ? "" : undefined}>
            {c}
          </a>
        ))}
      </span>
      <output id="psw-fact" />
    </nav>
  );
}
