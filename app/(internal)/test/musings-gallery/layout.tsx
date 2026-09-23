import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/musings-gallery — directions for what sits under the musings head.
 *
 * The PRODUCTION station — its head, pinned stage, decode and arrival — with a
 * direction mounted in its `gallery` slot, inside the real HUD frame. `?v=`
 * picks the direction (`v0` is the shipped row), `?src=live|lab` the three
 * real notes or the seven placeholders, `?n=3|5|7` how many placeholders, and
 * `?theme=light` parchment. Internal-only: `proxy.ts` blocks `/test/*` in
 * production.
 */
export const metadata: Metadata = {
  title: "Musings gallery · Thoughtform",
  robots: { index: false, follow: false },
};

export default function MusingsGalleryLabLayout({ children }: { children: ReactNode }) {
  return children;
}
