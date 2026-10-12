"use client";

import { useState } from "react";

import { X_BIONIC_JOBS } from "@/lib/arcs/content/shared/jobs";

import {
  DirectionA,
  DirectionB,
  DirectionC,
  DirectionD,
  DirectionE,
  DirectionF,
} from "./Directions";
import type { Job } from "./parts";
import { DirectionG } from "./RoundFour";
import { DirectionH } from "./RoundFive";
import { DirectionI } from "./RoundSix";
import { DirectionJ } from "./RoundSeven";

/**
 * /test/proof-cards: the four Suri and Samako jobs, one direction per
 * numbered block. Each block has its own job picker; `?job=1..4` sets the
 * starting job for every block, so a still can name both.
 */
export const BLOCKS = [
  { id: "a-window", n: "1", short: "Window", label: "A · Window", C: DirectionA },
  { id: "b-extract", n: "2", short: "Extract", label: "B · Extract", C: DirectionB },
  { id: "c-stack", n: "3", short: "Stack", label: "C · Stack", C: DirectionC },
  { id: "d-spec", n: "4", short: "Spec", label: "D · Spec", C: DirectionD },
  /* round two, on 3C: three ways to draw the time saved in practice */
  {
    id: "e1-chain",
    n: "5",
    short: "C2 Chain",
    label: "C2 · Chain",
    C: ({ job }: { job: Job }) => <DirectionE job={job} viz="chain" />,
  },
  {
    id: "e2-bars",
    n: "6",
    short: "C2 Bars",
    label: "C2 · Bars",
    C: ({ job }: { job: Job }) => <DirectionE job={job} viz="bars" />,
  },
  {
    id: "e3-split",
    n: "7",
    short: "C2 Split",
    label: "C2 · Before and now",
    C: ({ job }: { job: Job }) => <DirectionE job={job} viz="split" />,
  },
  /* round three: the top bar back, the brief as the problem, the bars */
  {
    id: "f1-asked",
    n: "8",
    short: "C3",
    label: "C3 · Embed, empower, then Claude",
    C: ({ job }: { job: Job }) => <DirectionF job={job} order="asked" />,
  },
  {
    id: "f2-handover",
    n: "9",
    short: "C3 hand",
    label: "C3 · Empower last, as the handover",
    C: ({ job }: { job: Job }) => <DirectionF job={job} order="handover" />,
  },
  /* round four, on 9: recentred, the top bar in caps, then the words left */
  {
    id: "g1-mid",
    n: "10",
    short: "C4",
    label: "C4 · 9, recentred",
    C: ({ job }: { job: Job }) => <DirectionG job={job} layout="mid" />,
  },
  {
    id: "g2-left",
    n: "11",
    short: "C4 left",
    label: "C4 · Words left, wide visual",
    C: ({ job }: { job: Job }) => <DirectionG job={job} layout="left" />,
  },
  {
    id: "g3-ba",
    n: "12",
    short: "C4 B/A",
    label: "C4 · Words left, before and after",
    C: ({ job }: { job: Job }) => <DirectionG job={job} layout="left-ba" />,
  },
  /* round five: 3C rebuilt with only the named changes */
  { id: "h-stack", n: "13", short: "C5", label: "C5 · 3C, rebuilt", C: DirectionH },
  /* round six: 12's layout harmonised with 3C */
  { id: "i-left", n: "14", short: "C6", label: "C6 · 12 on 3C", C: DirectionI },
  /* round six U2: one visual, the left column at 55, 60 and 65 % */
  {
    id: "i55",
    n: "15",
    short: "C6 55",
    label: "C6 · One visual, left 55%, three moves",
    C: ({ job }: { job: Job }) => <DirectionI job={job} ba={false} left="55%" phases />,
  },
  {
    id: "i60",
    n: "16",
    short: "C6 60",
    label: "C6 · One visual, left 60%",
    C: ({ job }: { job: Job }) => <DirectionI job={job} ba={false} left="60%" />,
  },
  {
    id: "i65",
    n: "17",
    short: "C6 65",
    label: "C6 · One visual, left 65%",
    C: ({ job }: { job: Job }) => <DirectionI job={job} ba={false} left="65%" />,
  },
  /* round seven: 15, pinned, one step open at a time */
  { id: "j-pin", n: "18", short: "C7 pin", label: "C7 · 15, pinned scroll-through", C: DirectionJ },
  /* round seven U1: 18 with every step open, Scale as code, smaller copy */
  {
    id: "k-open",
    n: "19",
    short: "C7 open",
    label: "C7 · All open, Scale as code",
    C: ({ job }: { job: Job }) => <DirectionI job={job} ba={false} left="55%" phases scale />,
  },
  /* round seven U2: the visual in the centre */
  {
    id: "l-center",
    n: "20",
    short: "C7 centre",
    label: "C7 · Visual in the centre",
    C: ({ job }: { job: Job }) => <DirectionI job={job} ba={false} phases scale center />,
  },
] as const;

const JOBS = X_BIONIC_JOBS as readonly Job[];

function startIndex(job?: string) {
  const n = Number(job);
  return Number.isInteger(n) && n >= 1 && n <= JOBS.length ? n - 1 : 1;
}

export function ProofCardsShell({ initialJob }: { initialJob?: string }) {
  const start = startIndex(initialJob);
  return (
    <div className="pk-root">
      {BLOCKS.map((b) => (
        <Block key={b.id} block={b} start={start} />
      ))}
      <nav className="pk-index" aria-label="Blocks on this page">
        {BLOCKS.map((b) => (
          <a key={b.id} href={`#${b.id}`} title={b.label}>
            <span>{b.n}</span>
            {b.short}
          </a>
        ))}
      </nav>
    </div>
  );
}

function Block({ block, start }: { block: (typeof BLOCKS)[number]; start: number }) {
  const [i, setI] = useState(start);
  const job = JOBS[i];
  const C = block.C;
  return (
    <section className="pk-stage" id={block.id}>
      <i className="pk-rail pk-rail--l" aria-hidden="true" />
      <i className="pk-rail pk-rail--r" aria-hidden="true" />
      <p className="pk-tag">
        {block.n} · {block.label}
      </p>
      <div className="pk-pick" role="tablist" aria-label="Job">
        {JOBS.map((j, k) => (
          <button
            key={j.id}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => setI(k)}
          >
            {j.menuLabel}
          </button>
        ))}
      </div>
      <C job={job} />
    </section>
  );
}
