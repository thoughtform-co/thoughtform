import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/services-card-face-lab â€” internal look-dev for the #services CARD
 * CONTENT, not its geometry.
 *
 * The problem (owner, 2026-07-25): the ring is beautiful and the copy is in
 * voice, but the section is hard to parse. Each card bakes FIVE content
 * elements over a full-bleed photo â€” gold chip, includes row, title, lede,
 * CTA â€” so a reader meets two headline-weight labels (the chip names the
 * product, the title makes a benefit claim) and a poster and a spec sheet
 * mashed into one object. Meanwhile the surface publishes nothing a buyer can
 * self-qualify against, while the proposals lead with exactly that.
 *
 * Three routes, judged against the real instrument:
 *   v0  the shipped bake â€” the reference we are trying to beat
 *   v1  TIGHT face: chip + title + an OPEN tick, nothing else
 *   v2  tight face + the DOM spec plate that grows from the card's own rect
 *
 * This lab is a fork of `/test/services-anchor-lab`, and it inherits that
 * lab's camera CALIBRATION against the live corridor's published hit rects â€”
 * that is the whole reason its card geometry matches production. Do not
 * re-derive it from the orbit lab's flat camera, which parks the same cards
 * ~14% higher and ~13% smaller.
 *
 * Blocked from production by `proxy.ts` and `noindex`; auth handled by
 * the parent `(internal)/test` layout. Best viewed â‰¥1101Ã—760.
 */
export const metadata: Metadata = {
  title: "Services Card Face Lab â€” Tight Face + Spec Plate (Internal)",
  description:
    "Rest-face copy variants and the expand-to-spec open plate for the #services card ring.",
  robots: { index: false, follow: false },
};

export default function ServicesCardFaceLabLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
