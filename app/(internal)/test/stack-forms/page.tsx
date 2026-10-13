import { isFormId } from "./forms";
import { StackFormsShell } from "./StackFormsShell";

/* This lab's own sheets and nothing of the site's: its tokens, its type and
   one sheet a direction, each under its own class prefix. */
import "./stack-forms.css";
import "./wire/wire.css";
import "./print/print.css";
import "./readout/readout.css";
import "./swarm/swarm.css";
import "./phosphor/phosphor.css";

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Drawings of the three-plate stack: five directions, and the iterations on
 * three of them (an iteration's id is its direction's with a letter).
 *
 *   ?v=wire|wire-b|print|readout|swarm|swarm-b|swarm-c|phosphor|phosphor-b
 *                                          one drawing alone
 *   ?open=0..1                             the pose (0 closed, 1 opened; default 0.5)
 *   ?still=1                               no chrome, no motion (the capture's)
 */
export default async function StackFormsRoute({ searchParams }: { searchParams: Promise<Query> }) {
  const q = await searchParams;
  const v = one(q.v);
  const o = Number(one(q.open));
  return (
    <StackFormsShell
      only={isFormId(v) ? v : null}
      open0={Number.isFinite(o) && one(q.open) !== undefined ? Math.min(1, Math.max(0, o)) : 0.5}
      still={one(q.still) === "1"}
    />
  );
}
