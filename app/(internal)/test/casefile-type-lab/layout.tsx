import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/casefile-type-lab — internal look-dev for the casefile's TYPE.
 *
 * The owner added Alte Haas Grotesk (the Alien: Romulus title face) and asked
 * to see it in place of PP Neue Montreal on the second section's left column.
 * This lab is the safe place to judge that: it mounts the REAL
 * `ServicesCasefile` against the REAL parse-injected HUD rail, parked at its
 * end state, with one lab-owned switch that re-points the SANS ROLE.
 *
 * ⚠ IT DOES NOT FORK THE CASEFILE. `/test/field-log-lab` did, and
 * `.claude/rules/proof.md` now has to warn that it is "a STALE FORK on the
 * pre-U11 geometry" whose `--fl-t*` block must not be read as the contract.
 * A type study that copies the component cannot answer a type question about
 * the component, so this one imports it.
 *
 * ⚠ THE HUD IS NOT DECORATION HERE. The casefile's whole geometry snaps to
 * `.hud__rail`'s live box — `--fl-t1`, `--fl-t6`, `--fl-sec`, the brief's
 * height and the register's seam all derive from it. Without the real rail
 * the boxes resolve against nothing and every clipping judgement is wrong.
 *
 * ⚠ THE SWAP IS THE SANS ROLE ONLY. Alte Haas Grotesk is a proportional
 * sans, and the left column's directory rows, register claims and class line
 * are PT Mono because they are instrument chrome whose widths are measured
 * (ADR-067). Swapping those to a proportional face would not be a type study,
 * it would be a different instrument.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout. Best viewed ≥1280×720.
 */
export const metadata: Metadata = {
  title: "Casefile Type Lab — Alte Haas Grotesk (Internal)",
  description: "Swapping the casefile's sans role to Alte Haas Grotesk, against the real HUD rail.",
  robots: { index: false, follow: false },
};

export default function CasefileTypeLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
