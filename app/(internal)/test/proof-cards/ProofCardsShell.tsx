"use client";

import { useState } from "react";

import { X_BIONIC_JOBS } from "@/lib/arcs/content/shared/jobs";

import { DirectionA, DirectionB, DirectionC, DirectionD } from "./Directions";
import type { Job } from "./parts";

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
