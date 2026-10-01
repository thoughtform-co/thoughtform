import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/workshop-holo-lab — look-dev for the workshop's three live figures
 * (ADR-140): the stages, the curve and the spectrum, drawn by the production
 * leaves on the production record, with the material's dials on a form.
 *
 * ⚠ THE LAB IS A WINDOW ONTO PRODUCTION, NOT A COPY. It renders `ArcStages`,
 * `ArcCurve` and `ArcSpectrum` from `THOUGHTFORM_WORKSHOP_V2_ARC` inside an
 * `.arc-root`, so the mount, the canvas, the specs and the CSS are the page's
 * own; the only thing the lab adds is a `data-holo-dials` attribute the mount
 * reads. There is no second drawing to diverge, and the dependency runs lab →
 * production (`app/(internal)` is proxy-blocked in production).
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Workshop Holo Lab — the three figures, live (Internal)",
  description:
    "Look-dev for the workshop's framing figures as holograms: scan strength, the sweep, the agent's volume, side by side with the drawing.",
  robots: { index: false, follow: false },
};

export default function WorkshopHoloLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
