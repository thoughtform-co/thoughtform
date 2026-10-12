"use client";

import { useState } from "react";

import { X_BIONIC_JOBS } from "@/lib/arcs/content/shared/jobs";

import type { Job } from "../proof-cards/parts";
import { DirectionI } from "../proof-cards/RoundSix";

type Skin = "flat" | "window" | "wash" | "glow" | "rule" | "inset";

/** Six skins on block 23, one per numbered block; `?job=1..4` sets the job. */
const BLOCKS: readonly { id: string; n: string; label: string; skin: Skin }[] = [
  { id: "flat", n: "1", label: "Flat (Tensorlake)", skin: "flat" },
  { id: "window", n: "2", label: "Window chrome (Hex)", skin: "window" },
  { id: "wash", n: "3", label: "Wash top and bottom", skin: "wash" },
  { id: "glow", n: "4", label: "Top glow (Lighthouse)", skin: "glow" },
  { id: "rule", n: "5", label: "Gold top rule (Hex)", skin: "rule" },
  { id: "inset", n: "6", label: "Double hairline (Hex)", skin: "inset" },
];

const JOBS = X_BIONIC_JOBS as readonly Job[];

export function CardSkinsShell({ initialJob }: { initialJob?: string }) {
  const n = Number(initialJob);
  const start = Number.isInteger(n) && n >= 1 && n <= JOBS.length ? n - 1 : 1;
  return (
    <div className="pk-root">
      {BLOCKS.map((b) => (
        <Block key={b.id} block={b} start={start} />
      ))}
      <nav className="pk-index" aria-label="Blocks on this page">
        {BLOCKS.map((b) => (
          <a key={b.id} href={`#${b.id}`} title={b.label}>
            <span>{b.n}</span>
            {b.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function Block({ block, start }: { block: (typeof BLOCKS)[number]; start: number }) {
  const [i, setI] = useState(start);
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
      <DirectionI job={JOBS[i]} ba={false} phases scale band refine="cards" skin={block.skin} />
    </section>
  );
}
