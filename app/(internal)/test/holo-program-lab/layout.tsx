import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/holo-program-lab — look-dev for the portfolio's TRAJECTORY beat as a
 * holographic instrument.
 *
 * The flat board (`ArcProgramBoard`) plots the engagement on a dated axis in
 * DOM: a graticule, seven stations, an adoption step ladder. This route asks
 * whether the same record reads better as a held instrument — coaxial rings
 * on one time axis receding into depth, a ring's radius carrying the adoption
 * reach at its date.
 *
 * ⚠ THE LAB IS A WINDOW ONTO PRODUCTION, NOT A COPY. It mounts the real
 * `HoloProgramCanvas` fed by the real `PORTFOLIO_ARC` waypoints, so there is
 * no second drawing to diverge and no fixture whose numbers can drift from
 * the record. The dependency runs lab → production and may never reverse
 * (`app/(internal)` is proxy-blocked in production).
 *
 * ⚠ AND IT MEASURES RATHER THAN LOOKS. The readout walks live frame cost,
 * draw calls and — the check nothing else on this surface makes — whether any
 * ring's projected rim collides with the DOM station rects that have to sit
 * over it. A drawing that looks right at one aspect and swims out from under
 * its own labels at another is the failure this route exists to catch.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Holo Program Lab — the trajectory as an instrument (Internal)",
  description:
    "Look-dev for the portfolio arc's trajectory beat: the dated record drawn as a holographic ring stack, at the three reference band shapes.",
  robots: { index: false, follow: false },
};

export default function HoloProgramLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
