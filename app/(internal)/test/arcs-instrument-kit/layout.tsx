import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/arcs-instrument-kit — the arcs instrument on fixtures (ADR-118).
 *
 * The monitor and the log over a record the real one does not hold yet: a
 * client with three engagements and one still running, two engagements filed
 * on one day on one lane, a relationship older than the window, a row the
 * filter can hide. `NOW` is pinned, so a still of this page is the same still
 * on every day it is shot. It is the eval's type `AK`; `?fake=even` and
 * `?fake=fills` draw the two cheapest fakes the rubric's M and L blocks are
 * written against.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Arcs instrument kit · Thoughtform",
  robots: { index: false, follow: false },
};

export default function ArcsInstrumentKitLayout({ children }: { children: ReactNode }) {
  return children;
}
