import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/trinny-bench — the Trinny London brand bench (ADR-120).
 *
 * Internal-only: `proxy.ts` 404s `/test/*` in production, and every
 * `/api/trinny-bench/*` route refuses outside development on its own.
 */
export const metadata: Metadata = {
  title: "Trinny London · brand bench",
  robots: { index: false, follow: false },
};

export default function TrinnyBenchLayout({ children }: { children: ReactNode }) {
  return children;
}
