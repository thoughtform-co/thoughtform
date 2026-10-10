import type { Metadata } from "next";

import { FLOW_OPTIONS, FLOW_ORDER, isFlowOptionId } from "@/components/adoption-flow/options";
import { FLOW_RUNS, FLOW_SHAPES, FLOW_SKILLS, FLOW_WORKS } from "@/lib/adoption-flow/record";

import { FlowLabMount } from "./FlowLabMount";

import "./adoption-flow-lab.css";

export const metadata: Metadata = {
  title: "Adoption Flow Lab — four options (Internal)",
  description:
    "Look-dev: the adoption → automation flow as an abstract holographic object, four directions on one record (the Loop casefile).",
  robots: { index: false, follow: false },
};

/**
 * /test/adoption-flow-lab — four options for drawing the adoption →
 * automation flow in the equilibrium's holographic grammar (ADR-080,
 * ADR-143 U8), one at a time. Every count is the Loop casefile's, read
 * through `lib/adoption-flow/record.ts`.
 *
 * ⚠ THE SWITCH IS A FULL LOAD (plain links): one WebGL context at a time.
 */
export default async function AdoptionFlowLab({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; theme?: string }>;
}) {
  const { v, theme } = await searchParams;
  const option = isFlowOptionId(v) ? v : "axis";
  const mode = theme === "light" ? "light" : "dark";
  const def = FLOW_OPTIONS[option];
  const q = (id: string, light: boolean) => `?v=${id}${light ? "&theme=light" : ""}`;

  return (
    <main
      className="afl"
      data-mode={mode}
      style={{ background: mode === "light" ? "#ece3d6" : "#0a0908" }}
    >
      <FlowLabMount option={option} mode={mode} />

      <nav className="afl-bar" aria-label="Options">
        <span className="afl-bar__title">Adoption → automation</span>
        {FLOW_ORDER.map((id) => (
          <a
            key={id}
            className="afl-bar__tab"
            href={q(id, mode === "light")}
            aria-current={id === option ? "page" : undefined}
          >
            {FLOW_OPTIONS[id].letter} · {FLOW_OPTIONS[id].title}
          </a>
        ))}
        <a className="afl-bar__tab" href={q(option, mode !== "light")}>
          {mode === "light" ? "Dark" : "Light"}
        </a>
      </nav>

      <section className="afl-read">
        <p className="afl-read__kicker">
          Option {def.letter} · after {def.after}
        </p>
        <h1 className="afl-read__title">{def.title}</h1>
        <p className="afl-read__body">{def.reads}</p>
        <p className="afl-read__record">
          The record · {FLOW_WORKS} streams · {FLOW_SKILLS} Skills in {FLOW_SHAPES.length} shapes ·{" "}
          {FLOW_RUNS.prompt} prompt · {FLOW_RUNS.tool} tool · {FLOW_RUNS.agent} agent ·{" "}
          {FLOW_RUNS.hand} by hand. Distances and heights are illustrative.
        </p>
      </section>
    </main>
  );
}
