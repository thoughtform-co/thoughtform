import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/workshop-holo-lab — look-dev for the workshop's three live figures
 * (ADR-140): the stages, the curve and the spectrum as hologram DIRECTIONS,
 * each a pure spec (`components/holo-stage/directions/**`) painted by the
 * production canvas, with the material's dials on a form.
 *
 * ⚠ THE LAB IS A WINDOW ONTO PRODUCTION, NOT A COPY. It mounts
 * `HoloStageCanvas` — the page's own renderer, post chain and palette —
 * through the same lazy seam the page uses; what it adds is the dials and the
 * DOM seats for each direction's words. The dependency runs lab → production
 * (`app/(internal)` is proxy-blocked in production). Once the owner picks, the
 * picked direction becomes the kind's spec on the page and this lab keeps the
 * comparison.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by the
 * parent `(internal)/test` layout.
 */
export const metadata: Metadata = {
  title: "Workshop Holo Lab — the three figures, live (Internal)",
  description:
    "Look-dev for the workshop's framing figures as holograms: the instrument plates, the life dial, the post chain, side by side with the earlier rounds.",
  robots: { index: false, follow: false },
};

export default function WorkshopHoloLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
