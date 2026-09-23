import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/musings-row — the musings row's look-dev host (ADR-121).
 *
 * The landing has three real posts and the row is designed for five; the site
 * is live, so placeholder copy may never enter `content/musings/`. This route
 * mounts the PRODUCTION station — `MusingsStation`, its writer and its sheet,
 * nothing re-drawn — inside the real HUD frame with seven placeholder records,
 * `?n=3|5|7` to pick the count and `?theme=light` for parchment. It is a window
 * onto production, not a copy (the substrate lab's law): if the row changes,
 * the lab changes with it, and nothing here can drift on its own.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Musings row · Thoughtform",
  robots: { index: false, follow: false },
};

export default function MusingsRowLabLayout({ children }: { children: ReactNode }) {
  return children;
}
