import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/card-skins: the proof card (block 23 of /test/proof-cards) in six
 * gradient and border skins, on a page of its own (owner, 2026-10-12: the
 * proof-cards page is full). Internal-only: `proxy.ts` blocks `/test/*`.
 */
export const metadata: Metadata = {
  title: "Card skins · Thoughtform",
  robots: { index: false, follow: false },
};

export default function CardSkinsLayout({ children }: { children: ReactNode }) {
  return children;
}
