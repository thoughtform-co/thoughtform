import type { ReactNode } from "react";

import { LAB_CASE } from "./proofHighlightLabData";

/**
 * ProofHead — a lab-local mirror of the `#proof` masthead, so each direction is
 * judged in its real context (title left, lede right, on the editorial band).
 *
 * It re-renders the production CLASSES rather than injecting the production
 * MARKUP. Three reasons, in order of force:
 *
 *   1. `[data-m] { opacity: 0 }` is the reveal system's hidden state, and
 *      `useRevealMotion` is not mounted in labs — every element
 *      `buildProofStationHtml` emits carries a `data-m` role, so injected
 *      markup would render invisible. Nothing here carries one.
 *   2. The generator emits no placeholder inside the head, so seating a React
 *      direction into its grid would need a nested root — the exact portal
 *      pattern `.claude/rules/proof.md` forbids on this surface.
 *   3. The generator also emits the 200svh runway + three 100svh beats, none of
 *      which the lab wants.
 *
 * Copy comes from `PROOF_CASE`, so it cannot drift; only the class grammar is
 * mirrored, and that is a stable CSS contract (landing.css `/* PROOF *​/`).
 *
 * No `id="proof"` and no `.station` — the only id-keyed rules are the station
 * lock release and the corridor-exit cover, neither of which applies here.
 */

/**
 * Deterministic survey coordinate — FNV-1a, the same kernel
 * `lib/v7-parse/proofStation.ts` uses. Duplicated (not imported) because that
 * module is a server-side parse builder; pulling it into a client tree would
 * drag the parse pipeline along with it.
 */
function coordStamp(seed: string, salt: number): string {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const a = (h >>> 12) % 4096;
  const b = h % 4096;
  return `${String(a).padStart(4, "0")} / ${String(b).padStart(4, "0")}`;
}

export function ProofHead({ children }: { children: ReactNode }) {
  const { report } = LAB_CASE;
  const { title } = report;

  return (
    <header className="proof__report phl-head">
      <div className="proof__plate proof__plate--title">
        <span className="proof__grid" aria-hidden="true" />
        <span className="proof__mark proof__mark--origin" aria-hidden="true" />
        <span className="proof__desig">PRF / REPORT · 01</span>
        <span className="proof__coord">{coordStamp(LAB_CASE.slug, 1)}</span>
        <h2 className="proof__title">
          {title.pre ? <span className="proof__title-line">{title.pre}</span> : null}
          {title.em ? (
            <span className="proof__title-line proof__title-line--em">{title.em}</span>
          ) : null}
          {title.post ? <span className="proof__title-line">{title.post}</span> : null}
        </h2>
      </div>

      <div className="proof__plate proof__plate--brief">
        <span className="proof__grid" aria-hidden="true" />
        <span className="proof__mark proof__mark--close" aria-hidden="true" />
        <span className="proof__desig">PRF / BRIEF · 02</span>
        <span className="proof__coord">{coordStamp(LAB_CASE.slug, 2)}</span>
        <span className="proof__state">Live</span>
        <p className="proof__lede">{report.lede}</p>
      </div>

      <div className="phl-slot">{children}</div>
    </header>
  );
}
