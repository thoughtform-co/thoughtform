import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/services-workstreams — the services ring re-cut as the three creative
 * workstreams a marketing team runs (production · operations · review),
 * landing on the intelligence configuration under all three (owner,
 * 2026-10-08: the embedded model is what is sold, and the work for Loop, Suri
 * and Samako is what proves it).
 *
 * A fork of `/test/services-card-face-lab`: the real ring, the real particle
 * mark and orbits, the real masthead and hit layer, on that lab's calibrated
 * camera. What is new is the record (`lib/services-workstreams/`) and three
 * card faces that differ in WHAT IS DRAWN; a card opens in place, through the
 * ring's own drawer.
 */
export const metadata: Metadata = {
  title: "Services as Workstreams (Internal)",
  description:
    "The services ring as creative production, operations and review, landing on the intelligence configuration.",
  robots: { index: false, follow: false },
};

export default function ServicesWorkstreamsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
