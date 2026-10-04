import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * /test/hero-kv-lab — the live hero, with the key visual swappable.
 *
 * The owner's ask (2026-10-04): "wire up a test page … for the hero section,
 * with an easy way for me to switch between the key visuals. Prepare the key
 * visuals so the text is nicely positioned, because I want to see how it
 * looks." The hero markup, its overlay and its copy are the production ones,
 * sliced off the v7 prototype; only the plate changes, framed per plate by
 * `kvs.ts`.
 *
 * ⚠ THE PLATES ARE LOCAL. They live in the gitignored `public/_previews/`;
 * run `node scripts/hero-kv-lab/prepare.mjs` once on a machine that has the
 * Drive mounted. A missing plate says so on screen.
 *
 * Internal-only: `proxy.ts` blocks `/test/*` in production.
 */
export const metadata: Metadata = {
  title: "Hero key visual lab · Thoughtform",
  robots: { index: false, follow: false },
};

export default function HeroKvLabLayout({ children }: { children: ReactNode }) {
  return children;
}
