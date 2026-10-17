/* The lab's bar: which cut of the cases and which case head (the type
   options, while the owner picks), with the swarm's own switches carried
   along untouched. Which case is shown is the dossier's own switch, not the
   bar's. The switches are links; the page reads them on the server.
   It wears the swarm bar's sheet (`.psw-bar`). */

import type { Fly } from "../proposal-swarm/engine/flight";
import type { Mark } from "../proposal-swarm/engine/mark";
import { HEAD_DEFAULT, HEADS } from "./dossier/story";
import type { Cut, Head } from "./dossier/types";

const CUTS: readonly Cut[] = ["short", "full"];

export function CaseBar({
  cut,
  head,
  fly,
  n,
  mark,
}: {
  cut: Cut;
  head: Head;
  fly: Fly;
  n?: number;
  mark: Mark;
}) {
  const href = (c: Cut, h: Head = head) => {
    const q = new URLSearchParams();
    if (c !== "short") q.set("cut", c);
    if (h !== HEAD_DEFAULT) q.set("head", h);
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
      <span className="psw-bar__set">
        <b>Head</b>
        {HEADS.map((h) => (
          <a key={h} href={href(cut, h)} data-on={h === head ? "" : undefined}>
            {h}
          </a>
        ))}
      </span>
      <output id="psw-fact" />
    </nav>
  );
}
